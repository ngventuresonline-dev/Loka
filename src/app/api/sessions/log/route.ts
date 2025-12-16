import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  console.log('🔥 API ROUTE HIT')

  try {
    const body = await req.json()
    console.log('🔥 Body received:', body)

    const { sessionType, userId, data } = body as {
      sessionType?: 'brand' | 'owner'
      userId?: string | null
      data?: any
    }

    if (!userId) {
      console.log('⚠️ No userId provided')
      return NextResponse.json({ success: true, skipped: true })
    }

    if (sessionType === 'brand') {
      console.log('💾 Saving brand session...')

      // Simple insert; let the database handle duplicates
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO brand_onboarding_sessions (id, user_id, flow_type, status, filter_step, created_at, updated_at)
        VALUES (gen_random_uuid(), $1::varchar, 'brand', 'in_progress', $2::jsonb, NOW(), NOW())
      `,
        userId,
        JSON.stringify(data ?? {})
      )

      console.log('✅ Brand session saved!')
    }

    if (sessionType === 'owner') {
      console.log('💾 Saving owner session...')

      await prisma.$executeRawUnsafe(
        `
        INSERT INTO property_onboarding_sessions (id, user_id, flow_type, status, filter_step, created_at, updated_at)
        VALUES (gen_random_uuid(), $1::varchar, 'owner', 'in_progress', $2::jsonb, NOW(), NOW())
      `,
        userId,
        JSON.stringify(data ?? {})
      )

      console.log('✅ Owner session saved!')
    }

    return NextResponse.json({ success: true, message: 'Session logged' })
  } catch (error: any) {
    console.log('❌ Database error:', error?.message || error)
    // Return success anyway to not break UX
    return NextResponse.json({
      success: true,
      logged: false,
      error: error?.message || String(error),
    })
  }
}





