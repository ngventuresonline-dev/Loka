'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DynamicBackground from '@/components/DynamicBackground'

export default function BrandThankYou() {
  const router = useRouter()

  return (
    <div className="min-h-screen relative">
      <DynamicBackground />
      <Navbar />

      <div className="relative z-10 pt-28 sm:pt-32 md:pt-36 pb-20 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-200">
          <div className="mb-6 flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#FF5200] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Home</span>
            </button>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Thank you! We&apos;re finding the best spaces for you.
            </h1>
            <p className="text-gray-700">
              We&apos;ve received your requirements. Our matching engine is prioritizing your request and we&apos;ll
              share curated options shortly. You&apos;ll also get an email with next steps.
            </p>
            <div className="rounded-xl bg-gradient-to-r from-[#FF5200]/10 to-[#E4002B]/10 border border-[#FF5200]/20 p-4">
              <p className="text-sm text-gray-700">
                Want to tweak your preferences? You can update them anytime from your brand profile.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/"
                className="px-5 py-3 rounded-lg bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white font-semibold shadow hover:shadow-lg transition-all"
              >
                Go to Home
              </Link>
              <Link
                href="/onboarding/brand"
                className="px-5 py-3 rounded-lg border-2 border-[#FF5200]/60 text-[#FF5200] font-semibold hover:bg-[#FF5200]/5 transition-all"
              >
                Update Preferences
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

