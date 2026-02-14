'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateSessionId } from '@/lib/session-utils'
import { useSessionTracking } from '@/hooks/useSessionTracking'

interface ProfileTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: 'brand' | 'owner') => void
}

export default function ProfileTypeModal({ isOpen, onClose, onSelect }: ProfileTypeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Profile Type</h2>
        <p className="text-gray-600 mb-6">
          Are you a Brand looking for space or a Property Owner?
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              onSelect('brand')
              onClose()
            }}
            className="w-full p-4 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Brand - Looking For Space</span>
          </button>
          
          <button
            onClick={() => {
              onSelect('owner')
              onClose()
            }}
            className="w-full p-4 bg-white border-2 border-gray-300 text-gray-900 rounded-xl font-semibold hover:border-[#FF5200] hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Property Owner</span>
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
