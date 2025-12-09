'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-fraunces',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-plusjakarta',
})

export type Mode = 'brand' | 'owner'

const modes: { key: Mode; label: string }[] = [
  { key: 'brand', label: 'Brand - Looking For Space' },
  { key: 'owner', label: 'List Property' },
]

const brandPlaceholders = [
  "Looking for 800 sqft cafe space in Indiranagar",
  "Need 1500 sqft restaurant space in Koramangala",
  "5000 sqft brewery space with parking in Whitefield",
  "Small cloud kitchen 300-500 sqft needed",
  "Fine dining space 2500 sqft on MG Road",
  "QSR outlet 600 sqft in HSR Layout",
  "Bakery space with kitchen setup in Jayanagar",
  "Food court unit 400 sqft in tech park",
  "Bar space with terrace in Indiranagar",
  "Coffee shop 500 sqft corner unit needed"
]

interface HeroSearchProps {
  onModeChange?: (mode: Mode) => void
}

export default function HeroSearch({ onModeChange }: HeroSearchProps = {}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('brand')
  const [searchQuery, setSearchQuery] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('')
  const [isTypingPlaceholder, setIsTypingPlaceholder] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const goToFilter = useCallback(() => {
    try {
      const path = mode === 'brand' ? '/filter/brand' : '/filter/owner'
      router.push(path)
    } catch (error) {
      console.error('Navigation error:', error)
      // Fallback to window.location if router fails
      const path = mode === 'brand' ? '/filter/brand' : '/filter/owner'
      window.location.href = path
    }
  }, [mode, router])

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode)
    onModeChange?.(newMode)
    
    // If owner mode is selected, navigate directly to filter page
    if (newMode === 'owner') {
      try {
        router.push('/filter/owner')
      } catch (error) {
        console.error('Navigation error:', error)
        window.location.href = '/filter/owner'
      }
    }
  }, [onModeChange, router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      goToFilter()
    }
  }, [goToFilter])

  // Typing effect for placeholder text
  useEffect(() => {
    if (mode !== 'brand' || isTyping || searchQuery.length > 0) {
      setDisplayedPlaceholder('')
      setIsTypingPlaceholder(false)
      return
    }

    const currentPlaceholder = brandPlaceholders[placeholderIndex]
    setDisplayedPlaceholder('')
    setIsTypingPlaceholder(true)

    let currentIndex = 0
    const typingInterval = setInterval(() => {
      if (currentIndex < currentPlaceholder.length) {
        setDisplayedPlaceholder(currentPlaceholder.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsTypingPlaceholder(false)
        clearInterval(typingInterval)
        
        // After typing completes, wait a bit then rotate to next placeholder
        const fullPlaceholder = brandPlaceholders[placeholderIndex]
        const typingTime = fullPlaceholder.length * 50 // Time to type out current placeholder
        const displayTime = Math.max(2000, 3000 - typingTime) // At least 2 seconds display time
        
        setTimeout(() => {
          if (mode === 'brand' && !isTyping && searchQuery.length === 0) {
            setPlaceholderIndex((prevIndex) => (prevIndex + 1) % brandPlaceholders.length)
          }
        }, displayTime)
      }
    }, 50) // Typing speed: 50ms per character

    return () => clearInterval(typingInterval)
  }, [placeholderIndex, mode, isTyping, searchQuery])

  // Reset placeholder index when mode changes
  useEffect(() => {
    setPlaceholderIndex(0)
    setDisplayedPlaceholder('')
  }, [mode])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setIsTyping(e.target.value.length > 0)
  }, [])

  const handleInputFocus = useCallback(() => {
    setIsTyping(true)
  }, [])

  const handleInputBlur = useCallback(() => {
    setIsTyping(searchQuery.length > 0)
  }, [searchQuery])

  return (
    <div className={`${fraunces.variable} ${plusJakarta.variable} w-full flex flex-col items-center gap-4 sm:gap-5`}>
      {/* Search Bar - Clean and Sleek with Rotating Gradient Border */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-5xl relative p-[2px] rounded-2xl"
        style={{
          background: 'linear-gradient(90deg, #FF5200, #E4002B, #FF6B35, #FF5200)',
          backgroundSize: '200% 200%',
          animation: 'gradientRotate 3s linear infinite',
          boxShadow: '0 0 15px rgba(228, 0, 43, 0.12), 0 0 30px rgba(255, 82, 0, 0.08), 0 0 0 0.1px rgba(228, 0, 43, 0.2)',
        }}
      >
        <motion.div
          className="group relative w-full flex items-center gap-2 sm:gap-4 bg-white rounded-xl sm:rounded-2xl px-2.5 sm:px-6 py-2.5 sm:py-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_16px_rgba(0,0,0,0.1)] transition-all duration-300 backdrop-blur-sm"
          whileHover={{ y: -1 }}
        >
          {/* Search Icon - Homepage Colors */}
          <div className="w-7 h-7 sm:w-11 sm:h-11 bg-gradient-to-br from-[#E4002B] to-[#FF5200] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
            <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Search Input */}
          <div className="flex-1 min-w-0 relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder=" "
              className="w-full bg-transparent border-none outline-none text-sm sm:text-base md:text-lg text-gray-900 transition-all duration-300 font-medium relative z-10"
              style={{ fontFamily: plusJakarta.style.fontFamily }}
            />
            {mode === 'brand' && !isTyping && searchQuery.length === 0 && (
              <div className="absolute left-0 top-0 w-full h-full flex items-center pointer-events-none text-sm sm:text-base md:text-lg text-gray-400 font-medium overflow-hidden">
                <span className="truncate" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  {displayedPlaceholder}
                  {isTypingPlaceholder && (
                    <span className="inline-block w-0.5 h-3 sm:h-4 bg-[#FF5200] ml-1 animate-pulse" />
                  )}
                </span>
              </div>
            )}
            {mode === 'owner' && searchQuery.length === 0 && (
              <div className="absolute left-0 top-0 w-full h-full flex items-center pointer-events-none text-sm sm:text-base md:text-lg text-gray-400 font-medium overflow-hidden">
                <span className="truncate">List your property and connect with tenants</span>
              </div>
            )}
          </div>

          {/* Go to Filters Button - Homepage Colors */}
          <motion.button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              goToFilter()
            }}
            type="button"
            className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base font-semibold shadow-sm flex-shrink-0 flex items-center gap-1 sm:gap-2"
            style={{ fontFamily: plusJakarta.style.fontFamily }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 4px 12px rgba(255, 82, 0, 0.3)',
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <span className="hidden sm:inline flex items-center gap-2">
              {mode === 'brand' ? 'Find a property' : (
                <>
                  List your property
                  <span className="px-2 py-0.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white text-[10px] font-bold rounded-full border border-white/20">
                    Instant
                  </span>
                </>
              )}
            </span>
            <span className="sm:hidden flex items-center gap-1">
              {mode === 'brand' ? 'Find' : 'List'}
            </span>
            <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Toggle - Below Search Bar with Border */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
        className="flex flex-col items-center gap-2 sm:gap-2.5"
      >
        <div className="inline-flex items-center border border-gray-200 rounded-full p-0.5 sm:p-1 bg-white shadow-sm w-full max-w-md sm:max-w-none">
          {modes.map((m) => {
            const active = m.key === mode
            return (
              <motion.button
                key={m.key}
                onClick={() => handleModeChange(m.key)}
                className={`relative flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 ${
                  active
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900 bg-transparent'
                }`}
                style={{ fontFamily: plusJakarta.style.fontFamily }}
                whileHover={{ scale: active ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-pressed={active}
              >
                {active && (
                  <motion.div
                    layoutId="activeToggle"
                    className="absolute inset-0 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full z-0"
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 justify-center flex-wrap sm:flex-nowrap">
                  {m.key === 'owner' ? (
                    <>
                      <span className="whitespace-nowrap">List Property</span>
                      <span 
                        className="px-2 sm:px-2.5 py-0.5 sm:py-1 relative overflow-hidden text-white text-[10px] sm:text-xs font-bold rounded-full border border-red-500/70 flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
                        style={{
                          background: 'linear-gradient(90deg, rgba(244, 114, 182, 1), rgba(236, 72, 153, 1), rgba(244, 114, 182, 1), rgba(251, 113, 133, 1), rgba(244, 114, 182, 1))',
                          backgroundSize: '300% 100%',
                          animation: 'gradientShift 2s ease-in-out infinite',
                          boxShadow: '0 0 8px rgba(236, 72, 153, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                          <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="whitespace-nowrap z-10">Instant</span>
                        {/* Shine overlay */}
                        <span 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full pointer-events-none"
                          style={{
                            animation: 'shine 2.5s ease-in-out infinite',
                          }}
                        />
                      </span>
                    </>
                  ) : (
                    <span className="whitespace-nowrap">{m.label}</span>
                  )}
                </span>
              </motion.button>
            )
          })}
        </div>
        
        {/* Description Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={`text-xs sm:text-sm md:text-base text-center max-w-md px-2 sm:px-4 font-medium transition-colors duration-700 ${
            mode === 'owner' 
              ? 'text-white' 
              : 'text-gray-700'
          }`}
          style={{ fontFamily: plusJakarta.style.fontFamily }}
        >
          {mode === 'brand' 
            ? 'Select preferences and click to browse spaces'
            : 'Fill in details and click to list your property'}
        </motion.p>
      </motion.div>
    </div>
  )
}
