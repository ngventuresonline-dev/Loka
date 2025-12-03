// Mock Database - In-Memory Property Data
// This replaces Prisma/PostgreSQL temporarily so you can test the AI search

export interface MockProperty {
  id: string
  title: string
  description: string
  address: string
  city: string
  state: string
  country: string
  zipCode: string
  size: number // sqft
  propertyType: string
  condition: string
  price: number
  priceType: string
  securityDeposit?: number
  negotiable: boolean
  amenities: string[]
  images: string[]
  availability: boolean
  parking: boolean
  publicTransport: boolean
  accessibility: boolean
  ownerId: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  createdAt: Date
  updatedAt: Date
  views: number
  isFeatured: boolean
}

export const mockProperties: MockProperty[] = [
  {
    id: 'prop-001',
    title: 'Prime QSR Space in Indiranagar',
    description: 'Excellent location for Quick Service Restaurant in the heart of Indiranagar. High foot traffic area with ample parking. Perfect for brands looking to establish presence in Bangalore\'s most happening neighborhood.',
    address: '100ft Road, Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    zipCode: '560038',
    size: 500,
    propertyType: 'qsr',
    condition: 'excellent',
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
    ownerId: 'owner-001',
    ownerName: 'Rajesh Kumar',
    ownerEmail: 'rajesh@ngventures.com',
    ownerPhone: '+91 98765 43210',
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-01'),
    views: 125,
    isFeatured: true,
  },
  {
    id: 'prop-002',
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
    ownerId: 'owner-001',
    ownerName: 'Rajesh Kumar',
    ownerEmail: 'rajesh@ngventures.com',
    ownerPhone: '+91 98765 43210',
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-10-15'),
    views: 203,
    isFeatured: true,
  },
  {
    id: 'prop-003',
    title: 'Kiosk Space in MG Road Metro Station',
    description: 'Small kiosk space available at MG Road Metro Station. Perfect for coffee shops, juice bars, or quick service outlets. Guaranteed footfall of 50,000+ daily commuters.',
    address: 'MG Road Metro Station',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    zipCode: '560001',
    size: 150,
    propertyType: 'kiosk',
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
    ownerId: 'owner-002',
    ownerName: 'Priya Sharma',
    ownerEmail: 'priya@ngventures.com',
    ownerPhone: '+91 98765 43211',
    createdAt: new Date('2024-11-10'),
    updatedAt: new Date('2024-11-10'),
    views: 342,
    isFeatured: true,
  },
  {
    id: 'prop-004',
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
    ownerId: 'owner-002',
    ownerName: 'Priya Sharma',
    ownerEmail: 'priya@ngventures.com',
    ownerPhone: '+91 98765 43211',
    createdAt: new Date('2024-10-20'),
    updatedAt: new Date('2024-10-20'),
    views: 187,
    isFeatured: false,
  },
  {
    id: 'prop-005',
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
    ownerId: 'owner-001',
    ownerName: 'Rajesh Kumar',
    ownerEmail: 'rajesh@ngventures.com',
    ownerPhone: '+91 98765 43210',
    createdAt: new Date('2024-09-30'),
    updatedAt: new Date('2024-09-30'),
    views: 156,
    isFeatured: false,
  },
  {
    id: 'prop-006',
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
    ownerId: 'owner-002',
    ownerName: 'Priya Sharma',
    ownerEmail: 'priya@ngventures.com',
    ownerPhone: '+91 98765 43211',
    createdAt: new Date('2024-11-05'),
    updatedAt: new Date('2024-11-05'),
    views: 98,
    isFeatured: false,
  },
]

// Helper functions to query mock data

export function searchProperties(filters: {
  city?: string
  propertyType?: string
  minPrice?: number
  maxPrice?: number
  minSize?: number
  maxSize?: number
  amenities?: string[]
}) {
  let results = mockProperties.filter(p => p.availability)

  if (filters.city) {
    const city = filters.city.toLowerCase()
    results = results.filter(
      p =>
        p.city.toLowerCase().includes(city) ||
        p.address.toLowerCase().includes(city)
    )
  }

  if (filters.propertyType) {
    const type = filters.propertyType.toLowerCase()
    results = results.filter(p => p.propertyType.toLowerCase().includes(type))
  }

  if (filters.minPrice) {
    results = results.filter(p => p.price >= filters.minPrice!)
  }

  if (filters.maxPrice) {
    results = results.filter(p => p.price <= filters.maxPrice!)
  }

  if (filters.minSize) {
    results = results.filter(p => p.size >= filters.minSize!)
  }

  if (filters.maxSize) {
    results = results.filter(p => p.size <= filters.maxSize!)
  }

  if (filters.amenities && filters.amenities.length > 0) {
    results = results.filter(p =>
      filters.amenities!.some(amenity =>
        p.amenities.some(a => a.toLowerCase().includes(amenity.toLowerCase()))
      )
    )
  }

  // Sort by featured first, then by views
  return results.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1
    if (!a.isFeatured && b.isFeatured) return 1
    return b.views - a.views
  })
}

export function getPropertyById(id: string) {
  return mockProperties.find(p => p.id === id)
}

export function getAllProperties() {
  return mockProperties.filter(p => p.availability)
}
