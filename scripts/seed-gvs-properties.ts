/**
 * Seed GVS Ventures commercial properties for admin approval.
 * Run: npm run db:seed-gvs
 */
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

const prisma = new PrismaClient()

interface GVSProperty {
  title: string
  address: string
  city: string
  size: number
  price: number
  priceType: 'monthly' | 'sqft'
  securityDepositMonths?: number | null
  securityDepositFixed?: number | null
  frontage?: number
  power?: string
  powerBackup: boolean
  floor?: string
  leaseTill?: string
  cam?: number
  waterFacility?: boolean
  mapLink?: string
  idealFor?: string
  vegOnly?: boolean
  rentEscalation?: number
  lockInYears?: number | string
  maintenance?: number
  revenueShare?: number
  availability?: string
}

const gvsProperties: GVSProperty[] = [
  {
    title: 'Prime Commercial Property | Cunningham Road, Bangalore',
    address: 'Cunningham Road',
    city: 'Bangalore',
    size: 1332,
    price: 180,
    priceType: 'sqft',
    securityDepositMonths: 6,
    frontage: 15,
    power: '25 KW',
    powerBackup: true,
    floor: 'Ground Floor',
    leaseTill: '27-03-2033',
    cam: 7986,
  },
  {
    title: 'Prime Commercial Property | Hulimavu, Bannerghatta Road',
    address: 'Hulimavu, Bannerghatta Road',
    city: 'Bangalore',
    size: 902,
    price: 120,
    priceType: 'sqft',
    securityDepositMonths: 6,
    frontage: 15,
    power: '25 KW',
    powerBackup: true,
    floor: 'Ground Floor',
    leaseTill: '28-05-2036',
  },
  {
    title: 'Prime Commercial Property | SNN Raj Serenity, Begur',
    address: 'SNN Raj Serenity, Begur',
    city: 'Bangalore',
    size: 1260,
    price: 150,
    priceType: 'sqft',
    securityDepositMonths: 6,
    frontage: 17,
    power: '25 KW',
    powerBackup: true,
    floor: 'Ground Floor',
    leaseTill: '06-03-2029',
  },
  {
    title: 'Prime Commercial Property | Andrahalli Main Road, Bangalore',
    address: 'Andrahalli Main Road',
    city: 'Bangalore',
    size: 1200,
    price: 100,
    priceType: 'sqft',
    securityDepositMonths: 6,
    frontage: 17,
    power: '20 KW',
    powerBackup: true,
    floor: 'Ground Floor',
    leaseTill: '25-12-2032',
  },
  {
    title: 'Prime Commercial Property | Hesaraghatta, Bangalore',
    address: 'Hesaraghatta',
    city: 'Bangalore',
    size: 700,
    price: 150,
    priceType: 'sqft',
    securityDepositMonths: 6,
    frontage: 45,
    power: '25 KW',
    powerBackup: true,
    floor: 'First Floor',
    leaseTill: '02-04-2033',
    cam: 5000,
  },
  {
    title: 'Prime Commercial Property Available | Jayanagar',
    address: 'Jayanagar',
    city: 'Bangalore',
    size: 1800,
    price: 350,
    priceType: 'sqft',
    securityDepositMonths: null,
    floor: 'Ground Floor',
    power: undefined,
    powerBackup: false,
    idealFor: 'QSR / Restaurant / Retail',
    mapLink: 'https://maps.app.goo.gl/eEohFfBjw77mfGFV6?g_st=ic',
  },
  {
    title: 'Prime Commercial Property | Outer Ring Road',
    address: 'Outer Ring Road',
    city: 'Bangalore',
    size: 300,
    price: 75000,
    priceType: 'monthly',
    securityDepositMonths: 8,
    power: undefined,
    powerBackup: false,
    mapLink: 'https://maps.app.goo.gl/Ax35rj6TJAoQwEhAA?g_st=ic',
  },
  {
    title: 'Prime Commercial Property | Indiranagar – 100 Ft Road (VEG ONLY)',
    address: '100 Ft Road, Indiranagar',
    city: 'Bangalore',
    size: 800,
    price: 500,
    priceType: 'sqft',
    securityDepositMonths: 10,
    power: undefined,
    powerBackup: false,
    idealFor: 'Café | QSR | Retail',
    vegOnly: true,
    mapLink: 'https://maps.app.goo.gl/cozUgmPg5H477Dfs9?g_st=ic',
  },
  {
    title: 'Commercial Property Available | Jayanagar, Yediyur Lake',
    address: 'Yediyur Lake, Jayanagar',
    city: 'Bangalore',
    size: 1500,
    price: 200000,
    priceType: 'monthly',
    securityDepositMonths: 10,
    floor: 'Ground Floor',
    power: undefined,
    powerBackup: false,
    waterFacility: true,
    mapLink: 'https://maps.google.com/?q=12.931911,77.575760',
  },
  {
    title: 'Prime Commercial Property | HSR Sector 6',
    address: 'HSR Sector 6',
    city: 'Bangalore',
    size: 2600,
    price: 350000,
    priceType: 'monthly',
    securityDepositMonths: 8,
    power: undefined,
    powerBackup: false,
    idealFor: 'Café | QSR',
    mapLink: 'https://maps.app.goo.gl/4JYYaMTqaSewmvcY6?g_st=ic',
  },
  {
    title: 'Prime Commercial Property | AECS Layout',
    address: 'AECS Layout',
    city: 'Bangalore',
    size: 750,
    price: 90000,
    priceType: 'monthly',
    securityDepositMonths: 10,
    power: undefined,
    powerBackup: false,
    idealFor: 'Café | QSR | Retail',
    mapLink: 'https://maps.app.goo.gl/f3wEhzJ3x7xt7NcW6?g_st=ic',
  },
  {
    title: 'Prime Commercial Property | Marathahalli Main Road',
    address: 'Marathahalli Main Road',
    city: 'Bangalore',
    size: 800,
    price: 100000,
    priceType: 'monthly',
    securityDepositMonths: 6,
    power: undefined,
    powerBackup: false,
    idealFor: 'Café | QSR | Retail',
    mapLink: 'https://maps.app.goo.gl/QMdRLFeWB8WEiVDD9?g_st=ac',
  },
  {
    title: 'Prime Commercial Property | Kadubeesanahalli',
    address: 'Kadubeesanahalli',
    city: 'Bangalore',
    size: 600,
    price: 80000,
    priceType: 'monthly',
    securityDepositMonths: 6,
    power: undefined,
    powerBackup: false,
    idealFor: 'Café | QSR | Retail',
    mapLink: 'https://maps.app.goo.gl/M1cS9SaXu2FXsMB68?g_st=ic',
  },
  // New batch - Nov 2025
  {
    title: 'Independent Bungalow G+1 | Indiranagar 2nd Stage, 60 Ft Road',
    address: 'Indiranagar 2nd Stage, opposite Still Coffee, 60 Ft Road',
    city: 'Bangalore',
    size: 2300,
    price: 375000,
    priceType: 'monthly',
    securityDepositMonths: 8,
    power: '50 kVA',
    powerBackup: true,
    floor: 'Ground + 1',
    idealFor: 'Café | Restaurant',
    rentEscalation: 7.5,
    lockInYears: '2-3',
    mapLink: 'https://maps.app.goo.gl/kpPCoywdYZ48ydNg9?g_st=aw',
    availability: 'May',
  },
  {
    title: 'Prime Commercial Property | Off 100 Ft Road, Indiranagar',
    address: 'Off 100 Ft Road, Indiranagar',
    city: 'Bangalore',
    size: 2500,
    price: 400000,
    priceType: 'monthly',
    securityDepositMonths: 8,
    floor: 'Ground + Mezzanine',
    power: undefined,
    powerBackup: false,
    idealFor: 'Salon | Spa | Café | Lounge | Retail',
  },
  {
    title: 'Commercial Space | Electronic City – Phase 1',
    address: 'Electronic City Phase 1',
    city: 'Bangalore',
    size: 1000,
    price: 75000,
    priceType: 'monthly',
    securityDepositMonths: 10,
    floor: 'Ground Floor',
    power: undefined,
    powerBackup: false,
    idealFor: 'Café | QSR | Retail | Office',
    availability: 'Immediate',
  },
  {
    title: 'Prime Commercial Property | HSR Layout – 19th Main',
    address: 'HSR Layout, 19th Main',
    city: 'Bangalore',
    size: 2100,
    price: 420000,
    priceType: 'monthly',
    securityDepositFixed: 3300000,
    securityDepositMonths: null,
    floor: 'Ground + Mezzanine',
    power: '20-25 kVA',
    powerBackup: true,
    lockInYears: 3,
    idealFor: 'Restaurant | Café | QSR | Retail',
    availability: 'Immediate',
  },
  {
    title: 'Prime Commercial Property | HSR Layout – 24th Main Road (300 Sqft)',
    address: 'HSR Layout, 24th Main Road',
    city: 'Bangalore',
    size: 300,
    price: 300,
    priceType: 'sqft',
    securityDepositMonths: 8,
    floor: 'Ground Floor',
    power: undefined,
    powerBackup: true,
    idealFor: 'Café | Dessert | Beverage | QSR | Retail',
    availability: 'Immediate',
  },
  {
    title: 'Prime Commercial Property | HSR Layout – 24th Main Road (730 Sqft)',
    address: 'HSR Layout, 24th Main Road',
    city: 'Bangalore',
    size: 730,
    price: 300,
    priceType: 'sqft',
    securityDepositMonths: 8,
    floor: 'Ground Floor',
    power: undefined,
    powerBackup: true,
    idealFor: 'Café | Dessert | Beverage | QSR | Retail',
    availability: 'Immediate',
  },
  {
    title: 'Ultra-Prime Commercial Space | Sarjapur Main Road (VEG ONLY)',
    address: 'Sarjapur Main Road',
    city: 'Bangalore',
    size: 275,
    price: 120000,
    priceType: 'monthly',
    securityDepositMonths: 8,
    power: undefined,
    powerBackup: false,
    idealFor: 'Premium Kiosk | Dessert | Beverage | Boutique Retail',
    vegOnly: true,
    availability: 'BTS',
  },
  {
    title: 'Prime Commercial Property | Kalyan Nagar',
    address: 'Kalyan Nagar',
    city: 'Bangalore',
    size: 1200,
    price: 400000,
    priceType: 'monthly',
    securityDepositMonths: null,
    floor: 'Ground Floor',
    power: undefined,
    powerBackup: false,
    idealFor: 'Restaurant | Café | QSR | Retail',
  },
  {
    title: 'Commercial Space | Near Sarjapur Junction',
    address: 'Near Sarjapur Junction',
    city: 'Bangalore',
    size: 550,
    price: 250,
    priceType: 'sqft',
    securityDepositMonths: 6,
    floor: 'Ground Floor',
    power: '15 kVA',
    powerBackup: false,
    waterFacility: true,
    idealFor: 'Café | QSR | Dessert | Retail',
    availability: 'Immediate',
  },
  {
    title: 'Commercial Space | Nature Walk – Sompura, Sarjapur Road (480 Sqft)',
    address: 'Nature Walk, Sompura, Sarjapur Road',
    city: 'Bangalore',
    size: 480,
    price: 100000,
    priceType: 'monthly',
    securityDepositMonths: 6,
    power: '20-25 kVA',
    powerBackup: true,
    idealFor: 'Café | Dessert | Beverage | QSR',
    maintenance: 10000,
    revenueShare: 18,
    availability: 'Immediate',
  },
  {
    title: 'Commercial Space | Nature Walk – Sompura, Sarjapur Road (1000 Sqft)',
    address: 'Nature Walk, Sompura, Sarjapur Road',
    city: 'Bangalore',
    size: 1000,
    price: 150000,
    priceType: 'monthly',
    securityDepositMonths: 6,
    power: '20-25 kVA',
    powerBackup: true,
    idealFor: 'Café | Dessert | Beverage | QSR',
    maintenance: 19000,
    revenueShare: 18,
    availability: 'Immediate',
  },
]

async function generatePropertyId(index: number): Promise<string> {
  const allProps = await prisma.property.findMany({
    where: { id: { startsWith: 'prop-' } },
    select: { id: true },
  })
  const numbers = allProps
    .map((p) => {
      const match = p.id.match(/prop-(\d+)/)
      return match ? parseInt(match[1], 10) : 0
    })
    .filter((n) => n > 0)
  const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0
  const nextNum = Math.max(maxNum + 1, index + 1)
  return `prop-${nextNum.toString().padStart(3, '0')}`
}

async function main() {
  console.log('🌱 Seeding GVS Ventures properties (pending approval)...')

  const gvsOwner = await prisma.user.upsert({
    where: { email: 'admin@ngventures.com' },
    update: { userType: 'admin' },
    create: {
      email: 'admin@ngventures.com',
      name: 'GVS Ventures',
      password: '$2b$10$placeholder_hash_change_in_production',
      userType: 'admin',
    },
  })

  let imported = 0
  let skipped = 0

  for (let i = 0; i < gvsProperties.length; i++) {
    const prop = gvsProperties[i]
    try {
      const existing = await prisma.property.findFirst({
        where: {
          title: prop.title,
          address: { contains: prop.address },
          city: prop.city,
        },
      })

      if (existing) {
        console.log(`⏭️  Skipping: ${prop.title} (already exists)`)
        skipped++
        continue
      }

      const monthlyRent =
        prop.priceType === 'sqft'
          ? prop.size * prop.price
          : prop.price

      const securityDeposit =
        prop.securityDepositFixed != null
          ? prop.securityDepositFixed
          : prop.securityDepositMonths != null
            ? Math.round(prop.securityDepositMonths * monthlyRent)
            : null

      const amenitiesData: Record<string, unknown> = {
        features: ['Commercial', 'GVS Ventures'],
      }
      if (prop.mapLink) amenitiesData.map_link = prop.mapLink
      if (prop.frontage) amenitiesData.frontage_ft = prop.frontage
      if (prop.cam) amenitiesData.cam = prop.cam
      if (prop.leaseTill) amenitiesData.lease_till = prop.leaseTill
      if (prop.floor) amenitiesData.floor = prop.floor
      if (prop.idealFor) amenitiesData.ideal_for = prop.idealFor
      if (prop.vegOnly) amenitiesData.veg_only = prop.vegOnly
      if (prop.rentEscalation) amenitiesData.rent_escalation_pct = prop.rentEscalation
      if (prop.lockInYears !== undefined) amenitiesData.lock_in_years = prop.lockInYears
      if (prop.maintenance) amenitiesData.maintenance = prop.maintenance
      if (prop.revenueShare) amenitiesData.revenue_share = prop.revenueShare
      if (prop.availability) amenitiesData.availability = prop.availability

      const descriptionParts: string[] = []
      if (prop.floor) descriptionParts.push(`${prop.floor}.`)
      if (prop.power) descriptionParts.push(`Power: ${prop.power}.`)
      if (prop.powerBackup) descriptionParts.push('Power Backup: Yes.')
      if (prop.cam) descriptionParts.push(`CAM: ₹${prop.cam.toLocaleString('en-IN')}.`)
      if (prop.leaseTill) descriptionParts.push(`Lease till: ${prop.leaseTill}.`)
      if (prop.idealFor) descriptionParts.push(`Ideal for: ${prop.idealFor}.`)
      if (prop.vegOnly) descriptionParts.push('VEG ONLY.')
      if (prop.rentEscalation) descriptionParts.push(`Escalation: ${prop.rentEscalation}% p.a.`)
      if (prop.lockInYears) descriptionParts.push(`Lock-in: ${prop.lockInYears} years.`)
      if (prop.maintenance) descriptionParts.push(`Maintenance: ₹${prop.maintenance.toLocaleString('en-IN')}/month.`)
      if (prop.revenueShare) descriptionParts.push(`Revenue share: ${prop.revenueShare}%.`)
      if (prop.availability) descriptionParts.push(`Availability: ${prop.availability}.`)

      const propertyId = await generatePropertyId(imported)

      await prisma.property.create({
        data: {
          id: propertyId,
          title: prop.title,
          description:
            descriptionParts.length > 0
              ? descriptionParts.join(' ')
              : `Prime commercial property in ${prop.address}, ${prop.city}.`,
          address: prop.address,
          city: prop.city,
          state: 'Karnataka',
          zipCode: '560001',
          size: prop.size,
          propertyType: 'restaurant',
          price: prop.priceType === 'sqft' ? prop.price : prop.price,
          priceType: prop.priceType === 'sqft' ? 'sqft' : 'monthly',
          securityDeposit,
          rentEscalation: prop.rentEscalation ?? null,
          storePowerCapacity: prop.power || null,
          powerBackup: prop.powerBackup,
          waterFacility: prop.waterFacility ?? false,
          amenities: amenitiesData,
          images: [],
          ownerId: gvsOwner.id,
          status: 'pending',
          availability: false,
          isFeatured: false,
        },
      })

      console.log(`✅ Imported: ${prop.title}`)
      imported++
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`❌ Error importing ${prop.title}:`, msg)
    }
  }

  console.log(`\n🎉 Seed complete!`)
  console.log(`   ✅ Imported: ${imported} properties`)
  console.log(`   ⏭️  Skipped: ${skipped} properties`)
  console.log(`   📋 All properties have status: pending – review in Admin → Properties → Pending`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
