'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface User {
  id: string
  name: string
  email: string
  userType: 'brand' | 'owner' | 'admin'
  createdAt: string
  isActive: boolean
}

interface UserManagementTableProps {
  userEmail: string
  userId: string
}

export default function UserManagementTable({ userEmail, userId }: UserManagementTableProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'brand' | 'owner' | 'admin'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    fetchUsers()
  }, [searchTerm, filterType, sortBy, sortOrder, currentPage])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        userType: filterType !== 'all' ? filterType : '',
        sortBy,
        sortOrder,
        userId,
        userEmail: encodeURIComponent(userEmail),
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      setUsers(data.users || [])
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
    } catch (error: any) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return
    
    try {
      const user = users.find(u => u.id === targetUserId)
      const params = new URLSearchParams({
        userId,
        userEmail: encodeURIComponent(userEmail),
      })
      const response = await fetch(`/api/admin/users?${params}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          isActive: !user?.isActive,
        }),
      })
      if (response.ok) {
        await fetchUsers()
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to suspend user' }))
        alert(error.error || 'Failed to suspend user')
      }
    } catch (error: any) {
      console.error('Error suspending user:', error)
      alert('Failed to suspend user')
    }
  }

  const handleDelete = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    
    try {
      const params = new URLSearchParams({
        userId: targetUserId,
        adminUserId: userId,
        adminUserEmail: encodeURIComponent(userEmail),
      })
      const response = await fetch(`/api/admin/users?${params}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchUsers()
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to delete user' }))
        alert(error.error || 'Failed to delete user')
      }
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || user.userType === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200] flex-1 sm:flex-none sm:w-64"
          />
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as any)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
          >
            <option value="all">All Types</option>
            <option value="brand">Brands</option>
            <option value="owner">Owners</option>
            <option value="admin">Admins</option>
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
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No users found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">User Type</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Registration Date</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-white">{user.name}</td>
                    <td className="py-3 px-4 text-gray-300">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.userType === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                        user.userType === 'brand' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {user.userType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            const userInfo = `User Details:\n\nName: ${user.name}\nEmail: ${user.email}\nType: ${user.userType}\nStatus: ${user.isActive ? 'Active' : 'Suspended'}\nRegistered: ${new Date(user.createdAt).toLocaleDateString()}`
                            alert(userInfo)
                          }}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 text-sm"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => {
                            const newName = prompt('Enter new name:', user.name)
                            if (newName && newName !== user.name) {
                              // Update user name via API
                              fetch('/api/admin/users', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  userId: user.id,
                                  name: newName,
                                }),
                              }).then(() => fetchUsers())
                            }
                          }}
                          className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded hover:bg-yellow-500/30 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleSuspend(user.id)}
                          className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded hover:bg-orange-500/30 text-sm"
                        >
                          {user.isActive ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
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

