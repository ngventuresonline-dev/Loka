import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getISTTimestamp } from '@/lib/utils'

const prismaClient = prisma || new PrismaClient()

/**
 * Session logging endpoint - stores only latest filter_step state, not full interaction history
 * Simplified structure: { userType, filter_step: {...}, metadata: {...} }
 */
export async function POST(req: Request) {
  console.log('🔥 API ROUTE HIT')

  try {
    const body = await req.json()
    console.log('🔥 Body received:', body)

    const { sessionType, userId, data, action } = body as {
      sessionType?: 'brand' | 'owner'
      userId?: string | null
      data?: any
      action?: string
    }

    if (!userId) {
      console.log('⚠️ No userId provided')
      return NextResponse.json({ success: true, skipped: true })
    }

    const now = getISTTimestamp()
    
    // Extract filter_step from data (data may contain filter_step, contact_step, etc.)
    const incomingFilterStep = data?.filter_step || data || {}
    
    // Helper to build simplified session data
    const buildSessionData = (existingData: any) => {
      const entryTimestamp = existingData?.metadata?.entryTimestamp || existingData?.entryTimestamp || now
      const existingFilterStep = existingData?.filter_step || {}
      const existingMetadata = existingData?.metadata || {}
      
      // Merge filter_step data (keep latest state only)
      const mergedFilterStep = {
        ...existingFilterStep,
        ...incomingFilterStep
      }
      
      // Calculate duration if we have entry timestamp
      const duration = existingMetadata.duration || 
        (existingMetadata.entryTimestamp 
          ? Math.floor((new Date(now).getTime() - new Date(entryTimestamp).getTime()) / 1000)
          : 0)
      
      // Increment totalChanges counter
      const totalChanges = (existingMetadata.totalChanges || 0) + 1
      
      return {
        userType: sessionType || existingData?.userType || 'unknown',
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

    if (sessionType === 'brand') {
      console.log('💾 Upserting brand session...')

      // Check if session exists
      const existingSession = await prismaClient.$queryRawUnsafe<Array<{ id: string; filter_step: any; created_at: Date }>>(
        `SELECT id, filter_step, created_at FROM brand_onboarding_sessions WHERE user_id = $1::varchar LIMIT 1`,
        userId
      ).catch(() => [])

      let sessionData
      
      if (existingSession.length > 0 && existingSession[0]?.filter_step) {
        // UPDATE existing session - merge filter_step, update metadata
        sessionData = buildSessionData(existingSession[0].filter_step)
        
        await prismaClient.$executeRawUnsafe(
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
        console.log('✅ Brand session updated!')
      } else {
        // CREATE new session
        sessionData = {
          userType: sessionType || 'brand',
          filter_step: incomingFilterStep,
          metadata: {
            entryTimestamp: now,
            totalChanges: 1,
            duration: 0,
            lastUpdated: now,
            status: 'in_progress'
          }
        }
        
        await prismaClient.$executeRawUnsafe(
          `
          INSERT INTO brand_onboarding_sessions (id, user_id, flow_type, status, filter_step, created_at, updated_at)
          VALUES (gen_random_uuid(), $1::varchar, 'brand', 'in_progress', $2::jsonb, NOW(), NOW())
          `,
          userId,
          JSON.stringify(sessionData)
        )
        console.log('✅ Brand session created!')
      }
    }

    if (sessionType === 'owner') {
      console.log('💾 Upserting owner session...')

      // Check if session exists
      const existingSession = await prismaClient.$queryRawUnsafe<Array<{ id: string; filter_step: any; created_at: Date }>>(
        `SELECT id, filter_step, created_at FROM property_onboarding_sessions WHERE user_id = $1::varchar LIMIT 1`,
        userId
      ).catch(() => [])

      let sessionData
      
      if (existingSession.length > 0 && existingSession[0]?.filter_step) {
        // UPDATE existing session - merge filter_step, update metadata
        sessionData = buildSessionData(existingSession[0].filter_step)
        
        await prismaClient.$executeRawUnsafe(
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
        console.log('✅ Owner session updated!')
      } else {
        // CREATE new session
        sessionData = {
          userType: sessionType || 'owner',
          filter_step: incomingFilterStep,
          metadata: {
            entryTimestamp: now,
            totalChanges: 1,
            duration: 0,
            lastUpdated: now,
            status: 'in_progress'
          }
        }
        
        await prismaClient.$executeRawUnsafe(
          `
          INSERT INTO property_onboarding_sessions (id, user_id, flow_type, status, filter_step, created_at, updated_at)
          VALUES (gen_random_uuid(), $1::varchar, 'owner', 'in_progress', $2::jsonb, NOW(), NOW())
          `,
          userId,
          JSON.stringify(sessionData)
        )
        console.log('✅ Owner session created!')
      }
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





