'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DynamicBackground from '@/components/DynamicBackground'
import BrandOnboardingForm from '@/components/onboarding/BrandOnboardingForm'
import PropertyOwnerOnboardingForm from '@/components/onboarding/PropertyOwnerOnboardingForm'
import Dashboard from '@/components/Dashboard'
import { BrandProfile, OwnerProfile, Property } from '@/types/workflow'
import { initializeAdminAccount, getCurrentUser, isAdmin } from '@/lib/auth'
import { getTheme, getPaletteColors } from '@/lib/theme'

type AppStep = 'home' | 'brand-onboarding' | 'owner-onboarding' | 'brand-dashboard' | 'owner-dashboard'

// Mock property data
const mockProperties: Property[] = [
  {
    id: 'prop-001',
    title: 'Prime Manhattan Retail Space',
    description: 'Modern retail space in the heart of Manhattan',
    address: '123 Broadway',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    size: 1800,
    propertyType: 'retail',
    price: 12000,
    priceType: 'monthly',
    condition: 'excellent',
    amenities: ['Parking', 'Storage', 'Security'],
    accessibility: true,
    parking: true,
    publicTransport: true,
    ownerId: 'owner-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: true,
  }
]

export default function Home() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<AppStep>('home')
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null)
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [theme, setThemeState] = useState({ palette: 'cosmic-purple', background: 'floating-orbs' })
  
  // AI Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [aiMessage, setAiMessage] = useState('')
  const [showResults, setShowResults] = useState(false)

  // Handle AI Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setShowResults(false)
    
    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, userId: 'guest' })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.properties || [])
        setAiMessage(data.message || '')
        setShowResults(true)
      } else {
        setAiMessage('Sorry, something went wrong. Please try again.')
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setAiMessage('Unable to perform search. Please check your connection.')
      setShowResults(true)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    // Only run once on mount
    if (!isInitialized) {
      // Initialize default admin account
      initializeAdminAccount()
      
      // Load current theme
      const currentTheme = getTheme()
      setThemeState(currentTheme)
      
      // Note: Removed auto-redirect for admins - they can navigate freely
      // Admins can access homepage and use "Dashboard" link in navbar to go to /admin
      
      setIsInitialized(true)
    }
    setIsMounted(true)
  }, [isInitialized, router])

  // Predefined particle positions to avoid hydration mismatch
  const particlePositions = [
    { left: 10, top: 15, delay: 0 },
    { left: 25, top: 30, delay: 0.5 },
    { left: 40, top: 10, delay: 1 },
    { left: 55, top: 45, delay: 1.5 },
    { left: 70, top: 20, delay: 2 },
    { left: 85, top: 35, delay: 2.5 },
    { left: 15, top: 60, delay: 0.3 },
    { left: 30, top: 75, delay: 0.8 },
    { left: 45, top: 55, delay: 1.3 },
    { left: 60, top: 80, delay: 1.8 },
    { left: 75, top: 65, delay: 2.3 },
    { left: 90, top: 50, delay: 2.8 },
    { left: 12, top: 40, delay: 0.2 },
    { left: 35, top: 25, delay: 0.7 },
    { left: 50, top: 70, delay: 1.2 },
    { left: 65, top: 15, delay: 1.7 },
    { left: 80, top: 55, delay: 2.2 },
    { left: 95, top: 30, delay: 2.7 },
    { left: 20, top: 85, delay: 0.4 },
    { left: 48, top: 35, delay: 0.9 },
    { left: 62, top: 60, delay: 1.4 },
    { left: 78, top: 10, delay: 1.9 },
    { left: 88, top: 75, delay: 2.4 },
    { left: 32, top: 50, delay: 0.6 },
    { left: 52, top: 22, delay: 1.1 },
  ]

  const particlePositionsBlue = [
    { left: 18, top: 20, delay: 1 },
    { left: 33, top: 35, delay: 1.5 },
    { left: 48, top: 15, delay: 2 },
    { left: 63, top: 50, delay: 2.5 },
    { left: 78, top: 25, delay: 0 },
    { left: 93, top: 40, delay: 0.5 },
    { left: 22, top: 65, delay: 1.3 },
    { left: 37, top: 80, delay: 1.8 },
    { left: 52, top: 60, delay: 2.3 },
    { left: 67, top: 85, delay: 2.8 },
    { left: 82, top: 70, delay: 0.3 },
    { left: 97, top: 55, delay: 0.8 },
    { left: 8, top: 45, delay: 1.2 },
    { left: 28, top: 28, delay: 1.7 },
    { left: 43, top: 72, delay: 2.2 },
    { left: 58, top: 18, delay: 2.7 },
    { left: 73, top: 58, delay: 0.2 },
    { left: 88, top: 33, delay: 0.7 },
    { left: 15, top: 88, delay: 1.4 },
    { left: 42, top: 38, delay: 1.9 },
    { left: 57, top: 63, delay: 2.4 },
    { left: 72, top: 12, delay: 0.4 },
    { left: 86, top: 78, delay: 0.9 },
    { left: 26, top: 52, delay: 1.6 },
    { left: 46, top: 24, delay: 2.1 },
  ]

  const handleBrandComplete = (profile: Partial<BrandProfile>) => {
    setBrandProfile(profile as BrandProfile)
    setCurrentStep('brand-dashboard')
  }

  const handleOwnerComplete = (profile: Partial<OwnerProfile>) => {
    setOwnerProfile(profile as OwnerProfile)
    setCurrentStep('owner-dashboard')
  }

  const resetToHome = () => {
    setCurrentStep('home')
    setBrandProfile(null)
    setOwnerProfile(null)
  }

  // Show onboarding or dashboard if user has started the process
  if (currentStep === 'brand-onboarding') {
    return (
      <div className="relative">
        <button
          onClick={resetToHome}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
        <BrandOnboardingForm onComplete={handleBrandComplete} />
      </div>
    )
  }

  if (currentStep === 'owner-onboarding') {
    return (
      <div className="relative">
        <button
          onClick={resetToHome}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
        <PropertyOwnerOnboardingForm onComplete={handleOwnerComplete} />
      </div>
    )
  }

  if (currentStep === 'brand-dashboard' && brandProfile) {
    return (
      <div className="relative">
        <button
          onClick={resetToHome}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
        <Dashboard userType="brand" userProfile={brandProfile} properties={mockProperties} />
      </div>
    )
  }

  if (currentStep === 'owner-dashboard' && ownerProfile) {
    return (
      <div className="relative">
        <button
          onClick={resetToHome}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
        <Dashboard userType="owner" userProfile={ownerProfile} />
      </div>
    )
  }

  const colors = getPaletteColors(theme.palette)

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Clean White Background with Subtle Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white"></div>
        
        {/* Animated grain texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>
        
        {/* Floating subtle orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-[10%] w-96 h-96 bg-gray-200/20 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
          <div className="absolute top-40 right-[15%] w-[30rem] h-[30rem] bg-gray-100/30 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_5s]"></div>
          <div className="absolute bottom-20 left-[30%] w-[28rem] h-[28rem] bg-gray-200/20 rounded-full blur-3xl animate-[float_22s_ease-in-out_infinite_3s]"></div>
        </div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>
      </div>
      
      <Navbar />

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-6 py-2 bg-black/5 backdrop-blur-md border border-black/10 rounded-full text-black/60 text-xs font-medium mb-12 tracking-wider uppercase hover:bg-black/10 transition-all duration-500">
            <span className="w-1.5 h-1.5 bg-black rounded-full mr-3 animate-pulse"></span>
            AI-Powered Real Estate Matching
          </div>
          
          {/* Main Heading - 2 Lines */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-black mb-8 leading-[1.1] tracking-tight">
            <span className="block opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">Connecting Brands</span>
            <span className="block opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">with Prime Properties</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-black/60 mb-12 max-w-3xl mx-auto leading-relaxed opacity-0 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards]">
            Tell us what you're looking for. Our AI understands your needs and matches you with the perfect spaces.
          </p>
          
          {/* Ultra-Sleek Futuristic AI Search Bar */}
          <div className="opacity-0 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards] mb-6">
            <div className="relative max-w-4xl mx-auto group">
              {/* Animated Gradient Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-[24px] opacity-20 group-hover:opacity-40 blur-xl transition duration-700 animate-[gradientShift_4s_ease_infinite] bg-[length:200%_200%] pointer-events-none"></div>
              
              {/* Animated Flowing Gradient Border - Always Visible */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-[20px] opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-[gradientShift_3s_ease_infinite] bg-[length:200%_200%] pointer-events-none"></div>
              
              {/* Main Search Container */}
              <div className="relative bg-white rounded-[20px] shadow-2xl hover:shadow-3xl transition-all duration-500 z-10">
                <div className="flex items-center gap-3 p-1.5">
                  {/* AI Icon with Animated Gradient */}
                  <div className="pl-4 flex-shrink-0">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl opacity-10 animate-[gradientShift_4s_ease_infinite] bg-[length:200%_200%]"></div>
                      <svg className="w-5 h-5 text-black relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Input Field */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Ex: Looking for QSR space in Indiranagar | I have a commercial space for rent..."
                    className="flex-1 bg-transparent text-black placeholder-black/40 text-base md:text-lg py-5 px-2 focus:outline-none font-normal"
                    disabled={isSearching}
                  />
                  
                  {/* Search Button with Gradient */}
                  <button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="mr-1.5 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-2xl font-semibold hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-[gradientShift_4s_ease_infinite] bg-[length:200%_200%] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <span>Search</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Floating particles effect on hover */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
                <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
            
            {/* Quick Suggestions Pills - Outside the search container */}
            <div className="mt-6 flex flex-wrap gap-3 items-center justify-center max-w-4xl mx-auto">
              <span className="text-xs text-black/30 font-medium">Try:</span>
              <button 
                onClick={() => setSearchQuery('QSR space 500 sqft Indiranagar')}
                className="text-xs text-black/50 hover:text-black/70 bg-black/5 hover:bg-black/10 px-4 py-1.5 rounded-full transition-all cursor-pointer"
              >
                QSR space Indiranagar
              </button>
              <button 
                onClick={() => setSearchQuery('Restaurant space Koramangala')}
                className="text-xs text-black/50 hover:text-black/70 bg-black/5 hover:bg-black/10 px-4 py-1.5 rounded-full transition-all cursor-pointer"
              >
                Restaurant Koramangala
              </button>
              <button 
                onClick={() => setSearchQuery('Retail space Whitefield')}
                className="text-xs text-black/50 hover:text-black/70 bg-black/5 hover:bg-black/10 px-4 py-1.5 rounded-full transition-all cursor-pointer"
              >
                Retail Whitefield
              </button>
              <button 
                onClick={() => setSearchQuery('Office space MG Road Bangalore')}
                className="text-xs text-black/50 hover:text-black/70 bg-black/5 hover:bg-black/10 px-4 py-1.5 rounded-full transition-all cursor-pointer"
              >
                Office MG Road
              </button>
              <button 
                onClick={() => setSearchQuery('Cafe space HSR Layout')}
                className="text-xs text-black/50 hover:text-black/70 bg-black/5 hover:bg-black/10 px-4 py-1.5 rounded-full transition-all cursor-pointer"
              >
                Cafe HSR Layout
              </button>
              <button 
                onClick={() => setSearchQuery('Kiosk space Jayanagar')}
                className="text-xs text-black/50 hover:text-black/70 bg-black/5 hover:bg-black/10 px-4 py-1.5 rounded-full transition-all cursor-pointer"
              >
                Kiosk Jayanagar
              </button>
              <button 
                onClick={() => setSearchQuery('I have 1200 sqft space available in Indiranagar')}
                className="text-xs text-black/50 hover:text-black/70 bg-black/5 hover:bg-black/10 px-4 py-1.5 rounded-full transition-all cursor-pointer"
              >
                List: 1200 sqft Indiranagar
              </button>
              <button 
                onClick={() => setSearchQuery('Commercial property for rent Koramangala')}
                className="text-xs text-black/50 hover:text-black/70 bg-black/5 hover:bg-black/10 px-4 py-1.5 rounded-full transition-all cursor-pointer"
              >
                List: Koramangala property
              </button>
              <button 
                onClick={() => setSearchQuery('Ground floor shop Malleshwaram')}
                className="text-xs text-black/50 hover:text-black/70 bg-black/5 hover:bg-black/10 px-4 py-1.5 rounded-full transition-all cursor-pointer"
              >
                Shop Malleshwaram
              </button>
            </div>
            
            {/* Info Text Below Search */}
            <p className="text-sm text-black/40 mt-6 font-medium">
              <span className="text-black/60">For Brands:</span> Describe your ideal space · 
              <span className="text-black/60 ml-2">For Owners:</span> List what you have available
            </p>
          </div>
          
          {/* Search Results Section */}
          {showResults && (
            <div className="opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] mb-16">
              <div className="max-w-6xl mx-auto">
                {/* AI Response Message */}
                {aiMessage && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-black mb-2">AI Assistant</h3>
                        <p className="text-black/70 leading-relaxed">{aiMessage}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-black">
                    {searchResults.length > 0 ? `Found ${searchResults.length} Properties` : 'No properties found'}
                  </h2>
                  <button 
                    onClick={() => setShowResults(false)}
                    className="text-sm text-black/60 hover:text-black underline"
                  >
                    Clear Results
                  </button>
                </div>
                
                {/* Property Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((property: any) => (
                    <div key={property.id} className="bg-white border border-black/10 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                      {/* Property Image */}
                      <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                        <svg className="w-16 h-16 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {property.isFeatured && (
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            ⭐ Featured
                          </div>
                        )}
                      </div>
                      
                      {/* Property Details */}
                      <div className="p-6">
                        <h3 className="font-bold text-lg text-black mb-2 line-clamp-2">{property.title}</h3>
                        <p className="text-sm text-black/60 mb-4 line-clamp-2">{property.description}</p>
                        
                        {/* Property Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="text-black/70">{property.address}, {property.city}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                              </svg>
                              <span className="text-black/70">{property.size} sqft</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span className="text-black/70 capitalize">{property.propertyType}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Amenities */}
                        {property.amenities && property.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {property.amenities.slice(0, 3).map((amenity: string, idx: number) => (
                              <span key={idx} className="text-xs bg-black/5 text-black/70 px-3 py-1 rounded-full">
                                {amenity}
                              </span>
                            ))}
                            {property.amenities.length > 3 && (
                              <span className="text-xs text-black/40 px-2 py-1">
                                +{property.amenities.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Price and CTA */}
                        <div className="flex items-center justify-between pt-4 border-t border-black/10">
                          <div>
                            <div className="text-2xl font-bold text-black">₹{(property.price / 1000).toFixed(0)}k</div>
                            <div className="text-xs text-black/50">/month</div>
                          </div>
                          <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-[fadeInUp_0.6s_ease-out_1s_forwards]">
            <button 
              onClick={() => setCurrentStep('brand-onboarding')}
              className="group relative px-8 py-4 bg-black text-white rounded-2xl text-base font-semibold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                I'm a Brand
              </span>
            </button>
            <button 
              onClick={() => setCurrentStep('owner-onboarding')}
              className="group relative px-8 py-4 bg-white backdrop-blur-sm border-2 border-black/10 text-black rounded-2xl text-base font-semibold transition-all duration-300 hover:bg-black/5 hover:border-black/20"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                I'm a Property Owner
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Clientele Section - Futuristic */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_2s]"></div>
        </div>

        <div className="relative text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200/50 rounded-full text-purple-700 text-xs font-semibold mb-8 animate-[fadeInUp_0.6s_ease-out]">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
            TRUSTED BY THE BEST
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-black mb-8 leading-tight animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
            Our <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">Clientele</span>
          </h2>
          <p className="text-xl text-black/70 max-w-4xl mx-auto leading-relaxed mb-6 animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
            We specialize in securing <span className="font-bold text-black">high-ROI commercial real estate</span> for India's fastest-growing brands. Whether you're expanding or launching your next outlet, we help you find <span className="font-bold text-black">high-footfall, high-visibility locations</span> that drive business.
          </p>
          <p className="text-base text-black/60 max-w-3xl mx-auto leading-relaxed animate-[fadeInUp_0.6s_ease-out_0.6s_both]">
            We partner with diverse businesses to strategically place them in prime commercial locations, ensuring high footfall and maximum visibility.
          </p>
        </div>

        {/* Business Categories - Futuristic Cards */}
        <div className="mb-24">
          <h3 className="text-3xl font-black text-black text-center mb-12 animate-[fadeInUp_0.6s_ease-out_0.8s_both]">
            Industries We <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Power</span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Card 1 */}
            <div className="group relative animate-[fadeInUp_0.6s_ease-out_1s_both]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-black/10 rounded-3xl p-8 hover:bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-black text-black mb-3">Food & Beverage</h4>
                <p className="text-sm text-black/60 leading-relaxed">Leading F&B brands seeking premium locations</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative animate-[fadeInUp_0.6s_ease-out_1.1s_both]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-black/10 rounded-3xl p-8 hover:bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h4 className="text-xl font-black text-black mb-3">Retail Chains</h4>
                <p className="text-sm text-black/60 leading-relaxed">Established retail businesses expanding nationwide</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative animate-[fadeInUp_0.6s_ease-out_1.2s_both]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-rose-600 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-black/10 rounded-3xl p-8 hover:bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-full blur-2xl"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <h4 className="text-xl font-black text-black mb-3">Cafés & QSRs</h4>
                <p className="text-sm text-black/60 leading-relaxed">Quick service restaurants and trendy cafés</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="group relative animate-[fadeInUp_0.6s_ease-out_1.3s_both]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-black/10 rounded-3xl p-8 hover:bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="text-xl font-black text-black mb-3">Premium Dining</h4>
                <p className="text-sm text-black/60 leading-relaxed">Fine dining, bars, and craft breweries</p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="group relative animate-[fadeInUp_0.6s_ease-out_1.4s_both]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-black/10 rounded-3xl p-8 hover:bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-full blur-2xl"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-black text-black mb-3">Entertainment</h4>
                <p className="text-sm text-black/60 leading-relaxed">Sports, leisure, and entertainment venues</p>
              </div>
            </div>

            {/* Card 6 */}
            <div className="group relative animate-[fadeInUp_0.6s_ease-out_1.5s_both]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-black/10 rounded-3xl p-8 hover:bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-xl font-black text-black mb-3">Emerging Brands</h4>
                <p className="text-sm text-black/60 leading-relaxed">Fast-growing startups across all sectors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Logos Section - Futuristic */}
        <div className="relative group animate-[fadeInUp_0.6s_ease-out_1.6s_both]">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-[2rem] opacity-20 group-hover:opacity-30 blur-xl transition duration-700"></div>
          <div className="relative bg-white/90 backdrop-blur-2xl border border-black/10 rounded-[2rem] p-16">
            <h3 className="text-3xl font-black text-black text-center mb-4">
              Trusted by <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Leading Brands</span>
            </h3>
            <p className="text-center text-black/60 mb-12 max-w-2xl mx-auto">Powering growth for India's most ambitious businesses</p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 items-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="group/logo relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-0 group-hover/logo:opacity-20 blur transition duration-300"></div>
                  <div className="relative flex items-center justify-center h-20 bg-white border border-black/5 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1">
                    <span className="text-xs text-black/30 font-semibold">Brand {i}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-black/30 mt-8 italic">
              * Logos will be added from gvsventures.in
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="group relative bg-white/5 backdrop-blur-xl border border-violet-500/20 p-8 rounded-3xl hover:bg-white/10 transition-all duration-500 transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-violet-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Search</h3>
              <p className="text-white/60 leading-relaxed">Next-generation algorithms match your exact requirements with perfect properties in real-time.</p>
            </div>
          </div>
          
          <div className="group relative bg-white/5 backdrop-blur-xl border border-cyan-500/20 p-8 rounded-3xl hover:bg-white/10 transition-all duration-500 transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Premium Locations</h3>
              <p className="text-white/60 leading-relaxed">Exclusive access to the most sought-after commercial spaces in prime business districts worldwide.</p>
            </div>
          </div>
          
          <div className="group relative bg-white/5 backdrop-blur-xl border border-fuchsia-500/20 p-8 rounded-3xl hover:bg-white/10 transition-all duration-500 transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-violet-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-600 to-violet-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-fuchsia-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Blockchain Verified</h3>
              <p className="text-white/60 leading-relaxed">Every listing is cryptographically verified and secured with immutable blockchain technology.</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="relative bg-white/5 backdrop-blur-2xl border border-violet-500/10 rounded-3xl p-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-cyan-500/5"></div>
          <div className="relative z-10 grid md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-5xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">2.5K+</div>
              <div className="text-white/80 font-medium">Premium Properties</div>
              <div className="text-violet-300/50 text-sm mt-1">Globally Listed</div>
            </div>
            <div className="group">
              <div className="text-5xl font-black bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">1.2K+</div>
              <div className="text-white/80 font-medium">Enterprise Brands</div>
              <div className="text-cyan-300/50 text-sm mt-1">Actively Searching</div>
            </div>
            <div className="group">
              <div className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">850+</div>
              <div className="text-white/80 font-medium">Property Partners</div>
              <div className="text-violet-300/50 text-sm mt-1">Verified Owners</div>
            </div>
            <div className="group">
              <div className="text-5xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">120+</div>
              <div className="text-white/80 font-medium">Global Cities</div>
              <div className="text-fuchsia-300/50 text-sm mt-1">Market Coverage</div>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-10 left-10 w-3 h-3 bg-violet-400 rounded-full animate-ping shadow-lg shadow-violet-500/50"></div>
          <div className="absolute bottom-10 right-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping delay-1000 shadow-lg shadow-cyan-500/50"></div>
          <div className="absolute top-1/2 right-20 w-1 h-1 bg-fuchsia-400 rounded-full animate-ping delay-2000 shadow-lg shadow-fuchsia-500/50"></div>
        </div>
      </div>
    </div>
  )
}
