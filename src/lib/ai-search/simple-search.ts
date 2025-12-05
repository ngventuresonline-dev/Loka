/**
 * SIMPLE, ROBUST AI SEARCH
 * No complex state management - just works
 * Enhanced with comprehensive normalization from training datasets
 */

import Anthropic from '@anthropic-ai/sdk'
import { normalizeBudget, normalizeArea, normalizeLocation, disambiguateNumber } from './normalization'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

interface SimpleContext {
  entityType: 'brand' | 'owner' | null
  collectedDetails: Record<string, any>
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
}

/**
 * Enhanced entity type detection based on training dataset
 * PRIMARY BRAND SIGNALS: "our brand", "opening outlet", "expanding", "franchise"
 * PRIMARY OWNER SIGNALS: "have property", "space available", "looking for tenants"
 * Uses confidence scoring to handle ambiguous queries
 */
function detectEntityType(query: string, history: string): 'brand' | 'owner' | null {
  const lower = query.toLowerCase().trim()
  const historyLower = history.toLowerCase()
  
  // PRIMARY BRAND SIGNALS (High Confidence > 90%)
  const primaryBrandSignals = [
    'our brand', 'our restaurant', 'our café', 'our store', 'our outlet',
    'opening our', 'our chain', 'our franchise', 'our business',
    'expanding our', 'opening outlet', 'opening branch',
    'franchise of', 'we are [brand]', 'established [business]',
    'our fashion brand', 'our qsr', 'our retail', 'our gym', 'our salon',
    'our company', 'our chain', 'our concept'
  ]
  
  // SECONDARY BRAND SIGNALS (Medium Confidence 60-90%)
  const secondaryBrandSignals = [
    'looking for space', 'need space for', 'want to open', 'opening restaurant',
    'opening café', 'opening store', 'starting business', 'need location for',
    'searching for space', 'looking to lease', 'expanding to', 'entering market',
    'need retail space', 'want commercial space', 'looking for location',
    'planning to open', 'to open', 'to start', 'to launch', 'to expand',
    'budget is', 'can afford', 'willing to pay', 'budget range'
  ]
  
  // PRIMARY OWNER SIGNALS (High Confidence > 90%)
  const primaryOwnerSignals = [
    'have property', 'have space', 'we own', 'our property', 'our building',
    'property available', 'space available', 'available for rent', 'available for lease',
    'looking for tenants', 'looking for brands', 'seeking brands', 'seeking tenants',
    'property for rent', 'space for rent', 'space for lease', 'property for lease',
    'landlord', 'lessor', 'property owner', 'we are property owners',
    'rent expectation', 'rental income', 'seeking rent', 'rent is',
    'space to offer', 'property to offer', 'looking for occupiers',
    'need tenant', 'need lessee', 'property vacant', 'ready to occupy'
  ]
  
  // SECONDARY OWNER SIGNALS (Medium Confidence 60-90%)
  const secondaryOwnerSignals = [
    'commercial property', 'retail space', 'restaurant space', 'office space',
    'for rent', 'for lease', 'to rent out', 'to lease out',
    'seeking established brands', 'want established brands',
    'property with', 'space with', 'building with' // Offering features
  ]
  
  // Calculate scores
  let brandScore = 0
  let ownerScore = 0
  
  // Check history first (higher weight)
  for (const signal of primaryBrandSignals) {
    if (historyLower.includes(signal)) {
      brandScore += 3 // High weight for primary signals
    }
  }
  
  for (const signal of primaryOwnerSignals) {
    if (historyLower.includes(signal)) {
      ownerScore += 3
    }
  }
  
  for (const signal of secondaryBrandSignals) {
    if (historyLower.includes(signal)) {
      brandScore += 1
    }
  }
  
  for (const signal of secondaryOwnerSignals) {
    if (historyLower.includes(signal)) {
      ownerScore += 1
    }
  }
  
  // Check current query
  for (const signal of primaryBrandSignals) {
    if (lower.includes(signal)) {
      brandScore += 3
    }
  }
  
  for (const signal of primaryOwnerSignals) {
    if (lower.includes(signal)) {
      ownerScore += 3
    }
  }
  
  for (const signal of secondaryBrandSignals) {
    if (lower.includes(signal)) {
      brandScore += 1
    }
  }
  
  for (const signal of secondaryOwnerSignals) {
    if (lower.includes(signal)) {
      ownerScore += 1
    }
  }
  
  // Special cases: "our [business] needs space" = BRAND, "our property needs tenant" = OWNER
  if (lower.includes('our') && (lower.includes('needs space') || lower.includes('need space'))) {
    if (lower.includes('property') || lower.includes('building') || lower.includes('space')) {
      ownerScore += 2 // "our property needs tenant"
    } else {
      brandScore += 2 // "our café needs space"
    }
  }
  
  // Special case: "looking for [brand type]" = OWNER, "looking for space" = BRAND
  if (lower.includes('looking for')) {
    if (lower.includes('brand') || lower.includes('tenant') || lower.includes('lessee') || 
        lower.includes('occupier') || lower.includes('restaurant brand') || 
        lower.includes('café brand') || lower.includes('retail brand')) {
      ownerScore += 2 // "looking for brands" = owner
    } else if (lower.includes('space') || lower.includes('location') || lower.includes('property')) {
      brandScore += 2 // "looking for space" = brand
    }
  }
  
  // Special case: "rent expectation" = OWNER, "budget" = BRAND
  if (lower.includes('rent expectation') || lower.includes('rental income') || 
      lower.includes('seeking rent') || lower.includes('rent is')) {
    ownerScore += 2
  }
  if (lower.includes('budget is') || lower.includes('budget range') || 
      lower.includes('can afford') || lower.includes('willing to pay')) {
    brandScore += 2
  }
  
  // Decision logic
  // High confidence: Clear winner with score >= 2
  if (brandScore >= 2 && brandScore > ownerScore) {
    return 'brand'
  }
  if (ownerScore >= 2 && ownerScore > brandScore) {
    return 'owner'
  }
  
  // Medium confidence: One side has advantage
  if (brandScore > ownerScore && brandScore >= 1) {
    return 'brand'
  }
  if (ownerScore > brandScore && ownerScore >= 1) {
    return 'owner'
  }
  
  // Legacy checks (fallback)
  if (lower.includes('im a brand') || lower.includes('i am a brand') ||
      lower.includes('i\'m a brand') || lower === '1' || lower === 'option 1') {
    return 'brand'
  }
  if (lower === '2' || lower === 'option 2' || lower.includes('property owner') ||
      lower.includes('landlord') || lower.includes('listing')) {
    return 'owner'
  }
  
  // Ambiguous: return null to trigger clarification
  return null
}

/**
 * Extract details from natural language - CONTEXT-AWARE VERSION
 */
function extractDetailsSimple(
  query: string, 
  entityType: 'brand' | 'owner',
  context?: SimpleContext
): Record<string, any> {
  const details: any = {}
  const lower = query.toLowerCase().trim()
  const queryTrimmed = query.trim()
  
  // Check what was asked last (context-aware extraction)
  const lastQuestion = context?.conversationHistory && context.conversationHistory.length > 0
    ? context.conversationHistory[context.conversationHistory.length - 1]?.content.toLowerCase() || ''
    : ''
  const isRentContext = lastQuestion.includes('rent') || lastQuestion.includes('budget') || lastQuestion.includes('monthly')
  const isSizeContext = lastQuestion.includes('size') || lastQuestion.includes('sqft') || lastQuestion.includes('area')
  const isLocationContext = lastQuestion.includes('location') || lastQuestion.includes('where') || lastQuestion.includes('city')
  
  // Extract location - enhanced patterns from training dataset
  // Pattern 1: Explicit location mentions ("in Koramangala", "near MG Road")
  let locationMatch = query.match(/(?:in|on|at|near|around|location|space in|looking for|need space in|prefer|preferably)[\s:]+([A-Z][a-zA-Z\s,]+)/i) ||
                      query.match(/(?:in|on|at|near|around|location|prefer|preferably)[\s:]+([a-z][a-zA-Z\s,]+)/i)
  
  // Pattern 2: Direct location names (Bangalore areas)
  if (!locationMatch) {
    locationMatch = query.match(/\b(koramangala|whitefield|indiranagar|hbr|hsr|marathahalli|btm|jayanagar|malleshwaram|rajajinagar|basavanagudi|vijayanagar|yeshwanthpur|hebbal|electronic city|bommanahalli|kundalahalli|sarjapur|bellandur|varthur|kadubeesanahalli|domlur|ulsoor|richmond town|lavelle road|mg road|brigade road|commercial street|church street|st marks road|residency road|cunningham road|sadashivanagar|malleswaram|rt nagar|mathikere|peenya|chamrajpet|gandhinagar|sampangiramnagar|shivajinagar|frazer town|langford town|ashok nagar|sadashivnagar|banashankari|jayalakshmipuram|bangalore|bengaluru|ub city|forum mall|phoenix mall|orion mall|mantri mall|garuda mall)\b/i)
  }
  
  // Pattern 3: Multiple locations ("Koramangala or Indiranagar")
  if (!locationMatch) {
    const multiLocationMatch = query.match(/([A-Z][a-zA-Z\s]+)\s*(?:or|and|,)\s*([A-Z][a-zA-Z\s]+)/i)
    if (multiLocationMatch) {
      const loc1 = normalizeLocation(multiLocationMatch[1].trim())
      const loc2 = normalizeLocation(multiLocationMatch[2].trim())
      if (loc1.confidence > 0.5 && loc2.confidence > 0.5) {
        details.preferredLocations = [loc1.official, loc2.official]
        locationMatch = multiLocationMatch // Set to continue processing
      }
    }
  }
  
  // Pattern 4: Context-based (if asked about location)
  if (!locationMatch && isLocationContext) {
    locationMatch = query.match(/([A-Z][a-zA-Z\s,]+)/) || query.match(/([a-z][a-zA-Z\s,]+)/)
  }
  
  // Pattern 5: Landmark-based ("near Forum Mall", "near IT parks")
  if (!locationMatch) {
    const landmarkMatch = query.match(/(?:near|close to|around)\s+([A-Z][a-zA-Z\s]+)/i)
    if (landmarkMatch) {
      details.locationPreference = `near ${landmarkMatch[1].trim()}`
    }
  }
  
  // Use normalization for any location found
  if (locationMatch && !isRentContext && !isSizeContext) {
    const loc = locationMatch[1]?.trim() || locationMatch[0]?.trim()
    // Filter out common false positives
    if (loc && !loc.match(/^(rent|monthly|deposit|size|sqft|\d+|im|a|brand|need|space|looking|for|i|am|budget|lakhs|thousand|k)$/i)) {
      const normalizedLoc = normalizeLocation(loc)
      if (normalizedLoc.confidence > 0.5) {
        if (!details.preferredLocations) {
          details.location = normalizedLoc.official
        }
      } else {
        // Fallback: capitalize first letter of each word
        const formattedLoc = loc.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
        if (!details.preferredLocations) {
          details.location = formattedLoc
        }
      }
    }
  }
  
  // Extract size using comprehensive normalization
  const areaResult = normalizeArea(query, { currentTopic: isSizeContext ? 'discussing_area' : undefined })
  if (areaResult.confidence > 0.6) {
    if (entityType === 'owner') {
      if (areaResult.value) {
        details.size = areaResult.value
      } else if (areaResult.preferred) {
        details.size = areaResult.preferred
      } else if (areaResult.min) {
        details.size = areaResult.min
      }
    } else {
      // For brands, use minSize/maxSize
      if (areaResult.min && areaResult.max) {
        details.minSize = areaResult.min
        details.maxSize = areaResult.max
      } else if (areaResult.value) {
        details.minSize = areaResult.value
        details.maxSize = areaResult.value
      } else if (areaResult.preferred) {
        details.minSize = areaResult.preferred
        details.maxSize = areaResult.preferred
      }
    }
  }
  
  // Fallback: Extract size range (e.g., "500-1000 sqft", "500 to 1000")
  if (!details.size && !details.minSize) {
    const sizeRangeMatch = query.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*(?:sqft|sq\.?ft\.?|square\s*feet)/i)
    if (sizeRangeMatch) {
      if (entityType === 'owner') {
        details.size = parseInt(sizeRangeMatch[1])
      } else {
        details.minSize = parseInt(sizeRangeMatch[1])
        details.maxSize = parseInt(sizeRangeMatch[2])
      }
    }
  }
  
  // For owners, if asked about size and user gives plain number, extract it
  if (entityType === 'owner' && isSizeContext && /^\d+$/.test(query.trim()) && !details.size) {
    const sizeValue = parseInt(query.trim())
    if (sizeValue > 0 && sizeValue < 100000) { // Reasonable size range
      details.size = sizeValue
    }
  }
  
  // Extract rent/budget - CONTEXT-AWARE: If last question was about rent/budget, ANY number is rent/budget
  // CRITICAL: Also check if query is a plain number - if so and last question was about budget/rent, extract it
  const isPlainNumber = /^\d+$/.test(query.trim())
  const lastQuestionHasBudget = lastQuestion.includes('budget') || lastQuestion.includes('rent') || lastQuestion.includes('monthly')
  
  if (isRentContext || (isPlainNumber && lastQuestionHasBudget)) {
    // If asking for rent/budget and user gives a number, it's rent/budget
    const numberMatch = query.match(/^(\d+)$/) || query.match(/(\d+)/)
    if (numberMatch) {
      const num = parseInt(numberMatch[1])
      console.log('[ExtractDetails] Extracting rent/budget:', { num, entityType, isRentContext, isPlainNumber, lastQuestionHasBudget })
      // For brands, use "budget", for owners use "rent"
      if (entityType === 'brand') {
        // Smart interpretation: large numbers (>= 10000) are exact amounts (e.g., 98000, 980000)
        // Medium numbers (100-9999) might be thousands (e.g., 50 = 50,000)
        // Small numbers (< 100) are lakhs (e.g., 3 = 300,000)
        let budgetAmount: number
        if (num >= 10000) {
          budgetAmount = num // Exact amount (e.g., 98000, 980000)
        } else if (num >= 100) {
          budgetAmount = num * 1000 // Assume thousands (e.g., 50 = 50,000)
        } else {
          budgetAmount = num * 100000 // Assume lakhs (e.g., 3 = 300,000)
        }
        // Set as budget range (min/max)
        if (!context?.collectedDetails?.budgetRange?.min) {
          details.budgetRange = { min: budgetAmount, max: budgetAmount, currency: 'INR' }
        } else if (!context?.collectedDetails?.budgetRange?.max) {
          details.budgetRange = { ...context.collectedDetails.budgetRange, max: budgetAmount }
        }
      } else {
        // Owner rent - same logic
        if (num >= 10000) {
          details.rent = num // Exact amount
        } else if (num >= 100) {
          details.rent = num * 1000 // Assume thousands
        } else {
          details.rent = num * 100000 // Assume lakhs
        }
      }
      console.log('[ExtractDetails] Extracted:', entityType === 'brand' ? `budgetRange=${JSON.stringify(details.budgetRange)}` : `rent=${details.rent}`)
    }
  } else {
    // Use comprehensive normalization for budget/rent
    const budgetResult = normalizeBudget(query, { currentTopic: isRentContext ? 'discussing_budget' : undefined })
    if (budgetResult.confidence > 0.6) {
      if (entityType === 'brand') {
        if (budgetResult.min && budgetResult.max) {
          details.budgetRange = {
            min: budgetResult.min,
            max: budgetResult.max,
            currency: 'INR'
          }
        } else if (budgetResult.value) {
          details.budgetRange = {
            min: budgetResult.value,
            max: budgetResult.value,
            currency: 'INR'
          }
        } else if (budgetResult.preferred) {
          details.budgetRange = {
            min: budgetResult.preferred,
            max: budgetResult.preferred,
            currency: 'INR'
          }
        }
      } else {
        if (budgetResult.value) {
          details.rent = budgetResult.value
        } else if (budgetResult.preferred) {
          details.rent = budgetResult.preferred
        } else if (budgetResult.min) {
          details.rent = budgetResult.min
        }
      }
    }
  }
  
  // Extract company name
  if (entityType === 'brand' && (lastQuestion.includes('company') || lastQuestion.includes('business'))) {
    const companyMatch = query.match(/(?:my|our|the)\s+(?:company|business|brand)\s+(?:is|name is|called)?\s*([A-Z][a-zA-Z\s&]+)/i) ||
                         query.match(/^([A-Z][a-zA-Z\s&]+)$/)
    if (companyMatch && companyMatch[1].length > 2 && companyMatch[1].length < 50) {
      details.companyName = companyMatch[1].trim()
    }
  }
  
  // Extract industry - Enhanced from training dataset
  // Can extract from any query, not just when asked
  if (entityType === 'brand') {
    // F&B Industry patterns
    if (lower.includes('restaurant') || lower.includes('cafe') || lower.includes('café') ||
        lower.includes('qsr') || lower.includes('quick service') || lower.includes('fast food') ||
        lower.includes('food court') || lower.includes('cloud kitchen') || lower.includes('dark kitchen') ||
        lower.includes('ghost kitchen') || lower.includes('commissary') || lower.includes('brewery') ||
        lower.includes('microbrewery') || lower.includes('pub') || lower.includes('bar') ||
        lower.includes('lounge') || lower.includes('nightclub') || lower.includes('gastro pub') ||
        lower.includes('bakery') || lower.includes('patisserie') || lower.includes('dessert') ||
        lower.includes('ice cream') || lower.includes('food business') || lower.includes('f&b')) {
      details.industry = 'food_beverage'
    }
    // Retail Industry patterns
    else if (lower.includes('retail') || lower.includes('shop') || lower.includes('store') ||
             lower.includes('boutique') || lower.includes('fashion') || lower.includes('apparel') ||
             lower.includes('clothing') || lower.includes('electronics') || lower.includes('mobile store') ||
             lower.includes('showroom') || lower.includes('lifestyle') || lower.includes('home décor') ||
             lower.includes('furniture') || lower.includes('bookstore') || lower.includes('pet store') ||
             lower.includes('toy store') || lower.includes('gift store') || lower.includes('stationery')) {
      details.industry = 'retail'
    }
    // Fitness/Wellness Industry
    else if (lower.includes('gym') || lower.includes('fitness') || lower.includes('wellness') ||
             lower.includes('salon') || lower.includes('spa') || lower.includes('yoga') ||
             lower.includes('dance studio') || lower.includes('martial arts') || lower.includes('boxing') ||
             lower.includes('sports academy') || lower.includes('badminton') || lower.includes('swimming') ||
             lower.includes('climbing gym') || lower.includes('multisport')) {
      details.industry = 'fitness'
    }
    // Tech Industry
    else if (lower.includes('tech') || lower.includes('software') || lower.includes('it') ||
             lower.includes('gaming') || lower.includes('vr') || lower.includes('arcade') ||
             lower.includes('esports') || lower.includes('gaming zone') || lower.includes('gaming café')) {
      details.industry = 'tech'
    }
    // Healthcare Industry
    else if (lower.includes('healthcare') || lower.includes('medical') || lower.includes('clinic') ||
             lower.includes('dental') || lower.includes('diagnostic') || lower.includes('pharmacy') ||
             lower.includes('polyclinic') || lower.includes('physiotherapy') || lower.includes('eye clinic')) {
      details.industry = 'healthcare'
    }
    // Professional Services
    else if (lower.includes('bank') || lower.includes('financial') || lower.includes('insurance') ||
             lower.includes('office') || lower.includes('workspace') || lower.includes('coworking')) {
      details.industry = 'professional'
    }
    // Entertainment
    else if (lower.includes('entertainment') || lower.includes('gaming zone') || lower.includes('bowling') ||
             lower.includes('karting') || lower.includes('trampoline') || lower.includes('play area') ||
             lower.includes('kids entertainment') || lower.includes('preschool') || lower.includes('daycare') ||
             lower.includes('montessori') || lower.includes('play school')) {
      // Entertainment can map to different industries, but for now keep as other
      details.industry = 'other'
    }
  }
  
  // Extract company size
  if (entityType === 'brand' && lastQuestion.includes('company size')) {
    if (lower.includes('startup') || lower.includes('1-10') || lower.includes('small team')) {
      details.companySize = 'startup'
    } else if (lower.includes('small') || lower.includes('11-50')) {
      details.companySize = 'small'
    } else if (lower.includes('medium') || lower.includes('51-200')) {
      details.companySize = 'medium'
    } else if (lower.includes('large') || lower.includes('201-1000')) {
      details.companySize = 'large'
    } else if (lower.includes('enterprise') || lower.includes('1000+')) {
      details.companySize = 'enterprise'
    }
  }
  
  // Extract property types - Enhanced from training dataset
  // Can extract from any query, not just when asked
  if (entityType === 'brand') {
    const propertyTypes: string[] = []
    
    // Office/Workspace
    if (lower.includes('office') || lower.includes('workspace') || lower.includes('coworking')) {
      propertyTypes.push('office')
    }
    
    // Retail
    if (lower.includes('retail') || lower.includes('shop') || lower.includes('store') ||
        lower.includes('boutique') || lower.includes('showroom') || lower.includes('mall space') ||
        lower.includes('high street') || lower.includes('street-facing')) {
      propertyTypes.push('retail')
    }
    
    // Restaurant/F&B
    if (lower.includes('restaurant') || lower.includes('cafe') || lower.includes('café') ||
        lower.includes('food court') || lower.includes('qsr') || lower.includes('dining') ||
        lower.includes('kitchen') || lower.includes('bar') || lower.includes('brewery')) {
      propertyTypes.push('restaurant')
    }
    
    // Warehouse/Industrial
    if (lower.includes('warehouse') || lower.includes('storage') || lower.includes('industrial') ||
        lower.includes('basement') || lower.includes('commissary') || lower.includes('dark kitchen')) {
      propertyTypes.push('warehouse')
    }
    
    // Mall/Commercial
    if (lower.includes('mall') || lower.includes('food court') || lower.includes('kiosk')) {
      if (!propertyTypes.includes('retail')) propertyTypes.push('retail')
    }
    
    // Standalone
    if (lower.includes('standalone') || lower.includes('building') || lower.includes('heritage')) {
      // Can be restaurant or retail, already captured above
    }
    
    if (propertyTypes.length > 0) {
      details.propertyTypes = propertyTypes
    }
  }
  
  // Extract lease length
  if (entityType === 'brand' && (lastQuestion.includes('lease') || lastQuestion.includes('term'))) {
    if (lower.includes('short') || lower.includes('<1') || lower.includes('less than 1')) {
      details.leaseLength = 'short_term'
    } else if (lower.includes('medium') || lower.includes('1-3') || lower.includes('1 to 3')) {
      details.leaseLength = 'medium_term'
    } else if (lower.includes('long') || lower.includes('3+') || lower.includes('more than 3')) {
      details.leaseLength = 'long_term'
    }
  }
  
  // Extract expected footfall - Enhanced to handle simple responses
  if (entityType === 'brand' && (lastQuestion.includes('footfall') || lastQuestion.includes('expected footfall'))) {
    // Handle simple responses: "high", "medium", "low"
    const footfallLower = query.trim().toLowerCase()
    if (footfallLower === 'high' || footfallLower === 'medium' || footfallLower === 'low' ||
        footfallLower.includes('high') || footfallLower.includes('medium') || footfallLower.includes('low')) {
      if (footfallLower.includes('high') || footfallLower.includes('retail') || footfallLower.includes('restaurant')) {
        details.expectedFootfall = 'high'
      } else if (footfallLower.includes('medium') || footfallLower.includes('regular')) {
        details.expectedFootfall = 'medium'
      } else if (footfallLower.includes('low') || footfallLower.includes('office')) {
        details.expectedFootfall = 'low'
      }
    }
    // Also check for full phrases
    if (!details.expectedFootfall) {
      if (lower.includes('low') || lower.includes('office-based')) {
        details.expectedFootfall = 'low'
      } else if (lower.includes('medium') || lower.includes('regular customers')) {
        details.expectedFootfall = 'medium'
      } else if (lower.includes('high') || lower.includes('retail') || lower.includes('restaurant')) {
        details.expectedFootfall = 'high'
      }
    }
  }
  
  // Extract operating hours
  if (entityType === 'brand' && (lastQuestion.includes('operating') || lastQuestion.includes('hours'))) {
    const hoursMatch = query.match(/(\d{1,2}\s*(?:am|pm)?\s*-\s*\d{1,2}\s*(?:am|pm)?)/i) ||
                       query.match(/(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/i)
    if (hoursMatch) {
      details.operatingHours = hoursMatch[1]
    }
  }
  
  // Extract amenities
  if (entityType === 'brand' && lastQuestion.includes('amenit')) {
    const amenities = ['WiFi', 'Parking', 'Security', 'Air Conditioning', 'Kitchen', 'Conference Rooms', 'Accessibility', 'Public Transport']
    const foundAmenities: string[] = []
    for (const amenity of amenities) {
      if (lower.includes(amenity.toLowerCase().replace(' ', '')) || lower.includes(amenity.toLowerCase())) {
        foundAmenities.push(amenity)
      }
    }
    if (foundAmenities.length > 0) {
      details.mustHaveAmenities = foundAmenities
    }
  }
  
  return details
}

/**
 * Generate intelligent response using Claude - SIMPLE VERSION
 */
async function generateResponse(
  query: string,
  entityType: 'brand' | 'owner',
  context: SimpleContext
): Promise<string> {
  try {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.trim() === '') {
      console.warn('[SimpleSearch] ANTHROPIC_API_KEY not configured, using fallback')
      throw new Error('API key not configured')
    }

    const history = (context.conversationHistory || [])
      .slice(-6) // Last 6 messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n')

    const systemPrompt = entityType === 'owner' 
      ? `You are a helpful assistant helping property owners list their commercial properties. 
Be conversational, friendly, and ask ONE question at a time. 
You've collected: ${JSON.stringify(context.collectedDetails)}
Ask for the NEXT missing detail. If you have location, size, and rent, guide them to the listing form.
NEVER ask about budget - owners have rent, not budget.`
      : `You are a helpful assistant helping brands find commercial properties.
Be conversational, friendly, and ask ONE question at a time.
You've collected: ${JSON.stringify(context.collectedDetails)}

Ask questions in this order (only ask what's missing):
1. Industry (Retail, Food & Beverage, Technology, Healthcare, Fitness, Professional Services)
2. Location (city and area)
3. Space size (min/max sqft or range)
4. Budget range (monthly, e.g., ₹50k - ₹1 lakh)
5. Property types (Office, Retail, Restaurant, Warehouse)
6. Lease length (Short term <1 year, Medium term 1-3 years, Long term 3+ years)
7. Expected footfall (Low, Medium, High)
8. Operating hours (e.g., 9 AM - 6 PM, Mon-Fri)
9. Must-have amenities (WiFi, Parking, Security, Air Conditioning, etc.)

NEVER ask about "rent you're expecting" - brands have budget, not rent. Ask "What's your monthly budget range?" instead.`

    const userPrompt = `User said: "${query}"

${history ? `Previous conversation:\n${history}\n` : ''}

Generate a helpful, conversational response (2-3 sentences max). Ask ONE question if you need more info.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.7,
    })

    const response = message.content?.[0]
    if (response && response.type === 'text') {
      return response.text.trim()
    }
    
    console.warn('[SimpleSearch] Invalid API response format:', JSON.stringify(message.content, null, 2))
    throw new Error('Invalid response from API')
  } catch (error: any) {
    console.error('[SimpleSearch] API error:', error.message)
    
    // Fallback to rule-based response
    return generateFallbackResponse(query, entityType, context)
  }
}

/**
 * Fallback response when API fails - CONTEXT-AWARE
 */
function generateFallbackResponse(
  query: string,
  entityType: 'brand' | 'owner',
  context: SimpleContext
): string {
  const details = context.collectedDetails || {}
  const lastQuestion = context.conversationHistory && context.conversationHistory.length > 0
    ? context.conversationHistory[context.conversationHistory.length - 1]?.content.toLowerCase() || ''
    : ''
  
  // Check if we just collected rent/budget
  if ((lastQuestion.includes('rent') || lastQuestion.includes('budget')) && /^\d+$/.test(query.trim())) {
    // User just provided rent/budget - acknowledge and check what's next
    if (entityType === 'owner') {
      const rent = details.rent
      if (!details.location) {
        return `Perfect! I've noted ₹${rent?.toLocaleString('en-IN') || query}/month. Where is your property located?`
      }
      if (!details.size) {
        return `Great! Rent noted. What's the size of your property? (e.g., 500 sqft)`
      }
      return `Excellent! I have all the details. Let me take you to the listing form!`
  } else {
    // Brand
    const budgetRange = details.budgetRange || details.budget
    const budgetDisplay = budgetRange?.min ? `₹${budgetRange.min.toLocaleString('en-IN')}` : (budgetRange ? `₹${budgetRange.toLocaleString('en-IN')}` : query)
    if (!details.location && !details.preferredLocations) {
      return `Perfect! Budget noted: ${budgetDisplay}/month. Where are you looking for space?`
    }
    if (!details.minSize && !details.maxSize) {
      return `Great! Budget noted. What size space are you looking for? (e.g., 500 sqft, or 1000-2000 sqft for a range)`
    }
    // Continue with next question based on what's missing
    if (!details.propertyTypes || details.propertyTypes.length === 0) {
      return `Perfect! What type of property are you looking for? (e.g., Office, Retail, Restaurant, Warehouse)`
    }
    if (!details.leaseLength) {
      return `Great! What lease length are you looking for? (Short term <1 year, Medium term 1-3 years, or Long term 3+ years)`
    }
    if (!details.expectedFootfall) {
      return `Perfect! What's your expected footfall? (Low for office-based, Medium for regular customers, High for retail/restaurant)`
    }
    if (!details.operatingHours) {
      return `Got it! What are your operating hours? (e.g., 9 AM - 6 PM, Mon-Fri)`
    }
    if (!details.mustHaveAmenities || details.mustHaveAmenities.length === 0) {
      return `Excellent! What amenities are must-haves for you? (e.g., WiFi, Parking, Security, Air Conditioning)`
    }
    return `Excellent! I have all the details. Let me search for the best matches for you!`
  }
  }
  
  // Check if we just collected size
  if ((lastQuestion.includes('size') || lastQuestion.includes('sqft') || lastQuestion.includes('area')) && 
      (details.size || details.minSize || details.maxSize || /^\d+$/.test(query.trim()))) {
    if (entityType === 'owner') {
      // Force extract if it's a plain number
      if (/^\d+$/.test(query.trim()) && !details.size) {
        const sizeValue = parseInt(query.trim())
        if (sizeValue > 0 && sizeValue < 100000) {
          details.size = sizeValue
        }
      }
      if (!details.rent) {
        return `Perfect! Size noted: ${details.size || query} sqft. What's the monthly rent you're expecting?`
      }
      return `Excellent! I have all the key details. Let me take you to the listing form!`
    } else {
      if (!details.budgetRange && !details.budget) {
        return `Perfect! Size noted: ${details.minSize || details.maxSize || query} sqft. What's your monthly budget range? (e.g., ₹50k - ₹1 lakh)`
      }
      // Continue with next question
      if (!details.propertyTypes || details.propertyTypes.length === 0) {
        return `Great! What type of property are you looking for? (e.g., Office, Retail, Restaurant, Warehouse)`
      }
      if (!details.leaseLength) {
        return `Perfect! What lease length are you looking for? (Short term <1 year, Medium term 1-3 years, or Long term 3+ years)`
      }
      if (!details.expectedFootfall) {
        return `Great! What's your expected footfall? (Low for office-based, Medium for regular customers, High for retail/restaurant)`
      }
      if (!details.operatingHours) {
        return `Got it! What are your operating hours? (e.g., 9 AM - 6 PM, Mon-Fri)`
      }
      if (!details.mustHaveAmenities || details.mustHaveAmenities.length === 0) {
        return `Excellent! What amenities are must-haves for you? (e.g., WiFi, Parking, Security, Air Conditioning)`
      }
      return `Excellent! I have all the details. Let me search for the best matches for you!`
    }
  }
  
  // Check if we just collected footfall
  if ((lastQuestion.includes('footfall') || lastQuestion.includes('expected footfall')) && 
      (details.expectedFootfall || /^(high|medium|low)$/i.test(query.trim()))) {
    // Force extract if it's a simple response
    if (/^(high|medium|low)$/i.test(query.trim()) && !details.expectedFootfall) {
      const footfallLower = query.trim().toLowerCase()
      details.expectedFootfall = footfallLower
    }
    // Move to next question
    if (!details.operatingHours) {
      return `Perfect! Footfall noted: ${details.expectedFootfall || query}. What are your operating hours? (e.g., 9 AM - 6 PM, Mon-Fri)`
    }
    if (!details.mustHaveAmenities || details.mustHaveAmenities.length === 0) {
      return `Great! What amenities are must-haves for you? (e.g., WiFi, Parking, Security, Air Conditioning)`
    }
    return `Excellent! I have all the details. Let me search for the best matches for you!`
  }
  
  // Check if we just collected location
  if ((lastQuestion.includes('location') || lastQuestion.includes('where')) && details.location) {
    if (entityType === 'owner') {
      if (!details.size) {
        return `Perfect! Location noted: ${details.location}. What's the size of your property? (e.g., 500 sqft)`
      }
    } else {
      if (!details.minSize && !details.maxSize) {
        return `Perfect! Location noted: ${details.location || details.preferredLocations}. What size space are you looking for? (e.g., 500 sqft, or 1000-2000 sqft)`
      }
      if (!details.budgetRange && !details.budget) {
        return `Great! What's your monthly budget range? (e.g., ₹50k - ₹1 lakh)`
      }
    }
  }
  
  // Normal flow
  if (entityType === 'owner') {
    if (!details.location) {
      return "Great! I'd love to help you list your property. Where is your property located? (Please share the city and area)"
    }
    if (!details.size) {
      return "Perfect! What's the size of your property? (e.g., 500 sqft, 1000 sqft)"
    }
    if (!details.rent) {
      return "Excellent! What's the monthly rent you're expecting for this property?"
    }
    return "Perfect! I have all the key details. Let me take you to the listing form where everything will be pre-filled."
  } else {
    // BRAND FLOW: Follow onboarding form structure
    // Step 1: Company Information (optional, can skip)
    if (!details.industry) {
      return "Great! What industry is your business in? (e.g., Retail, Food & Beverage, Technology, Healthcare, Fitness, Professional Services)"
    }
    
    // Step 2: Location Preferences
    if (!details.location && !details.preferredLocations) {
      return "Perfect! Where are you looking for space? (Please share the city and area, e.g., Bangalore, Koramangala)"
    }
    
    // Step 3: Budget & Requirements
    if (!details.minSize && !details.maxSize) {
      return "Got it! What size space are you looking for? (e.g., 500 sqft, 1000-2000 sqft, or a range)"
    }
    
    if (!details.budgetRange || (!details.budgetRange.min && !details.budgetRange.max)) {
      return "Excellent! What's your monthly budget range? (e.g., ₹50,000 - ₹1,00,000 or ₹50k - ₹1 lakh)"
    }
    
    if (!details.propertyTypes || details.propertyTypes.length === 0) {
      return "Perfect! What type of property are you looking for? (e.g., Office, Retail, Restaurant, Warehouse - you can select multiple)"
    }
    
    if (!details.leaseLength) {
      return "Great! What lease length are you looking for? (Short term <1 year, Medium term 1-3 years, or Long term 3+ years)"
    }
    
    // Step 4: Business Requirements
    if (!details.expectedFootfall) {
      return "What's your expected footfall? (Low for office-based, Medium for regular customers, High for retail/restaurant)"
    }
    
    if (!details.operatingHours) {
      return "What are your operating hours? (e.g., 9 AM - 6 PM, Mon-Fri)"
    }
    
    if (!details.mustHaveAmenities || details.mustHaveAmenities.length === 0) {
      return "Finally, what amenities are must-haves for you? (e.g., WiFi, Parking, Security, Air Conditioning, Kitchen, Conference Rooms, Accessibility, Public Transport)"
    }
    
    // All questions answered - ready to search/show properties
    return "Perfect! I have all the details. Let me search for the best matches for you!"
  }
}

/**
 * Main search function - SIMPLE AND ROBUST
 */
export async function simpleSearch(
  query: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  previousContext?: SimpleContext
): Promise<{
  message: string
  entityType: 'brand' | 'owner' | null
  collectedDetails: Record<string, any>
  readyToRedirect?: boolean
}> {
  // Build history string (handle empty arrays)
  const historyString = (conversationHistory || [])
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  // Detect entity type
  let entityType = previousContext?.entityType || detectEntityType(query, historyString)
  
  // If still null, ask for clarification (matching training dataset template)
  if (!entityType) {
    return {
      message: "Just to clarify - are you:\n\n1. Looking for space for your business (Brand/Tenant) 🏪\n2. Offering space you own (Property Owner) 🏢\n\nThis helps me understand your requirements better.",
      entityType: null,
      collectedDetails: {}
    }
  }

  // Build context for extraction
  const extractionContext: SimpleContext = {
    entityType,
    collectedDetails: previousContext?.collectedDetails || {},
    conversationHistory: conversationHistory || []
  }
  
  // REFERENCE RESOLUTION: Handle "it", "same", "that", etc.
  let resolvedQuery = query
  const lastAssistantMsg = conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1]?.role === 'assistant'
    ? conversationHistory[conversationHistory.length - 1].content.toLowerCase()
    : ''
  const lastUserMsg = conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1]?.role === 'user'
    ? conversationHistory[conversationHistory.length - 1].content
    : ''
  
  // Resolve references
  if (query.toLowerCase().includes('it') || query.toLowerCase().includes('that') || query.toLowerCase().includes('same')) {
    // "increase it to 3.5" -> "increase budget to 3.5"
    if (lastAssistantMsg.includes('budget') || lastAssistantMsg.includes('rent')) {
      resolvedQuery = query.replace(/\b(it|that)\b/gi, 'budget')
    } else if (lastAssistantMsg.includes('size') || lastAssistantMsg.includes('sqft') || lastAssistantMsg.includes('area')) {
      resolvedQuery = query.replace(/\b(it|that)\b/gi, 'size')
    } else if (lastAssistantMsg.includes('location') || lastAssistantMsg.includes('where')) {
      resolvedQuery = query.replace(/\b(it|that)\b/gi, 'location')
    }
    
    // "same location" -> use last mentioned location
    if (query.toLowerCase().includes('same location')) {
      const lastLocation = previousContext?.collectedDetails?.location || previousContext?.collectedDetails?.preferredLocations?.[0]
      if (lastLocation) {
        resolvedQuery = query.replace(/same location/gi, lastLocation)
      }
    }
    
    // "same size" -> use last mentioned size
    if (query.toLowerCase().includes('same size')) {
      const lastSize = previousContext?.collectedDetails?.minSize || previousContext?.collectedDetails?.maxSize || previousContext?.collectedDetails?.size
      if (lastSize) {
        resolvedQuery = query.replace(/same size/gi, `${lastSize} sqft`)
      }
    }
    
    // "bigger" or "larger" -> increase size
    if (query.toLowerCase().includes('bigger') || query.toLowerCase().includes('larger')) {
      const lastSize = previousContext?.collectedDetails?.minSize || previousContext?.collectedDetails?.maxSize || previousContext?.collectedDetails?.size
      if (lastSize && lastAssistantMsg.includes('size')) {
        const increaseMatch = query.match(/(\d+)/)
        if (increaseMatch) {
          const increase = parseInt(increaseMatch[1])
          resolvedQuery = query.replace(/bigger|larger/gi, `${lastSize + increase} sqft`)
        } else {
          // Default increase by 20%
          resolvedQuery = query.replace(/bigger|larger/gi, `${Math.round(lastSize * 1.2)} sqft`)
        }
      }
    }
  }
  
  console.log('[SimpleSearch] Original query:', query)
  console.log('[SimpleSearch] Resolved query:', resolvedQuery)
  
  // Extract simple details (with context awareness)
  let newDetails: Record<string, any> = {}
  try {
    newDetails = extractDetailsSimple(resolvedQuery, entityType, extractionContext)
  } catch (error: any) {
    console.error('[SimpleSearch] Error extracting details:', error.message)
    // Continue with empty details
  }
  
  // Merge with previous details (don't overwrite existing non-empty values)
  const collectedDetails: Record<string, any> = {
    ...(previousContext?.collectedDetails || {})
  }
  
  // Only add new details if they're not empty
  Object.keys(newDetails).forEach(key => {
    if (newDetails[key] !== undefined && newDetails[key] !== null && newDetails[key] !== '') {
      collectedDetails[key] = newDetails[key]
    }
  })
  
  console.log('[SimpleSearch] Extracted:', newDetails)
  console.log('[SimpleSearch] Collected so far:', collectedDetails)

  // Check if we have enough for owner redirect
  if (entityType === 'owner' && collectedDetails.location && collectedDetails.size && collectedDetails.rent) {
    return {
      message: `Perfect! I have all the key details:\n\n📍 Location: ${collectedDetails.location}\n📐 Size: ${collectedDetails.size} sqft\n💰 Rent: ₹${collectedDetails.rent.toLocaleString('en-IN')}/month\n\nLet me take you to the listing form!`,
      entityType,
      collectedDetails,
      readyToRedirect: true
    }
  }

  // Update conversation history
  const updatedHistory = [
    ...(conversationHistory || []),
    { role: 'user' as const, content: query }
  ]

  // Generate response
  const context: SimpleContext = {
    entityType,
    collectedDetails,
    conversationHistory: updatedHistory
  }

  // CRITICAL: Check if we just collected a value that was asked for
  // If so, use fallback response immediately (don't call Claude)
  const lastAssistantMessage = conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1]?.role === 'assistant'
    ? conversationHistory[conversationHistory.length - 1].content.toLowerCase()
    : ''
  
  console.log('[SimpleSearch] Last assistant message:', lastAssistantMessage.substring(0, 50))
  console.log('[SimpleSearch] Query:', query)
  console.log('[SimpleSearch] Collected details:', collectedDetails)
  
  // Check if query is a plain number (likely answer to a question)
  const isPlainNumber = /^\d+$/.test(query.trim())
  const askedForBudget = lastAssistantMessage.includes('budget') || lastAssistantMessage.includes('rent')
  const askedForSize = lastAssistantMessage.includes('size') || lastAssistantMessage.includes('sqft') || lastAssistantMessage.includes('area')
  const askedForLocation = lastAssistantMessage.includes('location') || lastAssistantMessage.includes('where')
  const askedForFootfall = lastAssistantMessage.includes('footfall') || lastAssistantMessage.includes('expected footfall')
  
  // If user gave a number after being asked for budget/rent, we should have extracted it
  const justCollectedBudget = askedForBudget && isPlainNumber && (collectedDetails.budgetRange || collectedDetails.budget || collectedDetails.rent)
  // For owners, check "size"; for brands, check "minSize/maxSize"
  const justCollectedSize = askedForSize && (
    (entityType === 'owner' && collectedDetails.size) || 
    (entityType === 'brand' && (collectedDetails.minSize || collectedDetails.maxSize)) ||
    (isPlainNumber && askedForSize)
  )
  const justCollectedLocation = askedForLocation && collectedDetails.location
  // Check if footfall was just collected (simple responses like "high", "medium", "low")
  const justCollectedFootfall = askedForFootfall && (
    collectedDetails.expectedFootfall || 
    /^(high|medium|low)$/i.test(query.trim())
  )

  console.log('[SimpleSearch] Checks:', {
    isPlainNumber,
    askedForBudget,
    askedForSize,
    askedForLocation,
    askedForFootfall,
    justCollectedBudget,
    justCollectedSize,
    justCollectedLocation,
    justCollectedFootfall,
    hasBudget: !!(collectedDetails.budgetRange || collectedDetails.budget),
    hasRent: !!collectedDetails.rent,
    hasSize: !!(collectedDetails.minSize || collectedDetails.maxSize || collectedDetails.size),
    hasLocation: !!collectedDetails.location,
    hasFootfall: !!collectedDetails.expectedFootfall
  })

  // If we just collected something, use fallback to acknowledge and move forward
  if (justCollectedBudget || justCollectedSize || justCollectedLocation || justCollectedFootfall) {
    console.log('[SimpleSearch] Just collected value, using fallback response')
    const message = generateFallbackResponse(query, entityType, context)
    return {
      message,
      entityType,
      collectedDetails
    }
  }
  
  // DISAMBIGUATION: If we have an ambiguous number, use comprehensive disambiguation
  // "500" alone could be 500 sqft or ₹5 lakhs - need to disambiguate
  if (isPlainNumber && !justCollectedBudget && !justCollectedSize && !justCollectedLocation) {
    const disambiguationResult = disambiguateNumber(query, {
      currentTopic: lastAssistantMessage.includes('budget') || lastAssistantMessage.includes('rent') 
        ? 'discussing_budget' 
        : lastAssistantMessage.includes('size') || lastAssistantMessage.includes('sqft')
        ? 'discussing_area'
        : undefined,
      recentEntities: {
        area: collectedDetails.minSize || collectedDetails.maxSize || collectedDetails.size,
        budget: collectedDetails.budgetRange?.min || collectedDetails.budget || collectedDetails.rent
      },
      previousMessages: conversationHistory.map(m => m.content)
    })
    
    // If confidence is low, ask for clarification
    if (disambiguationResult.needsClarification && disambiguationResult.confidence < 0.6) {
      console.log('[SimpleSearch] Ambiguous number detected, asking for clarification')
      return {
        message: disambiguationResult.clarificationQuestion || 
                `Just to clarify, did you mean ${query} sqft (area) or ₹${query}${parseInt(query) < 1000 ? 'k' : ' lakhs'} (budget)?`,
        entityType,
        collectedDetails
      }
    }
  }
  
  // Also check: if we asked for budget and got a number, but extraction failed, still use fallback
  if (askedForBudget && isPlainNumber && !collectedDetails.budgetRange && !collectedDetails.budget && !collectedDetails.rent) {
    console.log('[SimpleSearch] WARNING: Asked for budget but extraction failed, forcing extraction')
    // Force extract the number as budget/rent
    const num = parseInt(query.trim())
    if (entityType === 'brand') {
      const budgetAmount = num >= 100000 ? num : (num < 100 ? num * 100000 : num * 1000)
      collectedDetails.budgetRange = { min: budgetAmount, max: budgetAmount, currency: 'INR' }
    } else {
      collectedDetails.rent = num >= 100000 ? num : (num < 100 ? num * 100000 : num * 1000)
    }
    const message = generateFallbackResponse(query, entityType, {
      ...context,
      collectedDetails
    })
    return {
      message,
      entityType,
      collectedDetails
    }
  }

  // Otherwise, call Claude for intelligent response
  let message: string
  try {
    message = await generateResponse(query, entityType, context)
  } catch (error: any) {
    console.error('[SimpleSearch] Error generating response:', error.message)
    // Use fallback
    message = generateFallbackResponse(query, entityType, context)
  }

  return {
    message,
    entityType,
    collectedDetails
  }
}

