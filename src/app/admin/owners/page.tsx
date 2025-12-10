'use client'

import AdminLayout from '@/components/admin/AdminLayout'

export default function OwnersPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Owners</h1>
            <p className="text-gray-400">Manage all property owner accounts</p>
          </div>
          <button
            onClick={() => {}}
            className="px-4 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors text-sm font-medium"
          >
            Add New Owner
          </button>
        </div>

        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <div className="text-center py-12 text-gray-400">
            <p>Owner management coming soon...</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

