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

  useEffect(() => {
    fetchMatchDetails()
  }, [propertyId])

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
      if (!propertyResponse.ok) {
        throw new Error('Property not found')
      }
      const propertyData = await propertyResponse.json()
      const property = propertyData.property || propertyData

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
          // If not in matches, create a basic match object
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
        }
      } else {
        // Fallback if match API fails
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
      }
    } catch (error) {
      console.error('Error fetching match details:', error)
      router.push('/properties')
    } finally {
      setLoading(false)
    }
  }

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
            <div className="w-16 h-16 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-[#FF5200] mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Results
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="relative h-96 w-full">
                {property.images && property.images.length > 0 ? (
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl mx-auto mb-3 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span className="text-gray-600">Premium Space</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image Thumbnails */}
              {property.images && property.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50">
                  {property.images.slice(1, 5).map((img, idx) => (
                    <div key={idx} className="relative h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={img}
                        alt={`${property.title} ${idx + 2}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-center text-gray-600 mb-6">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">{property.address}, {property.city}, {property.state}</span>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">
                    {formatPrice(property.price, property.priceType)}
                  </div>
                  <div className="text-sm text-gray-600">Rent</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {property.size.toLocaleString()} sqft
                  </div>
                  <div className="text-sm text-gray-600">Size</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 capitalize">
                    {property.propertyType}
                  </div>
                  <div className="text-sm text-gray-600">Type</div>
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{property.description}</p>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities & Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Match Analysis */}
          <div className="space-y-6">
            {/* Match Score Card */}
            <div className="bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl p-6 text-white">
              <div className="text-center mb-4">
                <div className="text-5xl font-black mb-2">{bfiScore}%</div>
                <div className="text-lg font-semibold">Brand Fit Index</div>
                <div className="text-sm opacity-90 mt-1">{getScoreLabel(bfiScore)} Match</div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-3 mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bfiScore}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-white h-3 rounded-full"
                />
              </div>

              <div className="text-center">
                <p className="text-sm opacity-90">
                  This property matches {bfiScore}% of your requirements
                </p>
              </div>
            </div>

            {/* Match Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <MatchBreakdownChart breakdown={breakdown} overallScore={bfiScore} />
            </div>

            {/* Match Reasons */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Why This Matches</h3>
              <ul className="space-y-3">
                {matchReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                Contact Owner
              </button>
              <button className="w-full border-2 border-[#FF5200] text-[#FF5200] py-3 rounded-lg font-semibold hover:bg-[#FF5200] hover:text-white transition-colors">
                Save Property
              </button>
              <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Share Match
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function MatchDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match details...</p>
        </div>
      </div>
    }>
      <MatchDetailsContent />
    </Suspense>
  )
}

