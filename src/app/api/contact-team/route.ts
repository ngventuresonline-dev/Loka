import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { sendContactTeamWebhook } from '@/lib/pabbly-webhook'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, bestTime, additionalRequirements, searchCriteria } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    
    // Store contact request (you may want to create a ContactRequest model in Prisma)
    // For now, we'll just log it and return success
    console.log('Contact Team Request:', {
      name,
      phone,
      bestTime,
      additionalRequirements,
      searchCriteria,
      timestamp: new Date().toISOString()
    })

    // TODO: Save to database when ContactRequest model is created
    // if (prisma) {
    //   await prisma.contactRequest.create({
    //     data: {
    //       name,
    //       phone,
    //       bestTime,
    //       additionalRequirements,
    //       searchCriteria: JSON.stringify(searchCriteria),
    //       status: 'pending'
    //     }
    //   })
    // }

    // TODO: Send email notification to admin team
    // TODO: Send confirmation email to user

    // Send webhook to Pabbly
    sendContactTeamWebhook({
      name,
      phone,
      bestTime,
      additionalRequirements,
      searchCriteria
    }).catch(err => console.warn('[Contact Team] Failed to send webhook:', err))

    return NextResponse.json({
      success: true,
      message: 'Thank you! Our team will contact you within 24 hours.'
    })
  } catch (error: any) {
    console.error('Contact team error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit request' },
      { status: 500 }
    )
  }
}

