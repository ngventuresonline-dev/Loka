'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Property {
  id: string
  title: string
  address: string
  city: string
  owner: {
    name: string
    email: string
  }
  size: number
  price: number
  priceType: string
  availability: boolean
  createdAt: string
  isFeatured: boolean
}

interface PropertyManagementTableProps {
  userEmail: string
  userId: string
}

export default function PropertyManagementTable({ userEmail, userId }: PropertyManagementTableProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLocation, setFilterLocation] = useState('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'occupied'>('all')
  const [sortBy, setSortBy] = useState<'rent' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    fetchProperties()
  }, [searchTerm, filterLocation, filterStatus, sortBy, sortOrder, currentPage])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        location: filterLocation !== 'all' ? filterLocation : '',
        status: filterStatus !== 'all' ? filterStatus : '',
        sortBy,
        sortOrder,
        userId,
        userEmail: encodeURIComponent(userEmail),
      })

      const response = await fetch(`/api/admin/properties?${params}`)
      if (!response.ok) throw new Error('Failed to fetch properties')
      
      const data = await response.json()
      setProperties(data.properties || [])
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
    } catch (error: any) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFeature = async (propertyId: string, currentFeatured: boolean) => {
    try {
      const response = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          isFeatured: !currentFeatured,
        }),
      })
      if (response.ok) {
        await fetchProperties()
      }
    } catch (error: any) {
      console.error('Error featuring property:', error)
      alert('Failed to update property')
    }
  }

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return
    
    try {
      const response = await fetch(`/api/admin/properties?propertyId=${propertyId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchProperties()
      }
    } catch (error: any) {
      console.error('Error deleting property:', error)
      alert('Failed to delete property')
    }
  }

  const formatPrice = (price: number, type: string) => {
    return `₹${price.toLocaleString()}/${type === 'monthly' ? 'mo' : type === 'yearly' ? 'yr' : 'sqft'}`
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">Property Management</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200] flex-1 sm:flex-none sm:w-64"
          />
          <select
            value={filterLocation}
            onChange={(e) => {
              setFilterLocation(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
          >
            <option value="all">All Locations</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as any)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-')
              setSortBy(by as any)
              setSortOrder(order as any)
            }}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="rent-desc">Highest Rent</option>
            <option value="rent-asc">Lowest Rent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No properties found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Address</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Owner</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Location</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Size</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Rent</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Listed Date</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property, index) => (
                  <motion.tr
                    key={property.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{property.title}</div>
                      <div className="text-gray-400 text-sm">{property.address}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white">{property.owner.name}</div>
                      <div className="text-gray-400 text-sm">{property.owner.email}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{property.city}</td>
                    <td className="py-3 px-4 text-gray-300">{property.size.toLocaleString()} sq ft</td>
                    <td className="py-3 px-4 text-white font-semibold">
                      {formatPrice(property.price, property.priceType)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        property.availability ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {property.availability ? 'Available' : 'Occupied'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {new Date(property.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 text-sm">
                          View
                        </button>
                        <button className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded hover:bg-yellow-500/30 text-sm">
                          Edit
                        </button>
                        <button
                          onClick={() => handleFeature(property.id, !property.isFeatured)}
                          className={`px-3 py-1 rounded hover:opacity-80 text-sm ${
                            property.isFeatured 
                              ? 'bg-purple-500/20 text-purple-300' 
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {property.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <p className="text-gray-400 text-sm">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

