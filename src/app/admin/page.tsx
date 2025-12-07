'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import StatCard from '@/components/admin/StatCard'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'
import { useAuth } from '@/contexts/AuthContext'

interface DashboardStats {
  overview: {
    totalUsers: number
    totalProperties: number
    totalInquiries: number
    activeMatches: number
  }
  breakdown: {
    usersByType: { [key: string]: number }
    propertiesByStatus: { available: number; occupied: number }
    inquiriesByStatus: { [key: string]: number }
  }
  recentActivity: {
    users: any[]
    properties: any[]
    inquiries: any[]
  }
}

interface AnalyticsData {
  userRegistrations: { date: string; count: number }[]
  propertyListings: { date: string; count: number }[]
  inquiryCreation: { date: string; count: number }[]
  topLocations: { location: string; count: number }[]
  propertyTypes: { type: string; count: number }[]
  brandOwnerRatio: { brands: number; owners: number; admins: number }
  searchAnalytics: {
    totalSearches: number
    buttonFlow: number
    textSearch: number
    averageResults: number
    conversionRate: number
  }
}

type ActiveSection = 'dashboard' | 'users' | 'properties' | 'inquiries' | 'analytics' | 'health' | 'settings'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isLoggedIn } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard')
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('30d')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [platformStatus, setPlatformStatus] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Check authentication
    if (!isLoggedIn || !user || user.userType !== 'admin') {
      router.push('/auth/login')
      return
    }

    loadDashboardData()
  }, [user, isLoggedIn, router, dateRange])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, analyticsRes, statusRes] = await Promise.all([
        fetch(`/api/admin/stats?range=${dateRange}`),
        fetch(`/api/admin/analytics?range=${dateRange}`),
        fetch('/api/platform-status')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData)
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setPlatformStatus(statusData)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading Admin Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-800 z-40 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold bg-gradient-to-r from-[#FF5722] to-[#FF6B35] bg-clip-text text-transparent">
              Admin Panel
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'users', label: 'Users', icon: '👥' },
            { id: 'properties', label: 'Properties', icon: '🏢' },
            { id: 'inquiries', label: 'Inquiries', icon: '💬' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'health', label: 'Platform Health', icon: '💚' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id as ActiveSection)
                setSidebarOpen(false)
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-gradient-to-r from-[#FF5722]/20 to-[#FF6B35]/20 border border-[#FF5722]/30 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg text-red-400 transition-colors"
          >
            Logout
          </button>
      </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  ☰
                </button>
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-gray-400">Welcome back, {user?.name}</p>
                </div>
                </div>
              <div className="flex items-center gap-4">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
                >
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="all">All time</option>
                </select>
                <button
                  onClick={loadDashboardData}
                  className="px-4 py-2 bg-gradient-to-r from-[#FF5722] to-[#FF6B35] rounded-lg hover:opacity-90 transition-opacity"
                >
                  Refresh
                </button>
                </div>
              </div>
            </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {activeSection === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Quick Stats */}
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                      title="Total Users"
                      value={stats.overview.totalUsers}
                      color="blue"
                      icon={
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      }
                    />
                    <StatCard
                      title="Total Properties"
                      value={stats.overview.totalProperties}
                      color="green"
                      icon={
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                      }
                    />
                    <StatCard
                      title="Total Inquiries"
                      value={stats.overview.totalInquiries}
                      color="purple"
                      icon={
                        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      }
                    />
                    <StatCard
                      title="Active Matches"
                      value={stats.overview.activeMatches}
                      color="orange"
                      icon={
                        <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      }
                    />
                  </div>
                )}

                {/* Recent Activity */}
                {stats && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
                      <div className="space-y-3">
                        {stats.recentActivity.users.slice(0, 5).map((user: any) => (
                          <div key={user.id} className="flex items-center justify-between text-sm">
                            <div>
                              <p className="text-white font-medium">{user.name}</p>
                              <p className="text-gray-400 text-xs">{user.email}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.userType === 'brand' ? 'bg-blue-500/20 text-blue-400' :
                              user.userType === 'owner' ? 'bg-green-500/20 text-green-400' :
                              'bg-purple-500/20 text-purple-400'
                            }`}>
                              {user.userType}
                            </span>
                </div>
                        ))}
              </div>
            </div>

                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4">Recent Properties</h3>
                      <div className="space-y-3">
                        {stats.recentActivity.properties.slice(0, 5).map((property: any) => (
                          <div key={property.id} className="text-sm">
                            <p className="text-white font-medium">{property.title}</p>
                            <p className="text-gray-400 text-xs">{property.city}</p>
                </div>
                        ))}
              </div>
            </div>

                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4">Recent Inquiries</h3>
                      <div className="space-y-3">
                        {stats.recentActivity.inquiries.slice(0, 5).map((inquiry: any) => (
                          <div key={inquiry.id} className="text-sm">
                            <p className="text-white font-medium">{inquiry.brand?.name || 'Unknown'}</p>
                            <p className="text-gray-400 text-xs">{inquiry.property?.title || 'Unknown Property'}</p>
                            <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                              inquiry.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              inquiry.status === 'responded' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {inquiry.status}
                            </span>
                </div>
                        ))}
              </div>
            </div>
          </div>
        )}

                {/* Platform Health */}
                {platformStatus && (
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4">Platform Health</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {platformStatus.coreSystems && typeof platformStatus.coreSystems === 'object' && (
                        <>
                          {platformStatus.coreSystems.database && (
                            <div className="bg-gray-800/50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{platformStatus.coreSystems.database.name}</h4>
                                <span className={`w-3 h-3 rounded-full ${
                                  platformStatus.coreSystems.database.status === 'operational' ? 'bg-green-500' :
                                  platformStatus.coreSystems.database.status === 'degraded' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`} />
                              </div>
                              <p className="text-sm text-gray-400">{platformStatus.coreSystems.database.message}</p>
                              <p className="text-xs text-gray-500 mt-1">Response: {platformStatus.coreSystems.database.responseTime}ms</p>
                            </div>
                          )}
                          {platformStatus.coreSystems.aiEngine && (
                            <div className="bg-gray-800/50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{platformStatus.coreSystems.aiEngine.name}</h4>
                                <span className={`w-3 h-3 rounded-full ${
                                  platformStatus.coreSystems.aiEngine.status === 'operational' ? 'bg-green-500' :
                                  platformStatus.coreSystems.aiEngine.status === 'degraded' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`} />
                              </div>
                              <p className="text-sm text-gray-400">{platformStatus.coreSystems.aiEngine.message}</p>
                              <p className="text-xs text-gray-500 mt-1">Response: {platformStatus.coreSystems.aiEngine.responseTime}ms</p>
                            </div>
                          )}
                          {platformStatus.coreSystems.authentication && (
                            <div className="bg-gray-800/50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{platformStatus.coreSystems.authentication.name}</h4>
                                <span className={`w-3 h-3 rounded-full ${
                                  platformStatus.coreSystems.authentication.status === 'operational' ? 'bg-green-500' :
                                  platformStatus.coreSystems.authentication.status === 'degraded' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`} />
                              </div>
                              <p className="text-sm text-gray-400">{platformStatus.coreSystems.authentication.message}</p>
                              <p className="text-xs text-gray-500 mt-1">Response: {platformStatus.coreSystems.authentication.responseTime}ms</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeSection === 'analytics' && analytics && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AnalyticsCharts {...analytics} />
              </motion.div>
            )}

            {activeSection === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-6">User Management</h2>
                  <p className="text-gray-400">User management table will be implemented here with search, filter, and actions.</p>
                </div>
              </motion.div>
            )}

            {activeSection === 'properties' && (
              <motion.div
                key="properties"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-6">Property Management</h2>
                  <p className="text-gray-400">Property management table will be implemented here with search, filter, and actions.</p>
                </div>
              </motion.div>
            )}

            {activeSection === 'inquiries' && (
              <motion.div
                key="inquiries"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-6">Inquiry Management</h2>
                  <p className="text-gray-400">Inquiry management table will be implemented here with search, filter, and actions.</p>
        </div>
              </motion.div>
            )}

            {activeSection === 'health' && platformStatus && (
              <motion.div
                key="health"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-6">Platform Health</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Overall Status</h3>
                      <p className={`text-2xl font-bold ${
                        (platformStatus.status || platformStatus.overallStatus) === 'operational' ? 'text-green-400' :
                        (platformStatus.status || platformStatus.overallStatus) === 'degraded' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {(platformStatus.status || platformStatus.overallStatus || 'UNKNOWN')?.toUpperCase()}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {platformStatus.coreSystems && typeof platformStatus.coreSystems === 'object' && (
                        <>
                          {platformStatus.coreSystems.database && (
                            <div className="bg-gray-800/50 rounded-lg p-4">
                              <h4 className="font-medium mb-2">{platformStatus.coreSystems.database.name}</h4>
                              <p className="text-sm text-gray-400">{platformStatus.coreSystems.database.message}</p>
                              <p className="text-xs text-gray-500 mt-1">Response: {platformStatus.coreSystems.database.responseTime}ms</p>
                            </div>
                          )}
                          {platformStatus.coreSystems.aiEngine && (
                            <div className="bg-gray-800/50 rounded-lg p-4">
                              <h4 className="font-medium mb-2">{platformStatus.coreSystems.aiEngine.name}</h4>
                              <p className="text-sm text-gray-400">{platformStatus.coreSystems.aiEngine.message}</p>
                              <p className="text-xs text-gray-500 mt-1">Response: {platformStatus.coreSystems.aiEngine.responseTime}ms</p>
                            </div>
                          )}
                          {platformStatus.coreSystems.authentication && (
                            <div className="bg-gray-800/50 rounded-lg p-4">
                              <h4 className="font-medium mb-2">{platformStatus.coreSystems.authentication.name}</h4>
                              <p className="text-sm text-gray-400">{platformStatus.coreSystems.authentication.message}</p>
                              <p className="text-xs text-gray-500 mt-1">Response: {platformStatus.coreSystems.authentication.responseTime}ms</p>
                            </div>
                          )}
                        </>
                      )}
          </div>
        </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-6">Settings</h2>
                  <p className="text-gray-400">Admin settings will be implemented here.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
