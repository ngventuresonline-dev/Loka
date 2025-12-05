'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'

const fraunces = Fraunces({ subsets: ['latin'], weight: ['600', '700'], display: 'swap', variable: '--font-fraunces' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-plusjakarta' })

const propertyTypes = ['Standalone', 'Retail Space', 'Office', 'Food Court', 'Mall Space', 'Warehouse', 'Land', 'Other']
const locations = ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR', 'Jayanagar', 'BTM', 'MG Road', 'Brigade Road', 'Marathahalli', 'Hebbal', 'Banashankari', 'Sarjapur Road', 'Electronic City', 'Bellandur', 'Other']
const features = ['Ground Floor', 'Corner Unit', 'Main Road', 'Parking', 'Kitchen Setup', 'AC', 'Security', 'Storage', 'Other']
const availabilities = ['Immediate', '1 month', '1-2 months', '3+ months']

function SizeSlider({ index = 0 }: { index?: number }) {
  const [size, setSize] = useState(1000)
  const [exactSize, setExactSize] = useState('1000')
  
  const formatSize = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K sqft`
    }
    return `${value} sqft`
  }

  const handleExactSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setExactSize(value)
    if (value) {
      const numValue = parseInt(value)
      if (numValue >= 100 && numValue <= 50000) {
        setSize(numValue)
      } else if (numValue > 50000) {
        setSize(50000)
        setExactSize('50000')
      } else if (numValue < 100 && numValue > 0) {
        setSize(100)
        setExactSize('100')
      }
    }
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setSize(value)
    setExactSize(value.toString())
  }

  const borderColors = [
    'border-[#E4002B]/30 hover:border-[#E4002B]',
    'border-[#FF5200]/30 hover:border-[#FF5200]',
    'border-[#FF6B35]/30 hover:border-[#FF6B35]',
    'border-[#E4002B]/30 hover:border-[#E4002B]',
    'border-[#FF5200]/30 hover:border-[#FF5200]',
  ]
  const shadowColors = [
    'hover:shadow-[#E4002B]/50',
    'hover:shadow-[#FF5200]/50',
    'hover:shadow-[#FF6B35]/50',
    'hover:shadow-[#E4002B]/50',
    'hover:shadow-[#FF5200]/50',
  ]
  const gradientColors = [
    'from-[#E4002B]/20 via-[#FF5200]/10',
    'from-[#FF5200]/20 via-[#E4002B]/10',
    'from-[#FF6B35]/20 via-[#E4002B]/10',
    'from-[#E4002B]/20 via-[#FF5200]/10',
    'from-[#FF5200]/20 via-[#E4002B]/10',
  ]
  const accentColors = [
    'from-[#E4002B]/40',
    'from-[#FF5200]/40',
    'from-[#FF6B35]/40',
    'from-[#E4002B]/40',
    'from-[#FF5200]/40',
  ]

  const colorIndex = index % 5

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: index * 0.1 }}
      className="relative group"
    >
      <div className={`relative bg-white/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 ${borderColors[colorIndex]} transition-all duration-500 overflow-hidden shadow-2xl ${shadowColors[colorIndex]} group-hover:-translate-y-2`}>
        {/* Animated Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[colorIndex]} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
        
        {/* Animated Corner Accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accentColors[colorIndex]} to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500`}></div>
        
        {/* Particle Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#E4002B] rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-[#FF5200] rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        </div>

        <div className="relative z-10">
          <h3
            className="text-2xl font-bold text-gray-900 mb-6"
            style={{ fontFamily: fraunces.style.fontFamily }}
          >
            Size Range
          </h3>

          <div className="space-y-6">
            {/* Size Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Property Size
                </label>
                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] to-[#FF5200]" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  {formatSize(size)}
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="100"
                  max="50000"
                  step="100"
                  value={size}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider slider-size"
                />
              </div>
            </div>

            {/* Exact Size Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                Or Enter Exact Size (sqft)
              </label>
              <input
                type="text"
                value={exactSize}
                onChange={handleExactSizeChange}
                placeholder="e.g., 1500"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/20 outline-none transition-all duration-200"
                style={{ fontFamily: plusJakarta.style.fontFamily }}
              />
            </div>

            {/* Size Display */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Selected Size
                </p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] via-[#FF6B35] to-[#FF5200]" style={{ fontFamily: fraunces.style.fontFamily }}>
                  {size.toLocaleString()} sqft
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Pulse Ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#E4002B] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
        <div className="absolute inset-0 rounded-2xl ring-2 ring-[#E4002B]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
      </div>

      <style jsx>{`
        .slider-size {
          background: #E5E7EB;
        }
        .slider-size::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E4002B, #FF5200);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(228, 0, 43, 0.5), 0 0 20px rgba(228, 0, 43, 0.3);
          transition: all 0.2s;
        }
        .slider-size::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(228, 0, 43, 0.8), 0 0 30px rgba(228, 0, 43, 0.5);
        }
        .slider-size::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E4002B, #FF5200);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(228, 0, 43, 0.5), 0 0 20px rgba(228, 0, 43, 0.3);
          transition: all 0.2s;
        }
        .slider-size::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(228, 0, 43, 0.8), 0 0 30px rgba(228, 0, 43, 0.5);
        }
      `}</style>
    </motion.section>
  )
}

function RentSlider({ index = 0 }: { index?: number }) {
  const [rent, setRent] = useState(100000)
  
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`
    }
    return `₹${(value / 1000).toFixed(0)}K`
  }

  const borderColors = [
    'border-[#E4002B]/30 hover:border-[#E4002B]',
    'border-[#FF5200]/30 hover:border-[#FF5200]',
    'border-[#FF6B35]/30 hover:border-[#FF6B35]',
    'border-[#E4002B]/30 hover:border-[#E4002B]',
    'border-[#FF5200]/30 hover:border-[#FF5200]',
  ]
  const shadowColors = [
    'hover:shadow-[#E4002B]/50',
    'hover:shadow-[#FF5200]/50',
    'hover:shadow-[#FF6B35]/50',
    'hover:shadow-[#E4002B]/50',
    'hover:shadow-[#FF5200]/50',
  ]
  const gradientColors = [
    'from-[#E4002B]/20 via-[#FF5200]/10',
    'from-[#FF5200]/20 via-[#E4002B]/10',
    'from-[#FF6B35]/20 via-[#E4002B]/10',
    'from-[#E4002B]/20 via-[#FF5200]/10',
    'from-[#FF5200]/20 via-[#E4002B]/10',
  ]
  const accentColors = [
    'from-[#E4002B]/40',
    'from-[#FF5200]/40',
    'from-[#FF6B35]/40',
    'from-[#E4002B]/40',
    'from-[#FF5200]/40',
  ]

  const colorIndex = index % 5

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: index * 0.1 }}
      className="relative group"
    >
      <div className={`relative bg-white/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 ${borderColors[colorIndex]} transition-all duration-500 overflow-hidden shadow-2xl ${shadowColors[colorIndex]} group-hover:-translate-y-2`}>
        {/* Animated Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[colorIndex]} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
        
        {/* Animated Corner Accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accentColors[colorIndex]} to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500`}></div>
        
        {/* Particle Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#E4002B] rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-[#FF5200] rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        </div>

        <div className="relative z-10">
          <h3
            className="text-2xl font-bold text-gray-900 mb-6"
            style={{ fontFamily: fraunces.style.fontFamily }}
          >
            Rent Range (Monthly)
          </h3>

          <div className="space-y-6">
            {/* Rent Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Expected Monthly Rent
                </label>
                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] to-[#FF5200]" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  {formatCurrency(rent)}
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="50000"
                  max="2000000"
                  step="50000"
                  value={rent}
                  onChange={(e) => setRent(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider slider-rent"
                />
              </div>
            </div>

            {/* Rent Display */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Expected Rent
                </p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] via-[#FF6B35] to-[#FF5200]" style={{ fontFamily: fraunces.style.fontFamily }}>
                  {formatCurrency(rent)} / month
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Pulse Ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#E4002B] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
        <div className="absolute inset-0 rounded-2xl ring-2 ring-[#E4002B]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
      </div>

      <style jsx>{`
        .slider-rent {
          background: #E5E7EB;
        }
        .slider-rent::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E4002B, #FF5200);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(228, 0, 43, 0.5), 0 0 20px rgba(228, 0, 43, 0.3);
          transition: all 0.2s;
        }
        .slider-rent::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(228, 0, 43, 0.8), 0 0 30px rgba(228, 0, 43, 0.5);
        }
        .slider-rent::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E4002B, #FF5200);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(228, 0, 43, 0.5), 0 0 20px rgba(228, 0, 43, 0.3);
          transition: all 0.2s;
        }
        .slider-rent::-moz-range-thumb:hover {
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
    'border-[#E4002B]/30 hover:border-[#E4002B]',
    'border-[#FF5200]/30 hover:border-[#FF5200]',
    'border-[#FF6B35]/30 hover:border-[#FF6B35]',
    'border-[#E4002B]/30 hover:border-[#E4002B]',
    'border-[#FF5200]/30 hover:border-[#FF5200]',
  ]
  const shadowColors = [
    'hover:shadow-[#E4002B]/50',
    'hover:shadow-[#FF5200]/50',
    'hover:shadow-[#FF6B35]/50',
    'hover:shadow-[#E4002B]/50',
    'hover:shadow-[#FF5200]/50',
  ]
  const gradientColors = [
    'from-[#E4002B]/20 via-[#FF5200]/10',
    'from-[#FF5200]/20 via-[#E4002B]/10',
    'from-[#FF6B35]/20 via-[#E4002B]/10',
    'from-[#E4002B]/20 via-[#FF5200]/10',
    'from-[#FF5200]/20 via-[#E4002B]/10',
  ]
  const accentColors = [
    'from-[#E4002B]/40',
    'from-[#FF5200]/40',
    'from-[#FF6B35]/40',
    'from-[#E4002B]/40',
    'from-[#FF5200]/40',
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
      <div className={`relative bg-white/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 ${borderColors[colorIndex]} transition-all duration-500 overflow-hidden shadow-2xl ${shadowColors[colorIndex]} group-hover:-translate-y-2`}>
        {/* Animated Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[colorIndex]} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
        
        {/* Animated Corner Accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accentColors[colorIndex]} to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500`}></div>
        
        {/* Particle Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#E4002B] rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-[#FF5200] rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: fraunces.style.fontFamily }}
            >
              {title}
            </h3>
            {multi && count > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-[#E4002B] to-[#FF5200] text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-[#E4002B]/50"
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
                      ? 'bg-gradient-to-r from-[#E4002B] to-[#FF5200] text-white border-transparent shadow-lg shadow-[#E4002B]/50'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#E4002B]/50 hover:text-[#E4002B] hover:bg-white'
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
                      <svg className="w-3 h-3 text-[#E4002B]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-[#E4002B] opacity-0 group-hover:opacity-100 animate-ping"
                      style={{ animationDuration: '2s' }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Enhanced Pulse Ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#E4002B] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
        <div className="absolute inset-0 rounded-2xl ring-2 ring-[#E4002B]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
      </div>
    </motion.section>
  )
}

export default function OwnerFilterPage() {
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
      {/* Light Background with Accent Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#E4002B]/5 via-[#FF5200]/3 to-[#FF6B35]/5"></div>
      
      {/* Floating Gradient Orbs - Lighter Accent Colors */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-[#E4002B]/15 to-[#FF5200]/15 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-[#FF5200]/15 to-[#FF6B35]/15 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]"></div>
      </div>

      {/* Subtle Scanning Lines */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_4s_ease-in-out_infinite]"></div>
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_4s_ease-in-out_infinite_2s]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Section Header - Platform Performance Style */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
          <div className="inline-flex items-center px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-[#E4002B]/10 to-[#FF5200]/10 backdrop-blur-sm rounded-full mb-4 sm:mb-5 md:mb-6 border border-[#E4002B]/30">
            <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#E4002B] to-[#FF5200] rounded-full mr-2 sm:mr-2.5 animate-pulse"></span>
            <span className="text-xs sm:text-sm font-medium text-gray-700">Property Listing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 px-4">
            List Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] to-[#FF5200]">Property</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with qualified tenants through our AI-powered platform
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
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:border-[#E4002B]/50 hover:text-[#E4002B] transition-all duration-200 hover:shadow-md hover:shadow-[#E4002B]/20 backdrop-blur-sm bg-white/80"
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
          <div className="group relative w-full max-w-2xl mx-auto bg-white/90 backdrop-blur-xl rounded-2xl px-5 py-4 border-2 border-[#E4002B]/30 hover:border-[#E4002B] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#E4002B]/50">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E4002B]/10 via-[#FF5200]/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#E4002B]/20 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#E4002B] to-[#FF5200] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#E4002B]/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E4002B] flex-shrink-0 animate-pulse"></div>
                  <span className="text-[10px] font-medium text-[#E4002B] uppercase tracking-wider">For Property Owners</span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-0.5">List Your Property</h3>
                <p className="text-xs text-gray-600 leading-snug line-clamp-1">Connect with qualified tenants quickly</p>
              </div>
              
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E4002B]/10 border border-[#E4002B]/30 rounded-lg flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-[#E4002B]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-[11px] font-medium text-[#E4002B]">Instant</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter Cards - Platform Performance Style */}
        <div className="grid gap-6 sm:gap-8">
          <FilterCard title="Property Type" items={propertyTypes} index={0} />
          <SizeSlider index={1} />
          <FilterCard title="Location (Popular Areas)" items={locations} multi index={2} />
          <RentSlider index={3} />
          <FilterCard title="Features" items={features} multi index={4} />
          <FilterCard title="Availability" items={availabilities} index={5} />
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
              className="group relative px-8 py-4 bg-gradient-to-r from-[#E4002B] to-[#FF5200] text-white rounded-xl text-base font-semibold shadow-[0_8px_24px_rgba(228,0,43,0.4)] overflow-hidden"
              style={{ fontFamily: plusJakarta.style.fontFamily }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200] to-[#E4002B] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
      <div className="relative z-10 mt-16 h-px bg-gradient-to-r from-transparent via-[#E4002B] to-transparent opacity-50"></div>
    </div>
  )
}
