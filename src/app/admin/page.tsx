'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'

interface DashboardStats {
  propertiesTotal: number
  propertiesPending: number
  brandsActive: number
  inquiriesPending: number
  recentInquiries: Array<{
    id: string
    brand: { name: string }
    property: { title: string }
    status: string
    createdAt: string
  }>
}

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoggedIn, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && isLoggedIn && user?.userType === 'admin') {
      fetchStats()
    }
  }, [isLoggedIn, user, authLoading])

  const fetchStats = async () => {
    if (!user?.id || !user?.email) return

    try {
      setLoading(true)
      setError(null)

      const [propsRes, brandsRes, inquiriesRes] = await Promise.all([
        fetch(`/api/admin/properties?limit=5000&page=1&userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`),
        fetch(`/api/admin/brands?userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`),
        fetch(`/api/admin/inquiries?limit=100&page=1&userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`),
      ])

      const propsData = propsRes.ok ? await propsRes.json() : { properties: [] }
      const brandsData = brandsRes.ok ? await brandsRes.json() : { brands: [] }
      const inquiriesData = inquiriesRes.ok ? await inquiriesRes.json() : { inquiries: [], total: 0 }

      const properties = propsData.properties || []
      const brands = brandsData.brands || []
      const inquiries = inquiriesData.inquiries || []

      const pendingProps = properties.filter(
        (p: any) => (p.status || (p.availability === false ? 'pending' : 'approved')) === 'pending'
      )
      const pendingInq = inquiries.filter(
        (i: any) => ['pending'].includes(i.status?.toLowerCase() || '')
      )
      const activeBrands = brands.filter((b: any) => b.isActive !== false)

      setStats({
        propertiesTotal: properties.length,
        propertiesPending: pendingProps.length,
        brandsActive: activeBrands.length,
        inquiriesPending: pendingInq.length,
        recentInquiries: inquiries.slice(0, 5).map((i: any) => ({
          id: i.id,
          brand: i.brand || { name: 'N/A' },
          property: i.property || { title: 'N/A' },
          status: i.status || 'pending',
          createdAt: i.createdAt || '',
        })),
      })
    } catch (err: any) {
      console.error('[Admin] Error fetching stats:', err)
      setError(err.message || 'Failed to load dashboard')
      setStats({
        propertiesTotal: 0,
        propertiesPending: 0,
        brandsActive: 0,
        inquiriesPending: 0,
        recentInquiries: [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5200]"></div>
        </div>
      </AdminLayout>
    )
  }

  if (loading && !stats) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5200] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Welcome, <span className="text-[#FF5200] font-semibold">{user?.name || 'Admin'}</span>
          </p>
        </div>

        {/* Simple Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 cursor-pointer hover:border-[#FF5200]/50 transition-colors"
            onClick={() => router.push('/admin/properties')}
          >
            <div className="text-gray-400 text-sm mb-1">Properties</div>
            <div className="text-3xl font-bold text-white">{stats?.propertiesTotal ?? 0}</div>
            <div className="text-[#FF5200] text-sm mt-2 font-medium">
              {stats?.propertiesPending ?? 0} pending
            </div>
            <button
              className="mt-3 text-sm text-gray-400 hover:text-[#FF5200]"
              onClick={(e) => { e.stopPropagation(); router.push('/admin/properties/pending') }}
            >
              View pending →
            </button>
          </div>

          <div
            className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 cursor-pointer hover:border-[#FF5200]/50 transition-colors"
            onClick={() => router.push('/admin/brands')}
          >
            <div className="text-gray-400 text-sm mb-1">Brands</div>
            <div className="text-3xl font-bold text-white">{stats?.brandsActive ?? 0}</div>
            <div className="text-gray-400 text-sm mt-2">active searches</div>
            <button
              className="mt-3 text-sm text-gray-400 hover:text-[#FF5200]"
              onClick={(e) => { e.stopPropagation(); router.push('/admin/brands') }}
            >
              Manage brands →
            </button>
          </div>

          <div
            className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 cursor-pointer hover:border-[#FF5200]/50 transition-colors"
            onClick={() => router.push('/admin/inquiries')}
          >
            <div className="text-gray-400 text-sm mb-1">Inquiries</div>
            <div className="text-3xl font-bold text-white">{stats?.inquiriesPending ?? 0}</div>
            <div className="text-gray-400 text-sm mt-2">pending</div>
            <button
              className="mt-3 text-sm text-gray-400 hover:text-[#FF5200]"
              onClick={(e) => { e.stopPropagation(); router.push('/admin/inquiries') }}
            >
              View pipeline →
            </button>
          </div>
          <div
            className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 cursor-pointer hover:border-[#FF5200]/50 transition-colors"
            onClick={() => router.push('/admin/matches')}
          >
            <div className="text-gray-400 text-sm mb-1">BFI & PFI Matches</div>
            <div className="text-3xl font-bold text-white">Property ↔ Brand</div>
            <div className="text-gray-400 text-sm mt-2">fit scores</div>
            <button
              className="mt-3 text-sm text-gray-400 hover:text-[#FF5200]"
              onClick={(e) => { e.stopPropagation(); router.push('/admin/matches') }}
            >
              View matches →
            </button>
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Recent Inquiries</h2>
            <button
              onClick={() => router.push('/admin/inquiries')}
              className="text-sm text-[#FF5200] hover:underline"
            >
              View all
            </button>
          </div>
          {stats?.recentInquiries && stats.recentInquiries.length > 0 ? (
            <div className="space-y-3">
              {stats.recentInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <div>
                    <span className="text-white font-medium">{inq.brand.name}</span>
                    <span className="text-gray-400"> → </span>
                    <span className="text-gray-300">{inq.property.title}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      inq.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {inq.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No recent inquiries</p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            {error}
            <button
              onClick={fetchStats}
              className="ml-4 px-3 py-1 bg-red-500/20 rounded text-sm hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
