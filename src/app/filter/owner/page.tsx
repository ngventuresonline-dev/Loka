'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import { logSessionEvent, getClientSessionUserId } from '@/lib/session-logger'

const fraunces = Fraunces({ subsets: ['latin'], weight: ['600', '700'], display: 'swap', variable: '--font-fraunces' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-plusjakarta' })

const propertyTypes = [
  'Office',
  'Retail Space',
  'Restaurant',
  'Food Court',
  'Café / Coffee Shop',
  'QSR (Quick Service Restaurant)',
  'Dessert / Bakery',
  'Warehouse',
  'Mall Space',
  'Standalone Building',
  'Bungalow',
  'Villa',
  'Commercial Complex',
  'Business Park',
  'IT Park',
  'Co-working Space',
  'Service Apartment',
  'Hotel / Hospitality',
  'Land',
  'Industrial Space',
  'Showroom',
  'Kiosk',
  'Other'
]
const locations = [
  'Koramangala',
  'Indiranagar',
  'Whitefield',
  'HSR Layout',
  'Jayanagar',
  'BTM Layout',
  'MG Road',
  'Brigade Road',
  'Marathahalli',
  'Hebbal',
  'Banashankari',
  'Sarjapur Road',
  'Electronic City',
  'Bellandur',
  'Bannerghatta Road',
  'Rajajinagar',
  'Malleshwaram',
  'Basavanagudi',
  'Vijayanagar',
  'Yelahanka',
  'Yeshwanthpur',
  'RT Nagar',
  'Frazer Town',
  'Richmond Town',
  'Ulsoor',
  'Kanakapura Road',
  'New Bel Road',
  'Kalyan Nagar',
  'Kamanahalli',
  'Sahakar Nagar',
  'Other'
]
const featuresCategories = {
  'Floor': ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor+', 'Basement', 'Mezzanine'],
  'Location & Visibility': ['Corner Unit', 'Main Road', 'Street Facing', 'High Visibility'],
  'Parking & Access': ['Parking', 'Valet Parking', 'Elevator', 'Wheelchair Accessible'],
  'Infrastructure': ['AC', 'Power Backup', 'Water Supply', 'WiFi', 'Fire Safety', 'CCTV'],
  'Setup & Facilities': ['Kitchen Setup', 'Restroom', 'Storage', 'Warehouse Space'],
  'Security & Services': ['Security', '24/7 Security', 'Signage Allowed', 'Loading Dock'],
  'Other': ['Other']
}

// Flatten for backward compatibility
const features = Object.values(featuresCategories).flat()
const availabilities = ['Immediate', '1 month', '1-2 months', '3+ months']

function SizeSlider({ index = 0, required = false, onSizeChange, error }: { index?: number; required?: boolean; onSizeChange?: (size: number) => void; error?: boolean }) {
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
        if (onSizeChange) {
          onSizeChange(numValue)
        }
      } else if (numValue > 50000) {
        setSize(50000)
        setExactSize('50000')
        if (onSizeChange) {
          onSizeChange(50000)
        }
      } else if (numValue < 100 && numValue > 0) {
        setSize(100)
        setExactSize('100')
        if (onSizeChange) {
          onSizeChange(100)
        }
      }
    }
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setSize(value)
    setExactSize(value.toString())
    if (onSizeChange) {
      onSizeChange(value)
    }
  }
  
  useEffect(() => {
    if (onSizeChange) {
      onSizeChange(size)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <div className={`relative bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 ${borderColors[colorIndex]} transition-all duration-500 overflow-hidden shadow-2xl ${shadowColors[colorIndex]} group-hover:-translate-y-2`}>
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
            className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6"
            style={{ fontFamily: fraunces.style.fontFamily }}
          >
            Size Range {required && <span className="text-red-500 text-base sm:text-lg">*</span>}
          </h3>
          {error && required && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs sm:text-sm text-red-600">Please select a size range</p>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Size Slider */}
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <label className="text-xs sm:text-sm font-medium text-gray-700" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Property Size
                </label>
                <span className="text-sm sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] to-[#FF5200]" style={{ fontFamily: plusJakarta.style.fontFamily }}>
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
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                Or Enter Exact Size (sqft)
              </label>
              <input
                type="text"
                value={exactSize}
                onChange={handleExactSizeChange}
                placeholder="e.g., 1500"
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white border-2 border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/20 outline-none transition-all duration-200"
                style={{ fontFamily: plusJakarta.style.fontFamily }}
              />
            </div>

            {/* Size Display */}
            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Selected Size
                </p>
                <p className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] via-[#FF6B35] to-[#FF5200]" style={{ fontFamily: fraunces.style.fontFamily }}>
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

function RentSlider({ index = 0, required = false, onRentChange, error }: { index?: number; required?: boolean; onRentChange?: (rent: number) => void; error?: boolean }) {
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
      <div className={`relative bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 ${borderColors[colorIndex]} transition-all duration-500 overflow-hidden shadow-2xl ${shadowColors[colorIndex]} group-hover:-translate-y-2`}>
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
            className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6"
            style={{ fontFamily: fraunces.style.fontFamily }}
          >
            Rent Range (Monthly) {required && <span className="text-red-500 text-base sm:text-lg">*</span>}
          </h3>
          {error && required && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs sm:text-sm text-red-600">Please set your expected rent</p>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Rent Slider */}
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <label className="text-xs sm:text-sm font-medium text-gray-700" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Expected Monthly Rent
                </label>
                <span className="text-sm sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] to-[#FF5200]" style={{ fontFamily: plusJakarta.style.fontFamily }}>
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
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setRent(value)
                    if (onRentChange) {
                      onRentChange(value)
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider slider-rent"
                />
              </div>
            </div>

            {/* Rent Display */}
            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Expected Rent
                </p>
                <p className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] via-[#FF6B35] to-[#FF5200]" style={{ fontFamily: fraunces.style.fontFamily }}>
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

function SecurityDepositInput({ index = 0, required = false, onDepositChange, error }: { index?: number; required?: boolean; onDepositChange?: (deposit: string) => void; error?: boolean }) {
  const [deposit, setDeposit] = useState('')
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-numeric characters including currency symbols
    const rawValue = e.target.value.replace(/[^0-9]/g, '')
    setDeposit(rawValue)
    if (onDepositChange) {
      onDepositChange(rawValue)
    }
  }
  
  // Format display value with currency symbol and commas
  const displayValue = deposit ? `₹${parseInt(deposit || '0').toLocaleString('en-IN')}` : ''

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
      <div className={`relative bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 ${borderColors[colorIndex]} transition-all duration-500 overflow-hidden shadow-2xl ${shadowColors[colorIndex]} group-hover:-translate-y-2`}>
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
            className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6"
            style={{ fontFamily: fraunces.style.fontFamily }}
          >
            Security Deposit {required && <span className="text-red-500 text-base sm:text-lg">*</span>}
          </h3>
          {error && required && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs sm:text-sm text-red-600">Please enter security deposit amount</p>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                Security Deposit Amount (₹)
              </label>
              <input
                type="text"
                value={displayValue}
                onChange={handleChange}
                placeholder="e.g., 2,25,000 (3 months)"
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white border-2 border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/20 outline-none transition-all duration-200"
                style={{ fontFamily: plusJakarta.style.fontFamily }}
              />
              <p className="mt-2 text-[10px] sm:text-xs text-gray-500" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                Typically 2-3 months of rent
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Pulse Ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#E4002B] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
        <div className="absolute inset-0 rounded-2xl ring-2 ring-[#E4002B]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
      </div>
    </motion.section>
  )
}

function FilterCard({ 
  title, 
  items, 
  multi = false,
  index = 0,
  required = false,
  onSelectionChange,
  error,
  useDropdown = false,
  categories,
  instructionText,
  visibleCount,
  compactCapsules = false,
  moreLabel,
}: { 
  title: string
  items: string[]
  multi?: boolean
  index?: number
  required?: boolean
  onSelectionChange?: (selected: Set<string>) => void
  error?: boolean
  useDropdown?: boolean
  categories?: Record<string, string[]>
  instructionText?: string
  visibleCount?: number
  compactCapsules?: boolean
  moreLabel?: string
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [otherValue, setOtherValue] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  // Calculate if dropdown should open upward
  useEffect(() => {
    if (isDropdownOpen && useDropdown && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top
      const estimatedDropdownHeight = 300 // Estimated max height
      
      // Open upward if not enough space below but enough space above
      if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
        setOpenUpward(true)
      } else {
        setOpenUpward(false)
      }
    }
  }, [isDropdownOpen, useDropdown])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])
  
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
    
    // If "Other" is selected, include the custom value
    const finalSelected = new Set(next)
    if ((item === 'Other' || item === 'Others') && otherValue.trim()) {
      finalSelected.delete(item)
      finalSelected.add(otherValue.trim())
    }
    
    if (onSelectionChange) {
      onSelectionChange(finalSelected)
    }
  }
  
  const handleOtherValueChange = (value: string) => {
    setOtherValue(value)
    // Update selection with custom value
    if (selected.has('Other') || selected.has('Others')) {
      const next = new Set(selected)
      if (value.trim()) {
        next.delete('Other')
        next.delete('Others')
        next.add(value.trim())
      }
      if (onSelectionChange) {
        onSelectionChange(next)
      }
    }
  }

  const count = selected.size
  const colorIndex = index % 5

  // Split items into always-visible quick options and dropdown-only options
  const hasQuickOptions = useDropdown && typeof visibleCount === 'number' && visibleCount > 0 && !categories
  const quickItems = hasQuickOptions ? items.slice(0, visibleCount as number) : []
  const dropdownItems = hasQuickOptions ? items.slice(visibleCount as number) : items

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: index * 0.1 }}
      className={`relative group ${useDropdown ? 'overflow-visible' : ''}`}
      style={{ zIndex: useDropdown && isDropdownOpen ? 50 : 'auto' }}
    >
      <div
        className={`relative bg-white/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 ${
          borderColors[colorIndex]
        } transition-all duration-500 ${!useDropdown ? 'overflow-hidden' : 'overflow-visible'} shadow-2xl ${
          shadowColors[colorIndex]
        } group-hover:-translate-y-2`}
        style={{ position: 'relative', zIndex: useDropdown && isDropdownOpen ? 50 : 'auto' }}
      >
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
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div className="flex-1">
            <h3
              className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900"
              style={{ fontFamily: fraunces.style.fontFamily }}
            >
              {title} {required && <span className="text-red-500 text-base sm:text-lg">*</span>}
            </h3>
              {instructionText && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1.5" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  {instructionText}
                </p>
              )}
            </div>
            {multi && count > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-[#E4002B] to-[#FF5200] text-white text-[10px] sm:text-xs font-bold flex items-center justify-center shadow-lg shadow-[#E4002B]/50 ml-4 flex-shrink-0"
              >
                {count}
              </motion.div>
            )}
          </div>
          
          {useDropdown ? (
            // Dropdown Mode
            <div className="relative w-full" ref={dropdownRef} style={{ zIndex: isDropdownOpen ? 9999 : 'auto' }}>
              {/* Dropdown Button */}
              <button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full px-4 py-3 bg-white border-2 rounded-lg sm:rounded-xl text-left flex items-center justify-between transition-all duration-200 ${
                  error && required && selected.size === 0
                    ? 'border-red-300 focus:border-red-500'
                    : isDropdownOpen
                    ? 'border-[#E4002B]'
                    : 'border-gray-200 hover:border-[#E4002B]/50'
                }`}
                style={{ fontFamily: plusJakarta.style.fontFamily }}
              >
                <div className="flex flex-wrap gap-2 flex-1 min-w-0">
                  {selected.size === 0 ? (
                    <span className="text-gray-500 text-sm sm:text-base">
                      {title === 'Property Type'
                        ? 'Choose your property type'
                        : title.startsWith('Property Location')
                        ? 'Select from other locations'
                        : `Select ${title.toLowerCase()}...`}
                    </span>
                  ) : (
                    Array.from(selected).slice(0, 2).map(item => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-[#E4002B] to-[#FF5200] text-white text-xs sm:text-sm rounded-md font-medium"
                      >
                        {item}
                        {multi && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              toggle(item)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                e.stopPropagation()
                                toggle(item)
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label={`Remove ${item}`}
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </span>
                    ))
                  )}
                  {selected.size > 2 && (
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">
                      +{selected.size - 2} more
                    </span>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Quick options row (first N capsules always visible) */}
              {hasQuickOptions && quickItems.length > 0 && (
                <div className="mt-3 mb-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {quickItems.map((item) => {
                    const active = selected.has(item)
                    return (
                      <motion.button
                        key={item}
                        onClick={() => toggle(item)}
                        className={`relative ${
                          compactCapsules
                            ? 'px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm'
                            : 'px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base'
                        } rounded-lg sm:rounded-xl font-medium transition-all duration-300 border-2 ${
                          active
                            ? 'bg-gradient-to-r from-[#E4002B] to-[#FF5200] text-white border-transparent shadow-lg shadow-[#E4002B]/50'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#E4002B]/50 hover:text-[#E4002B] hover:bg-white'
                        }`}
                        style={{ fontFamily: plusJakarta.style.fontFamily }}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        initial={false}
                      >
                        {item}
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* Dropdown Menu with Capsules */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: openUpward ? 10 : -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: openUpward ? 10 : -10 }}
                    transition={{ duration: 0.2 }}
                    // Scrollable dropdown body - smart positioning (upward or downward), attached to input
                    className="absolute z-[9999] w-full bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-2xl p-4 pb-6 overflow-y-auto"
                    style={{ 
                      position: 'absolute', 
                      ...(openUpward 
                        ? { bottom: '100%', marginBottom: 0 }
                        : { top: '100%', marginTop: 0 }
                      ),
                      left: 0, 
                      right: 0,
                      maxHeight: 'min(60vh, 400px)',
                      maxWidth: '100%'
                    } as React.CSSProperties}
                  >
                    {moreLabel && dropdownItems.length > 0 && (
                      <p
                        className="text-xs sm:text-sm text-gray-500 mb-3"
                        style={{ fontFamily: plusJakarta.style.fontFamily }}
                      >
                        {moreLabel}
                      </p>
                    )}
                    {/* Capsule Grid with Categories */}
                    {categories ? (
                      <div className="space-y-4 pb-2">
                        {Object.entries(categories).map(([categoryName, categoryItems]) => (
                          <div key={categoryName}>
                            <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                              {categoryName}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                              {categoryItems.map((item) => {
                                const active = selected.has(item)
                                const isOther = item === 'Other' || item === 'Others'
                                return (
                                  <motion.button
                                    key={item}
                                    onClick={() => {
                                      toggle(item)
                                      if (!multi && !isOther) {
                                        setIsDropdownOpen(false)
                                      }
                                    }}
                                    className={`relative ${
                                      compactCapsules
                                        ? 'px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm'
                                        : 'px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base'
                                    } rounded-lg sm:rounded-xl font-medium transition-all duration-300 border-2 ${
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
                                        className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                                      >
                                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#E4002B]" fill="currentColor" viewBox="0 0 20 20">
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
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 pb-2">
                        {dropdownItems.map((item) => {
                          const active = selected.has(item)
                          const isOther = item === 'Other' || item === 'Others'
                          return (
                            <motion.button
                              key={item}
                              onClick={() => {
                                toggle(item)
                                if (!multi && !isOther) {
                                  setIsDropdownOpen(false)
                                }
                              }}
                              className={`relative ${
                                compactCapsules
                                  ? 'px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm'
                                  : 'px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base'
                              } rounded-lg sm:rounded-xl font-medium transition-all duration-300 border-2 ${
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
                                  className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                                >
                                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#E4002B]" fill="currentColor" viewBox="0 0 20 20">
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
                    )}
                    {/* Show text input when "Other" is selected */}
                    {(selected.has('Other') || selected.has('Others')) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <input
                          type="text"
                          value={otherValue}
                          onChange={(e) => handleOtherValueChange(e.target.value)}
                          placeholder="Please specify..."
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/20 outline-none transition-all duration-200"
                          style={{ fontFamily: plusJakarta.style.fontFamily }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Grid Mode (Original)
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {items.map((item, itemIndex) => {
              const active = selected.has(item)
              return (
                <motion.button
                  key={item}
                  onClick={() => toggle(item)}
                  className={`relative px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-300 border-2 ${
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
                      className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#E4002B]" fill="currentColor" viewBox="0 0 20 20">
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
          )}
          {/* Show text input when "Other" or "Others" is selected (only in grid mode) */}
          {!useDropdown && (selected.has('Other') || selected.has('Others')) && (
            <div className="mt-4">
              <input
                type="text"
                value={otherValue}
                onChange={(e) => handleOtherValueChange(e.target.value)}
                placeholder="Please specify..."
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/20 outline-none transition-all duration-200"
                style={{ fontFamily: plusJakarta.style.fontFamily }}
              />
            </div>
          )}
          {error && required && selected.size === 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">Please select at least one option</p>
            </div>
          )}
        </div>

        {/* Enhanced Pulse Ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#E4002B] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
        <div className="absolute inset-0 rounded-2xl ring-2 ring-[#E4002B]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
      </div>
    </motion.section>
  )
}

export default function OwnerFilterPage() {
  const router = useRouter()
  const [showApplyButton, setShowApplyButton] = useState(false)
  
  // Track all selections
  const [propertyTypeSelected, setPropertyTypeSelected] = useState<Set<string>>(new Set())
  const [sizeValue, setSizeValue] = useState<number>(1000)
  const [locationSelected, setLocationSelected] = useState<Set<string>>(new Set())
  const [rentValue, setRentValue] = useState<number>(100000)
  const [depositValue, setDepositValue] = useState<string>('')
  const [featuresSelected, setFeaturesSelected] = useState<Set<string>>(new Set())
  const [availabilitySelected, setAvailabilitySelected] = useState<Set<string>>(new Set())
  const ownerLogTimeoutRef = useRef<number | null>(null)
  
  // Error states
  const [errors, setErrors] = useState({
    propertyType: false,
    size: false,
    location: false,
    rent: false,
    deposit: false,
    features: false,
    availability: false
  })

  useEffect(() => {
    const handleScroll = () => {
      setShowApplyButton(window.scrollY > 200)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Check if form is valid
  const isFormValid = 
    propertyTypeSelected.size > 0 &&
    sizeValue > 0 &&
    locationSelected.size > 0 &&
    rentValue > 0 &&
    featuresSelected.size > 0 &&
    availabilitySelected.size > 0
  
  const buildOwnerFilterSessionPayload = () => {
    return {
      propertyType: Array.from(propertyTypeSelected)[0] || null,
      location: Array.from(locationSelected)[0] || null,
      size: sizeValue || null,
      rent: rentValue || null,
      deposit: depositValue || null,
      features: Array.from(featuresSelected),
      availability: Array.from(availabilitySelected)[0] || null,
    }
  }

  const saveOwnerSessionToLocalStorage = () => {
    if (typeof window === 'undefined') return
    const payload = buildOwnerFilterSessionPayload()
    try {
      const snapshot = {
        ...payload,
        contactInfo: {
          name: null,
          email: null,
          phone: null,
        },
      }
      window.localStorage.setItem('ownerSessionData', JSON.stringify(snapshot))
    } catch (e) {
      console.error('[OwnerFilter] Failed to save ownerSessionData', e)
    }
  }

  const scheduleOwnerLog = (action: string, extraData: any = {}) => {
    if (typeof window === 'undefined') return
    if (ownerLogTimeoutRef.current) {
      window.clearTimeout(ownerLogTimeoutRef.current)
    }
    ownerLogTimeoutRef.current = window.setTimeout(() => {
      const filter_step = buildOwnerFilterSessionPayload()
      const payload = {
        status: 'in_progress',
        filter_step,
        onboarding_form: null,
        ...extraData,
      }

      saveOwnerSessionToLocalStorage()

      logSessionEvent({
        sessionType: 'owner',
        action,
        data: payload,
        userId: getClientSessionUserId(),
      })
    }, 500)
  }
  
  const handleSubmit = () => {
    // Validate all fields
    const newErrors = {
      propertyType: propertyTypeSelected.size === 0,
      size: sizeValue === 0,
      location: locationSelected.size === 0,
      rent: rentValue === 0,
      deposit: false, // Optional field
      features: featuresSelected.size === 0,
      availability: availabilitySelected.size === 0
    }
    
    setErrors(newErrors)
    
    if (!isFormValid) {
      // Scroll to first error
      const firstError = Object.entries(newErrors).find(([_, hasError]) => hasError)
      if (firstError) {
        document.querySelector(`[data-field="${firstError[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    
    // Save to localStorage
    const filterData = {
      propertyType: Array.from(propertyTypeSelected)[0],
      locations: Array.from(locationSelected),
      size: sizeValue,
      rent: rentValue,
      deposit: depositValue,
      features: Array.from(featuresSelected),
      availability: Array.from(availabilitySelected)[0]
    }
    
    localStorage.setItem('ownerFilterData', JSON.stringify(filterData))
    saveOwnerSessionToLocalStorage()
    logSessionEvent({
      sessionType: 'owner',
      action: 'submit',
      data: {
        status: 'in_progress',
        filter_step: buildOwnerFilterSessionPayload(),
        onboarding_form: null,
      },
      userId: getClientSessionUserId(),
    })
    
    // Redirect to onboarding
    router.push('/onboarding/owner?prefilled=true')
  }

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

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-12 pb-24 sm:pb-32 md:pb-40">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-6 sm:mb-8 md:mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg sm:rounded-xl hover:border-[#E4002B]/50 hover:text-[#E4002B] transition-all duration-200 hover:shadow-md hover:shadow-[#E4002B]/20 backdrop-blur-sm bg-white/80"
            style={{ fontFamily: plusJakarta.style.fontFamily }}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className="mb-6 sm:mb-8 md:mb-12"
        >
          <div className="group relative w-full max-w-2xl mx-auto bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 border-2 border-[#E4002B]/30 hover:border-[#E4002B] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#E4002B]/50">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E4002B]/10 via-[#FF5200]/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#E4002B]/20 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
            
            <div className="relative z-10 flex items-center gap-2 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#E4002B] to-[#FF5200] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#E4002B]/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E4002B] flex-shrink-0 animate-pulse"></div>
                  <span className="text-[9px] sm:text-[10px] font-medium text-[#E4002B] uppercase tracking-wider">For Property Owners</span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">List Your Property</h3>
                <p className="text-[10px] sm:text-xs text-gray-600 leading-snug line-clamp-1">Connect with qualified tenants quickly</p>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#E4002B]/10 border border-[#E4002B]/30 rounded-md sm:rounded-lg flex-shrink-0">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#E4002B]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] sm:text-[11px] font-medium text-[#E4002B]">Instant</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter Cards - Platform Performance Style */}
        <div className="grid gap-4 sm:gap-6 md:gap-8 overflow-visible mb-8 sm:mb-12 md:mb-16">
          <div data-field="propertyType" className="overflow-visible relative z-20">
            <FilterCard 
              title="Property Type" 
              items={propertyTypes} 
              index={0} 
              required 
              useDropdown={true}
              visibleCount={6}
              compactCapsules
              instructionText="Highest & Instant matches for FnB properties"
              moreLabel="Choose from more property types"
              onSelectionChange={(set) => {
                setPropertyTypeSelected(set)
                scheduleOwnerLog('filter_change', { filter_step: buildOwnerFilterSessionPayload() })
              }}
              error={errors.propertyType}
            />
          </div>
          <div data-field="size">
            <SizeSlider 
              index={1} 
              required 
              onSizeChange={(size) => {
                setSizeValue(size)
                scheduleOwnerLog('filter_change', { filter_step: buildOwnerFilterSessionPayload() })
              }}
              error={errors.size}
            />
          </div>
          <div data-field="location" className="overflow-visible relative z-20">
            <FilterCard 
              title="Property Location" 
              items={locations} 
              /* Owners should choose a single primary location at a time */
              index={2} 
              required
              useDropdown={true}
              visibleCount={6}
              compactCapsules
              moreLabel="Choose more areas across the city"
              onSelectionChange={(set) => {
                setLocationSelected(set)
                scheduleOwnerLog('filter_change', { filter_step: buildOwnerFilterSessionPayload() })
              }}
              error={errors.location}
            />
          </div>
          <div data-field="rent">
            <RentSlider 
              index={3} 
              required 
              onRentChange={(rent) => {
                setRentValue(rent)
                scheduleOwnerLog('filter_change', { filter_step: buildOwnerFilterSessionPayload() })
              }}
              error={errors.rent}
            />
          </div>
          <div data-field="deposit">
            <SecurityDepositInput 
              index={4} 
              required={false}
              onDepositChange={(value) => {
                setDepositValue(value)
                scheduleOwnerLog('filter_change', { filter_step: buildOwnerFilterSessionPayload() })
              }}
              error={errors.deposit}
            />
          </div>
          <div data-field="features" className="overflow-visible relative z-20">
            <FilterCard 
              title="Features" 
              items={features} 
              multi 
              index={5} 
              required
              useDropdown={true}
              categories={featuresCategories}
              compactCapsules
              instructionText="Choose any Features relevant to your property"
              onSelectionChange={(set) => {
                setFeaturesSelected(set)
                scheduleOwnerLog('filter_change', { filter_step: buildOwnerFilterSessionPayload() })
              }}
              error={errors.features}
            />
          </div>
          <div data-field="availability">
            <FilterCard 
              title="Availability" 
              items={availabilities} 
              index={6} 
              required
              onSelectionChange={(set) => {
                setAvailabilitySelected(set)
                scheduleOwnerLog('filter_change', { filter_step: buildOwnerFilterSessionPayload() })
              }}
              error={errors.availability}
            />
          </div>
        </div>
      </div>

      {/* Floating Apply Button - Futuristic */}
      <AnimatePresence>
        {showApplyButton && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50"
          >
            <motion.button
              disabled={!isFormValid}
              onClick={handleSubmit}
              className={`group relative px-5 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold overflow-hidden ${
                isFormValid
                  ? 'bg-gradient-to-r from-[#E4002B] to-[#FF5200] text-white shadow-[0_8px_24px_rgba(228,0,43,0.4)] cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              style={{ fontFamily: plusJakarta.style.fontFamily }}
              whileHover={isFormValid ? { scale: 1.05, y: -2 } : {}}
              whileTap={isFormValid ? { scale: 0.95 } : {}}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200] to-[#E4002B] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                Apply Filters
                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 rounded-xl border-2 border-white/30 opacity-0 group-hover:opacity-100 animate-ping"></div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Note */}
      <div className="relative z-0 mt-8 sm:mt-10 md:mt-12 mb-6 sm:mb-8 flex justify-center px-4">
        <p
          className="max-w-3xl text-[10px] sm:text-xs md:text-sm text-gray-500 text-center leading-relaxed"
          style={{ fontFamily: plusJakarta.style.fontFamily }}
        >
          We use your preferences to instantly match your property with high-intent FnB and retail brands. 
          Your details are kept confidential and only shared with verified matches to speed up closures.
        </p>
      </div>

      {/* Bottom Glow Line */}
      <div className="relative z-0 mt-8 sm:mt-10 md:mt-12 h-px bg-gradient-to-r from-transparent via-[#E4002B] to-transparent opacity-50"></div>
    </div>
  )
}
