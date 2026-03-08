'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getBrandLogo, getBrandInitial } from '@/lib/brand-logos'

export default function OnboardingBrandCard({ brand }: { brand: any }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const matchScore = brand.matchScore || Math.floor(Math.random() * 30) + 70
  const logoPath = getBrandLogo(brand.name)
  const brandInitial = getBrandInitial(brand.name)

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative bg-white border border-gray-200 rounded-full px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-[#FF5200]/50 flex items-center gap-2 sm:gap-3 whitespace-nowrap w-full text-left"
      >
        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF5200] via-[#FF6B35] to-[#E4002B] flex-shrink-0" />
        {logoPath ? (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-white flex items-center justify-center flex-shrink-0">
            <Image
              src={logoPath}
              alt={brand.name || 'Brand'}
              width={32}
              height={32}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center text-white text-xs font-bold">${brandInitial}</div>`
                }
              }}
            />
          </div>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {brandInitial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-semibold text-gray-900 truncate">{brand.name || 'Brand Name'}</h3>
            <div className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
              matchScore >= 90 ? 'bg-green-100 text-green-700' :
              matchScore >= 80 ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {matchScore}%
            </div>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="mt-2 bg-white border border-gray-200 rounded-xl p-3 shadow-md animate-[fadeInUp_0.3s_ease-out]">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <span className="font-medium text-gray-900">{brand.businessType || 'Business Type'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-600">
                <svg className="w-3 h-3 text-[#FF5200] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="truncate">{brand.sizeRange || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <svg className="w-3 h-3 text-[#FF5200] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="truncate">{brand.budgetRange || 'N/A'}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 space-y-1.5">
              {brand.propertyTypes && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Property Type:</span>
                  <span className="font-medium text-gray-900 text-right">{brand.propertyTypes.join(', ')}</span>
                </div>
              )}
              {brand.locations && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-gray-900 text-right">{brand.locations.join(', ')}</span>
                </div>
              )}
              {brand.leaseTerm && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Lease Term:</span>
                  <span className="font-medium text-gray-900">{brand.leaseTerm}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
