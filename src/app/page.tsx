'use client'

import { useState, useEffect, useMemo, lazy, Suspense, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DynamicBackground from '@/components/DynamicBackground'
import NetworkMapBackground from '@/components/NetworkMapBackground'
import HeroSearch, { type Mode as HeroMode } from '@/components/HeroSearch'
import Footer from '@/components/Footer'
// Lazy load map components for better performance
const BangaloreMapIllustration = lazy(() => import('@/components/BangaloreMapIllustration').then(mod => ({ default: mod.default })))
const BrandPlacementPin = lazy(() => import('@/components/BrandPlacementPin').then(mod => ({ default: mod.default })))
import { brandPlacements, getPlacementCoordinates } from '@/lib/brand-placements'

// Lazy load heavy components below the fold
const BrandOnboardingForm = lazy(() => import('@/components/onboarding/BrandOnboardingForm'))
const PropertyOwnerOnboardingForm = lazy(() => import('@/components/onboarding/PropertyOwnerOnboardingForm'))
const Dashboard = lazy(() => import('@/components/Dashboard'))
const AiSearchModal = lazy(() => import('@/components/AiSearchModal'))
const BrandRequirementsModal = lazy(() => import('@/components/BrandRequirementsModal'))
const PropertyDetailsModal = lazy(() => import('@/components/PropertyDetailsModal'))
import { type FeaturedProperty } from '@/data/featured-properties'
import { BrandProfile, OwnerProfile, Property } from '@/types/workflow'
import { initializeAdminAccount, getCurrentUser, isAdmin } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { getTheme, getPaletteColors } from '@/lib/theme'
import { getBrandLogo, getBrandInitial } from '@/lib/brand-logos'
import LokazenNodesPlaceholder from '@/components/LokazenNodesPlaceholder'
import LogoImage from '@/components/LogoImage'

type AppStep = 'home' | 'brand-onboarding' | 'owner-onboarding' | 'brand-dashboard' | 'owner-dashboard'

// Mock property data
const mockProperties: Property[] = [
  {
    id: 'prop-001',
    title: 'Prime Manhattan Retail Space',
    description: 'Modern retail space in the heart of Manhattan',
    address: '123 Broadway',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    size: 1800,
    propertyType: 'retail',
    price: 12000,
    priceType: 'monthly',
    condition: 'excellent',
    amenities: ['Parking', 'Storage', 'Security'],
    accessibility: true,
    parking: true,
    publicTransport: true,
    ownerId: 'owner-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: true,
  }
]

// Property Image Component - Only uses actual property images, Lokazen nodes placeholder otherwise
function PropertyImage({ property, className = '' }: { property: FeaturedProperty, className?: string }) {
  const [imageError, setImageError] = useState(false)
  
  // Get actual property image - check both images array and image property
  const getImageUrl = () => {
    if ((property as any).images && Array.isArray((property as any).images) && (property as any).images.length > 0) {
      const src = (property as any).images[0]
      if (src && !src.startsWith('/images/') && !src.includes('localhost:3000/images') && !src.includes('unsplash') && src.trim() !== '') {
        return src
      }
    }
    if ((property as any).image && typeof (property as any).image === 'string') {
      const src = (property as any).image
      if (src && !src.startsWith('/images/') && !src.includes('localhost:3000/images') && !src.includes('unsplash') && src.trim() !== '') {
        return src
      }
    }
    return null
  }
  
  const imageUrl = getImageUrl()
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      {imageUrl && !imageError ? (
        <Image
          src={imageUrl}
          alt={property.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          onError={() => setImageError(true)}
          unoptimized={imageUrl.startsWith('http') && !imageUrl.includes('lokazen.in')}
        />
      ) : (
        <LokazenNodesPlaceholder className="h-full w-full" aspectRatio="wide" />
      )}
    </div>
  )
}

// Property Carousel Component
function PropertyCarousel({ properties }: { properties: FeaturedProperty[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<FeaturedProperty | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Responsive properties per page: 3 for desktop, 1 for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const propertiesPerPage = isMobile ? 1 : 3
  const scrollIncrement = 1 // Scroll one property at a time
  
  // Get current properties with wrapping - always show full number of cards
  const getCurrentProperties = () => {
    const result: FeaturedProperty[] = []
    for (let i = 0; i < propertiesPerPage; i++) {
      const index = (currentIndex + i) % properties.length
      result.push(properties[index])
    }
    return result
  }
  
  const currentProperties = getCurrentProperties()

  // Hero section colors
  const heroColors = {
    border: 'hover:border-[#FF5200]',
    iconBg: 'bg-gradient-to-br from-[#FF5200]/10 to-[#E4002B]/10',
    iconColor: 'text-[#FF5200]',
    shadow: 'hover:shadow-[#FF5200]/30',
    pulse: 'border-[#FF5200]',
    ring: 'ring-[#FF5200]/50',
    glowFrom: 'rgba(255, 82, 0, 0.2)',
    glowVia: 'rgba(228, 0, 43, 0.1)',
    accent: 'rgba(255, 82, 0, 0.4)',
    particle: 'bg-[#FF5200]'
  }

  // Auto-scroll functionality with pause on hover
  const [isPaused, setIsPaused] = useState(false)
  
  useEffect(() => {
    if (isPaused) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        // Move forward by one property at a time, wrapping will be handled by getCurrentProperties
        return (prev + scrollIncrement) % properties.length
      })
    }, 5000) // Auto-scroll every 5 seconds

    return () => clearInterval(interval)
  }, [properties.length, propertiesPerPage, isPaused])

  const goToPrevious = () => {
    setCurrentIndex((prev) => {
      // Move back by one property, wrapping to the end if needed
      const newIndex = prev - scrollIncrement
      if (newIndex < 0) {
        return properties.length + newIndex
      }
      return newIndex
    })
  }

  const goToNext = () => {
    setCurrentIndex((prev) => {
      // Move forward by one property, wrapping will be handled by getCurrentProperties
      return (prev + scrollIncrement) % properties.length
    })
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 border-[#FF5200]/30 hover:border-[#FF5200] shadow-lg hover:shadow-[#FF5200]/30 flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="Previous properties"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 border-[#FF5200]/30 hover:border-[#FF5200] shadow-lg hover:shadow-[#FF5200]/30 flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="Next properties"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Properties Grid - Show 3 for desktop, 1 for mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-8 md:px-12">
        {currentProperties.map((property, idx) => {
          return (
            <div
              key={property.id}
              className="relative group opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards] h-full"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className={`relative bg-white backdrop-blur-xl rounded-2xl border-2 border-gray-200 ${heroColors.border} transition-all duration-500 overflow-hidden shadow-lg ${heroColors.shadow} group-hover:-translate-y-2 h-full flex flex-col`}>
                {/* Top Accent Bar - Hero Color */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl z-20"
                  style={{
                    background: 'linear-gradient(to right, #FF5200, #E4002B, #FF6B35)'
                  }}
                ></div>
                
                {/* Property Image - Uses Animated Logo Placeholder when image fails */}
                <div className="relative w-full h-48 overflow-hidden">
                  <PropertyImage property={property} />
                  {property.badge && (
                    <div className={`absolute top-3 right-3 px-2.5 py-1 text-white text-xs font-semibold rounded-full shadow-lg ${
                      property.badge === 'Leased Out' 
                        ? 'bg-red-500' 
                        : 'bg-green-500'
                    }`}>
                      {property.badge}
                  </div>
                  )}
                </div>
                
                {/* Animated Glow Effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
                  style={{
                    background: `linear-gradient(to bottom right, ${heroColors.glowFrom}, ${heroColors.glowVia}, transparent)`
                  }}
                ></div>
                
                {/* Animated Corner Accent */}
                <div 
                  className="absolute top-0 right-0 w-20 h-20 rounded-bl-full group-hover:w-28 group-hover:h-28 transition-all duration-500"
                  style={{
                    background: `linear-gradient(to bottom right, ${heroColors.accent}, transparent)`
                  }}
                ></div>
                
                {/* Particle Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute top-1/4 left-1/4 w-2 h-2 ${heroColors.particle} rounded-full animate-ping`}></div>
                  <div className={`absolute top-3/4 right-1/4 w-2 h-2 ${heroColors.particle} rounded-full animate-ping`} style={{animationDelay: '0.5s'}}></div>
                </div>
                
                <div className="relative z-10 p-6 flex flex-col flex-1">
                  {/* Title */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1 pr-2 flex-1 line-clamp-2">
                      {property.title}
                    </h3>
                  </div>

                  {/* Property Details */}
                  <div className="space-y-3 flex-1">
                    {/* Size */}
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-8 h-8 ${heroColors.iconBg} rounded-lg flex items-center justify-center border border-[#FF5200]/20`}>
                        <svg className={`w-4 h-4 ${heroColors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Size:</span> {property.size}</span>
                    </div>

                    {/* Floor */}
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-8 h-8 ${heroColors.iconBg} rounded-lg flex items-center justify-center border border-[#FF5200]/20`}>
                        <svg className={`w-4 h-4 ${heroColors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Floor:</span> {property.floor}</span>
                    </div>

                    {/* Rent */}
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-8 h-8 ${heroColors.iconBg} rounded-lg flex items-center justify-center border border-[#FF5200]/20`}>
                        <svg className={`w-4 h-4 ${heroColors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Rent:</span> {property.rent}</span>
                    </div>

                    {/* Deposit */}
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-8 h-8 ${heroColors.iconBg} rounded-lg flex items-center justify-center border border-[#FF5200]/20`}>
                        <svg className={`w-4 h-4 ${heroColors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Deposit:</span> {property.deposit}</span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedProperty(property)
                        setIsModalOpen(true)
                      }}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span>View Details</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Enhanced Pulse Ring */}
                <div className={`absolute inset-0 rounded-2xl border-2 ${heroColors.pulse} opacity-0 group-hover:opacity-100 group-hover:animate-ping`}></div>
                <div className={`absolute inset-0 rounded-2xl ring-2 ${heroColors.ring} opacity-0 group-hover:opacity-100 blur-sm`}></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedProperty(null)
        }}
        property={selectedProperty}
      />
    </div>
  )
}

// Helper function to format budget range
function formatBudget(min: number | null, max: number | null): string {
  if (!min && !max) return 'Flexible'
  const formatAmount = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    return `₹${(amount / 1000).toFixed(0)}K`
  }
  if (!min) return `Up to ${formatAmount(max!)}/month`
  if (!max) return `${formatAmount(min)}+/month`
  return `${formatAmount(min)}-${formatAmount(max)}/month`
}

// Helper function to format size range
function formatSize(min: number | null, max: number | null): string {
  if (!min && !max) return 'Flexible'
  if (!min) return `Up to ${max!.toLocaleString()} sqft`
  if (!max) return `${min.toLocaleString()}+ sqft`
  return `${min.toLocaleString()}-${max.toLocaleString()} sqft`
}

// Helper function to format locations
function formatLocations(locations: string[] | null | undefined): string {
  if (!locations || locations.length === 0) return 'Flexible'
  if (locations.length <= 2) return locations.join(', ')
  return locations.slice(0, 2).join(', ') + '...'
}

// Remove repeated tag prefixes and dedupe comma-separated audience tags
function sanitizeTargetAudience(text: string | null | undefined): string | null {
  if (!text) return null
  const parts = text.split('-').map(p => p.trim()).filter(Boolean)
  const uniqueParts: string[] = []
  parts.forEach(part => {
    if (!uniqueParts.some(p => p.toLowerCase() === part.toLowerCase())) {
      uniqueParts.push(part)
    }
  })

  const dedupeTags = (chunk: string) => {
    const tags = chunk.split(',').map(t => t.trim()).filter(Boolean)
    const seen = new Set<string>()
    const deduped: string[] = []
    tags.forEach(tag => {
      const lower = tag.toLowerCase()
      if (!seen.has(lower)) {
        seen.add(lower)
        deduped.push(tag)
      }
    })
    return deduped.join(', ')
  }

  if (uniqueParts.length > 0) {
    uniqueParts[0] = dedupeTags(uniqueParts[0])
  }

  return uniqueParts.join(' - ')
}

// Helper function to get brand color scheme classes
function getBrandColorScheme(brandName: string): {
  borderHover: string
  iconBg: string
  iconColor: string
  shadowHover: string
  shadow: string
  glowFrom: string
  glowVia: string
  pulseBorder: string
  ringColor: string
  particleColor: string
} {
  // Platform colors for all brands
  return { 
    borderHover: 'hover:border-[#FF5200]', 
    iconBg: 'bg-[#FF5200]/10', 
    iconColor: 'text-[#FF5200]', 
    shadowHover: 'hover:shadow-[#FF5200]/30', 
    shadow: 'shadow-[#FF5200]/20',
    glowFrom: 'from-[#FF5200]/20',
    glowVia: 'via-[#E4002B]/10',
    pulseBorder: 'border-[#FF5200]',
    ringColor: 'ring-[#FF5200]/50',
    particleColor: 'bg-[#FF5200]'
  }
}

// Dynamic Brand Card Component with Expandable Details
function DynamicBrandCard({ brand, index, isExpanded, onToggleExpand }: { brand: any, index: number, isExpanded: boolean, onToggleExpand: () => void }) {
  
  const companyName = brand.companyName || brand.name || 'Brand'
  const industry = brand.industry || 'Business'
  const logoPath = getBrandLogo(companyName)
  const brandInitial = getBrandInitial(companyName)
  const colors = getBrandColorScheme(companyName)
  
  const profile = brand.brandProfile || {}
  const minSize = profile.minSize || null
  const maxSize = profile.maxSize || null
  const budgetMin = profile.budgetMin || null
  const budgetMax = profile.budgetMax || null
  const locations = profile.preferredLocations || []
  const timeline = profile.timeline || null
  const storeType = (profile as any)?.storeType || null
  const targetAudience = sanitizeTargetAudience((profile as any)?.targetAudience)
  const additionalRequirements = (profile as any)?.additionalRequirements || null
  
  const sizeRange = formatSize(minSize, maxSize)
  const budgetRange = formatBudget(budgetMin, budgetMax)
  const locationText = formatLocations(locations)
  
  const delay = (index + 1) * 0.1
  
  return (
    <div 
      data-brand-card 
      className="relative group cursor-pointer"
      onClick={onToggleExpand}
    >
      <div className={`relative bg-white backdrop-blur-xl rounded-2xl p-4 sm:p-6 border-2 ${isExpanded ? colors.borderHover.replace('hover:', '') : 'border-gray-200'} ${colors.borderHover} overflow-hidden shadow-lg ${colors.shadowHover} flex flex-col`}>
        {/* Top Accent Bar - Brand Color */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl ${colors.glowFrom.replace('from-', 'bg-').replace('/20', '')}`}></div>
        
        {/* Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.glowFrom} ${colors.glowVia} to-transparent ${isExpanded ? 'opacity-100' : 'opacity-0'}`}></div>
        
        {/* Corner Accent */}
        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colors.glowFrom.replace('/20', '/40')} to-transparent rounded-bl-full ${isExpanded ? 'w-28 h-28' : ''}`}></div>
        
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 sm:gap-3 mb-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {/* Brand Logo */}
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg ${colors.shadow} overflow-hidden bg-white p-1.5 flex-shrink-0`}>
                {logoPath ? (
                  <img 
                    src={logoPath} 
                    alt={`${companyName} Logo`} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className={`w-full h-full ${colors.iconBg} rounded-lg flex items-center justify-center`}>
                    <span className={`${colors.iconColor} font-bold text-base sm:text-lg`}>{brandInitial}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1 truncate">{companyName}</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{industry}</p>
              </div>
            </div>
            {/* Multiple Badges - Stacked vertically when 2 or more */}
            <div className={`flex flex-col gap-1 sm:gap-1.5 justify-end flex-shrink-0 ${(profile.badges && Array.isArray(profile.badges) && profile.badges.length > 1) ? 'items-end' : 'items-end'}`}>
              {(profile.badges && Array.isArray(profile.badges) && profile.badges.length > 0) ? (
                profile.badges.map((badge: string) => {
                  const badgeColors: Record<string, { bg: string; border: string; text: string }> = {
                    'Active': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
                    'Very Active': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
                    'Multiple Properties Matched': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
                    'Property Matched': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
                  }
                  const colors = badgeColors[badge] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }
                  
                  // Shortened text for mobile
                  const shortBadge = badge.length > 15 ? (badge === 'Multiple Properties Matched' ? 'Multiple Matched' : badge.substring(0, 12) + '...') : badge
                  
                  return (
                    <span 
                      key={badge} 
                      className={`px-2 sm:px-2.5 py-0.5 sm:py-1 ${colors.bg} border ${colors.border} ${colors.text} text-[10px] sm:text-xs font-semibold rounded-full leading-tight whitespace-nowrap`}
                      title={badge}
                    >
                      <span className="hidden sm:inline">{badge}</span>
                      <span className="sm:hidden">{shortBadge}</span>
                    </span>
                  )
                })
              ) : (
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-50 border border-green-200 text-green-700 text-[10px] sm:text-xs font-semibold rounded-full flex-shrink-0">Active</span>
              )}
            </div>
          </div>
          
          {/* Always visible: Size */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 mb-3">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 ${colors.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <span><span className="font-semibold text-gray-900">Size:</span> {sizeRange}</span>
          </div>

          {/* Expandable Details */}
          {isExpanded && (
          <div className="space-y-3 mt-3">
            {locationText && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 ${colors.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="break-words"><span className="font-semibold text-gray-900">Location:</span> {locationText}</span>
              </div>
            )}
            {budgetRange && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 ${colors.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span><span className="font-semibold text-gray-900">Budget:</span> <span className="blur-sm select-none">{budgetRange}</span></span>
              </div>
            )}
            {timeline && timeline !== 'Flexible' && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 ${colors.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span><span className="font-semibold text-gray-900">Timeline:</span> {timeline}</span>
              </div>
            )}
            {storeType && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 ${colors.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="break-words"><span className="font-semibold text-gray-900">Store Type:</span> {storeType}</span>
              </div>
            )}
            {targetAudience && (
              <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 ${colors.iconBg} rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0`}>
                  <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="break-words"><span className="font-semibold text-gray-900">Target Audience:</span> {targetAudience}</span>
              </div>
            )}
            {additionalRequirements && (
              <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 ${colors.iconBg} rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0`}>
                  <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="break-words"><span className="font-semibold text-gray-900">Requirements:</span> {additionalRequirements}</span>
              </div>
            )}
          </div>
          )}

          {/* Expand/Collapse Indicator */}
          <div className="mt-auto pt-3 flex items-center justify-center">
            <div className={`flex items-center gap-1 text-xs sm:text-sm ${colors.iconColor} ${isExpanded ? 'rotate-180' : ''}`}>
              <span className="font-medium">{isExpanded ? 'Show Less' : 'Click for Details'}</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pulse Ring */}
        <div className={`absolute inset-0 rounded-2xl border-2 ${colors.pulseBorder} ${isExpanded ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute inset-0 rounded-2xl ring-2 ${colors.ringColor} ${isExpanded ? 'opacity-100' : 'opacity-0'} blur-sm`}></div>
      </div>
    </div>
  )
}

export default function Home() {
  // Featured properties removed - will be managed from backend/admin panel
  const router = useRouter()
  const { user } = useAuth()
  
  const [currentStep, setCurrentStep] = useState<AppStep>('home')
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null)
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Auto-animation + touch/drag for 2nd row logos - using refs for smooth animation
  const scrollOffsetRef = useRef(0)
  const targetOffsetRef = useRef(0)
  const logoRowRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const singleSetWidthRef = useRef(0)
  
  // Touch/drag interaction refs
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartOffsetRef = useRef(0)

  // Measure single set width on mount for seamless looping
  useEffect(() => {
    const measureWidth = () => {
      if (logoRowRef.current) {
        // Total width divided by 3 (since we render 3 copies)
        singleSetWidthRef.current = logoRowRef.current.scrollWidth / 3
      }
    }
    measureWidth()
    window.addEventListener('resize', measureWidth)
    return () => window.removeEventListener('resize', measureWidth)
  }, [])

  // Smooth animation loop with auto-scroll (left to right) and seamless wrap
  useEffect(() => {
    const autoScrollSpeed = 0.3 // Pixels per frame (slow smooth movement)
    
    const animate = () => {
      // Auto-scroll: move left (right to left animation)
      // Only auto-scroll when not dragging
      if (!isDraggingRef.current) {
        targetOffsetRef.current += autoScrollSpeed // Move right to left
      }
      
      // Lerp (linear interpolation) for smooth movement
      const diff = targetOffsetRef.current - scrollOffsetRef.current
      scrollOffsetRef.current += diff * 0.08 // Smooth easing factor
      
      // Seamless infinite loop wrap
      const singleWidth = singleSetWidthRef.current
      if (singleWidth > 0) {
        // Wrap the offset to stay within one set width range for seamless loop
        while (scrollOffsetRef.current < -singleWidth) {
          scrollOffsetRef.current += singleWidth
          targetOffsetRef.current += singleWidth
          dragStartOffsetRef.current += singleWidth
        }
        while (scrollOffsetRef.current > 0) {
          scrollOffsetRef.current -= singleWidth
          targetOffsetRef.current -= singleWidth
          dragStartOffsetRef.current -= singleWidth
        }
      }
      
      if (logoRowRef.current) {
        logoRowRef.current.style.transform = `translateX(${scrollOffsetRef.current}px)`
      }
      
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    animationFrameRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Touch and mouse drag handlers for logo row
  const handleDragStart = useCallback((clientX: number) => {
    isDraggingRef.current = true
    dragStartXRef.current = clientX
    dragStartOffsetRef.current = targetOffsetRef.current
  }, [])

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current) return
    const delta = clientX - dragStartXRef.current
    targetOffsetRef.current = dragStartOffsetRef.current + delta
  }, [])

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  // Mouse event handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientX)
  }, [handleDragStart])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX)
  }, [handleDragMove])

  const onMouseUp = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  const onMouseLeave = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  // Touch event handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX)
  }, [handleDragStart])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX)
  }, [handleDragMove])

  const onTouchEnd = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  // Get brand logos using the brand-logos utility, filtering out null values
  // Memoize to prevent recomputation on every render
  const allBrands = useMemo(() => [
    'Truffles', 'Original Burger Co.', 'Mumbai Pav Co.', 'Evil Onigiri', 'Roma Deli', 
    'Blr Brewing Co.', 'Burger Seigneur', 'Biggies Burger', 
    'The Flour Girl Cafe', 'Bawri', 'Boba Bhai', 'GoRally- Sports', 'Dolphins Bar & Kitchen', 
    'Klutch- Sports', 'Sun Kissed Smoothie', 'Qirfa', 'Zed The Baker', 
    'Blue Tokai', 'Sandowitch', 'Madam Chocolate', 'Eleven Bakehouse', 'Kunafa Story', 
    'Namaste- South Indian', 'Kried Ko- Burger', 'Samosa Party', 'Melts- Cruncheese', 
    'TAN Coffee', 'Block Two Coffee'
  ], [])

  // Trusted brands row label arrays (text-only rows) - memoized
  const trustedRow1Brands = useMemo(() => [
    'Truffles', 'Original Burger Co.', 'Mumbai Pav Co.', 'Evil Onigiri', 'Roma Deli',
    'Blr Brewing Co.', 'Burger Seigneur', 'Biggies Burger', 'The Flour Girl Cafe', 'Bawri',
    'Boba Bhai', 'GoRally- Sports', 'Dolphins Bar & Kitchen', 'Klutch- Sports',
  ], [])

  const trustedRow3Brands = useMemo(() => [
    'Sun Kissed Smoothie', 'Qirfa', 'Zed The Baker', 'Blue Tokai', 'Sandowitch',
    'Madam Chocolate', 'Eleven Bakehouse', 'Kunafa Story', 'Namaste- South Indian',
    'Kried Ko- Burger', 'Samosa Party', 'Melts- Cruncheese', 'TAN Coffee', 'Block Two Coffee',
  ], [])
  
  // Categorize logos by size - larger/wider logos need different sizing - memoized
  const largerLogos = useMemo(() => [
    '/logos/Eleven-Bakehouse-Coloured-Logos-01.png',
    '/logos/Burger Seigneur Logo 1.png',
    '/logos/blr brewing co logo.png',
    '/logos/Original_Burger_Co_Logo.png',
    '/logos/Madam Chocolate Logo .png',
    '/logos/Sandowitch logo.jpg'
  ], [])
  
  // Create array of brand logo data (logo path or null, with brand name and initial) - memoized
  const brandLogoData = useMemo(() => {
    return allBrands.map(brand => ({
      brand,
      logoPath: getBrandLogo(brand),
      initial: getBrandInitial(brand)
    })).filter(item => item.logoPath !== null) // Only include brands with logos
  }, [allBrands])
  
  // Create logo data with size category - memoized
  const logoDataWithSize = useMemo(() => {
    return brandLogoData.map(item => ({
      ...item,
      isLarge: largerLogos.includes(item.logoPath as string)
    }))
  }, [brandLogoData, largerLogos])
  
  // Use logo data for the scrolling row - memoized
  const uniqueLogos = useMemo(() => logoDataWithSize, [logoDataWithSize])
  
  // Logos that need background removal
  const logosWithWhiteBackgrounds = [
    'Sun Kissed Smoothie',
    'Biggies Burger',
    'Truffles',
    'Namaste- South Indian',
    'Dolphins Bar & Kitchen',
    'Samosa Party',
    'Bawri'
  ]
  
  // Logos with black borders/backgrounds
  const logosWithBlackBackgrounds = [
    'Sandowitch'
  ]
  
  // Check if logo needs background removal
  const needsBackgroundRemoval = (brandName: string) => {
    return [...logosWithWhiteBackgrounds, ...logosWithBlackBackgrounds].some(name => 
      brandName.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(brandName.toLowerCase())
    )
  }
  
  // Check if logo has black background
  const hasBlackBackground = (brandName: string) => {
    return logosWithBlackBackgrounds.some(name => 
      brandName.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(brandName.toLowerCase())
    )
  }

  const [theme, setThemeState] = useState({ palette: 'cosmic-purple', background: 'floating-orbs' })
  
  // AI Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [heroMode, setHeroMode] = useState<HeroMode>('brand')
  const [barHeights, setBarHeights] = useState<number[]>([])
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
  
  // Featured brands state - fetched from database
  const [featuredBrands, setFeaturedBrands] = useState<any[]>([])
  const [brandsLoading, setBrandsLoading] = useState(true)
  const [brandsError, setBrandsError] = useState<string | null>(null)
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(null)
  const [showMobileNav, setShowMobileNav] = useState(false)

  // Handle AI Search - Open modal with query
  const handleSearch = () => {
    if (!searchQuery.trim()) return
    setIsAiModalOpen(true)
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Preload ALL logo images to prevent missing logos on navigation - PERMANENT FIX
  useEffect(() => {
    if (uniqueLogos.length > 0 && typeof window !== 'undefined') {
      // Preload ALL logos with dual method for maximum reliability
      uniqueLogos.forEach((logoItem) => {
        if (logoItem.logoPath) {
          // Method 1: Preload link (browser cache)
          const link = document.createElement('link')
          link.rel = 'preload'
          link.as = 'image'
          link.href = logoItem.logoPath as string
          // No crossOrigin needed for same-origin resources
          document.head.appendChild(link)
          
          // Method 2: Preload via Image object (more reliable, forces cache)
          const img = new window.Image()
          img.src = logoItem.logoPath as string
          img.onload = () => {
            // Image successfully cached
          }
          img.onerror = () => {
            // Log but don't fail - LogoImage component will handle fallback
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Failed to preload logo: ${logoItem.logoPath}`)
            }
          }
        }
      })
    }
  }, [uniqueLogos])

  useEffect(() => {
    // Only run once on mount (client-side only)
    if (typeof window === 'undefined') return
    
    if (!isInitialized) {
      try {
      // Initialize default admin account
      initializeAdminAccount()
      
      // Load current theme
      const currentTheme = getTheme()
      setThemeState(currentTheme)
      
      // Note: Removed auto-redirect for admins - they can navigate freely
      // Admins can access homepage and use "Dashboard" link in navbar to go to /admin
      
      setIsInitialized(true)
      } catch (error) {
        console.error('Error initializing page:', error)
        setIsInitialized(true) // Set to true anyway to prevent infinite loops
      }
    }
    setIsMounted(true)
  }, [isInitialized])

  // Generate bar heights for data visualization
  useEffect(() => {
    setBarHeights([1, 2, 3, 4, 5].map(() => Math.random() * 60 + 40))
  }, [])

  // Handle scroll to show/hide mobile bottom nav after hero section
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleScroll = () => {
      // Hero section ends around viewport height, show nav after scrolling past it
      const scrollY = window.scrollY || window.pageYOffset
      const viewportHeight = window.innerHeight
      setShowMobileNav(scrollY > viewportHeight * 0.8)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check on mount
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch featured brands from database
  useEffect(() => {
    const fetchFeaturedBrands = async () => {
      try {
        setBrandsLoading(true)
        setBrandsError(null)
        const response = await fetch('/api/brands')
        if (!response.ok) {
          throw new Error('Failed to fetch brands')
        }
        const data = await response.json()
        
        // Filter brands - be lenient: just need a name (companyName or name)
        // Brands are already sorted by API (displayOrder, then createdAt)
        const brandsWithProfiles = (data.brands || []).filter((brand: any) => {
          // Only filter out brands with no name at all
          const hasName = brand && (brand.companyName || brand.name)
          return hasName
        })
        
        // Limit to 6 featured brands (already sorted by API)
        const featured = brandsWithProfiles.slice(0, 6)
        
        setFeaturedBrands(featured)
        
        // Log DOM visibility after state update - check multiple times to catch animation completion
        setTimeout(() => {
          const brandCards = document.querySelectorAll('[data-brand-card]')
          const visibleCards = Array.from(brandCards).filter((el: any) => {
            const style = getComputedStyle(el)
            return style.opacity !== '0' && style.display !== 'none' && style.visibility !== 'hidden'
          })
        }, 3000) // Increased to 3s to allow animation to complete
        
        // Log for debugging
        console.log('[Homepage] Loaded brands:', {
          total: brandsWithProfiles.length,
          featured: featured.length,
          brands: featured.map((b: any) => ({
            id: b.id,
            name: b.companyName || b.name,
            displayOrder: b.displayOrder,
            hasProfile: !!b.brandProfile
          }))
        })
      } catch (error: any) {
        console.error('Error fetching featured brands:', error)
        setBrandsError(error.message || 'Failed to load brands')
        setFeaturedBrands([])
      } finally {
        setBrandsLoading(false)
      }
    }
    
    fetchFeaturedBrands()
  }, [])

  // Predefined particle positions to avoid hydration mismatch
  const particlePositions = [
    { left: 10, top: 15, delay: 0 },
    { left: 25, top: 30, delay: 0.5 },
    { left: 40, top: 10, delay: 1 },
    { left: 55, top: 45, delay: 1.5 },
    { left: 70, top: 20, delay: 2 },
    { left: 85, top: 35, delay: 2.5 },
    { left: 15, top: 60, delay: 0.3 },
    { left: 30, top: 75, delay: 0.8 },
    { left: 45, top: 55, delay: 1.3 },
    { left: 60, top: 80, delay: 1.8 },
    { left: 75, top: 65, delay: 2.3 },
    { left: 90, top: 50, delay: 2.8 },
    { left: 12, top: 40, delay: 0.2 },
    { left: 35, top: 25, delay: 0.7 },
    { left: 50, top: 70, delay: 1.2 },
    { left: 65, top: 15, delay: 1.7 },
    { left: 80, top: 55, delay: 2.2 },
    { left: 95, top: 30, delay: 2.7 },
    { left: 20, top: 85, delay: 0.4 },
    { left: 48, top: 35, delay: 0.9 },
    { left: 62, top: 60, delay: 1.4 },
    { left: 78, top: 10, delay: 1.9 },
    { left: 88, top: 75, delay: 2.4 },
    { left: 32, top: 50, delay: 0.6 },
    { left: 52, top: 22, delay: 1.1 },
  ]

  const particlePositionsBlue = [
    { left: 18, top: 20, delay: 1 },
    { left: 33, top: 35, delay: 1.5 },
    { left: 48, top: 15, delay: 2 },
    { left: 63, top: 50, delay: 2.5 },
    { left: 78, top: 25, delay: 0 },
    { left: 93, top: 40, delay: 0.5 },
    { left: 22, top: 65, delay: 1.3 },
    { left: 37, top: 80, delay: 1.8 },
    { left: 52, top: 60, delay: 2.3 },
    { left: 67, top: 85, delay: 2.8 },
    { left: 82, top: 70, delay: 0.3 },
    { left: 97, top: 55, delay: 0.8 },
    { left: 8, top: 45, delay: 1.2 },
    { left: 28, top: 28, delay: 1.7 },
    { left: 43, top: 72, delay: 2.2 },
    { left: 58, top: 18, delay: 2.7 },
    { left: 73, top: 58, delay: 0.2 },
    { left: 88, top: 33, delay: 0.7 },
    { left: 15, top: 88, delay: 1.4 },
    { left: 42, top: 38, delay: 1.9 },
    { left: 57, top: 63, delay: 2.4 },
    { left: 72, top: 12, delay: 0.4 },
    { left: 86, top: 78, delay: 0.9 },
    { left: 26, top: 52, delay: 1.6 },
    { left: 46, top: 24, delay: 2.1 },
  ]

  const handleBrandComplete = (profile: Partial<BrandProfile>) => {
    setBrandProfile(profile as BrandProfile)
    setCurrentStep('brand-dashboard')
  }

  const handleOwnerComplete = (profile: Partial<OwnerProfile>) => {
    setOwnerProfile(profile as OwnerProfile)
    setCurrentStep('owner-dashboard')
  }

  const resetToHome = () => {
    setCurrentStep('home')
    setBrandProfile(null)
    setOwnerProfile(null)
  }

  // Show onboarding or dashboard if user has started the process
  if (currentStep === 'brand-onboarding') {
    return (
      <div className="relative">
        <button
          onClick={resetToHome}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 hover:bg-white hover:shadow-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
        <BrandOnboardingForm onComplete={handleBrandComplete} />
      </div>
    )
  }

  if (currentStep === 'owner-onboarding') {
    return (
      <div className="relative">
        <button
          onClick={resetToHome}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 hover:bg-white hover:shadow-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
        <PropertyOwnerOnboardingForm onComplete={handleOwnerComplete} />
      </div>
    )
  }

  if (currentStep === 'brand-dashboard' && brandProfile) {
    return (
      <div className="relative">
        <button
          onClick={resetToHome}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 hover:bg-white hover:shadow-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
        <Dashboard userType="brand" userProfile={brandProfile} properties={mockProperties} />
      </div>
    )
  }

  if (currentStep === 'owner-dashboard' && ownerProfile) {
    return (
      <div className="relative">
        <button
          onClick={resetToHome}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 hover:bg-white hover:shadow-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
        <Dashboard userType="owner" userProfile={ownerProfile} />
      </div>
    )
  }

  const colors = getPaletteColors(theme.palette)

  // Structured Data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Lokazen',
    description: 'AI-powered commercial real estate matchmaking platform connecting brands with property owners',
    url: 'https://lokazen.in',
    areaServed: {
      '@type': 'City',
      name: 'Bangalore',
      containedIn: {
        '@type': 'Country',
        name: 'India',
      },
    },
    serviceType: 'Commercial Real Estate Matchmaking',
    offers: {
      '@type': 'Offer',
      description: 'AI-powered property matching for brands and property owners',
    },
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Structured Data JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Network Map Background */}
      <NetworkMapBackground />
      
      {/* Advanced Animated Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Subtle Grid */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255, 82, 0, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 82, 0, 0.5) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
            animation: 'grid 40s linear infinite'
          }}></div>
        </div>
        
        {/* Multiple Floating Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#FF5200]/10 via-[#E4002B]/5 to-transparent rounded-full blur-[120px] animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#E4002B]/8 via-[#FF6B35]/4 to-transparent rounded-full blur-[100px] animate-[float_25s_ease-in-out_infinite_5s]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-gradient-to-br from-[#FF6B35]/6 via-[#FF5200]/3 to-transparent rounded-full blur-[90px] animate-[float_18s_ease-in-out_infinite_10s]"></div>

        {/* Scanning Beams */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 left-1/6 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_5s_ease-in-out_infinite]"></div>
          <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_5s_ease-in-out_infinite_1s]"></div>
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-[#FF6B35] to-transparent animate-[scan_5s_ease-in-out_infinite_2s]"></div>
          <div className="absolute top-0 right-1/6 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_5s_ease-in-out_infinite_3s]"></div>
        </div>
      </div>
      
      <Navbar hideOnMobile={showMobileNav} />

      {/* Hero Section */}
      <div className={`relative min-h-screen flex items-center justify-center pt-20 sm:pt-24 pb-12 sm:pb-16 transition-all duration-700 ${heroMode === 'owner' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : ''}`} style={{ zIndex: 10 }}>
        {/* Platform Performance Style Background - Only when owner mode */}
        {heroMode === 'owner' && (
          <>
            {/* Dark Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950"></div>
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-50" style={{
              backgroundImage: `
                linear-gradient(rgba(228, 0, 43, 0.25) 1px, transparent 1px),
                linear-gradient(90deg, rgba(228, 0, 43, 0.25) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}></div>
            
            {/* Floating Gradient Orbs - More Subtle */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#E4002B]/20 to-[#FF5200]/20 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]"></div>
              <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-[#FF5200]/20 to-[#FF6B35]/20 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]"></div>
            </div>
          </>
        )}

        {/* Subtle City Dots - Only when brand mode */}
        {heroMode === 'brand' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          {[
            {top: '20%', left: '15%', delay: '0s'},
            {top: '35%', left: '75%', delay: '0.5s'},
            {top: '60%', left: '25%', delay: '1s'},
            {top: '75%', left: '80%', delay: '1.5s'},
            {top: '45%', left: '50%', delay: '2s'}
          ].map((dot, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] animate-pulse"
              style={{top: dot.top, left: dot.left, animationDelay: dot.delay}}
            />
          ))}
        </div>
        )}

        <div className="text-center max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10 w-full py-6 sm:py-8 md:py-12">
          {/* Trust Indicator Badge */}
          <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 sm:py-2 backdrop-blur-xl rounded-full mb-2 sm:mb-3 md:mb-4 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.1s_forwards] transition-all duration-700 ${heroMode === 'owner' ? 'bg-white/10 border border-[#E4002B]/30' : 'bg-white/90 border border-gray-200 shadow-sm'}`}>
            <div className="flex -space-x-1.5 sm:-space-x-2">
              <div className="relative w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-2 border-white overflow-hidden flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=100&fit=crop&q=80" 
                  alt="Property"
                  className="w-full h-full object-cover"
                />
            </div>
              <div className="relative w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-2 border-white overflow-hidden flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop&q=80" 
                  alt="Property"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-2 border-white overflow-hidden flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100&h=100&fit=crop&q=80" 
                  alt="Property"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className={`text-xs sm:text-sm md:text-base font-medium transition-colors duration-700 ${heroMode === 'owner' ? 'text-white' : 'text-gray-700'}`}>500+ Properties Across Locations</span>
          </div>
          
          {/* Focused Hero Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-7xl font-bold mb-2 sm:mb-2.5 md:mb-3 leading-tight tracking-tight opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards] px-2 sm:px-4">
            <span className={`transition-colors duration-700 ${heroMode === 'owner' ? 'text-white' : 'text-gray-900'}`}>Connecting</span>
            <br className="block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] bg-[length:200%_200%] animate-gradientShift">Brands&nbsp;&</span>
            <br className="block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] bg-[length:200%_200%] animate-gradientShift">Prime&nbsp;Properties</span>
          </h1>
          
          {/* Commercial Real Estate | Rental subtitle */}
          <p className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl mb-3 sm:mb-4 md:mb-5 max-w-2xl mx-auto opacity-0 animate-[fadeInUp_0.8s_ease-out_0.25s_forwards] transition-colors duration-700 px-3 sm:px-4 ${heroMode === 'owner' ? 'text-gray-300' : 'text-gray-600'}`}>
            Commercial Real Estate | Rental
          </p>
          
          <div className="mt-3 sm:mt-4 md:mt-5 mb-2 sm:mb-3 md:mb-4 w-full px-2 sm:px-0">
            <HeroSearch onModeChange={setHeroMode} />
                    </div>
                  </div>
                  
        {/* Section Break Line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent opacity-50"></div>
      </div>

      {/* Clientele Slider - Full Width */}
      <div className="relative z-10 mt-8 sm:mt-12 md:mt-16 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.8s_forwards]">
        <div className="text-center mb-14 md:mb-16">
          <div className="relative inline-flex items-center px-5 py-2 bg-gray-50 border border-gray-200 rounded-full">
            <span className="relative w-1.5 h-1.5 bg-gray-400 rounded-full mr-2.5"></span>
            <span className="relative text-sm font-medium text-gray-700">Trusted by Leading Brands</span>
          </div>
        </div>
        
        
        {/* First Row - Cinematic infinite scroll LEFT → RIGHT */}
        <div className="relative mb-5 w-full overflow-hidden">
          <div className="flex gap-5 md:gap-6 w-max animate-[scroll_35s_linear_infinite]">
            {[
              ...trustedRow1Brands,
              ...trustedRow1Brands,
              ...trustedRow1Brands,
            ].map((brand, idx) => {
              return (
              <div 
                key={idx}
                  className="relative flex-shrink-0 h-16 md:h-18 px-7 md:px-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center select-none"
                >
                <span className="relative text-gray-700 font-semibold text-sm md:text-base whitespace-nowrap">
                  {brand}
                </span>
              </div>
              )
            })}
          </div>
        </div>

        {/* Second Row - Logo Images - Seamless infinite loop with scroll/touch/drag */}
        <div 
          className="relative mb-5 w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div 
            ref={logoRowRef}
            className="flex gap-6 md:gap-8 items-center py-2 will-change-transform pointer-events-none"
            style={{ 
              minWidth: 'max-content'
            }}
          >
            {/* Render 3 copies for seamless infinite loop */}
            {[...uniqueLogos, ...uniqueLogos, ...uniqueLogos].map((logoItem, idx) => {
              const logoPath = logoItem.logoPath as string
              const brandName = logoItem.brand
              const shouldRemoveBg = needsBackgroundRemoval(brandName)
              
              return (
              <div
                key={`logo-container-${idx}`}
                className="relative flex-shrink-0 w-auto flex items-center justify-center h-16 md:h-20"
              >
                <div className="relative h-full flex items-center justify-center w-full">
                  {/* Robust Logo Image Component - NEVER disappears, always shows fallback */}
                  <LogoImage
                    src={logoPath}
                    alt={`${brandName} logo`}
                    brandName={brandName}
                    loading={idx < 6 ? 'eager' : 'lazy'}
                    fetchPriority={idx < 6 ? 'high' : 'low'}
                    shouldRemoveBg={shouldRemoveBg}
                    hasBlackBackground={hasBlackBackground(brandName)}
                    style={{ height: '64px', minHeight: '64px' }}
                  />
              </div>
              </div>
            )})}
          </div>
        </div>

        {/* Third Row - Cinematic infinite scroll LEFT → RIGHT */}
        <div className="relative mb-5 w-full overflow-hidden">
          <div className="flex gap-5 md:gap-6 w-max animate-[scroll_38s_linear_infinite]">
            {[
              ...trustedRow3Brands,
              ...trustedRow3Brands,
              ...trustedRow3Brands,
            ].map((brand, idx) => {
              return (
              <div 
                key={idx}
                  className="relative flex-shrink-0 h-16 md:h-18 px-7 md:px-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center select-none"
                >
                <span className="relative text-gray-700 font-semibold text-sm md:text-base whitespace-nowrap">
                  {brand}
                </span>
              </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Featured Brand Requirements Section */}
      <section className="relative z-10 bg-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <div className="inline-flex items-center px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-gray-50 rounded-full mb-3 sm:mb-4 md:mb-5 border border-gray-200">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 sm:mr-2.5"></span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Active Brand Searches</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 px-4" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
              <span className="whitespace-nowrap">Featured Brand</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] whitespace-nowrap">Requirements</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              F&B brands actively searching for commercial spaces
            </p>
          </div>

          {/* Brand Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-stretch">
            {brandsLoading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
              </div>
            ) : brandsError ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p>Unable to load featured brands. Please try again later.</p>
              </div>
            ) : featuredBrands.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p>No featured brands available at the moment.</p>
              </div>
            ) : (
              featuredBrands
                .filter((brand) => {
                  const isValid = brand && (brand.id || brand.companyName || brand.name)
                  return isValid
                })
                .map((brand, index) => {
                  try {
                    const brandId = brand.id || `brand-${index}`
                    return (
                      <DynamicBrandCard 
                        key={brandId} 
                        brand={brand} 
                        index={index}
                        isExpanded={expandedBrandId === brandId}
                        onToggleExpand={() => {
                          setExpandedBrandId(expandedBrandId === brandId ? null : brandId)
                        }}
                      />
                    )
                  } catch (error: any) {
                    console.error('[Homepage] Error rendering brand card:', error, brand)
                    return null
                  }
                })
                .filter(Boolean)
            )}
            
            {/* Fallback: Show hardcoded cards if no brands from API (for backwards compatibility) */}
            {!brandsLoading && featuredBrands.length === 0 && (
              <>
            {/* Brand Card 1 - Truffles with Platform Colors */}
            <div className="relative group">
              <div className="relative bg-white backdrop-blur-xl rounded-2xl p-6 border-2 border-gray-200 hover:border-[#FF5200] overflow-hidden shadow-lg hover:shadow-[#FF5200]/30">
                {/* Glow Effect - Platform Colors */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100"></div>
                
                {/* Corner Accent - Platform Colors */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Truffles Logo */}
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg shadow-[#FF5200]/50 overflow-hidden bg-white p-1.5">
                        <img 
                          src="/logos/truffles logo.jpg" 
                          alt="Truffles Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">Truffles</h3>
                        <p className="text-sm text-gray-600">Fine Dining</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">Active</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Size:</span> 1,200-1,800 sqft</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Location:</span> Indiranagar, Koramangala</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Budget:</span> <span className="blur-sm select-none">₹1.2L-2L/month</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Timeline:</span> Within 1 month</span>
                    </div>
                  </div>
                </div>

                {/* Pulse Ring - Platform Colors */}
                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>

            {/* Brand Card 2 - Original Burger Co. with Platform Colors */}
            <div className="relative group">
              <div className="relative bg-white backdrop-blur-xl rounded-2xl p-6 border-2 border-gray-200 hover:border-[#FF5200] overflow-hidden shadow-lg hover:shadow-[#FF5200]/30">
                {/* Glow Effect - Platform Colors */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100"></div>
                
                {/* Corner Accent - Platform Colors */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg shadow-[#FF5200]/50 overflow-hidden bg-white p-1.5">
                        <img 
                          src="/logos/Original_Burger_Co_Logo.png" 
                          alt="Original Burger Co. Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">Original Burger Co.</h3>
                        <p className="text-sm text-gray-600">QSR</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">New</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Size:</span> 800-1,200 sqft</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Location:</span> Whitefield, Marathahalli</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Budget:</span> <span className="blur-sm select-none">₹80K-1.2L/month</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Timeline:</span> Immediate</span>
                    </div>
                  </div>
                </div>

                {/* Pulse Ring - Platform Colors */}
                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>

            {/* Brand Card 3 - Blr Brewing Co. with Platform Colors */}
            <div className="relative group">
              <div className="relative bg-white backdrop-blur-xl rounded-2xl p-6 border-2 border-gray-200 hover:border-[#FF5200] overflow-hidden shadow-lg hover:shadow-[#FF5200]/30">
                {/* Glow Effect - Platform Colors */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100"></div>
                
                {/* Corner Accent - Platform Colors */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg shadow-[#FF5200]/50 overflow-hidden bg-white p-1.5">
                        <img 
                          src="/logos/blr brewing co logo.png" 
                          alt="Blr Brewing Co. Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">Blr Brewing Co.</h3>
                        <p className="text-sm text-gray-600">Brewery & Restaurant</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">Active</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Size:</span> 2,000-3,000 sqft</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Location:</span> MG Road, Brigade Road</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Budget:</span> <span className="blur-sm select-none">₹2L-3.5L/month</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Timeline:</span> Within 2 months</span>
                    </div>
                  </div>
                </div>

                {/* Pulse Ring - Platform Colors */}
                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>

            {/* Brand Card 4 - Mumbai Pav Co. with Platform Colors */}
            <div className="relative group">
              <div className="relative bg-white backdrop-blur-xl rounded-2xl p-6 border-2 border-gray-200 hover:border-[#FF5200] overflow-hidden shadow-lg hover:shadow-[#FF5200]/30">
                {/* Glow Effect - Platform Colors */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100"></div>
                
                {/* Corner Accent - Platform Colors */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg shadow-[#FF5200]/50 overflow-hidden bg-white p-1.5">
                        <img 
                          src="/logos/Mumbai Pav Co.jpg" 
                          alt="Mumbai Pav Co. Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">Mumbai Pav Co.</h3>
                        <p className="text-sm text-gray-600">Cloud Kitchen</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">Active</span>
                  </div>
              
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Size:</span> 600-1,000 sqft</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Location:</span> HSR Layout, Bellandur</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Budget:</span> <span className="blur-sm select-none">₹60K-90K/month</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Timeline:</span> Immediate</span>
                    </div>
                  </div>
                </div>

                {/* Pulse Ring - Platform Colors */}
                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>

            {/* Brand Card 5 - Blue Tokai with Platform Colors */}
            <div className="relative group">
              <div className="relative bg-white backdrop-blur-xl rounded-2xl p-6 border-2 border-gray-200 hover:border-[#FF5200] overflow-hidden shadow-lg hover:shadow-[#FF5200]/30">
                {/* Glow Effect - Platform Colors */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100"></div>
                
                {/* Corner Accent - Platform Colors */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg shadow-[#FF5200]/50 overflow-hidden bg-white p-1.5">
                        <img 
                          src="/logos/Blue Tokai.jpg" 
                          alt="Blue Tokai Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">Blue Tokai</h3>
                        <p className="text-sm text-gray-600">Café</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">New</span>
                  </div>
              
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Size:</span> 1,000-1,500 sqft</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Location:</span> Indiranagar, Koramangala</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Budget:</span> <span className="blur-sm select-none">₹1L-1.5L/month</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Timeline:</span> Within 1 month</span>
                    </div>
                  </div>
                </div>

                {/* Pulse Ring - Platform Colors */}
                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>

            {/* Brand Card 6 - Namaste- South Indian Restaurant with Platform Colors */}
            <div className="relative group">
              <div className="relative bg-white backdrop-blur-xl rounded-2xl p-6 border-2 border-gray-200 hover:border-[#FF5200] overflow-hidden shadow-lg hover:shadow-[#FF5200]/30">
                {/* Glow Effect - Platform Colors */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100"></div>
                
                {/* Corner Accent - Platform Colors */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg shadow-[#FF5200]/50 overflow-hidden bg-white p-1.5">
                        <img 
                          src="/logos/Namaste logo.jpg" 
                          alt="Namaste- South Indian Restaurant Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">Namaste</h3>
                        <p className="text-sm text-gray-600">South Indian Restaurant</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">Active</span>
                  </div>
              
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Size:</span> 2,000-3,000 sqft</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Location:</span> Across Bangalore</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Budget:</span> <span className="blur-sm select-none">₹1.5L-2.5L/month</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-8 h-8 bg-[#FF5200]/10 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span><span className="font-semibold text-gray-900">Timeline:</span> Within 2 months</span>
                    </div>
                  </div>
                </div>

                {/* Pulse Ring - Platform Colors */}
                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 mt-6 md:mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <button
                onClick={() => router.push('/filter/owner')}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl min-w-[180px] sm:min-w-[200px] flex items-center justify-center gap-2"
              >
                <span>List Property</span>
                <span 
                  className="px-2 py-0.5 relative overflow-hidden text-white text-[10px] font-bold rounded-full border border-red-500/70 flex items-center gap-1 flex-shrink-0"
                  style={{
                    background: 'linear-gradient(90deg, rgba(244, 114, 182, 1), rgba(236, 72, 153, 1), rgba(244, 114, 182, 1), rgba(251, 113, 133, 1), rgba(244, 114, 182, 1))',
                    backgroundSize: '300% 100%',
                    animation: 'gradientShift 2s ease-in-out infinite',
                    boxShadow: '0 0 8px rgba(236, 72, 153, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <svg className="w-1.5 h-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="whitespace-nowrap z-10">Instant</span>
                  <span 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full pointer-events-none"
                    style={{
                      animation: 'shine 2.5s ease-in-out infinite',
                    }}
                  />
                </span>
              </button>
            </div>
            
            {/* Discover More Link */}
            <button
              onClick={() => setIsBrandModalOpen(true)}
              className="text-[#FF5200] hover:text-[#E4002B] font-medium text-sm md:text-base transition-colors duration-200 flex items-center gap-2 group"
            >
              <span>Discover More Brand Requirements</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Our Brand Placements - Bangalore Map Illustration Section */}
      <section id="brand-placements" className="relative z-10 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-12 md:py-16 overflow-hidden">
        {/* Platform Performance Style Background */}
        {/* Dark Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-50" style={{
          backgroundImage: `
            linear-gradient(rgba(228, 0, 43, 0.25) 1px, transparent 1px),
            linear-gradient(90deg, rgba(228, 0, 43, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}></div>
        
        {/* Floating Gradient Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#E4002B]/20 to-[#FF5200]/20 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-[#FF5200]/20 to-[#FF6B35]/20 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <div className="inline-flex items-center px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-white/10 backdrop-blur-xl rounded-full mb-3 sm:mb-4 md:mb-5 border border-[#E4002B]/30">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 sm:mr-2.5"></span>
              <span className="text-xs sm:text-sm font-medium text-white">Recent Matches</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 px-4">
              Our Brand <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Placements</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
              Check out some of our Premium Brand Placements across Bangalore
            </p>
          </div>

                    {/* Bangalore Map Illustration */}
                    <div className="relative w-full rounded-2xl overflow-hidden bg-gray-950/60 backdrop-blur-xl border border-[#FF5200]/20 shadow-2xl" style={{ contain: 'layout style paint' }}>
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{
              backgroundImage: `
                linear-gradient(rgba(255, 82, 0, 0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 82, 0, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}></div>
            {/* Map Container - Responsive Height with mobile zoom and centering */}
            <div className="relative w-full h-[450px] sm:h-[500px] md:h-[550px] lg:h-[600px] overflow-hidden flex items-center justify-center">
              <div className="bangalore-map-mobile-container w-full h-full origin-center" style={{ willChange: 'transform' }}>
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">Loading map...</div>
            </div>
                }>
                  <BangaloreMapIllustration 
                    width="100%"
                    height="100%"
                    backgroundColor="transparent"
                    showLabels={true}
                    showOutline={false}
                    animationSpeed={1.2}
                    className="w-full h-full"
                  >
                    {/* Brand Placement Pins - Client-side only */}
                    {isClient && brandPlacements.map((placement, index) => {
                      try {
                        const coords = getPlacementCoordinates(placement, index, brandPlacements);
                        if (!coords) return null;
                        
                        return (
                          <Suspense key={`suspense-${index}`} fallback={null}>
                            <BrandPlacementPin
                              key={`${placement.brand}-${placement.location}-${index}`}
                              placement={placement}
                              x={coords.x}
                              y={coords.y}
                              index={index}
                            />
                          </Suspense>
                        );
                      } catch (error) {
                        console.error('Error rendering pin:', error);
                        return null;
                      }
                    })}
                  </BangaloreMapIllustration>
                </Suspense>
            </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Featured Properties Section - Removed from frontend, managed from backend/admin panel */}

      {/* How It Works - Card-Based Layout */}
      <section className="relative z-10 bg-gradient-to-b from-white via-gray-50/30 to-white py-12 md:py-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-20 w-96 h-96 bg-gradient-to-br from-[#FF5200]/5 to-transparent rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-gradient-to-br from-[#E4002B]/5 to-transparent rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
            <div className="inline-flex items-center px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-white/80 backdrop-blur-xl border border-[#FF5200]/20 rounded-full mb-3 sm:mb-4 md:mb-5 shadow-[0_0_20px_rgba(255,82,0,0.1)]">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 sm:mr-2.5 animate-pulse shadow-[0_0_5px_rgba(255,82,0,0.8)]"></span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Simple & Fast Process</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight tracking-tight px-4">
              <span className="whitespace-nowrap">How&nbsp;It</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] animate-gradientShift bg-[length:400%_400%] whitespace-nowrap">Works</span>
            </h2>
            
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              From onboarding to deal closure - powered by AI in just 4 steps
            </p>
          </div>

          {/* Process Steps - Sleek Cards in 2x2 Grid */}
          <div className="grid md:grid-cols-2 gap-5 lg:gap-6 relative z-10 mb-20">
            {/* Step 1 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
              <div className="relative h-full bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#FF5200] hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF5200]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl font-black text-[#FF5200]">01</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#FF5200]/30 to-transparent"></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Up & Onboard</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        Create your profile as a Brand or Property Owner. Complete onboarding in under 5 minutes.
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[#FF5200] font-semibold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        5 minutes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
              <div className="relative h-full bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#E4002B] hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#E4002B]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#E4002B] to-[#FF6B35] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl font-black text-[#E4002B]">02</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#E4002B]/30 to-transparent"></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analyzes Data</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        Our AI engine processes your requirements with location intelligence and market data.
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[#E4002B] font-semibold">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Real-time processing
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
              <div className="relative h-full bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#FF6B35] hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF6B35]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B35] to-[#FF5200] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl font-black text-[#FF6B35]">03</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#FF6B35]/30 to-transparent"></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Get Top 5 Matches</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        Receive your Top 5 AI-scored matches with detailed insights and instant notifications.
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[#FF6B35] font-semibold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Top 5 curated
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards]">
              <div className="relative h-full bg-white border border-gray-200 rounded-2xl p-6 hover:border-green-500 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl font-black text-green-600">04</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-green-600/30 to-transparent"></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Close the Deal</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        Review, shortlist, and connect directly. Our platform facilitates smooth deal closure.
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Deal completed
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Old content removed */}
          <div className="relative mb-20 hidden">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] animate-gradientShift bg-[length:200%_200%] opacity-30"></div>
            </div>

            {/* Steps Grid */}
            <div className="grid md:grid-cols-4 gap-6 sm:gap-8 relative z-10">
              {/* Step 1 */}
              <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]" style={{animationDelay: '0.2s'}}>
                <div className="flex flex-col items-center text-center">
                  {/* Icon Circle */}
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                      <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-white border-3 sm:border-4 border-[#FF5200] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xl sm:text-2xl font-black text-[#FF5200]">1</span>
                    </div>
                    {/* Pulse Animation */}
                    <div className="absolute inset-0 rounded-full border-2 border-[#FF5200] animate-ping opacity-20"></div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Sign Up & Onboard</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Create your profile as a Brand or Property Owner. Complete onboarding in <span className="font-semibold text-[#FF5200]">under 5 minutes</span> with our intuitive forms.
                  </p>
                  
                  {/* Floating Badge */}
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-[#FF5200]/10 rounded-full">
                    <svg className="w-4 h-4 text-[#FF5200] mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-[#FF5200]">~5 mins</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]" style={{animationDelay: '0.4s'}}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-[#E4002B] to-[#FF6B35] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                      <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-white border-3 sm:border-4 border-[#E4002B] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xl sm:text-2xl font-black text-[#E4002B]">2</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-[#E4002B] animate-ping opacity-20"></div>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">AI Analyzes Data</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Our AI engine processes your requirements with <span className="font-semibold text-[#E4002B]">location intelligence</span> - footfall, demographics, competitors, accessibility.
                  </p>
                  
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-[#E4002B]/10 rounded-full">
                    <svg className="w-4 h-4 text-[#E4002B] mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-xs font-semibold text-[#E4002B]">Processing</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards]" style={{animationDelay: '0.6s'}}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-[#FF6B35] to-[#FF5200] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                      <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-white border-3 sm:border-4 border-[#FF6B35] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xl sm:text-2xl font-black text-[#FF6B35]">3</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-[#FF6B35] animate-ping opacity-20"></div>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Get Top 5 Matches</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Receive your <span className="font-semibold text-[#FF6B35]">Top 5 AI-scored matches</span> with BFI/PFI ratings, detailed insights, and instant WhatsApp notifications.
                  </p>
                  
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-[#FF6B35]/10 rounded-full">
                    <svg className="w-4 h-4 text-[#FF6B35] mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-[#FF6B35]">Top 5</span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards]" style={{animationDelay: '0.8s'}}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                      <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-white border-3 sm:border-4 border-[#FF5200] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xl sm:text-2xl font-black text-[#FF5200]">4</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-[#FF5200] animate-ping opacity-20"></div>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Close the Deal</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Review, shortlist, and connect directly. Our platform facilitates smooth communication to <span className="font-semibold text-[#FF5200]">finalize agreements</span> fast.
                  </p>
                  
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-100 rounded-full">
                    <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-green-600">Success</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Journey Visualization - Redesigned (hidden as per latest requirements) */}
          <div className="hidden" style={{animationDelay: '1s'}}>
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 px-4">
                Your Journey <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Timeline</span>
              </h3>
              <p className="text-gray-600 mb-2">From first click to final handshake - we make it seamless</p>
              <div className="flex flex-col items-center gap-2">
                <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-[#FF5200]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Average completion: <span className="font-semibold ml-1">14-30 days</span>
                </div>
                <p className="text-xs text-gray-500 max-w-md text-center">*depending on external factors like financial readiness and documentation</p>
              </div>
            </div>

            {/* Horizontal Timeline Container */}
            <div className="relative max-w-6xl mx-auto">
              {/* Progress Bar Background */}
              <div className="hidden lg:block absolute top-20 sm:top-24 left-0 right-0 h-1 bg-gray-200 rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-green-500 rounded-full opacity-30 animate-pulse"></div>
              </div>

              {/* Timeline Stages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
                {/* Stage 1 - Onboarding */}
                <div className="group relative">
                  <div className="flex flex-col items-center h-full">
                    {/* Icon with Progress Ring */}
                    <div className="relative mb-4 sm:mb-5 flex items-center justify-center">
                      <svg className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 transform -rotate-90" viewBox="0 0 128 128" preserveAspectRatio="xMidYMid meet">
                        <circle cx="64" cy="64" r="58" stroke="#f0f0f0" strokeWidth="6" fill="none"/>
                        <circle cx="64" cy="64" r="58" stroke="url(#gradient1)" strokeWidth="6" fill="none" strokeDasharray="364" strokeDashoffset="0" className="transition-all duration-1000"/>
                        <defs>
                          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF5200"/>
                            <stop offset="100%" stopColor="#E4002B"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Timeline Badge */}
                    <div className="inline-flex items-center justify-center px-4 py-2 bg-[#FF5200] text-white rounded-lg text-sm font-bold mb-4 shadow-md w-fit mx-auto">
                      Day 1
                    </div>
                    
                    {/* Content Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#FF5200] hover:shadow-lg transition-all duration-300 flex-1 flex flex-col w-full">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Sign Up</h4>
                      <p className="text-base text-gray-600 mb-5 leading-relaxed">Quick 5-min onboarding with smart forms</p>
                      
                      {/* Action Items */}
                      <div className="space-y-3 flex flex-col">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-base text-gray-700">Profile creation</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-base text-gray-700">Requirements input</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-base text-gray-700">Preferences set</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 2 - AI Analysis */}
                <div className="group relative">
                  <div className="flex flex-col items-center h-full">
                    {/* Icon with Progress Ring */}
                    <div className="relative mb-4 sm:mb-5 flex items-center justify-center">
                      <svg className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 transform -rotate-90" viewBox="0 0 128 128" preserveAspectRatio="xMidYMid meet">
                        <circle cx="64" cy="64" r="58" stroke="#f0f0f0" strokeWidth="6" fill="none" className="sm:stroke-[8]"/>
                        <circle cx="64" cy="64" r="58" stroke="url(#gradient2)" strokeWidth="6" fill="none" strokeDasharray="364" strokeDashoffset="91" className="transition-all duration-1000 sm:stroke-[8]"/>
                        <defs>
                          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#E4002B"/>
                            <stop offset="100%" stopColor="#FF6B35"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-[#E4002B] to-[#FF6B35] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white animate-spin" style={{animationDuration: '3s'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Timeline Badge */}
                    <div className="inline-flex items-center justify-center px-4 py-2 bg-[#E4002B] text-white rounded-lg text-sm font-bold mb-4 shadow-md w-fit mx-auto">
                      Day 1-2
                    </div>
                    
                    {/* Content Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#E4002B] hover:shadow-lg transition-all duration-300 flex-1 flex flex-col w-full">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">AI Analysis</h4>
                      <p className="text-base text-gray-600 mb-5 leading-relaxed">Intelligent data processing begins</p>
                      
                      <div className="space-y-3 flex flex-col">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="text-base text-gray-700">Location scoring</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="text-base text-gray-700">Demographics match</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="text-base text-gray-700">BFI/PFI calculation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 3 - Matches */}
                <div className="group relative">
                  <div className="flex flex-col items-center h-full">
                    {/* Icon with Progress Ring */}
                    <div className="relative mb-4 sm:mb-5 flex items-center justify-center">
                      <svg className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 transform -rotate-90" viewBox="0 0 128 128" preserveAspectRatio="xMidYMid meet">
                        <circle cx="64" cy="64" r="58" stroke="#f0f0f0" strokeWidth="6" fill="none" className="sm:stroke-[8]"/>
                        <circle cx="64" cy="64" r="58" stroke="url(#gradient3)" strokeWidth="6" fill="none" strokeDasharray="364" strokeDashoffset="182" className="transition-all duration-1000 sm:stroke-[8]"/>
                        <defs>
                          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF6B35"/>
                            <stop offset="100%" stopColor="#FF5200"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-[#FF6B35] to-[#FF5200] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Timeline Badge */}
                    <div className="inline-flex items-center justify-center px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-bold mb-4 shadow-md w-fit mx-auto">
                      Day 2-7
                    </div>
                    
                    {/* Content Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#FF6B35] hover:shadow-lg transition-all duration-300 flex-1 flex flex-col w-full">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Top Matches</h4>
                      <p className="text-base text-gray-600 mb-5 leading-relaxed">Your curated list delivered</p>
                      
                      <div className="space-y-3 flex flex-col">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-base text-gray-700">Top 5 properties</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-base text-gray-700">Detailed insights</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-base text-gray-700">WhatsApp alerts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 4 - Decision */}
                <div className="group relative">
                  <div className="flex flex-col items-center h-full">
                    {/* Icon with Progress Ring */}
                    <div className="relative mb-4 sm:mb-5 flex items-center justify-center">
                      <svg className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 transform -rotate-90" viewBox="0 0 128 128" preserveAspectRatio="xMidYMid meet">
                        <circle cx="64" cy="64" r="58" stroke="#f0f0f0" strokeWidth="6" fill="none" className="sm:stroke-[8]"/>
                        <circle cx="64" cy="64" r="58" stroke="url(#gradient4)" strokeWidth="6" fill="none" strokeDasharray="364" strokeDashoffset="273" className="transition-all duration-1000 sm:stroke-[8]"/>
                        <defs>
                          <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF5200"/>
                            <stop offset="100%" stopColor="#E4002B"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Timeline Badge */}
                    <div className="inline-flex items-center justify-center px-4 py-2 bg-[#FF5200] text-white rounded-lg text-sm font-bold mb-4 shadow-md w-fit mx-auto">
                      Day 7-14
                    </div>
                    
                    {/* Content Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#FF5200] hover:shadow-lg transition-all duration-300 flex-1 flex flex-col w-full">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Review & Decide</h4>
                      <p className="text-base text-gray-600 mb-5 leading-relaxed">Connect and evaluate options</p>
                      
                      <div className="space-y-3 flex flex-col">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-base text-gray-700">Direct messaging</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-base text-gray-700">Site visits</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-base text-gray-700">Negotiations</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 5 - Success */}
                <div className="group relative">
                  <div className="flex flex-col items-center h-full">
                    {/* Icon with Progress Ring */}
                    <div className="relative mb-4 sm:mb-5 flex items-center justify-center">
                      <svg className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 transform -rotate-90" viewBox="0 0 128 128" preserveAspectRatio="xMidYMid meet">
                        <circle cx="64" cy="64" r="58" stroke="#f0f0f0" strokeWidth="6" fill="none" className="sm:stroke-[8]"/>
                        <circle cx="64" cy="64" r="58" stroke="#f0f0f0" strokeWidth="6" fill="none"/>
                        <circle cx="64" cy="64" r="58" stroke="#10b981" strokeWidth="6" fill="none" strokeDasharray="364" strokeDashoffset="0" className="transition-all duration-1000"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Timeline Badge */}
                    <div className="inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold mb-4 shadow-md w-fit mx-auto">
                      Day 14-30
                    </div>
                    
                    {/* Content Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition-all duration-300 flex-1 flex flex-col w-full">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Deal Closed!</h4>
                      <p className="text-base text-gray-600 mb-5 leading-relaxed">Success & move-in ready</p>
                      
                      <div className="space-y-3 flex flex-col">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-base text-gray-700">Agreement signed</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-base text-gray-700">Keys handed over</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-base text-gray-700">Store setup begins</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Explainer Video Section */}
          <div className="relative opacity-0 animate-[fadeInUp_0.8s_ease-out_1.2s_forwards]" style={{animationDelay: '1.2s'}}>
            <div className="text-center mb-6">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                See It In <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Action</span>
              </h3>
              <p className="text-gray-600">Watch how brands and property owners are transforming their real estate journey</p>
            </div>

            {/* Video Player Illustration */}
            <div className="relative group max-w-5xl mx-auto">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] rounded-3xl opacity-30 group-hover:opacity-50 blur-xl transition-all duration-700 animate-gradientShift bg-[length:200%_200%]"></div>
              
              <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800">
                {/* Video Illustration */}
                <div className="aspect-video bg-gradient-to-br from-gray-800 via-gray-900 to-black relative overflow-hidden">
                  {/* Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'linear-gradient(#FF5200 1px, transparent 1px), linear-gradient(90deg, #FF5200 1px, transparent 1px)',
                      backgroundSize: '50px 50px',
                      animation: 'grid 20s linear infinite'
                    }}></div>
                  </div>

                  {/* Floating Icons */}
                  <div className="absolute top-8 left-8 w-16 h-16 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-2xl flex items-center justify-center animate-[float_3s_ease-in-out_infinite] opacity-80">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>

                  <div className="absolute top-8 right-8 w-16 h-16 bg-gradient-to-br from-[#E4002B] to-[#FF6B35] rounded-2xl flex items-center justify-center animate-[float_3s_ease-in-out_infinite_1s] opacity-80">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>

                  {/* Data Flow Animation */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center justify-between">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-12 h-32 bg-gradient-to-t from-[#FF5200] to-transparent rounded-t-lg opacity-50 animate-pulse" style={{animationDelay: (i * 0.2) + 's', height: barHeights[i - 1] ? `${barHeights[i - 1]}px` : '40px'}}></div>
                      ))}
                    </div>
                  </div>

                  {/* Central Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="group/play relative">
                      {/* Pulsing Rings */}
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse"></div>
                      
                      {/* Play Button */}
                      <div className="relative w-24 h-24 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-transform duration-300 cursor-pointer">
                        <svg className="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      
                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full blur-2xl opacity-50 group-hover/play:opacity-75 transition-opacity"></div>
                    </button>
                  </div>

                  {/* Stats Overlay */}
                  <div className="absolute top-1/2 left-8 transform -translate-y-1/2 space-y-3">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 animate-[fadeInUp_0.8s_ease-out_forwards]">
                      <div className="text-2xl font-bold text-white">95%</div>
                      <div className="text-xs text-gray-300">Match Success</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
                      <div className="text-2xl font-bold text-white">Instant</div>
                      <div className="text-xs text-gray-300">Avg Response</div>
                    </div>
                  </div>

                  <div className="absolute top-1/2 right-8 transform -translate-y-1/2 space-y-3">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
                      <div className="text-2xl font-bold text-white">500+</div>
                      <div className="text-xs text-gray-300">Properties</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards]">
                      <div className="text-2xl font-bold text-white">20+</div>
                      <div className="text-xs text-gray-300">Areas</div>
                    </div>
                  </div>
                </div>

                {/* Communication Bar */}
                <div className="bg-black/60 backdrop-blur-md px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <p className="text-xs sm:text-sm text-gray-200 max-w-xl">
                      From first brief to shortlisted spaces in a single guided flow – no spreadsheets, no broker spam, just signal from brands and locations that actually fit.
                    </p>
                    <span className="text-[11px] sm:text-xs text-gray-400">
                      Built for brands expanding across Bangalore&apos;s 20+ high-intent micro-markets.
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Description */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 mb-4">
                  <span className="font-semibold text-gray-900">Coming Soon:</span> Interactive video walkthrough showing the complete journey from sign-up to successful deal closure
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-[#FF5200]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    3 min overview
                  </div>
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-[#E4002B]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                    Real case studies
                  </div>
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-[#FF6B35]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    AI insights demo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Futuristic Transition Element with Circuit Board Pattern */}
      <div className="relative z-10 h-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/30 via-gray-100/50 to-white"></div>
        
        {/* Circuit Board Lines */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M10 10 L30 10 L30 30 M70 10 L90 10 L90 30 M30 50 L50 50 L50 70 M70 70 L90 70 L90 90" 
                      stroke="#FF5200" strokeWidth="1" fill="none"/>
                <circle cx="30" cy="30" r="2" fill="#FF5200"/>
                <circle cx="50" cy="50" r="2" fill="#E4002B"/>
                <circle cx="70" cy="70" r="2" fill="#FF6B35"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)"/>
          </svg>
        </div>
        
        {/* Scanning Beams */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-[#FF5200] via-transparent to-transparent animate-[scan_3s_ease-in-out_infinite] shadow-[0_0_10px_rgba(255,82,0,0.5)]"></div>
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-[#E4002B] via-transparent to-transparent animate-[scan_3s_ease-in-out_infinite_1s] shadow-[0_0_10px_rgba(228,0,43,0.5)]"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-[#FF6B35] via-transparent to-transparent animate-[scan_3s_ease-in-out_infinite_2s] shadow-[0_0_10px_rgba(255,107,53,0.5)]"></div>
        </div>
        
        {/* Energy Flow Line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent opacity-50">
          <div className="absolute top-0 left-0 w-20 h-px bg-gradient-to-r from-transparent to-[#FF5200] shadow-[0_0_10px_rgba(255,82,0,0.8)] animate-[scroll_3s_linear_infinite]"></div>
        </div>
      </div>

      {/* Location Intelligence Section with Network Visualization */}
      <section className="relative z-10 bg-gradient-to-b from-white via-gray-50/50 to-white py-12 md:py-16 overflow-hidden">
        {/* Network Visualization - Connecting Dots and Beams */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Connection Lines/Beams */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF5200" stopOpacity="0"/>
                <stop offset="50%" stopColor="#FF5200" stopOpacity="1"/>
                <stop offset="100%" stopColor="#E4002B" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="url(#beam1)" strokeWidth="2" className="animate-pulse">
              <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite"/>
            </line>
            <line x1="90%" y1="20%" x2="10%" y2="80%" stroke="url(#beam1)" strokeWidth="2" className="animate-pulse" style={{animationDelay: '1s'}}>
              <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" begin="1s"/>
            </line>
            <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="url(#beam1)" strokeWidth="2" className="animate-pulse" style={{animationDelay: '2s'}}>
              <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" begin="2s"/>
            </line>
            <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="url(#beam1)" strokeWidth="2" className="animate-pulse" style={{animationDelay: '0.5s'}}>
              <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" begin="0.5s"/>
            </line>
          </svg>
          
          {/* Network Nodes/Dots */}
          {[
            {top: '20%', left: '10%', delay: '0s'},
            {top: '20%', left: '90%', delay: '0.5s'},
            {top: '80%', left: '10%', delay: '1s'},
            {top: '80%', left: '90%', delay: '1.5s'},
            {top: '50%', left: '20%', delay: '0.3s'},
            {top: '50%', left: '80%', delay: '0.8s'},
            {top: '10%', left: '50%', delay: '1.2s'},
            {top: '90%', left: '50%', delay: '1.7s'},
            {top: '35%', left: '45%', delay: '0.6s'},
            {top: '65%', left: '55%', delay: '1.3s'}
          ].map((node, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] shadow-[0_0_15px_rgba(255,82,0,0.6)]"
              style={{
                top: node.top,
                left: node.left,
                animation: 'pulse 2s ease-in-out infinite',
                animationDelay: node.delay
              } as React.CSSProperties}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] animate-ping opacity-75"></div>
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-8 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
            <div className="inline-flex items-center px-5 py-2 bg-white/80 backdrop-blur-xl border border-[#FF5200]/20 rounded-full mb-4 shadow-[0_0_20px_rgba(255,82,0,0.1)]">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2.5 animate-pulse shadow-[0_0_5px_rgba(255,82,0,0.8)]"></span>
              <span className="text-sm font-medium text-gray-700">Futuristic Technology</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 leading-tight tracking-tight">
              Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Location Intelligence</span>
            </h2>
            
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
              Advanced data analytics and AI scoring enriched with real-time location insights for perfect property-brand matching
            </p>
          </div>

          {/* Intelligence Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Feature 1 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]" style={{animationDelay: '0.2s'}}>
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-6 hover:border-[#FF5200] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200]/20 to-[#E4002B]/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Footfall Heatmaps</h4>
                <p className="text-sm text-gray-600">Real-time pedestrian traffic data from Google, MapMyIndia & mobile data APIs</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]" style={{animationDelay: '0.3s'}}>
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-6 hover:border-[#E4002B] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E4002B]/20 to-[#FF6B35]/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Demographics</h4>
                <p className="text-sm text-gray-600">Income levels, spending power, age groups & catchment population analysis</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]" style={{animationDelay: '0.4s'}}>
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-6 hover:border-[#FF6B35] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35]/20 to-[#FF5200]/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Competitor Mapping</h4>
                <p className="text-sm text-gray-600">Proximity analysis of similar brands & category saturation in the area</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards]" style={{animationDelay: '0.5s'}}>
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-6 hover:border-[#FF5200] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200]/20 to-[#E4002B]/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Accessibility Score</h4>
                <p className="text-sm text-gray-600">Metro connectivity, bus routes, parking availability & public transport access</p>
              </div>
            </div>
          </div>

          {/* AI Scoring Visualization */}
          <div className="relative group opacity-0 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards]" style={{animationDelay: '0.6s'}}>
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition duration-700"></div>
            
            <div className="relative bg-gradient-to-br from-white via-gray-50/50 to-white border-2 border-gray-200 rounded-3xl p-8 md:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF5200]/10 to-transparent rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      Dual AI Scoring Engine
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Every match is calculated with precision using our proprietary algorithms that analyze hundreds of data points
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 rounded-2xl p-4">
                        <div className="text-3xl font-black bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent mb-1">BFI</div>
                        <div className="text-xs text-gray-600 font-semibold">Brand Fit Index</div>
                        <p className="text-xs text-gray-500 mt-2">How well a property matches brand requirements</p>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-2xl p-4">
                        <div className="text-3xl font-black bg-gradient-to-r from-[#E4002B] to-[#FF6B35] bg-clip-text text-transparent mb-1">PFI</div>
                        <div className="text-xs text-gray-600 font-semibold">Property Fit Index</div>
                        <p className="text-xs text-gray-500 mt-2">How well a brand matches property characteristics</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <div className="relative w-48 h-48 md:w-56 md:h-56">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full opacity-20 animate-pulse"></div>
                      <div className="absolute inset-4 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-2xl">
                        <div className="text-center text-white">
                          <div className="text-5xl font-black mb-2">95%</div>
                          <div className="text-sm font-semibold opacity-90">Match Score</div>
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-[#FF5200]">
                        <svg className="w-8 h-8 text-[#FF5200]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Futuristic Transition Element */}
      <div className="relative z-10 h-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-100/50 to-gray-50/30"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-[#FF5200] via-transparent to-transparent animate-[scan_3s_ease-in-out_infinite]"></div>
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-[#E4002B] via-transparent to-transparent animate-[scan_3s_ease-in-out_infinite_1s]"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-[#FF6B35] via-transparent to-transparent animate-[scan_3s_ease-in-out_infinite_2s]"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent opacity-50"></div>
      </div>

      {/* Trust Stats Section - Futuristic */}
      <section className="relative z-10 bg-gradient-to-b from-gray-900 via-black to-gray-900 py-24 md:py-32 overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#FF5200 1px, transparent 1px), linear-gradient(90deg, #FF5200 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'grid 20s linear infinite'
          }}></div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#FF5200]/30 to-[#E4002B]/30 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-[#E4002B]/30 to-[#FF6B35]/30 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]"></div>
        </div>

        {/* Scanning Lines */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_4s_ease-in-out_infinite]"></div>
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_4s_ease-in-out_infinite_2s]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
            <div className="inline-flex items-center px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4 sm:mb-5 md:mb-6 border border-[#FF5200]/30">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 sm:mr-2.5 animate-pulse"></span>
              <span className="text-xs sm:text-sm font-medium text-white">Platform Performance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 px-4">
              Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Industry Leaders</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {/* Stat 1 */}
            <div className="relative group opacity-0 animate-[fadeInUp_0.8s_ease-out_0.1s_forwards]">
              <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 border-2 border-[#FF5200]/30 hover:border-[#FF5200] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#FF5200]/50 group-hover:-translate-y-1 sm:group-hover:-translate-y-2">
                {/* Animated Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                {/* Animated Corner Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
                
                {/* Particle Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#FF5200] rounded-full animate-ping"></div>
                  <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-[#E4002B] rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-lg sm:rounded-xl mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-[#FF5200]/50">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#FF6B35] to-[#E4002B] mb-2 sm:mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(255,82,0,0.5)] whitespace-nowrap">
                    500+
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-200 font-semibold leading-tight">
                    Properties Listed
                  </div>
                  <div className="mt-1.5 sm:mt-2 md:mt-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#FF5200]/20 border border-[#FF5200]/40 rounded-full text-[9px] sm:text-[10px] md:text-xs text-[#FF5200] font-bold inline-block">↑ 23% this month</div>
                </div>

                {/* Enhanced Pulse Ring */}
                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="relative group opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
              <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-[#E4002B]/30 hover:border-[#E4002B] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#E4002B]/50 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E4002B]/20 via-[#FF5200]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#E4002B]/40 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
                
                {/* Particle Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-[#E4002B] rounded-full animate-ping"></div>
                  <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-[#FF5200] rounded-full animate-ping" style={{animationDelay: '0.3s'}}></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#E4002B] to-[#FF5200] rounded-lg sm:rounded-xl mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-[#E4002B]/50">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] via-[#FF5200] to-[#FF6B35] mb-2 sm:mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(228,0,43,0.5)] whitespace-nowrap">
                    100+
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-200 font-semibold leading-tight">
                    Brands
                  </div>
                  <div className="mt-1.5 sm:mt-2 md:mt-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#E4002B]/20 border border-[#E4002B]/40 rounded-full text-[9px] sm:text-[10px] md:text-xs text-[#E4002B] font-bold inline-block">↑ Growing fast</div>
                </div>

                <div className="absolute inset-0 rounded-2xl border-2 border-[#E4002B] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#E4002B]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="relative group opacity-0 animate-[fadeInUp_0.8s_ease-out_0.3s_forwards]">
              <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-[#FF6B35]/30 hover:border-[#FF6B35] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#FF6B35]/50 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/20 via-[#FF5200]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF6B35]/40 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
                
                {/* Lightning Bolt Particles */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                  <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-[#FF6B35] rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#FF6B35] to-[#E4002B] rounded-lg sm:rounded-xl mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-[#FF6B35]/50">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] via-yellow-400 to-[#FF5200] mb-2 sm:mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(255,107,53,0.5)] whitespace-nowrap">
                    Instant
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-200 font-semibold leading-tight">
                    Avg. Match Time
                  </div>
                  <div className="mt-1.5 sm:mt-2 md:mt-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#FF6B35]/20 border border-[#FF6B35]/40 rounded-full text-[9px] sm:text-[10px] md:text-xs text-[#FF6B35] font-bold inline-block">⚡ Lightning fast</div>
                </div>

                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF6B35] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF6B35]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="relative group opacity-0 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
              <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 border-2 border-[#FF5200]/30 hover:border-[#FF5200] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#FF5200]/50 group-hover:-translate-y-1 sm:group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
                
                {/* Globe Particles */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                  <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                  <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-[#FF5200] rounded-full animate-ping" style={{animationDelay: '0.6s'}}></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-lg sm:rounded-xl mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-[#FF5200]/50">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#FF6B35] to-[#E4002B] mb-2 sm:mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(255,82,0,0.5)] whitespace-nowrap">
                    20+
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-200 font-semibold leading-tight">
                    Areas Covered
                  </div>
                  <div className="mt-1.5 sm:mt-2 md:mt-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#FF5200]/20 border border-[#FF5200]/40 rounded-full text-[9px] sm:text-[10px] md:text-xs text-[#FF5200] font-bold inline-block">📍 Bangalore</div>
                </div>

                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>
          </div>

          {/* Bottom Glow Line */}
          <div className="mt-16 h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent opacity-50"></div>
        </div>
      </section>


      {/* CTA Section with Energy Waves */}
      <section className="relative z-10 bg-gradient-to-b from-gray-50/30 via-white to-white py-20 md:py-32 overflow-hidden">
        {/* Animated Energy Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-96 h-96 border-2 border-[#FF5200]/20 rounded-full animate-[ripple_3s_ease-out_infinite]"></div>
          <div className="absolute w-96 h-96 border-2 border-[#E4002B]/20 rounded-full animate-[ripple_3s_ease-out_infinite_1s]"></div>
          <div className="absolute w-96 h-96 border-2 border-[#FF6B35]/20 rounded-full animate-[ripple_3s_ease-out_infinite_2s]"></div>
        </div>
        
        {/* Floating Gradient Orbs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-[#FF5200]/10 to-transparent rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-gradient-to-br from-[#E4002B]/10 to-transparent rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        
        <div className="max-w-4xl mx-auto px-6 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              <span className="inline-block whitespace-nowrap">Ready to Find Your</span>{' '}
              <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] whitespace-nowrap">Perfect Match?</span>
            </h2>
            
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Join hundreds of brands and property owners already using our AI-powered platform
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <button 
                onClick={() => router.push('/filter/brand')}
                className="group relative px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-full text-base sm:text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden min-h-[48px] sm:min-h-[56px]"
              >
                <span className="relative z-10 flex items-center justify-center whitespace-nowrap">
                  Brand - Looking For Space
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
              
              <button 
                onClick={() => router.push('/filter/owner')}
                className="group relative px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-white border-2 border-gray-300 text-gray-900 rounded-full text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-[#FF5200] overflow-hidden min-h-[48px] sm:min-h-[56px]"
              >
                <span className="relative z-10 flex items-center justify-center group-hover:text-[#FF5200] transition-colors whitespace-nowrap gap-2">
                  List Property
                  <span 
                    className="px-2 py-0.5 relative overflow-hidden text-white text-[10px] font-bold rounded-full border border-red-500/70 flex items-center gap-1 flex-shrink-0"
                    style={{
                      background: 'linear-gradient(90deg, rgba(244, 114, 182, 1), rgba(236, 72, 153, 1), rgba(244, 114, 182, 1), rgba(251, 113, 133, 1), rgba(244, 114, 182, 1))',
                      backgroundSize: '300% 100%',
                      animation: 'gradientShift 2s ease-in-out infinite',
                      boxShadow: '0 0 8px rgba(236, 72, 153, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                      <svg className="w-1.5 h-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="whitespace-nowrap z-10">Instant</span>
                    <span 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full pointer-events-none"
                      style={{
                        animation: 'shine 2.5s ease-in-out infinite',
                      }}
                    />
                  </span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Compact & After CTA */}
      <section className="relative z-10 bg-white py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 animate-pulse"></span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Quick Answers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Got <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Questions?</span>
            </h2>
          </div>

          {/* FAQ Grid - 2 Columns, Compact */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {/* FAQ 1 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:border-[#FF5200] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#FF5200] transition-colors">How does AI matching work?</h3>
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">Our AI analyzes location intelligence, footfall, and demographics to deliver Top 5 scored matches.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ 2 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:border-[#E4002B] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#E4002B]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#E4002B] to-[#FF5200] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#E4002B] transition-colors">What&apos;s the fee structure?</h3>
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">Brands pay an onboarding fee. Property owners list 100% free. Success fee applies on deal closure.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ 3 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:border-[#FF6B35] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF6B35]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#FF6B35] to-[#FF5200] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#FF6B35] transition-colors">How fast are matches?</h3>
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">Get AI matches instantly with real-time WhatsApp notifications.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ 4 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:border-[#FF5200] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#FF5200] transition-colors">Which areas covered?</h3>
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">20+ areas in Bangalore: MG Road, Indiranagar, Koramangala, HSR Layout, Whitefield, Marathahalli, Bellandur, Sarjapur Road, Jayanagar, JP Nagar, Electronic City & more.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ 5 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:border-[#E4002B] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#E4002B]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#E4002B] to-[#FF6B35] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#E4002B] transition-colors">Can I communicate directly?</h3>
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">Yes! Message property owners or brands directly through our platform. Schedule site visits and negotiate seamlessly.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ 6 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:border-[#FF6B35] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF6B35]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#FF6B35] to-[#E4002B] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#FF6B35] transition-colors">Is my data secure?</h3>
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">Absolutely. Enterprise-grade encryption, secure payment processing, and strict data privacy compliance ensure your information is protected.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* AI Search Modal */}
      <AiSearchModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        initialQuery={isAiModalOpen ? searchQuery : ''}
      />

      {/* Brand Requirements Modal */}
      <Suspense fallback={null}>
        <BrandRequirementsModal 
          isOpen={isBrandModalOpen} 
          onClose={() => setIsBrandModalOpen(false)} 
        />
      </Suspense>

      {/* Mobile Bottom Navigation - Only visible on mobile after scrolling past hero */}
      {showMobileNav && (
        <div className="md:hidden fixed bottom-2 left-2 right-2 z-50">
          {/* Glass morphism background with dark accent - matching navbar style */}
          <div className="relative bg-gradient-to-t from-[#1a0a0a]/95 via-[#2d0f0f]/95 to-[#1a0a0a]/90 backdrop-blur-xl rounded-2xl border border-[#FF5200]/20 shadow-lg">
            {/* Gradient overlay for glass effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200]/5 via-transparent to-[#E4002B]/5 rounded-2xl"></div>
            
            {/* Navigation Items Container */}
            <div className="relative z-10 grid grid-cols-5 gap-0 px-2 py-2.5">
              {/* Search */}
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all relative group"
              >
                {/* Active background */}
                <div className="absolute inset-0 bg-[#FF5200]/20 rounded-xl opacity-100"></div>
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-medium text-[#FF5200]">Search</span>
                </div>
              </button>

              {/* For Brands */}
              <button
                onClick={async () => {
                  // Load brand profile data if user is logged in as brand
                  if (user?.userType === 'brand' && user?.email) {
                    try {
                      // Fetch all brands and find the current user's brand
                      const response = await fetch('/api/brands')
                      if (response.ok) {
                        const data = await response.json()
                        const userBrand = data.brands?.find((b: any) => b.email === user.email)
                        if (userBrand?.brandProfile) {
                          const profile = userBrand.brandProfile
                          // Map brand profile to filter format
                          const filterData: any = {}
                          
                          // Business type from industry
                          if (profile.storeType) {
                            filterData.businessType = [profile.storeType]
                          } else if (userBrand.industry) {
                            filterData.businessType = [userBrand.industry]
                          }
                          
                          // Size ranges
                          if (profile.minSize && profile.maxSize) {
                            // Map to size range labels
                            const sizeRanges = ['100-500 sqft', '500-1,000 sqft', '1,000-2,000 sqft', '2,000-5,000 sqft', '5,000-10,000 sqft', '10,000+ sqft']
                            const matchingRanges = sizeRanges.filter(range => {
                              const [min, max] = range.replace(' sqft', '').split('-').map(s => {
                                if (s.includes('+')) return parseInt(s.replace('+', ''))
                                return parseInt(s.replace(',', ''))
                              })
                              return profile.minSize >= min && profile.maxSize <= (max || Infinity)
                            })
                            if (matchingRanges.length > 0) {
                              filterData.sizeRanges = matchingRanges
                            }
                          }
                          
                          // Locations
                          if (profile.preferredLocations && profile.preferredLocations.length > 0) {
                            filterData.locations = profile.preferredLocations
                          }
                          
                          // Budget range
                          if (profile.budgetMin || profile.budgetMax) {
                            filterData.budgetRange = {
                              min: profile.budgetMin || 50000,
                              max: profile.budgetMax || 200000
                            }
                          }
                          
                          // Timeline
                          if (profile.timeline) {
                            filterData.timeline = profile.timeline
                          }
                          
                          // Store in localStorage for filter page to load
                          if (Object.keys(filterData).length > 0) {
                            localStorage.setItem('brandFilterData', JSON.stringify(filterData))
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Error loading brand profile:', error)
                    }
                  }
                  router.push('/filter/brand')
                }}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all relative group"
              >
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[#FF5200] transition-colors" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="brandGradientNav" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FF5200" />
                          <stop offset="50%" stopColor="#E4002B" />
                          <stop offset="100%" stopColor="#FF6B35" />
                        </linearGradient>
                      </defs>
                      {/* Outer thick circle */}
                      <circle cx="12" cy="12" r="10" stroke="url(#brandGradientNav)" strokeWidth="2" fill="none" className="group-hover:opacity-100 opacity-40" />
                      {/* Dashed lines extending from top-left quadrant */}
                      <line x1="5" y1="5" x2="3" y2="3" stroke="url(#brandGradientNav)" strokeWidth="1.2" strokeDasharray="1.5,1.5" className="group-hover:opacity-100 opacity-30" />
                      <line x1="6" y1="4" x2="4" y2="2" stroke="url(#brandGradientNav)" strokeWidth="1.2" strokeDasharray="1.5,1.5" className="group-hover:opacity-100 opacity-30" />
                      <line x1="7" y1="3" x2="5" y2="1" stroke="url(#brandGradientNav)" strokeWidth="1.2" strokeDasharray="1.5,1.5" className="group-hover:opacity-100 opacity-30" />
                      {/* Lighter inner solid circle */}
                      <circle cx="12" cy="12" r="8" fill="url(#brandGradientNav)" fillOpacity="0.2" className="group-hover:fill-opacity-30" />
                      {/* Back layer stars (for depth) */}
                      <g opacity="0.25" className="group-hover:opacity-40">
                        <path d="M12 7 L13.2 9.5 L15.8 9.5 L13.8 11.2 L14.6 13.8 L12 12.3 L9.4 13.8 L10.2 11.2 L8.2 9.5 L10.8 9.5 Z" stroke="url(#brandGradientNav)" strokeWidth="0.6" fill="none" transform="translate(0.3, 0.3)" />
                        <path d="M12 7 L13.2 9.5 L15.8 9.5 L13.8 11.2 L14.6 13.8 L12 12.3 L9.4 13.8 L10.2 11.2 L8.2 9.5 L10.8 9.5 Z" stroke="url(#brandGradientNav)" strokeWidth="0.6" fill="none" transform="translate(-0.2, -0.2) scale(0.85)" />
                      </g>
                      {/* Main eight-pointed star/badge */}
                      <g>
                        {/* Small circles at each point */}
                        <circle cx="12" cy="6.5" r="1.2" fill="url(#brandGradientNav)" className="group-hover:opacity-100 opacity-70" />
                        <circle cx="15.8" cy="8.2" r="1.2" fill="url(#brandGradientNav)" className="group-hover:opacity-100 opacity-70" />
                        <circle cx="17.5" cy="12" r="1.2" fill="url(#brandGradientNav)" className="group-hover:opacity-100 opacity-70" />
                        <circle cx="15.8" cy="15.8" r="1.2" fill="url(#brandGradientNav)" className="group-hover:opacity-100 opacity-70" />
                        <circle cx="12" cy="17.5" r="1.2" fill="url(#brandGradientNav)" className="group-hover:opacity-100 opacity-70" />
                        <circle cx="8.2" cy="15.8" r="1.2" fill="url(#brandGradientNav)" className="group-hover:opacity-100 opacity-70" />
                        <circle cx="6.5" cy="12" r="1.2" fill="url(#brandGradientNav)" className="group-hover:opacity-100 opacity-70" />
                        <circle cx="8.2" cy="8.2" r="1.2" fill="url(#brandGradientNav)" className="group-hover:opacity-100 opacity-70" />
                        {/* Star outline */}
                        <path d="M12 6.5 L13.9 8.2 L15.8 8.2 L14.3 9.8 L15.1 11.6 L12 10.2 L8.9 11.6 L9.7 9.8 L8.2 8.2 L10.1 8.2 Z" 
                              stroke="url(#brandGradientNav)" strokeWidth="1.3" fill="none" className="group-hover:opacity-100 opacity-80" />
                        <path d="M12 6.5 L15.8 8.2 L17.5 12 L15.8 15.8 L12 17.5 L8.2 15.8 L6.5 12 L8.2 8.2 Z" 
                              stroke="url(#brandGradientNav)" strokeWidth="1.3" fill="none" className="group-hover:opacity-100 opacity-80" />
                      </g>
                      {/* Hexagon in center */}
                      <path d="M12 9.5 L13.5 10.2 L13.5 11.8 L12 12.5 L10.5 11.8 L10.5 10.2 Z" 
                            stroke="url(#brandGradientNav)" strokeWidth="1.1" fill="url(#brandGradientNav)" fillOpacity="0.25" className="group-hover:opacity-100 opacity-70" />
                      {/* BRAND text (simplified to "B" for small size) */}
                      <text x="12" y="11.3" fontSize="3.5" fontWeight="700" fill="url(#brandGradientNav)" textAnchor="middle" className="group-hover:opacity-100 opacity-80" fontFamily="system-ui, -apple-system, sans-serif">B</text>
                    </svg>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#FF5200] transition-colors">For Brands</span>
                </div>
              </button>

              {/* Floating Action Button - List Property */}
              <div className="flex flex-col items-center justify-center relative">
                <button
                  onClick={() => router.push('/filter/owner')}
                  className="absolute -top-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] shadow-lg shadow-[#FF5200]/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                {/* List Property text below button - properly aligned */}
                <div className="flex items-center justify-center pt-8">
                  <span className="text-[9px] font-medium text-gray-400 whitespace-nowrap">List Property</span>
                </div>
              </div>

              {/* Loka.ai - Location Intelligence */}
              <button
                onClick={() => router.push('/location-intelligence')}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all relative group"
              >
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <img 
                      src="/lokazen-favicon.svg" 
                      alt="Loka.ai" 
                      className="w-5 h-5 opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-gray-300">Loka.ai</span>
                </div>
              </button>

              {/* Profile */}
              <button
                onClick={() => {
                  if (user?.userType === 'owner') {
                    router.push('/dashboard/owner')
                  } else if (user?.userType === 'brand') {
                    // For brands, route to home with dashboard view or create brand dashboard
                    router.push('/')
                  } else {
                    // Default to about page if not logged in
                    router.push('/about')
                  }
                }}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all relative group"
              >
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-gray-300">Profile</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
