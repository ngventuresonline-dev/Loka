import { prisma } from '@/lib/prisma'

/**
 * Upsert a brand onboarding session for a given user.
 * Stores simplified structure: { userType, filter_step: {...}, metadata: {...} }
 * Relies on a UNIQUE constraint on brand_onboarding_sessions.user_id.
 */
export async function createBrandSession(userId: string, data: any) {
  try {
    // Extract filter_step from data (data may contain filter_step, contact_step, etc.)
    const filterStep = data?.filter_step || data || {}
    
    // Build simplified session structure
    const sessionData = {
      userType: 'brand',
      filter_step: filterStep,
      metadata: {
        entryTimestamp: new Date().toISOString(),
        totalChanges: 1,
        duration: 0,
        lastUpdated: new Date().toISOString(),
        status: 'in_progress'
      }
    }

    const session = await prisma.$queryRaw<
      Array<{ id: string }>
    >`
      INSERT INTO "brand_onboarding_sessions"
        ("id", "user_id", "flow_type", "status", "filter_step", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), ${userId}, 'brand', 'in_progress', ${JSON.stringify(sessionData)}::jsonb, NOW(), NOW())
      ON CONFLICT ("user_id")
      DO UPDATE SET
        "filter_step" = ${JSON.stringify(sessionData)}::jsonb,
        "status" = 'in_progress',
        "updated_at" = NOW()
      RETURNING *
    `

    console.log('✅ Brand session created/upserted:', session)
    return session
  } catch (error: any) {
    console.error('❌ Brand session error:', error?.message || error)
    throw error
  }
}

/**
 * Upsert a property (owner) onboarding session for a given user.
 * Stores simplified structure: { userType, filter_step: {...}, metadata: {...} }
 * Relies on a UNIQUE constraint on property_onboarding_sessions.user_id.
 */
export async function createOwnerSession(userId: string, data: any) {
  try {
    // Extract filter_step from data (data may contain filter_step, contact_step, etc.)
    const filterStep = data?.filter_step || data || {}
    
    // Build simplified session structure
    const sessionData = {
      userType: 'owner',
      filter_step: filterStep,
      metadata: {
        entryTimestamp: new Date().toISOString(),
        totalChanges: 1,
        duration: 0,
        lastUpdated: new Date().toISOString(),
        status: 'in_progress'
      }
    }

    const session = await prisma.$queryRaw<
      Array<{ id: string }>
    >`
      INSERT INTO "property_onboarding_sessions"
        ("id", "user_id", "flow_type", "status", "filter_step", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), ${userId}, 'owner', 'in_progress', ${JSON.stringify(sessionData)}::jsonb, NOW(), NOW())
      ON CONFLICT ("user_id")
      DO UPDATE SET
        "filter_step" = ${JSON.stringify(sessionData)}::jsonb,
        "status" = 'in_progress',
        "updated_at" = NOW()
      RETURNING *
    `

    console.log('✅ Owner session created/upserted:', session)
    return session
  } catch (error: any) {
    console.error('❌ Owner session error:', error?.message || error)
    throw error
  }
}


