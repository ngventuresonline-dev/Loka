'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'
import LokazenNodesLoader from '@/components/LokazenNodesLoader'

interface Property {
  id: string
  title: string
  address: string
  city: string
  price: number
  priceType: string
  size: number
  status: 'pending' | 'approved' | 'rejected'
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
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Column filters
  const [filters, setFilters] = useState({
    owner: '',
    priceMin: '',
    priceMax: '',
    sizeMin: '',
    sizeMax: '',
    status: '',
    availability: '',
    featured: ''
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    applyFilters(properties)
  }, [filters, searchTerm, properties])

  const fetchProperties = async () => {
    const userEmail = user?.email || 'admin@ngventures.com'
    
    try {
      setLoading(true)
      // Optimize: Fetch with pagination and limit to reduce load time
      const url = `/api/admin/properties?userEmail=${encodeURIComponent(userEmail)}&status=approved&limit=50&page=1`
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        let allProps: Property[] = data.properties || []

        // API already filters by status=approved, availability=true, or isFeatured=true
        // Normalize status: if status is null, infer from availability
        allProps = allProps.map((p: any) => ({
          ...p,
          status: p.status || (p.availability ? 'approved' : 'pending')
        })).filter((p: Property) =>
          // Include properties that are approved, available, or featured
          p.status === 'approved' || 
          p.availability === true || 
          p.isFeatured === true
        )

        setProperties(allProps)
        applyFilters(allProps)
      } else {
        // Try to get error details from response
        let errorMessage = `Failed to fetch properties: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
          console.error('Failed to fetch properties:', {
            status: response.status,
            error: errorData.error,
            details: errorData.details
          })
        } catch (parseError) {
          console.error('Failed to fetch properties:', response.status, response.statusText)
        }
        setProperties([])
        // Optionally show error to user
        // alert(errorMessage)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (propertyId: string) => {
    if (!user?.id || !user?.email) {
      alert('You must be logged in to approve properties')
      return
    }

    try {
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
        fetchProperties() // Refresh list
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || 'Failed to approve property')
      }
    } catch (error) {
      console.error('Error approving property:', error)
      alert('Error approving property')
    }
  }

  const handleReject = async (propertyId: string) => {
    if (!user?.id || !user?.email) {
      alert('You must be logged in to reject properties')
      return
    }

    try {
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
        fetchProperties() // Refresh list
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || 'Failed to reject property')
      }
    } catch (error) {
      console.error('Error rejecting property:', error)
      alert('Error rejecting property')
    }
  }

  const handleDelete = async (propertyId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this property? This action cannot be undone.')
    if (!confirmDelete) return

    const userEmail = user?.email || 'admin@ngventures.com'

    try {
      const url = `/api/admin/properties?propertyId=${propertyId}&userEmail=${encodeURIComponent(userEmail)}`
      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchProperties()
        setSelectedProperties(new Set())
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to delete property' }))
        alert(error.error || 'Failed to delete property')
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      alert('Failed to delete property. Please try again.')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProperties(new Set(filteredProperties.map(p => p.id)))
    } else {
      setSelectedProperties(new Set())
    }
  }

  const handleSelectProperty = (propertyId: string, checked: boolean) => {
    const newSelected = new Set(selectedProperties)
    if (checked) {
      newSelected.add(propertyId)
    } else {
      newSelected.delete(propertyId)
    }
    setSelectedProperties(newSelected)
  }

  const applyFilters = (props: Property[]) => {
    let filtered = [...props]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter((p: Property) =>
        p.title.toLowerCase().includes(search) ||
        p.address.toLowerCase().includes(search) ||
        p.city.toLowerCase().includes(search) ||
        p.owner.name.toLowerCase().includes(search)
      )
    }

    // Filter by owner
    if (filters.owner) {
      filtered = filtered.filter(p =>
        p.owner.name.toLowerCase().includes(filters.owner.toLowerCase()) ||
        p.owner.email.toLowerCase().includes(filters.owner.toLowerCase())
      )
    }

    // Filter by price range
    if (filters.priceMin) {
      const minPrice = parseFloat(filters.priceMin)
      if (!isNaN(minPrice)) {
        filtered = filtered.filter(p => p.price >= minPrice)
      }
    }
    if (filters.priceMax) {
      const maxPrice = parseFloat(filters.priceMax)
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter(p => p.price <= maxPrice)
      }
    }

    // Filter by size range
    if (filters.sizeMin) {
      const minSize = parseInt(filters.sizeMin)
      if (!isNaN(minSize)) {
        filtered = filtered.filter(p => p.size >= minSize)
      }
    }
    if (filters.sizeMax) {
      const maxSize = parseInt(filters.sizeMax)
      if (!isNaN(maxSize)) {
        filtered = filtered.filter(p => p.size <= maxSize)
      }
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status)
    }

    // Filter by availability
    if (filters.availability !== '') {
      const isAvailable = filters.availability === 'true'
      filtered = filtered.filter(p => p.availability === isAvailable)
    }

    // Filter by featured
    if (filters.featured !== '') {
      const isFeatured = filters.featured === 'true'
      filtered = filtered.filter(p => p.isFeatured === isFeatured)
    }

    setFilteredProperties(filtered)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      owner: '',
      priceMin: '',
      priceMax: '',
      sizeMin: '',
      sizeMax: '',
      status: '',
      availability: '',
      featured: ''
    })
    setSearchTerm('')
  }

  const hasActiveFilters = () => {
    return Object.values(filters).some(v => v !== '') || searchTerm !== ''
  }

  const handleBulkDelete = async () => {
    if (selectedProperties.size === 0) {
      alert('Please select at least one property to delete.')
      return
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedProperties.size} property/properties? This action cannot be undone.`
    )
    if (!confirmDelete) return

    const userEmail = user?.email || 'admin@ngventures.com'
    const propertyIds = Array.from(selectedProperties)

    try {
      setIsDeleting(true)
      const url = `/api/admin/properties/bulk-delete?userEmail=${encodeURIComponent(userEmail)}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyIds }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully deleted ${result.deletedCount || propertyIds.length} property/properties.`)
        setSelectedProperties(new Set())
        await fetchProperties()
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to delete properties' }))
        alert(error.error || 'Failed to delete properties')
      }
    } catch (error) {
      console.error('Error deleting properties:', error)
      alert('Failed to delete properties. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Approved Properties</h1>
        </div>

        {/* Search and Bulk Actions */}
        <div className="mb-4 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Clear Filters
            </button>
          )}
          {selectedProperties.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedProperties.size})`}
            </button>
          )}
        </div>

        {/* Properties Table */}
        {loading ? (
          <div className="text-center py-12">
            <LokazenNodesLoader size="lg" className="mb-4" />
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No properties found</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No properties match the current filters</p>
            <button
              onClick={clearFilters}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={filteredProperties.length > 0 && selectedProperties.size === filteredProperties.length && filteredProperties.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="space-y-2">
                      <div>Owner</div>
                      <input
                        type="text"
                        placeholder="Filter owner..."
                        value={filters.owner}
                        onChange={(e) => handleFilterChange('owner', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="space-y-2">
                      <div>Price</div>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.priceMin}
                          onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.priceMax}
                          onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="space-y-2">
                      <div>Size</div>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.sizeMin}
                          onChange={(e) => handleFilterChange('sizeMin', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.sizeMax}
                          onChange={(e) => handleFilterChange('sizeMax', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="space-y-2">
                      <div>Status</div>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="space-y-2">
                      <div>Availability</div>
                      <select
                        value={filters.availability}
                        onChange={(e) => handleFilterChange('availability', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">All</option>
                        <option value="true">Available</option>
                        <option value="false">Unavailable</option>
                      </select>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="space-y-2">
                      <div>Featured</div>
                      <select
                        value={filters.featured}
                        onChange={(e) => handleFilterChange('featured', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">All</option>
                        <option value="true">Featured</option>
                        <option value="false">Not Featured</option>
                      </select>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProperties.map((property) => (
                  <tr key={property.id} className={selectedProperties.has(property.id) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProperties.has(property.id)}
                        onChange={(e) => handleSelectProperty(property.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{property.title}</div>
                      <div className="text-sm text-gray-500">{property.address}, {property.city}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{property.owner.name}</div>
                      <div className="text-sm text-gray-500">{property.owner.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{property.price.toLocaleString()}/{property.priceType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.size.toLocaleString()} sqft
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(property.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {property.availability ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Available
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Unavailable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {property.isFeatured ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Featured
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white z-10">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/admin/properties/${property.id}`)}
                          className="text-blue-600 hover:text-blue-900 whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="text-red-600 hover:text-red-900 whitespace-nowrap"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
