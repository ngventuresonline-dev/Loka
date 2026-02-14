import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Check which session exists using UNION query
    const result = await prisma.$queryRaw<Array<{ type: string }>>`
      SELECT 'brand' as type 
      FROM brand_onboarding_sessions 
      WHERE user_id = ${userId}
      UNION
      SELECT 'owner' as type 
      FROM property_onboarding_sessions 
      WHERE user_id = ${userId}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ type: null })
    }

    return NextResponse.json({ type: result[0].type })
  } catch (error: any) {
    console.error('Session type detection error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to detect session type' },
      { status: 500 }
    )
  }
}
