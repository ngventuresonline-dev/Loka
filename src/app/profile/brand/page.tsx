'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getUserIdForSession } from '@/lib/session-utils'
import { Property } from '@/types'
import LokazenNodesPlaceholder from '@/components/LokazenNodesPlaceholder'
import { getPropertyTypeLabel } from '@/lib/property-type-mapper'
import WhatsAppButton from '@/components/WhatsAppButton'

interface BrandProfileData {
  name?: string
  email?: string
  phone?: string
  companyName?: string | null
  industry?: string | null
  recentViews: Array<{
    id: string
    propertyId: string
    viewedAt: string
    property: Property & { status?: string }
  }>
  savedProperties: Array<{
    id: string
    property: Property
    notes?: string
    savedAt: string
  }>
  inquiries: Array<{
    id: string
    property: {
      id: string
      title: string
      address: string
      city: string
      state: string
      images?: string[]
    }
    owner?: {
      id: string
      name: string
      email: string
    }
    message: string
    status: string
    createdAt: string
  }>
  searchFilters: any
}

function BrandProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userIdFromQuery = searchParams.get('userId')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<BrandProfileData | null>(null)
  const [activeTab, setActiveTab] = useState<'views' | 'saved' | 'inquiries' | 'filters'>('views')

  useEffect(() => {
    const fetchData = async () => {
      // Use userId from query param if available, otherwise fall back to session
      const userId = userIdFromQuery || getUserIdForSession()
      
      if (!userId) {
        router.push('/profile')
        return
      }

      try {
        // If userId from query, fetch from lookup endpoint, otherwise use existing endpoint
        let response
        if (userIdFromQuery) {
          response = await fetch(`/api/profile/brand/${userId}`)
        } else {
          response = await fetch(`/api/profile/brand?userId=${encodeURIComponent(userId)}`)
        }
        
        if (!response.ok) throw new Error('Failed to fetch')
        const profileData = await response.json()
        
        // Normalize data structure
        const normalizedData: BrandProfileData = {
          name: profileData.name || profileData.profile?.name,
          email: profileData.email || profileData.profile?.email,
          phone: profileData.phone || profileData.profile?.phone,
          companyName: profileData.companyName || profileData.profile?.companyName,
          industry: profileData.industry || profileData.profile?.industry,
          recentViews: profileData.recentViews || profileData.profile?.recentViews || [],
          savedProperties: profileData.savedProperties || profileData.profile?.savedProperties || [],
          inquiries: profileData.inquiries || profileData.profile?.inquiries || [],
          searchFilters: profileData.searchFilters || profileData.profile?.searchFilters || null
        }
        
        setData(normalizedData)
      } catch (error) {
        console.error('Failed to fetch brand profile:', error)
        router.push('/profile')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, userIdFromQuery])

  const formatPrice = (price: number, type: Property['priceType']) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No profile data found</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-bold text-gray-900">Brand Profile</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      {data.name && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome, {data.name}!</h2>
            {data.companyName && (
              <p className="text-gray-600">{data.companyName}</p>
            )}
            {data.industry && (
              <p className="text-sm text-gray-500 mt-1">Industry: {data.industry}</p>
            )}
            {data.phone && (
              <p className="text-sm text-gray-500 mt-1">Phone: {data.phone}</p>
            )}
          </div>
          
          {/* WhatsApp Connect */}
          {data.phone && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Connect with our team via WhatsApp for quick assistance finding the perfect space.
              </p>
              <WhatsAppButton
                phone="919876543210"
                message={`Hi Lokazen Team,\n\nI'm ${data.name || 'a brand'}${data.companyName ? ` from ${data.companyName}` : ''}, phone: ${data.phone}.\n\nLooking for commercial space${data.industry ? ` in ${data.industry} industry` : ''}.`}
              />
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('views')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'views'
                  ? 'border-[#FF5200] text-[#FF5200]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Recent Views ({data.recentViews.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'saved'
                  ? 'border-[#FF5200] text-[#FF5200]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Saved ({data.savedProperties.length})
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'inquiries'
                  ? 'border-[#FF5200] text-[#FF5200]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Inquiries ({data.inquiries.length})
            </button>
            <button
              onClick={() => setActiveTab('filters')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'filters'
                  ? 'border-[#FF5200] text-[#FF5200]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'views' && (
          <div className="space-y-4">
            {data.recentViews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No recent views</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.recentViews.map((view) => (
                  <Link
                    key={view.id}
                    href={`/properties/${view.propertyId}`}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-200"
                  >
                    <div className="relative h-48 bg-gray-100">
                      {view.property.images && view.property.images.length > 0 ? (
                        <Image
                          src={view.property.images[0]}
                          alt={view.property.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <LokazenNodesPlaceholder className="h-full w-full" aspectRatio="wide" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{view.property.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{view.property.address}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-[#FF5200]">
                          {formatPrice(view.property.price, view.property.priceType)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Viewed {formatDate(view.viewedAt)}
                        </span>
                      </div>
                      <button className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-900 transition-colors">
                        View Again
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-4">
            {data.savedProperties.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No saved properties</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.savedProperties.map((saved) => (
                  <div
                    key={saved.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-200"
                  >
                    <Link href={`/properties/${saved.property.id}`}>
                      <div className="relative h-48 bg-gray-100">
                        {saved.property.images && saved.property.images.length > 0 ? (
                          <Image
                            src={saved.property.images[0]}
                            alt={saved.property.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <LokazenNodesPlaceholder className="h-full w-full" aspectRatio="wide" />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{saved.property.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{saved.property.address}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-[#FF5200]">
                            {formatPrice(saved.property.price, saved.property.priceType)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Saved {formatDate(saved.savedAt)}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="px-4 pb-4">
                      <button
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const sessionId = getUserIdForSession()
                          if (!sessionId) return

                          try {
                            const response = await fetch(`/api/properties/${saved.property.id}/save?userId=${encodeURIComponent(sessionId)}`, {
                              method: 'DELETE'
                            })
                            if (response.ok) {
                              // Refresh data
                              const res = await fetch(`/api/profile/brand?userId=${encodeURIComponent(sessionId)}`)
                              const profileData = await res.json()
                              setData(profileData)
                            }
                          } catch (error) {
                            console.error('Failed to unsave property:', error)
                          }
                        }}
                        className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        Unsave
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {data.inquiries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No inquiries yet</div>
            ) : (
              <div className="space-y-4">
                {data.inquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                  >
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {inquiry.property.images && inquiry.property.images.length > 0 ? (
                          <Image
                            src={inquiry.property.images[0]}
                            alt={inquiry.property.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <LokazenNodesPlaceholder className="h-full w-full" aspectRatio="square" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{inquiry.property.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{inquiry.property.address}</p>
                        <p className="text-sm text-gray-700 mb-2">{inquiry.message}</p>
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            inquiry.status === 'responded'
                              ? 'bg-green-100 text-green-700'
                              : inquiry.status === 'closed'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {inquiry.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(inquiry.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            {data.searchFilters ? (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(data.searchFilters, null, 2)}
              </pre>
            ) : (
              <div className="text-center py-12 text-gray-500">No saved filters</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BrandProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>}>
      <BrandProfileContent />
    </Suspense>
  )
}
