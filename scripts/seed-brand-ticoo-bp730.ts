/**
 * Upserts brand Ticoo (QSR) as user id BP-730 for dashboard + matches.
 *
 * Login: /dashboard/brand/login — use registered email or phone.
 * Optional: set TICOO_BRAND_PHONE in .env.local (10 digits, no +91) to store the same number shown in admin/sheets.
 *
 * Run: npx tsx scripts/seed-brand-ticoo-bp730.ts
 * Or:  npm run db:seed-brand-ticoo-bp730
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

config({ path: resolve(__dirname, '../.env.local') })

const prisma = new PrismaClient()

const BRAND_ID = 'BP-730'
const EMAIL = 'cnfaheem@gmail.com'
const DISPLAY_NAME = 'Ticoo'
const COMPANY = 'Ticoo'
const INDUSTRY = 'QSR'

async function main() {
  const phoneEnv = process.env.TICOO_BRAND_PHONE?.replace(/\D/g, '').trim()
  const phone =
    phoneEnv && phoneEnv.length >= 10
      ? phoneEnv.length > 10
        ? phoneEnv.slice(-10)
        : phoneEnv
      : null

  const otherEmail = await prisma.user.findFirst({
    where: {
      email: EMAIL.toLowerCase(),
      NOT: { id: BRAND_ID },
    },
    select: { id: true },
  })
  if (otherEmail) {
    console.error(
      `[seed-brand-ticoo] Email ${EMAIL} is already used by user ${otherEmail.id}. Resolve manually before seeding BP-730.`
    )
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(`ticoo-bp730-${Date.now()}`, 10)

  await prisma.user.upsert({
    where: { id: BRAND_ID },
    create: {
      id: BRAND_ID,
      email: EMAIL.toLowerCase(),
      password: hashedPassword,
      name: DISPLAY_NAME,
      phone,
      userType: 'brand',
      isActive: true,
      brandProfiles: {
        create: {
          company_name: COMPANY,
          industry: INDUSTRY,
          category: INDUSTRY,
          must_have_amenities: {
            storeType: INDUSTRY,
            timeline: '',
            targetAudience: '',
            additionalRequirements: '',
          },
        },
      },
    },
    update: {
      email: EMAIL.toLowerCase(),
      name: DISPLAY_NAME,
      ...(phone != null ? { phone } : {}),
      userType: 'brand',
      isActive: true,
      brandProfiles: {
        upsert: {
          create: {
            company_name: COMPANY,
            industry: INDUSTRY,
            category: INDUSTRY,
            must_have_amenities: {
              storeType: INDUSTRY,
              timeline: '',
              targetAudience: '',
              additionalRequirements: '',
            },
          },
          update: {
            company_name: COMPANY,
            industry: INDUSTRY,
            category: INDUSTRY,
            must_have_amenities: {
              storeType: INDUSTRY,
              timeline: '',
              targetAudience: '',
              additionalRequirements: '',
            },
            updated_at: new Date(),
          },
        },
      },
    },
  })

  console.log(`OK: Brand ${BRAND_ID} (${COMPANY}, ${INDUSTRY}) — ${EMAIL}`)
  if (phone) console.log(`     Phone stored: ${phone}`)
  else console.log('     Phone: not set (login with email, or set TICOO_BRAND_PHONE and re-run)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
