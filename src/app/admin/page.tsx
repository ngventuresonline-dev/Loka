'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import StatCard from '@/components/admin/StatCard'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'
import PlatformMetrics from '@/components/admin/PlatformMetrics'
import RecentActivity from '@/components/admin/RecentActivity'
import { useAuth } from '@/contexts/AuthContext'

interface Stats {
  overview: {
    totalUsers: number
    totalProperties: number
    totalInquiries: number
    activeMatches: number
  }
  breakdown: {
    usersByType: Record<string, number>
    propertiesByStatus: {
      available: number
      occupied: number
    }
    inquiriesByStatus: Record<string, number>
  }
  recentActivity: {
    users: any[]
    properties: any[]
    inquiries: any[]
  }
  platformMetrics?: {
    averageBFI: number
    averagePFI: number
    totalMatches: number
    matchSuccessRate: number
    aiSearchCount: number
    conversionRate: number
  }
}

interface Analytics {
  userRegistrations: { date: string; count: number }[]
  propertyListings: { date: string; count: number }[]
  inquiryCreation: { date: string; count: number }[]
  topLocations: { location: string; count: number }[]
  propertyTypes: { type: string; count: number }[]
  brandOwnerRatio: {
    brands: number
    owners: number
    admins: number
  }
  searchAnalytics: {
    totalSearches: number
    buttonFlow: number
    textSearch: number
    averageResults: number
    conversionRate: number
  }
  inquiriesByStatus?: Record<string, number>
}

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoggedIn, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('30d')

  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn || user?.userType !== 'admin') {
        router.push('/')
        return
      }
      fetchData()
    }
  }, [isLoggedIn, user, authLoading, router, dateRange])

  const fetchData = async () => {
    if (!user?.id || !user?.email) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [statsResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/admin/stats?range=${dateRange}&userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`),
        fetch(`/api/admin/analytics?range=${dateRange}&userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`)
      ])

      if (!statsResponse.ok) {
        const errorData = await statsResponse.json().catch(() => ({ error: `HTTP ${statsResponse.status}: ${statsResponse.statusText}` }))
        console.error('[Admin] Stats API error:', statsResponse.status, errorData)
        throw new Error(errorData.error || `Failed to fetch stats (${statsResponse.status})`)
      }

      if (!analyticsResponse.ok) {
        const errorData = await analyticsResponse.json().catch(() => ({ error: `HTTP ${analyticsResponse.status}: ${analyticsResponse.statusText}` }))
        console.error('[Admin] Analytics API error:', analyticsResponse.status, errorData)
        throw new Error(errorData.error || `Failed to fetch analytics (${analyticsResponse.status})`)
      }

      const [statsData, analyticsData] = await Promise.all([
        statsResponse.json(),
        analyticsResponse.json()
      ])

      setStats(statsData)
      setAnalytics(analyticsData)
      
      // Fetch all properties
      fetchAllProperties()
    } catch (err: any) {
      console.error('[Admin] Error fetching admin data:', err)
      setError(err.message || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllProperties = async () => {
    if (!user?.id || !user?.email) return
    
    try {
      setPropertiesLoading(true)
      let allProperties: any[] = []
      
      // Fetch all properties from admin API with pagination
      let page = 1
      let hasMore = true
      const limit = 100
      
      while (hasMore) {
        try {
          const response = await fetch(`/api/admin/properties?limit=${limit}&page=${page}`)
          if (response.ok) {
            const data = await response.json()
            const pageProperties = data.properties || []
            allProperties = [...allProperties, ...pageProperties]
            
            // Check if there are more pages
            const total = data.total || 0
            hasMore = allProperties.length < total && pageProperties.length === limit
            page++
          } else {
            hasMore = false
          }
        } catch (e) {
          console.error('Error fetching page:', page, e)
          hasMore = false
        }
      }
      
      // If no properties from admin API, try public API
      if (allProperties.length === 0) {
        try {
          const publicResponse = await fetch(`/api/properties?limit=100`)
          if (publicResponse.ok) {
            const publicData = await publicResponse.json()
            allProperties = publicData.properties || publicData.data?.properties || []
          }
        } catch (e) {
          console.error('Public API also failed:', e)
        }
      }
      
      // Format properties to match expected structure
      const formattedProperties = allProperties.map((p: any) => ({
        id: p.id,
        title: p.title,
        address: p.address || '',
        city: p.city || p.location || '',
        owner: p.owner || { name: 'N/A', email: '' },
        price: typeof p.price === 'number' ? Number(p.price) : (typeof p.price === 'string' && p.price.includes('₹') ? parseFloat(p.price.replace(/[^0-9]/g, '')) : 0),
        priceType: p.priceType || 'monthly',
        size: typeof p.size === 'number' ? p.size : (typeof p.size === 'string' ? parseFloat(p.size.replace(/[^0-9]/g, '')) : 0),
        propertyType: p.propertyType || 'other',
        availability: p.availability !== undefined ? p.availability : (p.badge !== 'Leased Out'),
        isFeatured: p.isFeatured !== undefined ? p.isFeatured : false,
        createdAt: p.createdAt
      }))
      
      setProperties(formattedProperties)
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setPropertiesLoading(false)
    }
  }

  const formatActivity = () => {
    if (!stats?.recentActivity) return []
    
    const activities: any[] = []
    
    // User registrations
    stats.recentActivity.users.slice(0, 5).forEach((u: any) => {
      activities.push({
        id: `user-${u.id}`,
        type: 'user_registration',
        description: `${u.name} (${u.email}) registered as ${u.userType}`,
        timestamp: u.createdAt,
        user: { name: u.name, email: u.email }
      })
    })
    
    // Property listings
    stats.recentActivity.properties.slice(0, 5).forEach((p: any) => {
      activities.push({
        id: `property-${p.id}`,
        type: 'property_listing',
        description: `Property "${p.title}" listed in ${p.city}`,
        timestamp: p.createdAt,
        property: { title: p.title }
      })
    })
    
    // Inquiries
    stats.recentActivity.inquiries.slice(0, 5).forEach((i: any) => {
      activities.push({
        id: `inquiry-${i.id}`,
        type: 'inquiry_created',
        description: `${i.brand?.name || 'Brand'} inquired about "${i.property?.title || 'Property'}"`,
        timestamp: i.createdAt
      })
    })
    
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5200] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-2xl">
            <p className="text-red-400 text-lg mb-2">Error: {error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors mt-4"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!stats || !analytics) {
    return null
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Welcome back, <span className="text-[#FF5200] font-semibold">{user?.name || 'Admin'}</span>
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex flex-wrap gap-2">
          {(['today', '7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === range
                  ? 'bg-[#FF5200] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === 'today' ? 'Today' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.overview.totalUsers}
            color="blue"
          />
          <StatCard
            title="Total Properties"
            value={stats.overview.totalProperties}
            color="green"
          />
          <StatCard
            title="Total Inquiries"
            value={stats.overview.totalInquiries}
            color="purple"
          />
          <StatCard
            title="Active Matches"
            value={stats.overview.activeMatches}
            color="orange"
          />
        </div>

        {/* Analytics Charts */}
        {analytics && (
          <AnalyticsCharts
            userRegistrations={analytics.userRegistrations}
            propertyListings={analytics.propertyListings}
            inquiryCreation={analytics.inquiryCreation}
            topLocations={analytics.topLocations}
            propertyTypes={analytics.propertyTypes}
            brandOwnerRatio={analytics.brandOwnerRatio}
            searchAnalytics={analytics.searchAnalytics}
            inquiriesByStatus={analytics.inquiriesByStatus}
          />
        )}

        {/* Platform Metrics */}
        {stats.platformMetrics && (
          <PlatformMetrics metrics={stats.platformMetrics} />
        )}

        {/* All Properties Section */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">All Properties</h2>
              <p className="text-gray-400">Complete list of all properties on the platform</p>
            </div>
            <button
              onClick={() => router.push('/admin/properties')}
              className="px-4 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors text-sm font-medium"
            >
              Manage Properties
            </button>
          </div>

          {propertiesLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No properties found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Title</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Location</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Owner</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Price</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Size</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Featured</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr
                      key={property.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{property.title}</div>
                        <div className="text-gray-400 text-sm">{property.address}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{property.city}</td>
                      <td className="py-3 px-4 text-gray-300">{property.owner?.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-white font-semibold">
                        ₹{property.price?.toLocaleString() || '0'}/{property.priceType === 'monthly' ? 'mo' : property.priceType === 'yearly' ? 'yr' : 'sqft'}
                      </td>
                      <td className="py-3 px-4 text-gray-300">{property.size?.toLocaleString() || '0'} sq ft</td>
                      <td className="py-3 px-4 text-gray-300 capitalize">{property.propertyType || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          property.availability ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {property.availability ? 'Available' : 'Occupied'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          property.isFeatured ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {property.isFeatured ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/properties/${property.id}`)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => router.push(`/admin/properties/${property.id}`)}
                            className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded hover:bg-yellow-500/30 text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {properties.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <p className="text-gray-400 text-sm">
                Showing {properties.length} {properties.length === 1 ? 'property' : 'properties'}
              </p>
              <button
                onClick={() => router.push('/admin/properties')}
                className="text-[#FF5200] hover:text-[#E4002B] text-sm font-medium transition-colors"
              >
                View All Properties →
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <RecentActivity activities={formatActivity()} />
      </div>
    </AdminLayout>
  )
}
