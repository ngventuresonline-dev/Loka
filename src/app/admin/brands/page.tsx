'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'

interface Brand {
  id: string
  name: string
  email: string
  companyName: string
  industry: string
  phone: string
  userType: string
  createdAt: string
  isActive: boolean
  brandProfile?: {
    budgetMin: number
    budgetMax: number
    minSize: number
    maxSize: number
    preferredLocations: string[]
  }
}

export default function BrandsPage() {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/brands')
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands || [])
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return
    
    try {
      const response = await fetch(`/api/admin/brands/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await fetchBrands()
      }
    } catch (error) {
      console.error('Error deleting brand:', error)
      alert('Failed to delete brand')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedBrands.length} brands?`)) return
    
    try {
      await Promise.all(
        selectedBrands.map(id =>
          fetch(`/api/admin/brands/${id}`, { method: 'DELETE' })
        )
      )
      setSelectedBrands([])
      await fetchBrands()
    } catch (error) {
      console.error('Error bulk deleting:', error)
      alert('Failed to delete brands')
    }
  }

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Brands</h1>
            <p className="text-gray-400">Manage all brand accounts</p>
          </div>
          <button
            onClick={() => router.push('/admin/brands/new')}
            className="px-6 py-3 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors font-medium"
          >
            Add New Brand
          </button>
        </div>

        {/* Search and Bulk Actions */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200]"
            />
            {selectedBrands.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Selected ({selectedBrands.length})
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
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No brands found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedBrands.length === filteredBrands.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBrands(filteredBrands.map(b => b.id))
                        } else {
                          setSelectedBrands([])
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Company</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Industry</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-semibold">Registered</th>
                  <th className="px-6 py-4 text-right text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBrands([...selectedBrands, brand.id])
                          } else {
                            setSelectedBrands(selectedBrands.filter(id => id !== brand.id))
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{brand.name}</td>
                    <td className="px-6 py-4 text-gray-300">{brand.email}</td>
                    <td className="px-6 py-4 text-gray-300">{brand.companyName || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-300">{brand.industry || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        brand.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {brand.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(brand.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/brands/${brand.id}`)}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
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

