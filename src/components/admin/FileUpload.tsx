'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface FileUploadProps {
  label?: string
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  value?: string[]
  onChange?: (files: string[]) => void
  onFileSelect?: (files: File[]) => Promise<string[]>
}

export default function FileUpload({
  label = 'Upload Files',
  accept = 'image/*',
  multiple = false,
  maxSize = 5,
  value = [],
  onChange,
  onFileSelect
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previews, setPreviews] = useState<string[]>(value)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return

    // Validate file sizes
    const oversized = files.filter(f => f.size > maxSize * 1024 * 1024)
    if (oversized.length > 0) {
      alert(`Some files exceed ${maxSize}MB limit`)
      return
    }

    setUploading(true)

    try {
      // Create previews
      const newPreviews = await Promise.all(
        files.map(file => {
          if (file.type.startsWith('image/')) {
            return new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = (e) => resolve(e.target?.result as string)
              reader.readAsDataURL(file)
            })
          }
          return Promise.resolve(URL.createObjectURL(file))
        })
      )

      // Upload files if handler provided
      let uploadedUrls = newPreviews
      if (onFileSelect) {
        uploadedUrls = await onFileSelect(files)
      }

      const updatedPreviews = multiple ? [...previews, ...uploadedUrls] : uploadedUrls
      setPreviews(updatedPreviews)
      onChange?.(updatedPreviews)
    } catch (error: any) {
      console.error('File upload error:', error)
      alert('Failed to upload files')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = (index: number) => {
    const updated = previews.filter((_, i) => i !== index)
    setPreviews(updated)
    onChange?.(updated)
  }

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      
      <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-[#FF5200] transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          {uploading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200] mx-auto mb-2"></div>
              <p className="text-gray-400">Uploading...</p>
            </div>
          ) : (
            <>
              <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-300 font-medium">Click to upload</p>
              <p className="text-gray-500 text-sm mt-1">or drag and drop</p>
              <p className="text-gray-500 text-xs mt-1">Max {maxSize}MB per file</p>
            </>
          )}
        </label>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              {preview.startsWith('data:image') || preview.startsWith('http') ? (
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

