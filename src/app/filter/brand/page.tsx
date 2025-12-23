'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import { logSessionEvent, getClientSessionUserId } from '@/lib/session-logger'
import { getContextualInsight } from '@/lib/loading-insights'

const fraunces = Fraunces({ subsets: ['latin'], weight: ['600', '700'], display: 'swap', variable: '--font-fraunces' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-plusjakarta' })

const businessTypes = [
  'Café/QSR',
  'Restaurant',
  'Bar/Brewery',
  'Retail',
  'Gym',
  'Sports Facility',
  'Entertainment',
  'Others',
]
const sizeRanges = ['100-500 sqft', '500-1,000 sqft', '1,000-2,000 sqft', '2,000-5,000 sqft', '5,000-10,000 sqft', '10,000+ sqft', 'Custom']
// Alphabetical list of locations (matching owner filter page)
const allLocations = [
  'Banashankari',
  'Bannerghatta Road',
  'Basavanagudi',
  'Bellandur',
  'Brigade Road',
  'BTM Layout',
  'Church Street',
  'Commercial Street',
  'Devanahalli',
  'Electronic City',
  'Frazer Town',
  'Hebbal',
  'Hennur',
  'HSR Layout',
  'Indiranagar',
  'Jayanagar',
  'JP Nagar',
  'Kalyan Nagar',
  'Kamanahalli',
  'Kanakapura Road',
  'Kengeri',
  'Koramangala',
  'KR Puram',
  'Lavelle Road',
  'Magadi Road',
  'Malleshwaram',
  'Manyata Tech Park',
  'Marathahalli',
  'MG Road',
  'Mysore Road',
  'New Bel Road',
  'Old Madras Road',
  'Peenya',
  'Rajajinagar',
  'Richmond Town',
  'RR Nagar',
  'RT Nagar',
  'Sadashivanagar',
  'Sahakar Nagar',
  'Sarjapur Road',
  'UB City',
  'Ulsoor',
  'Vijayanagar',
  'Whitefield',
  'Yelahanka',
  'Yeshwanthpur',
  'Others'
]

// Popular locations (first 8)
const popularLocations = allLocations.slice(0, 8)
// Other locations (remaining)
const otherLocations = allLocations.slice(8)
const timelines = ['Immediate', '1 month', '1-2 months', '2-3 months', 'Flexible']

// Custom Location Selector Component with Popular Areas + Dropdown
function LocationSelector({
  title,
  popularLocations,
  otherLocations,
  index = 0,
  required = false,
  initialSelected,
  onSelectionChange
}: {
  title: string
  popularLocations: string[]
  otherLocations: string[]
  index?: number
  required?: boolean
  initialSelected?: Set<string>
  onSelectionChange?: (selected: Set<string>) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(initialSelected || new Set())
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownContentRef = useRef<HTMLDivElement>(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target) &&
          dropdownContentRef.current && !dropdownContentRef.current.contains(target)) {
        setShowDropdown(false)
      }
    }
    
    if (showDropdown) {
      // Use setTimeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])
  
  // Sync with parent state
  const initialSelectedStr = useMemo(() => {
    return initialSelected ? Array.from(initialSelected).sort().join(',') : ''
  }, [initialSelected])
  
  useEffect(() => {
    if (initialSelected && initialSelected.size > 0) {
      const currentArray = Array.from(selected).sort().join(',')
      const newArray = Array.from(initialSelected).sort().join(',')
      if (currentArray !== newArray) {
        setSelected(new Set(initialSelected))
      }
    } else if (!initialSelected || initialSelected.size === 0) {
      if (selected.size > 0 && initialSelectedStr === '') {
        setSelected(new Set())
      }
    }
  }, [initialSelectedStr, initialSelected, selected])
  
  const toggle = (item: string) => {
    const next = new Set(selected)
    next.has(item) ? next.delete(item) : next.add(item)
    setSelected(next)
    
    if (onSelectionChange) {
      onSelectionChange(next)
    }
  }
  
  const count = selected.size
  const colorIndex = index % 5
  const hasError = required && selected.size === 0
  
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: index * 0.1 }}
      className={`relative group ${showDropdown ? 'z-50' : ''}`}
    >
      <div className={`relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 ${hasError ? 'border-red-500/50 hover:border-red-500' : borderColors[colorIndex]} transition-all duration-500 overflow-visible shadow-2xl ${shadowColors[colorIndex]} ${showDropdown ? '' : 'group-hover:-translate-y-2'}`}>
        {/* Animated Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[colorIndex]} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
        
        {/* Animated Corner Accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accentColors[colorIndex]} to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500`}></div>
        
        {/* Particle Effect (static, no pulse animation for better focus) */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#FF5200] rounded-full"></div>
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-[#E4002B] rounded-full" style={{animationDelay: '0.5s'}}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3
                className="text-lg sm:text-xl md:text-2xl font-bold text-white"
                style={{ fontFamily: fraunces.style.fontFamily }}
              >
                {title}
              </h3>
              {required && (
                <span className="text-red-500 text-base sm:text-lg font-bold">*</span>
              )}
            </div>
            {count > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white text-[10px] sm:text-xs font-bold flex items-center justify-center shadow-lg shadow-[#FF5200]/50"
              >
                {count}
              </motion.div>
            )}
          </div>
          
          {/* Subtext */}
          <p className="text-xs sm:text-sm text-gray-400 mb-4">
            Choose at least 3 locations to get better matches
          </p>
          
          {hasError && (
            <div className="mb-4 text-sm text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              This field is required
            </div>
          )}
          
          {/* Popular Locations Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
            {popularLocations.map((item) => {
              const active = selected.has(item)
              return (
                <motion.button
                  key={item}
                  onClick={() => toggle(item)}
                  className={`relative px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-300 border-2 ${
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
                  {active && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FF5200]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
          
          {/* Dropdown for Other Locations */}
          <div className="relative z-[60]" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-4 py-3 bg-gray-800/40 border-2 border-gray-700/50 hover:border-[#FF5200]/50 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium text-gray-200 hover:text-white hover:bg-gray-800/60 transition-all duration-300 flex items-center justify-between"
              style={{ fontFamily: plusJakarta.style.fontFamily }}
            >
              <span>Select from other areas</span>
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  ref={dropdownContentRef}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-[9999] w-full mt-2 bg-gray-900 border-2 border-gray-700 rounded-lg sm:rounded-xl shadow-2xl max-h-96 overflow-y-auto"
                  style={{ top: '100%', left: 0 }}
                >
                  <div className="p-2 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5">
                    {otherLocations.map((item) => {
                      const active = selected.has(item)
                      return (
                        <button
                          key={item}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggle(item)
                          }}
                          className={`relative px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-300 border ${
                            active
                              ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white border-transparent shadow-md shadow-[#FF5200]/50'
                              : 'bg-gray-800/40 text-gray-200 border-gray-700/50 hover:border-[#FF5200]/50 hover:text-white hover:bg-gray-800/60'
                          }`}
                          style={{ fontFamily: plusJakarta.style.fontFamily }}
                        >
                          <span className="truncate block text-center">{item}</span>
                          {active && (
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-md">
                              <svg className="w-1.5 h-1.5 text-[#FF5200]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Subtle hover ring without pulse animation */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100"></div>
        <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
      </div>
    </motion.section>
  )
}

function BudgetSlider({ index = 0, required = false, onBudgetChange }: { index?: number; required?: boolean; onBudgetChange?: (budget: { min: number; max: number }) => void }) {
  // Hybrid scale:
  // - 0-70% slider: linear 0 → 3L (more precision in normal range)
  // - 70-100% slider: exponential 3L → 1Cr (compressed high range)
  const MIN_VALUE = 0
  const MAX_VALUE = 10000000 // 1 crore max
  const LINEAR_MAX = 300000 // 3L
  const LINEAR_PORTION = 70 // percent of slider reserved for linear section
  const EXP_K = Math.log(MAX_VALUE / LINEAR_MAX) // growth factor for exponential tail

  // Convert slider value (0-100) to actual budget value
  const sliderToValue = (slider: number): number => {
    const clampedSlider = Math.max(0, Math.min(100, slider))

    // Linear region 0–LINEAR_PORTION%
    if (clampedSlider <= LINEAR_PORTION) {
      const value = (clampedSlider / LINEAR_PORTION) * LINEAR_MAX
      return Math.round(value / 10000) * 10000
    }

    // Exponential tail LINEAR_PORTION–100%
    const t = (clampedSlider - LINEAR_PORTION) / (100 - LINEAR_PORTION) // 0..1
    const expValue = LINEAR_MAX * Math.exp(EXP_K * t)
    const clampedValue = Math.min(expValue, MAX_VALUE)
    return Math.round(clampedValue / 10000) * 10000
  }

  // Convert actual budget value to slider value (0-100)
  const valueToSlider = (value: number): number => {
    const clampedValue = Math.max(MIN_VALUE, Math.min(MAX_VALUE, value))

    // Map values in linear range directly
    if (clampedValue <= LINEAR_MAX) {
      const slider = (clampedValue / LINEAR_MAX) * LINEAR_PORTION
      return Math.max(0, Math.min(100, slider))
    }

    // Invert exponential mapping for high range
    const t = Math.log(clampedValue / LINEAR_MAX) / EXP_K // 0..1
    const slider = LINEAR_PORTION + t * (100 - LINEAR_PORTION)
    return Math.max(LINEAR_PORTION, Math.min(100, slider))
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`
    }
    if (value >= 100000) {
      const lakhs = value / 100000
      return lakhs % 1 === 0 ? `₹${lakhs.toFixed(0)}L` : `₹${lakhs.toFixed(1)}L`
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`
    }
    return `₹${value.toLocaleString('en-IN')}`
  }

  const [budgetMin, setBudgetMin] = useState<number>(50000)
  const [budgetMax, setBudgetMax] = useState<number>(200000)

  const [sliderMin, setSliderMin] = useState(valueToSlider(50000))
  const [sliderMax, setSliderMax] = useState(valueToSlider(200000))

  const [minInput, setMinInput] = useState('50000')
  const [maxInput, setMaxInput] = useState('200000')
  
  // Initialize budget range on mount
  useEffect(() => {
    if (onBudgetChange) {
      onBudgetChange({ min: budgetMin, max: budgetMax })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const parseBudgetInput = (input: string): number | null => {
    // Remove currency symbols, commas, and spaces
    const cleaned = input.trim().replace(/[₹,\s]/g, '').toUpperCase()
    
    // Handle crores (Cr)
    if (cleaned.endsWith('CR')) {
      const num = parseFloat(cleaned.slice(0, -2))
      if (!isNaN(num)) return num * 10000000
    }
    
    // Handle lakhs (L)
    if (cleaned.endsWith('L')) {
      const num = parseFloat(cleaned.slice(0, -1))
      if (!isNaN(num)) return num * 100000
    }
    
    // Handle thousands (K)
    if (cleaned.endsWith('K')) {
      const num = parseFloat(cleaned.slice(0, -1))
      if (!isNaN(num)) return num * 1000
    }
    
    // Handle plain number (with or without commas)
    const num = parseFloat(cleaned.replace(/,/g, ''))
    if (!isNaN(num) && num >= 0) {
      return num
    }
    
    return null
  }

  const handleMinSliderChange = (sliderValue: number) => {
    const actualValue = sliderToValue(sliderValue)
    const clamped = Math.max(MIN_VALUE, Math.min(actualValue, budgetMax - 10000))
    setBudgetMin(clamped)
    setSliderMin(valueToSlider(clamped))
    setMinInput(clamped.toLocaleString('en-IN'))
    if (onBudgetChange) {
      onBudgetChange({ min: clamped, max: budgetMax })
    }
  }

  const handleMaxSliderChange = (sliderValue: number) => {
    const actualValue = sliderToValue(sliderValue)
    const clamped = Math.min(MAX_VALUE, Math.max(actualValue, budgetMin + 10000))
    setBudgetMax(clamped)
    setSliderMax(valueToSlider(clamped))
    setMaxInput(clamped.toLocaleString('en-IN'))
    if (onBudgetChange) {
      onBudgetChange({ min: budgetMin, max: clamped })
    }
  }

  const handleMinInputChange = (input: string) => {
    setMinInput(input)
    const parsed = parseBudgetInput(input)
    if (parsed !== null && parsed >= MIN_VALUE && parsed <= MAX_VALUE && parsed <= budgetMax) {
      setBudgetMin(parsed)
      setSliderMin(valueToSlider(parsed))
      if (onBudgetChange) {
        onBudgetChange({ min: parsed, max: budgetMax })
      }
    }
  }

  const handleMaxInputChange = (input: string) => {
    setMaxInput(input)
    const parsed = parseBudgetInput(input)
    if (parsed !== null && parsed >= MIN_VALUE && parsed <= MAX_VALUE && parsed >= budgetMin) {
      setBudgetMax(parsed)
      setSliderMax(valueToSlider(parsed))
      if (onBudgetChange) {
        onBudgetChange({ min: budgetMin, max: parsed })
      }
    }
  }

  const handleMinInputBlur = () => {
    const parsed = parseBudgetInput(minInput)
    if (parsed !== null && parsed >= MIN_VALUE && parsed <= MAX_VALUE && parsed <= budgetMax) {
      setBudgetMin(parsed)
      setSliderMin(valueToSlider(parsed))
      setMinInput(parsed.toLocaleString('en-IN'))
    } else {
      setMinInput(budgetMin.toLocaleString('en-IN'))
    }
  }

  const handleMaxInputBlur = () => {
    const parsed = parseBudgetInput(maxInput)
    if (parsed !== null && parsed >= MIN_VALUE && parsed <= MAX_VALUE && parsed >= budgetMin) {
      setBudgetMax(parsed)
      setSliderMax(valueToSlider(parsed))
      setMaxInput(parsed.toLocaleString('en-IN'))
    } else {
      setMaxInput(budgetMax.toLocaleString('en-IN'))
    }
  }
  
  const hasError = required && (budgetMin < 0 || budgetMax <= budgetMin)

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
      <div className={`relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 ${hasError ? 'border-red-500/50 hover:border-red-500' : borderColors[colorIndex]} transition-all duration-500 overflow-hidden shadow-2xl ${shadowColors[colorIndex]} group-hover:-translate-y-2`}>
        {/* Animated Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[colorIndex]} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
        
        {/* Animated Corner Accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accentColors[colorIndex]} to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500`}></div>
        
        {/* Particle Effect (static, no pulse animation) */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#FF5200] rounded-full"></div>
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-[#E4002B] rounded-full" style={{animationDelay: '0.5s'}}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <h3
              className="text-xl sm:text-2xl font-bold text-white"
              style={{ fontFamily: fraunces.style.fontFamily }}
            >
              Budget (Monthly Rent)
            </h3>
            {required && (
              <span className="text-red-500 text-base sm:text-lg font-bold">*</span>
            )}
          </div>
          {hasError && (
            <div className="mb-4 text-sm text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              This field is required
            </div>
          )}

          <div className="space-y-4">
            {/* Min Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                Minimum Budget
                </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={minInput}
                  onChange={(e) => handleMinInputChange(e.target.value)}
                  onBlur={handleMinInputBlur}
                  placeholder="50000 or 300000"
                  className={`flex-1 px-3 py-2 bg-gray-800/60 border-2 ${hasError ? 'border-red-500/50 focus:border-red-500' : 'border-gray-700/50 focus:border-[#FF5200]'} rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none transition-all`}
                  style={{ fontFamily: plusJakarta.style.fontFamily }}
                />
                <span className="text-sm text-gray-400 whitespace-nowrap">or use slider</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={sliderMin}
                onChange={(e) => handleMinSliderChange(parseInt(e.target.value, 10))}
                className="w-full h-2 mt-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider slider-min"
              />
              </div>

            {/* Max Budget */}
              <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                Maximum Budget
                </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={maxInput}
                  onChange={(e) => handleMaxInputChange(e.target.value)}
                  onBlur={handleMaxInputBlur}
                  placeholder="200000 or 1000000"
                  className={`flex-1 px-3 py-2 bg-gray-800/60 border-2 ${hasError ? 'border-red-500/50 focus:border-red-500' : 'border-gray-700/50 focus:border-[#FF5200]'} rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none transition-all`}
                  style={{ fontFamily: plusJakarta.style.fontFamily }}
                />
                <span className="text-sm text-gray-400 whitespace-nowrap">or use slider</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={sliderMax}
                onChange={(e) => handleMaxSliderChange(parseInt(e.target.value, 10))}
                className="w-full h-2 mt-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider slider-max"
              />
            </div>

            {/* Budget Range Display */}
            <div className="pt-3 border-t border-gray-700/50">
                <div className="text-center">
                <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Selected Range
                  </p>
                <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#FF6B35] to-[#E4002B]" style={{ fontFamily: fraunces.style.fontFamily }}>
                  {formatCurrency(budgetMin)} - {formatCurrency(budgetMax)}
                  </p>
                </div>
              </div>
          </div>
        </div>

        {/* Subtle hover ring without pulse animation */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100"></div>
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
  index = 0,
  required = false,
  initialSelected,
  initialOtherValue,
  onSelectionChange
}: { 
  title: string
  items: string[]
  multi?: boolean
  index?: number
  required?: boolean
  initialSelected?: Set<string>
  initialOtherValue?: string
  onSelectionChange?: (selected: Set<string>) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(initialSelected || new Set())
  const [otherValue, setOtherValue] = useState(initialOtherValue || '')
  
  // Sync with parent state when initialSelected changes
  // Convert Set to string for stable dependency comparison
  const initialSelectedStr = useMemo(() => {
    return initialSelected ? Array.from(initialSelected).sort().join(',') : ''
  }, [initialSelected])
  
  // Handle initialOtherValue - if provided, select "Others" and set the value
  useEffect(() => {
    if (initialOtherValue && initialOtherValue.trim()) {
      if (otherValue !== initialOtherValue.trim()) {
        setOtherValue(initialOtherValue.trim())
      }
      // Select "Others" if not already selected
      const hasOthers = selected.has('Others') || selected.has('Other')
      if (!hasOthers) {
        const next = new Set(selected)
        if (multi) {
          next.add('Others')
        } else {
          next.clear()
          next.add('Others')
        }
        setSelected(next)
        // Trigger callback with custom value
        if (onSelectionChange) {
          const finalSelected = new Set(next)
          finalSelected.delete('Others')
          finalSelected.delete('Other')
          finalSelected.add(initialOtherValue.trim())
          onSelectionChange(finalSelected)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOtherValue])
  
  useEffect(() => {
    if (initialSelected && initialSelected.size > 0) {
      // Compare sets by converting to sorted arrays
      const currentArray = Array.from(selected).sort().join(',')
      const newArray = Array.from(initialSelected).sort().join(',')
      if (currentArray !== newArray) {
        setSelected(new Set(initialSelected))
      }
    } else if (!initialSelected || initialSelected.size === 0) {
      // Only clear if we have selections but initialSelected is empty
      if (selected.size > 0 && initialSelectedStr === '') {
        setSelected(new Set())
      }
    }
  }, [initialSelectedStr, initialSelected, selected])
  
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
      finalSelected.delete('Other')
      finalSelected.delete('Others')
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

  const count = selected.size
  const colorIndex = index % 5
  const hasError = required && selected.size === 0

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: index * 0.1 }}
      className="relative group"
    >
      <div className={`relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 ${hasError ? 'border-red-500/50 hover:border-red-500' : borderColors[colorIndex]} transition-all duration-500 overflow-hidden shadow-2xl ${shadowColors[colorIndex]} group-hover:-translate-y-2`}>
        {/* Animated Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[colorIndex]} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
        
        {/* Animated Corner Accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accentColors[colorIndex]} to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500`}></div>
        
        {/* Particle Effect (static, no pulse animation) */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#FF5200] rounded-full"></div>
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-[#E4002B] rounded-full" style={{animationDelay: '0.5s'}}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3
                className="text-lg sm:text-xl md:text-2xl font-bold text-white"
                style={{ fontFamily: fraunces.style.fontFamily }}
              >
                {title}
              </h3>
              {required && (
                <span className="text-red-500 text-base sm:text-lg font-bold">*</span>
              )}
            </div>
            {multi && count > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white text-[10px] sm:text-xs font-bold flex items-center justify-center shadow-lg shadow-[#FF5200]/50"
              >
                {count}
              </motion.div>
            )}
          </div>
          {hasError && (
            <div className="mb-4 text-sm text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              This field is required
            </div>
          )}
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {items.map((item, itemIndex) => {
              const active = selected.has(item)
              return (
                <motion.button
                  key={item}
                  onClick={() => toggle(item)}
                  className={`relative px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-300 border-2 ${
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
                      className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FF5200]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100"
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
          {/* Show text input when "Other" or "Others" is selected */}
          {(selected.has('Other') || selected.has('Others')) && (
            <div className="mt-4">
              <input
                type="text"
                value={otherValue}
                onChange={(e) => handleOtherValueChange(e.target.value)}
                placeholder="Please specify..."
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#FF5200] focus:ring-2 focus:ring-[#FF5200]/20 outline-none transition-all duration-200"
                style={{ fontFamily: plusJakarta.style.fontFamily }}
              />
            </div>
          )}
        </div>

        {/* Subtle hover ring without pulse animation */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100"></div>
        <div className="absolute inset-0 rounded-2xl ring-2 ring-[#FF5200]/50 opacity-0 group-hover:opacity-100 blur-sm"></div>
      </div>
    </motion.section>
  )
}

// Helper function to map size value to size range label
function getSizeRangeLabel(sizeMin: number, sizeMax: number): string | null {
  // Check if it matches any predefined range
  for (const range of sizeRanges) {
    if (range === 'Custom') continue
    
    if (range.includes('-')) {
      const [minStr, maxStr] = range.split('-').map(v => v.trim())
      const min = parseInt(minStr.replace(/[^0-9]/g, '')) || 0
      const max = parseInt(maxStr.replace(/[^0-9]/g, '')) || 0
      
      // Check if the provided range overlaps with this predefined range
      if (sizeMin <= max && sizeMax >= min) {
        return range
      }
    } else if (range.includes('+')) {
      const min = parseInt(range.replace(/[^0-9]/g, '')) || 0
      if (sizeMin >= min) {
        return range
      }
    }
  }
  
  // If no exact match, find the closest range
  if (sizeMin <= 500) return '100-500 sqft'
  if (sizeMin <= 1000) return '500-1,000 sqft'
  if (sizeMin <= 2000) return '1,000-2,000 sqft'
  if (sizeMin <= 5000) return '2,000-5,000 sqft'
  if (sizeMin <= 10000) return '5,000-10,000 sqft'
  return '10,000+ sqft'
}

function BrandFilterPageContent() {
  const searchParams = useSearchParams()
  const [showApplyButton, setShowApplyButton] = useState(false)
  const [aiInsight, setAiInsight] = useState<string>('')
  const [showAiInsight, setShowAiInsight] = useState(false)
  const [contactInfo] = useState({ email: '', phone: '' })
  
  // Track selections for validation
  const [businessTypeSelected, setBusinessTypeSelected] = useState<Set<string>>(new Set())
  const [businessTypeOtherValue, setBusinessTypeOtherValue] = useState<string>('')
  const [sizeRangeSelected, setSizeRangeSelected] = useState<Set<string>>(new Set())
  const [locationSelected, setLocationSelected] = useState<Set<string>>(new Set())
  const [timelineSelected, setTimelineSelected] = useState<Set<string>>(new Set())
  const [budgetRange, setBudgetRange] = useState<{ min: number; max: number }>({ min: 50000, max: 200000 })
  const brandLogTimeoutRef = useRef<number | null>(null)
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false)

  const buildFilterStepPayload = () => {
    // Derive a combined size range from all selected ranges
    const sizeLabels = Array.from(sizeRangeSelected)
    let globalMin = Number.MAX_SAFE_INTEGER
    let globalMax = 0

    sizeLabels.forEach(label => {
      if (label.includes('-')) {
        const [minStr, maxStr] = label.split('-').map(v => v.trim())
        const min = parseInt(minStr.replace(/[^0-9]/g, '')) || 0
        const max = parseInt(maxStr.replace(/[^0-9]/g, '')) || 0
        if (min > 0) globalMin = Math.min(globalMin, min)
        if (max > 0) globalMax = Math.max(globalMax, max)
      } else if (label.includes('+')) {
        const min = parseInt(label.replace(/[^0-9]/g, '')) || 0
        if (min > 0) {
          globalMin = Math.min(globalMin, min)
          globalMax = Math.max(globalMax, 2000000)
        }
      }
    })

    if (globalMin === Number.MAX_SAFE_INTEGER) globalMin = 0
    if (globalMax === 0) globalMax = 100000

    return {
      businessType: Array.from(businessTypeSelected),
      sizeRange: { min: globalMin, max: globalMax },
      locations: Array.from(locationSelected),
      budgetRange: { min: budgetRange.min, max: budgetRange.max },
      timeline: Array.from(timelineSelected)[0] || null,
    }
  }

  const saveBrandSessionToLocalStorage = () => {
    if (typeof window === 'undefined') return
    const filterStep = buildFilterStepPayload()
    try {
      const sessionPayload = {
        businessType: filterStep.businessType,
        sizeRange: filterStep.sizeRange,
        locations: filterStep.locations,
        budgetRange: filterStep.budgetRange,
        timeline: filterStep.timeline,
        contactInfo: {
          name: null,
          email: contactInfo.email || '',
          phone: contactInfo.phone ? `+91${contactInfo.phone}` : '',
        },
      }
      localStorage.setItem('brandSessionData', JSON.stringify(sessionPayload))
    } catch (e) {
      // Swallow localStorage errors (e.g. quota exceeded) silently
      console.error('[BrandFilter] Failed to save brandSessionData', e)
    }
  }

  const scheduleBrandLog = (action: string, extraData: any = {}) => {
    if (typeof window === 'undefined') return
    if (brandLogTimeoutRef.current) {
      window.clearTimeout(brandLogTimeoutRef.current)
    }

    brandLogTimeoutRef.current = window.setTimeout(() => {
      const filterStep = buildFilterStepPayload()
      const payload = {
        status: 'in_progress',
        filter_step: filterStep,
        contact_step: {
          name: null,
          email: contactInfo.email || null,
          phone: contactInfo.phone ? `+91${contactInfo.phone}` : null,
        },
        ...extraData,
      }

      // Persist a simplified session snapshot for pre-filling other flows
      saveBrandSessionToLocalStorage()

      logSessionEvent({
        sessionType: 'brand',
        action,
        data: payload,
        userId: getClientSessionUserId(),
      })
    }, 500)
  }
  
  // Check if all required fields are filled
  const isFormValid = 
    businessTypeSelected.size > 0 &&
    sizeRangeSelected.size > 0 &&
    locationSelected.size > 0 &&
    timelineSelected.size > 0 &&
    budgetRange.min >= 50000 &&
    budgetRange.max > budgetRange.min

  // Prefill from URL parameters (from hero search)
  // This MUST run first and take precedence over localStorage
  useEffect(() => {
    if (urlParamsProcessed || typeof window === 'undefined') return
    
    const type = searchParams.get('type')
    const otherType = searchParams.get('otherType')
    const sizeMin = searchParams.get('sizeMin')
    const sizeMax = searchParams.get('sizeMax')
    const location = searchParams.get('location')
    const budgetMin = searchParams.get('budgetMin')
    const budgetMax = searchParams.get('budgetMax')
    
    let hasUrlParams = false
    
    // Pre-fill business type (support multiple types separated by comma)
    if (type) {
      // Decode URL-encoded values (e.g., Café%2FQSR becomes Café/QSR)
      const decodedType = decodeURIComponent(type)
      const types = decodedType.split(',').map(t => t.trim()).filter(t => businessTypes.includes(t))
      if (types.length > 0) {
        // Clear any existing selections first
        setBusinessTypeSelected(new Set(types))
        setBusinessTypeOtherValue('') // Clear other value when URL has explicit type
        hasUrlParams = true
      }
    }
    
    // Pre-fill custom property type (for "Others" option)
    if (otherType) {
      const decodedOtherType = decodeURIComponent(otherType)
      setBusinessTypeOtherValue(decodedOtherType)
      // Select "Others" if not already selected
      const currentTypes = new Set(businessTypeSelected)
      if (!currentTypes.has('Others')) {
        currentTypes.add('Others')
        setBusinessTypeSelected(currentTypes)
      }
      hasUrlParams = true
    }
    
    // Pre-fill size range
    if (sizeMin || sizeMax) {
      const min = sizeMin ? parseInt(sizeMin) : null
      const max = sizeMax ? parseInt(sizeMax) : null
      if (min !== null || max !== null) {
        const rangeLabel = getSizeRangeLabel(min || 0, max || 100000)
        if (rangeLabel) {
          setSizeRangeSelected(new Set([rangeLabel]))
          hasUrlParams = true
        }
      }
    }
    
    // Pre-fill location (support multiple locations separated by comma)
    if (location) {
      const decodedLocation = decodeURIComponent(location)
      const locs = decodedLocation.split(',').map(l => l.trim()).filter(l => allLocations.includes(l))
      if (locs.length > 0) {
        setLocationSelected(new Set(locs))
        hasUrlParams = true
      }
    }
    
    // Pre-fill budget
    if (budgetMin || budgetMax) {
      const min = budgetMin ? parseInt(budgetMin) : 50000
      const max = budgetMax ? parseInt(budgetMax) : 200000
      if (min > 0 && max > min) {
        setBudgetRange({ min, max })
        hasUrlParams = true
      }
    }
    
    if (hasUrlParams) {
      setUrlParamsProcessed(true)
      // Clear localStorage when URL params are present to avoid conflicts
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('brandSessionData')
        window.localStorage.removeItem('editingFilters')
        window.localStorage.removeItem('brandFilterData')
      }
    }
  }, [searchParams, urlParamsProcessed])

  // Prefill filters when coming back from results via "Edit Filters" or when session data exists
  useEffect(() => {
    if (typeof window === 'undefined' || urlParamsProcessed) return

    const editingFlag = window.localStorage.getItem('editingFilters')
    const isEditing = editingFlag === 'true'

    let filterData: any = null
    let sessionData: any = null

    try {
      const filterRaw = window.localStorage.getItem('brandFilterData')
      if (filterRaw) {
        filterData = JSON.parse(filterRaw)
      }
    } catch (e) {
      console.error('[BrandFilter] Failed to parse brandFilterData', e)
    }

    try {
      const sessionRaw = window.localStorage.getItem('brandSessionData')
      if (sessionRaw) {
        sessionData = JSON.parse(sessionRaw)
      }
    } catch (e) {
      console.error('[BrandFilter] Failed to parse brandSessionData', e)
    }

    // Once detected, clear the editing flag so future visits behave normally
    if (isEditing) {
      window.localStorage.removeItem('editingFilters')
    }

    // Prefer the richer filter snapshot when editing; otherwise fall back to session
    const source = (isEditing && filterData) ? filterData : sessionData
    if (!source) return

    try {
      // Business type (array of labels)
      if (Array.isArray(source.businessType) && source.businessType.length > 0) {
        setBusinessTypeSelected(new Set<string>(source.businessType))
      }

      // Size ranges – prefer saved label set from filterData
      if (Array.isArray(source.sizeRanges) && source.sizeRanges.length > 0) {
        setSizeRangeSelected(new Set<string>(source.sizeRanges))
      }

      // Locations
      if (Array.isArray(source.locations) && source.locations.length > 0) {
        setLocationSelected(new Set<string>(source.locations))
      }

      // Timeline (single value)
      const timelineValue = source.timeline || source.timelineSelected
      if (timelineValue) {
        setTimelineSelected(new Set<string>([timelineValue]))
      }

      // Budget range
      const minBudget =
        (source.budgetRange && typeof source.budgetRange.min === 'number' && source.budgetRange.min) ||
        (typeof source.budgetMin === 'number' && source.budgetMin) ||
        budgetRange.min
      const maxBudget =
        (source.budgetRange && typeof source.budgetRange.max === 'number' && source.budgetRange.max) ||
        (typeof source.budgetMax === 'number' && source.budgetMax) ||
        budgetRange.max

      if (minBudget && maxBudget && maxBudget > minBudget) {
        setBudgetRange({ min: minBudget, max: maxBudget })
      }
    } catch (e) {
      console.error('[BrandFilter] Failed to prefill from session/filter data', e)
    }
  }, [urlParamsProcessed])

  // Generate contextual AI insights based on selections
  useEffect(() => {
    const totalSelections =
      businessTypeSelected.size +
      sizeRangeSelected.size +
      locationSelected.size +
      timelineSelected.size +
      (budgetRange.min >= 50000 ? 1 : 0)

    if (totalSelections >= 2) {
      const businessType = Array.from(businessTypeSelected)[0]
      const primaryLocation = Array.from(locationSelected)[0]

      const contextual = getContextualInsight({
        userType: 'brand',
        businessType,
        location: primaryLocation,
        features: [],
      })

      setAiInsight(contextual)
      setShowAiInsight(true)

      // Hide after 3 seconds; progress bar already animates over 3s
      const timer = setTimeout(() => setShowAiInsight(false), 3000)
      return () => clearTimeout(timer)
    } else {
      setShowAiInsight(false)
    }
  }, [businessTypeSelected, sizeRangeSelected, locationSelected, timelineSelected, budgetRange])

  useEffect(() => {
    const handleScroll = () => {
      setShowApplyButton(window.scrollY > 200)
      scheduleBrandLog('scroll', {})
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

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-6 sm:mb-8 md:mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white/80 border border-white/20 rounded-lg sm:rounded-xl hover:border-[#FF5200]/50 hover:text-[#FF5200] transition-all duration-200 hover:shadow-md hover:shadow-[#FF5200]/20 backdrop-blur-sm bg-white/5"
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
          <div className="group relative w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 border-2 border-[#FF5200]/30 hover:border-[#FF5200] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#FF5200]/50">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>
            
            <div className="relative z-10 flex items-center gap-2 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#FF5200]/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF5200] flex-shrink-0 animate-pulse"></div>
                  <span className="text-[9px] sm:text-[10px] font-medium text-[#FF5200] uppercase tracking-wider">For Brands</span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-0.5">Find Your Ideal Space</h3>
                <p className="text-[10px] sm:text-xs text-gray-300 leading-snug line-clamp-1">AI-powered matching for commercial properties</p>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#FF5200]/20 border border-[#FF5200]/40 rounded-md sm:rounded-lg flex-shrink-0">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#FF5200]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-[11px] font-medium text-[#FF5200]">Instant</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Insight Banner */}
        <AnimatePresence>
          {showAiInsight && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 sm:mb-6 max-w-2xl mx-auto"
            >
              <div className="bg-gradient-to-r from-[#FF5200]/20 via-[#E4002B]/20 to-[#FF5200]/20 backdrop-blur-xl border border-[#FF5200]/40 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4 shadow-lg shadow-[#FF5200]/20">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white">{aiInsight}</p>
                  <div className="mt-1 h-0.5 sm:h-1 bg-gray-700/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#FF5200] to-[#E4002B]"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3, ease: 'linear' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Cards - Platform Performance Style */}
        <div className="grid gap-4 sm:gap-6 md:gap-8">
          <FilterCard 
            title="Business Type" 
            items={businessTypes} 
            index={0} 
            required 
            initialSelected={businessTypeSelected}
            initialOtherValue={businessTypeOtherValue}
            onSelectionChange={(set) => {
              setBusinessTypeSelected(set)
              scheduleBrandLog('filter_change', { filter_step: buildFilterStepPayload() })
            }}
          />
          <FilterCard 
            title="Size Range" 
            items={sizeRanges} 
          index={1} 
          required
          multi
          initialSelected={sizeRangeSelected}
          onSelectionChange={(set) => {
            setSizeRangeSelected(set)
            scheduleBrandLog('filter_change', { filter_step: buildFilterStepPayload() })
          }}
          />
          <LocationSelector
            title="Location (Popular Areas)"
            popularLocations={popularLocations}
            otherLocations={otherLocations}
            index={2}
            required
            initialSelected={locationSelected}
            onSelectionChange={(set) => {
              setLocationSelected(set)
              scheduleBrandLog('filter_change', { filter_step: buildFilterStepPayload() })
            }}
          />
          {/* Old FilterCard removed - using LocationSelector above */}
          <BudgetSlider 
            index={3} 
            required
            onBudgetChange={(budget) => {
              setBudgetRange(budget)
              scheduleBrandLog('filter_change', { filter_step: { ...buildFilterStepPayload(), budgetRange: budget } })
            }}
          />
          <FilterCard 
            title="Timeline" 
            items={timelines} 
            index={4} 
            required
            initialSelected={timelineSelected}
            onSelectionChange={(set) => {
              setTimelineSelected(set)
              scheduleBrandLog('filter_change', { filter_step: buildFilterStepPayload() })
            }}
          />
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
              className={`group relative px-5 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold overflow-hidden ${
                isFormValid
                  ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white shadow-[0_8px_24px_rgba(255,82,0,0.4)] cursor-pointer'
                  : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
              }`}
              style={{ fontFamily: plusJakarta.style.fontFamily }}
              whileHover={isFormValid ? { scale: 1.05, y: -2 } : {}}
              whileTap={isFormValid ? { scale: 0.95 } : {}}
              onClick={() => {
                if (!isFormValid) return

                // Save filters to localStorage
                const filterData = {
                  businessType: Array.from(businessTypeSelected),
                  sizeRanges: Array.from(sizeRangeSelected),
                  locations: Array.from(locationSelected),
                  budgetMin: budgetRange.min,
                  budgetMax: budgetRange.max,
                  timeline: Array.from(timelineSelected)[0] || '',
                }
                
                localStorage.setItem('brandFilterData', JSON.stringify(filterData))
                saveBrandSessionToLocalStorage()

                // Parse ALL selected size ranges for query params
                const sizeLabels = Array.from(sizeRangeSelected)
                let sizeMin = Number.MAX_SAFE_INTEGER
                let sizeMax = 0
                sizeLabels.forEach(label => {
                  if (label.includes('-')) {
                    const [minStr, maxStr] = label.split('-').map(v => v.trim())
                    const min = parseInt(minStr.replace(/[^0-9]/g, '')) || 0
                    const max = parseInt(maxStr.replace(/[^0-9]/g, '')) || 0
                    if (min > 0) sizeMin = Math.min(sizeMin, min)
                    if (max > 0) sizeMax = Math.max(sizeMax, max)
                  } else if (label.includes('+')) {
                    const min = parseInt(label.replace(/[^0-9]/g, '')) || 0
                    if (min > 0) {
                      sizeMin = Math.min(sizeMin, min)
                      sizeMax = Math.max(sizeMax, 2000000)
                    }
                  }
                })
                if (sizeMin === Number.MAX_SAFE_INTEGER) sizeMin = 0
                if (sizeMax === 0) sizeMax = 100000

                // Build query params
                const params = new URLSearchParams()
                params.set('businessType', Array.from(businessTypeSelected)[0] || '')
                params.set('sizeMin', sizeMin.toString())
                params.set('sizeMax', sizeMax.toString())
                params.set('locations', Array.from(locationSelected).join(','))
                params.set('budgetMin', budgetRange.min.toString())
                params.set('budgetMax', budgetRange.max.toString())
                if (Array.from(timelineSelected).length > 0) {
                  params.set('timeline', Array.from(timelineSelected)[0] || '')
                }

                // Navigate directly to property results page
                window.location.href = `/properties/results?${params.toString()}`
              }}
            >
              {isFormValid && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E4002B] to-[#FF5200] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 rounded-xl border-2 border-white/30 opacity-0 group-hover:opacity-100 animate-ping"></div>
                </>
              )}
              <span className="relative z-10 flex items-center gap-2">
                {isFormValid ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Find with AI
                  </>
                ) : (
                  'Complete All Fields'
                )}
                {isFormValid && (
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Glow Line */}
      <div className="relative z-10 mt-16 h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent opacity-50"></div>

    </div>
  )
}

export default function BrandFilterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
      </div>
    }>
      <BrandFilterPageContent />
    </Suspense>
  )
}

