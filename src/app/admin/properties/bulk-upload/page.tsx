'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'

interface BulkResult {
  success: boolean
  inserted: number
  skipped: number
  errors: { row: number; error: string }[]
}

export default function BulkUploadPropertiesPage() {
  const { user, isLoggedIn } = useAuth()
  const [rowsPreview, setRowsPreview] = useState<any[]>([])
  const [rowsToUpload, setRowsToUpload] = useState<any[]>([])
  const [parsing, setParsing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<BulkResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isLoggedIn || user?.userType !== 'admin') {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-gray-300">You must be logged in as an admin to use bulk upload.</p>
        </div>
      </AdminLayout>
    )
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setParsing(true)
    setError(null)
    setResult(null)
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
      if (lines.length < 2) {
        setError('CSV must contain a header row and at least one data row')
        setParsing(false)
        return
      }

      const headers = lines[0].split(',').map(h => h.trim())
      const rows = lines.slice(1).map((line) => {
        const cells = line.split(',')
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = (cells[index] ?? '').trim()
        })
        return row
      })

      setRowsPreview(rows.slice(0, 20))
      setRowsToUpload(rows)
    } catch (err: any) {
      console.error('Error parsing CSV:', err)
      setError(err.message || 'Failed to parse CSV file')
    } finally {
      setParsing(false)
    }
  }

  const handleUpload = async () => {
    if (rowsToUpload.length === 0) {
      setError('No rows to upload. Please select a CSV file first.')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/properties/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rows: rowsToUpload }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Bulk upload failed')
        return
      }

      setResult(data)
    } catch (err: any) {
      console.error('Bulk upload error:', err)
      setError(err.message || 'Bulk upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Bulk Upload Properties</h1>
            <p className="text-gray-400">
              Upload a CSV file to create or update multiple properties at once.
            </p>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">1. Download CSV Template</h2>
            <p className="text-gray-400 text-sm mb-3">
              The CSV should have these columns:
            </p>
            <code className="block bg-gray-800 text-gray-100 text-xs p-3 rounded">
              id,title,address,city,state,zipCode,price,priceType,size,propertyType,ownerName,ownerEmail,isFeatured,availability,images,amenities,displayOrder
            </code>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">2. Upload CSV</h2>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="text-gray-200"
            />
            {parsing && (
              <p className="text-gray-400 text-sm mt-2">Parsing CSV...</p>
            )}
          </div>

          {rowsPreview.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">3. Preview (first 20 rows)</h2>
              <div className="max-h-80 overflow-auto border border-gray-800 rounded">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-800">
                    <tr>
                      {Object.keys(rowsPreview[0]).map((header) => (
                        <th key={header} className="px-2 py-2 text-left text-gray-300 font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rowsPreview.map((row, index) => (
                      <tr key={index} className="border-b border-gray-800">
                        {Object.keys(row).map((key) => (
                          <td key={key} className="px-2 py-1 text-gray-200">
                            {row[key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleUpload}
              disabled={uploading || rowsToUpload.length === 0}
              className="px-6 py-3 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {uploading ? 'Uploading...' : `Upload ${rowsToUpload.length} rows`}
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>

          {result && (
            <div className="mt-4 bg-gray-800/60 border border-gray-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Upload Summary</h3>
              <p className="text-gray-300 text-sm mb-1">Inserted: {result.inserted}</p>
              <p className="text-gray-300 text-sm mb-3">Skipped: {result.skipped}</p>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-red-300 text-sm mb-1">Errors:</p>
                  <ul className="list-disc list-inside text-xs text-red-300 max-h-40 overflow-auto">
                    {result.errors.map((e, idx) => (
                      <li key={idx}>
                        Row {e.row}: {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}


