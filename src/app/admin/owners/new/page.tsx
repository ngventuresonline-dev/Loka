'use client'

import AdminLayout from '@/components/admin/AdminLayout'

export default function NewOwnerPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Add New Owner</h1>
          <p className="text-gray-400">Create a new property owner account</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <div className="text-center py-12 text-gray-400">
            <p>Owner creation form coming soon...</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

