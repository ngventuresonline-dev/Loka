'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import { Property } from '@/types/workflow'
import { motion, AnimatePresence } from 'framer-motion'

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

export default function PropertiesResultsPage() {
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

  const itemsPerPage = 12

  // Extract filters from URL
  const filters = {
    businessType: searchParams.get('businessType') || '',
    sizeMin: parseInt(searchParams.get('sizeMin') || '0'),
    sizeMax: parseInt(searchParams.get('sizeMax') || '100000'),
    locations: searchParams.get('locations')?.split(',') || [],
    budgetMin: parseInt(searchParams.get('budgetMin') || '0'),
    budgetMax: parseInt(searchParams.get('budgetMax') || '10000000'),
    timeline: searchParams.get('timeline') || '',
    propertyType: searchParams.get('propertyType') || ''
  }

  useEffect(() => {
    fetchMatches()
  }, [searchParams])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setAiMatching(true)
      setMatchingStep(0)
      
      // Show AI matching steps
      const steps = [
        'Analyzing your requirements...',
        'Scanning property database...',
        'Calculating Brand Fit Index (BFI)...',
        'Ranking matches by AI score...',
        'Finalizing results...'
      ]
      
      // Simulate AI matching steps
      for (let i = 0; i < steps.length; i++) {
        setMatchingStep(i)
        await new Promise(resolve => setTimeout(resolve, 600))
      }
      
      // Parse size range from URL or use defaults
      const sizeRange = filters.sizeMin > 0 || filters.sizeMax < 100000
        ? { min: filters.sizeMin, max: filters.sizeMax }
        : undefined

      const budgetRange = filters.budgetMin > 0 || filters.budgetMax < 10000000
        ? { min: filters.budgetMin, max: filters.budgetMax }
        : undefined

      const response = await fetch('/api/properties/match', {
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
      })

      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }

      const data = await response.json()
      setMatches(data.matches || [])
      setTotalMatches(data.totalMatches || 0)
      
      // Small delay before showing results
      await new Promise(resolve => setTimeout(resolve, 500))
      setAiMatching(false)
    } catch (error) {
      console.error('Error fetching matches:', error)
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
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            AI-Matched <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Properties</span>
          </h1>
          <p className="text-gray-600">
            {loading ? 'Finding your perfect match...' : `${totalMatches} properties matched by AI`}
          </p>
        </div>

        {/* Filters Summary */}
        {getFilterChips().length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Applied Filters:</span>
              <button
                onClick={clearAllFilters}
                className="text-sm text-[#FF5722] hover:text-[#E4002B] font-medium"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {getFilterChips().map((chip, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
                >
                  <span className="font-medium text-gray-700">{chip.label}:</span>
                  <span className="text-gray-900">{chip.value}</span>
                  <button
                    onClick={() => removeFilter(chip.key)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sort and Results Count */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedMatches.length)} of {sortedMatches.length} matches
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
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
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">We're on it!</h2>
              <p className="text-gray-600 mb-8">
                We couldn't find properties matching your exact criteria right now, but don't worry!
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
                  <p className="text-sm text-gray-500">We'll reach out within 24 hours</p>
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
      </div>

      <Footer />
    </div>
  )
}

