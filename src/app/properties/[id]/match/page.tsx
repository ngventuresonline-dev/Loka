"use client"

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Property } from '@/types/workflow'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { logSessionEvent, getClientSessionUserId } from '@/lib/session-logger'
import LokazenNodesLoader from '@/components/LokazenNodesLoader'
import LokazenNodesPlaceholder from '@/components/LokazenNodesPlaceholder'
import { getPropertyTypeLabel } from '@/lib/property-type-mapper'
import { decodePropertySlug } from '@/lib/property-slug'
import { trackInquiry, trackScheduleViewing } from '@/lib/tracking'

// Heavy components are dynamically loaded to improve performance
const MatchBreakdownChart = dynamic(
  () => import('@/components/MatchBreakdownChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 sm:h-32 flex items-center justify-center text-xs sm:text-sm text-gray-500">
        Loading match breakdown...
      </div>
    ),
  }
)

const LocationIntelligence = dynamic(
  () => import('@/components/LocationIntelligence'),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 sm:h-32 flex items-center justify-center text-xs sm:text-sm text-gray-500">
        Loading location intelligence...
      </div>
    ),
  }
)

const SchedulePicker = dynamic(
  () => import('@/components/SchedulePicker'),
  { ssr: false }
)

const LOADING_PHRASES = [
  'Mapping your perfect location fit...',
  'Scoring budget, size, and footfall signals...',
  'Curating spaces brands actually want to visit...',
  'Running brand–property compatibility checks...',
  'Finalizing your tailored match shortlist...'
]

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
  const propertyId = decodePropertySlug(params.id as string)
  const [loading, setLoading] = useState(true)
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'location'>('overview')
  const [showExpertModal, setShowExpertModal] = useState(false)
  const [expertBrandName, setExpertBrandName] = useState('')
  const [expertEmail, setExpertEmail] = useState('')
  const [expertPhone, setExpertPhone] = useState('')
  const [expertDateTime, setExpertDateTime] = useState('')
  const [expertNotes, setExpertNotes] = useState('')
  const [expertSubmitting, setExpertSubmitting] = useState(false)
  const [expertFeeAcknowledged, setExpertFeeAcknowledged] = useState(false)
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    // Prefill expert contact details from brand onboarding/filter data in localStorage
    try {
      const detailsRaw = localStorage.getItem('brandOnboardingDetails')
      const submissionRaw = localStorage.getItem('brandOnboardingSubmission')
      const filterRaw = localStorage.getItem('brandFilterData')

      const details = detailsRaw ? JSON.parse(detailsRaw) : null
      const submission = submissionRaw ? JSON.parse(submissionRaw) : null
      const filter = filterRaw ? JSON.parse(filterRaw) : null

      const brandName =
        details?.companyName ||
        submission?.brandName ||
        details?.contactPerson ||
        filter?.businessType?.[0] ||
        ''
      const email = details?.email || ''
      const phone = details?.phone || ''

      if (brandName) setExpertBrandName(brandName)
      if (email) setExpertEmail(email)
      if (phone) setExpertPhone(phone)
    } catch (err) {
      console.error('Prefill expert form failed:', err)
    }
  }, [])

  useEffect(() => {
    // Check if we have cached match details for this property
    const cacheKey = `match_${propertyId}`
    const cached = sessionStorage.getItem(cacheKey)
    
    if (cached) {
      try {
        const cachedData = JSON.parse(cached)
        const cachedPropertyId = cachedData.data?.property?.id
        // Only use cache if it's for this property and less than 5 minutes old (avoids showing wrong property)
        const cacheAge = Date.now() - (cachedData.timestamp || 0)
        if (cacheAge < 5 * 60 * 1000 && cachedPropertyId === propertyId) {
          setMatchDetails(cachedData.data)
          setLoading(false)
          return
        }
      } catch (e) {
        // If cache is invalid, fetch fresh data
      }
    }
    
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

  useEffect(() => {
    if (!loading) return

    const interval = setInterval(() => {
      setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length)
    }, 1800)

    return () => clearInterval(interval)
  }, [loading])

  // Prefill notes using AI-ish template based on property and prefilled data
  useEffect(() => {
    if (showExpertModal && matchDetails && !expertNotes) {
      const propTitle = matchDetails.property?.title || 'this property'
      const city = matchDetails.property?.city ? ` in ${matchDetails.property.city}` : ''
      const defaultNotes = `I'm interested in ${propTitle}${city} and would like expert guidance on brand requirements, CRE services, and property evaluation.`
      setExpertNotes(defaultNotes)
    }
  }, [showExpertModal, matchDetails, expertNotes])

  const fetchMatchDetails = async () => {
    // Keep a reference property we can use even if something fails midway
    let fallbackProperty: Property | null = null

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

      // Calculate match score parameters
      const sizeRange = filters.sizeMin > 0 || filters.sizeMax < 100000
        ? { min: filters.sizeMin, max: filters.sizeMax }
        : undefined

      const budgetRange = filters.budgetMin > 0 || filters.budgetMax < 10000000
        ? { min: filters.budgetMin, max: filters.budgetMax }
        : undefined

      // PARALLELIZE API calls for faster loading with timeout
      // Optimize: pass propertyId to match API so it only fetches that property
      const timeout = 8000 // 8 second timeout
      const fetchWithTimeout = (url: string, options?: RequestInit) => {
        return Promise.race([
          fetch(url, options),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ])
      }

      const [propertyResponse, matchResponse] = await Promise.allSettled([
        fetchWithTimeout(`/api/properties/${propertyId}`),
        fetchWithTimeout('/api/properties/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId, // Pass propertyId to optimize match API
            businessType: filters.businessType,
            sizeRange,
            locations: filters.locations,
            budgetRange,
            timeline: filters.timeline,
            propertyType: filters.propertyType
          })
        })
      ])

      // Process responses from Promise.allSettled
      let property: any | null = null
      let matchPayload: any = null

      // Handle property response
      if (propertyResponse.status === 'fulfilled' && propertyResponse.value.ok) {
        const propertyData = await propertyResponse.value.json()
        property = propertyData.property || propertyData
      } else if (propertyResponse.status === 'fulfilled' && !propertyResponse.value.ok) {
        // Property fetch failed, use fallback
      }

      // Handle match response
      if (matchResponse.status === 'fulfilled' && matchResponse.value.ok) {
        matchPayload = await matchResponse.value.json()
      }

      // If property not loaded, create fallback
      if (!property) {
        property = {
          id: propertyId,
          title: 'Property',
          description: 'Details coming soon',
          address: '',
          city: filters.locations[0] || '',
          state: '',
          zipCode: '',
          price: filters.budgetMax || 0,
          priceType: 'monthly',
          size: filters.sizeMax || 0,
          propertyType: (filters.propertyType as Property['propertyType']) || 'other',
          amenities: [],
          ownerId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          isAvailable: true,
          images: [],
        }
      }

      // Store for use in catch/fallbacks
      fallbackProperty = property as Property

      if (matchPayload) {
        const matches = Array.isArray(matchPayload.matches) ? matchPayload.matches : []
        const match = matches.find((m: any) => m.property?.id === propertyId)
        
        if (match) {
          const matchData: MatchDetails = {
            property: match.property,
            bfiScore: match.bfiScore,
            matchReasons: match.matchReasons,
            breakdown: match.breakdown
          }
          setMatchDetails(matchData)
          // Cache the match data (ignore quota errors)
          try {
            const cacheKey = `match_${propertyId}`
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data: matchData,
              timestamp: Date.now()
            }))
          } catch (storageError: any) {
            if (storageError?.name === 'QuotaExceededError') {
              console.warn('[Match Page] sessionStorage quota exceeded, skipping cache')
            } else {
              console.warn('[Match Page] Failed to cache match data:', storageError)
            }
          }
        } else {
          // If not in matches, fall back to property data
          const matchData: MatchDetails = {
            property: fallbackProperty!,
            bfiScore: 75, // Default score
            matchReasons: ['Property available in your preferred location', 'Size matches your requirements'],
            breakdown: {
              locationScore: 80,
              sizeScore: 75,
              budgetScore: 70,
              typeScore: 80
            }
          }
          setMatchDetails(matchData)
          // Cache the match data (ignore quota errors)
          try {
            const cacheKey = `match_${propertyId}`
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data: matchData,
              timestamp: Date.now()
            }))
          } catch (storageError: any) {
            if (storageError?.name === 'QuotaExceededError') {
              console.warn('[Match Page] sessionStorage quota exceeded, skipping cache')
            } else {
              console.warn('[Match Page] Failed to cache match data:', storageError)
            }
          }
        }
      } else {
        // Fallback if match API fails or times out
        if (fallbackProperty) {
          const matchData: MatchDetails = {
            property: fallbackProperty,
            bfiScore: 75,
            matchReasons: ['Property available in your preferred location'],
            breakdown: {
              locationScore: 80,
              sizeScore: 75,
              budgetScore: 70,
              typeScore: 80
            }
          }
          setMatchDetails(matchData)
          // Cache the match data (ignore quota errors)
          try {
            const cacheKey = `match_${propertyId}`
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data: matchData,
              timestamp: Date.now()
            }))
          } catch (storageError: any) {
            if (storageError?.name === 'QuotaExceededError') {
              console.warn('[Match Page] sessionStorage quota exceeded, skipping cache')
            } else {
              console.warn('[Match Page] Failed to cache match data:', storageError)
            }
          }
        } else {
          setMatchDetails(null)
        }
      }
    } catch (error) {
      console.error('Error fetching match details:', error)

      // As a last resort, still try to render with a generic fallback property
      if (fallbackProperty) {
        const matchData: MatchDetails = {
          property: fallbackProperty,
          bfiScore: 70,
          matchReasons: ['Showing basic property details due to a temporary issue with match scoring'],
          breakdown: {
            locationScore: 70,
            sizeScore: 70,
            budgetScore: 70,
            typeScore: 70
          }
        }
        setMatchDetails(matchData)
      } else {
        setMatchDetails(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleExpertSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expertBrandName || !expertPhone || !expertDateTime || !expertNotes) {
      alert('Please fill in all required fields: Brand Name, Phone, Schedule Date & Time, and Notes.')
      return
    }
    if (!expertFeeAcknowledged) {
      alert('Please acknowledge that you may have to pay a brand onboarding/registration fee to avail our services.')
      return
    }
    try {
      setExpertSubmitting(true)
      
      // Use a timeout to ensure the API call doesn't hang (increased to 60s for database operations)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      const response = await fetch('/api/expert/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          brandName: expertBrandName,
          email: expertEmail || null,
          phone: expertPhone,
          scheduleDateTime: expertDateTime,
          notes: expertNotes
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to connect with expert' }))
        throw new Error(errorData.error || 'Failed to connect with expert')
      }
      
      // Track inquiry event
      if (propertyId) {
        trackInquiry(propertyId, property?.title || 'Property', 'expert_request')
      }
      
      // If schedule date/time is set, also track Schedule event
      if (expertDateTime) {
        trackScheduleViewing(propertyId || '', property?.title || 'Property')
      }
      
      // Immediately show success message - API call succeeded
      setShowExpertModal(false)
      setShowSuccessMessage(true)
      
      // Reset form
      setExpertNotes('')
      setExpertDateTime('')
      setExpertFeeAcknowledged(false)
      
    } catch (err: any) {
      console.error(err)
      if (err.name === 'AbortError') {
        alert('Request timed out. Please try again.')
      } else {
        alert(err.message || 'Could not submit your request. Please try again.')
      }
    } finally {
      setExpertSubmitting(false)
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
        <Navbar hideOnMobile={true} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <LokazenNodesLoader size="lg" className="mb-4" />
            <p className="text-gray-700 font-semibold tracking-tight">
              {LOADING_PHRASES[loadingPhraseIndex]}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!matchDetails) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar hideOnMobile={true} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Match not found</h2>
            <p className="text-gray-600 mb-4">Unable to load match details</p>
            <Link href="/" className="text-[#FF5200] hover:text-[#E4002B] font-medium">
              ← Back to Home
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
      <Navbar hideOnMobile={true} />
      
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

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-1">
            {/* Property Images */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 w-full">
                {mainImageSrc ? (
                  <Image
                    src={mainImageSrc}
                    alt={property.title}
                    fill
                    className="object-cover"
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
              <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                <div className="flex flex-col items-center min-w-0 text-center">
                  <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">
                    <span className="whitespace-nowrap">{formatPrice(property.price, property.priceType)}</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-600 mt-1 whitespace-nowrap">Rent</div>
                </div>
                {property.size && (
                  <div className="flex flex-col items-center min-w-0 text-center">
                    <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-tight">
                      <span className="whitespace-nowrap">{property.size.toLocaleString()} sqft</span>
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600 mt-1 whitespace-nowrap">Size</div>
                  </div>
                )}
                <div className="flex flex-col items-center min-w-0 text-center">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 capitalize leading-tight break-words">
                    {getPropertyTypeLabel(property.propertyType, property.title, property.description)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-600 mt-1 whitespace-nowrap">Type</div>
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
            </div>

          </div>

          {/* Brand Fit Index - Mobile: appears after Property Info, Desktop: in right column */}
          <div className="order-2 lg:hidden">
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
          </div>

          {/* Right Column - Match Analysis */}
          <div className="space-y-4 sm:space-y-6 order-3 lg:order-2">
            {/* Match Score Card - Desktop only */}
            <div className="hidden lg:block bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl p-4 sm:p-6 text-white">
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
                onClick={() => setShowExpertModal(true)}
                className="w-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
              >
                Connect with an Expert
              </button>
            </div>
          </div>
        </div>

        {/* Location Intelligence - Full width section after Brand Fit & breakdown */}
        <div className="mt-6 sm:mt-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <LocationIntelligence property={property} businessType={searchParams.get('businessType') || undefined} />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <button
            onClick={() => setShowExpertModal(true)}
            className="w-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity shadow-lg"
          >
            Connect with an Expert
          </button>
        </div>
      </div>

      {/* Connect with Expert Modal */}
      {showExpertModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-3 sm:px-4 py-4 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 relative my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowExpertModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl leading-none w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center"
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 pr-6 sm:pr-8">Connect with an Expert</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 break-words">
              Get personalized guidance on brand requirements, CRE services, property evaluation, and more from our real estate experts.
            </p>
            <form className="space-y-3 sm:space-y-4" onSubmit={handleExpertSubmit}>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={expertBrandName}
                  onChange={(e) => setExpertBrandName(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
                  required
                  placeholder="Enter your brand/business name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Email <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={expertEmail}
                    onChange={(e) => setExpertEmail(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={expertPhone}
                    onChange={(e) => setExpertPhone(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
                    required
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                  Schedule Date & Time <span className="text-red-500">*</span>
                </label>
                <SchedulePicker
                  value={expertDateTime}
                  onChange={setExpertDateTime}
                  minDate={new Date()}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                  Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={expertNotes}
                  onChange={(e) => setExpertNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200] resize-y"
                  placeholder="Tell us what you need help with..."
                  required
                />
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <input
                  type="checkbox"
                  id="feeAcknowledgment"
                  checked={expertFeeAcknowledged}
                  onChange={(e) => setExpertFeeAcknowledged(e.target.checked)}
                  className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-[#FF5200] border-gray-300 rounded focus:ring-[#FF5200] focus:ring-2 cursor-pointer flex-shrink-0"
                  required
                />
                <label htmlFor="feeAcknowledgment" className="text-xs sm:text-sm text-gray-700 cursor-pointer break-words">
                  You may have to pay brand onboarding/registration fee to avail our services. <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="submit"
                  disabled={expertSubmitting}
                  className="flex-1 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {expertSubmitting ? 'Submitting...' : 'Connect with Expert'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpertModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg font-semibold text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-3 break-words">
              Our expert will reach out to you within 24 hours via email or WhatsApp to discuss your requirements.
            </p>
          </div>
        </div>
      )}

      {/* Success Message Modal */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-3 sm:px-4 py-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 text-center relative">
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl leading-none w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center"
              aria-label="Close"
            >
              ×
            </button>
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Successfully Submitted!</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
              We will connect with you soon.
            </p>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="w-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-3 rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity shadow-lg"
            >
              Close
            </button>
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

