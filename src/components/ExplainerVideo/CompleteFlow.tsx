'use client'

import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import { 
  BuildingIcon, UsersIcon, 
  ZapIcon, CheckCircleIcon, MapPinIcon,
  BarChartIcon, FileTextIcon
} from './icons'
import { MessageCircle, ArrowRight } from 'lucide-react'

const smoothTransition = {
  duration: 0.6,
  ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number]
}

const quickTransition = {
  duration: 0.4,
  ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number]
}

// Scene 1: Homepage Hero (0-5s)
export const Scene1Homepage = () => (
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
      className="mb-6 sm:mb-8 flex justify-center"
    >
      <Logo size="lg" showText={true} showPoweredBy={false} variant="dark" />
    </motion.div>
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, ...smoothTransition }}
      className="flex flex-col sm:flex-row gap-3 sm:gap-4"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-lg"
      >
        Find Property for My Brand
      </motion.button>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-gray-800 border border-gray-700 text-gray-300 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
      >
        List My Property
      </motion.button>
    </motion.div>
  </motion.div>
)

// Scene 2: Brand Onboarding (5-11s)
export const Scene2Onboarding = () => (
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
          Brand Onboarding
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Brand Type', value: 'Café', icon: FileTextIcon },
            { label: 'Size', value: '800–1200 sq ft', icon: BarChartIcon },
            { label: 'Budget', value: '₹200–300/sq ft', icon: BarChartIcon },
            { label: 'Location', value: 'Indiranagar', icon: MapPinIcon },
          ].map((field, i) => {
            const Icon = field.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 * i, ...quickTransition }}
                className="bg-gray-900 rounded-lg p-3 border border-gray-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#FF5200]" />
                  <div className="text-xs text-gray-400">{field.label}</div>
                </div>
                <div className="text-xs text-gray-300 font-medium">{field.value}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  </motion.div>
)

// Scene 3: AI Analysis (11-17s)
export const Scene3Analysis = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="h-full flex flex-col">
      <div className="text-sm sm:text-base font-semibold text-white mb-3 flex items-center gap-2">
        <ZapIcon className="w-5 h-5 text-[#FF5200]" />
        AI Analysis in Progress
      </div>
      <div className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col">
        <div className="flex-1 bg-gray-900 rounded-lg relative overflow-hidden mb-3">
          {/* Map background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'linear-gradient(to right, #FF5200 1px, transparent 1px), linear-gradient(to bottom, #FF5200 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
          
          {/* Location pin */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-lg">
              <MapPinIcon className="w-6 h-6 text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 border-2 border-[#FF5200] rounded-full"
            />
          </motion.div>
          
          {/* Footfall heatmap */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-[#FF5200]/30 to-[#E4002B]/30 rounded-full"
          />
        </div>
        <div className="flex gap-3 justify-center">
          {['Footfall Data', 'Competitors', 'Demographics'].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.2, ...quickTransition }}
              className="text-xs text-gray-400"
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
)

// Scene 4: Top 5 Matches Dashboard (17-25s)
export const Scene4Matches = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-3xl mx-auto h-full flex flex-col justify-center">
      <div className="text-sm sm:text-base font-semibold text-white mb-4">Top 5 Matches</div>
      <div className="space-y-2">
        {[
          { name: 'Property Alpha', bfi: 94, pfi: 91, location: 'Indiranagar' },
          { name: 'Property Beta', bfi: 88, pfi: 89, location: 'Koramangala' },
          { name: 'Property Gamma', bfi: 85, pfi: 87, location: 'HSR' },
        ].map((match, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 * i, ...quickTransition }}
            className={`bg-gray-800 rounded-xl p-3 sm:p-4 border-2 ${
              i === 0 ? 'border-[#FF5200] shadow-lg shadow-[#FF5200]/20' : 'border-gray-700'
            } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
          >
            <div className="flex-1">
              <div className="text-sm font-semibold text-white mb-1">{match.name}</div>
              <div className="text-xs text-gray-400">{match.location}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs bg-[#FF5200]/20 text-[#FF5200] px-2 py-1 rounded font-semibold">
                BFI {match.bfi}%
              </div>
              <div className="text-xs bg-[#E4002B]/20 text-[#E4002B] px-2 py-1 rounded font-semibold">
                PFI {match.pfi}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
)

// Scene 5: Connect CTA (25-30s)
export const Scene5Connect = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex flex-col items-center justify-center"
  >
    <div className="max-w-md mx-auto w-full">
      {/* Top match highlighted */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={smoothTransition}
        className="bg-gray-800 rounded-xl p-4 sm:p-6 border-2 border-[#FF5200] shadow-xl shadow-[#FF5200]/30 mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-base font-bold text-white mb-1">Property Alpha</div>
            <div className="text-xs text-gray-400">Indiranagar • 1000 sq ft</div>
          </div>
          <div className="flex gap-2">
            <div className="text-sm bg-[#FF5200]/20 text-[#FF5200] px-3 py-1.5 rounded font-bold">
              BFI 94%
            </div>
            <div className="text-sm bg-[#E4002B]/20 text-[#E4002B] px-3 py-1.5 rounded font-bold">
              PFI 91%
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-3 rounded-lg text-sm font-bold shadow-lg flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          Connect Now
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
      
      {/* Final message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...smoothTransition }}
        className="text-center"
      >
        <div className="text-base sm:text-lg font-semibold text-white mb-2">
          Right brand. Right location.
        </div>
        <div className="text-xs sm:text-sm text-gray-400">
          AI-powered matchmaking for commercial real estate
        </div>
      </motion.div>
    </div>
  </motion.div>
)

