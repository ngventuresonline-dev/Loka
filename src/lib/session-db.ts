import { prisma } from '@/lib/prisma'

/**
 * Upsert a brand onboarding session for a given user.
 * Relies on a UNIQUE constraint on brand_onboarding_sessions.user_id.
 */
export async function createBrandSession(userId: string, data: any) {
  try {
    const session = await prisma.$queryRaw<
      Array<{ id: string }>
    >`
      INSERT INTO "brand_onboarding_sessions"
        ("id", "user_id", "flow_type", "status", "filter_step", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), ${userId}, 'brand', 'in_progress', ${JSON.stringify(data)}::jsonb, NOW(), NOW())
      ON CONFLICT ("user_id")
      DO UPDATE SET
        "filter_step" = ${JSON.stringify(data)}::jsonb,
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
 * Relies on a UNIQUE constraint on property_onboarding_sessions.user_id.
 */
export async function createOwnerSession(userId: string, data: any) {
  try {
    const session = await prisma.$queryRaw<
      Array<{ id: string }>
    >`
      INSERT INTO "property_onboarding_sessions"
        ("id", "user_id", "flow_type", "status", "filter_step", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), ${userId}, 'owner', 'in_progress', ${JSON.stringify(data)}::jsonb, NOW(), NOW())
      ON CONFLICT ("user_id")
      DO UPDATE SET
        "filter_step" = ${JSON.stringify(data)}::jsonb,
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


