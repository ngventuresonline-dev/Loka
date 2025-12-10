'use client'

import AdminLayout from '@/components/admin/AdminLayout'

export default function MediaPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Media Library</h1>
          <p className="text-gray-400">Manage all media files and images</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400 text-lg mb-2">Media Library</p>
            <p className="text-gray-500 text-sm">Upload and manage images, documents, and other media files</p>
            <p className="text-gray-500 text-sm mt-4">Coming soon...</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

