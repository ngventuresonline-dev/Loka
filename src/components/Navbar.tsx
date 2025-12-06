'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import Button from './ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, isLoggedIn, logout, loading } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    router.push('/')
  }

  return (
    <nav className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-50 bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200/50">
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200]/5 via-transparent to-[#E4002B]/5 rounded-2xl sm:rounded-3xl"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl sm:rounded-2xl flex items-center justify-center mr-2 sm:mr-3 lg:mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#FF5200]/30">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <span className="relative text-white font-black text-xs sm:text-sm lg:text-lg">N&G</span>
              </div>
              <div>
                <h1 className="text-sm sm:text-lg lg:text-2xl font-black text-gray-900">N&G VENTURES</h1>
                <div className="text-[9px] sm:text-[10px] lg:text-xs text-gray-600 font-medium hidden sm:block">Commercial Real Estate</div>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 relative group">
              <span>About</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] group-hover:w-full transition-all duration-300"></div>
            </Link>
            <Link href="/properties" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 relative group">
              <span>Discover</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] group-hover:w-full transition-all duration-300"></div>
            </Link>
            <Link href="/location-intelligence" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 relative group">
              <span>Location Intel</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] group-hover:w-full transition-all duration-300"></div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {mounted && !loading && isLoggedIn && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-gray-100/80 backdrop-blur-sm border border-gray-300/50 rounded-lg sm:rounded-xl hover:bg-gray-200/80 transition-all"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-md sm:rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-gray-900 font-medium text-xs lg:text-sm">{user.name}</div>
                    <div className="text-gray-600 text-[10px] lg:text-xs capitalize">{user.userType}</div>
                  </div>
                  <svg className={`w-4 h-4 text-gray-700 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-2xl py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm text-gray-900 font-medium">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                        <p className="text-xs text-[#FF5200] capitalize font-semibold mt-1">{user.userType}</p>
                      </div>
                      {user.userType === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="font-semibold text-[#FF5200]">Admin Dashboard</span>
                          </div>
                        </Link>
                      )}
                      <Link
                        href="/"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Dashboard
                        </div>
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          My Profile
                        </div>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </div>
                      </Link>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 text-xs sm:text-sm hidden sm:inline">
                  Sign In
                </Link>
                <div className="relative">
                  <Button href="/auth/register" size="sm" className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:from-[#FF6B35] hover:to-[#FF5200] border-0 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-[#FF5200]/30">
                    Get Started
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
