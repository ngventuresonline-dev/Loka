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
  const [scriptFailed, setScriptFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const redirectedRef = useRef(false)

  const isSandbox = process.env.NEXT_PUBLIC_PHONEPE_SANDBOX === 'true'
  const scriptSrc = isSandbox ? CHECKOUT_SCRIPT_SANDBOX : CHECKOUT_SCRIPT_PROD

  // Load checkout script
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
    script.onerror = () => {
      // Script failed to load (e.g. production script on localhost)
      // Fall back to redirect mode
      setScriptFailed(true)
      setLoading(false)
    }
    document.body.appendChild(script)
    return () => {
      try { document.body.removeChild(script) } catch {}
    }
  }, [open, scriptSrc])

  // Fallback: redirect to PhonePe payment page when iframe script fails
  useEffect(() => {
    if (!open || !redirectUrl || !scriptFailed || redirectedRef.current) return
    // Auto-redirect after a short delay so user sees the modal briefly
    const timer = setTimeout(() => {
      redirectedRef.current = true
      window.location.href = redirectUrl
    }, 500)
    return () => clearTimeout(timer)
  }, [open, redirectUrl, scriptFailed])

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

  // Open iframe checkout when script is ready
  useEffect(() => {
    if (!open || !redirectUrl || !scriptLoaded || !window.PhonePeCheckout?.transact) {
      setLoading(false)
      if (open && redirectUrl && scriptLoaded && !window.PhonePeCheckout?.transact) {
        // Script loaded but PhonePeCheckout not available — fall back to redirect
        setScriptFailed(true)
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
        // Iframe failed — fall back to redirect
        setScriptFailed(true)
      }
      setLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [open, redirectUrl, scriptLoaded, handleCallback])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setScriptFailed(false)
      setScriptLoaded(false)
      setLoading(true)
      setError(null)
      redirectedRef.current = false
    }
  }, [open])

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

        {/* Loading state */}
        {loading && !scriptFailed && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#FF5200] border-t-transparent" />
          </div>
        )}

        {/* Redirect fallback — when iframe can't load (e.g. localhost or blocked domain) */}
        {scriptFailed && redirectUrl && (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#FF5200] border-t-transparent" />
            <p className="text-center text-gray-600">Redirecting to PhonePe...</p>
            <a
              href={redirectUrl}
              className="mt-2 inline-flex items-center rounded-xl bg-gradient-to-r from-[#5b2d8e] to-[#7b3fa0] px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Pay with PhonePe
            </a>
          </div>
        )}

        {/* Error state */}
        {error && !scriptFailed && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {!redirectUrl && !loading && !scriptFailed && (
          <p className="text-gray-500">No payment session. Please try again.</p>
        )}
        <p className="mt-4 text-xs text-gray-400">
          Powered by PhonePe • Secured payment
        </p>
      </div>
    </div>
  )
}
