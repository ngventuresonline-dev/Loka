'use client'

import { useState, useEffect } from 'react'
import { brandRequirements, type BrandRequirement } from '@/data/brand-requirements'
import { getBrandColor } from '@/lib/brand-utils'
import { getBrandLogo } from '@/lib/brand-logos'

interface BrandRequirementsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface DatabaseBrand {
  id: string
  name: string
  email: string
  companyName: string
  industry: string
  brandProfile?: {
    budgetMin: number | null
    budgetMax: number | null
    minSize: number | null
    maxSize: number | null
    preferredLocations: string[]
    timeline: string | null
    storeType: string | null
    targetAudience: string | null
    additionalRequirements: string | null
    badges?: string[]
  } | null
}

// Expandable Brand Card Component for Modal
function ExpandableBrandCard({ brand, colors, colorClasses, brandLogo, badges }: { brand: BrandRequirement, colors: any, colorClasses: any, brandLogo: string | null, badges?: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Badge color mapping
  const getBadgeColors = (badge: string) => {
    const badgeColors: Record<string, { bg: string; border: string; text: string }> = {
      'Active': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      'Very Active': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      'Multiple Properties Matched': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
      'Property Matched': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    }
    return badgeColors[badge] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }
  }
  
  return (
    <div
      className="relative group h-full cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className={`relative bg-white backdrop-blur-xl rounded-2xl p-6 border-2 ${isExpanded ? colorClasses.border.replace('hover:', '') : 'border-gray-200'} ${colorClasses.border} transition-all duration-500 overflow-hidden shadow-lg ${colorClasses.shadow} group-hover:-translate-y-2 h-full flex flex-col`}>
        {/* Top Accent Bar - Brand Color */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl z-20`}
          style={{
            backgroundColor: colorClasses.accent
          }}
        ></div>
        
        {/* Animated Glow Effect */}
        <div 
          className={`absolute inset-0 transition-all duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100`}
          style={{
            background: `linear-gradient(to bottom right, ${colorClasses.glowFrom}, ${colorClasses.glowVia}, transparent)`
          }}
        ></div>
        
        {/* Animated Corner Accent */}
        <div 
          className={`absolute top-0 right-0 rounded-bl-full transition-all duration-500 ${isExpanded ? 'w-28 h-28' : 'w-20 h-20'} group-hover:w-28 group-hover:h-28`}
          style={{
            background: `linear-gradient(to bottom right, ${colorClasses.accent}, transparent)`
          }}
        ></div>
        
        {/* Particle Effect */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100`}>
          <div className={`absolute top-1/4 left-1/4 w-2 h-2 ${colorClasses.particle} rounded-full animate-ping`}></div>
          <div className={`absolute top-3/4 right-1/4 w-2 h-2 ${colorClasses.particle} rounded-full animate-ping`} style={{animationDelay: '0.5s'}}></div>
        </div>
        
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="mb-4">
            <div className="flex items-start gap-3 mb-3">
              {/* Brand Logo */}
              {brandLogo ? (
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg overflow-hidden bg-white p-1.5 flex-shrink-0`}
                  style={{
                    boxShadow: `0 10px 15px -3px ${colorClasses.glowFrom.replace('0.2', '0.4')}, 0 4px 6px -2px ${colorClasses.glowVia.replace('0.1', '0.2')}`
                  }}
                >
                  <img 
                    src={brandLogo} 
                    alt={`${brand.brandName} Logo`} 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg ${colorClasses.iconBg} border flex-shrink-0`}
                  style={{
                    borderColor: `${colorClasses.glowFrom.replace('0.2', '0.3')}`,
                    boxShadow: `0 10px 15px -3px ${colorClasses.glowFrom.replace('0.2', '0.4')}`
                  }}
                >
                  <span className={`${colorClasses.iconText} font-bold text-lg`}>
                    {brand.brandName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{brand.brandName}</h3>
                <p className="text-sm text-gray-600 truncate">{brand.businessType}</p>
              </div>
            </div>
            {/* Badges Stacked Vertically */}
            <div className="flex flex-col gap-1.5">
              {badges && Array.isArray(badges) && badges.length > 0 ? (
                badges.map((badge: string) => {
                  const badgeColors = getBadgeColors(badge)
                  return (
                    <span 
                      key={badge}
                      className={`px-3 py-1 ${badgeColors.bg} border ${badgeColors.border} ${badgeColors.text} text-xs font-semibold rounded-full whitespace-nowrap w-fit`}
                    >
                      {badge}
                    </span>
                  )
                })
              ) : (
                <span className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full whitespace-nowrap w-fit">Active</span>
              )}
            </div>
          </div>
          
          {/* Always visible: Size */}
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
            <div className={`w-8 h-8 ${colorClasses.iconBg} rounded-lg flex items-center justify-center`}>
              <svg className={`w-4 h-4 ${colorClasses.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <span><span className="font-semibold text-gray-900">Size:</span> {brand.sizeRequirement.range}</span>
          </div>

          {/* Expandable Details */}
          <div className={`space-y-3 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {brand.preferredLocations.primary.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className={`w-8 h-8 ${colorClasses.iconBg} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-4 h-4 ${colorClasses.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span><span className="font-semibold text-gray-900">Location:</span> {brand.preferredLocations.primary.join(', ')}</span>
              </div>
            )}
            {brand.budgetRange.range && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className={`w-8 h-8 ${colorClasses.iconBg} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-4 h-4 ${colorClasses.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span><span className="font-semibold text-gray-900">Budget:</span> <span className="blur-sm select-none">{brand.budgetRange.range}</span></span>
              </div>
            )}
            {brand.timeline && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className={`w-8 h-8 ${colorClasses.iconBg} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-4 h-4 ${colorClasses.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span><span className="font-semibold text-gray-900">Timeline:</span> {brand.timeline}</span>
              </div>
            )}
            {brand.mustHaveFeatures && brand.mustHaveFeatures.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <div className={`w-8 h-8 ${colorClasses.iconBg} rounded-lg flex items-center justify-center mt-0.5`}>
                  <svg className={`w-4 h-4 ${colorClasses.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span><span className="font-semibold text-gray-900">Requirements:</span> {brand.mustHaveFeatures.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Expand/Collapse Indicator */}
          <div className="mt-auto pt-3 flex items-center justify-center">
            <div className={`flex items-center gap-1 text-xs ${colorClasses.iconText} transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <span className="font-medium">{isExpanded ? 'Show Less' : 'Click for Details'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Enhanced Pulse Ring */}
        <div className={`absolute inset-0 rounded-2xl border-2 ${colorClasses.pulse} ${isExpanded ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500`}></div>
        <div className={`absolute inset-0 rounded-2xl ring-2 ${colorClasses.ring} ${isExpanded ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 blur-sm transition-opacity duration-500`}></div>
      </div>
    </div>
  )
}

export default function BrandRequirementsModal({ isOpen, onClose }: BrandRequirementsModalProps) {
  const [selectedType, setSelectedType] = useState<string>('All')
  const [filteredBrands, setFilteredBrands] = useState<BrandRequirement[]>([])
  const [dbBrands, setDbBrands] = useState<DatabaseBrand[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch brands from database
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true)
        // Fetch from public API endpoint
        const response = await fetch('/api/brands')
        if (response.ok) {
          const data = await response.json()
          setDbBrands(data.brands || [])
        } else {
          // Fallback to static data if API fails
          setDbBrands([])
        }
      } catch (error) {
        console.error('Error fetching brands:', error)
        setDbBrands([])
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchBrands()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Convert database brands to BrandRequirement format
  useEffect(() => {
    const convertDbBrands = (brands: DatabaseBrand[]): BrandRequirement[] => {
      return brands.map(brand => {
        const profile = brand.brandProfile
        const minSize = profile?.minSize ?? 0
        const maxSize = profile?.maxSize ?? 0
        const budgetMin = profile?.budgetMin ?? 0
        const budgetMax = profile?.budgetMax ?? 0
        
        // Format size range
        const sizeRange = minSize && maxSize 
          ? `${minSize.toLocaleString()}-${maxSize.toLocaleString()} sqft`
          : minSize 
          ? `${minSize.toLocaleString()}+ sqft`
          : 'Not specified'
        
        // Format budget range
        const formatBudget = (amount: number) => {
          if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`
          }
          return `₹${(amount / 1000).toFixed(0)}K`
        }
        const budgetRange = budgetMin && budgetMax
          ? `${formatBudget(budgetMin)}-${formatBudget(budgetMax)}/month`
          : budgetMin
          ? `${formatBudget(budgetMin)}+/month`
          : 'Not specified'
        
        return {
          brandName: brand.name || brand.companyName,
          businessType: brand.industry || 'Other' as any,
          sizeRequirement: {
            category: 'Medium' as any,
            range: sizeRange,
            sqft: { min: minSize, max: maxSize }
          },
          budgetRange: {
            category: 'Mid' as any,
            range: budgetRange,
            monthly: { min: budgetMin, max: budgetMax }
          },
          preferredLocations: {
            primary: profile?.preferredLocations || [],
            secondary: []
          },
          mustHaveFeatures: profile?.additionalRequirements ? [profile.additionalRequirements] : [],
          timeline: (profile?.timeline || 'Flexible') as any,
          bfiWeights: {
            location: 30,
            budget: 25,
            size: 25,
            features: 20
          },
          badges: profile?.badges || []
        } as any
      })
    }

    // Prefer database brands; fall back to static requirements if none returned
    const allBrands = dbBrands.length > 0
      ? convertDbBrands(dbBrands)
      : brandRequirements
    
    if (selectedType === 'All') {
      setFilteredBrands(allBrands)
    } else {
      setFilteredBrands(allBrands.filter(brand => brand.businessType === selectedType))
    }
  }, [selectedType, dbBrands])

  if (!isOpen) return null

  const businessTypes = ['All', ...Array.from(new Set([...filteredBrands.map(b => b.businessType), ...brandRequirements.map(b => b.businessType)]))]

  // Color mapping for Tailwind classes
  const getColorClasses = (colorName: string) => {
    const colorMap: Record<string, {
      border: string
      iconBg: string
      iconText: string
      shadow: string
      pulse: string
      ring: string
      glowFrom: string
      glowVia: string
      accent: string
      particle: string
    }> = {
      'teal': {
        border: 'hover:border-teal-400',
        iconBg: 'bg-teal-50',
        iconText: 'text-teal-600',
        shadow: 'hover:shadow-teal-500/30',
        pulse: 'border-teal-500',
        ring: 'ring-teal-500/50',
        glowFrom: 'rgba(20, 184, 166, 0.2)',
        glowVia: 'rgba(20, 184, 166, 0.1)',
        accent: 'rgba(20, 184, 166, 0.4)',
        particle: 'bg-teal-400'
      },
      'blue': {
        border: 'hover:border-blue-400',
        iconBg: 'bg-blue-50',
        iconText: 'text-blue-600',
        shadow: 'hover:shadow-blue-500/30',
        pulse: 'border-blue-500',
        ring: 'ring-blue-500/50',
        glowFrom: 'rgba(37, 99, 235, 0.2)',
        glowVia: 'rgba(37, 99, 235, 0.1)',
        accent: 'rgba(37, 99, 235, 0.4)',
        particle: 'bg-blue-400'
      },
      'amber': {
        border: 'hover:border-amber-500',
        iconBg: 'bg-amber-50',
        iconText: 'text-amber-600',
        shadow: 'hover:shadow-amber-600/30',
        pulse: 'border-amber-600',
        ring: 'ring-amber-600/50',
        glowFrom: 'rgba(217, 119, 6, 0.2)',
        glowVia: 'rgba(217, 119, 6, 0.1)',
        accent: 'rgba(217, 119, 6, 0.4)',
        particle: 'bg-amber-500'
      },
      'sky': {
        border: 'hover:border-sky-400',
        iconBg: 'bg-sky-50',
        iconText: 'text-sky-600',
        shadow: 'hover:shadow-sky-500/30',
        pulse: 'border-sky-500',
        ring: 'ring-sky-500/50',
        glowFrom: 'rgba(14, 165, 233, 0.2)',
        glowVia: 'rgba(14, 165, 233, 0.1)',
        accent: 'rgba(14, 165, 233, 0.4)',
        particle: 'bg-sky-400'
      },
      'orange': {
        border: 'hover:border-orange-500',
        iconBg: 'bg-orange-50',
        iconText: 'text-orange-600',
        shadow: 'hover:shadow-orange-600/30',
        pulse: 'border-orange-600',
        ring: 'ring-orange-600/50',
        glowFrom: 'rgba(234, 88, 12, 0.2)',
        glowVia: 'rgba(234, 88, 12, 0.1)',
        accent: 'rgba(234, 88, 12, 0.4)',
        particle: 'bg-orange-500'
      },
      'purple': {
        border: 'hover:border-purple-400',
        iconBg: 'bg-purple-50',
        iconText: 'text-purple-600',
        shadow: 'hover:shadow-purple-500/30',
        pulse: 'border-purple-500',
        ring: 'ring-purple-500/50',
        glowFrom: 'rgba(147, 51, 234, 0.2)',
        glowVia: 'rgba(147, 51, 234, 0.1)',
        accent: 'rgba(147, 51, 234, 0.4)',
        particle: 'bg-purple-400'
      },
      'pink': {
        border: 'hover:border-pink-400',
        iconBg: 'bg-pink-50',
        iconText: 'text-pink-600',
        shadow: 'hover:shadow-pink-500/30',
        pulse: 'border-pink-500',
        ring: 'ring-pink-500/50',
        glowFrom: 'rgba(236, 72, 153, 0.2)',
        glowVia: 'rgba(236, 72, 153, 0.1)',
        accent: 'rgba(236, 72, 153, 0.4)',
        particle: 'bg-pink-400'
      },
      'red': {
        border: 'hover:border-red-400',
        iconBg: 'bg-red-50',
        iconText: 'text-red-600',
        shadow: 'hover:shadow-red-500/30',
        pulse: 'border-red-500',
        ring: 'ring-red-500/50',
        glowFrom: 'rgba(220, 38, 38, 0.2)',
        glowVia: 'rgba(220, 38, 38, 0.1)',
        accent: 'rgba(220, 38, 38, 0.4)',
        particle: 'bg-red-400'
      },
      'green': {
        border: 'hover:border-green-400',
        iconBg: 'bg-green-50',
        iconText: 'text-green-600',
        shadow: 'hover:shadow-green-500/30',
        pulse: 'border-green-500',
        ring: 'ring-green-500/50',
        glowFrom: 'rgba(34, 197, 94, 0.2)',
        glowVia: 'rgba(34, 197, 94, 0.1)',
        accent: 'rgba(34, 197, 94, 0.4)',
        particle: 'bg-green-400'
      },
      'gray': {
        border: 'hover:border-gray-400',
        iconBg: 'bg-gray-50',
        iconText: 'text-gray-600',
        shadow: 'hover:shadow-gray-500/30',
        pulse: 'border-gray-500',
        ring: 'ring-gray-500/50',
        glowFrom: 'rgba(107, 114, 128, 0.2)',
        glowVia: 'rgba(107, 114, 128, 0.1)',
        accent: 'rgba(107, 114, 128, 0.4)',
        particle: 'bg-gray-400'
      }
    }
    return colorMap[colorName] || colorMap['gray']
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-7xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50 flex flex-col">
        {/* Header */}
        <div className="relative bg-white p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                Featured Brand Requirements
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base">
                Browse through some of our Featured Brand Requirements
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center transition-all hover:scale-110"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-2 md:flex-wrap md:overflow-x-visible md:pb-0">
            {businessTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedType === type
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No brands found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-stretch">
              {filteredBrands.map((brand, idx) => {
              const brandLogo = getBrandLogo(brand.brandName)
              const colors = getBrandColor(brand.brandName, brand.businessType)
              const colorBase = colors.borderColor.split('-')[0] // Extract base color name
              const colorClasses = getColorClasses(colorBase)
              
              return (
                <ExpandableBrandCard
                  key={idx}
                  brand={brand}
                  colors={colors}
                  colorClasses={colorClasses}
                  brandLogo={brandLogo}
                  badges={(brand as any).badges}
                />
              )
            })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

