'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getUserIdForSession } from '@/lib/session-utils'
import { Property } from '@/types'
import { getPropertyTypeLabel } from '@/lib/property-type-mapper'
import { encodePropertyId } from '@/lib/property-slug'

// Lazy load LokazenNodesPlaceholder to avoid webpack issues
const LokazenNodesPlaceholder = lazy(() => import('@/components/LokazenNodesPlaceholder'))

interface OwnerProfileData {
  name?: string
  email?: string
  phone?: string
  companyName?: string | null
  properties: Array<Property & { status: 'pending' | 'approved' | 'rejected' }>
  propertiesByStatus: {
    approved: number
    pending: number
    rejected: number
  }
  totalProperties: number
}

function OwnerProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userIdFromQuery = searchParams.get('userId')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OwnerProfileData | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

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
          response = await fetch(`/api/profile/owner/${userId}`)
        } else {
          response = await fetch(`/api/profile/owner?userId=${encodeURIComponent(userId)}`)
        }
        
        if (!response.ok) throw new Error('Failed to fetch')
        const profileData = await response.json()
        
        // Normalize data structure
        const normalizedData: OwnerProfileData = {
          name: profileData.name || profileData.profile?.name,
          email: profileData.email || profileData.profile?.email,
          phone: profileData.phone || profileData.profile?.phone,
          companyName: profileData.companyName || profileData.profile?.companyName,
          properties: profileData.properties || profileData.profile?.properties || [],
          propertiesByStatus: profileData.propertiesByStatus || profileData.statusCounts || {
            approved: 0,
            pending: 0,
            rejected: 0
          },
          totalProperties: profileData.totalProperties || profileData.total || 0
        }
        
        setData(normalizedData)
        if (normalizedData.properties?.length) {
          setSelectedPropertyId((prev) => prev || normalizedData.properties[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch owner profile:', error)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            🟢 Approved
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            🟡 Pending
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            🔴 Rejected
          </span>
        )
      default:
        return null
    }
  }

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return
    
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        // Refresh data
        const userId = getUserIdForSession()
        if (userId) {
          const res = await fetch(`/api/profile/owner?userId=${encodeURIComponent(userId)}`)
          const profileData = await res.json()
          setData(profileData)
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete property')
      }
    } catch (error) {
      console.error('Failed to delete property:', error)
      alert('Failed to delete property')
    }
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
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
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
            <div className="text-center">
              <div className="text-[11px] font-medium text-gray-500">Hello {data.name || 'Owner'}.</div>
              <div className="text-lg font-bold text-gray-900">Your Property Matches</div>
            </div>
            <Link
              href="/filter/owner"
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-[#FF5200] border border-[#FF5200] rounded-lg hover:bg-[#FF5200]/5 transition-colors"
            >
              + Add Property
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 pb-16">
        <p className="text-sm text-gray-600 mb-5">
          Manage your listed properties, track brand interest and keep your site details up to date.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: properties */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Your Properties</h2>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{data.propertiesByStatus.approved}</span>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">{data.propertiesByStatus.pending}</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">{data.propertiesByStatus.rejected}</span>
                </div>
              </div>

              {data.properties.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-600 mb-3">No properties uploaded yet</p>
                  <Link
                    href="/filter/owner"
                    className="inline-block px-4 py-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-shadow"
                  >
                    List Your First Property
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {data.properties.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPropertyId(p.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        selectedPropertyId === p.id
                          ? 'border-[#FF5200] bg-[#FF5200]/5 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="font-semibold text-sm text-gray-900 line-clamp-1">{p.title}</div>
                        <div className="flex-shrink-0">{getStatusBadge(p.status)}</div>
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-1">{p.address}, {p.city}</div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                        <span>{p.size.toLocaleString()} sq ft</span>
                        <span>•</span>
                        <span>{formatPrice(Number(p.price), p.priceType)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Need Help?</h3>
              <p className="text-xs text-gray-600 mb-3">
                Connect with our team for quick assistance with your properties.
              </p>
              <a
                href={`mailto:support@lokazen.in?subject=${encodeURIComponent('Support request from owner dashboard')}&body=${encodeURIComponent(
                  `Hi Lokazen Team,\n\nI'm ${data.name || 'a property owner'}${data.phone ? `, phone: ${data.phone}` : ''}.\n\nI need help with my property listings.`
                )}`}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#FF5200] to-[#E4002B] px-4 py-2.5 text-sm font-semibold text-white hover:from-[#E4002B] hover:to-[#FF5200] transition-colors"
              >
                Contact support
              </a>
            </div>
          </div>

          {/* Right: selected property details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {(() => {
                const property = data.properties.find((p) => p.id === selectedPropertyId) ?? data.properties[0]
                if (!property) return (
                  <div className="p-10 text-center text-sm text-gray-600">Select a property to view details.</div>
                )

                return (
                  <>
                    <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-1">{property.title}</h2>
                        <p className="text-sm text-gray-600 line-clamp-1">{property.address}, {property.city}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                          <span>{property.size.toLocaleString()} sq ft</span>
                          <span>•</span>
                          <span className="font-semibold text-[#FF5200]">{formatPrice(Number(property.price), property.priceType)}</span>
                          <span>•</span>
                          <span>{getPropertyTypeLabel(property.propertyType, property.title, property.description || '')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {(property.status === 'pending' || property.status === 'rejected') && (
                          <Link
                            href={`/properties/${encodePropertyId(property.id)}/edit`}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                          >
                            Edit Property
                          </Link>
                        )}
                        {property.status === 'pending' && (
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        )}
                        <Link
                          href={`/properties/${encodePropertyId(property.id)}`}
                          className="px-3 py-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg text-xs sm:text-sm font-medium hover:shadow-lg transition-shadow"
                        >
                          View
                        </Link>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Property Image</div>
                        <div className="relative w-full h-44 rounded-lg overflow-hidden bg-gray-100">
                          {property.images && Array.isArray(property.images) && property.images.length > 0 ? (
                            <Image
                              src={property.images[0] as string}
                              alt={property.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <Suspense fallback={<div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400">Loading...</div>}>
                              <LokazenNodesPlaceholder className="h-full w-full" aspectRatio="wide" />
                            </Suspense>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Status</div>
                        <div className="flex items-center gap-2 mb-3">
                          {getStatusBadge(property.status)}
                          <span className="text-xs text-gray-500">Total properties: {data.totalProperties}</span>
                        </div>
                        <div className="text-xs text-gray-600 leading-relaxed">
                          {property.status === 'approved'
                            ? 'Your property is live and visible to brands.'
                            : property.status === 'rejected'
                            ? 'This property listing was rejected. Please contact support for more information.'
                            : 'Our team will contact you within 24-48 hours.'}
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OwnerProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>}>
      <OwnerProfileContent />
    </Suspense>
  )
}
