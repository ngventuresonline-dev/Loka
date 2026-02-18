'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BrandsPricingRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/for-brands')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-500">Redirecting to pricing...</p>
    </div>
  )
}
