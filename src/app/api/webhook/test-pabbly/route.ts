import { NextRequest, NextResponse } from 'next/server'
import { sendLeadCreationWebhook } from '@/lib/pabbly-webhook'

/**
 * Test endpoint to verify Pabbly webhook connectivity
 * GET /api/webhook/test-pabbly
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Test Webhook] Testing Pabbly webhook connection...')
    
    // Send a test webhook
    await sendLeadCreationWebhook({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+91-9876543210',
      businessType: 'cafe_qsr',
      locations: ['Indiranagar'],
      budgetMin: 50000,
      budgetMax: 100000,
      sizeMin: 500,
      sizeMax: 1000,
    })

    return NextResponse.json({
      success: true,
      message: 'Test webhook sent. Check server logs for details.',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[Test Webhook] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send test webhook',
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint to test webhook with custom data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formType, data } = body

    console.log('[Test Webhook] Testing webhook with custom data:', { formType, data })

    // Import the appropriate webhook function based on formType
    let webhookFunction
    switch (formType) {
      case 'brand_lead_creation':
        const { sendLeadCreationWebhook } = await import('@/lib/pabbly-webhook')
        webhookFunction = sendLeadCreationWebhook
        break
      case 'owner_lead_creation':
        const { sendOwnerLeadWebhook } = await import('@/lib/pabbly-webhook')
        webhookFunction = sendOwnerLeadWebhook
        break
      case 'contact_team':
        const { sendContactTeamWebhook } = await import('@/lib/pabbly-webhook')
        webhookFunction = sendContactTeamWebhook
        break
      case 'expert_connect':
        const { sendExpertConnectWebhook } = await import('@/lib/pabbly-webhook')
        webhookFunction = sendExpertConnectWebhook
        break
      case 'requirements_lead':
        const { sendRequirementsLeadWebhook } = await import('@/lib/pabbly-webhook')
        webhookFunction = sendRequirementsLeadWebhook
        break
      case 'property_submission':
        const { sendPropertySubmissionWebhook } = await import('@/lib/pabbly-webhook')
        webhookFunction = sendPropertySubmissionWebhook
        break
      case 'visit_schedule':
        const { sendVisitScheduleWebhook } = await import('@/lib/pabbly-webhook')
        webhookFunction = sendVisitScheduleWebhook
        break
      default:
        return NextResponse.json(
          { success: false, error: `Unknown formType: ${formType}` },
          { status: 400 }
        )
    }

    await webhookFunction(data)

    return NextResponse.json({
      success: true,
      message: `Test webhook sent for formType: ${formType}. Check server logs for details.`,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[Test Webhook] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send test webhook',
      },
      { status: 500 }
    )
  }
}
