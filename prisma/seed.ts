import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create sample users
  const owner1 = await prisma.user.upsert({
    where: { email: 'owner1@ngventures.com' },
    update: {},
    create: {
      email: 'owner1@ngventures.com',
      name: 'Rajesh Kumar',
      password: '$2b$10$hashedpassword', // In production, use proper hashing
      userType: 'owner',
      phone: '+91 98765 43210',
    },
  })

  const owner2 = await prisma.user.upsert({
    where: { email: 'owner2@ngventures.com' },
    update: {},
    create: {
      email: 'owner2@ngventures.com',
      name: 'Priya Sharma',
      password: '$2b$10$hashedpassword', // In production, use proper hashing
      userType: 'owner',
      phone: '+91 98765 43211',
    },
  })

  const brand1 = await prisma.user.upsert({
    where: { email: 'brand1@ngventures.com' },
    update: {},
    create: {
      email: 'brand1@ngventures.com',
      name: 'Amit Patel',
      password: '$2b$10$hashedpassword', // In production, use proper hashing
      userType: 'brand',
      phone: '+91 98765 43212',
    },
  })

  console.log('✅ Users created')

  // Create sample properties
  const properties = [
    {
      title: 'Prime QSR Space in Indiranagar',
      description: 'Excellent location for Quick Service Restaurant in the heart of Indiranagar. High foot traffic area with ample parking. Perfect for brands looking to establish presence in Bangalore\'s most happening neighborhood.',
      address: '100ft Road, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      zipCode: '560038',
      size: 500,
      propertyType: 'other', // qsr not in enum, using 'other'
      price: 75000,
      priceType: 'monthly',
      securityDeposit: 150000,
      negotiable: true,
      amenities: ['Parking', 'WiFi', 'AC', 'Security', 'Storage'],
      images: ['/images/prop1.jpg'],
      parking: true,
      publicTransport: true,
      accessibility: true,
      availability: true,
      ownerId: owner1.id,
    },
    {
      title: 'Restaurant Space in Koramangala',
      description: 'Spacious restaurant space in Koramangala 5th Block. Previously operated as a successful cafe. Fully equipped kitchen, seating for 60+ people. Premium location with high visibility.',
      address: '5th Block, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      zipCode: '560095',
      size: 1200,
      propertyType: 'restaurant',
      condition: 'good',
      price: 150000,
      priceType: 'monthly',
      securityDeposit: 300000,
      negotiable: true,
      amenities: ['Kitchen', 'Parking', 'WiFi', 'AC', 'Security', 'Outdoor Seating'],
      images: ['/images/prop2.jpg'],
      parking: true,
      publicTransport: true,
      accessibility: true,
      availability: true,
      ownerId: owner1.id,
    },
    {
      title: 'Kiosk Space in MG Road Metro Station',
      description: 'Small kiosk space available at MG Road Metro Station. Perfect for coffee shops, juice bars, or quick service outlets. Guaranteed footfall of 50,000+ daily commuters.',
      address: 'MG Road Metro Station',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      zipCode: '560001',
      size: 150,
      propertyType: 'other', // kiosk not in enum
      condition: 'excellent',
      price: 40000,
      priceType: 'monthly',
      securityDeposit: 80000,
      negotiable: false,
      amenities: ['WiFi', 'Security', 'Storage', 'Water'],
      images: ['/images/prop3.jpg'],
      parking: false,
      publicTransport: true,
      accessibility: true,
      availability: true,
      ownerId: owner2.id,
    },
    {
      title: 'Retail Shop in Brigade Road',
      description: 'Premium retail space on Brigade Road, one of Bangalore\'s busiest shopping streets. Ground floor with large display windows. Ideal for clothing, accessories, or lifestyle brands.',
      address: 'Brigade Road',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      zipCode: '560025',
      size: 800,
      propertyType: 'retail',
      condition: 'excellent',
      price: 120000,
      priceType: 'monthly',
      securityDeposit: 240000,
      negotiable: true,
      amenities: ['Parking', 'AC', 'Security', 'Display Windows', 'Storage'],
      images: ['/images/prop4.jpg'],
      parking: true,
      publicTransport: true,
      accessibility: true,
      availability: true,
      ownerId: owner2.id,
    },
    {
      title: 'Commercial Office Space in Whitefield',
      description: 'Modern office space in Whitefield Tech Park. Fully furnished with workstations, meeting rooms, and pantry. High-speed internet and 24/7 security. Perfect for startups and small businesses.',
      address: 'ITPL Main Road, Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      zipCode: '560066',
      size: 2000,
      propertyType: 'office',
      condition: 'excellent',
      price: 180000,
      priceType: 'monthly',
      securityDeposit: 360000,
      negotiable: true,
      amenities: ['Parking', 'WiFi', 'AC', 'Security', 'Cafeteria', 'Meeting Rooms', 'Power Backup'],
      images: ['/images/prop5.jpg'],
      parking: true,
      publicTransport: true,
      accessibility: true,
      availability: true,
      ownerId: owner1.id,
    },
    {
      title: 'Small QSR Space in HSR Layout',
      description: 'Compact QSR space perfect for cloud kitchens, takeaway counters, or small cafes. Located in residential area with steady customer base. Affordable rent, quick availability.',
      address: 'Sector 2, HSR Layout',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      zipCode: '560102',
      size: 350,
      propertyType: 'qsr',
      condition: 'good',
      price: 45000,
      priceType: 'monthly',
      securityDeposit: 90000,
      negotiable: true,
      amenities: ['Parking', 'Water', 'Security'],
      images: ['/images/prop6.jpg'],
      parking: true,
      publicTransport: false,
      accessibility: true,
      availability: true,
      ownerId: owner2.id,
    },
  ]

  for (const propertyData of properties) {
    const { country, condition, negotiable, parking, publicTransport, accessibility, ...rest } = propertyData
    await prisma.property.create({
      data: {
        ...rest,
        propertyType: rest.propertyType as 'office' | 'retail' | 'warehouse' | 'restaurant' | 'other',
        priceType: rest.priceType as 'monthly' | 'yearly' | 'sqft',
      },
    })
  }

  console.log('✅ Properties created')

  // Create sample saved property
  await prisma.savedProperty.create({
    data: {
      userId: brand1.id,
      propertyId: (await prisma.property.findFirst({ where: { city: 'Bangalore' } }))!.id,
      notes: 'Interested in this location. Need to visit soon.',
    },
  })

  console.log('✅ Sample relationships created')
  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
