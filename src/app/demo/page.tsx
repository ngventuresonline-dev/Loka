'use client'

import { useState } from 'react'
import { BrandProfile, OwnerProfile, Property } from '@/types/workflow'
import BrandOnboardingForm from '@/components/onboarding/BrandOnboardingForm'
import PropertyOwnerOnboardingForm from '@/components/onboarding/PropertyOwnerOnboardingForm'
import Dashboard from '@/components/Dashboard'

type DemoStep = 'select-role' | 'brand-onboarding' | 'owner-onboarding' | 'brand-dashboard' | 'owner-dashboard'

// Mock property data for dashboard demo
const mockProperties: Property[] = [
  {
    id: 'prop-001',
    title: 'Prime Manhattan Retail Space',
    description: 'Modern retail space in the heart of Manhattan with high foot traffic and excellent visibility.',
    address: '123 Broadway',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    size: 1800,
    propertyType: 'retail',
    price: 12000,
    priceType: 'monthly',
    condition: 'excellent',
    amenities: ['Parking', 'Storage', 'Loading Dock', 'Security System'],
    accessibility: true,
    parking: true,
    publicTransport: true,
    ownerId: 'owner-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: true,
    locationIntelligence: {
      footfallData: {
        dailyAverage: 15000,
        peakHours: ['12:00-14:00', '17:00-19:00'],
        seasonalTrends: [
          { month: 'December', multiplier: 1.5 },
          { month: 'November', multiplier: 1.3 }
        ]
      },
      demographics: {
        ageGroups: [
          { range: '25-34', percentage: 35 },
          { range: '35-44', percentage: 30 },
          { range: '18-24', percentage: 20 },
        ],
        incomeLevel: 'high',
        lifestyle: ['urban professionals', 'tech workers', 'creatives']
      },
      competitors: [
        { name: 'Starbucks', type: 'coffee shop', distance: 200, category: 'direct' },
        { name: 'Local Cafe', type: 'cafe', distance: 100, category: 'direct' }
      ],
      accessibilityScore: 92
    }
  },

  {
  id: 'prop-002',
  title: 'Modern Office Space Downtown',
  description: 'Flexible office space perfect for growing businesses, featuring modern amenities and great natural light.',
  address: '456 Wall Street',
  city: 'New York',
  state: 'NY',
  zipCode: '10005',
  size: 2500,
  propertyType: 'office',
  price: 8500,
  priceType: 'monthly',
  condition: 'good',
  amenities: ['Parking', 'Conference Rooms', 'Kitchen', 'High-Speed Internet'],
  accessibility: true,
  parking: true,
  publicTransport: true,
  ownerId: 'owner-002',
  createdAt: new Date(),
  updatedAt: new Date(),
  isAvailable: true,
  locationIntelligence: {
    demographics: {
      ageGroups: [
        { range: '35-44', percentage: 40 },
        { range: '25-34', percentage: 35 },
      ],
      incomeLevel: 'high',
      lifestyle: ['finance professionals', 'legal workers', 'consultants']
    },
    competitors: []
  }
}
]

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState<DemoStep>('select-role')
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null)
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null)

  const handleBrandComplete = (profile: Partial<BrandProfile>) => {
    setBrandProfile(profile as BrandProfile)
    setCurrentStep('brand-dashboard')
  }

  const handleOwnerComplete = (profile: Partial<OwnerProfile>) => {
    setOwnerProfile(profile as OwnerProfile)
    setCurrentStep('owner-dashboard')
  }

  const resetDemo = () => {
    setCurrentStep('select-role')
    setBrandProfile(null)
    setOwnerProfile(null)
  }

  const renderRoleSelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] bg-clip-text text-transparent mb-6">
            Lokazen
          </h1>
          <p className="text-xl text-gray-200 mb-2">AI-Powered Commercial Real Estate Matching</p>
          <p className="text-gray-400">Experience the future of property-brand connections</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Brand Card */}
          <div className="group cursor-pointer" onClick={() => setCurrentStep('brand-onboarding')}>
            <div className="bg-white/5 backdrop-blur-lg border border-[#FF5200]/30 rounded-2xl p-8 hover:bg-[#FF5200]/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#FF5200]/20">
              <div className="w-20 h-20 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#FF5200]/50">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">I&apos;m a Brand</h3>
              <p className="text-gray-300 mb-6">
                Looking for the perfect commercial space for my business
              </p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#FF5200] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI-powered property matching
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#FF5200] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Location intelligence & demographics
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#FF5200] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Direct owner communication
                </div>
              </div>
              
              <div className="mt-8">
                <div className="px-6 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg font-medium group-hover:from-[#E4002B] group-hover:to-[#FF5200] transition-all shadow-lg">
                  Start as Brand →
                </div>
              </div>
            </div>
          </div>

          {/* Property Owner Card */}
          <div className="group cursor-pointer" onClick={() => setCurrentStep('owner-onboarding')}>
            <div className="bg-white/5 backdrop-blur-lg border border-[#E4002B]/30 rounded-2xl p-8 hover:bg-[#E4002B]/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#E4002B]/20">
              <div className="w-20 h-20 bg-gradient-to-r from-[#E4002B] to-[#FF5200] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#E4002B]/50">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">I&apos;m a Property Owner</h3>
              <p className="text-gray-300 mb-6">
                Ready to connect with the right brands for my properties
              </p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#E4002B] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Qualified brand matching
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#E4002B] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Portfolio analytics
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#E4002B] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Automated lead generation
                </div>
              </div>
              
              <div className="mt-8">
                <div className="px-6 py-3 bg-gradient-to-r from-[#E4002B] to-[#FF5200] text-white rounded-lg font-medium group-hover:from-[#FF5200] group-hover:to-[#E4002B] transition-all shadow-lg">
                  Start as Owner →
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] bg-clip-text text-transparent mb-2">
              95%
            </div>
            <div className="text-gray-400">Match Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] bg-clip-text text-transparent mb-2">
              Instant
            </div>
            <div className="text-gray-400">Average Match Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] bg-clip-text text-transparent mb-2">
              100+
            </div>
            <div className="text-gray-400">Brands</div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (currentStep) {
      case 'select-role':
        return renderRoleSelection()
      
      case 'brand-onboarding':
        return <BrandOnboardingForm onComplete={handleBrandComplete} />
      
      case 'owner-onboarding':
        return <PropertyOwnerOnboardingForm onComplete={handleOwnerComplete} />
      
      case 'brand-dashboard':
        return brandProfile ? (
          <Dashboard 
            userType="brand" 
            userProfile={brandProfile} 
            properties={mockProperties}
          />
        ) : null
      
      case 'owner-dashboard':
        return ownerProfile ? (
          <Dashboard 
            userType="owner" 
            userProfile={ownerProfile}
          />
        ) : null
      
      default:
        return renderRoleSelection()
    }
  }

  return (
    <div className="relative">
      {/* Reset Button */}
      {currentStep !== 'select-role' && (
        <div className="fixed top-6 left-6 z-50">
          <button
            onClick={resetDemo}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Demo
          </button>
        </div>
      )}
      
      {/* Current Step Indicator */}
      {currentStep !== 'select-role' && (
        <div className="fixed top-6 right-6 z-50">
          <div className="px-4 py-2 bg-gradient-to-r from-[#FF5200]/20 to-[#E4002B]/20 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm">
            {currentStep === 'brand-onboarding' && '👤 Brand Onboarding'}
            {currentStep === 'owner-onboarding' && '🏢 Owner Onboarding'}
            {currentStep === 'brand-dashboard' && '📊 Brand Dashboard'}
            {currentStep === 'owner-dashboard' && '📈 Owner Dashboard'}
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  )
}
