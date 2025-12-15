'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DynamicBackground from '@/components/DynamicBackground'

function BrandCard({ brand }: { brand: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const matchScore = brand.matchScore || Math.floor(Math.random() * 30) + 70 // Fallback for demo
  
  return (
    <div className="group relative">
      {/* Compact capsule/button style card */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative bg-white border border-gray-200 rounded-full px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-[#FF5200]/50 flex items-center gap-2 sm:gap-3 whitespace-nowrap"
      >
        {/* Gradient accent dot */}
        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF5200] via-[#FF6B35] to-[#E4002B] flex-shrink-0"></div>
        
        {/* Brand logo/initial - smaller */}
        <div className="w-8 h-8 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {brand.name?.charAt(0) || 'B'}
        </div>
        
        {/* Brand name - compact */}
        <div className="flex-1 min-w-0 text-left">
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
        
        {/* Dropdown arrow */}
        <svg 
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Expandable requirements section - appears below */}
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

function OwnerOnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [matchingBrands, setMatchingBrands] = useState<any[]>([])
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [formData, setFormData] = useState({
    propertyType: '',
    location: '',
    latitude: '',
    longitude: '',
    size: '',
    rent: '',
    deposit: '',
    amenities: '',
    description: '',
    photos: [] as File[],
    videos: [] as File[]
  })


  // Map display names from filter page to internal property type values
  const mapPropertyTypeDisplayToValue = (displayName: string): string => {
    const mapping: Record<string, string> = {
      'Standalone': 'standalone',
      'Retail Space': 'retail',
      'Office': 'office',
      'Food Court': 'restaurant',
      'Mall Space': 'mall',
      'Warehouse': 'warehouse',
      'Land': 'other',
      'Restaurant Space': 'restaurant',
      'Stall Space': 'kiosk',
      'Other': 'other'
    }
    return mapping[displayName] || displayName.toLowerCase().replace(/\s+/g, '_')
  }

  // Load pre-filled data from filter page
  useEffect(() => {
    const prefilled = searchParams.get('prefilled')
    if (prefilled === 'true') {
      try {
        const storedData = localStorage.getItem('ownerFilterData')
        if (storedData) {
          const filterData = JSON.parse(storedData)
          
          // Map property type display name to internal value
          const mappedPropertyType = filterData.propertyType 
            ? mapPropertyTypeDisplayToValue(filterData.propertyType)
            : ''
          
          setFormData(prev => ({
            ...prev,
            propertyType: mappedPropertyType || prev.propertyType,
            location: filterData.locations?.[0] || prev.location,
            size: filterData.size ? `${filterData.size} sq ft` : prev.size,
            rent: filterData.rent ? `₹${filterData.rent.toLocaleString()}` : prev.rent,
            deposit: filterData.deposit ? `₹${parseInt(filterData.deposit.replace(/[^0-9]/g, '') || '0').toLocaleString('en-IN')}` : prev.deposit,
            amenities: filterData.features ? filterData.features.join(', ') : prev.amenities
          }))
          
          // Clear stored data after loading
          localStorage.removeItem('ownerFilterData')
          
          // Generate AI description (use mapped property type)
          generatePropertyDescription({
            ...filterData,
            propertyType: mappedPropertyType || filterData.propertyType
          })
          
          // Fetch matching brands (use mapped property type)
          fetchMatchingBrands({
            ...filterData,
            propertyType: mappedPropertyType || filterData.propertyType
          })
        }
      } catch (error) {
        console.error('Error loading pre-filled data:', error)
      }
    }
  }, [searchParams])
  
  const generatePropertyDescription = async (filterData: any) => {
    try {
      setGeneratingDescription(true)
      const response = await fetch('/api/property/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyType: filterData.propertyType,
          location: filterData.locations?.[0],
          size: filterData.size,
          rent: filterData.rent,
          features: filterData.features,
          availability: filterData.availability
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.description) {
          setFormData(prev => ({
            ...prev,
            description: data.description
          }))
        }
      }
    } catch (error) {
      console.error('Error generating property description:', error)
    } finally {
      setGeneratingDescription(false)
    }
  }

  const fetchMatchingBrands = async (filterData: any) => {
    try {
      setLoadingBrands(true)
      const response = await fetch('/api/brands/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyType: filterData.propertyType,
          location: filterData.locations?.[0],
          size: filterData.size,
          rent: filterData.rent
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setMatchingBrands(data.matches || [])
      }
    } catch (error) {
      console.error('Error fetching matching brands:', error)
    } finally {
      setLoadingBrands(false)
    }
  }

  const handlePinLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          })
          alert(`Location pinned! Lat: ${position.coords.latitude}, Long: ${position.coords.longitude}`)
        },
        (error) => {
          alert('Unable to get location. Please ensure location permissions are enabled.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
    }
  }

  const openGoogleMaps = () => {
    if (formData.latitude && formData.longitude) {
      window.open(`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`, '_blank')
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setFormData({ ...formData, photos: [...formData.photos, ...filesArray] })
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setFormData({ ...formData, videos: [...formData.videos, ...filesArray] })
    }
  }

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index)
    })
  }

  const removeVideo = (index: number) => {
    setFormData({
      ...formData,
      videos: formData.videos.filter((_, i) => i !== index)
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Auto-fetch matching brands when key fields are filled
  useEffect(() => {
    if (formData.propertyType && formData.location && formData.size && formData.rent) {
      const sizeNum = parseInt(formData.size?.replace(/[^0-9]/g, '') || '0')
      const rentNum = parseInt(formData.rent?.replace(/[^0-9]/g, '') || '0')
      
      if (sizeNum > 0 && rentNum > 0) {
        // Debounce the fetch
        const timer = setTimeout(() => {
          fetchMatchingBrands({
            propertyType: formData.propertyType,
            locations: [formData.location],
            size: sizeNum,
            rent: rentNum
          })
        }, 500)
        
        return () => clearTimeout(timer)
      }
    }
  }, [formData.propertyType, formData.location, formData.size, formData.rent])

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.latitude || !formData.longitude) {
      alert('Please pin your property location before submitting.')
      return
    }
    
    // Generate Property ID (will be done in backend)
    const propertyId = `PROP-${Date.now()}`
    // TODO: Submit to API with auto-generated Property ID
    router.push('/properties')
  }

  return (
    <div className="min-h-screen relative">
      <DynamicBackground />
      <Navbar />
      
      <div className="relative z-10 pt-28 sm:pt-32 md:pt-36 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
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

          {/* Matching Brands Section - Show from Step 1 onwards when we have enough data */}
          {step >= 1 && formData.propertyType && formData.location && formData.size && formData.rent && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 text-left">
                Brands Looking for Your Property
              </h2>
            
            {loadingBrands ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : matchingBrands.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {matchingBrands.slice(0, 6).map((brand, index) => (
                  <div key={index} className="flex-shrink-0">
                    <BrandCard brand={brand} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-gray-600">No matching brands found yet. Complete more details below to see matches.</p>
              </div>
            )}
            </div>
          )}
        </div>
        
        <div className="max-w-3xl mx-auto">
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
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                Property Owner Onboarding
              </h1>
              <p className="text-sm sm:text-base text-gray-600">List your property and let our AI match you with the perfect brands</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Property Details */}
              {step === 1 && (
                <div className="space-y-6 animate-[fadeInUp_0.5s_ease-out]">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors"
                    >
                      <option value="">Select property type</option>
                      <option value="retail">Retail Space</option>
                      <option value="office">Office Space</option>
                      <option value="restaurant">Restaurant Space</option>
                      <option value="kiosk">Stall Space</option>
                      <option value="mall">Mall Kiosk</option>
                      <option value="standalone">Standalone Building</option>
                      <option value="warehouse">Warehouse</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors"
                      placeholder="Full address with landmark"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pin Exact Location <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-3">(Share google map location here)</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handlePinLocation}
                        className="relative flex-1 px-4 py-4 text-white rounded-xl font-bold hover:shadow-2xl transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-transparent hover:border-white/30 overflow-hidden group"
                        style={{
                          boxShadow: '0 4px 15px rgba(228, 0, 43, 0.4), 0 0 20px rgba(255, 82, 0, 0.2)',
                        }}
                      >
                        {/* Animated moving gradient background */}
                        <div 
                          className="absolute inset-0 animate-gradient-shift"
                          style={{
                            background: 'linear-gradient(90deg, #FF5200 0%, #FF6B35 25%, #E4002B 50%, #FF5200 75%, #FF6B35 100%)',
                            backgroundSize: '200% 100%',
                          }}
                        ></div>
                        
                        {/* Shiny overlay effect that moves across */}
                        <div 
                          className="absolute inset-0 animate-shine"
                          style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                            width: '50%',
                          }}
                        ></div>
                        
                        {/* Additional shine layer for depth */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <svg className="w-6 h-6 relative z-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="relative z-10 text-base drop-shadow-lg font-extrabold">Pin My Location</span>
                        
                        {/* Pulsing border effect */}
                        <div className="absolute inset-0 rounded-xl border-2 border-white/40 animate-pulse"></div>
                        
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#E4002B]/20 via-[#FF5200]/20 to-[#FF6B35]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                      </button>
                      
                      {formData.latitude && formData.longitude && (
                        <button
                          type="button"
                          onClick={openGoogleMaps}
                          className="px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-[#FF5200] transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          View
                        </button>
                      )}
                    </div>
                    
                    {formData.latitude && formData.longitude && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-green-800">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">Location Pinned:</span>
                          <span className="text-xs">
                            {formData.latitude.substring(0, 8)}, {formData.longitude.substring(0, 8)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Space Size (sq ft) *
                    </label>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors"
                      placeholder="e.g., 800 sq ft"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Pricing */}
              {step === 2 && (
                <div className="space-y-6 animate-[fadeInUp_0.5s_ease-out]">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Monthly Rent (₹) *
                    </label>
                    <input
                      type="text"
                      name="rent"
                      value={formData.rent}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors"
                      placeholder="e.g., 75,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Security Deposit (₹) *
                    </label>
                    <input
                      type="text"
                      name="deposit"
                      value={formData.deposit}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors"
                      placeholder="e.g., 2,25,000 (3 months)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Available Amenities *
                    </label>
                    <textarea
                      name="amenities"
                      value={formData.amenities}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors resize-none"
                      placeholder="e.g., Parking, AC, Fire Safety, Washrooms, Kitchen Setup, etc."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Photos, Videos & Description */}
              {step === 3 && (
                <div className="space-y-6 animate-[fadeInUp_0.5s_ease-out]">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Property Description <span className="text-red-500">*</span>
                        {formData.description && (
                          <span className="ml-2 text-xs text-[#FF5200] font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI Suggested
                          </span>
                        )}
                      </label>
                      {formData.propertyType && formData.location && (
                        <button
                          type="button"
                          onClick={() => generatePropertyDescription({
                            propertyType: formData.propertyType,
                            locations: [formData.location],
                            size: parseInt(formData.size?.replace(/[^0-9]/g, '') || '0'),
                            rent: parseInt(formData.rent?.replace(/[^0-9]/g, '') || '0'),
                            features: formData.amenities ? formData.amenities.split(',').map((f: string) => f.trim()) : [],
                            availability: 'Immediate'
                          })}
                          disabled={generatingDescription}
                          className="text-xs text-[#FF5200] hover:text-[#E4002B] font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingDescription ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Generating...
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Regenerate
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors resize-none"
                        placeholder={generatingDescription ? "AI is generating your property description..." : ""}
                      />
                      {!formData.description && !generatingDescription && (
                        <div className="absolute top-3 left-4 pointer-events-none text-gray-400 text-sm">
                          Describe the property, its unique features, nearby landmarks, foot traffic, visibility, accessibility, etc.{' '}
                          <span className="pointer-events-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (formData.propertyType && formData.location) {
                                  generatePropertyDescription({
                                    propertyType: formData.propertyType,
                                    locations: [formData.location],
                                    size: parseInt(formData.size?.replace(/[^0-9]/g, '') || '0'),
                                    rent: parseInt(formData.rent?.replace(/[^0-9]/g, '') || '0'),
                                    features: formData.amenities ? formData.amenities.split(',').map((f: string) => f.trim()) : [],
                                    availability: 'Immediate'
                                  })
                                }
                              }}
                              className="text-[#FF5200] hover:text-[#E4002B] font-semibold underline cursor-pointer"
                            >
                              Autogenerate
                            </button>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Photos & Videos Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Photos & Videos (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#FF5200] transition-colors">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            const files = Array.from(e.target.files)
                            const images = files.filter(f => f.type.startsWith('image/'))
                            const videos = files.filter(f => f.type.startsWith('video/'))
                            
                            if (formData.photos.length + images.length <= 10) {
                              setFormData({ ...formData, photos: [...formData.photos, ...images] })
                            } else {
                              alert('Maximum 10 photos allowed')
                            }
                            
                            if (formData.videos.length + videos.length <= 3) {
                              setFormData({ ...formData, videos: [...formData.videos, ...videos] })
                            } else {
                              alert('Maximum 3 videos allowed')
                            }
                          }
                        }}
                        className="hidden"
                        id="media-upload"
                      />
                      <label
                        htmlFor="media-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-700">Click to upload Photos or Videos</p>
                          <p className="text-xs text-gray-500 mt-1">JPG, PNG (Max 10 photos) • MP4, MOV (Max 3 videos, 50MB each)</p>
                        </div>
                      </label>
                    </div>
                    
                    {formData.videos.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {formData.videos.map((video, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">{video.name}</p>
                                <p className="text-xs text-gray-500">{(video.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVideo(index)}
                              className="w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Next Steps
                    </h4>
                    <p className="text-sm text-blue-800">
                      After submission, our team will verify your listing and you can add additional documents (NOC, property papers) from your dashboard. Your property will be live within 24 hours.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full sm:flex-1 px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition-all text-sm sm:text-base"
                  >
                    Back
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full sm:flex-1 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-[1.02] text-sm sm:text-base"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full sm:flex-1 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-[1.02] text-sm sm:text-base"
                  >
                    List Property & Get Matches
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function OwnerOnboarding() {
  return (
    <>
      <style jsx>{`
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes shine {
          0% {
            transform: translateX(-200%) skewX(-20deg);
          }
          100% {
            transform: translateX(400%) skewX(-20deg);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 3s ease infinite;
        }
        
        .animate-shine {
          animation: shine 2.5s ease-in-out infinite;
        }
        
        .animate-\\[fadeInUp_0\\.3s_ease-out\\] {
          animation: fadeInUp 0.3s ease-out;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <Suspense fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <OwnerOnboardingContent />
      </Suspense>
    </>
  )
}
