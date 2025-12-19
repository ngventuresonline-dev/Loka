'use client'

import { useState, useEffect } from 'react'
import { FeaturedProperty } from '@/data/featured-properties'
import LokazenNodesLoader from './LokazenNodesLoader'
import LokazenNodesPlaceholder from './LokazenNodesPlaceholder'

interface PropertyDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  property: FeaturedProperty | null
}

interface LocationInfo {
  areaBrief: string
  competitors: string[]
}

interface PropertyDescription {
  description: string
  idealFor: string[]
  locationDetails: string
}

// Helper component for property image with placeholder
function PropertyImageWithPlaceholder({ imageUrl, alt }: { imageUrl: string | null, alt: string }) {
  const [imageError, setImageError] = useState(false)
  
  // If no image URL provided or image fails, show Lokazen nodes placeholder
  if (!imageUrl || imageError) {
    return <LokazenNodesPlaceholder className="h-full w-full" aspectRatio="wide" />
  }
  
  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => setImageError(true)}
    />
  )
}

export default function PropertyDetailsModal({ isOpen, onClose, property }: PropertyDetailsModalProps) {
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null)
  const [propertyDescription, setPropertyDescription] = useState<PropertyDescription | null>(null)
  const [loading, setLoading] = useState(false)

  // Property descriptions based on size (more specific sizing logic)
  const getPropertyDescription = (property: FeaturedProperty): PropertyDescription => {
    const sizeMatch = property.size.match(/(\d+)/)
    const size = sizeMatch ? parseInt(sizeMatch[1]) : 0
    const title = property.title.toLowerCase()
    
    // Extract location road details
    let roadName = 'a prime road'
    if (title.includes('80 ft') || title.includes('80ft')) roadName = '80 Feet Road'
    else if (title.includes('100ft') || title.includes('100 ft')) roadName = '100 Feet Main Road'
    else if (title.includes('12th main')) roadName = '12th Main'
    else if (title.includes('13th main')) roadName = '13th Main'
    else if (title.includes('17th main')) roadName = '17th Main'
    else if (title.includes('3rd block')) roadName = '3rd Block'
    
    if (title.includes('bungalow')) {
      return {
        description: 'A premium standalone commercial bungalow offering complete privacy and branding opportunities. Perfect for flagship stores, fine dining restaurants, or experiential F&B concepts that require a distinctive presence.',
        idealFor: ['Fine Dining Restaurants', 'Cocktail Bars', 'Breweries', 'Premium Cafes', 'Event Spaces', 'Private Dining Concepts'],
        locationDetails: `Located on ${roadName} in ${property.location}, this property offers excellent visibility and accessibility.`
      }
    }
    if (title.includes('land')) {
      return {
        description: 'A prime commercial land parcel with built-up area, offering complete customization for your brand. Build-to-suit opportunity for brands looking to create a unique space tailored to their concept.',
        idealFor: ['Large Format Restaurants', 'Breweries with Outdoor Seating', 'Food Courts', 'Multi-Brand Concepts', 'Entertainment Venues'],
        locationDetails: `Prime land on ${roadName} in ${property.location}, with excellent road frontage and development potential.`
      }
    }
    
    // Size-based descriptions (more specific)
    if (size <= 300) {
      // Very small - kiosk/QSR
      return {
        description: 'A compact commercial space ideal for quick-service concepts, food kiosks, or grab-and-go formats. High footfall location perfect for impulse purchases and convenience dining. Minimal seating, maximum efficiency.',
        idealFor: ['Coffee Kiosks', 'Juice Bars', 'Dessert Counters', 'Quick Service Restaurants (QSR)', 'Bakery Counters', 'Ice Cream Stands', 'Beverage Counters', 'Snack Stalls'],
        locationDetails: `Small format ground floor space on ${roadName} in ${property.location}, strategically positioned for maximum visibility and customer access.`
      }
    }
    if (size > 300 && size < 800) {
      // Small cafe/QSR
      return {
        description: 'A small commercial space perfect for specialty cafes or compact QSR concepts. Offers limited seating while maintaining efficient operations. Ideal for high-volume, quick-service models.',
        idealFor: ['Specialty Coffee Shops', 'Bubble Tea Shops', 'Small Cafes', 'Quick Service Restaurants', 'Dessert Shops', 'Juice Bars', 'Smoothie Shops'],
        locationDetails: `Compact ground floor commercial space on ${roadName} in ${property.location}, with good street visibility.`
      }
    }
    if (size >= 800 && size < 1500) {
      // Medium - cafe/small casual dining
      return {
        description: 'A well-proportioned commercial space suitable for cafes, casual dining, or specialty F&B concepts. Offers comfortable seating capacity while maintaining operational efficiency. Perfect for mid-sized F&B operations.',
        idealFor: ['Specialty Cafes', 'Casual Dining Restaurants', 'Bubble Tea Cafes', 'Dessert Cafes', 'Healthy Food Concepts', 'Sandwich Shops', 'Breakfast Cafes', 'Brunch Spots'],
        locationDetails: `Mid-sized ground floor commercial space on ${roadName} in ${property.location}, with excellent street visibility and customer accessibility.`
      }
    }
    if (size >= 1500 && size < 3000) {
      // Large - full-service restaurant
      return {
        description: 'A spacious commercial property ideal for full-service restaurants, bars, or multi-concept F&B operations. Provides ample space for dining, kitchen operations, and storage requirements. Suitable for comprehensive F&B experiences.',
        idealFor: ['Full-Service Restaurants', 'Bars & Pubs', 'Family Restaurants', 'Multi-Cuisine Restaurants', 'Sports Bars', 'Casual Dining Chains', 'Themed Restaurants'],
        locationDetails: `Large format commercial space on ${roadName} in ${property.location}, perfect for brands requiring substantial seating and operational space.`
      }
    }
    if (size >= 3000 && size < 5000) {
      // Very large - large restaurant/brewery
      return {
        description: 'An expansive commercial property designed for large-format F&B concepts, breweries, or multi-level dining experiences. Offers substantial space for extensive seating, large kitchens, and branded experiences.',
        idealFor: ['Large Format Restaurants', 'Breweries & Taprooms', 'Multi-Level Dining', 'Entertainment Restaurants', 'Food Halls', 'Large Cafes', 'Destination Dining'],
        locationDetails: `Premium large-format space on ${roadName} in ${property.location}, ideal for flagship locations and destination dining concepts.`
      }
    }
    // 5000+ sqft - very large scale
    return {
      description: 'A massive commercial property perfect for large-scale breweries, taprooms, event venues, or multi-brand food concepts. Offers maximum flexibility for ambitious brand concepts with extensive seating, production facilities, and experiential spaces.',
      idealFor: ['Large Breweries', 'Taprooms', 'Event Venues', 'Multi-Brand Food Halls', 'Entertainment Complexes', 'Large Format Restaurants', 'Destination Dining', 'Multi-Concept Spaces'],
      locationDetails: `Ultra-large format space on ${roadName} in ${property.location}, designed for flagship locations and major F&B operations.`
    }
  }

  // Location data - area briefs and competitor brands (updated with real-time F&B brands)
  const locationData: Record<string, LocationInfo> = {
    'Koramangala': {
      areaBrief: 'Koramangala is one of Bangalore\'s most vibrant commercial and residential hubs. Known for its upscale cafes, restaurants, and retail stores, it attracts a young, affluent demographic. The area offers excellent connectivity, high footfall, and a thriving business ecosystem. Popular among F&B brands, fashion outlets, and tech companies.',
      competitors: ['Third Wave Coffee', 'Blue Tokai', 'Truffles', 'Burger Seigneur', 'Mumbai Pav Co.', 'Original Burger Co.', 'Boba Bhai', 'Qirfa', 'Sandowitch', 'TAN Coffee']
    },
    'Indiranagar': {
      areaBrief: 'Indiranagar is Bangalore\'s premium commercial district, famous for its trendy pubs, fine dining restaurants, and boutique stores. It\'s a preferred location for high-end F&B brands and retail chains. The area has excellent infrastructure, strong consumer spending power, and is well-connected to other parts of the city.',
      competitors: ['Social', 'Toit', 'Windmills Craftworks', 'Brik Oven', 'The Black Rabbit', 'Smoke House Deli', 'Truffles', 'Third Wave Coffee', 'Blue Tokai', 'Burger Seigneur']
    }
  }

  useEffect(() => {
    if (property && isOpen) {
      setLoading(true)
      // Get property description
      const desc = getPropertyDescription(property)
      setPropertyDescription(desc)
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      
      // Simulate loading competitor data (in real app, you'd fetch from Google Maps API)
      setTimeout(() => {
        const info = locationData[property.location] || {
          areaBrief: `${property.location} is a prime commercial location in Bangalore with excellent connectivity and high footfall.`,
          competitors: ['Third Wave Coffee', 'Blue Tokai', 'Truffles', 'Burger Seigneur']
        }
        setLocationInfo(info)
        setLoading(false)
      }, 300)
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [property, isOpen])

  if (!isOpen || !property) return null

  // Get property image URL - only use actual property images, no fallbacks
  const getImageUrl = () => {
    // Check if property has images array (for Property type)
    if ((property as any).images && Array.isArray((property as any).images) && (property as any).images.length > 0) {
      const src = (property as any).images[0]
      // Skip broken local paths
      if (src && !src.startsWith('/images/') && !src.includes('localhost:3000/images') && src.trim() !== '') {
        return src
      }
    }
    // Check if property has image property (for FeaturedProperty type)
    if ((property as any).image && typeof (property as any).image === 'string') {
      const src = (property as any).image
      if (src && !src.startsWith('/images/') && !src.includes('localhost:3000/images') && src.trim() !== '') {
        return src
      }
    }
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      onTouchMove={(e) => {
        // Prevent background scroll on touch
        e.stopPropagation()
      }}
    >
      <div 
        className="relative bg-white rounded-t-3xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => {
          // Stop scroll propagation
          e.stopPropagation()
        }}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Mobile drag handle */}
        <div className="sticky top-0 z-10 bg-white pt-3 pb-2 sm:hidden">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2"></div>
        </div>
        
        {/* Close Button - Sticky on mobile, fixed on desktop */}
        <button
          onClick={onClose}
          className="sticky sm:fixed top-3 sm:top-6 right-3 sm:right-6 z-[10000] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-[#FF5200] flex items-center justify-center shadow-xl hover:scale-110 transition-all duration-200 ml-auto mr-3 sm:mr-0"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 hover:text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Property Image */}
        <div className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden flex-shrink-0">
          <PropertyImageWithPlaceholder imageUrl={getImageUrl() || ''} alt={property.title} />
          {property.badge && (
            <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 sm:px-3 sm:py-1.5 text-white text-xs sm:text-sm font-semibold rounded-full shadow-lg ${
              property.badge === 'Leased Out' 
                ? 'bg-red-500' 
                : 'bg-green-500'
            }`}>
              {property.badge}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto">
          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 pr-10 sm:pr-8 leading-tight">
            {property.title}
          </h2>

          {/* Location Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#FF5200]/10 to-[#E4002B]/10 border border-[#FF5200]/20 rounded-full mb-4 sm:mb-6">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">{property.location}</span>
          </div>

          {/* Property Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Size</div>
              <div className="text-sm sm:text-lg font-bold text-gray-900">{property.size}</div>
            </div>
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Floor</div>
              <div className="text-sm sm:text-lg font-bold text-gray-900">{property.floor}</div>
            </div>
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Rent</div>
              <div className="text-sm sm:text-lg font-bold text-gray-900">{property.rent}</div>
            </div>
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100">
              <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Deposit</div>
              <div className="text-sm sm:text-lg font-bold text-gray-900">{property.deposit}</div>
            </div>
          </div>

          {/* Property Description */}
          {propertyDescription && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Property Overview
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-3 sm:mb-4">{propertyDescription.description}</p>
              
              <div className="mb-3 sm:mb-4">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Ideal For:</h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {propertyDescription.idealFor.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-[#FF5200]/10 to-[#E4002B]/10 border border-[#FF5200]/20 rounded-lg text-xs sm:text-sm font-medium text-gray-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{propertyDescription.locationDetails}</p>
            </div>
          )}

          {/* Area Brief */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              About {property.location}
            </h3>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-4">
                <LokazenNodesLoader size="sm" />
                <p className="mt-2 text-xs text-gray-500">Loading location info...</p>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{locationInfo?.areaBrief}</p>
            )}
          </div>

          {/* Competitor Brands */}
          <div className="mb-6 sm:mb-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Popular Brands in {property.location}
            </h3>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-4">
                <LokazenNodesLoader size="sm" />
                <p className="mt-2 text-xs text-gray-500">Loading competitors...</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {locationInfo?.competitors.map((brand, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[#FF5200]/10 to-[#E4002B]/10 border border-[#FF5200]/20 rounded-full text-xs sm:text-sm font-medium text-gray-700 hover:from-[#FF5200]/20 hover:to-[#E4002B]/20 transition-all cursor-default"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200 sticky bottom-0 bg-white pb-4 sm:pb-0">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white text-sm sm:text-base font-semibold rounded-xl hover:shadow-lg active:scale-95 sm:hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Express Interest
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-white border-2 border-gray-300 text-gray-700 text-sm sm:text-base font-semibold rounded-xl hover:border-[#FF5200] hover:text-[#FF5200] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save Property
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

