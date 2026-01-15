'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createUser } from '@/lib/auth'
import Logo from '@/components/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'brand' as 'brand' | 'owner'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    // Create account
    const result = await createUser(
      formData.email,
      formData.password,
      formData.name,
      formData.userType,
      formData.phone
    )

    setLoading(false)

    if (result.success) {
      // Redirect to onboarding based on user type
      if (formData.userType === 'brand') {
        router.push('/?step=brand-onboarding')
      } else {
        router.push('/?step=owner-onboarding')
      }
    } else {
      setError(result.error || 'Failed to create account')
    }
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
            <div className="flex justify-center mb-6">
              <Logo size="lg" showText={true} href="/" variant="light" />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">Join Lokazen today</p>
          </div>

          {/* Register Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* User Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">I am a:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, userType: 'brand' }))}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      formData.userType === 'brand'
                        ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Brand
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, userType: 'owner' }))}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      formData.userType === 'owner'
                        ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Property Owner
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900 placeholder-gray-400"
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900 placeholder-gray-400"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900 placeholder-gray-400"
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">Minimum 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
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
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Terms */}
              <p className="text-xs text-center text-gray-600">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-[#FF5200] hover:text-[#E4002B]">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-[#FF5200] hover:text-[#E4002B]">Privacy Policy</Link>
              </p>
            </form>
          </div>

          {/* Sign In Link */}
          <p className="text-center mt-6 text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#FF5200] hover:text-[#E4002B] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
