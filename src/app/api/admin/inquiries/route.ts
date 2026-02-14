import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getPrisma } from '@/lib/get-prisma'

export async function GET(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Build where clauses for both inquiries and expert requests
    const inquiryWhere: any = {}
    const expertRequestWhere: any = {}
    
    if (search) {
      inquiryWhere.OR = [
        { brand: { name: { contains: search, mode: 'insensitive' } } },
        { brand: { email: { contains: search, mode: 'insensitive' } } },
        { property: { title: { contains: search, mode: 'insensitive' } } },
        { property: { address: { contains: search, mode: 'insensitive' } } }
      ]
      
      expertRequestWhere.OR = [
        { brandName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { property: { title: { contains: search, mode: 'insensitive' } } },
        { property: { address: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Map status filter - handle both inquiry and expert request statuses
    let shouldFetchInquiries = true
    let shouldFetchExpertRequests = true
    
    if (status) {
      // Map common statuses
      if (status === 'pending') {
        inquiryWhere.status = 'pending'
        expertRequestWhere.status = 'pending'
      } else if (status === 'responded') {
        inquiryWhere.status = 'responded'
        // Expert requests don't have 'responded', so we'll use 'contacted' or 'scheduled'
        expertRequestWhere.status = { in: ['contacted', 'scheduled'] }
      } else if (status === 'closed') {
        inquiryWhere.status = 'closed'
        expertRequestWhere.status = { in: ['completed', 'cancelled'] }
      } else if (status === 'scheduled' || status === 'cancelled') {
        // Only expert requests have these statuses
        expertRequestWhere.status = status
        shouldFetchInquiries = false
      } else if (['contacted', 'completed'].includes(status)) {
        // Expert request specific statuses
        expertRequestWhere.status = status
        shouldFetchInquiries = false
      } else {
        // For inquiry-specific statuses
        inquiryWhere.status = status
        shouldFetchExpertRequests = false
      }
    }

    const orderBy: any = {}
    if (sortBy === 'date') {
      orderBy.createdAt = sortOrder
    }

    // Fetch both inquiries and expert requests
    const [inquiries, expertRequests, inquiryTotal, expertRequestTotal] = await Promise.all([
      shouldFetchInquiries
        ? prisma.inquiry.findMany({
            where: inquiryWhere,
            orderBy,
            include: {
              brand: {
                select: {
                  name: true,
                  email: true,
                }
              },
              owner: {
                select: {
                  name: true,
                  email: true,
                }
              },
              property: {
                select: {
                  title: true,
                  address: true,
                }
              }
            }
          })
        : Promise.resolve([]),
      shouldFetchExpertRequests
        ? prisma.expertRequest.findMany({
            where: expertRequestWhere,
            orderBy,
            include: {
              property: {
                select: {
                  title: true,
                  address: true,
                }
              }
            }
          })
        : Promise.resolve([]),
      shouldFetchInquiries ? prisma.inquiry.count({ where: inquiryWhere }) : Promise.resolve(0),
      shouldFetchExpertRequests ? prisma.expertRequest.count({ where: expertRequestWhere }) : Promise.resolve(0)
    ])

    // Format inquiries
    const formattedInquiries = inquiries.map(i => ({
      id: i.id,
      type: 'inquiry' as const,
      brand: {
        name: i.brand.name,
        email: i.brand.email,
      },
      property: {
        title: i.property.title,
        address: i.property.address,
      },
      owner: i.owner ? {
        name: i.owner.name,
        email: i.owner.email,
      } : null,
      status: i.status,
      createdAt: i.createdAt,
      message: i.message,
    }))

    // Format expert requests
    const formattedExpertRequests = expertRequests.map(er => ({
      id: er.id,
      type: 'expert_request' as const,
      brand: {
        name: er.brandName,
        email: er.email || '',
      },
      property: {
        title: er.property.title,
        address: er.property.address,
      },
      owner: null,
      status: er.status,
      createdAt: er.createdAt,
      message: er.notes,
      phone: er.phone,
      scheduleDateTime: er.scheduleDateTime,
    }))

    // Combine and sort all items
    const allItems = [...formattedInquiries, ...formattedExpertRequests].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    // Apply pagination to combined results
    const total = inquiryTotal + expertRequestTotal
    const skip = (page - 1) * limit
    const paginatedItems = allItems.slice(skip, skip + limit)

    return NextResponse.json({
      inquiries: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error: any) {
    console.error('Admin inquiries error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inquiries' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
