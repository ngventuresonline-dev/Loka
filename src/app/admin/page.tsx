'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import StatCard from '@/components/admin/StatCard'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'
import PlatformMetrics from '@/components/admin/PlatformMetrics'
import RecentActivity from '@/components/admin/RecentActivity'
import { useAuth } from '@/contexts/AuthContext'
import LokazenNodesLoader from '@/components/LokazenNodesLoader'

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
  const [brands, setBrands] = useState<any[]>([])
  const [brandsLoading, setBrandsLoading] = useState(false)
  const [expertRequests, setExpertRequests] = useState<any[]>([])
  const [expertRequestsLoading, setExpertRequestsLoading] = useState(false)
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
      fetchExpertRequests()
    }
  }, [isLoggedIn, user, authLoading, router, dateRange])

  const fetchExpertRequests = async () => {
    if (!user?.id || !user?.email) return
    
    try {
      setExpertRequestsLoading(true)
      const response = await fetch(`/api/admin/expert-requests?limit=10`)
      if (response.ok) {
        const data = await response.json()
        setExpertRequests(data.expertRequests || [])
      }
    } catch (error) {
      console.error('Error fetching expert requests:', error)
    } finally {
      setExpertRequestsLoading(false)
    }
  }

  const fetchAllBrands = async () => {
    if (!user?.id || !user?.email) return
    
    try {
      setBrandsLoading(true)
      const response = await fetch(`/api/admin/brands?userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setBrands((data.brands || []).map((b: any) => ({
          id: b.id,
          name: b.name || 'N/A',
          email: b.email || '',
          companyName: b.companyName || b.brandProfile?.companyName || 'N/A',
          industry: b.industry || b.brandProfile?.industry || 'N/A',
          phone: b.phone || 'N/A',
          userType: b.userType || 'brand',
          isActive: b.isActive !== undefined ? b.isActive : true,
          createdAt: b.createdAt,
          budgetMin: b.brandProfile?.budgetMin || null,
          budgetMax: b.brandProfile?.budgetMax || null,
          preferredLocations: b.brandProfile?.preferredLocations || [],
          isFeatured: b.isFeatured || false
        })))
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    } finally {
      setBrandsLoading(false)
    }
  }

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
      
      // Fetch all properties and brands
      fetchAllProperties()
      fetchAllBrands()
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
            <LokazenNodesLoader size="lg" className="mb-4" />
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

        {/* Properties Summary */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Properties</h2>
              <p className="text-gray-400">Key metrics and quick access to property management</p>
            </div>
            <button
              onClick={() => router.push('/admin/properties')}
              className="px-4 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors text-sm font-medium"
            >
              Manage All Properties
            </button>
          </div>

          {propertiesLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Total Properties</div>
                <div className="text-3xl font-bold text-white mb-2">{properties.length}</div>
                <div className="text-gray-400 text-xs">
                  {properties.filter(p => p.isFeatured).length} featured
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Available</div>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {properties.filter(p => p.availability).length}
                </div>
                <div className="text-gray-400 text-xs">
                  {properties.filter(p => !p.availability).length} occupied
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Average Price</div>
                <div className="text-3xl font-bold text-white mb-2">
                  ₹{properties.length > 0 
                    ? Math.round(properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length).toLocaleString()
                    : '0'}
                </div>
                <div className="text-gray-400 text-xs">per month</div>
              </div>
            </div>
          )}
        </div>

        {/* Brands Summary */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Brands</h2>
              <p className="text-gray-400">Key metrics and quick access to brand management</p>
            </div>
            <button
              onClick={() => router.push('/admin/brands')}
              className="px-4 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors text-sm font-medium"
            >
              Manage All Brands
            </button>
          </div>

          {brandsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Total Brands</div>
                <div className="text-3xl font-bold text-white mb-2">{brands.length}</div>
                <div className="text-gray-400 text-xs">
                  {brands.filter(b => b.isFeatured).length} featured
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Active Brands</div>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {brands.filter(b => b.isActive).length}
                </div>
                <div className="text-gray-400 text-xs">
                  {brands.filter(b => !b.isActive).length} inactive
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Top Industries</div>
                <div className="text-lg font-bold text-white mb-2">
                  {brands.length > 0 
                    ? [...new Set(brands.map(b => b.industry).filter(Boolean))].slice(0, 2).join(', ')
                    : 'N/A'}
                </div>
                <div className="text-gray-400 text-xs">
                  {brands.length > 0 
                    ? [...new Set(brands.map(b => b.industry).filter(Boolean))].length 
                    : 0} industries
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Expert Requests Summary */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Expert Requests</h2>
              <p className="text-gray-400">Recent expert connection requests from brands</p>
            </div>
            <button
              onClick={() => router.push('/admin/expert-requests')}
              className="px-4 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors text-sm font-medium"
            >
              View All Requests
            </button>
          </div>

          {expertRequestsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
            </div>
          ) : expertRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No expert requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expertRequests.slice(0, 5).map((request: any) => (
                <div key={request.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{request.brandName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          request.status === 'contacted' ? 'bg-blue-500/20 text-blue-400' :
                          request.status === 'scheduled' ? 'bg-green-500/20 text-green-400' :
                          request.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">{request.property?.title || 'Property'}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        {request.phone && <span>📞 {request.phone}</span>}
                        {request.email && <span>✉️ {request.email}</span>}
                        {request.scheduleDateTime && (
                          <span>📅 {new Date(request.scheduleDateTime).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <RecentActivity activities={formatActivity()} />
      </div>
    </AdminLayout>
  )
}
