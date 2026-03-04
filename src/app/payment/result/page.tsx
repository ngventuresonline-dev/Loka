'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function ResultContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const merchantOrderId = searchParams.get('merchantOrderId') || searchParams.get('merchant_order_id')
  const state = searchParams.get('state')

  useEffect(() => {
    if (state === 'COMPLETED') {
      setStatus('success')
      return
    }
    if (state === 'FAILED') {
      setStatus('failed')
      return
    }

    if (!merchantOrderId) {
      setStatus('failed')
      setError('Missing order reference')
      return
    }

    const checkStatus = async () => {
      try {
        const base = typeof window !== 'undefined' ? window.location.origin : ''
        const res = await fetch(`${base}/api/payments/phonepe/status?merchantOrderId=${encodeURIComponent(merchantOrderId)}`)
        const json = await res.json()

        if (json.success && json.state === 'COMPLETED') {
          setStatus('success')
        } else if (json.success && json.state === 'FAILED') {
          setStatus('failed')
        } else if (json.success) {
          setStatus('failed')
          setError('Payment is still pending')
        } else {
          setStatus('failed')
          setError(json.error || 'Could not verify payment')
        }
      } catch (err) {
        setStatus('failed')
        setError(err instanceof Error ? err.message : 'Verification failed')
      }
    }

    checkStatus()
  }, [merchantOrderId, state])

  if (status === null || status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#FF5200] border-t-transparent" />
          <p className="mt-4 text-gray-400">Verifying your payment...</p>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        {status === 'success' ? (
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
              <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Payment Successful</h1>
            <p className="mt-2 max-w-md text-center text-gray-400">
              Your payment has been completed. You will receive a confirmation shortly.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center rounded-xl bg-gradient-to-r from-[#FF5200] to-[#E4002B] px-6 py-3 font-semibold text-white hover:opacity-95"
            >
              Return to Home
            </Link>
          </>
        ) : (
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Payment Failed</h1>
            <p className="mt-2 max-w-md text-center text-gray-400">
              {error || 'Your payment could not be completed. Please try again.'}
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center rounded-xl border border-gray-600 px-6 py-3 font-semibold text-white hover:bg-gray-800"
            >
              Return to Home
            </Link>
          </>
        )}
      </div>
      <Footer />
    </main>
  )
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-950">
          <Navbar />
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#FF5200] border-t-transparent" />
          </div>
          <Footer />
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  )
}
