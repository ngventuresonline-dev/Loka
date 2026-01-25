import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getISTTimestamp } from '@/lib/utils'

interface UpdateSessionRequest {
  sessionId: string
  userId: string
  action: string
  data?: any
  metadata?: any
  timestamp?: string
}

export async function PATCH(req: Request) {
  try {
    const body: UpdateSessionRequest = await req.json()
    const {
      sessionId,
      userId,
      action,
      data = {},
      metadata = {},
      timestamp
    } = body

    console.log('[LOKAZEN_DEBUG] SESSION_UPDATE', 'Updating session:', {
      anon_id: userId,
      action,
      data: Object.keys(data).length > 0 ? data : undefined
    })

    if (!sessionId || !userId || !action) {
      return NextResponse.json(
        { error: 'sessionId, userId, and action are required' },
        { status: 400 }
      )
    }

    const now = timestamp || getISTTimestamp()
    
    // Extract filter_step from data (data may contain filter_step, contact_step, etc.)
    const incomingFilterStep = data?.filter_step || data || {}
    
    // Check which session table has this userId
    const brandSession = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM brand_onboarding_sessions WHERE user_id = ${userId} LIMIT 1
    `.catch(() => [])

    const ownerSession = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM property_onboarding_sessions WHERE user_id = ${userId} LIMIT 1
    `.catch(() => [])

    // Build simplified session data - merge filter_step, update metadata
    const buildSessionData = (existingData: any, userType: 'brand' | 'owner') => {
      const entryTimestamp = existingData?.metadata?.entryTimestamp || existingData?.entryTimestamp || now
      const existingFilterStep = existingData?.filter_step || {}
      const existingMetadata = existingData?.metadata || {}
      
      // Merge filter_step data (keep latest state only)
      const mergedFilterStep = {
        ...existingFilterStep,
        ...incomingFilterStep
      }
      
      // Calculate duration
      const duration = existingMetadata.duration || 
        (existingMetadata.entryTimestamp 
          ? Math.floor((new Date(now).getTime() - new Date(entryTimestamp).getTime()) / 1000)
          : 0)
      
      // Increment totalChanges counter
      const totalChanges = (existingMetadata.totalChanges || 0) + 1
      
      // Determine userType
      let finalUserType = userType
      if (action === 'user_type_detected' && data?.userType) {
        finalUserType = data.userType
      } else if (existingData?.userType) {
        finalUserType = existingData.userType
      }
      
      return {
        userType: finalUserType,
        filter_step: mergedFilterStep,
        metadata: {
          entryTimestamp,
          totalChanges,
          duration,
          lastUpdated: now,
          status: existingData?.status || 'in_progress'
        }
      }
    }

    if (brandSession.length > 0) {
      // Update brand session
      const existing = await prisma.$queryRaw<Array<{ filter_step: any }>>`
        SELECT filter_step FROM brand_onboarding_sessions WHERE user_id = ${userId} LIMIT 1
      `.catch(() => [])

      const existingData = existing[0]?.filter_step || {}
      const sessionData = buildSessionData(existingData, 'brand')

      await prisma.$executeRawUnsafe(
        `
        UPDATE brand_onboarding_sessions
        SET 
          filter_step = $1::jsonb,
          updated_at = NOW(),
          status = $2::varchar
        WHERE user_id = $3::varchar
        `,
        JSON.stringify(sessionData),
        sessionData.metadata.status,
        userId
      )
    } else if (ownerSession.length > 0) {
      // Update owner session
      const existing = await prisma.$queryRaw<Array<{ filter_step: any }>>`
        SELECT filter_step FROM property_onboarding_sessions WHERE user_id = ${userId} LIMIT 1
      `.catch(() => [])

      const existingData = existing[0]?.filter_step || {}
      const sessionData = buildSessionData(existingData, 'owner')

      await prisma.$executeRawUnsafe(
        `
        UPDATE property_onboarding_sessions
        SET 
          filter_step = $1::jsonb,
          updated_at = NOW(),
          status = $2::varchar
        WHERE user_id = $3::varchar
        `,
        JSON.stringify(sessionData),
        sessionData.metadata.status,
        userId
      )
    } else {
      // No session found - create one based on action or default to brand
      const userType = data?.userType === 'owner' ? 'owner' : 'brand'
      const sessionData = {
        userType,
        filter_step: incomingFilterStep,
        metadata: {
          entryTimestamp: now,
          totalChanges: 1,
          duration: 0,
          lastUpdated: now,
          status: 'in_progress'
        }
      }

      if (userType === 'brand') {
        // Double-check if session exists (race condition protection)
        const checkSession = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM brand_onboarding_sessions WHERE user_id = $1::varchar LIMIT 1`,
          userId
        ).catch(() => [])

        if (checkSession.length > 0) {
          // Session exists, update it
          const existing = await prisma.$queryRaw<Array<{ filter_step: any }>>`
            SELECT filter_step FROM brand_onboarding_sessions WHERE user_id = ${userId} LIMIT 1
          `.catch(() => [])
          const existingData = existing[0]?.filter_step || {}
          const updatedSessionData = buildSessionData(existingData, 'brand')
          
          await prisma.$executeRawUnsafe(
            `
            UPDATE brand_onboarding_sessions
            SET 
              filter_step = $1::jsonb,
              updated_at = NOW(),
              status = $2::varchar
            WHERE user_id = $3::varchar
            `,
            JSON.stringify(updatedSessionData),
            updatedSessionData.metadata.status,
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
      } else {
        // Double-check if session exists (race condition protection)
        const checkSession = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM property_onboarding_sessions WHERE user_id = $1::varchar LIMIT 1`,
          userId
        ).catch(() => [])

        if (checkSession.length > 0) {
          // Session exists, update it
          const existing = await prisma.$queryRaw<Array<{ filter_step: any }>>`
            SELECT filter_step FROM property_onboarding_sessions WHERE user_id = ${userId} LIMIT 1
          `.catch(() => [])
          const existingData = existing[0]?.filter_step || {}
          const updatedSessionData = buildSessionData(existingData, 'owner')
          
          await prisma.$executeRawUnsafe(
            `
            UPDATE property_onboarding_sessions
            SET 
              filter_step = $1::jsonb,
              updated_at = NOW(),
              status = $2::varchar
            WHERE user_id = $3::varchar
            `,
            JSON.stringify(updatedSessionData),
            updatedSessionData.metadata.status,
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
      }
    }

    // Fetch updated session to log details
    let sessionDetails: { id: string; user_id: string } | null = null
    try {
      const brandResult = await prisma.$queryRaw<Array<{ id: string; user_id: string }>>`
        SELECT id, user_id FROM brand_onboarding_sessions WHERE user_id = ${userId} LIMIT 1
      `.catch(() => [])
      
      const ownerResult = await prisma.$queryRaw<Array<{ id: string; user_id: string }>>`
        SELECT id, user_id FROM property_onboarding_sessions WHERE user_id = ${userId} LIMIT 1
      `.catch(() => [])
      
      sessionDetails = brandResult[0] || ownerResult[0] || null
    } catch (err) {
      // Ignore errors in logging
    }

    if (sessionDetails) {
      console.log('[LOKAZEN_DEBUG] SESSION_UPDATE', 'Session updated:', {
        session_id: sessionDetails.id,
        anon_id: sessionDetails.user_id
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully'
    })
  } catch (error: any) {
    console.error('[Sessions API] Update error:', error)
    // Return success anyway to not break UX
    return NextResponse.json({
      success: true,
      logged: false,
      error: error?.message || String(error)
    })
  }
}
