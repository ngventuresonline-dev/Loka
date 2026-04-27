'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  BarChart3,
  MessageSquare,
  GitMerge,
  FileText,
  Image,
  Settings,
  Activity,
  LogOut,
  Eye,
  ChevronRight,
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/activity', label: 'Activity', icon: Activity },
    ],
  },
  {
    label: 'Listings',
    items: [
      { href: '/admin/properties', label: 'Properties', icon: Building2 },
      { href: '/admin/owners', label: 'Owners', icon: UserCheck },
      { href: '/admin/brands', label: 'Brands', icon: Users },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
      { href: '/admin/matches', label: 'Matches', icon: GitMerge },
      { href: '/admin/submissions', label: 'Submissions', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/media', label: 'Media', icon: Image },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoggedIn, loading: authLoading, logout } = useAuth()

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || user?.userType !== 'admin')) {
      router.replace('/')
    }
  }, [isLoggedIn, user, authLoading, router])

  const handleLogout = () => {
    logout()
    router.replace('/auth/login')
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5200] mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn || user?.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5200] mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">
            {!isLoggedIn
              ? 'You must be logged in to access the admin panel.'
              : 'You do not have admin privileges to access this page.'}
          </p>
          <p className="text-gray-500 text-sm">Redirecting...</p>
          {!isLoggedIn && (
            <button
              onClick={() => router.push('/auth/login')}
              className="mt-4 px-6 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors"
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
          <Logo size="sm" showText={true} href="/admin" variant="dark" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-auto">Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 px-2 mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon, exact }) => {
                  const active = isActive(href, exact)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group ${
                        active
                          ? 'bg-[#FF5200]/15 text-[#FF5200] font-semibold'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#FF5200]' : 'text-gray-500 group-hover:text-gray-300'}`} />
                      <span>{label}</span>
                      {active && <ChevronRight className="w-3 h-3 ml-auto text-[#FF5200]/60" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: user + actions */}
        <div className="border-t border-gray-800 p-3 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Eye className="w-4 h-4 flex-shrink-0 text-gray-500" />
            <span>View Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Log Out</span>
          </button>
          <div className="flex items-center gap-2.5 px-2.5 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-30 h-14 bg-gray-950/95 backdrop-blur border-b border-gray-800 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Admin</span>
            {pathname !== '/admin' && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-white capitalize">
                  {pathname.replace('/admin/', '').replace(/\//g, ' › ').replace(/-/g, ' ')}
                </span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Logged in as <span className="text-gray-300">{user?.email}</span>
          </div>
        </div>

        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
