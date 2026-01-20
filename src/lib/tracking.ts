/**
 * Tracking utility for Google Tag Manager, Google Analytics, and Meta Pixel
 * Centralized event tracking for the Lokazen platform
 */

declare global {
  interface Window {
    dataLayer?: any[]
    gtag?: (...args: any[]) => void
    fbq?: (...args: any[]) => void
  }
}

/**
 * Track events to Google Tag Manager dataLayer
 */
export function trackGTM(eventName: string, eventData?: Record<string, any>) {
  if (typeof window === 'undefined' || !window.dataLayer) return
  
  window.dataLayer.push({
    event: eventName,
    ...eventData,
  })
}

/**
 * Track events to Google Analytics
 */
export function trackGA(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window === 'undefined' || !window.gtag) return
  
  window.gtag('event', eventName, eventParams)
}

/**
 * Track events to Meta Pixel
 */
export function trackMeta(eventName: string, eventData?: Record<string, any>) {
  if (typeof window === 'undefined' || !window.fbq) return
  
  window.fbq('track', eventName, eventData)
}

/**
 * Track events to all platforms simultaneously
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, any>,
  platforms: { gtm?: boolean; ga?: boolean; meta?: boolean } = { gtm: true, ga: true, meta: true }
) {
  if (platforms.gtm) trackGTM(eventName, eventData)
  if (platforms.ga) trackGA(eventName, eventData)
  if (platforms.meta) trackMeta(eventName, eventData)
}

/**
 * Platform-specific event tracking functions
 */

// Search & Discovery Events
export function trackSearch(query: string, mode: 'brand' | 'owner') {
  trackEvent('search', {
    search_term: query,
    search_type: mode,
  })
  
  // Meta Pixel Search event
  trackMeta('Search', {
    search_string: query,
    content_type: 'property',
  })
}

export function trackSearchResults(query: string, resultCount: number, mode: 'brand' | 'owner') {
  trackEvent('search_results', {
    search_term: query,
    result_count: resultCount,
    search_type: mode,
  })
}

export function trackPropertyView(propertyId: string, propertyName?: string, location?: string) {
  trackEvent('view_item', {
    item_id: propertyId,
    item_name: propertyName,
    item_category: 'property',
    location: location,
  })
  
  // Meta Pixel specific
  trackMeta('ViewContent', {
    content_ids: [propertyId],
    content_type: 'product',
    content_name: propertyName,
  })
}

export function trackPropertyMatch(propertyId: string, brandId?: string, matchScore?: number) {
  trackEvent('property_match', {
    property_id: propertyId,
    brand_id: brandId,
    match_score: matchScore,
  })
}

// Form & Onboarding Events
export function trackFormStart(formType: 'brand' | 'owner' | 'inquiry' | 'contact') {
  trackEvent('form_start', {
    form_type: formType,
  })
}

export function trackFormComplete(formType: 'brand' | 'owner' | 'inquiry' | 'contact', formData?: Record<string, any>) {
  trackEvent('form_complete', {
    form_type: formType,
    ...formData,
  })
  
  // Meta Pixel conversion
  trackMeta('Lead', {
    content_name: `${formType}_onboarding`,
  })
}

export function trackFormFieldFocus(formType: string, fieldName: string) {
  // Track form field interactions
  trackEvent('form_field_focus', {
    form_type: formType,
    field_name: fieldName,
  })
}

// Engagement Events
export function trackButtonClick(buttonName: string, location?: string) {
  trackEvent('button_click', {
    button_name: buttonName,
    location: location,
  })
}

export function trackInquiry(propertyId: string, propertyName?: string, inquiryType?: string) {
  trackEvent('inquiry', {
    property_id: propertyId,
    property_name: propertyName,
    inquiry_type: inquiryType,
  })
  
  // Meta Pixel conversion
  trackMeta('InitiateCheckout', {
    content_ids: [propertyId],
    content_type: 'product',
    content_name: propertyName,
  })
}

export function trackScheduleViewing(propertyId: string, propertyName?: string) {
  trackEvent('schedule_viewing', {
    property_id: propertyId,
    property_name: propertyName,
  })
  
  // Meta Pixel conversion
  trackMeta('Schedule', {
    content_ids: [propertyId],
    content_type: 'product',
  })
}

// Navigation Events
export function trackPageView(pageName: string, pagePath?: string) {
  trackEvent('page_view', {
    page_name: pageName,
    page_path: pagePath,
  })
}

export function trackFilterApply(filters: Record<string, any>, mode: 'brand' | 'owner') {
  trackEvent('filter_apply', {
    filters: filters,
    mode: mode,
  })
  
  // Meta Pixel ViewCategory event
  const propertyType = filters.propertyType || filters.propertyTypes?.[0]
  const location = filters.location || filters.locations?.[0]
  
  trackMeta('ViewCategory', {
    content_type: 'property_category',
    content_category: propertyType || 'commercial_property',
    content_name: location || 'bangalore',
  })
}

// Conversion Events
export function trackConversion(conversionType: 'property_listed' | 'match_found' | 'inquiry_sent' | 'viewing_scheduled', value?: number, currency?: string) {
  trackEvent('conversion', {
    conversion_type: conversionType,
    value: value,
    currency: currency || 'INR',
  })
  
  // Meta Pixel purchase event for high-value conversions
  if (conversionType === 'property_listed' && value) {
    trackMeta('Purchase', {
      value: value,
      currency: currency || 'INR',
    })
  }
}

// AI Search Events
export function trackAISearch(query: string, responseTime?: number) {
  trackEvent('ai_search', {
    search_query: query,
    response_time_ms: responseTime,
  })
}

export function trackAISearchResult(query: string, resultCount: number) {
  trackEvent('ai_search_result', {
    search_query: query,
    result_count: resultCount,
  })
}

// Brand/Property Card Interactions
export function trackCardClick(cardType: 'property' | 'brand', itemId: string, itemName?: string) {
  trackEvent('card_click', {
    card_type: cardType,
    item_id: itemId,
    item_name: itemName,
  })
}

export function trackAddToWishlist(propertyId: string, propertyName?: string) {
  trackEvent('add_to_wishlist', {
    item_id: propertyId,
    item_name: propertyName,
    item_category: 'property',
  })
  
  // Meta Pixel AddToWishlist event
  trackMeta('AddToWishlist', {
    content_ids: [propertyId],
    content_type: 'product',
    content_name: propertyName,
  })
}

export function trackCompleteRegistration(userType: 'brand' | 'owner' | 'general') {
  trackEvent('complete_registration', {
    user_type: userType,
  })
  
  // Meta Pixel CompleteRegistration event
  trackMeta('CompleteRegistration', {
    content_name: `${userType}_registration`,
    status: 'registered',
  })
}

// Error Tracking
export function trackError(errorType: string, errorMessage: string, location?: string) {
  trackEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
    location: location,
  })
}

