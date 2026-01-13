'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import Image from 'next/image'
import { 
  BuildingIcon, UsersIcon, 
  MapPinIcon, FileTextIcon, CheckCircleIcon
} from './icons'
import { ArrowRight } from 'lucide-react'

const smoothTransition = {
  duration: 0.5,
  ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number]
}

const quickTransition = {
  duration: 0.4,
  ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number]
}

// ============ BRAND ONBOARDING EXPLAINER ============

// Scene 1: Entry (0-4s)
export const BrandScene1Entry = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex flex-col items-center justify-center"
  >
    <motion.div
      initial={{ scale: 1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, ...smoothTransition }}
      className="mb-6 sm:mb-8 flex justify-center"
    >
      <Logo size="lg" showText={true} showPoweredBy={false} variant="dark" />
    </motion.div>
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, ...smoothTransition }}
      className="text-lg sm:text-xl text-gray-300 text-center font-medium"
    >
      Looking for the right space?
    </motion.div>
  </motion.div>
)

// Scene 2: Start Brand Flow (4-8s)
export const BrandScene2Start = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex flex-col items-center justify-center"
  >
    <motion.button
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={smoothTransition}
      className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-semibold shadow-lg mb-4"
    >
      Find Property for My Brand
    </motion.button>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, ...smoothTransition }}
      className="text-sm sm:text-base text-gray-400 text-center"
    >
      Start with your brand.
    </motion.div>
  </motion.div>
)

// Scene 3: Brand Details & Locations (8-16s)
export const BrandScene3DetailsAndLocations = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
        <div className="text-sm sm:text-base font-semibold text-white mb-4 flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-[#FF5200]" />
          Brand Details & Locations
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Category', value: 'Café', delay: 0 },
            { label: 'Size', value: '800–1200 sq ft', delay: 0.1 },
            { label: 'Budget', value: '₹200–300/sq ft', delay: 0.2 },
          ].map((field, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: field.delay, ...quickTransition }}
              className="bg-gray-900 rounded-lg p-3 border border-gray-700"
            >
              <div className="text-xs text-gray-400 mb-1">{field.label}</div>
              <div className="text-xs text-gray-300 font-semibold">{field.value}</div>
            </motion.div>
          ))}
        </div>
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Locations</div>
          <div className="flex flex-wrap gap-2">
            {['Indiranagar', 'Whitefield', 'Koramangala'].map((loc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1, ...quickTransition }}
                className="bg-[#FF5200]/20 border border-[#FF5200]/40 text-[#FF5200] px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                {loc}
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, ...smoothTransition }}
          className="text-xs sm:text-sm text-gray-500 text-center pt-3 border-t border-gray-700"
        >
          Define your requirements and location preferences.
        </motion.div>
      </div>
    </div>
  </motion.div>
)

// Scene 4: Profile Ready (16-22s)
export const BrandScene4Profile = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex flex-col items-center justify-center"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={smoothTransition}
      className="max-w-md w-full bg-gray-800 rounded-xl p-4 sm:p-6 border-2 border-[#FF5200] shadow-xl shadow-[#FF5200]/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white p-1.5 shadow-lg">
            <img 
              src="/logos/Mumbai Pav Co.jpg" 
              alt="MPC Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Mumbai Pav Co.</div>
            <div className="text-xs text-gray-400">Café/QSR • Indiranagar, Whitefield, Koramangala</div>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <CheckCircleIcon className="w-6 h-6 text-[#FF5200]" />
        </motion.div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="text-xs text-gray-400">Size: 800–1200 sq ft</div>
        <div className="text-xs text-gray-400">Budget: ₹200–300/sq ft</div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, ...smoothTransition }}
        className="text-xs sm:text-sm text-gray-500 text-center pt-3 border-t border-gray-700"
      >
        Your brand profile is ready.
      </motion.div>
    </motion.div>
  </motion.div>
)

// Scene 5: Matching Begins (22-25s)
export const BrandScene5Matching = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex flex-col items-center justify-center"
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={smoothTransition}
      className="text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-[#FF5200] border-t-transparent rounded-full mx-auto mb-4"
      />
      <div className="text-base sm:text-lg font-semibold text-white mb-2">
        Matching begins instantly.
      </div>
      <div className="text-xs sm:text-sm text-gray-400">
        Analyzing locations, footfall, and compatibility...
      </div>
    </motion.div>
  </motion.div>
)

// Scene 6: Matched Properties & Schedule Visit (25-30s)
export const BrandScene6MatchesAndExpert = () => {
  const properties = [
    { name: 'Indiranagar Property', location: 'Indiranagar', size: '1,000 sq ft', score: '92%' },
    { name: 'Koramangala Property', location: 'Koramangala', size: '950 sq ft', score: '88%' },
    { name: 'Whitefield Property', location: 'Whitefield', size: '1,100 sq ft', score: '85%' },
  ]

  const [showDetails, setShowDetails] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [showLogo, setShowLogo] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={quickTransition}
      className="w-full h-full bg-gray-900 p-4 sm:p-8 relative"
    >
      {!showLogo ? (
        <div className="h-full flex flex-col">
          <div className="text-sm sm:text-base font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-[#FF5200]" />
            Matched Properties
          </div>
          <div className="flex-1 bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-700 overflow-y-auto relative">
            <div className="space-y-2">
              {properties.map((prop, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, ...quickTransition }}
                  className={`bg-gray-900 rounded-lg p-3 border ${
                    i === 0 && showDetails ? 'border-[#FF5200]' : 'border-gray-700'
                  } relative`}
                  id={i === 0 ? 'property-card' : undefined}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs sm:text-sm font-semibold text-white">{prop.name}</div>
                    <div className="text-xs bg-[#FF5200]/20 text-[#FF5200] px-2 py-0.5 rounded font-semibold">
                      {prop.score}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{prop.location} • {prop.size}</div>
                  {/* Property Details - shown after click */}
                  {i === 0 && showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={smoothTransition}
                      className="mt-3 pt-3 border-t border-gray-700 space-y-2"
                    >
                      <div className="text-xs text-gray-300">High street • ₹250/sq ft</div>
                      <div className="text-xs text-gray-400">Perfect location match • Budget aligned</div>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, ...smoothTransition }}
                        id="schedule-visit-btn"
                        className="w-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg mt-2"
                        onClick={() => {
                          setShowSchedule(true)
                          setTimeout(() => setShowLogo(true), 500)
                        }}
                      >
                        Schedule Visit
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
            {/* Cursor animation - moves to first property and clicks */}
            {!showDetails && (
              <motion.div
                className="absolute w-4 h-4 pointer-events-none z-20"
                style={{ top: '15%', left: '50%' }}
                initial={{ x: '-200%', y: '-100%', opacity: 0 }}
                animate={{
                  x: [0, 0, -10, -10],
                  y: [0, 0, -10, -10],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  times: [0, 0.3, 0.7, 1],
                  delay: 0.5,
                }}
                onAnimationComplete={() => setShowDetails(true)}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>
              </motion.div>
            )}
            {/* Cursor animation - moves to Schedule Visit button and clicks */}
            {showDetails && !showSchedule && (
              <motion.div
                className="absolute w-4 h-4 pointer-events-none z-20"
                style={{ top: '35%', left: '50%' }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: [0, 0, -5, -5],
                  y: [0, 0, 5, 5],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  times: [0, 0.3, 0.7, 1],
                  delay: 0.5,
                }}
                onAnimationComplete={() => {
                  setShowSchedule(true)
                  setTimeout(() => setShowLogo(true), 300)
                }}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="w-full h-full flex items-center justify-center"
        >
          <Logo size="lg" showText={true} showPoweredBy={false} variant="dark" />
        </motion.div>
      )}
    </motion.div>
  )
}

// ============ PROPERTY ONBOARDING EXPLAINER ============

// Scene 1: Entry (0-4s)
export const PropertyScene1Entry = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex flex-col items-center justify-center"
  >
    <motion.div
      initial={{ scale: 1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, ...smoothTransition }}
      className="mb-6 sm:mb-8 flex justify-center"
    >
      <Logo size="lg" showText={true} showPoweredBy={false} variant="dark" />
    </motion.div>
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, ...smoothTransition }}
      className="text-lg sm:text-xl text-gray-300 text-center font-medium"
    >
      Have a space to lease?
    </motion.div>
  </motion.div>
)

// Scene 2: Start Property Flow (4-8s)
export const PropertyScene2Start = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex flex-col items-center justify-center"
  >
    <motion.button
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={smoothTransition}
      className="bg-gray-800 border-2 border-gray-700 hover:border-[#FF5200] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-semibold shadow-lg mb-4 transition-colors"
    >
      List My Property
    </motion.button>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, ...smoothTransition }}
      className="text-sm sm:text-base text-gray-400 text-center"
    >
      List your property.
    </motion.div>
  </motion.div>
)

// Scene 3: Property Details (8-14s)
export const PropertyScene3Details = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
        <div className="text-sm sm:text-base font-semibold text-white mb-4 flex items-center gap-2">
          <BuildingIcon className="w-5 h-5 text-[#FF5200]" />
          Property Details
        </div>
        <div className="space-y-3">
          {[
            { label: 'Property type', value: 'High street', delay: 0 },
            { label: 'Size', value: '1,000 sq ft', delay: 0.2 },
            { label: 'Rent', value: '₹250 / sq ft', delay: 0.4 },
          ].map((field, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: field.delay, ...quickTransition }}
              className="bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-700 flex justify-between items-center"
            >
              <div className="text-xs sm:text-sm text-gray-400">{field.label}</div>
              <div className="text-xs sm:text-sm text-gray-300 font-semibold">{field.value}</div>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, ...smoothTransition }}
          className="mt-4 text-xs sm:text-sm text-gray-500 text-center"
        >
          Share your property details.
        </motion.div>
      </div>
    </div>
  </motion.div>
)

// Scene 4: Location Pinning (14-20s)
export const PropertyScene4Location = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="h-full flex flex-col">
      <div className="text-xs sm:text-sm text-gray-500 text-center mb-3">
        Pin the exact location.
      </div>
      <div className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col">
        <div className="flex-1 bg-gray-900 rounded-lg relative overflow-hidden">
          {/* Map background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'linear-gradient(to right, #FF5200 1px, transparent 1px), linear-gradient(to bottom, #FF5200 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />
          
          {/* Location pin */}
          <motion.div
            initial={{ scale: 0, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-lg">
              <MapPinIcon className="w-6 h-6 text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 border-2 border-[#FF5200] rounded-full"
            />
          </motion.div>
          
          {/* Location label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, ...smoothTransition }}
            className="absolute bottom-1/4 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700"
          >
            <div className="text-sm font-semibold text-white">Koramangala</div>
            <div className="text-xs text-gray-400">Area confirmed</div>
          </motion.div>
        </div>
      </div>
    </div>
  </motion.div>
)

// Scene 5: Property Profile Ready (20-26s)
export const PropertyScene5Profile = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex flex-col items-center justify-center"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={smoothTransition}
      className="max-w-md w-full bg-gray-800 rounded-xl p-4 sm:p-6 border-2 border-[#FF5200] shadow-xl shadow-[#FF5200]/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center">
            <BuildingIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Koramangala Property</div>
            <div className="text-xs text-gray-400">High street • 1,000 sq ft</div>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <CheckCircleIcon className="w-6 h-6 text-[#FF5200]" />
        </motion.div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="text-xs text-gray-400">Size: 1,000 sq ft</div>
        <div className="text-xs text-gray-400">Rent: ₹250/sq ft</div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, ...smoothTransition }}
        className="text-xs sm:text-sm text-gray-500 text-center pt-3 border-t border-gray-700"
      >
        Your property profile is live.
      </motion.div>
    </motion.div>
  </motion.div>
)

// Scene 6: Ready for Matches & Connect (26-30s)
export const PropertyScene6Matches = () => {
  const brands = [
    { name: 'Blue Tokai', logo: '/logos/Blue Tokai.jpg' },
    { name: 'Namaste', logo: '/logos/Namaste logo.jpg' },
    { name: 'Truffles', logo: '/logos/truffles logo.jpg' },
    { name: 'Original Burger Co', logo: '/logos/Original_Burger_Co_Logo.png' },
    { name: 'Blr Brewing Co', logo: '/logos/blr brewing co logo.png' },
  ]

  const [showLogo, setShowLogo] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={quickTransition}
      className="w-full h-full bg-gray-900 p-4 sm:p-8 relative"
    >
      {!showLogo ? (
        <div className="h-full flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={smoothTransition}
            className="text-center max-w-md w-full"
          >
            <div className="text-base sm:text-lg font-semibold text-white mb-3">
              Verified Brands Start matching.
            </div>
            <div className="flex flex-wrap gap-3 justify-center items-center mb-4">
              {brands.map((brand, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, ...quickTransition }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center overflow-hidden bg-white p-1.5 shadow-lg border border-gray-200"
                >
                  <img 
                    src={brand.logo} 
                    alt={`${brand.name} Logo`}
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              ))}
            </div>
            <div className="text-xs sm:text-sm text-gray-400 mb-4">
              Your property is now discoverable by compatible brands.
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, ...smoothTransition }}
              className="relative"
            >
              <motion.button
                id="property-connect-btn"
                className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg"
              >
                Connect
              </motion.button>
              {/* Cursor animation */}
              <motion.div
                className="absolute w-4 h-4 pointer-events-none z-10"
                initial={{ x: '20%', y: '20%', opacity: 0 }}
                animate={{
                  x: ['20%', '50%', '50%'],
                  y: ['20%', '50%', '50%'],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 2.5,
                  times: [0, 0.5, 0.8, 1],
                  delay: 1.2,
                }}
                onAnimationComplete={() => setShowLogo(true)}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-full h-full flex items-center justify-center"
        >
          <Logo size="lg" showText={true} showPoweredBy={false} variant="dark" />
        </motion.div>
      )}
    </motion.div>
  )
}

