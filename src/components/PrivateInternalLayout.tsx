'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

/**
 * Wraps pages that are for internal use only (admin or shared links).
 * Redirects to login if not authenticated, shows access denied if not admin.
 */
export default function PrivateInternalLayout({ children }: { children: ReactNode }) {
  const { user, isLoggedIn, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!isLoggedIn) {
      router.replace('/auth/login')
      return
    }
    if (user?.userType !== 'admin') {
      // Stay on page but we'll show access denied below
    }
  }, [loading, isLoggedIn, user?.userType, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#FF5200] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null // Redirecting to login
  }

  if (user?.userType !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access restricted</h1>
          <p className="text-gray-600 mb-6">This page is for internal use only.</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#FF5200] text-white font-medium hover:bg-[#E4002B] transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
