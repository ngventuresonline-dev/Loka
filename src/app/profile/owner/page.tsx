'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getUserIdForSession } from '@/lib/session-utils'
import { Property } from '@/types'
import { getPropertyTypeLabel } from '@/lib/property-type-mapper'
import { encodePropertyId } from '@/lib/property-slug'
import WhatsAppButton from '@/components/WhatsAppButton'

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
            <h1 className="text-xl font-bold text-gray-900">Owner Profile</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {data.name && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome, {data.name}!</h2>
            {data.companyName && (
              <p className="text-gray-600">{data.companyName}</p>
            )}
            {data.phone && (
              <p className="text-sm text-gray-500 mt-1">Phone: {data.phone}</p>
            )}
          </div>
        )}
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Status Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{data.propertiesByStatus.approved}</div>
              <div className="text-sm text-gray-600 mt-1">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{data.propertiesByStatus.pending}</div>
              <div className="text-sm text-gray-600 mt-1">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{data.propertiesByStatus.rejected}</div>
              <div className="text-sm text-gray-600 mt-1">Rejected</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{data.totalProperties}</div>
              <div className="text-sm text-gray-600 mt-1">Total Properties</div>
            </div>
          </div>
        </div>

        {/* WhatsApp Connect */}
        {data.phone && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Connect with our team via WhatsApp for quick assistance with your properties.
            </p>
            <WhatsAppButton
              phone="919876543210"
              message={`Hi Lokazen Team,\n\nI'm ${data.name || 'a property owner'}, phone: ${data.phone}.\n\nI need help with my property listings.`}
            />
          </div>
        )}

        {/* Properties List */}
        <div className="space-y-4">
          {data.properties.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
              <p className="text-gray-600 mb-4">No properties uploaded yet</p>
              <Link
                href="/filter/owner"
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
              >
                List Your First Property
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {data.properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-48 h-48 bg-gray-100 flex-shrink-0">
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
                          <LokazenNodesPlaceholder className="h-full w-full" aspectRatio="square" />
                        </Suspense>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{property.address}</p>
                        </div>
                        {getStatusBadge(property.status)}
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-lg font-bold text-[#FF5200]">
                          {formatPrice(Number(property.price), property.priceType)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {property.size.toLocaleString()} sq ft
                        </span>
                        <span className="text-sm text-gray-600">
                          {getPropertyTypeLabel(property.propertyType, property.title, property.description || '')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {(property.status === 'pending' || property.status === 'rejected') && (
                          <Link
                            href={`/properties/${encodePropertyId(property.id)}/edit`}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors"
                          >
                            Edit
                          </Link>
                        )}
                        {property.status === 'pending' && (
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        )}
                        <Link
                          href={`/properties/${encodePropertyId(property.id)}`}
                          className="px-4 py-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-shadow ml-auto"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
