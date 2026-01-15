/**
 * Pabbly Webhook Integration
 * 
 * This module handles sending webhook data to Pabbly Connect for various form submissions.
 * All webhook payloads are sent to the configured Pabbly webhook URL.
 */

const PABBLY_WEBHOOK_URL = process.env.PABBLY_WEBHOOK_URL || 
  'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjcwNTZjMDYzNjA0MzI1MjZlNTUzMDUxMzAi_pc'

/**
 * Base webhook payload structure
 */
interface BaseWebhookPayload {
  formType: string
  timestamp: string
  source: string
}

/**
 * Send webhook to Pabbly
 */
async function sendWebhook(payload: any): Promise<void> {
  try {
    const response = await fetch(PABBLY_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('[Pabbly Webhook] Failed to send webhook:', {
        status: response.status,
        statusText: response.statusText,
        formType: payload.formType,
      })
    } else {
      console.log('[Pabbly Webhook] Successfully sent webhook:', payload.formType)
    }
  } catch (error: any) {
    console.error('[Pabbly Webhook] Error sending webhook:', {
      error: error.message,
      formType: payload.formType,
    })
    // Don't throw - webhook failures shouldn't break the main flow
  }
}

/**
 * 1. Brand Lead Creation Webhook
 * Triggered when: Brand completes onboarding/search flow
 */
export async function sendLeadCreationWebhook(data: {
  name?: string
  email?: string
  phone?: string
  businessType?: string | null
  locations?: string[]
  budgetMin?: number | null
  budgetMax?: number | null
  sizeMin?: number | null
  sizeMax?: number | null
}): Promise<void> {
  await sendWebhook({
    formType: 'brand_lead_creation',
    timestamp: new Date().toISOString(),
    source: 'lokazen_platform',
    ...data,
  })
}

/**
 * 2. Owner Lead Creation Webhook
 * Triggered when: Owner submits initial information
 */
export async function sendOwnerLeadWebhook(data: {
  name?: string
  email?: string
  phone?: string
}): Promise<void> {
  await sendWebhook({
    formType: 'owner_lead_creation',
    timestamp: new Date().toISOString(),
    source: 'lokazen_platform',
    ...data,
  })
}

/**
 * 3. User Registration Webhook
 * Triggered when: New user registers (brand or owner)
 */
export async function sendUserRegistrationWebhook(data: {
  name: string
  email: string
  phone?: string
  userType: 'brand' | 'owner' | 'admin'
}): Promise<void> {
  await sendWebhook({
    formType: 'user_registration',
    timestamp: new Date().toISOString(),
    source: 'lokazen_platform',
    ...data,
  })
}

/**
 * 4. Contact Team Form Webhook
 * Triggered when: User submits "Contact Team" form
 */
export async function sendContactTeamWebhook(data: {
  name: string
  phone: string
  bestTime?: string
  additionalRequirements?: string
  searchCriteria?: any
}): Promise<void> {
  await sendWebhook({
    formType: 'contact_team',
    timestamp: new Date().toISOString(),
    source: 'lokazen_platform',
    ...data,
  })
}

/**
 * 5. Expert Connect Webhook
 * Triggered when: Brand requests to connect with expert for a property
 */
export async function sendExpertConnectWebhook(data: {
  propertyId: string
  brandName: string
  email?: string
  phone: string
  scheduleDateTime: string
  notes: string
}): Promise<void> {
  await sendWebhook({
    formType: 'expert_connect',
    timestamp: new Date().toISOString(),
    source: 'lokazen_platform',
    ...data,
  })
}

/**
 * 6. Requirements Lead Webhook
 * Triggered when: User submits requirements form from properties page
 */
export async function sendRequirementsLeadWebhook(data: {
  name: string
  phone: string
  email: string
  requirements?: string
  searchCriteria?: any
  source?: string
}): Promise<void> {
  await sendWebhook({
    formType: 'requirements_lead',
    timestamp: new Date().toISOString(),
    source: 'lokazen_platform',
    ...data,
  })
}

/**
 * 7. Property Submission Webhook
 * Triggered when: Owner submits a new property listing
 */
export async function sendPropertySubmissionWebhook(data: {
  ownerId: string
  propertyId: string
  propertyType: string
  location: string
  size?: number
  rent?: number
  deposit?: number
  amenities?: string[]
  ownerName?: string
  ownerEmail?: string
  ownerPhone?: string
}): Promise<void> {
  await sendWebhook({
    formType: 'property_submission',
    timestamp: new Date().toISOString(),
    source: 'lokazen_platform',
    ...data,
  })
}

/**
 * 8. Visit Schedule Webhook
 * Triggered when: Brand schedules a property visit
 */
export async function sendVisitScheduleWebhook(data: {
  propertyId: string
  dateTime: string
  note?: string
  name: string
  email: string
  phone: string
  company?: string
}): Promise<void> {
  await sendWebhook({
    formType: 'visit_schedule',
    timestamp: new Date().toISOString(),
    source: 'lokazen_platform',
    ...data,
  })
}

/**
 * 9. Inquiry Creation Webhook
 * Triggered when: Brand creates an inquiry for a property
 */
export async function sendInquiryCreationWebhook(data: {
  inquiryId: string
  propertyId: string
  brandId: string
  ownerId: string
  message: string
  brandName?: string
  brandEmail?: string
  propertyTitle?: string
}): Promise<void> {
  await sendWebhook({
    formType: 'inquiry_creation',
    timestamp: new Date().toISOString(),
    source: 'lokazen_platform',
    ...data,
  })
}
