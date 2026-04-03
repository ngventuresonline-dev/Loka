/**
 * Upserts demo brand Ticoo (café / specialty beverage) by email.
 * Run: npm run db:seed-brand-ticoo
 *
 * Legacy BP-730 QSR account: npm run db:seed-brand-ticoo-bp730
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

config({ path: resolve(__dirname, '../.env.local') })

const prisma = new PrismaClient()

const EMAIL = 'ticoo@brand.lokazen.com'.toLowerCase()

async function main() {
  const hashedPassword = await bcrypt.hash('ticoo-brand-seed-change-me', 10)

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      name: 'Ticoo',
      phone: '9999999999',
      userType: 'brand',
      isActive: true,
      displayOrder: 1,
    },
    create: {
      email: EMAIL,
      password: hashedPassword,
      name: 'Ticoo',
      phone: '9999999999',
      userType: 'brand',
      isActive: true,
      displayOrder: 1,
    },
  })

  await prisma.brand_profiles.upsert({
    where: { user_id: user.id },
    create: {
      user_id: user.id,
      company_name: 'Ticoo',
      industry: 'Café/Specialty Beverage',
      category: 'Café',
      budget_min: 80000,
      budget_max: 350000,
      min_size: 200,
      max_size: 800,
      preferred_locations: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'MG Road', 'Sarjapur Road'],
      preferred_property_types: ['retail', 'restaurant'],
      must_have_amenities: {
        storeType: 'Café',
        timeline: '',
        targetAudience: '',
        additionalRequirements: '',
      },
    },
    update: {
      company_name: 'Ticoo',
      industry: 'Café/Specialty Beverage',
      category: 'Café',
      budget_min: 80000,
      budget_max: 350000,
      min_size: 200,
      max_size: 800,
      preferred_locations: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'MG Road', 'Sarjapur Road'],
      preferred_property_types: ['retail', 'restaurant'],
      updated_at: new Date(),
    },
  })

  console.log('Ticoo brand seeded successfully:', user.id, EMAIL)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
