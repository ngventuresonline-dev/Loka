'use client'

import { useState, useCallback, useRef } from 'react'
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
  { key: 'brand', label: 'Looking for Space' },
  { key: 'owner', label: 'Have Space to Rent' },
]

interface HeroSearchProps {
  onModeChange?: (mode: Mode) => void
}

export default function HeroSearch({ onModeChange }: HeroSearchProps = {}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('brand')
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const goToFilter = useCallback(() => {
    router.push(mode === 'brand' ? '/filter/brand' : '/filter/owner')
  }, [mode, router])

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode)
    onModeChange?.(newMode)
  }, [onModeChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      goToFilter()
    }
  }, [goToFilter])

  return (
    <div className={`${fraunces.variable} ${plusJakarta.variable} w-full flex flex-col items-center gap-6`}>
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
          className="group relative w-full flex items-center gap-2 sm:gap-4 bg-white rounded-2xl px-3 sm:px-6 py-3 sm:py-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_16px_rgba(0,0,0,0.1)] transition-all duration-300 backdrop-blur-sm"
          whileHover={{ y: -1 }}
        >
          {/* Search Icon - Homepage Colors */}
          <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-[#E4002B] to-[#FF5200] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'brand' 
              ? 'Find the perfect commercial space'
              : 'List your property and connect with tenants'}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:placeholder:text-gray-300 transition-colors duration-300 font-medium"
            style={{ fontFamily: plusJakarta.style.fontFamily }}
          />

          {/* Go to Filters Button - Homepage Colors */}
          <motion.button
            onClick={goToFilter}
            className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex-shrink-0 flex items-center gap-1 sm:gap-2"
            style={{ fontFamily: plusJakarta.style.fontFamily }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 4px 12px rgba(255, 82, 0, 0.3)',
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <span className="hidden sm:inline">
              {mode === 'brand' ? 'Find a property' : 'List your property'}
            </span>
            <span className="sm:hidden">
              {mode === 'brand' ? 'Find' : 'List'}
            </span>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className="flex flex-col items-center gap-3"
      >
        <div className="inline-flex items-center border border-gray-200 rounded-full p-1 bg-white shadow-sm">
          {modes.map((m) => {
            const active = m.key === mode
            return (
              <motion.button
                key={m.key}
                onClick={() => handleModeChange(m.key)}
                className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
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
                <span className="relative z-10">{m.label}</span>
              </motion.button>
            )
          })}
        </div>
        
        {/* Description Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={`text-xs sm:text-sm text-center max-w-md px-4 font-medium transition-colors duration-700 ${
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
