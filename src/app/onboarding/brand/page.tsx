'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DynamicBackground from '@/components/DynamicBackground'

export default function BrandOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    brandName: '',
    storeType: '',
    size: '',
    budget: '',
    targetAudience: '',
    preferredLocations: '',
    additionalRequirements: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Submit to API
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
                      <option value="retail">Retail Store</option>
                      <option value="bar">Bar/Pub</option>
                      <option value="fitness">Fitness Studio</option>
                      <option value="salon">Salon/Spa</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Required Space Size (sq ft) *
                    </label>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors"
                      placeholder="e.g., 500-1000 sq ft"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Budget & Audience */}
              {step === 2 && (
                <div className="space-y-6 animate-[fadeInUp_0.5s_ease-out]">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Monthly Budget (₹) *
                    </label>
                    <input
                      type="text"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF5200] focus:outline-none transition-colors"
                      placeholder="e.g., 50,000 - 1,00,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target Audience *
                    </label>
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
