/**
 * Pabbly Webhook Integration
 * Sends form submissions and user actions to Pabbly webhook
 */

const PABBLY_WEBHOOK_URL = 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjcwNTZjMDYzNjA0MzI1MjZlNTUzMDUxMzAi_pc'

export interface WebhookPayload {
  eventType: string
  timestamp?: string // Optional - added automatically by sendPabblyWebhook
  [key: string]: any
}

/**
 * Send data to Pabbly webhook with retry logic
 * This function is non-blocking and won't throw errors to avoid breaking user experience
 * Automatically retries failed webhooks up to 3 times with exponential backoff
 */
export async function sendPabblyWebhook(data: WebhookPayload, retryCount = 0): Promise<void> {
  const MAX_RETRIES = 3
  const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff: 1s, 2s, 4s

  try {
    // Don't send webhooks in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_PABBLY_WEBHOOK) {
      console.log('[Pabbly Webhook] Skipped in development:', data.eventType)
      return
    }

    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
      source: 'lokazen-platform',
      environment: process.env.NODE_ENV || 'production',
      attempt: retryCount + 1
    }

    // Use fetch with timeout and error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(PABBLY_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Retry on non-OK responses (except 4xx client errors)
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
          console.warn(`[Pabbly Webhook] Server error (${response.status}), retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return sendPabblyWebhook(data, retryCount + 1)
        } else {
          console.warn('[Pabbly Webhook] Non-OK response:', response.status, response.statusText, `(attempt ${retryCount + 1})`)
        }
      } else {
        const result = await response.json().catch(() => ({ status: 'success' }))
        if (retryCount > 0) {
          console.log(`[Pabbly Webhook] Success after ${retryCount + 1} attempt(s):`, data.eventType, result)
        } else {
          console.log('[Pabbly Webhook] Success:', data.eventType, result)
        }
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Retry on network errors or timeouts
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
        const errorType = fetchError.name === 'AbortError' ? 'timeout' : 'network error'
        console.warn(`[Pabbly Webhook] ${errorType} for ${data.eventType}, retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return sendPabblyWebhook(data, retryCount + 1)
      } else {
        if (fetchError.name === 'AbortError') {
          console.warn(`[Pabbly Webhook] Request timeout after ${MAX_RETRIES + 1} attempts:`, data.eventType)
        } else {
          console.warn(`[Pabbly Webhook] Request failed after ${MAX_RETRIES + 1} attempts:`, data.eventType, fetchError.message)
        }
      }
    }
  } catch (error: any) {
    // Silently fail - don't break user experience
    console.warn('[Pabbly Webhook] Error sending webhook:', error?.message || error)
  }
}

/**
 * Send brand onboarding form submission
 */
export async function sendBrandOnboardingWebhook(formData: {
  brandName: string
  storeType: string
  size: string
  budgetMin: string
  budgetMax: string
  targetAudience: string
  preferredLocations: string
  additionalRequirements?: string
  [key: string]: any
}): Promise<void> {
  await sendPabblyWebhook({
    eventType: 'brand_onboarding_submission',
    formType: 'brand_onboarding',
    ...formData
  })
}

/**
 * Send owner onboarding form submission
 */
export async function sendOwnerOnboardingWebhook(formData: {
  propertyType: string
  location: string
  mapLink?: string
  latitude?: string
  longitude?: string
  size: string
  rent: string
  deposit: string
  amenities: string
  description: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  [key: string]: any
}): Promise<void> {
  await sendPabblyWebhook({
    eventType: 'owner_onboarding_submission',
    formType: 'owner_onboarding',
    ...formData
  })
}

/**
 * Send user registration
 */
export async function sendUserRegistrationWebhook(userData: {
  name: string
  email: string
  phone?: string
  userType: 'brand' | 'owner' | 'admin'
  [key: string]: any
}): Promise<void> {
  await sendPabblyWebhook({
    eventType: 'user_registration',
    formType: 'registration',
    ...userData
  })
}

/**
 * Send owner property creation
 */
export async function sendPropertyCreationWebhook(propertyData: {
  propertyId: string
  ownerId: string
  propertyType: string
  location: string
  size?: number
  rent?: number
  deposit?: number
  [key: string]: any
}): Promise<void> {
  await sendPabblyWebhook({
    eventType: 'property_creation',
    formType: 'property_listing',
    ...propertyData
  })
}

/**
 * Send contact team form submission
 */
export async function sendContactTeamWebhook(contactData: {
  name: string
  phone: string
  bestTime?: string
  additionalRequirements?: string
  searchCriteria?: any
  [key: string]: any
}): Promise<void> {
  await sendPabblyWebhook({
    eventType: 'contact_team_request',
    formType: 'contact_form',
    ...contactData
  })
}

/**
 * Send expert connect request
 */
export async function sendExpertConnectWebhook(expertData: {
  propertyId: string
  brandName: string
  email?: string
  phone: string
  scheduleDateTime: string
  notes: string
  [key: string]: any
}): Promise<void> {
  await sendPabblyWebhook({
    eventType: 'expert_connect_request',
    formType: 'expert_connect',
    ...expertData
  })
}

/**
 * Send lead creation
 */
export async function sendLeadCreationWebhook(leadData: {
  name: string
  email?: string
  phone?: string
  businessType?: string
  locations?: string[]
  budgetMin?: number
  budgetMax?: number
  sizeMin?: number
  sizeMax?: number
  [key: string]: any
}): Promise<void> {
  await sendPabblyWebhook({
    eventType: 'lead_creation',
    formType: 'lead_form',
    ...leadData
  })
}

/**
 * Send button flow completion
 */
export async function sendButtonFlowCompletionWebhook(flowData: {
  entityType: 'brand' | 'owner'
  businessType?: string
  selectedAreas?: string[]
  sizeRange?: { min: number; max: number }
  budgetRange?: { min: number; max: number }
  [key: string]: any
}): Promise<void> {
  await sendPabblyWebhook({
    eventType: 'button_flow_completion',
    formType: 'button_flow',
    ...flowData
  })
}

/**
 * Send AI search query
 */
export async function sendAISearchWebhook(searchData: {
  query: string
  resultsCount?: number
  responseTime?: number
  [key: string]: any
}): Promise<void> {
  await sendPabblyWebhook({
    eventType: 'ai_search_query',
    formType: 'ai_search',
    ...searchData
  })
}

/**
 * Generic webhook sender for any custom event
 */
export async function sendCustomWebhook(eventType: string, data: Record<string, any>): Promise<void> {
  await sendPabblyWebhook({
    eventType,
    ...data
  })
}

/**
 * Manually resend a webhook with fresh data
 * Useful for retrying failed webhooks or testing
 */
export async function resendPabblyWebhook(data: WebhookPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // Force send even in development for manual resends
    const originalEnv = process.env.NODE_ENV
    const originalEnable = process.env.ENABLE_PABBLY_WEBHOOK
    
    // Temporarily enable webhook for resend
    if (originalEnv === 'development') {
      process.env.ENABLE_PABBLY_WEBHOOK = 'true'
    }

    await sendPabblyWebhook(data, 0)

    // Restore original settings
    if (originalEnv === 'development') {
      if (!originalEnable) {
        delete process.env.ENABLE_PABBLY_WEBHOOK
      } else {
        process.env.ENABLE_PABBLY_WEBHOOK = originalEnable
      }
    }

    return { success: true }
  } catch (error: any) {
    return { 
      success: false, 
      error: error?.message || 'Failed to resend webhook' 
    }
  }
}
