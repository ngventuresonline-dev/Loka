import { NextRequest, NextResponse } from 'next/server'
import { searchProperties, getAllProperties } from '@/lib/mockDatabase'

// GET - Fetch all properties or search with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    const city = searchParams.get('city')
    const propertyType = searchParams.get('propertyType')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minSize = searchParams.get('minSize')
    const maxSize = searchParams.get('maxSize')

    const where: any = {
      availability: true,
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    if (propertyType) {
      where.propertyType = propertyType
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (minSize || maxSize) {
      where.size = {}
      if (minSize) where.size.gte = parseInt(minSize)
      if (maxSize) where.size.lte = parseInt(maxSize)
    }

    // Build filters for mock database
    const filters: any = {}
    if (city) filters.city = city
    if (propertyType) filters.propertyType = propertyType
    if (minPrice) filters.minPrice = parseFloat(minPrice)
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice)
    if (minSize) filters.minSize = parseInt(minSize)
    if (maxSize) filters.maxSize = parseInt(maxSize)

    const properties = Object.keys(filters).length > 0 
      ? searchProperties(filters)
      : getAllProperties()

    return NextResponse.json({ success: true, properties, count: properties.length })
  } catch (error: any) {
    console.error('GET Properties Error:', error)
    return NextResponse.json({ error: 'Failed to fetch properties', details: error.message }, { status: 500 })
  }
}

// POST - Create a new property listing (Mock - returns success)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    // Mock response - in real app, this would save to database
    const mockProperty = {
      id: `prop-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      isFeatured: false,
      ownerName: 'Mock Owner',
      ownerEmail: 'owner@mock.com',
      ownerPhone: '+91 00000 00000',
    }

    console.log('Mock property created:', mockProperty)

    return NextResponse.json({ 
      success: true, 
      property: mockProperty,
      message: 'Property creation will be enabled when real database is connected'
    }, { status: 201 })
  } catch (error: any) {
    console.error('POST Property Error:', error)
    return NextResponse.json({ error: 'Failed to create property', details: error.message }, { status: 500 })
  }
}
