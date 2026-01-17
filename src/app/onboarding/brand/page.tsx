'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DynamicBackground from '@/components/DynamicBackground'

const audiencePresets = [
  'Young professionals',
  'College students',
  'Families with kids',
  'High-income shoppers',
  'Health-conscious',
  'Tourists',
  'Office crowd',
  'Evening diners',
  'Budget-conscious'
]

function BrandOnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [selectedSizeRanges, setSelectedSizeRanges] = useState<Set<string>>(new Set())
  const [selectedAudience, setSelectedAudience] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    brandName: '',
    storeType: '',
    size: '',
    budgetMin: '',
    budgetMax: '',
    targetAudience: '',
    preferredLocations: '',
    additionalRequirements: ''
  })

  // Load pre-filled data from filter page
  useEffect(() => {
    const prefilled = searchParams.get('prefilled')
    if (prefilled === 'true') {
      try {
        const storedData = localStorage.getItem('brandFilterData')
        if (storedData) {
          const filterData = JSON.parse(storedData)
          
          // Map business type to store type
          const businessTypeMap: Record<string, string> = {
            'Café/QSR': 'qsr',
            'Restaurant': 'restaurant',
            'Retail': 'retail',
            'Bar/Brewery': 'bar',
            'Gym': 'fitness',
            'Entertainment': 'other',
            'Others': 'other'
          }
          
          const businessType = Array.isArray(filterData.businessType) 
            ? filterData.businessType[0] 
            : filterData.businessType || ''
          
          setFormData(prev => ({
            ...prev,
            storeType: businessTypeMap[businessType] || '',
            budgetMin: filterData.budgetMin ? `₹${filterData.budgetMin.toLocaleString('en-IN')}` : prev.budgetMin,
            budgetMax: filterData.budgetMax ? `₹${filterData.budgetMax.toLocaleString('en-IN')}` : prev.budgetMax,
            preferredLocations: filterData.locations && Array.isArray(filterData.locations) 
              ? filterData.locations.join(', ') 
              : prev.preferredLocations
          }))
          
          // Set size ranges
          if (filterData.sizeRanges && filterData.sizeRanges.length > 0) {
            setSelectedSizeRanges(new Set(filterData.sizeRanges))
            setFormData(prev => ({
              ...prev,
              size: filterData.sizeRanges.join(', ')
            }))
          }
          
          // Clear stored data after loading
          localStorage.removeItem('brandFilterData')
        }
      } catch (error) {
        console.error('Error loading pre-filled data:', error)
      }
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const toggleAudience = (item: string) => {
    const next = new Set(selectedAudience)
    if (next.has(item)) {
      next.delete(item)
    } else {
      next.add(item)
    }
    setSelectedAudience(next)
    const generated =
      next.size > 0
        ? Array.from(next).join(', ')
        : ''
    setFormData(prev => ({
      ...prev,
      targetAudience: generated || prev.targetAudience
    }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Build query params to show matching properties
    // Parse size ranges to find overall min/max
    const parseSizeRanges = (ranges: Set<string>) => {
      if (ranges.size === 0) return { min: 0, max: 100000 }
      let globalMin = Number.MAX_SAFE_INTEGER
      let globalMax = 0
      ranges.forEach(range => {
        if (range.includes('-')) {
          const [minStr, maxStr] = range.split('-')
          const min = parseInt(minStr.replace(/[^0-9]/g, '')) || 0
          const max = parseInt(maxStr.replace(/[^0-9]/g, '')) || 0
          globalMin = Math.min(globalMin, min)
          globalMax = Math.max(globalMax, max)
        } else if (range.includes('+')) {
          const min = parseInt(range.replace(/[^0-9]/g, '')) || 0
          globalMin = Math.min(globalMin, min)
          globalMax = Math.max(globalMax, 100000)
        }
      })
      if (globalMin === Number.MAX_SAFE_INTEGER) globalMin = 0
      if (globalMax === 0) globalMax = 100000
      return { min: globalMin, max: globalMax }
    }

    const sizeRange = parseSizeRanges(selectedSizeRanges)
    const budgetMinNum = parseInt(formData.budgetMin.replace(/[^0-9]/g, '')) || 50000
    const budgetMaxNum = parseInt(formData.budgetMax.replace(/[^0-9]/g, '')) || budgetMinNum + 5000

    const params = new URLSearchParams()
    if (formData.storeType) params.set('type', formData.storeType)
    if (formData.preferredLocations) params.set('locations', formData.preferredLocations)
    params.set('sizeMin', sizeRange.min.toString())
    params.set('sizeMax', sizeRange.max.toString())
    params.set('budgetMin', budgetMinNum.toString())
    params.set('budgetMax', budgetMaxNum.toString())
    // Save for future prefill if needed
    localStorage.setItem('brandOnboardingSubmission', JSON.stringify(formData))
    
    // Track form completion and Lead event
    const { trackFormComplete } = await import('@/lib/tracking')
    trackFormComplete('brand', formData)
    
    router.push(`/properties/results?${params.toString()}`)
  }

  return (
    <div className="min-h-screen relative">
      <DynamicBackground />
      <Navbar />
      
      <div className="relative z-10 pt-28 sm:pt-32 md:pt-36 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back to Home Button */}
          <button
            onClick={() => router.push('/')}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[#FF5200] transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Home</span>
          </button>
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-600">Step {step} of 3</span>
              <span className="text-sm font-medium text-gray-600">{Math.round((step / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] h-2 rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-200">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Brand Onboarding
              </h1>
              <p className="text-gray-600">Tell us about your requirements and we&apos;ll find the perfect spaces for you</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-6 animate-[fadeInUp_0.5s_ease-out]">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors"
                      placeholder="Enter your brand name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Store Type *
                    </label>
                    <select
                      name="storeType"
                      value={formData.storeType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors"
                    >
                      <option value="">Select store type</option>
                      <option value="qsr">Quick Service Restaurant (QSR)</option>
                      <option value="cafe">Café</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="retail">Retail Store</option>
                      <option value="bar">Bar/Pub</option>
                      <option value="fitness">Fitness Studio</option>
                      <option value="salon">Salon/Spa</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Required Space Size (sq ft) * <span className="text-xs text-gray-500 font-normal">(You can select multiple ranges)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                      {['100-500 sqft', '500-1,000 sqft', '1,000-2,000 sqft', '2,000-5,000 sqft', '5,000-10,000 sqft', '10,000+ sqft'].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => {
                            const newSet = new Set(selectedSizeRanges)
                            if (newSet.has(range)) {
                              newSet.delete(range)
                            } else {
                              newSet.add(range)
                            }
                            setSelectedSizeRanges(newSet)
                            setFormData(prev => ({
                              ...prev,
                              size: Array.from(newSet).join(', ')
                            }))
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedSizeRanges.has(range)
                              ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white shadow-lg'
                              : 'bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-[#FF5200]'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors"
                      placeholder="Selected size ranges will appear here"
                      readOnly
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Budget & Audience */}
              {step === 2 && (
                <div className="space-y-6 animate-[fadeInUp_0.5s_ease-out]">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Monthly Budget Range (₹) *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                          type="text"
                          name="budgetMin"
                          value={formData.budgetMin}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors"
                          placeholder="₹50,000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                    <input
                      type="text"
                          name="budgetMax"
                          value={formData.budgetMax}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors"
                          placeholder="₹2,00,000"
                    />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Minimum rent: ₹50,000</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target Audience *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {audiencePresets.map((item) => {
                        const active = selectedAudience.has(item)
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleAudience(item)}
                            className={`px-3 py-2 rounded-full text-sm font-medium transition-all border ${
                              active
                                ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white border-transparent shadow'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#FF5200]'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      })}
                    </div>
                    <textarea
                      name="targetAudience"
                      value={formData.targetAudience}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors resize-none"
                      placeholder="Describe your target customers (age, income level, preferences, etc.)"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Location Preferences */}
              {step === 3 && (
                <div className="space-y-6 animate-[fadeInUp_0.5s_ease-out]">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preferred Locations *
                    </label>
                    <textarea
                      name="preferredLocations"
                      value={formData.preferredLocations}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors resize-none"
                      placeholder="e.g., Indiranagar, Koramangala, Whitefield (Bangalore)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Additional Requirements
                    </label>
                    <textarea
                      name="additionalRequirements"
                      value={formData.additionalRequirements}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors resize-none"
                      placeholder="Any specific requirements (parking, foot traffic, visibility, etc.)"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition-all"
                  >
                    Back
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-[1.02]"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-[1.02]"
                  >
                    Submit & Find Matches
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* AI Matching Info */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Matching</h3>
                <p className="text-sm text-gray-600">
                  Our AI will analyze your requirements and match you with the best properties based on location intelligence, footfall data, demographics, and more.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BrandOnboarding() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BrandOnboardingContent />
    </Suspense>
  )
}
