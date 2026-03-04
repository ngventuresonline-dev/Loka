'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    PhonePeCheckout?: {
      transact: (opts: {
        tokenUrl: string
        callback: (response: 'USER_CANCEL' | 'CONCLUDED') => void
        type: 'IFRAME'
      }) => void
      closePage?: () => void
    }
  }
}

const CHECKOUT_SCRIPT_SANDBOX = 'https://mercury-stg.phonepe.com/web/bundle/checkout.js'
const CHECKOUT_SCRIPT_PROD = 'https://mercury.phonepe.com/web/bundle/checkout.js'

export interface PhonePeCheckoutProps {
  redirectUrl: string | null
  open: boolean
  onClose: () => void
  onConcluded: () => void
  onCancel: () => void
}

export function PhonePeCheckout({ redirectUrl, open, onClose, onConcluded, onCancel }: PhonePeCheckoutProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isSandbox = process.env.NEXT_PUBLIC_PHONEPE_SANDBOX === 'true'
  const scriptSrc = isSandbox ? CHECKOUT_SCRIPT_SANDBOX : CHECKOUT_SCRIPT_PROD

  useEffect(() => {
    if (!open) return

    const existing = document.querySelector(`script[src="${scriptSrc}"]`)
    if (existing) {
      setScriptLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = scriptSrc
    script.async = true
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => setError('Failed to load PhonePe checkout')
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [open, scriptSrc])

  const handleCallback = useCallback(
    (response: 'USER_CANCEL' | 'CONCLUDED') => {
      if (response === 'USER_CANCEL') {
        onCancel()
      } else {
        onConcluded()
      }
      onClose()
    },
    [onCancel, onConcluded, onClose]
  )

  useEffect(() => {
    if (!open || !redirectUrl || !scriptLoaded || !window.PhonePeCheckout?.transact) {
      setLoading(false)
      if (open && redirectUrl && scriptLoaded && !window.PhonePeCheckout?.transact) {
        setError('PhonePe checkout not ready')
      }
      return
    }

    setError(null)
    setLoading(true)

    const timer = setTimeout(() => {
      try {
        window.PhonePeCheckout!.transact({
          tokenUrl: redirectUrl,
          callback: handleCallback,
          type: 'IFRAME',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to open checkout')
      }
      setLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [open, redirectUrl, scriptLoaded, handleCallback])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Complete Payment</h3>
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#FF5200] border-t-transparent" />
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            <p>{error}</p>
          </div>
        )}
        {!redirectUrl && !loading && (
          <p className="text-gray-500">No payment session. Please try again.</p>
        )}
        <p className="mt-4 text-xs text-gray-400">
          Powered by PhonePe • Secured payment
        </p>
      </div>
    </div>
  )
}
