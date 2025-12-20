'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import { Property } from '@/types/workflow'
import { motion, AnimatePresence } from 'framer-motion'
import LokazenNodesLoader from '@/components/LokazenNodesLoader'

interface MatchResult {
  property: Property
  bfiScore: number
  matchReasons: string[]
  breakdown: {
    locationScore: number
    sizeScore: number
    budgetScore: number
    typeScore: number
  }
}

type SortOption = 'best-match' | 'price-low' | 'price-high' | 'newest'

function PropertiesResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [aiMatching, setAiMatching] = useState(true)
  const [matchingStep, setMatchingStep] = useState(0)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [totalMatches, setTotalMatches] = useState(0)
  const [sortBy, setSortBy] = useState<SortOption>('best-match')
  const [currentPage, setCurrentPage] = useState(1)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactFormData, setContactFormData] = useState({
    name: '',
    phone: '',
    bestTime: '',
    additionalRequirements: ''
  })
  const [showRequirementsModal, setShowRequirementsModal] = useState(false)
  const [requirementsFormData, setRequirementsFormData] = useState({
    name: '',
    phone: '',
    email: '',
    requirements: ''
  })
  const [submittingRequirements, setSubmittingRequirements] = useState(false)

  const itemsPerPage = 12

  // Extract filters from URL
  const filters = {
    businessType: searchParams.get('businessType') || '',
    sizeMin: parseInt(searchParams.get('sizeMin') || '0'),
    sizeMax: parseInt(searchParams.get('sizeMax') || '100000'),
    locations: searchParams.get('locations')?.split(',').filter(l => l.trim()) || [],
    budgetMin: parseInt(searchParams.get('budgetMin') || '0'),
    budgetMax: parseInt(searchParams.get('budgetMax') || '10000000'),
    timeline: searchParams.get('timeline') || '',
    propertyType: searchParams.get('propertyType') || ''
  }
  
  // Log filters for debugging
  console.log('[Results Page] Filters applied:', filters)

  useEffect(() => {
    fetchMatches()
  }, [searchParams])

  // Prefill requirements from filters
  useEffect(() => {
    if (showRequirementsModal && !requirementsFormData.requirements) {
      const requirementsParts: string[] = []
      if (filters.businessType) requirementsParts.push(`Business Type: ${filters.businessType}`)
      if (filters.locations.length > 0) requirementsParts.push(`Locations: ${filters.locations.join(', ')}`)
      if (filters.sizeMin > 0 || filters.sizeMax < 100000) {
        requirementsParts.push(`Size: ${filters.sizeMin.toLocaleString()} - ${filters.sizeMax.toLocaleString()} sqft`)
      }
      if (filters.budgetMin > 0 || filters.budgetMax < 10000000) {
        requirementsParts.push(`Budget: ₹${(filters.budgetMin / 1000).toFixed(0)}K - ₹${(filters.budgetMax / 1000).toFixed(0)}K`)
      }
      if (filters.propertyType) requirementsParts.push(`Property Type: ${filters.propertyType}`)
      if (filters.timeline) requirementsParts.push(`Timeline: ${filters.timeline}`)
      
      setRequirementsFormData(prev => ({
        ...prev,
        requirements: requirementsParts.join('\n')
      }))
    }
  }, [showRequirementsModal, filters])

  // Prefill name/email from localStorage if available
  useEffect(() => {
    if (showRequirementsModal) {
      try {
        const detailsRaw = localStorage.getItem('brandOnboardingDetails')
        const submissionRaw = localStorage.getItem('brandOnboardingSubmission')
        const details = detailsRaw ? JSON.parse(detailsRaw) : null
        const submission = submissionRaw ? JSON.parse(submissionRaw) : null
        
        const name = details?.contactPerson || submission?.brandName || ''
        const email = details?.email || ''
        const phone = details?.phone || ''
        
        if (name || email || phone) {
          setRequirementsFormData(prev => ({
            ...prev,
            name: prev.name || name,
            email: prev.email || email,
            phone: prev.phone || phone
          }))
        }
      } catch (err) {
        console.error('Prefill requirements form failed:', err)
      }
    }
  }, [showRequirementsModal])

  // Helper function to create a fetch - no timeout, let it complete naturally
  const fetchWithTimeout = async (url: string, options: RequestInit = {}): Promise<Response> => {
    // No timeout - just fetch normally and let it complete
    return fetch(url, options)
  }

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setAiMatching(true)
      setMatchingStep(0)
      
      // Reduced AI matching steps delay - only show 2 steps quickly
      setMatchingStep(1) // "Scanning property database..."
      await new Promise(resolve => setTimeout(resolve, 300))
      setMatchingStep(2) // "Calculating Brand Fit Index (BFI)..."
      
      // Check if user is logged in as a brand - if yes, use brand profile automatically
      let response
      try {
        const sessionJson = localStorage.getItem('ngventures_session')
        if (sessionJson) {
          const session = JSON.parse(sessionJson)
          if (session.userType === 'brand' && session.userId && session.email) {
            // Use brand's profile from database - pass auth params
            const authParams = new URLSearchParams({
              minScore: '60',
              userId: session.userId,
              userEmail: session.email
            })
            response = await fetchWithTimeout(
              `/api/brands/matches?${authParams.toString()}`,
              {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
              }
            )
            
            if (response.ok) {
              const data = await response.json()
              if (data.success && data.matches) {
                // Convert to expected format
                const formattedMatches = data.matches.map((match: any) => ({
                  property: match.property,
                  bfiScore: match.bfiScore,
                  matchReasons: match.matchReasons || [],
                  breakdown: match.breakdown
                }))
                setMatches(formattedMatches)
                setTotalMatches(formattedMatches.length)
                setAiMatching(false)
                setLoading(false)
                return
              }
            }
          }
        }
      } catch (e: any) {
        // If brand profile fetch fails, fall through to manual search
        console.log('Not logged in as brand or profile not found, using manual search:', e.message)
      }
      
      // Fallback: Use manual search with query params (for non-logged-in users or if brand profile fails)
      setMatchingStep(3) // "Ranking matches by AI score..."
      
      // Parse size range from URL or use defaults
      const sizeRange = filters.sizeMin > 0 || filters.sizeMax < 100000
        ? { min: filters.sizeMin, max: filters.sizeMax }
        : undefined

      const budgetRange = filters.budgetMin > 0 || filters.budgetMax < 10000000
        ? { min: filters.budgetMin, max: filters.budgetMax }
        : undefined

      response = await fetchWithTimeout(
        '/api/properties/match',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessType: filters.businessType,
            sizeRange,
            locations: filters.locations,
            budgetRange,
            timeline: filters.timeline,
            propertyType: filters.propertyType
          })
        }
      )

      if (!response.ok) {
        // Log detailed error information but don't throw to avoid noisy console errors
        try {
          const errorBody = await response.json().catch(() => null)
          console.error('[Results] Match API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorBody
          })
        } catch (e) {
          console.error('[Results] Match API error (no body):', {
            status: response.status,
            statusText: response.statusText
          })
        }

        // Gracefully degrade: show empty state instead of crashing
        setMatches([])
        setTotalMatches(0)
        setAiMatching(false)
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('[Results] API Response:', {
        matchesCount: data.matches?.length || 0,
        totalMatches: data.totalMatches || 0,
        minScore: data.minMatchScore || 60
      })
      
      setMatches(data.matches || [])
      setTotalMatches(data.totalMatches || 0)
      
      // If no matches, log for debugging
      if (!data.matches || data.matches.length === 0) {
        console.warn('[Results] No matches found. Filters:', filters)
      }
      
      setMatchingStep(4) // "Finalizing results..."
      await new Promise(resolve => setTimeout(resolve, 200))
      setAiMatching(false)
    } catch (error: any) {
      console.error('Error fetching matches:', error)
      // Don't show alerts - just show empty state gracefully
      setMatches([])
      setTotalMatches(0)
      setAiMatching(false)
    } finally {
      setLoading(false)
    }
  }

  // Sort matches
  const sortedMatches = [...matches].sort((a, b) => {
    switch (sortBy) {
      case 'best-match':
        return b.bfiScore - a.bfiScore
      case 'price-low':
        return a.property.price - b.property.price
      case 'price-high':
        return b.property.price - a.property.price
      case 'newest':
        return new Date(b.property.createdAt).getTime() - new Date(a.property.createdAt).getTime()
      default:
        return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedMatches.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMatches = sortedMatches.slice(startIndex, startIndex + itemsPerPage)

  // Remove filter
  const removeFilter = (filterType: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(filterType)
    router.push(`/properties/results?${params.toString()}`)
  }

  // Clear all filters
  const clearAllFilters = () => {
    router.push('/properties')
  }

  // Edit filters - return to brand filter page with pre-filled values
  const handleEditFilters = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('editingFilters', 'true')
      } catch (e) {
        console.warn('[Results] Failed to set editingFilters flag', e)
      }
    }
    router.push('/filter/brand')
  }

  // Format filter display
  const getFilterChips = () => {
    const chips: Array<{ label: string; value: string; key: string }> = []
    
    if (filters.businessType) {
      chips.push({ label: 'Business', value: filters.businessType, key: 'businessType' })
    }
    if (filters.locations.length > 0) {
      chips.push({ label: 'Location', value: filters.locations.join(', '), key: 'locations' })
    }
    if (filters.sizeMin > 0 || filters.sizeMax < 100000) {
      chips.push({ 
        label: 'Size', 
        value: `${filters.sizeMin.toLocaleString()} - ${filters.sizeMax.toLocaleString()} sqft`, 
        key: 'sizeRange' 
      })
    }
    if (filters.budgetMin > 0 || filters.budgetMax < 10000000) {
      chips.push({ 
        label: 'Budget', 
        value: `₹${(filters.budgetMin / 1000).toFixed(0)}K - ₹${(filters.budgetMax / 1000).toFixed(0)}K`, 
        key: 'budgetRange' 
      })
    }
    if (filters.propertyType) {
      chips.push({ label: 'Type', value: filters.propertyType, key: 'propertyType' })
    }

    return chips
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/contact-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactFormData,
          searchCriteria: filters
        })
      })

      if (response.ok) {
        alert('Thank you! Our team will contact you within 24 hours.')
        setShowContactForm(false)
        setContactFormData({ name: '', phone: '', bestTime: '', additionalRequirements: '' })
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      alert('Failed to submit. Please try again.')
    }
  }

  const handleRequirementsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requirementsFormData.name || !requirementsFormData.phone || !requirementsFormData.email) {
      alert('Please fill in all required fields.')
      return
    }

    try {
      setSubmittingRequirements(true)
      const response = await fetch('/api/leads/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requirementsFormData,
          searchCriteria: filters,
          source: 'properties_results_page'
        })
      })

      if (response.ok) {
        alert('Thank you! We\'ve saved your requirements. Our team will find the perfect property for you.')
        setShowRequirementsModal(false)
        setRequirementsFormData({ name: '', phone: '', email: '', requirements: '' })
      } else {
        throw new Error('Failed to save requirements')
      }
    } catch (error) {
      console.error('Error submitting requirements:', error)
      alert('Failed to submit. Please try again.')
    } finally {
      setSubmittingRequirements(false)
    }
  }

  const handleContactTeam = () => {
    const phoneNumber = '+919876543210' // Replace with actual WhatsApp number
    const message = encodeURIComponent(
      `Hi! I'm looking for a commercial property. Can you help me find the perfect match?\n\n` +
      `My requirements:\n${requirementsFormData.requirements || 'See my search filters'}`
    )
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Navbar />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-12">
        {/* AI Matching State */}
        {aiMatching && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 sm:p-12 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  Matching Space with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Our AI</span>
                </h2>
                <p className="text-gray-600 mb-6">
                  {matchingStep < 5 ? [
                    'Analyzing your requirements...',
                    'Scanning property database...',
                    'Calculating Brand Fit Index (BFI)...',
                    'Ranking matches by AI score...',
                    'Finalizing results...'
                  ][matchingStep] : 'Almost done...'}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#FF5200] to-[#E4002B]"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((matchingStep + 1) / 5) * 100}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">
            AI-Matched <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Properties</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {loading ? 'Finding your perfect match...' : `${totalMatches} properties matched by AI`}
          </p>
        </div>

        {/* Filters Summary */}
        {getFilterChips().length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm font-semibold text-gray-700">Filters:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleEditFilters}
                  className="text-[11px] sm:text-xs text-gray-600 hover:text-gray-900 font-medium underline underline-offset-2"
                >
                  Edit Filters
                </button>
                <button
                  onClick={clearAllFilters}
                  className="text-xs sm:text-sm text-[#FF5722] hover:text-[#E4002B] font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {getFilterChips().map((chip, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-300 rounded-md sm:rounded-lg text-xs sm:text-sm flex-shrink-0 whitespace-nowrap"
                >
                  <span className="font-medium text-gray-700 hidden sm:inline">{chip.label}:</span>
                  <span className="text-gray-900 truncate max-w-[120px] sm:max-w-none">{chip.value}</span>
                  <button
                    onClick={() => removeFilter(chip.key)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-0.5 sm:ml-0 flex-shrink-0"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sort and Results Count */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="text-xs sm:text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedMatches.length)} of {sortedMatches.length}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722] w-full sm:w-auto"
          >
            <option value="best-match">Best Match</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
                <div className="h-56 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State / No Matches */}
        {!loading && matches.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 sm:p-12 text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF5722] to-[#E4002B] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">We&apos;re on it!</h2>
              <p className="text-gray-600 mb-8">
                We couldn&apos;t find properties matching your exact criteria right now, but don&apos;t worry!
              </p>

              {!showContactForm ? (
                <div className="space-y-4">
                  <p className="text-lg font-semibold text-gray-900">Our team will personally search for you</p>
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="bg-gradient-to-r from-[#FF5722] to-[#E4002B] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    Connect Me with Team
                  </button>
                  <p className="text-sm text-gray-500">We&apos;ll reach out within 24 hours</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="text-left space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={contactFormData.name}
                      onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={contactFormData.phone}
                      onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Best Time to Call</label>
                    <select
                      value={contactFormData.bestTime}
                      onChange={(e) => setContactFormData({ ...contactFormData, bestTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                    >
                      <option value="">Select time</option>
                      <option value="morning">Morning (9 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                      <option value="evening">Evening (5 PM - 8 PM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Requirements</label>
                    <textarea
                      value={contactFormData.additionalRequirements}
                      onChange={(e) => setContactFormData({ ...contactFormData, additionalRequirements: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#FF5722] to-[#E4002B] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Suggestions */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Modify your search criteria:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Try expanding your location preferences</li>
                <li>• Adjust your budget range</li>
                <li>• Consider slightly larger or smaller spaces</li>
              </ul>
              <button
                onClick={clearAllFilters}
                className="mt-4 text-[#FF5722] hover:text-[#E4002B] font-medium"
              >
                Adjust Filters →
              </button>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!loading && matches.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <AnimatePresence>
                {paginatedMatches.map((match, index) => (
                  <motion.div
                    key={match.property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="cursor-pointer"
                    onClick={() => router.push(`/properties/${match.property.id}/match?${searchParams.toString()}`)}
                  >
                    <PropertyCard
                      property={match.property}
                      bfiScore={match.bfiScore}
                      matchReasons={match.matchReasons}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#FF5722] transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#FF5722] transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Can't Find Property CTA Section */}
        {!loading && matches.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mt-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                Can&apos;t Find Your Ideal Property?
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8">
                Let our team find the perfect match for you
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                {/* List Your Requirements Button */}
                <button
                  onClick={() => setShowRequirementsModal(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  List Your Requirements
                </button>

                {/* Contact Our Team Button */}
                <button
                  onClick={handleContactTeam}
                  className="w-full sm:w-auto bg-white border-2 border-[#FF5200] text-[#FF5200] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-[#FF5200] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contact Our Team
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Requirements Modal */}
      {showRequirementsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-3 sm:px-4 py-4 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 relative my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRequirementsModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl leading-none w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center"
              aria-label="Close"
            >
              ×
            </button>
            
            <div className="mb-4 sm:mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">List Your Requirements</h3>
              <p className="text-xs sm:text-sm text-gray-600 text-center">
                We&apos;ll find the perfect property match for you
              </p>
            </div>

            <form onSubmit={handleRequirementsSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={requirementsFormData.name}
                  onChange={(e) => setRequirementsFormData({ ...requirementsFormData, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={requirementsFormData.phone}
                  onChange={(e) => setRequirementsFormData({ ...requirementsFormData, phone: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={requirementsFormData.email}
                  onChange={(e) => setRequirementsFormData({ ...requirementsFormData, email: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Requirements</label>
                <textarea
                  value={requirementsFormData.requirements}
                  onChange={(e) => setRequirementsFormData({ ...requirementsFormData, requirements: e.target.value })}
                  rows={6}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200] resize-y"
                  placeholder="Your property requirements (pre-filled from your search filters)"
                />
                <p className="text-xs text-gray-500 mt-1">Your search filters have been pre-filled above</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingRequirements}
                  className="flex-1 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {submittingRequirements ? 'Saving...' : 'Save Requirements'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequirementsModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg font-semibold text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-500 mt-3 sm:mt-4 text-center">
              Our team will review your requirements and contact you within 24 hours
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default function PropertiesResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LokazenNodesLoader size="lg" className="mb-4" />
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    }>
      <PropertiesResultsContent />
    </Suspense>
  )
}

