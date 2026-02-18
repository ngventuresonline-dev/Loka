'use client'

import ExplainerVideo, { VIDEO_VARIANTS } from '@/components/ExplainerVideo'
import { DownloadVideoButton } from '@/components/ExplainerVideo/download'
import { useState } from 'react'

export default function ExplainerVideoPage() {
  const [selectedVariant, setSelectedVariant] = useState<keyof typeof VIDEO_VARIANTS>('full-platform')
  
  // Ensure selectedVariant is valid
  const currentVariant = VIDEO_VARIANTS[selectedVariant] || VIDEO_VARIANTS['complete-flow']

  const introVariants = Object.entries(VIDEO_VARIANTS).filter(([_, v]) => v.type === 'intro')
  const explainerVariants = Object.entries(VIDEO_VARIANTS).filter(([_, v]) => v.type === 'explainer')

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Lokazen Video Variants</h1>
          <p className="text-gray-400">30-second explainer videos - {Object.keys(VIDEO_VARIANTS).length} variants available</p>
        </div>

        {/* Variant Selector */}
        <div className="mb-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Select Variant</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(VIDEO_VARIANTS).map(([key, variant]) => (
              <button
                key={key}
                onClick={() => setSelectedVariant(key as keyof typeof VIDEO_VARIANTS)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedVariant === key
                    ? 'border-[#FF5200] bg-gray-800'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{variant.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    variant.type === 'intro' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {variant.type}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{variant.description}</p>
                <p className="text-xs text-gray-500 mt-2">{variant.totalDuration}s • {variant.scenes.length} scenes</p>
              </button>
            ))}
          </div>
        </div>

        {/* Video Display */}
        <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{currentVariant.name}</h3>
                <p className="text-sm text-gray-400">{currentVariant.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {currentVariant.totalDuration}s • {currentVariant.scenes.length} scene{currentVariant.scenes.length > 1 ? 's' : ''}
                </div>
                <DownloadVideoButton 
                  variant={selectedVariant} 
                  variantName={currentVariant.name}
                />
              </div>
            </div>
          </div>
          <ExplainerVideo 
            variant={selectedVariant} 
            autoPlay={true}
            className="w-full"
          />
          {selectedVariant === 'full-platform' && (
            <div className="p-4 sm:p-6 bg-gray-800/50 border-t border-gray-700">
              <h4 className="text-sm font-semibold text-white mb-2">Voiceover transcript (30–45s)</h4>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Finding the right retail space is tough for brands. And property owners? They&apos;re swamped with the wrong leads. Lokazen fixes that. One platform for both. Brands share what they need—location, size, budget, footfall. Owners list their spaces with real details. Our AI matches them. No endless calls, no wasted site visits. Just scored matches, location intelligence, and a clear path from interest to deal. Whether you&apos;re a brand looking for your next store or an owner with space to fill—Lokazen is where it happens. Get started today.
              </p>
            </div>
          )}
        </div>

        {/* Variant Lists */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Introductory Variants ({introVariants.length})</h3>
            <div className="space-y-2">
              {introVariants.map(([key, variant]) => (
                <div key={key} className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{variant.name}</span>
                    <button
                      onClick={() => setSelectedVariant(key as keyof typeof VIDEO_VARIANTS)}
                      className="text-xs text-[#FF5200] hover:text-[#E4002B] transition-colors"
                    >
                      View →
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{variant.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Explainer Variants ({explainerVariants.length})</h3>
            <div className="space-y-2">
              {explainerVariants.map(([key, variant]) => (
                <div key={key} className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{variant.name}</span>
                    <button
                      onClick={() => setSelectedVariant(key as keyof typeof VIDEO_VARIANTS)}
                      className="text-xs text-[#FF5200] hover:text-[#E4002B] transition-colors"
                    >
                      View →
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{variant.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}