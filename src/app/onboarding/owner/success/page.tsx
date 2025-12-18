'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DynamicBackground from '@/components/DynamicBackground'

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

type SuccessPayload = {
  propertyId: string
  ownerId: string
  property: {
    propertyType?: string
    location?: string
    size?: number
    rent?: number
    deposit?: number
    amenities?: string[]
    description?: string
  }
  matches: BrandMatch[]
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

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {match.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            {match.businessType || 'Brand'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
            <span className="text-xs font-semibold text-gray-800">{label}</span>
          </div>
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white text-xs font-bold shadow-md">
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
              {match.locations.join(', ')}
            </span>
          </div>
        )}
      </div>

      {match.propertyTypes && match.propertyTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
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

export default function OwnerSuccessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SuccessPayload | null>(null)

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined'
        ? window.localStorage.getItem('ownerSuccessData')
        : null

      if (!raw) {
        router.replace('/onboarding/owner')
        return
      }

      const parsed = JSON.parse(raw) as SuccessPayload
      setData(parsed)
    } catch (error) {
      console.error('Failed to load owner success data:', error)
      router.replace('/onboarding/owner')
    } finally {
      setLoading(false)
    }
  }, [router])

  const matches = data?.matches?.slice(0, 5) || []

  return (
    <div className="min-h-screen relative">
      <DynamicBackground />
      <Navbar />

      <div className="relative z-10 pt-24 sm:pt-32 md:pt-36 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 border border-gray-200">
          {loading || !data ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 text-sm sm:text-base">
                Preparing your property summary...
              </p>
            </div>
          ) : (
            <>
              {/* Back */}
              <div className="mb-4 sm:mb-6">
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-[#FF5200] transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="font-medium">Back to Home</span>
                </button>
              </div>

              {/* Success header */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center text-white shadow-lg mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Property Listed Successfully!
                </h1>
                <p className="text-sm sm:text-base text-gray-600 max-w-xl">
                  Your property is under review. We&apos;ll notify you once it&apos;s approved by our team and visible to all brands.
                </p>
              </div>

              {/* Property summary */}
              <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 sm:px-5 sm:py-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-left">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                      Property Summary
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      {data.property.propertyType
                        ? `${data.property.propertyType} in ${data.property.location || 'Bangalore'}`
                        : data.property.location || 'Your property'}
                    </p>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    ID: <span className="font-mono text-gray-800">{data.propertyId}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm text-gray-700">
                  <div>
                    <span className="block text-[11px] text-gray-500 uppercase">Size</span>
                    <span className="font-semibold">
                      {data.property.size ? `${data.property.size.toLocaleString()} sq ft` : 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-500 uppercase">Monthly Rent</span>
                    <span className="font-semibold">
                      {data.property.rent
                        ? `₹${data.property.rent.toLocaleString('en-IN')}`
                        : 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-500 uppercase">Security Deposit</span>
                    <span className="font-semibold">
                      {data.property.deposit
                        ? `₹${data.property.deposit.toLocaleString('en-IN')}`
                        : 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-500 uppercase">Location</span>
                    <span className="font-semibold">
                      {data.property.location || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Potential matches */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Potential Brand Matches
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      These brands look like a strong fit for your property based on size, budget and location.
                    </p>
                  </div>
                  {matches.length > 0 && (
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-[11px] font-medium text-gray-700">
                      Top {matches.length} Matches
                    </span>
                  )}
                </div>

                {matches.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-600 text-center">
                    We&apos;re still learning your property preferences. As more brands join the platform,
                    we&apos;ll surface the best matches for you here.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {matches.map((match) => (
                      <BrandMatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}

                {/* CTAs */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/owner')}
                    className="w-full sm:flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white font-semibold text-base shadow hover:shadow-lg transition-all hover:scale-[1.02]"
                  >
                    View All Matches
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/filter/owner')}
                    className="w-full sm:flex-1 px-5 py-3 rounded-xl border-2 border-gray-300 text-gray-800 font-semibold text-base hover:border-[#FF5200] hover:text-[#FF5200] transition-all"
                  >
                    List Another Property
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


