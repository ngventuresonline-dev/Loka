'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DynamicBackground from '@/components/DynamicBackground'
import BrandOnboardingForm from '@/components/onboarding/BrandOnboardingForm'
import PropertyOwnerOnboardingForm from '@/components/onboarding/PropertyOwnerOnboardingForm'
import Dashboard from '@/components/Dashboard'
import AiSearchModal from '@/components/AiSearchModal'
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
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)

  // Handle AI Search - Open modal with query
  const handleSearch = () => {
    if (!searchQuery.trim()) return
    setIsAiModalOpen(true)
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
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 hover:bg-white hover:shadow-lg transition-all"
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
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 hover:bg-white hover:shadow-lg transition-all"
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
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 hover:bg-white hover:shadow-lg transition-all"
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
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 hover:bg-white hover:shadow-lg transition-all"
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
      {/* Advanced Animated Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Subtle Grid */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255, 82, 0, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 82, 0, 0.5) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
            animation: 'grid 40s linear infinite'
          }}></div>
        </div>
        
        {/* Multiple Floating Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#FF5200]/10 via-[#E4002B]/5 to-transparent rounded-full blur-[120px] animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#E4002B]/8 via-[#FF6B35]/4 to-transparent rounded-full blur-[100px] animate-[float_25s_ease-in-out_infinite_5s]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-gradient-to-br from-[#FF6B35]/6 via-[#FF5200]/3 to-transparent rounded-full blur-[90px] animate-[float_18s_ease-in-out_infinite_10s]"></div>
        
        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full opacity-40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>

        {/* Scanning Beams */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 left-1/6 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_5s_ease-in-out_infinite]"></div>
          <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_5s_ease-in-out_infinite_1s]"></div>
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-[#FF6B35] to-transparent animate-[scan_5s_ease-in-out_infinite_2s]"></div>
          <div className="absolute top-0 right-1/6 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_5s_ease-in-out_infinite_3s]"></div>
        </div>
      </div>
      
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 mt-12 sm:mt-16 md:mt-20" style={{ zIndex: 10 }}>
        {/* Subtle City Dots - No Lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          {[
            {top: '20%', left: '15%', delay: '0s'},
            {top: '35%', left: '75%', delay: '0.5s'},
            {top: '60%', left: '25%', delay: '1s'},
            {top: '75%', left: '80%', delay: '1.5s'},
            {top: '45%', left: '50%', delay: '2s'}
          ].map((dot, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] animate-pulse"
              style={{top: dot.top, left: dot.left, animationDelay: dot.delay}}
            />
          ))}
        </div>

        <div className="text-center max-w-6xl mx-auto px-6 sm:px-6 lg:px-8">
          {/* Trust Indicator Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 backdrop-blur-xl rounded-full mb-6 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.1s_forwards] transition-all duration-700 bg-white/90 border border-gray-200 shadow-sm">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] border-2 border-white"></div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E4002B] to-[#FF6B35] border-2 border-white"></div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF5200] border-2 border-white"></div>
            </div>
            <span className="text-sm font-medium transition-colors duration-700 text-gray-700">Trusted by 500+ brands across 15 cities</span>
          </div>
          
          {/* Focused Hero Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-5 leading-tight tracking-tight opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
            <span className="transition-colors duration-700 text-gray-900">Find Your Perfect</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] bg-[length:200%_200%] animate-gradientShift">Commercial Space</span>
          </h1>
          
          {/* Clear Value Prop */}
          <p className="text-base sm:text-lg md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto opacity-0 animate-[fadeInUp_0.8s_ease-out_0.3s_forwards] transition-colors duration-700 text-gray-600">
            AI-powered matching in 48 hours. Just describe what you need.
          </p>
          
          {/* Hero Search Bar - Original Design */}
          <div className="opacity-0 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards] mb-5 md:mb-8 px-2 sm:px-4 transition-all duration-700">
            <div className="relative max-w-5xl mx-auto group">
              {/* Animated gradient border */}
              <div className="absolute -inset-[2px] bg-gradient-to-r rounded-[22px] blur-sm transition-all duration-700 bg-[length:200%_200%] from-[#FF5200] via-[#E4002B] to-[#FF6B35] opacity-60 group-hover:opacity-100 animate-gradientShift"></div>
              
              {/* Main Search Container */}
              <div className="relative rounded-[20px] transition-all duration-700 bg-white shadow-lg hover:shadow-2xl">
                <div className="flex flex-row items-center gap-1 sm:gap-3 p-2">
                  {/* AI Icon */}
                  <div className="pl-1 sm:pl-3 flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 from-[#FF5200] to-[#E4002B]">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                    placeholder="Describe your ideal space or list what you have..."
                    className="flex-1 min-w-0 bg-transparent placeholder-gray-400 text-sm sm:text-base md:text-lg py-3 sm:py-4 px-2 focus:outline-none transition-all duration-500 text-gray-900"
                  />
                  
                  {/* Search Button */}
                  <button 
                    onClick={handleSearch}
                    className="flex-shrink-0 px-3 sm:px-8 py-2.5 sm:py-3.5 bg-gradient-to-r text-white rounded-[16px] font-semibold text-sm sm:text-base transition-all duration-500 flex items-center gap-1.5 sm:gap-2 mr-1 sm:mr-2 from-[#FF5200] to-[#E4002B] hover:shadow-lg"
                  >
                    <span>Search</span>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Quick Action Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.5s_forwards] transition-all duration-700">
              <button 
                onClick={() => {
                  setSearchQuery('Looking for retail space in Koramangala, Bangalore, around 1200 sqft')
                  // Don't open modal - let user edit and click search
                }}
                className="px-4 py-2 border-2 rounded-full text-sm font-medium transition-all duration-500 bg-white border-gray-200 text-gray-700 hover:border-[#FF5200] hover:text-[#FF5200] hover:shadow-md"
              >
                For Brands
              </button>
              <button 
                onClick={() => {
                  setSearchQuery('I have a 1500 sqft retail space available on MG Road, Bangalore')
                  // Don't open modal - let user edit and click search
                }}
                className="px-4 py-2 border-2 rounded-full text-sm font-medium transition-all duration-500 bg-white border-gray-200 text-gray-700 hover:border-[#E4002B] hover:text-[#E4002B] hover:shadow-md"
              >
                For Owners
              </button>
            </div>
            
            {/* Help Text */}
            <p className="text-xs sm:text-sm text-gray-500 text-center mt-4 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards]">
              Click a tag above or describe what you're looking for · Results powered by AI
            </p>
          </div>
        </div>
      </div>

      {/* Clientele Slider - Full Width */}
      <div className="relative z-10 mt-20 md:mt-24 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.8s_forwards]">
        <div className="text-center mb-14 md:mb-16">
          <div className="inline-flex items-center px-5 py-2 bg-white/90 backdrop-blur-xl border border-[#FF5200]/20 rounded-full shadow-[0_0_25px_rgba(255,82,0,0.15)]">
            <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2.5 animate-pulse shadow-[0_0_8px_rgba(255,82,0,0.9)]"></span>
            <span className="text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">Trusted by Leading Brands</span>
          </div>
        </div>
        
        {/* Subtle ambient glow behind rows */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#FF5200]/5 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute top-2/3 right-1/4 w-96 h-96 bg-[#E4002B]/5 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        {/* First Row - Scrolling Left (Slower, Seamless) */}
        <div className="relative overflow-hidden mb-5">
          <div className="flex gap-5 md:gap-6 animate-[scroll_60s_linear_infinite]">
            {[
              'Truffles', 'Original Burger Co.', 'Mumbai Pav Co.', 'Evil Onigiri', 'Roma Deli', 'Blr Brewing Co.', 'Birch, by Romeo Lane', 'Burger Seigneur', 'Biggies Burger', 'The Flour Girl Cafe',
              'Truffles', 'Original Burger Co.', 'Mumbai Pav Co.', 'Evil Onigiri', 'Roma Deli', 'Blr Brewing Co.', 'Birch, by Romeo Lane', 'Burger Seigneur', 'Biggies Burger', 'The Flour Girl Cafe',
              'Truffles', 'Original Burger Co.', 'Mumbai Pav Co.', 'Evil Onigiri', 'Roma Deli', 'Blr Brewing Co.', 'Birch, by Romeo Lane', 'Burger Seigneur', 'Biggies Burger', 'The Flour Girl Cafe'
            ].map((brand, idx) => (
              <div 
                key={idx}
                className="relative flex-shrink-0 h-16 md:h-18 px-7 md:px-9 bg-white border border-gray-200/60 rounded-xl flex items-center justify-center transition-all duration-500 group cursor-pointer select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(255,82,0,0.15)] hover:-translate-y-0.5 hover:border-[#FF5200]/40"
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF5200]/0 via-[#FF5200]/0 to-[#FF5200]/0 group-hover:from-[#FF5200]/5 group-hover:via-[#FF5200]/10 group-hover:to-[#FF5200]/5 transition-all duration-500"></div>
                
                {/* Border glow pulse */}
                <div className="absolute inset-0 rounded-xl border border-[#FF5200]/0 group-hover:border-[#FF5200]/20 group-hover:animate-pulse transition-all duration-500"></div>
                
                <span className="relative text-gray-700 font-semibold text-sm md:text-base whitespace-nowrap group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#FF5200] group-hover:to-[#E4002B] transition-all duration-500">
                  {brand}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Second Row - Scrolling Right (Slower, Seamless) */}
        <div className="relative overflow-hidden mb-5">
          <div className="flex gap-5 md:gap-6 animate-[scrollReverse_60s_linear_infinite]">
            {[
              'Bawri', 'Boba Bhai', 'GoRally- Sports', 'Dolphins Bar & Kitchen', 'Klutch- Sports', 'Romeo Lane', 'Sun Kissed Smoothie', 'Qirfa', 'Zed The Baker', 'Blue Tokai',
              'Bawri', 'Boba Bhai', 'GoRally- Sports', 'Dolphins Bar & Kitchen', 'Klutch- Sports', 'Romeo Lane', 'Sun Kissed Smoothie', 'Qirfa', 'Zed The Baker', 'Blue Tokai',
              'Bawri', 'Boba Bhai', 'GoRally- Sports', 'Dolphins Bar & Kitchen', 'Klutch- Sports', 'Romeo Lane', 'Sun Kissed Smoothie', 'Qirfa', 'Zed The Baker', 'Blue Tokai'
            ].map((brand, idx) => (
              <div 
                key={idx}
                className="relative flex-shrink-0 h-16 md:h-18 px-7 md:px-9 bg-white border border-gray-200/60 rounded-xl flex items-center justify-center transition-all duration-500 group cursor-pointer select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(228,0,43,0.15)] hover:-translate-y-0.5 hover:border-[#E4002B]/40"
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#E4002B]/0 via-[#E4002B]/0 to-[#E4002B]/0 group-hover:from-[#E4002B]/5 group-hover:via-[#E4002B]/10 group-hover:to-[#E4002B]/5 transition-all duration-500"></div>
                
                {/* Border glow pulse */}
                <div className="absolute inset-0 rounded-xl border border-[#E4002B]/0 group-hover:border-[#E4002B]/20 group-hover:animate-pulse transition-all duration-500"></div>
                
                <span className="relative text-gray-700 font-semibold text-sm md:text-base whitespace-nowrap group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#E4002B] group-hover:to-[#FF5200] transition-all duration-500">
                  {brand}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Third Row - Scrolling Left (Slower, Seamless) */}
        <div className="relative overflow-hidden">
          <div className="flex gap-5 md:gap-6 animate-[scroll_60s_linear_infinite]">
            {[
              'Sandowitch', 'Madam Chocolate', 'Eleven Bakehouse', 'Kunafa Story', 'Namaste- South Indian', 'Kried Ko- Burger', 'Samosa Party', 'Melts- Cruncheese', 'TAN Coffee', 'Block Two Coffee',
              'Sandowitch', 'Madam Chocolate', 'Eleven Bakehouse', 'Kunafa Story', 'Namaste- South Indian', 'Kried Ko- Burger', 'Samosa Party', 'Melts- Cruncheese', 'TAN Coffee', 'Block Two Coffee',
              'Sandowitch', 'Madam Chocolate', 'Eleven Bakehouse', 'Kunafa Story', 'Namaste- South Indian', 'Kried Ko- Burger', 'Samosa Party', 'Melts- Cruncheese', 'TAN Coffee', 'Block Two Coffee'
            ].map((brand, idx) => (
              <div 
                key={idx}
                className="relative flex-shrink-0 h-16 md:h-18 px-7 md:px-9 bg-white border border-gray-200/60 rounded-xl flex items-center justify-center transition-all duration-500 group cursor-pointer select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(255,107,53,0.15)] hover:-translate-y-0.5 hover:border-[#FF6B35]/40"
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF6B35]/0 via-[#FF6B35]/0 to-[#FF6B35]/0 group-hover:from-[#FF6B35]/5 group-hover:via-[#FF6B35]/10 group-hover:to-[#FF6B35]/5 transition-all duration-500"></div>
                
                {/* Border glow pulse */}
                <div className="absolute inset-0 rounded-xl border border-[#FF6B35]/0 group-hover:border-[#FF6B35]/20 group-hover:animate-pulse transition-all duration-500"></div>
                
                <span className="relative text-gray-700 font-semibold text-sm md:text-base whitespace-nowrap group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#FF6B35] group-hover:to-[#FF5200] transition-all duration-500">
                  {brand}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Futuristic Transition with Scanning Beams */}
      <div className="relative z-10 h-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/6 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_3s_ease-in-out_infinite] shadow-[0_0_10px_rgba(255,82,0,0.5)]"></div>
          <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_3s_ease-in-out_infinite_1s] shadow-[0_0_10px_rgba(228,0,43,0.5)]"></div>
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-[#FF6B35] to-transparent animate-[scan_3s_ease-in-out_infinite_2s] shadow-[0_0_10px_rgba(255,107,53,0.5)]"></div>
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_3s_ease-in-out_infinite_0.5s] shadow-[0_0_10px_rgba(255,82,0,0.5)]"></div>
          <div className="absolute top-0 right-1/6 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_3s_ease-in-out_infinite_1.5s] shadow-[0_0_10px_rgba(228,0,43,0.5)]"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent opacity-50 shadow-[0_0_15px_rgba(255,82,0,0.5)] animate-pulse"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E4002B] to-transparent opacity-50 shadow-[0_0_15px_rgba(228,0,43,0.5)] animate-pulse"></div>
      </div>

      {/* How It Works - Card-Based Layout */}
      <section className="relative z-10 bg-gradient-to-b from-white via-gray-50/30 to-white py-24 md:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-20 w-96 h-96 bg-gradient-to-br from-[#FF5200]/5 to-transparent rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-gradient-to-br from-[#E4002B]/5 to-transparent rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
            <div className="inline-flex items-center px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-white/80 backdrop-blur-xl border border-[#FF5200]/20 rounded-full mb-4 sm:mb-5 md:mb-6 shadow-[0_0_20px_rgba(255,82,0,0.1)]">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 sm:mr-2.5 animate-pulse shadow-[0_0_5px_rgba(255,82,0,0.8)]"></span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Simple & Fast Process</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight tracking-tight px-4">
              How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] animate-gradientShift bg-[length:400%_400%]">Works</span>
            </h2>
            
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              From onboarding to deal closure - powered by AI in just 4 steps
            </p>
          </div>

          {/* Process Steps - Sleek Cards in 2x2 Grid */}
          <div className="grid md:grid-cols-2 gap-5 lg:gap-6 relative z-10 mb-20">
            {/* Step 1 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
              <div className="relative h-full bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#FF5200] hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF5200]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl font-black text-[#FF5200]">01</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#FF5200]/30 to-transparent"></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Up & Onboard</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        Create your profile as a Brand or Property Owner. Complete onboarding in under 5 minutes.
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[#FF5200] font-semibold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        5 minutes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
              <div className="relative h-full bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#E4002B] hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#E4002B]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#E4002B] to-[#FF6B35] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl font-black text-[#E4002B]">02</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#E4002B]/30 to-transparent"></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analyzes Data</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        Our AI engine processes your requirements with location intelligence and market data.
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[#E4002B] font-semibold">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Real-time processing
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
              <div className="relative h-full bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#FF6B35] hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF6B35]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B35] to-[#FF5200] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl font-black text-[#FF6B35]">03</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#FF6B35]/30 to-transparent"></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Get Top 5 Matches</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        Receive your Top 5 AI-scored matches with detailed insights and instant notifications.
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[#FF6B35] font-semibold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Top 5 curated
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards]">
              <div className="relative h-full bg-white border border-gray-200 rounded-2xl p-6 hover:border-green-500 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl font-black text-green-600">04</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-green-600/30 to-transparent"></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Close the Deal</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        Review, shortlist, and connect directly. Our platform facilitates smooth deal closure.
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Deal completed
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Old content removed */}
          <div className="relative mb-20 hidden">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] animate-gradientShift bg-[length:200%_200%] opacity-30"></div>
            </div>

            {/* Steps Grid */}
            <div className="grid md:grid-cols-4 gap-6 sm:gap-8 relative z-10">
              {/* Step 1 */}
              <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]" style={{animationDelay: '0.2s'}}>
                <div className="flex flex-col items-center text-center">
                  {/* Icon Circle */}
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                      <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-white border-3 sm:border-4 border-[#FF5200] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xl sm:text-2xl font-black text-[#FF5200]">1</span>
                    </div>
                    {/* Pulse Animation */}
                    <div className="absolute inset-0 rounded-full border-2 border-[#FF5200] animate-ping opacity-20"></div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Sign Up & Onboard</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Create your profile as a Brand or Property Owner. Complete onboarding in <span className="font-semibold text-[#FF5200]">under 5 minutes</span> with our intuitive forms.
                  </p>
                  
                  {/* Floating Badge */}
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-[#FF5200]/10 rounded-full">
                    <svg className="w-4 h-4 text-[#FF5200] mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-[#FF5200]">~5 mins</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]" style={{animationDelay: '0.4s'}}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-[#E4002B] to-[#FF6B35] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                      <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-white border-3 sm:border-4 border-[#E4002B] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xl sm:text-2xl font-black text-[#E4002B]">2</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-[#E4002B] animate-ping opacity-20"></div>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">AI Analyzes Data</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Our AI engine processes your requirements with <span className="font-semibold text-[#E4002B]">location intelligence</span> - footfall, demographics, competitors, accessibility.
                  </p>
                  
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-[#E4002B]/10 rounded-full">
                    <svg className="w-4 h-4 text-[#E4002B] mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-xs font-semibold text-[#E4002B]">Processing</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards]" style={{animationDelay: '0.6s'}}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-[#FF6B35] to-[#FF5200] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                      <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-white border-3 sm:border-4 border-[#FF6B35] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xl sm:text-2xl font-black text-[#FF6B35]">3</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-[#FF6B35] animate-ping opacity-20"></div>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Get Top 5 Matches</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Receive your <span className="font-semibold text-[#FF6B35]">Top 5 AI-scored matches</span> with BFI/PFI ratings, detailed insights, and instant WhatsApp notifications.
                  </p>
                  
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-[#FF6B35]/10 rounded-full">
                    <svg className="w-4 h-4 text-[#FF6B35] mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-[#FF6B35]">Top 5</span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.8s_forwards]" style={{animationDelay: '0.8s'}}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                      <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-white border-3 sm:border-4 border-[#FF5200] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xl sm:text-2xl font-black text-[#FF5200]">4</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-[#FF5200] animate-ping opacity-20"></div>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Close the Deal</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Review, shortlist, and connect directly. Our platform facilitates smooth communication to <span className="font-semibold text-[#FF5200]">finalize agreements</span> fast.
                  </p>
                  
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-100 rounded-full">
                    <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-green-600">Success</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Journey Visualization - Redesigned */}
          <div className="relative mb-20 opacity-0 animate-[fadeInUp_0.8s_ease-out_1s_forwards]" style={{animationDelay: '1s'}}>
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 px-4">
                Your Journey <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Timeline</span>
              </h3>
              <p className="text-gray-600 mb-2">From first click to final handshake - we make it seamless</p>
              <div className="flex flex-col items-center gap-2">
                <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-[#FF5200]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Average completion: <span className="font-semibold ml-1">14-30 days</span>
                </div>
                <p className="text-xs text-gray-500 max-w-md text-center">*depending on external factors like financial readiness and documentation</p>
              </div>
            </div>

            {/* Horizontal Timeline Container */}
            <div className="relative max-w-6xl mx-auto">
              {/* Progress Bar Background */}
              <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gray-200 rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-green-500 rounded-full opacity-30 animate-pulse"></div>
              </div>

              {/* Timeline Stages */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4">
                {/* Stage 1 - Onboarding */}
                <div className="group relative">
                  <div className="flex flex-col items-center text-center">
                    {/* Icon with Progress Ring */}
                    <div className="relative mb-4">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="#f0f0f0" strokeWidth="8" fill="none"/>
                        <circle cx="64" cy="64" r="58" stroke="url(#gradient1)" strokeWidth="8" fill="none" strokeDasharray="364" strokeDashoffset="0" className="transition-all duration-1000"/>
                        <defs>
                          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF5200"/>
                            <stop offset="100%" stopColor="#E4002B"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Timeline Badge */}
                    <div className="inline-flex items-center px-3 py-1 bg-[#FF5200] text-white rounded-full text-xs font-bold mb-3 shadow-lg">
                      DAY 1
                    </div>
                    
                    {/* Content Card */}
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-[#FF5200] hover:shadow-xl transition-all duration-300 w-full group-hover:-translate-y-1">
                      <h4 className="text-base font-bold text-gray-900 mb-2">Sign Up</h4>
                      <p className="text-xs text-gray-600 mb-3">Quick 5-min onboarding with smart forms</p>
                      
                      {/* Action Items */}
                      <div className="space-y-1 flex flex-col items-center">
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Profile creation</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Requirements input</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Preferences set</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 2 - AI Analysis */}
                <div className="group relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="#f0f0f0" strokeWidth="8" fill="none"/>
                        <circle cx="64" cy="64" r="58" stroke="url(#gradient2)" strokeWidth="8" fill="none" strokeDasharray="364" strokeDashoffset="91" className="transition-all duration-1000"/>
                        <defs>
                          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#E4002B"/>
                            <stop offset="100%" stopColor="#FF6B35"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#E4002B] to-[#FF6B35] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-12 h-12 text-white animate-spin" style={{animationDuration: '3s'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="inline-flex items-center px-3 py-1 bg-[#E4002B] text-white rounded-full text-xs font-bold mb-3 shadow-lg">
                      DAY 2
                    </div>
                    
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-[#E4002B] hover:shadow-xl transition-all duration-300 w-full group-hover:-translate-y-1">
                      <h4 className="text-base font-bold text-gray-900 mb-2">AI Analysis</h4>
                      <p className="text-xs text-gray-600 mb-3">Intelligent data processing begins</p>
                      
                      <div className="space-y-1 flex flex-col items-center">
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-yellow-500 mr-1 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>Location scoring</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-yellow-500 mr-1 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>Demographics match</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-yellow-500 mr-1 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>BFI/PFI calculation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 3 - Matches */}
                <div className="group relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="#f0f0f0" strokeWidth="8" fill="none"/>
                        <circle cx="64" cy="64" r="58" stroke="url(#gradient3)" strokeWidth="8" fill="none" strokeDasharray="364" strokeDashoffset="182" className="transition-all duration-1000"/>
                        <defs>
                          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF6B35"/>
                            <stop offset="100%" stopColor="#FF5200"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#FF6B35] to-[#FF5200] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="inline-flex items-center px-3 py-1 bg-[#FF6B35] text-white rounded-full text-xs font-bold mb-3 shadow-lg">
                      DAY 3-7
                    </div>
                    
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-[#FF6B35] hover:shadow-xl transition-all duration-300 w-full group-hover:-translate-y-1">
                      <h4 className="text-base font-bold text-gray-900 mb-2">Top Matches</h4>
                      <p className="text-xs text-gray-600 mb-3">Your curated list delivered</p>
                      
                      <div className="space-y-1 flex flex-col items-center">
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-blue-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          <span>Top 5 properties</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-blue-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          <span>Detailed insights</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-blue-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          <span>WhatsApp alerts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 4 - Decision */}
                <div className="group relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="#f0f0f0" strokeWidth="8" fill="none"/>
                        <circle cx="64" cy="64" r="58" stroke="url(#gradient4)" strokeWidth="8" fill="none" strokeDasharray="364" strokeDashoffset="273" className="transition-all duration-1000"/>
                        <defs>
                          <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF5200"/>
                            <stop offset="100%" stopColor="#E4002B"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="inline-flex items-center px-3 py-1 bg-[#FF5200] text-white rounded-full text-xs font-bold mb-3 shadow-lg">
                      DAY 8-14
                    </div>
                    
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-[#FF5200] hover:shadow-xl transition-all duration-300 w-full group-hover:-translate-y-1">
                      <h4 className="text-base font-bold text-gray-900 mb-2">Review & Decide</h4>
                      <p className="text-xs text-gray-600 mb-3">Connect and evaluate options</p>
                      
                      <div className="space-y-1 flex flex-col items-center">
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-purple-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                          </svg>
                          <span>Direct messaging</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-purple-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                          </svg>
                          <span>Site visits</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-purple-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                          </svg>
                          <span>Negotiations</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 5 - Success */}
                <div className="group relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="#f0f0f0" strokeWidth="8" fill="none"/>
                        <circle cx="64" cy="64" r="58" stroke="#10b981" strokeWidth="8" fill="none" strokeDasharray="364" strokeDashoffset="0" className="transition-all duration-1000"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold mb-3 shadow-lg">
                      DAY 14-30
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-2xl p-4 hover:border-green-500 hover:shadow-xl transition-all duration-300 w-full group-hover:-translate-y-1">
                      <h4 className="text-base font-bold text-gray-900 mb-2">Deal Closed!</h4>
                      <p className="text-xs text-gray-600 mb-3">Success & move-in ready</p>
                      
                      <div className="space-y-1 flex flex-col items-center">
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-green-600 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          <span>Agreement signed</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-green-600 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          <span>Keys handed over</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-700">
                          <svg className="w-3 h-3 text-green-600 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          <span>Business starts!</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Explainer Video Section */}
          <div className="relative opacity-0 animate-[fadeInUp_0.8s_ease-out_1.2s_forwards]" style={{animationDelay: '1.2s'}}>
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                See It In <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Action</span>
              </h3>
              <p className="text-gray-600">Watch how brands and property owners are transforming their real estate journey</p>
            </div>

            {/* Video Player Illustration */}
            <div className="relative group max-w-5xl mx-auto">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] rounded-3xl opacity-30 group-hover:opacity-50 blur-xl transition-all duration-700 animate-gradientShift bg-[length:200%_200%]"></div>
              
              <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800">
                {/* Video Illustration */}
                <div className="aspect-video bg-gradient-to-br from-gray-800 via-gray-900 to-black relative overflow-hidden">
                  {/* Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'linear-gradient(#FF5200 1px, transparent 1px), linear-gradient(90deg, #FF5200 1px, transparent 1px)',
                      backgroundSize: '50px 50px',
                      animation: 'grid 20s linear infinite'
                    }}></div>
                  </div>

                  {/* Floating Icons */}
                  <div className="absolute top-8 left-8 w-16 h-16 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-2xl flex items-center justify-center animate-[float_3s_ease-in-out_infinite] opacity-80">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>

                  <div className="absolute top-8 right-8 w-16 h-16 bg-gradient-to-br from-[#E4002B] to-[#FF6B35] rounded-2xl flex items-center justify-center animate-[float_3s_ease-in-out_infinite_1s] opacity-80">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>

                  {/* Data Flow Animation */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center justify-between">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-12 h-32 bg-gradient-to-t from-[#FF5200] to-transparent rounded-t-lg opacity-50 animate-pulse" style={{animationDelay: (i * 0.2) + 's', height: (Math.random() * 60 + 40) + 'px'}}></div>
                      ))}
                    </div>
                  </div>

                  {/* Central Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="group/play relative">
                      {/* Pulsing Rings */}
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse"></div>
                      
                      {/* Play Button */}
                      <div className="relative w-24 h-24 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-transform duration-300 cursor-pointer">
                        <svg className="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      
                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full blur-2xl opacity-50 group-hover/play:opacity-75 transition-opacity"></div>
                    </button>
                  </div>

                  {/* Stats Overlay */}
                  <div className="absolute top-1/2 left-8 transform -translate-y-1/2 space-y-3">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 animate-[fadeInUp_0.8s_ease-out_forwards]">
                      <div className="text-2xl font-bold text-white">95%</div>
                      <div className="text-xs text-gray-300">Match Success</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
                      <div className="text-2xl font-bold text-white">48hrs</div>
                      <div className="text-xs text-gray-300">Avg Response</div>
                    </div>
                  </div>

                  <div className="absolute top-1/2 right-8 transform -translate-y-1/2 space-y-3">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
                      <div className="text-2xl font-bold text-white">500+</div>
                      <div className="text-xs text-gray-300">Properties</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards]">
                      <div className="text-2xl font-bold text-white">15+</div>
                      <div className="text-xs text-gray-300">Cities</div>
                    </div>
                  </div>
                </div>

                {/* Video Controls Bar */}
                <div className="bg-black/50 backdrop-blur-md px-6 py-4">
                  <div className="flex items-center gap-4">
                    <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                    
                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-gradient-to-r from-[#FF5200] to-[#E4002B]"></div>
                    </div>
                    
                    <span className="text-white text-sm font-mono">1:24 / 3:45</span>
                  </div>
                </div>
              </div>

              {/* Video Description */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 mb-4">
                  <span className="font-semibold text-gray-900">Coming Soon:</span> Interactive video walkthrough showing the complete journey from sign-up to successful deal closure
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-[#FF5200]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    3 min overview
                  </div>
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-[#E4002B]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                    Real case studies
                  </div>
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-[#FF6B35]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    AI insights demo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Futuristic Transition Element with Circuit Board Pattern */}
      <div className="relative z-10 h-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/30 via-gray-100/50 to-white"></div>
        
        {/* Circuit Board Lines */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M10 10 L30 10 L30 30 M70 10 L90 10 L90 30 M30 50 L50 50 L50 70 M70 70 L90 70 L90 90" 
                      stroke="#FF5200" strokeWidth="1" fill="none"/>
                <circle cx="30" cy="30" r="2" fill="#FF5200"/>
                <circle cx="50" cy="50" r="2" fill="#E4002B"/>
                <circle cx="70" cy="70" r="2" fill="#FF6B35"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)"/>
          </svg>
        </div>
        
        {/* Scanning Beams */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-[#FF5200] via-transparent to-transparent animate-[scan_3s_ease-in-out_infinite] shadow-[0_0_10px_rgba(255,82,0,0.5)]"></div>
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-[#E4002B] via-transparent to-transparent animate-[scan_3s_ease-in-out_infinite_1s] shadow-[0_0_10px_rgba(228,0,43,0.5)]"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-[#FF6B35] via-transparent to-transparent animate-[scan_3s_ease-in-out_infinite_2s] shadow-[0_0_10px_rgba(255,107,53,0.5)]"></div>
        </div>
        
        {/* Energy Flow Line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent opacity-50">
          <div className="absolute top-0 left-0 w-20 h-px bg-gradient-to-r from-transparent to-[#FF5200] shadow-[0_0_10px_rgba(255,82,0,0.8)] animate-[scroll_3s_linear_infinite]"></div>
        </div>
      </div>

      {/* Location Intelligence Section with Network Visualization */}
      <section className="relative z-10 bg-gradient-to-b from-white via-gray-50/50 to-white py-24 md:py-32 overflow-hidden">
        {/* Network Visualization - Connecting Dots and Beams */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Connection Lines/Beams */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF5200" stopOpacity="0"/>
                <stop offset="50%" stopColor="#FF5200" stopOpacity="1"/>
                <stop offset="100%" stopColor="#E4002B" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="url(#beam1)" strokeWidth="2" className="animate-pulse">
              <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite"/>
            </line>
            <line x1="90%" y1="20%" x2="10%" y2="80%" stroke="url(#beam1)" strokeWidth="2" className="animate-pulse" style={{animationDelay: '1s'}}>
              <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" begin="1s"/>
            </line>
            <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="url(#beam1)" strokeWidth="2" className="animate-pulse" style={{animationDelay: '2s'}}>
              <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" begin="2s"/>
            </line>
            <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="url(#beam1)" strokeWidth="2" className="animate-pulse" style={{animationDelay: '0.5s'}}>
              <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" begin="0.5s"/>
            </line>
          </svg>
          
          {/* Network Nodes/Dots */}
          {[
            {top: '20%', left: '10%', delay: '0s'},
            {top: '20%', left: '90%', delay: '0.5s'},
            {top: '80%', left: '10%', delay: '1s'},
            {top: '80%', left: '90%', delay: '1.5s'},
            {top: '50%', left: '20%', delay: '0.3s'},
            {top: '50%', left: '80%', delay: '0.8s'},
            {top: '10%', left: '50%', delay: '1.2s'},
            {top: '90%', left: '50%', delay: '1.7s'},
            {top: '35%', left: '45%', delay: '0.6s'},
            {top: '65%', left: '55%', delay: '1.3s'}
          ].map((node, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] shadow-[0_0_15px_rgba(255,82,0,0.6)]"
              style={{
                top: node.top,
                left: node.left,
                animation: 'pulse 2s ease-in-out infinite',
                animationDelay: node.delay
              } as React.CSSProperties}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] animate-ping opacity-75"></div>
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
            <div className="inline-flex items-center px-5 py-2 bg-white/80 backdrop-blur-xl border border-[#FF5200]/20 rounded-full mb-6 shadow-[0_0_20px_rgba(255,82,0,0.1)]">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2.5 animate-pulse shadow-[0_0_5px_rgba(255,82,0,0.8)]"></span>
              <span className="text-sm font-medium text-gray-700">Futuristic Technology</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
              Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Location Intelligence</span>
            </h2>
            
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
              Advanced data analytics and AI scoring enriched with real-time location insights for perfect property-brand matching
            </p>
          </div>

          {/* Intelligence Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Feature 1 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]" style={{animationDelay: '0.2s'}}>
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-6 hover:border-[#FF5200] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200]/20 to-[#E4002B]/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Footfall Heatmaps</h4>
                <p className="text-sm text-gray-600">Real-time pedestrian traffic data from Google, MapMyIndia & mobile data APIs</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]" style={{animationDelay: '0.3s'}}>
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-6 hover:border-[#E4002B] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E4002B]/20 to-[#FF6B35]/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Demographics</h4>
                <p className="text-sm text-gray-600">Income levels, spending power, age groups & catchment population analysis</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]" style={{animationDelay: '0.4s'}}>
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-6 hover:border-[#FF6B35] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35]/20 to-[#FF5200]/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Competitor Mapping</h4>
                <p className="text-sm text-gray-600">Proximity analysis of similar brands & category saturation in the area</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards]" style={{animationDelay: '0.5s'}}>
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-6 hover:border-[#FF5200] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200]/20 to-[#E4002B]/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Accessibility Score</h4>
                <p className="text-sm text-gray-600">Metro connectivity, bus routes, parking availability & public transport access</p>
              </div>
            </div>
          </div>

          {/* AI Scoring Visualization */}
          <div className="relative group opacity-0 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards]" style={{animationDelay: '0.6s'}}>
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition duration-700"></div>
            
            <div className="relative bg-gradient-to-br from-white via-gray-50/50 to-white border-2 border-gray-200 rounded-3xl p-8 md:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF5200]/10 to-transparent rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      Dual AI Scoring Engine
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Every match is calculated with precision using our proprietary algorithms that analyze hundreds of data points
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 rounded-2xl p-4">
                        <div className="text-3xl font-black bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent mb-1">BFI</div>
                        <div className="text-xs text-gray-600 font-semibold">Brand Fit Index</div>
                        <p className="text-xs text-gray-500 mt-2">How well a property matches brand requirements</p>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-2xl p-4">
                        <div className="text-3xl font-black bg-gradient-to-r from-[#E4002B] to-[#FF6B35] bg-clip-text text-transparent mb-1">PFI</div>
                        <div className="text-xs text-gray-600 font-semibold">Property Fit Index</div>
                        <p className="text-xs text-gray-500 mt-2">How well a brand matches property characteristics</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <div className="relative w-48 h-48 md:w-56 md:h-56">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full opacity-20 animate-pulse"></div>
                      <div className="absolute inset-4 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-2xl">
                        <div className="text-center text-white">
                          <div className="text-5xl font-black mb-2">95%</div>
                          <div className="text-sm font-semibold opacity-90">Match Score</div>
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-[#FF5200]">
                        <svg className="w-8 h-8 text-[#FF5200]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Futuristic Transition Element */}
      <div className="relative z-10 h-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-100/50 to-gray-50/30"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-[#FF5200] via-transparent to-transparent animate-[scan_3s_ease-in-out_infinite]"></div>
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-[#E4002B] via-transparent to-transparent animate-[scan_3s_ease-in-out_infinite_1s]"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-[#FF6B35] via-transparent to-transparent animate-[scan_3s_ease-in-out_infinite_2s]"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent opacity-50"></div>
      </div>

      {/* Trust Stats Section - Futuristic */}
      <section className="relative z-10 bg-gradient-to-b from-gray-900 via-black to-gray-900 py-24 md:py-32 overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#FF5200 1px, transparent 1px), linear-gradient(90deg, #FF5200 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'grid 20s linear infinite'
          }}></div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#FF5200]/30 to-[#E4002B]/30 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-[#E4002B]/30 to-[#FF6B35]/30 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]"></div>
        </div>

        {/* Scanning Lines */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_4s_ease-in-out_infinite]"></div>
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_4s_ease-in-out_infinite_2s]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
            <div className="inline-flex items-center px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4 sm:mb-5 md:mb-6 border border-[#FF5200]/30">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 sm:mr-2.5 animate-pulse"></span>
              <span className="text-xs sm:text-sm font-medium text-white">Platform Performance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 px-4">
              Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Industry Leaders</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {/* Stat 1 */}
            <div className="relative group opacity-0 animate-[fadeInUp_0.8s_ease-out_0.1s_forwards]">
              <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-[#FF5200]/30 hover:border-[#FF5200] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#FF5200]/50 group-hover:-translate-y-2">
                {/* Animated Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                {/* Animated Corner Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
                
                {/* Particle Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#FF5200] rounded-full animate-ping"></div>
                  <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-[#E4002B] rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-[#FF5200]/50">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#FF6B35] to-[#E4002B] mb-2 sm:mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(255,82,0,0.5)]">
                    500+
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-200 font-semibold">
                    Properties Listed
                  </div>
                  <div className="mt-2 sm:mt-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#FF5200]/20 border border-[#FF5200]/40 rounded-full text-[10px] sm:text-xs text-[#FF5200] font-bold inline-block">↑ 23% this month</div>
                </div>

                {/* Enhanced Pulse Ring */}
                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="relative group opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
              <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-[#E4002B]/30 hover:border-[#E4002B] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#E4002B]/50 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E4002B]/20 via-[#FF5200]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#E4002B]/40 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
                
                {/* Particle Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-[#E4002B] rounded-full animate-ping"></div>
                  <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-[#FF5200] rounded-full animate-ping" style={{animationDelay: '0.3s'}}></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#E4002B] to-[#FF5200] rounded-xl mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-[#E4002B]/50">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] via-[#FF5200] to-[#FF6B35] mb-2 sm:mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(228,0,43,0.5)]">
                    300+
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-200 font-semibold">
                    Successful Matches
                  </div>
                  <div className="mt-2 sm:mt-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#E4002B]/20 border border-[#E4002B]/40 rounded-full text-[10px] sm:text-xs text-[#E4002B] font-bold inline-block">↑ 95% success rate</div>
                </div>

                <div className="absolute inset-0 rounded-2xl border-2 border-[#E4002B] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#E4002B]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="relative group opacity-0 animate-[fadeInUp_0.8s_ease-out_0.3s_forwards]">
              <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-[#FF6B35]/30 hover:border-[#FF6B35] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#FF6B35]/50 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/20 via-[#FF5200]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF6B35]/40 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
                
                {/* Lightning Bolt Particles */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                  <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-[#FF6B35] rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#FF6B35] to-[#E4002B] rounded-xl mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-[#FF6B35]/50">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] via-yellow-400 to-[#FF5200] mb-2 sm:mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(255,107,53,0.5)]">
                    48hrs
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-200 font-semibold">
                    Avg. Match Time
                  </div>
                  <div className="mt-2 sm:mt-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#FF6B35]/20 border border-[#FF6B35]/40 rounded-full text-[10px] sm:text-xs text-[#FF6B35] font-bold inline-block">⚡ Lightning fast</div>
                </div>

                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF6B35] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF6B35]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="relative group opacity-0 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
              <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-[#FF5200]/30 hover:border-[#FF5200] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#FF5200]/50 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
                
                {/* Globe Particles */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                  <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                  <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-[#FF5200] rounded-full animate-ping" style={{animationDelay: '0.6s'}}></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-[#FF5200]/50">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#FF6B35] to-[#E4002B] mb-2 sm:mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(255,82,0,0.5)]">
                    15+
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-200 font-semibold">
                    Cities Covered
                  </div>
                  <div className="mt-2 sm:mt-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#FF5200]/20 border border-[#FF5200]/40 rounded-full text-[10px] sm:text-xs text-[#FF5200] font-bold inline-block">🌍 Expanding fast</div>
                </div>

                <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
              </div>
            </div>
          </div>

          {/* Bottom Glow Line */}
          <div className="mt-16 h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent opacity-50"></div>
        </div>
      </section>



      {/* CTA Section with Energy Waves */}
      <section className="relative z-10 bg-gradient-to-b from-gray-50/30 via-white to-white py-20 md:py-32 overflow-hidden">
        {/* Animated Energy Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-96 h-96 border-2 border-[#FF5200]/20 rounded-full animate-[ripple_3s_ease-out_infinite]"></div>
          <div className="absolute w-96 h-96 border-2 border-[#E4002B]/20 rounded-full animate-[ripple_3s_ease-out_infinite_1s]"></div>
          <div className="absolute w-96 h-96 border-2 border-[#FF6B35]/20 rounded-full animate-[ripple_3s_ease-out_infinite_2s]"></div>
        </div>
        
        {/* Floating Gradient Orbs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-[#FF5200]/10 to-transparent rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-gradient-to-br from-[#E4002B]/10 to-transparent rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        
        <div className="max-w-4xl mx-auto px-6 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Perfect Match?</span>
            </h2>
            
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Join hundreds of brands and property owners already using our AI-powered platform
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/onboarding/brand')}
                className="group relative px-10 py-5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  I'm a Brand
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
              
              <button 
                onClick={() => router.push('/onboarding/owner')}
                className="group relative px-10 py-5 bg-white border-2 border-gray-300 text-gray-900 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-[#FF5200] overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center group-hover:text-[#FF5200] transition-colors">
                  I'm a Property Owner
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Compact & After CTA */}
      <section className="relative z-10 bg-white py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 animate-pulse"></span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Quick Answers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Got <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Questions?</span>
            </h2>
          </div>

          {/* FAQ Grid - 2 Columns, Compact */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {/* FAQ 1 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:border-[#FF5200] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#FF5200] transition-colors">How does AI matching work?</h3>
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">Our AI analyzes location intelligence, footfall, and demographics to deliver Top 5 scored matches.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ 2 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:border-[#E4002B] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#E4002B]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#E4002B] to-[#FF5200] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#E4002B] transition-colors">What's the fee structure?</h3>
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">Brands pay an onboarding fee. Property owners list 100% free. Success fee applies on deal closure.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ 3 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:border-[#FF6B35] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF6B35]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#FF6B35] to-[#FF5200] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#FF6B35] transition-colors">How fast are matches?</h3>
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">Get AI matches within 24-48 hours with instant WhatsApp notifications in real-time.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ 4 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:border-[#FF5200] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#FF5200] transition-colors">Which cities covered?</h3>
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">15+ metros: Bangalore, Mumbai, Delhi, Hyderabad, Chennai, Pune & expanding.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ 5 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:border-[#E4002B] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#E4002B]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#E4002B] to-[#FF6B35] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#E4002B] transition-colors">Can I communicate directly?</h3>
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">Yes! Message property owners or brands directly through our platform. Schedule site visits and negotiate seamlessly.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ 6 */}
            <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:border-[#FF6B35] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF6B35]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#FF6B35] to-[#E4002B] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-[#FF6B35] transition-colors">Is my data secure?</h3>
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500">
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">Absolutely. Enterprise-grade encryption, secure payment processing, and strict data privacy compliance ensure your information is protected.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">
                GVS Platform
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                AI-powered commercial real estate matchmaking platform connecting brands with perfect properties using location intelligence.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-[#FF5200] hover:to-[#E4002B] transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-[#FF5200] hover:to-[#E4002B] transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-[#FF5200] hover:to-[#E4002B] transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4 text-lg">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-[#FF5200] transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#FF5200] transition-colors">How It Works</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#FF5200] transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#FF5200] transition-colors">Success Stories</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#FF5200] transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* For Users */}
            <div>
              <h4 className="font-bold mb-4 text-lg">For Users</h4>
              <ul className="space-y-3">
                <li><a href="/onboarding/brand" className="text-gray-400 hover:text-[#FF5200] transition-colors">Brand Onboarding</a></li>
                <li><a href="/onboarding/owner" className="text-gray-400 hover:text-[#FF5200] transition-colors">List Property</a></li>
                <li><a href="/properties" className="text-gray-400 hover:text-[#FF5200] transition-colors">Browse Properties</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#FF5200] transition-colors">Dashboard</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#FF5200] transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold mb-4 text-lg">Contact Us</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#FF5200] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>support@gvsplatform.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#FF5200] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#FF5200] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Bangalore, India</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 GVS Platform. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-[#FF5200] transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-[#FF5200] transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-[#FF5200] transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Search Modal */}
      <AiSearchModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        initialQuery={isAiModalOpen ? searchQuery : ''}
      />
    </div>
  )
}
