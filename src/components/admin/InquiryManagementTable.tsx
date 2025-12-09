'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Inquiry {
  id: string
  brand: {
    name: string
    email: string
  }
  property: {
    title: string
    address: string
  }
  owner: {
    name: string
    email: string
  } | null
  status: 'pending' | 'responded' | 'closed'
  createdAt: string
  message: string
}

interface InquiryManagementTableProps {
  userEmail: string
  userId: string
}

export default function InquiryManagementTable({ userEmail, userId }: InquiryManagementTableProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'responded' | 'closed'>('all')
  const [sortBy, setSortBy] = useState<'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    fetchInquiries()
  }, [searchTerm, filterStatus, sortBy, sortOrder, currentPage])

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : '',
        sortBy,
        sortOrder,
        userId,
        userEmail: encodeURIComponent(userEmail),
      })

      const response = await fetch(`/api/admin/inquiries?${params}`)
      if (!response.ok) throw new Error('Failed to fetch inquiries')
      
      const data = await response.json()
      setInquiries(data.inquiries || [])
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
    } catch (error: any) {
      console.error('Error fetching inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (inquiryId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
        }),
      })
      if (response.ok) {
        await fetchInquiries()
      }
    } catch (error: any) {
      console.error('Error updating inquiry status:', error)
      alert('Failed to update inquiry status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300'
      case 'responded':
        return 'bg-blue-500/20 text-blue-300'
      case 'closed':
        return 'bg-green-500/20 text-green-300'
      default:
        return 'bg-gray-500/20 text-gray-300'
    }
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">Inquiry Management</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by brand or property..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200] flex-1 sm:flex-none sm:w-64"
          />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as any)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="responded">Responded</option>
            <option value="closed">Closed</option>
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
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No inquiries found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Brand Name</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Property</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Owner</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Date</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry, index) => (
                  <motion.tr
                    key={inquiry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="text-white">{inquiry.brand.name}</div>
                      <div className="text-gray-400 text-sm">{inquiry.brand.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white">{inquiry.property.title}</div>
                      <div className="text-gray-400 text-sm">{inquiry.property.address}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {inquiry.owner ? inquiry.owner.name : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusUpdate(inquiry.id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-semibold border-0 ${getStatusColor(inquiry.status)} bg-transparent cursor-pointer`}
                      >
                        <option value="pending">Pending</option>
                        <option value="responded">Responded</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 text-sm">
                          View Details
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

