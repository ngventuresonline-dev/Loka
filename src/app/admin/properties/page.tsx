'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'

interface Property {
  id: string
  title: string
  address: string
  city: string
  price: number
  priceType: string
  size: number
  availability: boolean
  isFeatured: boolean
  createdAt: string
  owner: {
    name: string
    email: string
  }
}

export default function PropertiesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])

  useEffect(() => {
    if (user?.id && user?.email) {
      console.log('[Properties Page] User authenticated, fetching properties...', { userId: user.id, email: user.email })
      fetchProperties()
    } else {
      console.log('[Properties Page] Waiting for user authentication...', { user })
    }
  }, [user])

  const fetchProperties = async () => {
    if (!user?.id || !user?.email) {
      console.error('User not authenticated')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Fetch all properties with high limit
      const response = await fetch(`/api/admin/properties?limit=1000&page=1&userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Properties] API Response:', {
          propertiesCount: data.properties?.length || 0,
          total: data.total,
          page: data.page,
          hasProperties: !!data.properties,
          firstProperty: data.properties?.[0]
        })
        setProperties(data.properties || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching properties:', response.status, errorData)
        // Try public API as fallback
        try {
          const publicResponse = await fetch('/api/properties?limit=1000')
          if (publicResponse.ok) {
            const publicData = await publicResponse.json()
            const props = publicData.properties || publicData.data?.properties || []
            console.log('Using public API, fetched:', props.length, 'properties')
            setProperties(props.map((p: any) => ({
              id: p.id,
              title: p.title,
              address: p.address,
              city: p.city,
              owner: p.owner || { name: 'N/A', email: '' },
              price: Number(p.price) || 0,
              priceType: p.priceType || 'monthly',
              size: p.size || 0,
              availability: p.availability !== undefined ? p.availability : true,
              isFeatured: p.isFeatured || false,
              createdAt: p.createdAt
            })))
          }
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError)
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return
    
    if (!user?.id || !user?.email) {
      alert('You must be logged in to delete properties')
      return
    }

    try {
      const response = await fetch(`/api/admin/properties?propertyId=${id}&userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remove from local state immediately for better UX
        setProperties(properties.filter(p => p.id !== id))
        setSelectedProperties(selectedProperties.filter(pid => pid !== id))
        // Refresh to ensure consistency
        await fetchProperties()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Delete error:', response.status, errorData)
        alert(errorData.error || 'Failed to delete property')
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      alert('Failed to delete property. Please try again.')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProperties.length} properties?`)) return
    
    try {
      await Promise.all(
        selectedProperties.map(id =>
          fetch(`/api/admin/properties?propertyId=${id}`, { method: 'DELETE' })
        )
      )
      setSelectedProperties([])
      await fetchProperties()
    } catch (error) {
      console.error('Error bulk deleting:', error)
      alert('Failed to delete properties')
    }
  }

  const handleFeature = async (id: string, currentFeatured: boolean) => {
    if (!user?.id || !user?.email) {
      alert('You must be logged in to update properties')
      return
    }

    try {
      const response = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: id,
          isFeatured: !currentFeatured
        })
      })
      
      if (response.ok) {
        // Update local state immediately for better UX
        setProperties(properties.map(p => 
          p.id === id ? { ...p, isFeatured: !currentFeatured } : p
        ))
        // Refresh to ensure consistency
        await fetchProperties()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Feature error:', response.status, errorData)
        alert(errorData.error || 'Failed to update property')
      }
    } catch (error) {
      console.error('Error featuring property:', error)
      alert('Failed to update property. Please try again.')
    }
  }

  const filteredProperties = properties.filter(property =>
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Properties</h1>
            <p className="text-gray-400">Manage all property listings</p>
          </div>
          <button
            onClick={() => router.push('/admin/properties/new')}
            className="px-6 py-3 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors font-medium"
          >
            Add New Property
          </button>
        </div>

        {/* Search and Bulk Actions */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200]"
            />
            {selectedProperties.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Selected ({selectedProperties.length})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {searchTerm ? (
                <>
                  <p>No properties found matching &quot;{searchTerm}&quot;</p>
                  {properties.length > 0 && (
                    <p className="text-sm mt-2">(Filtered from {properties.length} total properties)</p>
                  )}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <p>No properties found</p>
                  {properties.length === 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm">Make sure you&apos;re logged in as admin</p>
                      <button
                        onClick={fetchProperties}
                        className="px-4 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors text-sm"
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProperties.length === filteredProperties.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProperties(filteredProperties.map(p => p.id))
                        } else {
                          setSelectedProperties([])
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Title</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Location</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Owner</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Price</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Size</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Featured</th>
                  <th className="px-6 py-4 text-right text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => (
                  <tr
                    key={property.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProperties.includes(property.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProperties([...selectedProperties, property.id])
                          } else {
                            setSelectedProperties(selectedProperties.filter(id => id !== property.id))
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{property.title}</td>
                    <td className="px-6 py-4 text-gray-300">{property.city}</td>
                    <td className="px-6 py-4 text-gray-300">{property.owner.name}</td>
                    <td className="px-6 py-4 text-white">
                      ₹{property.price.toLocaleString()}/{property.priceType === 'monthly' ? 'mo' : property.priceType === 'yearly' ? 'yr' : 'sqft'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{property.size.toLocaleString()} sq ft</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        property.availability ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {property.availability ? 'Available' : 'Occupied'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleFeature(property.id, property.isFeatured)}
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          property.isFeatured
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {property.isFeatured ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/properties/${property.id}`)}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

