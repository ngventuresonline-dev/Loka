'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

function SuccessRedirect() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const merchantOrderId = searchParams.get('merchantOrderId') || searchParams.get('merchant_order_id')
    const q = merchantOrderId ? `?merchantOrderId=${encodeURIComponent(merchantOrderId)}` : '?state=COMPLETED'
    window.location.replace(`/payment/result${q}`)
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#FF5200] border-t-transparent" />
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#FF5200] border-t-transparent" />
        </div>
      }
    >
      <SuccessRedirect />
    </Suspense>
  )
}
