import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendLeadCreationWebhook } from '@/lib/pabbly-webhook'

/* TODO: Add auth when brand registration enabled
import { getAuthenticatedUser } from '@/lib/api-auth'
*/

export async function POST(req: Request) {
  try {
    /* TODO: Add auth when brand registration enabled
    // Check authentication
    // Note: Change req parameter type to NextRequest when enabling auth
    // const user = await getAuthenticatedUser(req as NextRequest)
    // if (!user || user.userType !== 'brand') {
    //   return NextResponse.json(
    //     { success: false, error: 'Authentication required' },
    //     { status: 401 }
    //   )
    // }
    */
    const { name, email, phone, sessionData } = await req.json()

    console.log('[LEADS][CREATE] Incoming payload:', {
      name,
      email,
      phone,
      hasSessionData: !!sessionData,
    })

    // Extract anon_id from sessionData if available
    const anonId = sessionData?.sessionId || sessionData?.userId || null
    console.log('[LOKAZEN_DEBUG] BRAND_LEAD', 'Creating brand lead:', {
      anon_id: anonId,
      email,
      phone
    })

    const userId: string | null = email || phone || null
    if (!userId) {
      console.warn('[LEADS][CREATE] Missing email/phone, skipping lead creation')
      return NextResponse.json(
        { success: false, error: 'Email or phone is required' },
        { status: 400 }
      )
    }

    const businessTypeRaw =
      Array.isArray(sessionData?.businessType) && sessionData.businessType.length > 0
        ? sessionData.businessType[0]
        : sessionData?.businessType ?? null

    const locations = sessionData?.locations ?? []
    const budgetMin = sessionData?.budgetRange?.min ?? null
    const budgetMax = sessionData?.budgetRange?.max ?? null
    const sizeMin = sessionData?.sizeRange?.min ?? null
    const sizeMax = sessionData?.sizeRange?.max ?? null

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO brand_profiles 
        (id, user_id, company_name, industry, preferred_locations, budget_min, budget_max, min_size, max_size, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), $1::varchar, $2, $3, $4::jsonb, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        industry = EXCLUDED.industry,
        preferred_locations = EXCLUDED.preferred_locations,
        budget_min = EXCLUDED.budget_min,
        budget_max = EXCLUDED.budget_max,
        min_size = EXCLUDED.min_size,
        max_size = EXCLUDED.max_size,
        updated_at = NOW()
    `,
      userId,
      name || email || phone || 'Brand Lead',
      businessTypeRaw,
      JSON.stringify(locations),
      budgetMin,
      budgetMax,
      sizeMin,
      sizeMax
    )

    console.log('[LEADS][CREATE] Lead saved for userId:', userId)
    
    // Fetch created brand profile to log details
    try {
      const brandProfile = await prisma.$queryRawUnsafe<Array<{ id: string; user_id: string }>>(
        `SELECT id, user_id FROM brand_profiles WHERE user_id = $1::varchar LIMIT 1`,
        userId
      )
      
      if (brandProfile[0]) {
        console.log('[LOKAZEN_DEBUG] BRAND_LEAD', 'Brand profile created/updated:', {
          profile_id: brandProfile[0].id,
          user_id: brandProfile[0].user_id,
          anon_id: anonId
        })
      }
    } catch (err) {
      // Ignore errors in logging
    }

    // Send webhook to Pabbly
    sendLeadCreationWebhook({
      name: name || email || phone || 'Brand Lead',
      email,
      phone,
      businessType: businessTypeRaw,
      locations,
      budgetMin,
      budgetMax,
      sizeMin,
      sizeMax
    }).catch(err => console.warn('[LEADS][CREATE] Failed to send webhook:', err))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[LEADS][CREATE] error:', error?.message || error)
    // Do not break UX – surface error but keep 200 for callers that don't expect failures
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
    })
  }
}


