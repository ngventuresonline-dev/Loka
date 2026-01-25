'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'
import { formatISTTimestamp } from '@/lib/utils'

interface Property {
  id: string
  title: string
  address: string
  city: string
  size: number
  price: number
  priceType: string
  status?: 'pending' | 'approved' | 'rejected'
  availability: boolean
  createdAt: string
  owner: {
    name: string
    email: string
  }
}

export default function PendingPropertiesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id && user?.email) {
      fetchPendingProperties()
    }
  }, [user])

  const fetchPendingProperties = async () => {
    // Always try to fetch, even if user data is incomplete
    const userEmail = user?.email || 'admin@ngventures.com'
    const userId = user?.id || ''

    try {
      setLoading(true)
      // Fetch ONLY pending properties from API
      const url = `/api/admin/properties?limit=1000&page=1&status=pending&userId=${userId}&userEmail=${encodeURIComponent(userEmail)}`
      console.log('[Pending Properties] 🔍 Fetching from:', url)
      
      const response = await fetch(url)
      
      // Get response as text first to handle both JSON and non-JSON
      let responseText = ''
      try {
        responseText = await response.text()
      } catch (textError) {
        console.error('[Pending Properties] ❌ Failed to read response text:', textError)
        responseText = ''
      }
      
      console.log('[Pending Properties] 📡 Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        textLength: responseText.length,
        textPreview: responseText.substring(0, 100)
      })
      
      // Double-check: if status is 200-299, treat as OK even if response.ok is false
      const isSuccess = response.ok || (response.status >= 200 && response.status < 300)
      
      if (isSuccess) {
        try {
          const data = JSON.parse(responseText)
          console.log('[Pending Properties] ✅ API Response:', {
            success: data.success,
            propertiesCount: data.properties?.length || 0,
            total: data.total
          })
          
          // Filter to only show properties that are pending approval.
          // For legacy rows without status, treat availability=false as pending.
          const pending = (data.properties || []).filter((p: any) => {
            const status = p.status || (p.availability ? 'approved' : 'pending')
            return status === 'pending'
          })
          console.log('[Pending Properties] ✅ Found', pending.length, 'pending properties')
          setProperties(pending)
        } catch (parseError: any) {
          console.error('[Pending Properties] ❌ Failed to parse response:', {
            error: parseError?.message,
            stack: parseError?.stack,
            responseText: responseText.substring(0, 500),
            responseLength: responseText.length
          })
          setProperties([])
        }
      } else {
        // NOT a success response - handle as error
        console.error('[Pending Properties] ❌ Non-success response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          responseLength: responseText.length
        })
        // Parse error response - handle empty or invalid JSON
        // ALWAYS ensure errorData has meaningful content
        let errorData: any = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          statusText: response.statusText,
          responseLength: responseText?.length || 0
        }
        
        // Log raw response FIRST for debugging
        console.error('[Pending Properties] ❌ Raw error response:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          responseLength: responseText?.length || 0,
          responsePreview: responseText?.substring(0, 200) || '(empty)',
          url
        })
        
        if (responseText && responseText.trim()) {
          try {
            const parsed = JSON.parse(responseText)
            
            // Check if parsed result is empty object
            const hasContent = Object.keys(parsed).length > 0
            
            if (!hasContent) {
              // Parsed to empty object - use raw text instead
              errorData = {
                message: `Server returned empty JSON object: ${response.status} ${response.statusText}`,
                status: response.status,
                statusText: response.statusText,
                rawResponse: responseText.substring(0, 500),
                responseLength: responseText.length,
                isEmptyObject: true
              }
            } else {
              // Merge parsed data but ensure we always have a message
              errorData = {
                ...parsed,
                message: parsed.error || parsed.message || `HTTP ${response.status}: ${response.statusText}`,
                status: response.status,
                statusText: response.statusText,
                responseLength: responseText.length,
                parsed: true
              }
            }
          } catch (parseErr: any) {
            // Not JSON - use raw text
            errorData = { 
              message: `Server returned non-JSON response: ${response.status} ${response.statusText}`,
              status: response.status,
              statusText: response.statusText,
              raw: responseText.substring(0, 500),
              parseError: parseErr?.message,
              responseLength: responseText.length
            }
          }
        } else {
          // Empty response body - this is the problem!
          errorData = {
            message: `Empty response body from server: ${response.status} ${response.statusText}`,
            status: response.status,
            statusText: response.statusText,
            responseLength: 0,
            isEmpty: true
          }
        }
        
        // FINAL SAFETY CHECK: NEVER log empty object
        if (!errorData || Object.keys(errorData).length === 0 || !errorData.message) {
          errorData = {
            message: `Unknown error: ${response.status} ${response.statusText}`,
            status: response.status,
            statusText: response.statusText,
            responseLength: responseText?.length || 0,
            wasEmpty: true
          }
        }
        
        // Always log with full details
        console.error('[Pending Properties] ❌ API error details:', JSON.stringify(errorData, null, 2))
        
        // If we got properties in error response, use them
        if (errorData.properties && Array.isArray(errorData.properties)) {
          console.log('[Pending Properties] ⚠️ Found properties in error response, using them')
          const pending = errorData.properties.filter((p: Property) => !p.availability)
          setProperties(pending)
          return // Don't try fallback if we got data
        }
        
        // Log the actual errorData structure to see what we have
        console.error('[Pending Properties] ❌ Error data structure:', {
          hasMessage: !!errorData.message,
          hasError: !!errorData.error,
          keys: Object.keys(errorData),
          errorDataString: JSON.stringify(errorData),
          errorDataType: typeof errorData
        })
        
        // For auth errors (401/403), try public API as fallback
        if (response.status === 401 || response.status === 403) {
          console.log('[Pending Properties] 🔄 Trying public API as fallback...')
          try {
            const publicResponse = await fetch('/api/properties?limit=1000')
            if (publicResponse.ok) {
              const publicData = await publicResponse.json()
              const props = publicData.properties || publicData.data?.properties || []
              const pending = props.filter((p: any) => !p.availability)
              console.log('[Pending Properties] ✅ Using public API fallback, found:', pending.length, 'pending')
              setProperties(pending.map((p: any) => ({
                id: p.id,
                title: p.title,
                address: p.address,
                city: p.city,
                owner: p.owner || { name: 'N/A', email: '' },
                price: Number(p.price) || 0,
                priceType: p.priceType || 'monthly',
                size: p.size || 0,
                availability: p.availability !== undefined ? p.availability : true,
                createdAt: p.createdAt
              })).filter((p: Property) => !p.availability))
            } else {
              console.error('[Pending Properties] ❌ Public API also failed:', publicResponse.status)
              setProperties([])
            }
          } catch (fallbackError: any) {
            console.error('[Pending Properties] ❌ Fallback API error:', fallbackError)
            setProperties([])
          }
        } else {
          // For other errors, set empty array
          setProperties([])
        }
      }
    } catch (error: any) {
      console.error('[Pending Properties] ❌ Network/fetch error:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      })
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (propertyId: string) => {
    if (!user?.id || !user?.email) {
      alert('You must be logged in to approve properties')
      router.push('/auth/login')
      return
    }

    if (!confirm('Are you sure you want to approve this property? It will become visible on the platform.')) {
      return
    }

    try {
      setProcessing(propertyId)
      // Include user email and ID in query params for authentication
      const url = `/api/admin/properties/${propertyId}/approve?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email)}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json().catch(() => ({}))
        console.log('[Pending Properties] ✅ Approval successful:', result)
        
        // Remove the approved property from the list immediately
        setProperties(prev => prev.filter(p => p.id !== propertyId))
        
        // Refresh the list to ensure we have the latest data
        setTimeout(() => {
          fetchPendingProperties()
        }, 500)
        
        alert('Property approved successfully! It will now appear in the "All Properties" section.')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Pending Properties] ❌ Approval failed:', errorData)
        alert(errorData.error || 'Failed to approve property')
      }
    } catch (error) {
      console.error('Error approving property:', error)
      alert('Failed to approve property. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (propertyId: string) => {
    if (!user?.id || !user?.email) {
      alert('You must be logged in to reject properties')
      router.push('/auth/login')
      return
    }

    if (!confirm('Are you sure you want to reject this property? The owner will be notified.')) {
      return
    }

    try {
      setProcessing(propertyId)
      // Include user email and ID in query params for authentication
      const url = `/api/admin/properties/${propertyId}/reject?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email)}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        // Refresh the entire list to get updated data
        fetchPendingProperties()
        alert('Property rejected. Owner will be notified.')
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || 'Failed to reject property')
      }
    } catch (error) {
      console.error('Error rejecting property:', error)
      alert('Failed to reject property. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pending Approvals</h1>
          <p className="text-gray-400">Review and approve property listings</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">No pending approvals</p>
            <p className="text-gray-500 text-sm">All properties have been reviewed.</p>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Property</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Location</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Owner</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Size</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Price</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Submitted</th>
                  <th className="px-6 py-4 text-right text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr
                    key={property.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-white font-medium">{property.title}</td>
                    <td className="px-6 py-4 text-gray-300">{property.city}</td>
                    <td className="px-6 py-4 text-gray-300">
                      <div>
                        <div className="font-medium">{property.owner.name}</div>
                        <div className="text-xs text-gray-500">{property.owner.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{property.size.toLocaleString()} sqft</td>
                    <td className="px-6 py-4 text-white">
                      ₹{property.price.toLocaleString()}/{property.priceType === 'monthly' ? 'mo' : 'yr'}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {formatISTTimestamp(property.createdAt, { format: 'dd MMM yyyy' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(property.id)}
                          disabled={processing === property.id}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                          {processing === property.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(property.id)}
                          disabled={processing === property.id}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                          {processing === property.id ? 'Processing...' : 'Reject'}
                        </button>
                        <button
                          onClick={() => router.push(`/admin/properties/${property.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

