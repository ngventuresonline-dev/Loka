'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

function FailureRedirect() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const merchantOrderId = searchParams.get('merchantOrderId') || searchParams.get('merchant_order_id')
    const q = merchantOrderId ? `?merchantOrderId=${encodeURIComponent(merchantOrderId)}` : '?state=FAILED'
    window.location.replace(`/payment/result${q}`)
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
    </div>
  )
}

export default function PaymentFailurePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
        </div>
      }
    >
      <FailureRedirect />
    </Suspense>
  )
}
