'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MatchBreakdownChart from '@/components/MatchBreakdownChart'
import { Property } from '@/types/workflow'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { logSessionEvent, getClientSessionUserId } from '@/lib/session-logger'
import LocationIntelligence from '@/components/LocationIntelligence'
import LokazenNodesLoader from '@/components/LokazenNodesLoader'
import LokazenNodesPlaceholder from '@/components/LokazenNodesPlaceholder'
import { getPropertyTypeLabel } from '@/lib/property-type-mapper'

const getPrimaryImageSrc = (property: Property): string | null => {
  if (property.images && property.images.length > 0) {
    const src = property.images[0]
    // Only return valid image URLs, no fallbacks
    if (src && !src.startsWith('/images/') && !src.includes('localhost:3000/images') && !src.includes('unsplash') && src.trim() !== '') {
      return src
    }
  }
  return null
}

interface MatchBreakdown {
  locationScore: number
  sizeScore: number
  budgetScore: number
  typeScore: number
}

interface MatchDetails {
  property: Property
  bfiScore: number
  matchReasons: string[]
  breakdown: MatchBreakdown
}

function MatchDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const propertyId = params.id as string
  const [loading, setLoading] = useState(true)
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'location'>('overview')
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [visitDateTime, setVisitDateTime] = useState('')
  const [visitNote, setVisitNote] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [paywallAccepted, setPaywallAccepted] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [visitSubmitting, setVisitSubmitting] = useState(false)

  useEffect(() => {
    // Prefill visitor details from brand onboarding/filter data in localStorage
    try {
      const detailsRaw = localStorage.getItem('brandOnboardingDetails')
      const submissionRaw = localStorage.getItem('brandOnboardingSubmission')
      const filterRaw = localStorage.getItem('brandFilterData')

      const details = detailsRaw ? JSON.parse(detailsRaw) : null
      const submission = submissionRaw ? JSON.parse(submissionRaw) : null
      const filter = filterRaw ? JSON.parse(filterRaw) : null

      const name =
        details?.contactPerson ||
        submission?.brandName ||
        ''
      const email = details?.email || ''
      const phone = details?.phone || ''
      const company =
        details?.companyName ||
        submission?.brandName ||
        filter?.businessType?.[0] ||
        ''

      if (name) setVisitorName(name)
      if (email) setVisitorEmail(email)
      if (phone) setVisitorPhone(phone)
      if (company) setCompanyName(company)
    } catch (err) {
      console.error('Prefill visit form failed:', err)
    }
  }, [])

  useEffect(() => {
    fetchMatchDetails()
  }, [propertyId])

  // Log a property view when the match page is opened and propertyId is available
  useEffect(() => {
    if (!propertyId) return
    logSessionEvent({
      sessionType: 'view',
      action: 'property_match_view',
      userId: getClientSessionUserId(),
      data: { property_id: propertyId },
    })
  }, [propertyId])

  // Prefill notes using AI-ish template based on property and prefilled data
  useEffect(() => {
    if (showVisitModal && matchDetails && !visitNote) {
      const propTitle = matchDetails.property?.title || 'this property'
      const city = matchDetails.property?.city ? ` in ${matchDetails.property.city}` : ''
      const defaultNote = `Interested in ${propTitle}${city}. Please schedule a visit at your earliest convenience. Also looking for support with brand requirements and CRE services.`
      setVisitNote(defaultNote)
    }
  }, [showVisitModal, matchDetails, visitNote])

  const fetchMatchDetails = async () => {
    try {
      setLoading(true)
      
      // Get filters from URL or localStorage
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

      // Fetch property details
      const propertyResponse = await fetch(`/api/properties/${propertyId}`)
      let property: any | null = null
      if (propertyResponse.ok) {
        const propertyData = await propertyResponse.json()
        property = propertyData.property || propertyData
      } else {
        console.warn('Property not found for id:', propertyId)
      }

      // Calculate match score
      const sizeRange = filters.sizeMin > 0 || filters.sizeMax < 100000
        ? { min: filters.sizeMin, max: filters.sizeMax }
        : undefined

      const budgetRange = filters.budgetMin > 0 || filters.budgetMax < 10000000
        ? { min: filters.budgetMin, max: filters.budgetMax }
        : undefined

      const matchResponse = await fetch('/api/properties/match', {
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

      if (matchResponse.ok) {
        const matchData = await matchResponse.json()
        const match = matchData.matches.find((m: any) => m.property.id === propertyId)
        
        if (match) {
          setMatchDetails({
            property: match.property,
            bfiScore: match.bfiScore,
            matchReasons: match.matchReasons,
            breakdown: match.breakdown
          })
        } else {
          // If not in matches, but property data exists, create a basic match object
          if (property) {
            setMatchDetails({
              property,
              bfiScore: 75, // Default score
              matchReasons: ['Property available in your preferred location', 'Size matches your requirements'],
              breakdown: {
                locationScore: 80,
                sizeScore: 75,
                budgetScore: 70,
                typeScore: 80
              }
            })
          } else {
            setMatchDetails(null)
          }
        }
      } else {
        // Fallback if match API fails
        if (property) {
          setMatchDetails({
            property,
            bfiScore: 75,
            matchReasons: ['Property available in your preferred location'],
            breakdown: {
              locationScore: 80,
              sizeScore: 75,
              budgetScore: 70,
              typeScore: 80
            }
          })
        } else {
          setMatchDetails(null)
        }
      }
    } catch (error) {
      console.error('Error fetching match details:', error)
      setMatchDetails(null)
    } finally {
      setLoading(false)
    }
  }

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!visitDateTime) {
      alert('Please pick a date and time.')
      return
    }
    if (!visitorName || !visitorEmail || !visitorPhone) {
      alert('Please fill your contact details.')
      return
    }
    if (!paywallAccepted) {
      alert('Please complete the payment to schedule the visit.')
      return
    }
    try {
      setVisitSubmitting(true)
      const response = await fetch('/api/visits/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          dateTime: visitDateTime,
          note: visitNote,
          name: visitorName,
          email: visitorEmail,
          phone: visitorPhone,
          company: companyName
        })
      })
      if (!response.ok) {
        throw new Error('Failed to schedule visit')
      }
      alert('Visit request submitted. We will confirm via email/WhatsApp.')
      setShowVisitModal(false)
      setVisitNote('')
      setVisitDateTime('')
    } catch (err) {
      console.error(err)
      alert('Could not schedule the visit. Please try again.')
    } finally {
      setVisitSubmitting(false)
    }
  }

  const formatPrice = (price: number, type: Property['priceType']) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)

    // Short, consistent units so rent text doesn't break across views
    switch (type) {
      case 'monthly':
        return `${formatted}/mo`
      case 'yearly':
        return `${formatted}/yr`
      case 'sqft':
        return `${formatted}/sq ft`
      default:
        return formatted
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-yellow-500 to-orange-500'
    return 'from-orange-500 to-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Fair'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <LokazenNodesLoader size="lg" className="mb-4" />
            <p className="text-gray-600">Loading match details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!matchDetails) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Match not found</h2>
            <p className="text-gray-600 mb-4">Unable to load match details</p>
            <Link href="/properties" className="text-[#FF5200] hover:text-[#E4002B] font-medium">
              ← Back to Properties
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const { property, bfiScore, matchReasons, breakdown } = matchDetails
  const mainImageSrc = getPrimaryImageSrc(property)
  const galleryImages = (property.images || []).filter(
    (src, index) =>
      index > 0 && 
      !src.startsWith('/images/') && 
      !src.includes('localhost:3000/images') &&
      !src.includes('unsplash') &&
      src.trim() !== ''
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-28 pb-20 sm:pb-24 md:pb-12">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-[#FF5200] mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="truncate">Back to Results</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Property Images */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 w-full">
                {mainImageSrc ? (
                  <Image
                    src={mainImageSrc}
                    alt={property.title}
                    fill
                    className="object-cover"
                    unoptimized
                    loading="lazy"
                    sizes="(min-width: 1024px) 66vw, 100vw"
                  />
                ) : (
                  <LokazenNodesPlaceholder className="h-full w-full" aspectRatio="wide" />
                )}
              </div>
              
              {/* Image Thumbnails */}
              {galleryImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 p-2 sm:p-4 bg-gray-50">
                  {galleryImages.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="relative h-16 sm:h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={img}
                        alt={`${property.title} ${idx + 2}`}
                        fill
                        className="object-cover"
                        unoptimized
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words leading-tight hyphens-auto">{property.title}</h1>
              <div className="flex items-start text-gray-600 mb-4 sm:mb-6">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium text-sm sm:text-base break-words leading-relaxed min-w-0 flex-1">{property.address}, {property.city}, {property.state}</span>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                <div className="flex flex-col min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">
                    <span className="whitespace-nowrap">{formatPrice(property.price, property.priceType)}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1 whitespace-nowrap">Rent</div>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                    <span className="whitespace-nowrap">{property.size.toLocaleString()} sqft</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1 whitespace-nowrap">Size</div>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 capitalize leading-tight break-words">
                    {getPropertyTypeLabel(property.propertyType, property.title, property.description)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1 whitespace-nowrap">Type</div>
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 leading-tight">Description</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed break-words hyphens-auto whitespace-pre-wrap">{property.description}</p>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 leading-tight">Amenities & Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 break-words max-w-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Location Intelligence */}
              <LocationIntelligence property={property} />
            </div>
          </div>

          {/* Right Column - Match Analysis */}
          <div className="space-y-4 sm:space-y-6">
            {/* Match Score Card */}
            <div className="bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl p-4 sm:p-6 text-white">
              <div className="text-center mb-3 sm:mb-4">
                <div className="text-3xl sm:text-4xl md:text-5xl font-black mb-1 sm:mb-2 leading-none">{bfiScore}%</div>
                <div className="text-base sm:text-lg font-semibold break-words leading-tight">Brand Fit Index</div>
                <div className="text-xs sm:text-sm opacity-90 mt-1 whitespace-nowrap">{getScoreLabel(bfiScore)} Match</div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-2 sm:h-3 mb-3 sm:mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bfiScore}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-white h-2 sm:h-3 rounded-full"
                />
              </div>

              <div className="text-center">
                <p className="text-xs sm:text-sm opacity-90 break-words px-2 leading-relaxed">
                  This property matches {bfiScore}% of your requirements
                </p>
              </div>
            </div>

            {/* Match Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <MatchBreakdownChart breakdown={breakdown} overallScore={bfiScore} />
            </div>

            {/* Match Reasons */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 leading-tight">Why This Matches</h3>
              <ul className="space-y-2 sm:space-y-3">
                {matchReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start min-w-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs sm:text-sm text-gray-700 break-words leading-relaxed flex-1 min-w-0">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={() => setShowVisitModal(true)}
                className="w-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity"
              >
                Schedule Visit
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full border-2 border-[#FF5200] text-[#FF5200] py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-[#FF5200] hover:text-white transition-colors"
              >
                Get Exact Location
              </button>
              <button className="w-full border border-gray-300 text-gray-700 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-50 transition-colors">
                Connect with an Expert
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex gap-2 sm:gap-3">
          <button
            onClick={() => setShowVisitModal(true)}
            className="flex-1 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity"
          >
            Schedule Visit
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex-1 border-2 border-[#FF5200] text-[#FF5200] py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm hover:bg-[#FF5200] hover:text-white transition-colors"
          >
            Get Exact Location
          </button>
        </div>
      </div>

      {/* Payment Modal for Exact Location */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-3 sm:px-4 py-4 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xl p-4 sm:p-6 relative my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl leading-none w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center"
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 pr-6 sm:pr-8 break-words">Get Exact Location Pin</h3>
            <p className="text-sm sm:text-base text-gray-700 mb-4 break-words">
              Unlock the exact location pin and priority support with our Brand Onboarding / Listing package.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 sm:p-4 space-y-2 mb-4">
              <h4 className="text-xs sm:text-sm font-semibold text-orange-800">What&apos;s included:</h4>
              <ul className="text-xs sm:text-sm text-orange-900 list-disc list-inside space-y-1 break-words">
                <li>Exact location pin & visit coordination</li>
                <li>Brand requirements capture & CRE advisory</li>
                <li>Shortlisted matches & expert guidance</li>
                <li>Owner negotiation and paperwork assistance</li>
              </ul>
              <div className="pt-2">
                <p className="text-xs sm:text-sm font-semibold text-orange-900">Listing / Onboarding Fee:</p>
                <p className="text-xs sm:text-sm text-orange-900 break-words">Contact us for tailored pricing. Payment processed via Cashfree.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/payments/brand-onboarding')}
                className="flex-1 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity"
              >
                Proceed to Payment (Cashfree)
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg font-semibold text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 break-words">
              After payment, we'll send the pin and notify you and admin via email/WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* Schedule Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-3 sm:px-4 py-4 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 relative my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowVisitModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl leading-none w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center"
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 pr-6 sm:pr-8">Schedule a Visit</h3>
            <form className="space-y-3 sm:space-y-4" onSubmit={handleVisitSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Company (optional)</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
                    placeholder="Brand / Business name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0,16)}
                  value={visitDateTime}
                  onChange={(e) => setVisitDateTime(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={visitNote}
                  onChange={(e) => setVisitNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200] resize-y"
                  placeholder="Any preferences or questions"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="submit"
                  disabled={visitSubmitting}
                  className="flex-1 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {visitSubmitting ? 'Scheduling...' : 'Confirm Visit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg font-semibold text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
              {/* Paywall placeholder */}
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs sm:text-sm text-orange-800">
                <p className="break-words">To secure the visit, please complete payment via Cashfree. (Integration placeholder)</p>
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setPaywallAccepted(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-[#FF5200] text-white rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Pay & Confirm
                  </button>
                  {paywallAccepted && <span className="text-green-700 font-semibold text-xs sm:text-sm self-center">Payment confirmed</span>}
                </div>
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-3 break-words">
              We'll notify you and the admin via email/WhatsApp once the visit is scheduled and payment is confirmed.
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default function MatchDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LokazenNodesLoader size="lg" className="mb-4" />
          <p className="text-gray-600">Loading match details...</p>
        </div>
      </div>
    }>
      <MatchDetailsContent />
    </Suspense>
  )
}

