'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import AdminSidebar from './AdminSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const { user, isLoggedIn, loading: authLoading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Admin auth check - redirect non-admins to homepage
  useEffect(() => {
    if (!authLoading) {
      console.log('[AdminLayout] Auth check:', { isLoggedIn, userType: user?.userType, user })
      if (!isLoggedIn || user?.userType !== 'admin') {
        console.log('[AdminLayout] User not authorized, redirecting...')
        setIsRedirecting(true)
        router.replace('/')
      }
    }
  }, [isLoggedIn, user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5200] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn || user?.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5200] mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg mb-2">
            {!isLoggedIn 
              ? 'You must be logged in to access the admin panel.' 
              : 'You do not have admin privileges to access this page.'}
          </p>
          <p className="text-gray-500 text-sm">Redirecting to homepage...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">CMS Admin Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Welcome, {user?.name}</span>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            View Site
          </button>
        </div>
      </div>

      {/* Sidebar + Content */}
      <div className="flex pt-16">
        <AdminSidebar />
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

