'use client'

import AdminLayout from '@/components/admin/AdminLayout'

export default function ResponsesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Responses</h1>
          <p className="text-gray-400">Manage inquiry responses</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <div className="text-center py-12 text-gray-400">
            <p>Response management coming soon...</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

