'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'

const fraunces = Fraunces({ subsets: ['latin'], weight: ['600', '700'], display: 'swap', variable: '--font-fraunces' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-plusjakarta' })

const businessTypes = ['Café/QSR', 'Restaurant', 'Bar/Brewery', 'Retail', 'Gym', 'Entertainment']
const sizeRanges = ['100-500 sqft', '500-1,000 sqft', '1,000-2,000 sqft', '2,000-5,000 sqft', '5,000-10,000 sqft', '10,000+ sqft']
const locations = ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR', 'Jayanagar', 'BTM', 'MG Road', 'Brigade Road', 'Marathahalli', 'Hebbal']
const timelines = ['Immediate', '1 month', '1-2 months', '2-3 months']

function BudgetSlider({ index = 0 }: { index?: number }) {
  const [minBudget, setMinBudget] = useState(50000)
  const [maxBudget, setMaxBudget] = useState(1000000)
  
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`
    }
    return `₹${(value / 1000).toFixed(0)}K`
  }

  const borderColors = [
    'border-[#FF5200]/30 hover:border-[#FF5200]',
    'border-[#E4002B]/30 hover:border-[#E4002B]',
    'border-[#FF6B35]/30 hover:border-[#FF6B35]',
    'border-[#FF5200]/30 hover:border-[#FF5200]',
    'border-[#E4002B]/30 hover:border-[#E4002B]',
  ]
  const shadowColors = [
    'hover:shadow-[#FF5200]/50',
    'hover:shadow-[#E4002B]/50',
    'hover:shadow-[#FF6B35]/50',
    'hover:shadow-[#FF5200]/50',
    'hover:shadow-[#E4002B]/50',
  ]
  const gradientColors = [
    'from-[#FF5200]/20 via-[#E4002B]/10',
    'from-[#E4002B]/20 via-[#FF5200]/10',
    'from-[#FF6B35]/20 via-[#FF5200]/10',
    'from-[#FF5200]/20 via-[#E4002B]/10',
    'from-[#E4002B]/20 via-[#FF5200]/10',
  ]
  const accentColors = [
    'from-[#FF5200]/40',
    'from-[#E4002B]/40',
    'from-[#FF6B35]/40',
    'from-[#FF5200]/40',
    'from-[#E4002B]/40',
  ]

  const colorIndex = index % 5

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: index * 0.1 }}
      className="relative group"
    >
      <div className={`relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 ${borderColors[colorIndex]} transition-all duration-500 overflow-hidden shadow-2xl ${shadowColors[colorIndex]} group-hover:-translate-y-2`}>
        {/* Animated Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[colorIndex]} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
        
        {/* Animated Corner Accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accentColors[colorIndex]} to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500`}></div>
        
        {/* Particle Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#FF5200] rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-[#E4002B] rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        </div>

        <div className="relative z-10">
          <h3
            className="text-2xl font-bold text-white mb-6"
            style={{ fontFamily: fraunces.style.fontFamily }}
          >
            Budget Range (Monthly Rent)
          </h3>

          <div className="space-y-6">
            {/* Min Budget */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Minimum
                </label>
                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  {formatCurrency(minBudget)}
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="50000"
                  max="2000000"
                  step="50000"
                  value={minBudget}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value)
                    setMinBudget(newValue)
                    if (newValue >= maxBudget) {
                      setMaxBudget(Math.min(newValue + 50000, 2000000))
                    }
                  }}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider slider-min"
                />
              </div>
            </div>

            {/* Max Budget */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Maximum
                </label>
                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] to-[#FF5200]" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  {formatCurrency(maxBudget)}
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="50000"
                  max="2000000"
                  step="50000"
                  value={maxBudget}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value)
                    setMaxBudget(newValue)
                    if (newValue <= minBudget) {
                      setMinBudget(Math.max(newValue - 50000, 50000))
                    }
                  }}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider slider-max"
                />
              </div>
            </div>

            {/* Budget Range Display */}
            <div className="pt-4 border-t border-gray-700/50">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Selected Range
                </p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#FF6B35] to-[#E4002B]" style={{ fontFamily: fraunces.style.fontFamily }}>
                  {formatCurrency(minBudget)} - {formatCurrency(maxBudget)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Pulse Ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
        <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
      </div>

      <style jsx>{`
        .slider {
          background: #374151;
        }
        .slider-min::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF5200, #E4002B);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 82, 0, 0.5), 0 0 20px rgba(255, 82, 0, 0.3);
          transition: all 0.2s;
        }
        .slider-min::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(255, 82, 0, 0.8), 0 0 30px rgba(255, 82, 0, 0.5);
        }
        .slider-min::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF5200, #E4002B);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(255, 82, 0, 0.5), 0 0 20px rgba(255, 82, 0, 0.3);
          transition: all 0.2s;
        }
        .slider-min::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(255, 82, 0, 0.8), 0 0 30px rgba(255, 82, 0, 0.5);
        }
        .slider-max::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E4002B, #FF5200);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(228, 0, 43, 0.5), 0 0 20px rgba(228, 0, 43, 0.3);
          transition: all 0.2s;
        }
        .slider-max::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(228, 0, 43, 0.8), 0 0 30px rgba(228, 0, 43, 0.5);
        }
        .slider-max::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E4002B, #FF5200);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(228, 0, 43, 0.5), 0 0 20px rgba(228, 0, 43, 0.3);
          transition: all 0.2s;
        }
        .slider-max::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(228, 0, 43, 0.8), 0 0 30px rgba(228, 0, 43, 0.5);
        }
      `}</style>
    </motion.section>
  )
}

function FilterCard({ 
  title, 
  items, 
  multi = false,
  index = 0
}: { 
  title: string
  items: string[]
  multi?: boolean
  index?: number
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const borderColors = [
    'border-[#FF5200]/30 hover:border-[#FF5200]',
    'border-[#E4002B]/30 hover:border-[#E4002B]',
    'border-[#FF6B35]/30 hover:border-[#FF6B35]',
    'border-[#FF5200]/30 hover:border-[#FF5200]',
    'border-[#E4002B]/30 hover:border-[#E4002B]',
  ]
  const shadowColors = [
    'hover:shadow-[#FF5200]/50',
    'hover:shadow-[#E4002B]/50',
    'hover:shadow-[#FF6B35]/50',
    'hover:shadow-[#FF5200]/50',
    'hover:shadow-[#E4002B]/50',
  ]
  const gradientColors = [
    'from-[#FF5200]/20 via-[#E4002B]/10',
    'from-[#E4002B]/20 via-[#FF5200]/10',
    'from-[#FF6B35]/20 via-[#FF5200]/10',
    'from-[#FF5200]/20 via-[#E4002B]/10',
    'from-[#E4002B]/20 via-[#FF5200]/10',
  ]
  const accentColors = [
    'from-[#FF5200]/40',
    'from-[#E4002B]/40',
    'from-[#FF6B35]/40',
    'from-[#FF5200]/40',
    'from-[#E4002B]/40',
  ]

  const toggle = (item: string) => {
    const next = new Set(selected)
    if (multi) {
      next.has(item) ? next.delete(item) : next.add(item)
    } else {
      next.clear()
      next.add(item)
    }
    setSelected(next)
  }

  const count = selected.size
  const colorIndex = index % 5

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: index * 0.1 }}
      className="relative group"
    >
      <div className={`relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 ${borderColors[colorIndex]} transition-all duration-500 overflow-hidden shadow-2xl ${shadowColors[colorIndex]} group-hover:-translate-y-2`}>
        {/* Animated Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[colorIndex]} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
        
        {/* Animated Corner Accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accentColors[colorIndex]} to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500`}></div>
        
        {/* Particle Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#FF5200] rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-[#E4002B] rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3
              className="text-2xl font-bold text-white"
              style={{ fontFamily: fraunces.style.fontFamily }}
            >
              {title}
            </h3>
            {multi && count > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-[#FF5200]/50"
              >
                {count}
              </motion.div>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item, itemIndex) => {
              const active = selected.has(item)
              return (
                <motion.button
                  key={item}
                  onClick={() => toggle(item)}
                  className={`relative px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 border-2 ${
                    active
                      ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white border-transparent shadow-lg shadow-[#FF5200]/50'
                      : 'bg-gray-800/40 text-gray-200 border-gray-700/50 hover:border-[#FF5200]/50 hover:text-white hover:bg-gray-800/60'
                  }`}
                  style={{ fontFamily: plusJakarta.style.fontFamily }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={false}
                >
                  {item}
                  {multi && active && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <svg className="w-3 h-3 text-[#FF5200]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100 animate-ping"
                      style={{ animationDuration: '2s' }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Enhanced Pulse Ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
        <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
      </div>
    </motion.section>
  )
}

export default function BrandFilterPage() {
  const [showApplyButton, setShowApplyButton] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowApplyButton(window.scrollY > 200)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className={`${fraunces.variable} ${plusJakarta.variable} min-h-screen relative overflow-hidden`}>
      {/* Dark Background with Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
      
      {/* Floating Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#FF5200]/30 to-[#E4002B]/30 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-[#E4002B]/30 to-[#FF6B35]/30 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]"></div>
      </div>

      {/* Scanning Lines */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_4s_ease-in-out_infinite]"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_4s_ease-in-out_infinite_2s]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Section Header - Platform Performance Style */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
          <div className="inline-flex items-center px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4 sm:mb-5 md:mb-6 border border-[#FF5200]/30">
            <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 sm:mr-2.5 animate-pulse"></span>
            <span className="text-xs sm:text-sm font-medium text-white">AI-Powered Filters</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 px-4">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Perfect Space</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
            Refine your search with intelligent filters powered by AI
          </p>
        </div>

        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8 sm:mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white/80 border border-white/20 rounded-xl hover:border-[#FF5200]/50 hover:text-[#FF5200] transition-all duration-200 hover:shadow-md hover:shadow-[#FF5200]/20 backdrop-blur-sm bg-white/5"
            style={{ fontFamily: plusJakarta.style.fontFamily }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </motion.div>

        {/* Value Prop Card - Futuristic Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 sm:mb-12"
        >
          <div className="group relative w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl px-5 py-4 border-2 border-[#FF5200]/30 hover:border-[#FF5200] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#FF5200]/50">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#FF5200]/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF5200] flex-shrink-0 animate-pulse"></div>
                  <span className="text-[10px] font-medium text-[#FF5200] uppercase tracking-wider">For Brands</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-0.5">Find Your Ideal Space</h3>
                <p className="text-xs text-gray-300 leading-snug line-clamp-1">AI-powered matching for commercial properties</p>
              </div>
              
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF5200]/20 border border-[#FF5200]/40 rounded-lg flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-[#FF5200]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-[11px] font-medium text-[#FF5200]">48hr</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter Cards - Platform Performance Style */}
        <div className="grid gap-6 sm:gap-8">
          <FilterCard title="Business Type" items={businessTypes} index={0} />
          <FilterCard title="Size Range" items={sizeRanges} index={1} />
          <FilterCard title="Location (Popular Areas)" items={locations} multi index={2} />
          <BudgetSlider index={3} />
          <FilterCard title="Timeline" items={timelines} index={4} />
        </div>
      </div>

      {/* Floating Apply Button - Futuristic */}
      <AnimatePresence>
        {showApplyButton && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <motion.button
              className="group relative px-8 py-4 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl text-base font-semibold shadow-[0_8px_24px_rgba(255,82,0,0.4)] overflow-hidden"
              style={{ fontFamily: plusJakarta.style.fontFamily }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#E4002B] to-[#FF5200] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                Apply Filters
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 rounded-xl border-2 border-white/30 opacity-0 group-hover:opacity-100 animate-ping"></div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Glow Line */}
      <div className="relative z-10 mt-16 h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent opacity-50"></div>
    </div>
  )
}
