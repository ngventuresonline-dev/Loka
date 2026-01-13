'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { MapPin, Building2, Store, UtensilsCrossed } from 'lucide-react'
import { BuildingIcon } from './icons'
import Logo from '@/components/Logo'

const smoothTransition = {
  duration: 0.5,
  ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number]
}

const quickTransition = {
  duration: 0.4,
  ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number]
}

// Scene 1: Context (0-4s) - Real Lokazen Website Preview
export const BrandReqScene1Context = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-2 sm:p-4 relative overflow-hidden"
  >
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: 1.05 }}
      transition={{ duration: 3, ease: "easeInOut" }}
      className="h-full bg-gray-800 rounded-lg border border-gray-700 p-3 sm:p-6 overflow-hidden"
    >
      {/* Navbar */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Logo size="sm" showText={true} showPoweredBy={false} variant="dark" />
        <div className="flex gap-2 sm:gap-3">
          <div className="h-8 sm:h-10 w-16 sm:w-24 bg-gray-700 rounded-lg"></div>
          <div className="h-8 sm:h-10 w-16 sm:w-24 bg-gray-700 rounded-lg"></div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="mb-4 sm:mb-6">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-[#FF5200]/20 to-[#E4002B]/20 rounded-lg border border-[#FF5200]/30 mb-3 sm:mb-4"></div>
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1 h-10 sm:h-12 bg-gray-700 rounded-lg"></div>
          <div className="w-20 sm:w-32 h-10 sm:h-12 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-lg"></div>
        </div>
      </div>

      {/* Brand Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-900 rounded-lg p-2 sm:p-3 border border-gray-700">
            <div className="h-8 sm:h-12 bg-gray-800 rounded mb-2"></div>
            <div className="h-3 sm:h-4 bg-gray-800 rounded mb-1"></div>
            <div className="h-2 sm:h-3 bg-gray-800 rounded w-2/3"></div>
          </div>
        ))}
      </div>

      {/* Stats/Info Bar */}
      <div className="h-12 sm:h-16 bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center">
        <div className="text-xs sm:text-sm text-gray-400">Active listings • Real-time matching</div>
      </div>
    </motion.div>

    {/* Overlay Text */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, ...smoothTransition }}
      className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-gray-700"
    >
      <div className="text-xs sm:text-base text-gray-300 font-medium text-center whitespace-nowrap">
        Active brand requirements on Lokazen
      </div>
    </motion.div>
  </motion.div>
)

// Scene 2: Brand Requirements List with Requirements (4-14s)
export const BrandReqScene2BrandList = () => {
  const brands = [
    { 
      name: 'Mumbai Pav Co.', 
      logo: '/logos/Mumbai Pav Co.jpg',
      category: 'Café/QSR',
      size: '600-1,000 sqft',
      location: 'HSR Layout, Indiranagar, Kalyan Nagar',
      type: 'High-street, Ready-to-operate'
    },
    { 
      name: 'Truffles', 
      logo: '/logos/truffles logo.jpg',
      category: 'Casual Dining',
      size: '3,500-5,000 sqft',
      location: 'Whitefield, Rajajinagar, Rajarajeshwari Nagar',
      type: 'High-street, Ground floor'
    },
    { 
      name: 'Original Burger Co', 
      logo: '/logos/Original_Burger_Co_Logo.png',
      category: 'QSR',
      size: '800-2,000 sqft',
      location: 'MG Road, HSR Layout',
      type: 'High-street, F&B-ready'
    },
    { 
      name: 'Namaste', 
      logo: '/logos/Namaste logo.jpg',
      category: 'South Indian Restaurant',
      size: '2,000-3,000 sqft',
      location: 'Kanakapura Rd, Marathahalli, Whitefield and other areas',
      type: 'High-street, Ground floor'
    },
    { 
      name: 'Sandowitch', 
      logo: '/logos/Sandowitch logo.jpg',
      category: 'QSR',
      size: '500-1,000 sqft',
      location: 'Koramangala, Kalyan Nagar, New BEL Road',
      type: 'High-street, F&B-ready'
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={quickTransition}
      className="w-full h-full bg-gray-900 p-2 sm:p-4"
    >
      <div className="h-full flex flex-col max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...smoothTransition }}
          className="text-sm sm:text-base text-gray-300 font-medium text-center mb-3 sm:mb-4"
        >
          Brands currently looking for spaces
        </motion.div>

        <div className="flex-1 space-y-2 sm:space-y-3 overflow-y-auto pr-1">
          {brands.map((brand, index) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.25, ...smoothTransition }}
              className="bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="relative w-10 h-10 sm:w-12 sm:h-14 rounded-lg overflow-hidden bg-gray-900 flex-shrink-0">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-contain p-0.5 sm:p-1"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white truncate">
                        {brand.name}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-400">
                        {brand.category}
                      </div>
                    </div>
                    <div className="px-1.5 sm:px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-[10px] sm:text-xs text-green-400 font-medium whitespace-nowrap">
                      Active
                    </div>
                  </div>
                  
                  {/* Requirements Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#FF5200]/20 rounded flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#FF5200]" />
                      </div>
                      <div className="text-[9px] sm:text-xs text-gray-400 truncate">{brand.size}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#E4002B]/20 rounded flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#E4002B]" />
                      </div>
                      <div className="text-[9px] sm:text-xs text-gray-400 truncate">{brand.location}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#FF5200]/20 rounded flex items-center justify-center flex-shrink-0">
                        <UtensilsCrossed className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#FF5200]" />
                      </div>
                      <div className="text-[9px] sm:text-xs text-gray-400 truncate">{brand.type}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Scene 3: What They're Looking For (14-20s)
export const BrandReqScene3Requirements = () => {
  const requirements = [
    { icon: MapPin, label: 'High-street locations', color: '#FF5200' },
    { icon: Building2, label: 'Ground floor', color: '#E4002B' },
    { icon: Store, label: 'Strong frontage', color: '#FF5200' },
    { icon: UtensilsCrossed, label: 'F&B-ready spaces', color: '#E4002B' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={quickTransition}
      className="w-full h-full bg-gray-900 p-4 sm:p-8"
    >
      <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...smoothTransition }}
          className="text-sm sm:text-base text-gray-400 font-medium text-center mb-2"
        >
          What They're Looking For
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ...smoothTransition }}
          className="text-base sm:text-lg text-gray-300 font-medium text-center mb-6 sm:mb-8"
        >
          High-street, ready-to-operate locations
        </motion.div>

        <div className="grid grid-cols-2 gap-4 w-full">
          {requirements.map((req, index) => {
            const IconComponent = req.icon
            return (
              <motion.div
                key={req.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.2, ...smoothTransition }}
                className="bg-gray-800 rounded-lg p-4 sm:p-5 border border-gray-700 flex items-center gap-3"
              >
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${req.color}20` }}
                >
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: req.color }} />
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-300">
                  {req.label}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Brand cards fade in background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.5, ...smoothTransition }}
          className="mt-6 sm:mt-8 grid grid-cols-5 gap-1.5 sm:gap-2 w-full"
        >
          {['Mumbai Pav Co.', 'Truffles', 'Original Burger Co.', 'Namaste', 'Sandowitch'].map((name, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-1.5 sm:p-2 border border-gray-700">
              <div className="text-[10px] sm:text-xs text-gray-500 text-center truncate">{name}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

// Scene 4: Call to Property Owners (20-26s)
export const BrandReqScene4CallToAction = () => {
  const requiredSizes = [
    '500-1,000 sqft',
    '1,000-2,000 sqft',
    '2,000-3,000 sqft',
    '3,500-5,000 sqft'
  ]

  const requiredLocations = [
    'HSR Layout',
    'Indiranagar',
    'Koramangala',
    'Kalyan Nagar',
    'Whitefield',
    'MG Road',
    'Marathahalli',
    'Rajajinagar',
    'Rajarajeshwari Nagar',
    'Kanakapura Rd',
    'New BEL Road'
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={quickTransition}
      className="w-full h-full bg-gray-900 p-2 sm:p-4"
    >
      <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...smoothTransition }}
          className="text-sm sm:text-base text-gray-300 font-medium text-center mb-3 sm:mb-4"
        >
          Have a matching property?
        </motion.div>

        {/* Property card preview entering */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, ...smoothTransition }}
          className="w-full bg-gray-800 rounded-xl p-3 sm:p-5 border-2 border-[#FF5200] shadow-xl shadow-[#FF5200]/20"
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center flex-shrink-0">
              <BuildingIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white">Your Property</div>
              <div className="text-[10px] sm:text-xs text-gray-400">High street • Ready to list</div>
            </div>
          </div>
          
          {/* Required Sizes */}
          <div className="mb-3 sm:mb-4">
            <div className="text-[10px] sm:text-xs text-gray-300 mb-2 font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF5200]" />
              Sizes Required:
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {requiredSizes.map((size, index) => (
                <motion.div
                  key={size}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1, ...smoothTransition }}
                  className="bg-gray-900 rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 border border-gray-700"
                >
                  <div className="text-[10px] sm:text-xs font-semibold text-gray-300">{size}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Required Locations */}
          <div className="mb-3 sm:mb-4">
            <div className="text-[10px] sm:text-xs text-gray-300 mb-2 font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E4002B]" />
              Locations Required:
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {requiredLocations.map((location, index) => (
                <motion.div
                  key={location}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0 + index * 0.08, ...smoothTransition }}
                  className="bg-gray-900 rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 border border-gray-700 flex items-center gap-1"
                >
                  <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FF5200] flex-shrink-0" />
                  <div className="text-[10px] sm:text-xs font-semibold text-gray-300">{location}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, ...smoothTransition }}
            className="pt-3 border-t border-gray-700"
          >
            <div className="text-[10px] sm:text-xs text-gray-500 text-center">
              Property card ready to enter matching system
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Scene 5: CTA / Close (26-30s)
export const BrandReqScene5CTA = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-3 sm:p-6 flex flex-col items-center justify-center"
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, ...smoothTransition }}
      className="text-center max-w-md w-full"
    >
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, ...smoothTransition }}
        className="w-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-semibold shadow-lg shadow-[#FF5200]/30 mb-4 sm:mb-6"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        List My Property
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, ...smoothTransition }}
        className="text-sm sm:text-base text-gray-300 font-medium"
      >
        List your property on Lokazen
      </motion.div>
    </motion.div>
  </motion.div>
)

// Scene 6: Logo Zoom-In (30-34s) - Added after CTA
export const BrandReqScene6LogoZoom = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 flex items-center justify-center relative overflow-hidden"
  >
    {/* Background fade */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
    />
    
    {/* Logo with zoom animation */}
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.2, opacity: 0 }}
      transition={{ 
        duration: 1.5, 
        ease: [0.43, 0.13, 0.23, 0.96],
        delay: 0.2
      }}
      className="relative z-10"
    >
      <Logo size="lg" showText={true} showPoweredBy={true} variant="dark" />
    </motion.div>

    {/* Glow effect */}
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 2, opacity: [0, 0.3, 0] }}
      transition={{ 
        duration: 1.5,
        delay: 0.5,
        ease: "easeOut"
      }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="w-64 h-64 bg-gradient-to-br from-[#FF5200]/30 to-[#E4002B]/30 rounded-full blur-3xl" />
    </motion.div>
  </motion.div>
)

