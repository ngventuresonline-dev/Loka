import { Property } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface PropertyCardProps {
  property: Property
  bfiScore?: number
  matchReasons?: string[]
  showOwnerContact?: boolean
}

export default function PropertyCard({ 
  property, 
  bfiScore, 
  matchReasons = [],
  showOwnerContact = false 
}: PropertyCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [showContact, setShowContact] = useState(showOwnerContact)

  const formatPrice = (price: number, type: Property['priceType']) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
    
    switch (type) {
      case 'monthly':
        return `${formatted}/month`
      case 'yearly':
        return `${formatted}/year`
      case 'sqft':
        return `${formatted}/sq ft`
      default:
        return formatted
    }
  }

  const getBFIColor = (score?: number) => {
    if (!score) return 'gray'
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    return 'orange'
  }

  const getBFILabel = (score?: number) => {
    if (!score) return 'N/A'
    if (score >= 80) return 'Excellent Match'
    if (score >= 60) return 'Good Match'
    return 'Fair Match'
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSaved(!isSaved)
    // TODO: Save to database
  }

  return (
    <div className="group relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-[#FF5722] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF5722]/5 to-[#E4002B]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Image Section */}
      <div className="relative h-56 w-full overflow-hidden">
        {property.images && property.images.length > 0 ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF5722] to-[#E4002B] rounded-xl mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-gray-600 text-sm">Premium Space</span>
            </div>
          </div>
        )}
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <span className="bg-white/90 backdrop-blur-sm border border-gray-300 px-3 py-1 rounded-full text-xs font-semibold text-gray-900 capitalize">
            {property.propertyType}
          </span>
          
          {/* Save Button */}
          <button
            onClick={handleSave}
            className={`p-2 rounded-full backdrop-blur-sm transition-all ${
              isSaved 
                ? 'bg-[#FF5722] text-white' 
                : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
            aria-label="Save property"
          >
            <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* BFI Score Badge */}
        {bfiScore !== undefined && (
          <div className="absolute bottom-4 right-4">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${
              getBFIColor(bfiScore) === 'green' ? 'bg-green-500' :
              getBFIColor(bfiScore) === 'yellow' ? 'bg-yellow-500' :
              'bg-orange-500'
            }`}>
              {bfiScore}% Match
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>
      
      {/* Content Section */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-[#FF5722] transition-colors duration-300 mb-2">
            {property.title}
          </h3>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">{property.address}, {property.city}</span>
          </div>
        </div>

        {/* Price and Size */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-2xl font-black bg-gradient-to-r from-[#FF5722] to-[#E4002B] bg-clip-text text-transparent">
              {formatPrice(property.price, property.priceType)}
            </div>
            <div className="text-sm text-gray-600 mt-1">{property.size.toLocaleString()} sq ft</div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            property.isAvailable 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <div className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${property.isAvailable ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            {property.isAvailable ? 'Available' : 'Reserved'}
          </span>
        </div>

        {/* Match Reasons */}
        {matchReasons.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs font-semibold text-gray-700 mb-2">Why this matches:</div>
            <ul className="space-y-1">
              {matchReasons.slice(0, 3).map((reason, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start">
                  <svg className="w-3 h-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {property.parking && (
            <span className="bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
              </svg>
              Parking
            </span>
          )}
          {property.amenities.some(a => a.toLowerCase().includes('ground')) && (
            <span className="bg-purple-50 border border-purple-200 text-purple-700 px-2 py-1 rounded text-xs font-medium">
              Ground Floor
            </span>
          )}
          {property.amenities.some(a => a.toLowerCase().includes('corner')) && (
            <span className="bg-orange-50 border border-orange-200 text-orange-700 px-2 py-1 rounded text-xs font-medium">
              Corner Unit
            </span>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link 
            href={`/properties/${property.id}`}
            className="flex-1 bg-gradient-to-r from-[#FF5722] to-[#E4002B] hover:from-[#FF6B35] hover:to-[#FF5722] text-white text-center py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-sm"
          >
            View Details
          </Link>
          {showContact && (
            <button
              onClick={() => setShowContact(!showContact)}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-sm"
            >
              Contact
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
