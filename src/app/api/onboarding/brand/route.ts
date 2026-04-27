import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { toIndustryKey } from '@/lib/intelligence/industry-key'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const brandName = String(body.brandName || '').trim()
    const phone = String(body.phone || '').trim()
    const email = String(body.email || '').trim()
    const storeType = body.storeType ? String(body.storeType) : null
    const sizeRanges = Array.isArray(body.sizeRanges) ? (body.sizeRanges as string[]) : []
    const budgetMin = body.budgetMin != null ? parseFloat(String(body.budgetMin)) : null
    const budgetMax = body.budgetMax != null ? parseFloat(String(body.budgetMax)) : null
    const targetAudience = body.targetAudience ? String(body.targetAudience) : null
    const preferredLocations = body.preferredLocations ? String(body.preferredLocations) : null
    const additionalRequirements = body.additionalRequirements
      ? String(body.additionalRequirements)
      : null
    const sessionId = body.sessionId ? String(body.sessionId) : null

    if (!brandName || !phone) {
      return NextResponse.json(
        { success: false, error: 'Brand name and phone are required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      )
    }

    const normalizedEmail =
      email || `brand-${phone}-${Date.now()}@placeholder.lokazen.com`

    // Parse locations into array
    const locationsArray = preferredLocations
      ? preferredLocations
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean)
      : []

    // Parse size ranges → min/max sqft
    let minSize: number | null = null
    let maxSize: number | null = null
    if (sizeRanges.length > 0) {
      let globalMin = Number.MAX_SAFE_INTEGER
      let globalMax = 0
      for (const range of sizeRanges) {
        if (range.includes('-')) {
          const [lo, hi] = range.split('-')
          const loNum = parseInt(lo.replace(/[^0-9]/g, '')) || 0
          const hiNum = parseInt(hi.replace(/[^0-9]/g, '')) || 0
          globalMin = Math.min(globalMin, loNum)
          globalMax = Math.max(globalMax, hiNum)
        } else if (range.includes('+')) {
          const lo = parseInt(range.replace(/[^0-9]/g, '')) || 0
          globalMin = Math.min(globalMin, lo)
          globalMax = Math.max(globalMax, 100000)
        }
      }
      if (globalMin !== Number.MAX_SAFE_INTEGER) minSize = globalMin
      if (globalMax > 0) maxSize = globalMax
    }

    // ── 1. Find or create brand User ────────────────────────────────────────
    let userId: string

    const byPhone = await prisma.user.findFirst({
      where: { phone, userType: 'brand' },
      select: { id: true },
    })

    if (byPhone) {
      userId = byPhone.id
    } else {
      const isPlaceholderEmail = normalizedEmail.includes('@placeholder.lokazen.com')
      const byEmail = isPlaceholderEmail
        ? null
        : await prisma.user.findFirst({
            where: { email: normalizedEmail, userType: 'brand' },
            select: { id: true },
          })

      if (byEmail) {
        userId = byEmail.id
      } else {
        const uniqueEmail = isPlaceholderEmail
          ? `brand-${phone}-${Date.now()}@placeholder.lokazen.com`
          : normalizedEmail

        const tempPassword = await bcrypt.hash(
          `brand_${phone}_${Date.now()}`,
          10
        )

        const created = await prisma.user.create({
          data: {
            name: brandName,
            email: uniqueEmail,
            password: tempPassword,
            phone,
            userType: 'brand',
          },
          select: { id: true },
        })
        userId = created.id
      }
    }

    // ── 2. Upsert brand_profile ──────────────────────────────────────────────
    await prisma.brand_profiles.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        company_name: brandName,
        industry: storeType,
        category: storeType,
        preferred_locations: locationsArray.length > 0 ? locationsArray : undefined,
        budget_min: budgetMin,
        budget_max: budgetMax,
        min_size: minSize,
        max_size: maxSize,
      },
      update: {
        company_name: brandName,
        industry: storeType ?? undefined,
        category: storeType ?? undefined,
        preferred_locations: locationsArray.length > 0 ? locationsArray : undefined,
        budget_min: budgetMin ?? undefined,
        budget_max: budgetMax ?? undefined,
        min_size: minSize ?? undefined,
        max_size: maxSize ?? undefined,
        updated_at: new Date(),
      },
    })

    // ── 3. Save onboarding session (best-effort) ─────────────────────────────
    try {
      await prisma.$executeRaw`
        INSERT INTO brand_onboarding_sessions (id, user_id, filter_step, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${userId},
          ${JSON.stringify({
            brandName,
            storeType,
            sizeRanges,
            budgetMin,
            budgetMax,
            targetAudience,
            preferredLocations,
            additionalRequirements,
            sessionId,
          })}::jsonb,
          now(),
          now()
        )
        ON CONFLICT DO NOTHING
      `
    } catch (sessionErr) {
      console.warn('[Brand Onboarding API] Could not save session row:', sessionErr)
    }

    const industryKey = toIndustryKey(storeType)
    const topMatches = await prisma.property
      .findMany({
        where: { status: 'approved', availability: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true },
      })
      .catch(() => [] as { id: string }[])

    const appBase =
      (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')) ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const adminSecret = process.env.ADMIN_SECRET
    if (adminSecret) {
      for (const p of topMatches) {
        void fetch(`${appBase}/api/intelligence/synthesize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminSecret}`,
          },
          body: JSON.stringify({ propertyId: p.id, industryKey }),
        }).catch((e) => console.error('[Brand Onboarding] synthesis warm failed', p.id, e))
      }
    }

    return NextResponse.json({ success: true, userId, brandName })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to save brand onboarding'
    console.error('[Brand Onboarding API] Error:', error)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
