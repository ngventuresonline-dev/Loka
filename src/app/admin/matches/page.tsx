'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getBrandLogo, getBrandInitial } from '@/lib/brand-logos'
import Image from 'next/image'

type MatchGroup = {
  brand?: {
    id: string
    name: string
    businessType: string
    email: string
    phone: string
    sizeRange: string
    budgetRange: string
    preferredLocations: string[]
    preferredPropertyTypes: string[]
  }
  property?: {
    id: string
    title: string
    address: string
    city: string
    size: number
    price: number
    priceType: string
    propertyType: string
    owner: {
      id: string
      name: string
      email: string
      phone: string
    }
  }
  matches: Array<{
    id: string
    brand: any
    property: any
    pfiScore: number
    matchQuality: 'Excellent' | 'Good' | 'Fair'
    createdAt: string
  }>
}

export default function AdminMatchesPage() {
  const [view, setView] = useState<'brand' | 'property'>('brand')
  const [matches, setMatches] = useState<MatchGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [brandNameFilter, setBrandNameFilter] = useState('')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [minScoreFilter, setMinScoreFilter] = useState(30)
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedMatchGroup, setSelectedMatchGroup] = useState<MatchGroup | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    fetchMatches()
  }, [view, brandNameFilter, propertyTypeFilter, locationFilter, minScoreFilter, selectedBrandId, selectedPropertyId])

  const fetchMatches = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        view,
        minScore: minScoreFilter.toString(),
      })
      if (brandNameFilter) params.append('brandName', brandNameFilter)
      if (propertyTypeFilter) params.append('propertyType', propertyTypeFilter)
      if (locationFilter) params.append('location', locationFilter)
      if (selectedBrandId) params.append('brandId', selectedBrandId)
      if (selectedPropertyId) params.append('propertyId', selectedPropertyId)

      const response = await fetch(`/api/admin/matches?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      const data = await response.json()
      setMatches(data.matches || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }

  const getMatchQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'Good':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const formatPrice = (price: number) => {
    return `₹${(price / 1000).toFixed(0)}K/month`
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Brand Matches</h1>
            <p className="text-gray-400 mt-1">View all brand-property matches across the platform</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-300 font-medium">View Mode:</span>
            <button
              onClick={() => setView('brand')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'brand'
                  ? 'bg-[#FF5200] text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              By Brand
            </button>
            <button
              onClick={() => setView('property')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'property'
                  ? 'bg-[#FF5200] text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              By Property
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Brand Name</label>
              <input
                type="text"
                value={brandNameFilter}
                onChange={(e) => setBrandNameFilter(e.target.value)}
                placeholder="Search brands..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Property Type</label>
              <select
                value={propertyTypeFilter}
                onChange={(e) => setPropertyTypeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
              >
                <option value="">All Types</option>
                <option value="Office">Office</option>
                <option value="Retail Space">Retail Space</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Food Court">Food Court</option>
                <option value="Café / Coffee Shop">Café / Coffee Shop</option>
                <option value="QSR (Quick Service Restaurant)">QSR (Quick Service Restaurant)</option>
                <option value="Dessert / Bakery">Dessert / Bakery</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Mall Space">Mall Space</option>
                <option value="Standalone Building">Standalone Building</option>
                <option value="Bungalow">Bungalow</option>
                <option value="Villa">Villa</option>
                <option value="Commercial Complex">Commercial Complex</option>
                <option value="Business Park">Business Park</option>
                <option value="IT Park">IT Park</option>
                <option value="Co-working Space">Co-working Space</option>
                <option value="Service Apartment">Service Apartment</option>
                <option value="Hotel / Hospitality">Hotel / Hospitality</option>
                <option value="Land">Land</option>
                <option value="Industrial Space">Industrial Space</option>
                <option value="Showroom">Showroom</option>
                <option value="Kiosk">Kiosk</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="City/Area..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Min Score</label>
              <input
                type="number"
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(parseInt(e.target.value) || 30)}
                min="0"
                max="100"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
              />
            </div>
          </div>
        </div>

        {/* Matches Table */}
        {loading ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5200] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading matches...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
            <p className="text-red-400">{error}</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg">No matches found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    {view === 'brand' ? (
                      <>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Brand</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Matched Properties</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Top Score</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Match Quality</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Property</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Matched Brands</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Top Score</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Match Quality</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {matches.map((group, index) => {
                    const topMatch = group.matches[0]
                    const uniqueKey = view === 'brand' 
                      ? group.brand?.id || `brand-${index}`
                      : group.property?.id || `property-${index}`
                    return (
                      <tr key={uniqueKey} className="hover:bg-gray-750">
                        {view === 'brand' ? (
                          <>
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-3">
                                {(() => {
                                  const logoPath = getBrandLogo(group.brand?.name)
                                  const brandInitial = getBrandInitial(group.brand?.name)
                                  return logoPath ? (
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-600 bg-gray-700 flex items-center justify-center flex-shrink-0">
                                      <Image
                                        src={logoPath}
                                        alt={group.brand?.name || 'Brand'}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          target.style.display = 'none'
                                          const parent = target.parentElement
                                          if (parent) {
                                            parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center text-white font-bold text-sm">${brandInitial}</div>`
                                          }
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                      {brandInitial}
                                    </div>
                                  )
                                })()}
                                <div>
                                  <div className="font-medium text-white">{group.brand?.name}</div>
                                  <div className="text-sm text-gray-400">{group.brand?.businessType}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {group.brand?.sizeRange} • {group.brand?.budgetRange}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                {group.matches.slice(0, 3).map((match) => (
                                  <div key={match.id} className="text-sm">
                                    <div className="text-white">{match.property.title}</div>
                                    <div className="text-gray-400 text-xs">
                                      {match.property.city} • {match.property.size.toLocaleString()} sqft • {formatPrice(match.property.price)}
                                    </div>
                                  </div>
                                ))}
                                {group.matches.length > 3 && (
                                  <div className="text-xs text-gray-500">
                                    +{group.matches.length - 3} more matches
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white font-bold">
                                {topMatch.pfiScore}%
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getMatchQualityColor(topMatch.matchQuality)}`}>
                                {topMatch.matchQuality}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedMatchGroup(group)
                                    setShowDetailsModal(true)
                                  }}
                                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
                                >
                                  View Details
                                </button>
                                <button
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                                  onClick={() => {
                                    const email = group.brand?.email
                                    if (email) window.location.href = `mailto:${email}`
                                  }}
                                >
                                  Contact
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-white">{group.property?.title}</div>
                                <div className="text-sm text-gray-400">{group.property?.address}, {group.property?.city}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {group.property?.size.toLocaleString()} sqft • {formatPrice(group.property?.price || 0)} • {group.property?.propertyType}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                {group.matches.slice(0, 3).map((match) => {
                                  const logoPath = getBrandLogo(match.brand.name)
                                  const brandInitial = getBrandInitial(match.brand.name)
                                  return (
                                    <div key={match.id} className="flex items-start gap-2 text-sm">
                                      {logoPath ? (
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-600 bg-gray-700 flex items-center justify-center flex-shrink-0">
                                          <Image
                                            src={logoPath}
                                            alt={match.brand.name}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement
                                              target.style.display = 'none'
                                              const parent = target.parentElement
                                              if (parent) {
                                                parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center text-white font-bold text-xs">${brandInitial}</div>`
                                              }
                                            }}
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                          {brandInitial}
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="text-white">{match.brand.name}</div>
                                        <div className="text-gray-400 text-xs">
                                          {match.brand.businessType} • {match.brand.sizeRange}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                                {group.matches.length > 3 && (
                                  <div className="text-xs text-gray-500">
                                    +{group.matches.length - 3} more matches
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white font-bold">
                                {topMatch.pfiScore}%
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getMatchQualityColor(topMatch.matchQuality)}`}>
                                {topMatch.matchQuality}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedMatchGroup(group)
                                    setShowDetailsModal(true)
                                  }}
                                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
                                >
                                  View Details
                                </button>
                                <button
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                                  onClick={() => {
                                    const ownerEmail = group.property?.owner?.email
                                    if (ownerEmail) window.location.href = `mailto:${ownerEmail}`
                                  }}
                                >
                                  Contact Owner
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Match Details Modal */}
        {showDetailsModal && selectedMatchGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {view === 'brand' ? `${selectedMatchGroup.brand?.name} - Matches` : `${selectedMatchGroup.property?.title} - Matches`}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedMatchGroup(null)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Brand/Property Info */}
                {view === 'brand' ? (
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Brand Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Company:</span>
                        <span className="text-white ml-2">{selectedMatchGroup.brand?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Industry:</span>
                        <span className="text-white ml-2">{selectedMatchGroup.brand?.businessType}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Size Range:</span>
                        <span className="text-white ml-2">{selectedMatchGroup.brand?.sizeRange}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Budget Range:</span>
                        <span className="text-white ml-2">{selectedMatchGroup.brand?.budgetRange}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Preferred Locations:</span>
                        <span className="text-white ml-2">{selectedMatchGroup.brand?.preferredLocations.join(', ') || 'Any'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Email:</span>
                        <a href={`mailto:${selectedMatchGroup.brand?.email}`} className="text-[#FF5200] ml-2 hover:underline">
                          {selectedMatchGroup.brand?.email}
                        </a>
                      </div>
                      <div>
                        <span className="text-gray-400">Phone:</span>
                        <a href={`tel:${selectedMatchGroup.brand?.phone}`} className="text-[#FF5200] ml-2 hover:underline">
                          {selectedMatchGroup.brand?.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Property Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Title:</span>
                        <span className="text-white ml-2">{selectedMatchGroup.property?.title}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white ml-2 capitalize">{selectedMatchGroup.property?.propertyType}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Size:</span>
                        <span className="text-white ml-2">{selectedMatchGroup.property?.size.toLocaleString()} sqft</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Rent:</span>
                        <span className="text-white ml-2">{formatPrice(selectedMatchGroup.property?.price || 0)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Address:</span>
                        <span className="text-white ml-2">{selectedMatchGroup.property?.address}, {selectedMatchGroup.property?.city}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Owner:</span>
                        <span className="text-white ml-2">{selectedMatchGroup.property?.owner?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Owner Email:</span>
                        <a href={`mailto:${selectedMatchGroup.property?.owner?.email}`} className="text-[#FF5200] ml-2 hover:underline">
                          {selectedMatchGroup.property?.owner?.email}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Matches List */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {selectedMatchGroup.matches.length} Match{selectedMatchGroup.matches.length !== 1 ? 'es' : ''}
                  </h3>
                  <div className="space-y-4">
                    {selectedMatchGroup.matches.map((match) => {
                      const logoPath = view === 'property' ? getBrandLogo(match.brand.name) : null
                      const brandInitial = view === 'property' ? getBrandInitial(match.brand.name) : ''
                      return (
                        <div key={match.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {view === 'property' && (
                                <>
                                  {logoPath ? (
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-700 bg-gray-800 flex items-center justify-center flex-shrink-0">
                                      <Image
                                        src={logoPath}
                                        alt={match.brand.name}
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          target.style.display = 'none'
                                          const parent = target.parentElement
                                          if (parent) {
                                            parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center text-white font-bold">${brandInitial}</div>`
                                          }
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center text-white font-bold flex-shrink-0">
                                      {brandInitial}
                                    </div>
                                  )}
                                </>
                              )}
                              <div className="flex-1">
                                {view === 'brand' ? (
                                  <>
                                    <div className="font-medium text-white">{match.property.title}</div>
                                    <div className="text-sm text-gray-400 mt-1">
                                      {match.property.city} • {match.property.size.toLocaleString()} sqft • {formatPrice(match.property.price)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                      Owner: {match.property.owner?.name} ({match.property.owner?.email})
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="font-medium text-white">{match.brand.name}</div>
                                    <div className="text-sm text-gray-400 mt-1">
                                      {match.brand.businessType} • {match.brand.sizeRange} • {match.brand.budgetRange}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                      Contact: {match.brand.email} • {match.brand.phone}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 ml-4">
                              <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white font-bold text-lg">
                                  {match.pfiScore}%
                                </div>
                                <div className="mt-2">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getMatchQualityColor(match.matchQuality)}`}>
                                    {match.matchQuality}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                {view === 'brand' ? (
                                  <button
                                    onClick={() => {
                                      window.location.href = `mailto:${match.property.owner?.email}?subject=Property Match: ${match.property.title}`
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                  >
                                    Contact Owner
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      window.location.href = `mailto:${match.brand.email}?subject=Property Match: ${selectedMatchGroup.property?.title}`
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                  >
                                    Contact Brand
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

