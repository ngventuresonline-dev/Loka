'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loginUser, initializeAdminAccount } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    // Initialize admin account on page load
    initializeAdminAccount()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Authenticate user
    const result = await loginUser(email, password)

    setLoading(false)

    if (result.success && result.user) {
      // Redirect all users to homepage after login
      // Admins can use navbar to navigate to /admin dashboard
      router.push('/')
    } else {
      console.error('Login failed:', result.error)
      setError(result.error || 'Failed to login')
    }
  }

  const handleAdminLogin = () => {
    setEmail('admin@ngventures.com')
    setPassword('admin123')
  }

  const handleGoogleLogin = () => {
    setError('')
    setLoading(true)
    
    // Google OAuth Configuration
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'demo-client-id'
    const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : ''
    const scope = 'email profile'
    
    // For demo purposes, simulate Google login
    // In production, redirect to Google OAuth:
    // const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
    // window.location.href = googleAuthUrl
    
    // Demo: Show alert with instructions
    alert('🔧 Google Login Setup Required!\n\nTo enable Google login:\n\n1. Go to Google Cloud Console\n2. Create OAuth 2.0 credentials\n3. Add your Client ID to .env.local:\n   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id\n\nFor now, please use email/password login or create a test account.')
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-[#FF5200]/10 to-transparent rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-[#E4002B]/10 to-transparent rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_5s]"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-[#FF6B35]/10 to-transparent rounded-full blur-3xl animate-[float_30s_ease-in-out_infinite_10s]"></div>
      </div>

      {/* Back to Home Link */}
      <div className="absolute top-24 sm:top-6 left-6 z-50">
        <Link 
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 hover:bg-white hover:shadow-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12 pt-32 sm:pt-12">
        <div className="w-full max-w-md">
          {/* Logo/Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF5200]/50">
                <span className="text-white font-black text-xl">N&G</span>
              </div>
              <div className="text-left">
                <div className="text-2xl font-black text-gray-900">N&G VENTURES</div>
                <div className="text-xs text-gray-600">Commercial Real Estate</div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900 placeholder-gray-400"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2 rounded text-[#FF5200] focus:ring-[#FF5200]" 
                  />
                  Remember me
                </label>
                <Link href="/auth/forgot-password" className="text-[#FF5200] hover:text-[#E4002B] transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <div className="px-4 py-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:from-[#FF6B35] hover:to-[#FF5200] text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#FF5200]/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-600">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full px-4 py-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl font-medium text-gray-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-[#FF5200] hover:text-[#E4002B] font-semibold transition-colors">
              Sign up for free
            </Link>
          </p>

          {/* Admin Login Hint */}
          <div className="mt-6 p-4 bg-gradient-to-r from-[#FF5200]/5 to-[#E4002B]/5 backdrop-blur-sm border border-[#FF5200]/30 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#FF5200]/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#FF5200]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-[#FF5200]">Admin Access</p>
                  <button
                    type="button"
                    onClick={handleAdminLogin}
                    className="text-xs px-3 py-1 bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:from-[#FF6B35] hover:to-[#FF5200] text-white rounded-lg transition-colors"
                  >
                    Auto-fill
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  Email: <span className="text-[#FF5200] font-mono">admin@ngventures.com</span>
                  <br />
                  Password: <span className="text-[#FF5200] font-mono">admin123</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
