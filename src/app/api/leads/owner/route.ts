import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOwnerLeadWebhook } from '@/lib/pabbly-webhook'

export async function POST(req: Request) {
  try {
    const { name, email, phone } = await req.json()

    console.log('[LEADS][OWNER] Incoming payload:', { name, email, phone })

    const userId: string | null = email || phone || null
    if (!userId) {
      console.warn('[LEADS][OWNER] Missing email/phone, skipping owner lead creation')
      return NextResponse.json(
        { success: false, error: 'Email or phone is required' },
        { status: 400 }
      )
    }

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO owner_profiles 
        (id, user_id, company_name, total_properties, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), $1, $2, 1, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        total_properties = owner_profiles.total_properties + 1,
        updated_at = NOW()
    `,
      userId,
      name || email || phone || 'Owner Lead'
    )

    console.log('[LEADS][OWNER] Owner profile upserted for userId:', userId)

    // Send webhook to Pabbly
    sendOwnerLeadWebhook({
      name: name || email || phone || 'Owner Lead',
      email,
      phone,
    }).catch(err => console.warn('[LEADS][OWNER] Failed to send webhook:', err))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[LEADS][OWNER] error:', error?.message || error)
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
    })
  }
}


