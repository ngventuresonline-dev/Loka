'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const OwnerPortalDashboard = dynamic(
  () => import('@/components/owner-portal/OwnerPortalDashboard'),
  { ssr: false, loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
      Loading portal…
    </div>
  ) },
)

export default function OwnerProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
          Loading…
        </div>
      }
    >
      <OwnerPortalDashboard />
    </Suspense>
  )
}
