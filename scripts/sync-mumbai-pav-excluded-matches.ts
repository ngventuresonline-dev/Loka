/**
 * Idempotent: hide specific listing titles from Mumbai Pav Co brand dashboard matches only
 * (weight_config_json.excludedMatchPropertyTitles — see /api/dashboard/brand/matches).
 *
 * Usage: npx tsx scripts/sync-mumbai-pav-excluded-matches.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

config({ path: resolve(process.cwd(), '.env.local') })
config()

const EXCLUDED_TITLES = [
  'Commercial Space | Near Sarjapur Junction',
  'Ultra-Prime Commercial Space | Sarjapur Main Road (VEG ONLY)',
] as const

async function main() {
  const prisma = new PrismaClient()
  try {
    const profile = await prisma.brand_profiles.findFirst({
      where: {
        OR: [
          { company_name: { contains: 'Mumbai Pav', mode: 'insensitive' } },
          {
            user: {
              is: { phone: '9632616285', userType: 'brand' },
            },
          },
        ],
      },
      select: { user_id: true, company_name: true, weight_config_json: true },
    })

    if (!profile) {
      console.error('No Mumbai Pav Co brand_profiles row found.')
      process.exit(1)
    }

    const prev =
      profile.weight_config_json && typeof profile.weight_config_json === 'object'
        ? (profile.weight_config_json as Record<string, unknown>)
        : {}

    const merged = {
      ...prev,
      excludedMatchPropertyTitles: [...EXCLUDED_TITLES],
    }

    await prisma.brand_profiles.update({
      where: { user_id: profile.user_id },
      data: { weight_config_json: merged, updated_at: new Date() },
    })

    console.log(
      JSON.stringify({ ok: true, userId: profile.user_id, company: profile.company_name, excluded: EXCLUDED_TITLES }, null, 2)
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
