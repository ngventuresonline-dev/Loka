export const insights = {
  brand: {
    QSR: [
      '⚡ QSR brands perform best in high-footfall areas with parking',
      '🎯 Ground floor visibility is crucial for quick-service restaurants',
      '💰 Average QSR space in Koramangala: 800-1200 sqft at ₹180-220/sqft',
      "🚀 We've matched 15+ QSR brands in the last quarter",
      '📍 Tech parks and college areas are QSR goldmines',
    ],
    Cafe: [
      '☕ Cafés thrive in residential neighborhoods with morning footfall',
      '🪟 Natural light and outdoor seating boost café revenue by 30%',
      '📊 Ideal café size: 600-1000 sqft with cozy ambiance',
      '🎨 Corner units with large windows are perfect for Instagram-worthy cafés',
      '💡 Indiranagar and Koramangala have highest café success rates',
    ],
    Restaurant: [
      '🍽️ Fine dining needs 1500+ sqft with proper ventilation and parking',
      '🌟 Restaurant locations near hotels and business districts perform best',
      '💰 Budget ₹200-300/sqft for premium restaurant spaces',
      '👥 Demographics matter: match your cuisine to the neighborhood',
      '🏆 85% of our restaurant matches converted to leases within 45 days',
    ],
    Bar: [
      '🍺 Bar licenses are location-specific - we check compliance for every match',
      '🎵 Soundproofing and late-night accessibility are crucial for bars',
      '📍 Indiranagar, Koramangala, and MG Road are licensed bar zones',
      '💰 Bar spaces need 2000+ sqft with proper ventilation',
      '🚗 Parking is a must-have for bar locations',
    ],
    Retail: [
      '🛍️ Retail stores need high visibility and street-level access',
      '📈 Retail rent in malls: ₹250-400/sqft vs street retail: ₹150-250/sqft',
      '👀 Window display space increases walk-ins by 45%',
      '🏢 Ground floor corner units get 3x more footfall',
      '💡 We analyze competitor density for every retail match',
    ],
    CloudKitchen: [
      "📦 Cloud kitchens don't need visibility - focus on delivery radius",
      '💰 Save 50% on rent with basement or upper floor locations',
      '⚡ 15 KVA power and proper ventilation are must-haves',
      '📍 Areas with high apartment density are ideal for cloud kitchens',
      '🚀 Average cloud kitchen: 300-600 sqft at ₹80-120/sqft',
    ],
  },

  owner: {
    GroundFloor: [
      '🏆 Ground floor properties lease 60% faster than upper floors',
      '💰 Ground floor commands 30-40% premium for F&B spaces',
      '⚡ High visibility = higher rental value for ground floor',
      '📍 We have 20+ brands actively searching for ground floor spaces',
      '🎯 Your ground floor property matches 80% of our brand requirements',
    ],
    CornerUnit: [
      '🌟 Corner units are in high demand - 2x more inquiries',
      '👀 Double visibility = premium pricing power',
      '💡 Corner properties lease for 25-35% more than mid-block',
      '🎯 Perfect for cafés, retail stores, and QSR brands',
      '📈 We have 15+ brands specifically looking for corner units',
    ],
    Parking: [
      '🚗 Parking availability increases your property value by 20%',
      '🎯 Fine dining and bars specifically require parking',
      '💰 Properties with parking lease 40% faster',
      '📍 We match parking properties with premium brands only',
      '⚡ Parking is a must-have for 60% of our brand requirements',
    ],
    HighFootfall: [
      '👥 High footfall areas command premium rents',
      '📈 Your location has 5000+ daily footfall - highly desirable',
      '💰 Properties in high-traffic zones lease 50% faster',
      '🎯 QSR and retail brands specifically target high footfall areas',
      '🌟 We have 25+ brands looking for high-traffic locations',
    ],
  },

  location: {
    Koramangala: [
      "📍 Koramangala is Bangalore's #1 F&B destination",
      '💰 Average rent: ₹180-250/sqft for commercial spaces',
      "🎯 We've matched 20+ brands in Koramangala last quarter",
      '👥 Young professional demographic - ideal for cafés and QSRs',
      '🏆 Highest success rate for new F&B brands',
    ],
    Indiranagar: [
      '🌟 Indiranagar attracts premium F&B and retail brands',
      '💰 Premium location: ₹220-350/sqft commercial rent',
      '🍽️ Perfect for fine dining, bars, and boutique cafés',
      '📈 Property values grew 22% in last 2 years',
      '🎯 High-income residential area with strong spending power',
    ],
    Whitefield: [
      '💼 Whitefield tech park area has 200K+ daily professionals',
      '⚡ High demand for QSR, cafés, and cloud kitchens',
      '💰 Competitive rent: ₹120-180/sqft',
      '🚀 Fastest growing commercial zone in Bangalore',
      '📍 Captive audience = guaranteed footfall for F&B',
    ],
    HSRLayout: [
      '🏡 HSR Layout is a residential goldmine for F&B',
      '☕ High density of cafés, bakeries, and restaurants',
      '💰 Moderate rent: ₹150-200/sqft',
      '👨‍👩‍👧‍👦 Family-oriented area - ideal for casual dining',
      '📈 Consistent footfall throughout the day',
    ],
  },

  general: [
    '💡 Our AI analyzes 15+ factors to find your perfect match',
    '⚡ Instant match promise - we find spaces instantly',
    '🎯 Zero listing fees - completely free for property owners',
    '📊 We track demographics, footfall, and competition for every area',
    '🏆 500+ verified F&B brands actively searching on our platform',
  ],
}

interface InsightContext {
  userType: 'brand' | 'owner'
  businessType?: string
  location?: string
  features?: string[]
}

export function getContextualInsight(context: InsightContext): string {
  const { userType, businessType, location, features } = context

  const pool: string[] = [...insights.general]

  // Brand-specific by business type
  if (userType === 'brand' && businessType) {
    // Normalize display labels (e.g. "Café/QSR") to internal keys
    const map: Record<string, keyof typeof insights.brand> = {
      'Café/QSR': 'QSR',
      'Cafe/QSR': 'QSR',
      QSR: 'QSR',
      Cafe: 'Cafe',
      'Fine Dining': 'Restaurant',
      Restaurant: 'Restaurant',
      'Bar/Brewery': 'Bar',
      Bar: 'Bar',
      Retail: 'Retail',
      'Cloud Kitchen': 'CloudKitchen',
      CloudKitchen: 'CloudKitchen',
    }
    const key = map[businessType] || (businessType as keyof typeof insights.brand)
    const typeInsights = (insights.brand as any)[key] as string[] | undefined
    if (typeInsights) pool.push(...typeInsights)
  }

  // Owner-specific by features
  if (userType === 'owner' && features && features.length > 0) {
    if (features.includes('Ground Floor')) pool.push(...insights.owner.GroundFloor)
    if (features.includes('Corner Unit')) pool.push(...insights.owner.CornerUnit)
    if (features.includes('Parking')) pool.push(...insights.owner.Parking)
  }

  // Location-specific
  if (location) {
    // Normalize location keys (e.g. "HSR" -> "HSRLayout")
    let locKey: keyof typeof insights.location | undefined
    if (location === 'HSR') {
      locKey = 'HSRLayout'
    } else {
      const compact = location.replace(/\s+/g, '')
      if ((insights.location as any)[compact]) {
        locKey = compact as keyof typeof insights.location
      }
    }
    if (locKey) {
      const locInsights = insights.location[locKey]
      if (locInsights) pool.push(...locInsights)
    }
  }

  if (pool.length === 0) {
    return '💡 Our AI analyzes 15+ factors to find your perfect match.'
  }

  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx]
}


