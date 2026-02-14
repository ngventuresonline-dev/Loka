'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSignup, setShowSignup] = useState(false)
  const router = useRouter()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setShowSignup(false)

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/\D/g, '')

    if (normalizedPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/profile/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone })
      })

      const data = await response.json()

      if (data.found) {
        // Route based on user type
        if (data.userType === 'owner') {
          router.push(`/profile/owner?userId=${data.userId}`)
          onClose()
        } else if (data.userType === 'brand') {
          router.push(`/profile/brand?userId=${data.userId}`)
          onClose()
        }
      } else {
        // Not found - show signup options
        setShowSignup(true)
        setError('')
      }
    } catch (err) {
      console.error('[ProfileModal] Lookup error:', err)
      setError('Error looking up profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignupClick = (type: 'brand' | 'owner') => {
    onClose()
    if (type === 'brand') {
      router.push('/onboarding/brand')
    } else {
      router.push('/filter/owner')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Your Profile</h2>
        <p className="text-gray-600 mb-6">
          Enter your phone number to access your dashboard
        </p>

        {!showSignup ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  if (value.length <= 10) {
                    setPhone(value)
                    setError('')
                  }
                }}
                pattern="[0-9]{10}"
                maxLength={10}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF5200] focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Looking up...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium mb-2">No account found</p>
              <p className="text-sm text-yellow-700">Get started by creating an account:</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleSignupClick('brand')}
                className="w-full p-4 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>I'm looking for space (Brand)</span>
              </button>

              <button
                onClick={() => handleSignupClick('owner')}
                className="w-full p-4 bg-white border-2 border-gray-300 text-gray-900 rounded-xl font-semibold hover:border-[#FF5200] hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>I want to list property (Owner)</span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowSignup(false)
                setPhone('')
                setError('')
              }}
              className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Try different number
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
