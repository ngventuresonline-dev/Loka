import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const { searchParams } = new URL(request.url)
    // Support both sessionId (UUID) and userId (legacy)
    const userId = searchParams.get('userId') || sessionId

    if (!userId) {
      return NextResponse.json(
        { error: 'userId or sessionId is required' },
        { status: 400 }
      )
    }

    // Check both session tables - try to match by user_id
    // Note: In the new system, sessionId (UUID) is stored separately, 
    // but user_id is used as the identifier in session tables
    const brandSession = await prisma.$queryRaw<Array<{
      id: string
      user_id: string
      flow_type: string
      status: string
      filter_step: any
      created_at: Date
      updated_at: Date
    }>>`
      SELECT * FROM brand_onboarding_sessions WHERE user_id = ${userId} LIMIT 1
    `.catch(() => [])

    const ownerSession = await prisma.$queryRaw<Array<{
      id: string
      user_id: string
      flow_type: string
      status: string
      filter_step: any
      created_at: Date
      updated_at: Date
    }>>`
      SELECT * FROM property_onboarding_sessions WHERE user_id = ${userId} LIMIT 1
    `.catch(() => [])

    if (brandSession.length > 0) {
      const filterStepData = brandSession[0].filter_step || {}
      
      // Handle both old and new structure formats for backward compatibility
      let journeyData = filterStepData
      let userType = 'brand'
      
      // New structure: { userType, filter_step: {...}, metadata: {...} }
      if (filterStepData.userType && filterStepData.filter_step !== undefined) {
        userType = filterStepData.userType
        journeyData = {
          ...filterStepData,
          // Include filter_step at top level for backward compatibility
          ...filterStepData.filter_step
        }
      } 
      // Old structure: { userType, interactions: [...], entryTimestamp, ... }
      else if (filterStepData.userType) {
        userType = filterStepData.userType
        journeyData = filterStepData
      }
      
      return NextResponse.json({
        sessionId,
        userId,
        userType: userType === 'owner' ? 'owner' : 'brand',
        session: {
          id: brandSession[0].id,
          userId: brandSession[0].user_id,
          flowType: brandSession[0].flow_type,
          status: brandSession[0].status,
          journeyData: journeyData,
          createdAt: brandSession[0].created_at,
          updatedAt: brandSession[0].updated_at
        }
      })
    }

    if (ownerSession.length > 0) {
      const filterStepData = ownerSession[0].filter_step || {}
      
      // Handle both old and new structure formats for backward compatibility
      let journeyData = filterStepData
      let userType = 'owner'
      
      // New structure: { userType, filter_step: {...}, metadata: {...} }
      if (filterStepData.userType && filterStepData.filter_step !== undefined) {
        userType = filterStepData.userType
        journeyData = {
          ...filterStepData,
          // Include filter_step at top level for backward compatibility
          ...filterStepData.filter_step
        }
      } 
      // Old structure: { userType, interactions: [...], entryTimestamp, ... }
      else if (filterStepData.userType) {
        userType = filterStepData.userType
        journeyData = filterStepData
      }
      
      return NextResponse.json({
        sessionId,
        userId,
        userType: userType === 'brand' ? 'brand' : 'owner',
        session: {
          id: ownerSession[0].id,
          userId: ownerSession[0].user_id,
          flowType: ownerSession[0].flow_type,
          status: ownerSession[0].status,
          journeyData: journeyData,
          createdAt: ownerSession[0].created_at,
          updatedAt: ownerSession[0].updated_at
        }
      })
    }

    // No session found
    return NextResponse.json({
      sessionId,
      userId,
      userType: null,
      session: null
    })
  } catch (error: any) {
    console.error('[Sessions API] Get error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve session' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || sessionId

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Delete from both tables (if exists)
    await prisma.$executeRawUnsafe(
      `DELETE FROM brand_onboarding_sessions WHERE user_id = $1::varchar`,
      userId
    ).catch(() => {})

    await prisma.$executeRawUnsafe(
      `DELETE FROM property_onboarding_sessions WHERE user_id = $1::varchar`,
      userId
    ).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    })
  } catch (error: any) {
    console.error('[Sessions API] Delete error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete session' },
      { status: 500 }
    )
  }
}
