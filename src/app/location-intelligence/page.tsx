'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function LocationIntelligencePage() {
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')
  const [hasUsedFreeSearch, setHasUsedFreeSearch] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const categories = ['Retail', 'F&B', 'Salon & Spa', 'Fitness', 'Office Space', 'Healthcare']

  const handleSearch = () => {
    if (!location || !category) return
    
    // Check if user has used free search
    const usedFree = localStorage.getItem('usedFreeLocationSearch')
    
    if (!usedFree) {
      setShowPreview(true)
      localStorage.setItem('usedFreeLocationSearch', 'true')
      setHasUsedFreeSearch(false)
    } else {
      setHasUsedFreeSearch(true)
      // Show payment modal
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Futuristic Background */}
      <div className="fixed inset-0 z-0">
        {/* Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255, 82, 0, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 82, 0, 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'gridScroll 20s linear infinite'
          }}></div>
        </div>

        {/* Glowing Orbs */}
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[#FF5200]/20 rounded-full blur-[150px] animate-[float_15s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#E4002B]/20 rounded-full blur-[150px] animate-[float_20s_ease-in-out_infinite_5s]"></div>

        {/* Scanning Lines */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent animate-[scan_8s_ease-in-out_infinite]"></div>
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#E4002B] to-transparent animate-[scan_6s_ease-in-out_infinite_2s]" style={{ top: '30%' }}></div>
        </div>
      </div>

      <Navbar />

      {/* Main content is blurred and dimmed; overlay explains the current status */}
      <div className="relative z-10 min-h-screen">
        {/* Blurred background content */}
        <div className="pt-24 sm:pt-28 md:pt-32 lg:pt-36 xl:pt-40 pb-16 sm:pb-20 pointer-events-none blur-sm opacity-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
            {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#FF5200]/10 to-[#E4002B]/10 border border-[#FF5200]/30 rounded-full mb-6 backdrop-blur-xl">
              <span className="w-2 h-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-3 animate-pulse shadow-[0_0_10px_rgba(255,82,0,1)]"></span>
              <span className="text-sm font-semibold bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">First Search FREE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white whitespace-nowrap">Make</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] animate-gradientShift bg-[length:200%_200%] whitespace-nowrap">Data-Driven</span>
              <br />
              <span className="text-white whitespace-nowrap">Location&nbsp;Decisions</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-6 sm:mb-8 px-4 sm:px-0">
              Access real-time market intelligence, foot traffic patterns, and competitive analysis before you commit to any location
            </p>

            <div className="inline-flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full shadow-[0_0_10px_rgba(255,82,0,0.8)]"></div>
                <span className="text-gray-300">95% Accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full shadow-[0_0_10px_rgba(255,82,0,0.8)]"></div>
                <span className="text-gray-300">100+ Brands Trust Us</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full shadow-[0_0_10px_rgba(255,82,0,0.8)]"></div>
                <span className="text-gray-300">Real-Time Data</span>
              </div>
            </div>
          </div>

            {/* Search Interface */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="relative group">
              {/* Animated Border */}
              <div className="absolute -inset-[2px] bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] rounded-3xl opacity-50 group-hover:opacity-100 blur-sm transition-all duration-700 animate-gradientShift bg-[length:200%_200%]"></div>
              
              <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl p-8 border border-[#FF5200]/20">
                <div className="space-y-6">
                  {/* Location Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Enter Location or Address</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Koramangala, Bangalore or specific address..."
                        className="w-full bg-black/50 border border-[#FF5200]/30 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5200] focus:shadow-[0_0_20px_rgba(255,82,0,0.3)] transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Select Business Category</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={'px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 border-2 ' + (category === cat ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] border-[#FF5200] text-white shadow-[0_0_20px_rgba(255,82,0,0.5)]' : 'bg-black/30 border-[#FF5200]/20 text-gray-400 hover:border-[#FF5200]/50 hover:text-white')}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleSearch}
                    disabled={!location || !category}
                    className="w-full py-5 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] text-white rounded-xl font-bold text-lg hover:shadow-[0_0_40px_rgba(255,82,0,0.6)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] relative overflow-hidden group"
                  >
                    <span className="relative z-10">Generate Intelligence Report</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35] via-[#E4002B] to-[#FF5200] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    🎁 First search is completely free • Detailed reports from ₹4,999
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Overlay communication card */}
        <div className="absolute inset-0 flex items-center justify-center px-4 py-20">
          <div className="max-w-xl w-full bg-black/85 border border-[#FF5200]/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(255,82,0,0.5)] text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gradient-to-r from-[#FF5200]/20 to-[#E4002B]/20 border border-[#FF5200]/40 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-[#FFEDD5]">
              Location Intelligence • Private Beta
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-snug">
              We&apos;re currently running<br className="hidden sm:block" />{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35]">
                guided location studies
              </span>
            </h1>
            <p className="text-sm sm:text-base text-gray-300">
              Instead of a self-serve dashboard, our team builds a custom intelligence report for your brand in Bangalore.
              Share your requirements and we&apos;ll send you a curated PDF with the top micro-markets, footfall, and rent benchmarks.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/filter/brand"
                className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white text-sm sm:text-base font-semibold shadow-[0_0_25px_rgba(255,82,0,0.6)] hover:shadow-[0_0_35px_rgba(255,82,0,0.8)] transition-all"
              >
                Share my requirements
              </Link>
              <a
                href="mailto:support@lokazen.in?subject=Location%20Intelligence%20Report%20Request"
                className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl border border-[#FF5200]/60 text-sm sm:text-base font-semibold text-[#FFEDD5] bg-black/40 hover:bg-black/60 transition-all"
              >
                Talk to our team
              </a>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-400">
              100+ brands already use Lokazen reports to shortlist locations before site visits.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gridScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          50% { top: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
