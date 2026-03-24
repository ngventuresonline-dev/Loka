'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getBrandLogo, getBrandInitial } from '@/lib/brand-logos'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'

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
    bfiScore?: number
    bfiBreakdown?: { locationScore: number; sizeScore: number; budgetScore: number; typeScore: number }
    matchQuality: 'Excellent' | 'Good' | 'Fair'
    createdAt: string
  }>
}

export default function AdminMatchesPage() {
  const { user } = useAuth()
  const [view, setView] = useState<'brand' | 'property'>('brand')
  const [matches, setMatches] = useState<MatchGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBrandIds, setSelectedBrandIds] = useState<Set<string>>(new Set())
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailNote, setEmailNote] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBodyIntro, setEmailBodyIntro] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewBrandName, setPreviewBrandName] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [sendingEmails, setSendingEmails] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null)
  const [emailContextPropertyId, setEmailContextPropertyId] = useState<string | null>(null)

  const DEFAULT_SUBJECT = 'Matched commercial spaces for {{brandName}} on Lokazen'
  const DEFAULT_BODY_INTRO = 'Hi {{contactName}},\n\nWe came across your enquiry for a space in Bangalore and have put together a curated list of available commercial properties that match {{brandName}}\'s requirements.'
  
  // Filters
  const [brandNameFilter, setBrandNameFilter] = useState('')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [minScoreFilter, setMinScoreFilter] = useState(30)
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedMatchGroup, setSelectedMatchGroup] = useState<MatchGroup | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBrands, setTotalBrands] = useState(0)
  const limit = 500

  useEffect(() => {
    setPage(1)
  }, [view, brandNameFilter, propertyTypeFilter, locationFilter, minScoreFilter, selectedBrandId, selectedPropertyId])

  useEffect(() => {
    fetchMatches()
  }, [view, brandNameFilter, propertyTypeFilter, locationFilter, minScoreFilter, selectedBrandId, selectedPropertyId, page])

  useEffect(() => {
    setSelectedBrandIds(new Set())
  }, [view, brandNameFilter, propertyTypeFilter, locationFilter, minScoreFilter, selectedBrandId, selectedPropertyId, page])

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
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (user?.id) params.append('userId', user.id)
      if (user?.email) params.append('userEmail', encodeURIComponent(user.email))

      const response = await fetch(`/api/admin/matches?${params}`, { credentials: 'include' })
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      const data = await response.json()
      setMatches(data.matches || [])
      setTotalPages(data.totalPages ?? 1)
      setTotalBrands(data.totalBrands ?? data.matches?.length ?? 0)
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

  const brandsWithEmail = useMemo(() => {
    return matches.filter((g) => g.brand?.email && String(g.brand.email).trim().length > 0)
  }, [matches])

  const selectableIds = useMemo(
    () => brandsWithEmail.map((g) => g.brand!.id).filter(Boolean),
    [brandsWithEmail]
  )

  const brandsWithEmailFromPropertyView = useMemo(() => {
    const seen = new Set<string>()
    const ids: string[] = []
    for (const g of matches) {
      for (const m of g.matches || []) {
        const bid = m.brand?.id
        const email = m.brand?.email
        if (bid && email && String(email).trim() && !seen.has(bid)) {
          seen.add(bid)
          ids.push(bid)
        }
      }
    }
    return ids
  }, [matches])

  const getBrandIdsForProperty = useCallback((group: MatchGroup) => {
    const ids: string[] = []
    for (const m of group.matches || []) {
      if (m.brand?.id && m.brand?.email && String(m.brand.email).trim()) {
        ids.push(m.brand.id)
      }
    }
    return ids
  }, [])

  const isPropertyFullySelected = useCallback(
    (group: MatchGroup) => {
      const ids = getBrandIdsForProperty(group)
      return ids.length > 0 && ids.every((id) => selectedBrandIds.has(id))
    },
    [getBrandIdsForProperty, selectedBrandIds]
  )

  const togglePropertyBrands = useCallback(
    (group: MatchGroup) => {
      const ids = getBrandIdsForProperty(group)
      if (ids.length === 0) return
      setSelectedBrandIds((prev) => {
        const next = new Set(prev)
        const allIn = ids.every((id) => next.has(id))
        if (allIn) ids.forEach((id) => next.delete(id))
        else ids.forEach((id) => next.add(id))
        return next
      })
    },
    [getBrandIdsForProperty]
  )

  const allSelectableChecked =
    view === 'brand'
      ? selectableIds.length > 0 && selectableIds.every((id) => selectedBrandIds.has(id))
      : brandsWithEmailFromPropertyView.length > 0 &&
        brandsWithEmailFromPropertyView.every((id) => selectedBrandIds.has(id))

  const toggleBrand = useCallback((brandId: string) => {
    setSelectedBrandIds((prev) => {
      const next = new Set(prev)
      if (next.has(brandId)) next.delete(brandId)
      else next.add(brandId)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (allSelectableChecked) {
      setSelectedBrandIds(new Set())
    } else {
      const ids = view === 'brand' ? selectableIds : brandsWithEmailFromPropertyView
      setSelectedBrandIds(new Set(ids))
    }
  }, [allSelectableChecked, selectableIds, brandsWithEmailFromPropertyView, view])

  const fetchEmailPreview = useCallback(async () => {
    const ids = [...selectedBrandIds]
    if (ids.length === 0) return
    setPreviewLoading(true)
    try {
      const res = await fetch('/api/admin/matches/email/preview', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandIds: ids,
          minScore: minScoreFilter,
          brandName: brandNameFilter || undefined,
          propertyType: propertyTypeFilter || undefined,
          location: locationFilter || undefined,
          propertyId: emailContextPropertyId || selectedPropertyId || undefined,
          note: emailNote.trim(),
          subjectOverride: emailSubject.trim() || undefined,
          bodyIntroOverride: emailBodyIntro.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && !data.error) {
        setPreviewHtml(data.html || '')
        setPreviewBrandName(data.brandName || '')
      }
    } catch {
      // ignore
    } finally {
      setPreviewLoading(false)
    }
  }, [
    selectedBrandIds,
    minScoreFilter,
    brandNameFilter,
    propertyTypeFilter,
    locationFilter,
    selectedPropertyId,
    emailContextPropertyId,
    emailNote,
    emailSubject,
    emailBodyIntro,
  ])

  useEffect(() => {
    if (showEmailModal && selectedBrandIds.size > 0) {
      setEmailSubject(DEFAULT_SUBJECT)
      setEmailBodyIntro(DEFAULT_BODY_INTRO)
      setEmailFeedback(null)
      fetchEmailPreview()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when modal opens
  }, [showEmailModal, selectedBrandIds.size])

  const handleEditWithAI = async () => {
    setAiLoading(true)
    setEmailFeedback(null)
    try {
      const res = await fetch('/api/admin/matches/email/edit-with-ai', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject || DEFAULT_SUBJECT,
          body: emailBodyIntro || DEFAULT_BODY_INTRO,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setEmailSubject(data.subject ?? emailSubject)
        setEmailBodyIntro(data.body ?? emailBodyIntro)
        setEmailFeedback('AI suggestions applied. Review and refresh preview.')
      } else {
        setEmailFeedback(data.error || 'AI edit failed')
      }
    } catch (e: any) {
      setEmailFeedback(e?.message || 'AI edit failed')
    } finally {
      setAiLoading(false)
    }
  }

  const sendMatchEmails = async () => {
    if (!user?.id || !user?.email) {
      setEmailFeedback('Sign in as admin to send emails.')
      return
    }
    const ids = [...selectedBrandIds]
    if (ids.length === 0) return
    setSendingEmails(true)
    setEmailFeedback(null)
    try {
      const q = new URLSearchParams({
        userId: user.id,
        userEmail: encodeURIComponent(user.email),
      })
      const res = await fetch(`/api/admin/matches/email?${q}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandIds: ids,
          minScore: minScoreFilter,
          brandName: brandNameFilter || undefined,
          propertyType: propertyTypeFilter || undefined,
          location: locationFilter || undefined,
          propertyId: emailContextPropertyId || selectedPropertyId || undefined,
          note: emailNote.trim(),
          subjectOverride: emailSubject.trim() !== DEFAULT_SUBJECT ? emailSubject.trim() : undefined,
          bodyIntroOverride: emailBodyIntro.trim() !== DEFAULT_BODY_INTRO ? emailBodyIntro.trim() : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEmailFeedback(data.error || 'Failed to send emails')
        return
      }
      const ok = (data.results || []).filter((r: { ok: boolean }) => r.ok).length
      const fail = (data.results || []).filter((r: { ok: boolean }) => !r.ok).length
      setEmailFeedback(
        `${ok} sent${fail ? `, ${fail} skipped/failed` : ''}. ${data.message || ''}`.trim()
      )
      setShowEmailModal(false)
      setEmailNote('')
      setEmailSubject('')
      setEmailBodyIntro('')
      setPreviewHtml('')
      setSelectedBrandIds(new Set())
      setEmailContextPropertyId(null)
    } catch (e: any) {
      setEmailFeedback(e?.message || 'Network error')
    } finally {
      setSendingEmails(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">BFI & PFI – Property & Brand Matches</h1>
            <p className="text-gray-400 mt-1">
              View property–brand matches. <strong className="text-gray-300">BFI</strong> (Brand Fit Index) = how well a property fits a brand’s requirements. <strong className="text-gray-300">PFI</strong> (Property Fit Index) = same fit from the property’s perspective.
            </p>
          </div>
        </div>

        {/* CRM: bulk email */}
        {matches.length > 0 && (
          <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 flex flex-wrap items-center gap-4 justify-between">
            <div className="text-sm text-gray-300">
              <strong className="text-white">CRM:</strong>{' '}
              {view === 'brand' ? 'Select brands' : 'Check properties to select their matched brands'}, then email them their{' '}
              <span className="text-[#FF5200]">matched properties</span>. Requires{' '}
              <code className="text-xs bg-gray-900 px-1 rounded">RESEND_API_KEY</code> + <code className="text-xs bg-gray-900 px-1 rounded">RESEND_FROM</code> for delivery.
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">{selectedBrandIds.size} selected</span>
              <button
                type="button"
                disabled={selectedBrandIds.size === 0 || !user?.email}
                onClick={() => {
                  setEmailFeedback(null)
                  setShowEmailModal(true)
                }}
                className="px-4 py-2 rounded-lg font-medium bg-[#FF5200] text-white hover:bg-[#e04800] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Email matched properties
              </button>
            </div>
          </div>
        )}
        {emailFeedback && (
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm text-gray-300">{emailFeedback}</div>
        )}

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
            {totalPages > 1 && (
              <div className="px-6 py-3 bg-gray-900/50 border-b border-gray-700 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Page {page} of {totalPages} · {totalBrands} brands total
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    {view === 'brand' ? (
                      <>
                        <th className="px-3 py-4 text-left w-12">
                          <input
                            type="checkbox"
                            title="Select all with email"
                            checked={allSelectableChecked}
                            onChange={toggleSelectAll}
                            disabled={selectableIds.length === 0}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#FF5200] focus:ring-[#FF5200]"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Brand</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Matched Properties</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Top Score</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Match Quality</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-4 text-left w-12">
                          <input
                            type="checkbox"
                            title="Select all properties' brands"
                            checked={allSelectableChecked}
                            onChange={toggleSelectAll}
                            disabled={brandsWithEmailFromPropertyView.length === 0}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#FF5200] focus:ring-[#FF5200]"
                          />
                        </th>
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
                            <td className="px-3 py-4 align-top">
                              <input
                                type="checkbox"
                                checked={group.brand?.id ? selectedBrandIds.has(group.brand.id) : false}
                                onChange={() => group.brand?.id && toggleBrand(group.brand.id)}
                                disabled={!group.brand?.email || !String(group.brand.email).trim()}
                                title={
                                  !group.brand?.email
                                    ? 'No email on file'
                                    : 'Include in bulk email'
                                }
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#FF5200] focus:ring-[#FF5200] disabled:opacity-30"
                              />
                            </td>
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
                              <div className="flex flex-col gap-1">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white font-bold" title="PFI / BFI score">
                                  {topMatch.bfiScore ?? topMatch.pfiScore}%
                                </div>
                                <span className="text-xs text-gray-500">BFI</span>
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
                                {group.brand?.id && group.brand?.email && (
                                  <button
                                    type="button"
                                    className="px-3 py-1.5 bg-[#FF5200]/90 hover:bg-[#FF5200] text-white text-xs rounded-lg transition-colors"
                                    onClick={() => {
                                      setSelectedBrandIds(new Set([group.brand!.id]))
                                      setEmailFeedback(null)
                                      setShowEmailModal(true)
                                    }}
                                  >
                                    Email matches
                                  </button>
                                )}
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-4 align-top">
                              <input
                                type="checkbox"
                                checked={isPropertyFullySelected(group)}
                                onChange={() => togglePropertyBrands(group)}
                                disabled={getBrandIdsForProperty(group).length === 0}
                                title={
                                  getBrandIdsForProperty(group).length === 0
                                    ? 'No matched brands with email'
                                    : 'Select to email matched brands'
                                }
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#FF5200] focus:ring-[#FF5200] disabled:opacity-30"
                              />
                            </td>
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
                              <div className="flex flex-col gap-1">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white font-bold" title="PFI / BFI score">
                                  {topMatch.bfiScore ?? topMatch.pfiScore}%
                                </div>
                                <span className="text-xs text-gray-500">BFI</span>
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
                                {getBrandIdsForProperty(group).length > 0 && (
                                  <button
                                    type="button"
                                    className="px-3 py-1.5 bg-[#FF5200]/90 hover:bg-[#FF5200] text-white text-xs rounded-lg transition-colors"
                                    onClick={() => {
                                      setSelectedBrandIds(new Set(getBrandIdsForProperty(group)))
                                      setEmailFeedback(null)
                                      setShowEmailModal(true)
                                    }}
                                  >
                                    Email brands
                                  </button>
                                )}
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

        {/* Email matched properties modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 overflow-y-auto">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full border border-gray-700 shadow-xl my-8">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Email matched properties</h2>
                <button
                  type="button"
                  onClick={() => {
                    if (!sendingEmails) {
                      setShowEmailModal(false)
                      setEmailContextPropertyId(null)
                    }
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-5 max-h-[calc(90vh-140px)] overflow-y-auto">
                <p className="text-gray-400 text-sm">
                  Sending to <strong className="text-white">{selectedBrandIds.size}</strong> brand(s){emailContextPropertyId ? ' — this property only' : ''}. Placeholders: <code className="text-xs bg-gray-900 px-1 rounded">&#123;&#123;brandName&#125;&#125;</code> <code className="text-xs bg-gray-900 px-1 rounded">&#123;&#123;contactName&#125;&#125;</code>
                </p>
                {emailFeedback && (
                  <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm text-gray-300">{emailFeedback}</div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-white">Edit</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder={DEFAULT_SUBJECT}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF5200] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Body intro</label>
                      <textarea
                        value={emailBodyIntro}
                        onChange={(e) => setEmailBodyIntro(e.target.value)}
                        rows={4}
                        placeholder={DEFAULT_BODY_INTRO}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF5200] text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Use double line breaks for paragraphs.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Note to brands</label>
                      <textarea
                        value={emailNote}
                        onChange={(e) => setEmailNote(e.target.value)}
                        rows={3}
                        placeholder="e.g. We shortlisted these for your Q2 expansion — reply if you want a site visit."
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF5200] text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={aiLoading}
                        onClick={handleEditWithAI}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {aiLoading ? (
                          <>
                            <span className="animate-spin">⏳</span> AI editing…
                          </>
                        ) : (
                          <>✨ Edit with Claude</>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={previewLoading}
                        onClick={fetchEmailPreview}
                        className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm hover:bg-gray-600 disabled:opacity-50"
                      >
                        {previewLoading ? 'Loading…' : 'Refresh preview'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">Preview {previewBrandName && `(${previewBrandName})`}</h3>
                    <div className="border border-gray-600 rounded-lg bg-white min-h-[320px] overflow-auto">
                      {previewLoading && !previewHtml ? (
                        <div className="p-8 text-center text-gray-500">Loading preview…</div>
                      ) : previewHtml ? (
                        <iframe
                          srcDoc={previewHtml}
                          title="Email preview"
                          className="w-full min-h-[320px] border-0"
                          sandbox="allow-same-origin"
                        />
                      ) : (
                        <div className="p-8 text-center text-gray-500">No preview yet</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
                  <button
                    type="button"
                    disabled={sendingEmails}
                    onClick={() => {
                      setShowEmailModal(false)
                      setEmailContextPropertyId(null)
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={sendingEmails}
                    onClick={sendMatchEmails}
                    className="px-4 py-2 rounded-lg bg-[#FF5200] text-white font-medium hover:bg-[#e04800] disabled:opacity-50 text-sm"
                  >
                    {sendingEmails ? 'Sending…' : 'Send emails'}
                  </button>
                </div>
              </div>
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
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white font-bold text-lg" title="BFI (Brand Fit Index)">
                                  {(match.bfiScore ?? match.pfiScore)}%
                                </div>
                                <div className="mt-2 text-xs text-gray-500">BFI</div>
                                <div className="mt-2">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getMatchQualityColor(match.matchQuality)}`}>
                                    {match.matchQuality}
                                  </span>
                                </div>
                                {match.bfiBreakdown && (
                                  <div className="mt-3 text-left text-xs text-gray-400 space-y-1">
                                    <div>Location: {match.bfiBreakdown.locationScore}</div>
                                    <div>Size: {match.bfiBreakdown.sizeScore}</div>
                                    <div>Budget: {match.bfiBreakdown.budgetScore}</div>
                                    <div>Type: {match.bfiBreakdown.typeScore}</div>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                {view === 'brand' ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        window.location.href = `mailto:${match.property.owner?.email}?subject=Property Match: ${match.property.title}`
                                      }}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                    >
                                      Contact Owner
                                    </button>
                                    {selectedMatchGroup.brand?.id &&
                                      selectedMatchGroup.brand?.email &&
                                      match.property?.id && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedBrandIds(new Set([selectedMatchGroup.brand!.id]))
                                            setEmailContextPropertyId(match.property.id)
                                            setEmailFeedback(null)
                                            setShowEmailModal(true)
                                          }}
                                          className="px-4 py-2 bg-[#FF5200]/90 hover:bg-[#FF5200] text-white text-sm rounded-lg transition-colors"
                                        >
                                          Email property to brand
                                        </button>
                                      )}
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        window.location.href = `mailto:${match.brand.email}?subject=Property Match: ${selectedMatchGroup.property?.title}`
                                      }}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                    >
                                      Contact Brand
                                    </button>
                                    {match.brand?.id &&
                                      match.brand?.email &&
                                      selectedMatchGroup.property?.id && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedBrandIds(new Set([match.brand.id]))
                                            setEmailContextPropertyId(selectedMatchGroup.property!.id)
                                            setEmailFeedback(null)
                                            setShowEmailModal(true)
                                          }}
                                          className="px-4 py-2 bg-[#FF5200]/90 hover:bg-[#FF5200] text-white text-sm rounded-lg transition-colors"
                                        >
                                          Email property to brand
                                        </button>
                                      )}
                                  </>
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

