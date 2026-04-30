'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'
import {
  Building2,
  Users,
  UserCheck,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  GitMerge,
  Zap,
  Plus,
} from 'lucide-react'

interface AdminStats {
  overview: {
    totalUsers: number
    totalProperties: number
    totalInquiries: number
    activeMatches: number
  }
  breakdown: {
    usersByType: Record<string, number>
    propertiesByStatus: { available: number; occupied: number }
    inquiriesByStatus: Record<string, number>
  }
  recentActivity: {
    users: Array<{ id: string; name: string; email: string; userType: string; createdAt: string }>
    properties: Array<{ id: string; title: string; city: string; price: number; createdAt: string }>
    inquiries: Array<{
      id: string
      status: string
      createdAt: string
      brand: { name: string; email: string }
      property: { title: string; address: string }
    }>
  }
  platformMetrics: {
    averageBFI: number
    averagePFI: number
    totalMatches: number
    matchSuccessRate: number
    conversionRate: number
  }
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  href,
  cta,
}: {
  label: string
  value: number | string
  sub?: string
  icon: React.ElementType
  accent: string
  href?: string
  cta?: string
}) {
  const router = useRouter()
  return (
    <div
      className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3 ${href ? 'cursor-pointer hover:border-gray-700 transition-colors group' : ''}`}
      onClick={() => href && router.push(href)}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${accent}20` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        {href && (
          <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
        )}
      </div>
      <div>
        <p className="text-3xl font-black text-white tabular-nums">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
      {sub && <p className="text-xs font-medium" style={{ color: accent }}>{sub}</p>}
      {cta && (
        <p className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors mt-auto">{cta} →</p>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / 3_600_000)
  const diffD = Math.floor(diffMs / 86_400_000)
  if (diffH < 1) return 'Just now'
  if (diffH < 24) return `${diffH}h ago`
  if (diffD < 7) return `${diffD}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const USER_TYPE_COLOR: Record<string, string> = {
  admin: 'text-red-400 bg-red-500/10',
  brand: 'text-blue-400 bg-blue-500/10',
  owner: 'text-green-400 bg-green-500/10',
}

const INQ_STATUS_COLOR: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-500/10',
  responded: 'text-green-400 bg-green-500/10',
  rejected: 'text-red-400 bg-red-500/10',
  closed: 'text-gray-400 bg-gray-500/10',
}

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoggedIn, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && isLoggedIn && user?.userType === 'admin') {
      fetchStats()
    }
  }, [isLoggedIn, user, authLoading])

  const fetchStats = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(
        `/api/admin/stats?range=all&userId=${user.id}&userEmail=${encodeURIComponent(user.email || '')}`,
        { credentials: 'include' }
      )
      if (res.status === 401 || res.status === 403) {
        // Session expired — redirect to login
        router.replace('/auth/login')
        return
      }
      if (!res.ok) throw new Error(`Stats API returned ${res.status}`)
      setStats(await res.json())
    } catch (err: any) {
      console.error('[Admin] Stats error:', err)
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF5200]" />
        </div>
      </AdminLayout>
    )
  }

  // No user or not admin — redirect to login instead of blank screen
  if (!user || user.userType !== 'admin') {
    if (typeof window !== 'undefined') router.replace('/auth/login')
    return null
  }

  const ov = stats?.overview
  const br = stats?.breakdown
  const ra = stats?.recentActivity
  const pm = stats?.platformMetrics

  const pendingInq = br?.inquiriesByStatus?.pending ?? 0
  const respondedInq = br?.inquiriesByStatus?.responded ?? 0

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Welcome back, <span className="text-[#FF5200] font-medium">{user?.name || 'Admin'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/admin/properties/new')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#FF5200] text-white rounded-lg text-sm font-medium hover:bg-[#E4002B] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
            <button
              onClick={() => router.push('/admin/brands/new')}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Brand
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={fetchStats} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30">
              Retry
            </button>
          </div>
        )}

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse h-36" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard
                label="Total Properties"
                value={ov?.totalProperties ?? 0}
                sub={`${br?.propertiesByStatus?.available ?? 0} available`}
                icon={Building2}
                accent="#FF5200"
                href="/admin/properties"
                cta="Manage listings"
              />
              <StatCard
                label="Active Brands"
                value={br?.usersByType?.brand ?? 0}
                sub="Searching spaces"
                icon={Users}
                accent="#6366f1"
                href="/admin/brands"
                cta="View brands"
              />
              <StatCard
                label="Property Owners"
                value={br?.usersByType?.owner ?? 0}
                sub="Registered owners"
                icon={UserCheck}
                accent="#22c55e"
                href="/admin/owners"
                cta="View owners"
              />
              <StatCard
                label="Total Inquiries"
                value={ov?.totalInquiries ?? 0}
                sub={`${pendingInq} pending`}
                icon={MessageSquare}
                accent="#f59e0b"
                href="/admin/inquiries"
                cta="View pipeline"
              />
              <StatCard
                label="Matches"
                value={pm?.totalMatches ?? 0}
                sub={`${pm?.matchSuccessRate?.toFixed(0) ?? 0}% success rate`}
                icon={GitMerge}
                accent="#ec4899"
                href="/admin/matches"
                cta="View matches"
              />
              <StatCard
                label="Conversion Rate"
                value={`${pm?.conversionRate?.toFixed(1) ?? '0.0'}%`}
                sub="Inquiries / users"
                icon={TrendingUp}
                accent="#14b8a6"
              />
            </div>

            {/* Secondary stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Inquiries by Status</p>
                <div className="space-y-2">
                  {Object.entries(br?.inquiriesByStatus ?? {}).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${INQ_STATUS_COLOR[status] || 'text-gray-400 bg-gray-800'}`}>{status}</span>
                      <span className="text-sm font-bold text-white">{count as number}</span>
                    </div>
                  ))}
                  {Object.keys(br?.inquiriesByStatus ?? {}).length === 0 && (
                    <p className="text-xs text-gray-600">No inquiries yet</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Users by Type</p>
                <div className="space-y-2">
                  {(['brand', 'owner', 'admin'] as const).map((type) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${USER_TYPE_COLOR[type] || ''}`}>{type}</span>
                      <span className="text-sm font-bold text-white">{br?.usersByType?.[type] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Properties Status</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Available</span>
                    <span className="text-sm font-bold text-white">{br?.propertiesByStatus?.available ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> Occupied</span>
                    <span className="text-sm font-bold text-white">{br?.propertiesByStatus?.occupied ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-yellow-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                    <span className="text-sm font-bold text-white">
                      {Math.max(0, (ov?.totalProperties ?? 0) - (br?.propertiesByStatus?.available ?? 0) - (br?.propertiesByStatus?.occupied ?? 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">AI Scores</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Avg BFI</span>
                    <span className="text-sm font-bold text-[#FF5200]">{pm?.averageBFI ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Avg PFI</span>
                    <span className="text-sm font-bold text-[#FF5200]">{pm?.averagePFI ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Responded</span>
                    <span className="text-sm font-bold text-white">{respondedInq}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Recent activity columns */}
        {!loading && ra && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent inquiries */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#FF5200]" /> Recent Inquiries
                </h2>
                <button onClick={() => router.push('/admin/inquiries')} className="text-xs text-[#FF5200] hover:underline">View all</button>
              </div>
              <div className="divide-y divide-gray-800">
                {ra.inquiries.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-600">No inquiries yet</p>
                ) : ra.inquiries.slice(0, 6).map((inq) => (
                  <div key={inq.id} className="px-5 py-3 hover:bg-gray-800/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{inq.brand?.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">→ {inq.property?.title}</p>
                      </div>
                      <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${INQ_STATUS_COLOR[inq.status] || 'text-gray-400 bg-gray-800'}`}>
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">{formatDate(inq.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent properties */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#FF5200]" /> New Listings
                </h2>
                <button onClick={() => router.push('/admin/properties')} className="text-xs text-[#FF5200] hover:underline">View all</button>
              </div>
              <div className="divide-y divide-gray-800">
                {ra.properties.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-600">No listings yet</p>
                ) : ra.properties.slice(0, 6).map((p) => (
                  <div key={p.id} className="px-5 py-3 hover:bg-gray-800/40 transition-colors">
                    <p className="text-xs font-semibold text-white truncate">{p.title}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[11px] text-gray-500">{p.city}</p>
                      <p className="text-[11px] font-bold text-[#FF5200]">
                        ₹{p.price ? (p.price >= 100000 ? `${(p.price / 100000).toFixed(1)}L` : p.price.toLocaleString('en-IN')) : '—'}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">{formatDate(p.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* New users */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FF5200]" /> New Users
                </h2>
                <button onClick={() => router.push('/admin/brands')} className="text-xs text-[#FF5200] hover:underline">View all</button>
              </div>
              <div className="divide-y divide-gray-800">
                {ra.users.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-600">No users yet</p>
                ) : ra.users.slice(0, 6).map((u) => (
                  <div key={u.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-800/40 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${USER_TYPE_COLOR[u.userType] || ''}`}>
                      {u.userType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
