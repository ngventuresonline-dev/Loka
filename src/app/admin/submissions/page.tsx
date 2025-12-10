'use client'

import AdminLayout from '@/components/admin/AdminLayout'

export default function SubmissionsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Submissions</h1>
          <p className="text-gray-400">Manage all submissions and responses</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <div className="text-center py-12 text-gray-400">
            <p>Submissions management coming soon...</p>
            <p className="text-sm mt-2">Use the Inquiry Management section for now</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

