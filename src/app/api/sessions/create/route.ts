import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getISTTimestamp } from '@/lib/utils'

interface CreateSessionRequest {
  sessionId: string
  userId: string
  userType?: 'brand' | 'owner' | 'unknown'
  entryPage?: string
  timestamp?: string
  userAgent?: string
  referrer?: string
}

export async function POST(req: Request) {
  try {
    const body: CreateSessionRequest = await req.json()
    const {
      sessionId,
      userId,
      userType = 'unknown',
      entryPage = '/',
      timestamp,
      userAgent,
      referrer
    } = body

    console.log('[LOKAZEN_DEBUG] SESSION_CREATE', 'Creating session with anon_id:', {
      sessionId,
      userId,
      userType
    })

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'sessionId and userId are required' },
        { status: 400 }
      )
    }

    const now = timestamp || getISTTimestamp()

    // Build simplified session data structure
    const sessionData = {
      userType: userType || 'unknown',
      filter_step: {},
      metadata: {
        entryTimestamp: now,
        totalChanges: 0,
        duration: 0,
        lastUpdated: now,
        status: 'in_progress',
        entryPage,
        userAgent,
        referrer
      }
    }

    // Determine which session table to use based on userType
    if (userType === 'brand') {
      // Check if session exists first
      const existingSession = await prisma.$queryRawUnsafe<Array<{ id: string; filter_step: any }>>(
        `SELECT id, filter_step FROM brand_onboarding_sessions WHERE user_id = $1::varchar LIMIT 1`,
        userId
      ).catch(() => [])

      if (existingSession.length > 0) {
        // Update existing session, preserving existing filter_step and metadata
        const existingData = existingSession[0].filter_step || {}
        const existingFilterStep = existingData.filter_step || {}
        const existingMetadata = existingData.metadata || {}
        
        const updatedSession = {
          userType: userType || existingData.userType || 'brand',
          filter_step: existingFilterStep,
          metadata: {
            entryTimestamp: existingMetadata.entryTimestamp || existingData.entryTimestamp || now,
            totalChanges: existingMetadata.totalChanges || 0,
            duration: existingMetadata.duration || 0,
            lastUpdated: now,
            status: existingData.status || 'in_progress',
            entryPage: entryPage || existingMetadata.entryPage || existingData.entryPage,
            userAgent: userAgent || existingMetadata.userAgent || existingData.userAgent,
            referrer: referrer || existingMetadata.referrer || existingData.referrer
          }
        }

        await prisma.$executeRawUnsafe(
          `
          UPDATE brand_onboarding_sessions
          SET 
            filter_step = $1::jsonb,
            updated_at = NOW(),
            status = $2::varchar
          WHERE user_id = $3::varchar
          `,
          JSON.stringify(updatedSession),
          updatedSession.metadata.status,
          userId
        )
      } else {
        // Create new session
        await prisma.$executeRawUnsafe(
          `
          INSERT INTO brand_onboarding_sessions 
            (id, user_id, flow_type, status, filter_step, created_at, updated_at)
          VALUES 
            (gen_random_uuid(), $1::varchar, 'brand', 'in_progress', $2::jsonb, NOW(), NOW())
          `,
          userId,
          JSON.stringify(sessionData)
        )
      }
    } else if (userType === 'owner') {
      // Check if session exists first
      const existingSession = await prisma.$queryRawUnsafe<Array<{ id: string; filter_step: any }>>(
        `SELECT id, filter_step FROM property_onboarding_sessions WHERE user_id = $1::varchar LIMIT 1`,
        userId
      ).catch(() => [])

      if (existingSession.length > 0) {
        // Update existing session, preserving existing filter_step and metadata
        const existingData = existingSession[0].filter_step || {}
        const existingFilterStep = existingData.filter_step || {}
        const existingMetadata = existingData.metadata || {}
        
        const updatedSession = {
          userType: userType || existingData.userType || 'owner',
          filter_step: existingFilterStep,
          metadata: {
            entryTimestamp: existingMetadata.entryTimestamp || existingData.entryTimestamp || now,
            totalChanges: existingMetadata.totalChanges || 0,
            duration: existingMetadata.duration || 0,
            lastUpdated: now,
            status: existingData.status || 'in_progress',
            entryPage: entryPage || existingMetadata.entryPage || existingData.entryPage,
            userAgent: userAgent || existingMetadata.userAgent || existingData.userAgent,
            referrer: referrer || existingMetadata.referrer || existingData.referrer
          }
        }

        await prisma.$executeRawUnsafe(
          `
          UPDATE property_onboarding_sessions
          SET 
            filter_step = $1::jsonb,
            updated_at = NOW(),
            status = $2::varchar
          WHERE user_id = $3::varchar
          `,
          JSON.stringify(updatedSession),
          updatedSession.metadata.status,
          userId
        )
      } else {
        // Create new session
        await prisma.$executeRawUnsafe(
          `
          INSERT INTO property_onboarding_sessions 
            (id, user_id, flow_type, status, filter_step, created_at, updated_at)
          VALUES 
            (gen_random_uuid(), $1::varchar, 'owner', 'in_progress', $2::jsonb, NOW(), NOW())
          `,
          userId,
          JSON.stringify(sessionData)
        )
      }
      } else {
        // Unknown type - check both tables to see which one exists
        // DO NOT create new sessions for unknown types - wait for user to select
        const brandSession = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM brand_onboarding_sessions WHERE user_id = $1::varchar LIMIT 1`,
          userId
        ).catch(() => [])

        const ownerSession = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM property_onboarding_sessions WHERE user_id = $1::varchar LIMIT 1`,
          userId
        ).catch(() => [])

        if (brandSession.length > 0) {
          // Update existing brand session
          await prisma.$executeRawUnsafe(
            `
            UPDATE brand_onboarding_sessions
            SET updated_at = NOW()
            WHERE user_id = $1::varchar
            `,
            userId
          )
        } else if (ownerSession.length > 0) {
          // Update existing owner session
          await prisma.$executeRawUnsafe(
            `
            UPDATE property_onboarding_sessions
            SET updated_at = NOW()
            WHERE user_id = $1::varchar
            `,
            userId
          )
        }
        // DO NOT create default brand session for unknown types
        // User must explicitly select brand or owner type
      }

    // Fetch created session to log details
    let sessionDetails: { id: string; user_id: string } | null = null
    try {
      if (userType === 'brand') {
        const result = await prisma.$queryRawUnsafe<Array<{ id: string; user_id: string }>>(
          `SELECT id, user_id FROM brand_onboarding_sessions WHERE user_id = $1::varchar LIMIT 1`,
          userId
        )
        sessionDetails = result[0] || null
      } else if (userType === 'owner') {
        const result = await prisma.$queryRawUnsafe<Array<{ id: string; user_id: string }>>(
          `SELECT id, user_id FROM property_onboarding_sessions WHERE user_id = $1::varchar LIMIT 1`,
          userId
        )
        sessionDetails = result[0] || null
      }
    } catch (err) {
      // Ignore errors in logging
    }

    if (sessionDetails) {
      console.log('[LOKAZEN_DEBUG] SESSION_CREATE', 'Session created:', {
        session_id: sessionDetails.id,
        anon_id: sessionDetails.user_id
      })
    }

    return NextResponse.json({
      success: true,
      sessionId,
      userId,
      message: 'Session created successfully'
    })
  } catch (error: any) {
    console.error('[Sessions API] Create error:', error)
    // Return success anyway to not break UX
    return NextResponse.json({
      success: true,
      logged: false,
      error: error?.message || String(error)
    })
  }
}
