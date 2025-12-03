'use client'

import { useState } from 'react'
import { BrandProfile } from '@/types/workflow'

interface BrandOnboardingFormProps {
  onComplete: (profile: Partial<BrandProfile>) => void;
}

export default function BrandOnboardingForm({ onComplete }: BrandOnboardingFormProps) {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<Partial<BrandProfile>>({
    requirements: {
      minSize: 0,
      maxSize: 0,
      propertyTypes: [],
      mustHaveAmenities: [],
      niceToHaveAmenities: []
    },
    budgetRange: {
      min: 0,
      max: 0,
      currency: 'USD'
    }
  })
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | 'enterprise'>('free')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card')

  const handleNext = () => setStep(step + 1)
  const handlePrev = () => setStep(step - 1)

  const updateProfile = (updates: Partial<BrandProfile>) => {
    setProfile(prev => ({
      ...prev,
      ...updates,
      requirements: prev.requirements ? { ...prev.requirements, ...updates.requirements } : updates.requirements,
      budgetRange: prev.budgetRange ? { ...prev.budgetRange, ...updates.budgetRange } : updates.budgetRange
    } as Partial<BrandProfile>))
  }

  const handleSubmit = () => {
    onComplete(profile)
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-[#FF5200]/10 to-transparent rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-[#E4002B]/10 to-transparent rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_5s]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-6 pt-28 sm:pt-32 pb-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-8">
            <div className="text-center px-4">
              <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] mb-2">
                Brand Onboarding
              </h1>
              <p className="text-gray-600">Let's find your perfect commercial space</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  i <= step 
                    ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {i}
                </div>
                {i < 4 && (
                  <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
                    i < step ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Company Name</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200]"
                    value={profile.companyName || ''}
                    onChange={(e) => updateProfile({ companyName: e.target.value })}
                    placeholder="Enter your company name"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Industry</label>
                  <select
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200]"
                    value={profile.industry || ''}
                    onChange={(e) => updateProfile({ industry: e.target.value })}
                  >
                    <option value="">Select Industry</option>
                    <option value="retail">Retail</option>
                    <option value="food_beverage">Food & Beverage</option>
                    <option value="tech">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="fitness">Fitness & Wellness</option>
                    <option value="professional">Professional Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Company Size</label>
                  <select
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200]"
                    value={profile.companySize || ''}
                    onChange={(e) => updateProfile({ companySize: e.target.value as any })}
                  >
                    <option value="">Select Size</option>
                    <option value="startup">Startup (1-10 employees)</option>
                    <option value="small">Small (11-50 employees)</option>
                    <option value="medium">Medium (51-200 employees)</option>
                    <option value="large">Large (201-1000 employees)</option>
                    <option value="enterprise">Enterprise (1000+ employees)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Website (Optional)</label>
                  <input
                    type="url"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200]"
                    value={profile.website || ''}
                    onChange={(e) => updateProfile({ website: e.target.value })}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Location Preferences</h2>
              
              <div>
                <label className="block text-gray-900 font-semibold mb-2">Preferred Locations</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200]"
                  value={profile.preferredLocations?.join(', ') || ''}
                  onChange={(e) => updateProfile({ preferredLocations: e.target.value.split(', ').filter(Boolean) })}
                  placeholder="New York, Los Angeles, Chicago (comma separated)"
                />
              </div>
              
              <div>
                <label className="block text-gray-900 font-semibold mb-2">Location Flexibility</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'strict', label: 'Strict', desc: 'Exact locations only' },
                    { value: 'flexible', label: 'Flexible', desc: 'Nearby areas OK' },
                    { value: 'very_flexible', label: 'Very Flexible', desc: 'Open to suggestions' }
                  ].map((option) => (
                    <div
                      key={option.value}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                        profile.locationFlexibility === option.value
                          ? 'border-[#FF5200] bg-[#FF5200]/10'
                          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => updateProfile({ locationFlexibility: option.value as any })}
                    >
                      <div className="text-gray-900 font-semibold">{option.label}</div>
                      <div className="text-gray-600 text-sm">{option.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Budget & Requirements</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Budget Range (Monthly)</label>
                  <div className="flex space-x-3">
                    <input
                      type="number"
                      className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200]"
                      value={profile.budgetRange?.min || ''}
                      onChange={(e) => updateProfile({ 
                        budgetRange: { ...profile.budgetRange!, min: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="Min $"
                    />
                    <input
                      type="number"
                      className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200]"
                      value={profile.budgetRange?.max || ''}
                      onChange={(e) => updateProfile({ 
                        budgetRange: { ...profile.budgetRange!, max: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="Max $"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Lease Length</label>
                  <select
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200]"
                    value={profile.leaseLength || ''}
                    onChange={(e) => updateProfile({ leaseLength: e.target.value as any })}
                  >
                    <option value="">Select Length</option>
                    <option value="short_term">Short Term (&lt;1 year)</option>
                    <option value="medium_term">Medium Term (1-3 years)</option>
                    <option value="long_term">Long Term (3+ years)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Space Size (sq ft)</label>
                  <div className="flex space-x-3">
                    <input
                      type="number"
                      className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200]"
                      value={profile.requirements?.minSize || ''}
                      onChange={(e) => updateProfile({ 
                        requirements: { ...profile.requirements!, minSize: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="Min sq ft"
                    />
                    <input
                      type="number"
                      className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200]"
                      value={profile.requirements?.maxSize || ''}
                      onChange={(e) => updateProfile({ 
                        requirements: { ...profile.requirements!, maxSize: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="Max sq ft"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Property Types</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['office', 'retail', 'warehouse', 'restaurant'].map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-[#FF5200] rounded focus:ring-[#FF5200]"
                          checked={profile.requirements?.propertyTypes?.includes(type as any) || false}
                          onChange={(e) => {
                            const types = profile.requirements?.propertyTypes || []
                            if (e.target.checked) {
                              updateProfile({ 
                                requirements: { ...profile.requirements!, propertyTypes: [...types, type as any] }
                              })
                            } else {
                              updateProfile({ 
                                requirements: { ...profile.requirements!, propertyTypes: types.filter(t => t !== type) }
                              })
                            }
                          }}
                        />
                        <span className="text-gray-900 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Requirements</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Expected Footfall</label>
                  <select
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200]"
                    value={profile.expectedFootfall || ''}
                    onChange={(e) => updateProfile({ expectedFootfall: e.target.value as any })}
                  >
                    <option value="">Select Footfall</option>
                    <option value="low">Low (Office-based)</option>
                    <option value="medium">Medium (Regular customers)</option>
                    <option value="high">High (Retail/Restaurant)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Operating Hours</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200]"
                    value={profile.operatingHours || ''}
                    onChange={(e) => updateProfile({ operatingHours: e.target.value })}
                    placeholder="9 AM - 6 PM, Mon-Fri"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-900 font-semibold mb-2">Must-Have Amenities</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['WiFi', 'Parking', 'Security', 'Air Conditioning', 'Kitchen', 'Conference Rooms', 'Accessibility', 'Public Transport'].map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#FF5200] rounded focus:ring-[#FF5200]"
                        checked={profile.requirements?.mustHaveAmenities?.includes(amenity) || false}
                        onChange={(e) => {
                          const amenities = profile.requirements?.mustHaveAmenities || []
                          if (e.target.checked) {
                            updateProfile({ 
                              requirements: { ...profile.requirements!, mustHaveAmenities: [...amenities, amenity] }
                            })
                          } else {
                            updateProfile({ 
                              requirements: { ...profile.requirements!, mustHaveAmenities: amenities.filter(a => a !== amenity) }
                            })
                          }
                        }}
                      />
                      <span className="text-gray-900">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrev}
              disabled={step === 1}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-900 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-300"
            >
              Previous
            </button>
            
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:from-[#FF6B35] hover:to-[#FF5200] text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:from-[#FF6B35] hover:to-[#FF5200] text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Complete Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
