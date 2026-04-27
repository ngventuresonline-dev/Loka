'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'
import LokazenNodesLoader from '@/components/LokazenNodesLoader'
import { encodePropertyId } from '@/lib/property-slug'

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
  hasExactMapLink?: boolean
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState<string | null>(null)

  // Server-side pagination (API supports page/limit + totalPages)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 50 // API caps limit to 50
  
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
    // Reset pagination when status filter changes
    setPage(1)
  }, [filters.status])

  useEffect(() => {
    if (user?.id) fetchProperties()
  }, [user?.id, filters.status, page])

  useEffect(() => {
    applyFilters(properties)
  }, [filters, searchTerm, properties])

  const fetchProperties = async () => {
    const userEmail = user?.email || 'admin@ngventures.com'
    const userId = user?.id || ''
    const statusParam = filters.status || 'all'
    
    try {
      setLoading(true)
      setLoadError(null)
      const statusQuery = statusParam === 'all' ? '' : `&status=${statusParam}`
      const url = `/api/admin/properties?userEmail=${encodeURIComponent(
        userEmail
      )}&userId=${userId}&limit=${limit}&page=${page}${statusQuery}`
      const response = await fetch(url, { credentials: 'include' })
      
      if (response.ok) {
        const data = await response.json()
        let allProps: Property[] = (data.properties || []).map((p: any) => ({
          ...p,
          status: p.status || (p.availability ? 'approved' : 'pending')
        }))

        setProperties(allProps)
        applyFilters(allProps)
        setTotalPages(data.totalPages ?? 1)
        setTotalCount(data.total ?? allProps.length ?? 0)
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
        setLoadError(errorMessage)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      setProperties([])
      setTotalPages(1)
      setTotalCount(0)
      setLoadError(error instanceof Error ? error.message : 'Failed to load properties')
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
      const url = `/api/admin/properties/${propertyId}/approve?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email)}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      
      if (response.ok) {
        // Optimistic update: flip the property status immediately
        setProperties(prev =>
          prev.map(p =>
            p.id === propertyId ? { ...p, status: 'approved' as const, availability: true } : p
          )
        )
        fetchProperties()
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

  // Build public property URL (encoded slug - no property number visible)
  const getPropertyShareUrl = (property: Property) => {
    const slug = encodePropertyId(property.id)
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/properties/${slug}/match`
  }

  const handleShareWhatsApp = (property: Property) => {
    const url = getPropertyShareUrl(property)
    const text = `Check out this property: ${property.title} - ${property.address}, ${property.city}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank', 'noopener,noreferrer')
    setShareMenuOpen(null)
  }

  const handleCopyLink = async (property: Property) => {
    const url = getPropertyShareUrl(property)
    try {
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    } catch {
      alert('Failed to copy link')
    }
    setShareMenuOpen(null)
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Properties</h1>
          <button
            onClick={() => router.push('/admin/properties/new')}
            className="px-4 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors font-medium"
          >
            + Add Property
          </button>
        </div>

        {/* Filter: All | Pending | Approved */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange('status', s === 'all' ? '' : s)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                (filters.status || 'all') === s
                  ? 'bg-[#FF5200] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold text-gray-900">{page}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalPages}</span> ·{' '}
              <span>{totalCount} total</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Properties Table */}
        {loading ? (
          <div className="text-center py-12">
            <LokazenNodesLoader size="lg" className="mb-4" />
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-12 bg-red-950/40 border border-red-800/50 rounded-lg px-4">
            <p className="text-red-200 font-medium">Could not load properties</p>
            <p className="text-red-300/90 text-sm mt-2">{loadError}</p>
            <p className="text-gray-400 text-sm mt-3">
              If you are logged in as admin, try refreshing the page. Otherwise sign in again.
            </p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No properties found</p>
            <p className="text-gray-500 text-sm mt-2">
              There are no listings in the database yet, or none match the current API filters.
            </p>
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
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5 flex-wrap">
                        {property.title}
                        {property.hasExactMapLink ? (
                          <span title="Has exact location pin" className="text-green-500 text-xs leading-none" aria-hidden>
                            📍
                          </span>
                        ) : (
                          <span title="No exact pin — add map link" className="text-amber-400 text-xs leading-none" aria-hidden>
                            ⚠️
                          </span>
                        )}
                      </div>
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
                      <div className="flex items-center space-x-2">
                        {property.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(property.id)}
                            className="text-green-600 hover:text-green-900 whitespace-nowrap font-semibold"
                          >
                            Approve
                          </button>
                        )}
                        {property.status === 'pending' && (
                          <button
                            onClick={() => handleReject(property.id)}
                            className="text-orange-500 hover:text-orange-700 whitespace-nowrap"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/admin/properties/${property.id}`)}
                          className="text-blue-600 hover:text-blue-900 whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <div className="relative inline-block">
                          <button
                            onClick={() => setShareMenuOpen(shareMenuOpen === property.id ? null : property.id)}
                            className="text-green-600 hover:text-green-800 whitespace-nowrap flex items-center gap-1"
                            title="Share property"
                          >
                            Share
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                          </button>
                          {shareMenuOpen === property.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShareMenuOpen(null)}
                                aria-hidden="true"
                              />
                              <div className="absolute right-0 bottom-full mb-1 w-44 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 py-1">
                                <button
                                  onClick={() => handleShareWhatsApp(property)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 gap-2"
                                >
                                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                  WhatsApp
                                </button>
                                <button
                                  onClick={() => handleCopyLink(property)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 gap-2"
                                >
                                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                  </svg>
                                  Copy Link
                                </button>
                              </div>
                            </>
                          )}
                        </div>
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
