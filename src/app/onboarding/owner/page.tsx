'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DynamicBackground from '@/components/DynamicBackground'

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


  // Load pre-filled data from filter page
  useEffect(() => {
    const prefilled = searchParams.get('prefilled')
    if (prefilled === 'true') {
      try {
        const storedData = localStorage.getItem('ownerFilterData')
        if (storedData) {
          const filterData = JSON.parse(storedData)
          
          setFormData(prev => ({
            ...prev,
            propertyType: filterData.propertyType || prev.propertyType,
            location: filterData.locations?.[0] || prev.location,
            size: filterData.size ? `${filterData.size} sq ft` : prev.size,
            rent: filterData.rent ? `₹${filterData.rent.toLocaleString()}` : prev.rent,
            amenities: filterData.features ? filterData.features.join(', ') : prev.amenities
          }))
          
          // Clear stored data after loading
          localStorage.removeItem('ownerFilterData')
          
          // Generate AI description
          generatePropertyDescription(filterData)
          
          // Fetch matching brands
          fetchMatchingBrands(filterData)
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
                      <option value="mall">Mall Kiosk</option>
                      <option value="standalone">Standalone Building</option>
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
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handlePinLocation}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Pin My Location
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

          {/* Matching Brands Section - Show from Step 2 onwards when we have enough data */}
          {step >= 2 && formData.propertyType && formData.location && formData.size && formData.rent && (
            <div className="mt-8 sm:mt-12">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Brands Looking for Your Type of Property
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Based on your property details, these brands may be interested
                </p>
              </div>
            
            {loadingBrands ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : matchingBrands.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchingBrands.slice(0, 5).map((brand, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                        {brand.name?.charAt(0) || 'B'}
                      </div>
                      {brand.matchScore >= 80 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          {brand.matchScore}% Match
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{brand.name || 'Brand Name'}</h3>
                    <p className="text-sm text-gray-600 mb-4">{brand.businessType || 'Business Type'}</p>
                    
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <span>Size: {brand.sizeRange || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-4 h-4 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Budget: {brand.budgetRange || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      className="w-full px-4 py-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                      View Requirements
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-gray-600">No matching brands found yet. Complete more details above to see matches.</p>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OwnerOnboarding() {
  return (
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
  )
}
