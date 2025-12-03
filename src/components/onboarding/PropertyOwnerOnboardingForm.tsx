'use client'

import { useState } from 'react'
import { OwnerProfile, Property } from '@/types/workflow'

interface PropertyOwnerOnboardingFormProps {
  onComplete: (ownerProfile: OwnerProfile) => void
}

type FormStep = 'personal' | 'company' | 'properties' | 'preferences'

export default function PropertyOwnerOnboardingForm({ onComplete }: PropertyOwnerOnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('personal')
  const [ownerProfile, setOwnerProfile] = useState<Partial<OwnerProfile>>({
    type: 'individual',
    properties: []
  })

  const steps: { id: FormStep; title: string; description: string }[] = [
    { id: 'personal', title: 'Personal Info', description: 'Basic information about you' },
    { id: 'company', title: 'Business Details', description: 'Company or individual information' },
    { id: 'properties', title: 'Property Portfolio', description: 'Add your properties' },
    { id: 'preferences', title: 'Preferences', description: 'Your rental preferences' }
  ]

  const updateProfile = (updates: Partial<OwnerProfile>) => {
    setOwnerProfile(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id)
    }
  }

  const prevStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  const handleSubmit = () => {
    if (ownerProfile.name && ownerProfile.email && ownerProfile.phone) {
      onComplete(ownerProfile as OwnerProfile)
    }
  }

  const renderPersonalInfo = () => (
      <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent px-4">
          Personal Information
        </h2>
        <p className="text-gray-600 mt-2 px-4">Tell us about yourself</p>
      </div>      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Full Name *</label>
          <input
            type="text"
            value={ownerProfile.name || ''}
            onChange={(e) => updateProfile({ name: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900 placeholder-gray-400"
            placeholder="Enter your full name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Email *</label>
            <input
              type="email"
              value={ownerProfile.email || ''}
              onChange={(e) => updateProfile({ email: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900 placeholder-gray-400"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Phone *</label>
            <input
              type="tel"
              value={ownerProfile.phone || ''}
              onChange={(e) => updateProfile({ phone: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900 placeholder-gray-400"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Type of Owner</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'individual', label: 'Individual', desc: 'Single property owner' },
              { value: 'company', label: 'Company', desc: 'Corporate property owner' },
              { value: 'investor', label: 'Investor', desc: 'Investment portfolio' }
            ].map((type) => (
              <div
                key={type.value}
                onClick={() => updateProfile({ type: type.value as any })}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  ownerProfile.type === type.value
                    ? 'border-[#FF5200] bg-[#FF5200]/10'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-600">{type.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderCompanyDetails = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">
          Business Details
        </h2>
        <p className="text-gray-600 mt-2">Company or business information</p>
      </div>

      {ownerProfile.type !== 'individual' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Company Name</label>
            <input
              type="text"
              value={ownerProfile.companyName || ''}
              onChange={(e) => updateProfile({ companyName: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900 placeholder-gray-400"
              placeholder="Your company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Business License</label>
            <input
              type="text"
              value={ownerProfile.businessLicense || ''}
              onChange={(e) => updateProfile({ businessLicense: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900 placeholder-gray-400"
              placeholder="Business license number"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Years of Experience</label>
        <select
          value={ownerProfile.experience || ''}
          onChange={(e) => updateProfile({ experience: e.target.value })}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900"
        >
          <option value="">Select experience</option>
          <option value="0-1">0-1 years</option>
          <option value="1-3">1-3 years</option>
          <option value="3-5">3-5 years</option>
          <option value="5-10">5-10 years</option>
          <option value="10+">10+ years</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Portfolio Size</label>
        <select
          value={ownerProfile.portfolioSize || ''}
          onChange={(e) => updateProfile({ portfolioSize: e.target.value })}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900"
        >
          <option value="">Select portfolio size</option>
          <option value="1">1 property</option>
          <option value="2-5">2-5 properties</option>
          <option value="6-10">6-10 properties</option>
          <option value="11-25">11-25 properties</option>
          <option value="25+">25+ properties</option>
        </select>
      </div>
    </div>
  )

  const renderProperties = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">
          Property Portfolio
        </h2>
        <p className="text-gray-600 mt-2">Add your properties to get started</p>
      </div>

      <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Your First Property</h3>
          <p className="text-gray-600 mb-4">Start by adding details about your available properties</p>
          <button className="px-6 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg hover:from-[#FF6B35] hover:to-[#FF5200] transition-all">
            Add Property
          </button>
        </div>
      </div>

      {ownerProfile.properties && ownerProfile.properties.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Properties</h3>
          {ownerProfile.properties.map((property, index) => (
            <div key={index} className="bg-white border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{property.title}</h4>
                  <p className="text-gray-600 text-sm">{property.address}, {property.city}</p>
                  <p className="text-[#FF5200] font-medium">${property.price}/month</p>
                </div>
                <button className="text-red-400 hover:text-red-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderPreferences = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">
          Rental Preferences
        </h2>
        <p className="text-gray-600 mt-2">Set your preferences for tenant matching</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">Preferred Tenant Types</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Restaurants', 'Retail Stores', 'Offices', 'Gyms/Fitness', 
              'Beauty Salons', 'Medical Offices', 'Tech Companies', 'Startups'
            ].map((type) => (
              <label key={type} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 bg-white text-[#FF5200] focus:ring-[#FF5200]"
                />
                <span className="text-sm text-gray-900">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Minimum Lease Duration</label>
          <select className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] text-gray-900">
            <option value="">Select minimum lease</option>
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">1 year</option>
            <option value="24">2 years</option>
            <option value="36">3+ years</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">Communication Preferences</label>
          <div className="space-y-2">
            {[
              { id: 'email', label: 'Email notifications' },
              { id: 'sms', label: 'SMS alerts' },
              { id: 'whatsapp', label: 'WhatsApp messages' },
              { id: 'phone', label: 'Phone calls' }
            ].map((option) => (
              <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 bg-white text-[#FF5200] focus:ring-[#FF5200]"
                />
                <span className="text-sm text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 'personal': return renderPersonalInfo()
      case 'company': return renderCompanyDetails()
      case 'properties': return renderProperties()
      case 'preferences': return renderPreferences()
      default: return null
    }
  }

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-[#FF5200]/10 to-transparent rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-[#E4002B]/10 to-transparent rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_5s]"></div>
      </div>
      <div className="max-w-4xl mx-auto relative z-10 px-6 sm:px-6 pt-28 sm:pt-32 pb-12">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex 
                      ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {index < currentStepIndex ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <div className={`text-sm font-medium ${
                      index <= currentStepIndex ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${
                    index < currentStepIndex ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStepIndex === steps.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg hover:from-[#FF6B35] hover:to-[#FF5200] transition-all"
              >
                Complete Setup
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg hover:from-[#FF6B35] hover:to-[#FF5200] transition-all"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
