'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DynamicBackground from '@/components/DynamicBackground'
import { getBrandLogo, getBrandInitial } from '@/lib/brand-logos'
import Image from 'next/image'

type Property = {
  id: string
  title: string
  address: string
  city: string
  size: number
  price: number
  propertyType: string
  availability: boolean
  createdAt: string
}

type BrandMatch = {
  id: string
  name: string
  businessType?: string
  matchScore?: number
  sizeRange?: string
  budgetRange?: string
  locations?: string[]
  propertyTypes?: string[]
}

type InterestedBrand = {
  id: string
  name: string
  businessType?: string
  date: string
  action: 'Viewed' | 'Saved' | 'Inquired'
}

type SiteVisit = {
  id: string
  brandName: string
  date: string
  time: string
  status: 'Confirmed' | 'Pending' | 'Completed'
}

function getMatchLabel(score: number | undefined) {
  if (score === undefined || score === null) return 'Potential Match'
  if (score >= 85) return 'Excellent Match'
  if (score >= 70) return 'Good Match'
  return 'Potential Match'
}

function BrandMatchCard({ match }: { match: BrandMatch }) {
  const score = match.matchScore ?? 0
  const label = getMatchLabel(score)
  const logoPath = getBrandLogo(match.name)
  const brandInitial = getBrandInitial(match.name)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Brand Logo */}
          <div className="flex-shrink-0">
            {logoPath ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center">
                <Image
                  src={logoPath}
                  alt={match.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initial if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center text-white font-bold text-lg">${brandInitial}</div>`
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center text-white font-bold text-lg shadow-md">
                {brandInitial}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug truncate mb-1.5">
              {match.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {match.businessType || 'Brand'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            score >= 85 ? 'bg-green-50 text-green-700 border border-green-200' :
            score >= 70 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
            'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {label}
          </div>
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white text-xs font-bold shadow-md">
            {score || 0}%
          </div>
        </div>
      </div>

      <div className="space-y-1.5 text-xs sm:text-sm text-gray-700 mb-3">
        {match.sizeRange && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Size:</span>
            <span className="font-medium">{match.sizeRange}</span>
          </div>
        )}
        {match.budgetRange && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Budget:</span>
            <span className="font-medium">{match.budgetRange}</span>
          </div>
        )}
        {match.locations && match.locations.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Locations:</span>
            <span className="font-medium truncate">
              {match.locations.slice(0, 2).join(', ')}
              {match.locations.length > 2 && ` +${match.locations.length - 2}`}
            </span>
          </div>
        )}
      </div>

      {match.propertyTypes && match.propertyTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100">
          {match.propertyTypes.slice(0, 3).map((type) => (
            <span
              key={type}
              className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-[11px] text-gray-700"
            >
              {type}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function PropertyListItem({ 
  property, 
  isSelected, 
  onClick 
}: { 
  property: Property
  isSelected: boolean
  onClick: () => void
}) {
  // Status configuration based on availability
  const statusConfig = property.availability 
    ? {
        label: 'Active',
        color: 'bg-green-100 text-green-700 border-green-300',
        message: 'Your property is live and visible to brands'
      }
    : {
        label: 'Under Verification',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        message: 'Our team will contact you within 24-48 hours'
      }

  return (
    <div className="w-full">
      <button
        onClick={onClick}
        className={`w-full text-left p-3 sm:p-5 rounded-lg border-2 transition-all ${
          isSelected
            ? 'border-[#FF5200] bg-[#FF5200]/5 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-1 flex-1">
            {property.title}
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0 ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
        <p className="text-xs text-gray-600 mb-2 leading-relaxed line-clamp-1">
          {property.address}, {property.city}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{property.size.toLocaleString()} sqft</span>
          <span>•</span>
          <span>₹{property.price.toLocaleString('en-IN')}/month</span>
        </div>
      </button>
      
      {/* Status message below card */}
      {!property.availability && (
        <div className="mt-1.5 sm:mt-2 px-3 py-1.5 sm:py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-sm">⏳</span>
            <p className="text-xs text-yellow-800 flex-1">
              {statusConfig.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OwnerDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [matches, setMatches] = useState<BrandMatch[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [ownerName, setOwnerName] = useState<string | null>(null)
  const [interestedBrands, setInterestedBrands] = useState<InterestedBrand[]>([])
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([])
  const [activePanel, setActivePanel] = useState<'matches' | 'interested' | 'visits'>('matches')

  useEffect(() => {
    // Get ownerId from localStorage
    const storedOwnerId = typeof window !== 'undefined'
      ? window.localStorage.getItem('ownerId')
      : null
    const storedOwnerName = typeof window !== 'undefined'
      ? window.localStorage.getItem('ownerName')
      : null

    if (!storedOwnerId) {
      // No owner ID - redirect to filter page
      router.replace('/filter/owner')
      return
    }

    setOwnerId(storedOwnerId)
    if (storedOwnerName) {
      setOwnerName(storedOwnerName)
    }
    fetchOwnerProperties(storedOwnerId)
  }, [router])

  const fetchOwnerProperties = async (id: string) => {
    try {
      const response = await fetch(`/api/owner/properties?ownerId=${id}`)
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties || [])
        
        // Auto-select first property if available
        if (data.properties && data.properties.length > 0) {
          const first = data.properties[0]
          setSelectedPropertyId(first.id)
          fetchMatchesForProperty(first)
          // TODO: Fetch engagement and site visit data for this property
        }
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatchesForProperty = async (property: Property) => {
    setLoadingMatches(true)
    try {
      const response = await fetch('/api/brands/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyType: property.propertyType,
          location: property.city,
          size: property.size,
          rent: property.price,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
      }
    } catch (error) {
      console.error('Failed to fetch matches:', error)
    } finally {
      setLoadingMatches(false)
    }
  }

  const handlePropertySelect = (property: Property) => {
    setSelectedPropertyId(property.id)
    setActivePanel('matches')
    fetchMatchesForProperty(property)
    // TODO: Fetch engagement and site visit data scoped to this property
  }

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <DynamicBackground />
        <Navbar />
        <div className="relative z-10 pt-24 pb-16 px-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-sm sm:text-base">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <DynamicBackground />
      <Navbar />

      <div className="relative z-10 pt-16 sm:pt-24 pb-6 sm:pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-[0_18px_60px_rgba(0,0,0,0.04)] p-3 sm:p-6 md:p-8">
            {/* Header */}
            <div className="mb-5 sm:mb-8 text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-1.5 tracking-wide">
                {`Hello ${ownerName || 'Owner'},`}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-snug">
                Your Property Matches
              </h1>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
                Manage your listed properties, track brand interest and keep your site details up to date.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
              {/* Left Sidebar - Properties List */}
              <div className="lg:col-span-1 bg-[#FFF7F2]/70 rounded-2xl p-3 sm:p-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-gray-900">Your Properties</h2>
                  <button
                    onClick={() => router.push('/filter/owner')}
                    className="px-3 py-1.5 text-xs sm:text-sm font-medium text-[#FF5200] border border-[#FF5200] rounded-lg hover:bg-[#FF5200]/5 transition-colors"
                  >
                    + Add Property
                  </button>
                  </div>

                {properties.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-4">No properties listed yet</p>
                    <button
                      onClick={() => router.push('/filter/owner')}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-lg hover:shadow-md transition-all"
                    >
                      List Your First Property
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {properties.map((property) => (
                      <PropertyListItem
                        key={property.id}
                        property={property}
                        isSelected={selectedPropertyId === property.id}
                        onClick={() => handlePropertySelect(property)}
                      />
                    ))}
                  </div>
                )}
                </div>
              </div>

              {/* Main Area - Property Overview & Brand Intelligence */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
                {selectedPropertyId ? (
                  <>
                    {(() => {
                      const selectedProperty = properties.find(p => p.id === selectedPropertyId)
                      if (!selectedProperty) return null

                      const statusConfig = selectedProperty.availability 
                        ? {
                            label: 'Active',
                            color: 'bg-green-100 text-green-700 border-green-300',
                            pillColor: 'bg-green-50 text-green-700 border-green-200',
                            message: 'Your property is live and visible to brands.'
                          }
                        : {
                            label: 'Under Verification',
                            color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                            pillColor: 'bg-yellow-50 text-yellow-800 border-yellow-200',
                            message: 'Our team is reviewing this property and will reach out shortly.'
                          }

                      return (
                        <div className="mb-4 sm:mb-6">
                          {/* Property header with Edit button */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 truncate">
                                {selectedProperty.title}
                              </h2>
                              <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">
                                {selectedProperty.address}, {selectedProperty.city}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-gray-500">
                                <span>{selectedProperty.size.toLocaleString()} sqft</span>
                                <span>•</span>
                                <span>₹{selectedProperty.price.toLocaleString('en-IN')}/month</span>
                                <span>•</span>
                                <span className="capitalize">{selectedProperty.propertyType}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-start sm:justify-end gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
                              <div className={`px-3 py-1 rounded-full text-[11px] font-medium border ${statusConfig.pillColor}`}>
                                {statusConfig.label}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!selectedProperty) return
                                  router.push(`/onboarding/owner?edit=${selectedProperty.id}`)
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs sm:text-sm font-medium text-gray-700 hover:border-[#FF5200] hover:text-[#FF5200] transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l9.439-9.439a1 1 0 000-1.414l-3.536-3.536a1 1 0 00-1.414 0L4.343 14.757A1 1 0 004 15.464V20z" />
                                </svg>
                                Edit Property
                              </button>
                            </div>
                          </div>

                          {/* Status message */}
                          <div className={`mb-4 p-3 rounded-lg border text-xs sm:text-sm ${statusConfig.color}`}>
                            {statusConfig.message}
                          </div>

                          {/* Tab navigation */}
                          <div className="border-b border-gray-200 mb-4">
                            <nav className="-mb-px flex flex-wrap gap-2 text-xs sm:text-sm" aria-label="Tabs">
                              {['matches', 'interested', 'visits'].map((key) => {
                                const label =
                                  key === 'matches'
                                    ? 'Brand Matches'
                                    : key === 'interested'
                                    ? 'Interested Brands'
                                    : 'Site Visits'

                                const value = key as 'matches' | 'interested' | 'visits'

                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => setActivePanel(value)}
                                    className={`whitespace-nowrap px-3 py-2 border-b-2 font-medium transition-colors ${
                                      activePanel === value
                                        ? 'border-[#FF5200] text-[#FF5200]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                )
                              })}
                            </nav>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Panel content */}
                    {activePanel === 'matches' && (
                      <>
                        {loadingMatches ? (
                          <div className="py-12 text-center">
                            <div className="w-8 h-8 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm text-gray-600">Finding matches...</p>
                          </div>
                        ) : matches.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                            <p className="text-sm text-gray-600 mb-2">
                              No brand matches found for this property yet.
                            </p>
                            <p className="text-xs text-gray-500">
                              As more brands join the platform, we&apos;ll surface matches here.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                            {matches.map((match) => (
                              <BrandMatchCard key={match.id} match={match} />
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {activePanel === 'interested' && (
                      <div className="mt-2">
                        {interestedBrands.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                            <p className="text-sm text-gray-600 mb-2">
                              No brands have shown interest yet.
                            </p>
                            <p className="text-xs text-gray-500">
                              When brands view, save, or inquire about this property, they will appear here.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {interestedBrands.map((brand) => (
                              <div
                                key={brand.id}
                                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{brand.name}</p>
                                  <p className="text-xs text-gray-600 truncate">
                                    {brand.businessType || 'Brand'} • {brand.action}
                                  </p>
                                </div>
                                <div className="text-right text-[11px] text-gray-500">
                                  <p>{brand.date}</p>
                                  <p className="mt-0.5 capitalize">{brand.action.toLowerCase()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activePanel === 'visits' && (
                      <div className="mt-2">
                        {siteVisits.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                            <p className="text-sm text-gray-600 mb-2">
                              No site visits scheduled.
                            </p>
                            <p className="text-xs text-gray-500">
                              Scheduled visits with brands will appear here with date, time, and status.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {siteVisits.map((visit) => (
                              <div
                                key={visit.id}
                                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{visit.brandName}</p>
                                  <p className="text-xs text-gray-600 truncate">
                                    {visit.date} • {visit.time}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-[11px] font-medium border ${
                                    visit.status === 'Confirmed'
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : visit.status === 'Completed'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                                  }`}
                                >
                                  {visit.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-sm text-gray-600">
                      Select a property from the sidebar to view brand matches
                    </p>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

