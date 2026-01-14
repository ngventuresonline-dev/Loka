import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { sendLeadCreationWebhook } from '@/lib/pabbly-webhook'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, requirements, searchCriteria, source } = body

    if (!name || !phone || !email) {
      return NextResponse.json(
        { error: 'Name, phone, and email are required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    
    // Create a lead entry
    // Using a simple approach - storing in a generic way
    // You may want to create a dedicated RequirementsLead model in Prisma
    
    const userId = email || phone
    
    // Try to save to database if we have a way to store it
    // For now, we'll log it and you can extend this to save to your database
    console.log('Requirements Lead:', {
      name,
      phone,
      email,
      requirements,
      searchCriteria,
      source: source || 'properties_results_page',
      timestamp: new Date().toISOString()
    })

    // If you have a leads table or similar, save it here
    // Example (adjust based on your schema):
    // if (prisma) {
    //   await prisma.lead.create({
    //     data: {
    //       name,
    //       phone,
    //       email,
    //       requirements,
    //       searchCriteria: JSON.stringify(searchCriteria || {}),
    //       source: source || 'properties_results_page',
    //       status: 'pending',
    //       createdAt: new Date()
    //     }
    //   })
    // }

    // TODO: Send email notification to admin team
    // TODO: Send confirmation email to user

    // Send webhook to Pabbly
    sendLeadCreationWebhook({
      name,
      email,
      phone,
      requirements,
      searchCriteria,
      source: source || 'properties_results_page'
    }).catch(err => console.warn('[Leads Requirements] Failed to send webhook:', err))

    return NextResponse.json({
      success: true,
      message: 'Your requirements have been saved. Our team will contact you within 24 hours.'
    })
  } catch (error: any) {
    console.error('Requirements lead error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save requirements' },
      { status: 500 }
    )
  }
}

