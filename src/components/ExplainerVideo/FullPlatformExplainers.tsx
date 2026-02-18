'use client'

import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import { UsersIcon, BuildingIcon, ZapIcon, MapPinIcon } from './icons'
import { Handshake } from 'lucide-react'

const smoothTransition = {
  duration: 0.5,
  ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number]
}

const quickTransition = {
  duration: 0.4,
  ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number]
}

// Scene 1: Problem Setup (0-8s)
export const FullPlatformScene1Problem = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="h-full flex flex-col sm:flex-row gap-4 sm:gap-6">
      {/* Brands side */}
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, ...smoothTransition }}
        className="flex-1 bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 flex flex-col items-center justify-center"
      >
        <UsersIcon className="w-10 h-10 sm:w-12 sm:h-12 text-[#FF5200] mb-3" />
        <div className="text-sm sm:text-base font-semibold text-white mb-2">Brands</div>
        <div className="text-xs sm:text-sm text-gray-400 text-center">
          Can&apos;t find the right retail space
        </div>
      </motion.div>
      {/* Vs / gap */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
        className="flex items-center justify-center text-gray-500 font-bold text-lg"
      >
        vs
      </motion.div>
      {/* Owners side */}
      <motion.div
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, ...smoothTransition }}
        className="flex-1 bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 flex flex-col items-center justify-center"
      >
        <BuildingIcon className="w-10 h-10 sm:w-12 sm:h-12 text-[#E4002B] mb-3" />
        <div className="text-sm sm:text-base font-semibold text-white mb-2">Property Owners</div>
        <div className="text-xs sm:text-sm text-gray-400 text-center">
          Drowning in wrong inquiries
        </div>
      </motion.div>
    </div>
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, ...smoothTransition }}
      className="text-center text-xs sm:text-sm text-gray-500 mt-4"
    >
      There&apos;s no middle ground.
    </motion.p>
  </motion.div>
)

// Scene 2: Platform Introduction (8-15s)
export const FullPlatformScene2Solution = () => (
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
      className="mb-6"
    >
      <Logo size="lg" showText={true} showPoweredBy={false} variant="dark" />
    </motion.div>
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, ...smoothTransition }}
      className="flex items-center gap-2 sm:gap-4 mb-4"
    >
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF5200]/20 flex items-center justify-center">
        <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5200]" />
      </div>
      <motion.div
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="flex-1 h-0.5 bg-gradient-to-r from-[#FF5200] via-gray-600 to-[#E4002B] rounded"
      />
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E4002B]/20 flex items-center justify-center">
        <BuildingIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#E4002B]" />
      </div>
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, ...smoothTransition }}
      className="text-sm sm:text-base text-gray-400 text-center"
    >
      One platform. Both sides.
    </motion.p>
  </motion.div>
)

// Scene 3: How It Works (15-35s)
export const FullPlatformScene3HowItWorks = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-3xl mx-auto h-full flex flex-col justify-center">
      <div className="text-sm sm:text-base font-semibold text-white mb-4 text-center">
        How it works
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Requirements', sub: 'Brands share needs', Icon: UsersIcon },
          { label: 'Listings', sub: 'Owners list spaces', Icon: BuildingIcon },
          { label: 'AI Match', sub: 'Scored instantly', Icon: ZapIcon },
          { label: 'Results', sub: 'Clear path to deal', Icon: MapPinIcon },
        ].map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.25, ...quickTransition }}
            className="bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-700 flex flex-col items-center text-center"
          >
            <step.Icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF5200] mb-2" />
            <div className="text-xs sm:text-sm font-semibold text-white">{step.label}</div>
            <div className="text-[10px] sm:text-xs text-gray-400">{step.sub}</div>
          </motion.div>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, ...smoothTransition }}
        className="text-center text-xs sm:text-sm text-gray-500 mt-4"
      >
        No endless calls. No wasted visits.
      </motion.p>
    </div>
  </motion.div>
)

// Scene 4: Conclusion CTA (35-45s)
export const FullPlatformScene4CTA = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex flex-col items-center justify-center"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="mb-4 sm:mb-6"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center shadow-lg shadow-[#FF5200]/30">
        <Handshake className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </div>
    </motion.div>
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, ...smoothTransition }}
      className="text-base sm:text-lg font-semibold text-white text-center mb-2"
    >
      Where brands meet spaces
    </motion.p>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, ...smoothTransition }}
      className="text-xs sm:text-sm text-gray-400 text-center mb-6"
    >
      Brand or owner — get started today.
    </motion.p>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, ...smoothTransition }}
    >
      <Logo size="md" showText={true} showPoweredBy={false} variant="dark" />
    </motion.div>
  </motion.div>
)
