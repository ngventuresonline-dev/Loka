'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import InquiryManagementTable from '@/components/admin/InquiryManagementTable'
import { useAuth } from '@/contexts/AuthContext'

export default function InquiriesPage() {
  const { user } = useAuth()

  if (!user?.id || !user?.email) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Inquiries Pipeline</h1>
          <p className="text-gray-400">Brand → Property connections · status tracking · notes</p>
        </div>

        <InquiryManagementTable userId={user.id} userEmail={user.email} />
      </div>
    </AdminLayout>
  )
}
