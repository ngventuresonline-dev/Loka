'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InquiriesRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/inquiries')
  }, [router])
  return (
    <div className="flex justify-center items-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
    </div>
  )
}
