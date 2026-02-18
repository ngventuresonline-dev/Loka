'use client'

import { ComponentType } from 'react'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import Image from 'next/image'
import { 
  BuildingIcon, UsersIcon, 
  ZapIcon, CheckCircleIcon, MapPinIcon,
  TrendingUpIcon, BarChartIcon, FileTextIcon,
  SearchIcon
} from './icons'
import { MessageCircle, Send, Calendar, Filter, Lock, Unlock, ArrowRight } from 'lucide-react'

// Import complete flow scenes
import {
  Scene1Homepage,
  Scene2Onboarding,
  Scene3Analysis,
  Scene4Matches,
  Scene5Connect
} from './CompleteFlow'

// Import onboarding explainer scenes
import {
  BrandScene1Entry,
  BrandScene2Start,
  BrandScene3DetailsAndLocations,
  BrandScene4Profile,
  BrandScene5Matching,
  BrandScene6MatchesAndExpert,
  PropertyScene1Entry,
  PropertyScene2Start,
  PropertyScene3Details,
  PropertyScene4Location,
  PropertyScene5Profile,
  PropertyScene6Matches
} from './OnboardingExplainers'

// Import brand requirements ad scenes
import {
  BrandReqScene1Context,
  BrandReqScene2BrandList,
  BrandReqScene3Requirements,
  BrandReqScene4CallToAction,
  BrandReqScene5CTA,
  BrandReqScene6LogoZoom
} from './BrandRequirementsAd'

import {
  FullPlatformScene1Problem,
  FullPlatformScene2Solution,
  FullPlatformScene3HowItWorks,
  FullPlatformScene4CTA
} from './FullPlatformExplainers'

export interface SceneConfig {
  component: ComponentType<any>
  duration: number
}

export interface VideoVariant {
  name: string
  description: string
  type: 'intro' | 'explainer'
  scenes: SceneConfig[]
  totalDuration: number
}

// Smooth transition preset
const smoothTransition = {
  duration: 0.6,
  ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number]
}

const quickTransition = {
  duration: 0.4,
  ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number]
}

// ============ SCENES ============

// Variant 1: Brand → Property (Core Flow)
const V1Homepage = () => (
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
      className="mb-6 flex justify-center"
    >
      <Logo size="lg" showText={true} showPoweredBy={false} variant="dark" />
    </motion.div>
    <motion.button
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, ...smoothTransition }}
      className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white px-6 py-3 rounded-lg text-sm font-semibold"
    >
      Find Property for My Brand
    </motion.button>
  </motion.div>
)

const V1Onboarding = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
        <div className="text-sm font-semibold text-white mb-4">Brand Onboarding</div>
        <div className="space-y-3">
          {[
            { label: 'Brand Type', value: 'Café' },
            { label: 'Size', value: '800–1200 sq ft' },
            { label: 'Budget', value: '₹200–300/sq ft' },
            { label: 'Location', value: 'Indiranagar' },
          ].map((field, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 * i, ...quickTransition }}
              className="bg-gray-900 rounded-lg p-3 border border-gray-700 flex justify-between items-center"
            >
              <div className="text-xs text-gray-400">{field.label}</div>
              <div className="text-xs text-gray-300 font-medium">{field.value}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
)

const V1Analysis = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="h-full bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col">
      <div className="text-sm font-semibold text-white mb-3">AI Analysis</div>
      <div className="flex-1 bg-gray-900 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(to right, #FF5200 1px, transparent 1px), linear-gradient(to bottom, #FF5200 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        <div className="absolute top-1/3 left-1/3">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-8 h-8 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full"
          />
        </div>
        <div className="absolute bottom-1/4 right-1/4 text-xs text-gray-400">Footfall Data</div>
      </div>
    </div>
  </motion.div>
)

const V1Matches = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="text-sm font-semibold text-white mb-3">Top 5 Matches</div>
      <div className="space-y-2">
        {[
          { name: 'Property A', bfi: 94, pfi: 91 },
          { name: 'Property B', bfi: 88, pfi: 89 },
        ].map((match, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 * i, ...quickTransition }}
            className={`bg-gray-800 rounded-lg p-3 border-2 ${
              i === 0 ? 'border-[#FF5200]' : 'border-gray-700'
            } flex items-center justify-between`}
          >
            <div className="flex gap-2">
              <div className="text-xs bg-[#FF5200]/20 text-[#FF5200] px-2 py-1 rounded">BFI {match.bfi}%</div>
              <div className="text-xs bg-[#E4002B]/20 text-[#E4002B] px-2 py-1 rounded">PFI {match.pfi}%</div>
            </div>
            {i === 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white px-4 py-1.5 rounded text-xs font-semibold"
              >
                Connect
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
)

// Variant 2: Property → Brand (Owner Flow)
const V2Homepage = () => (
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
      className="mb-6 flex justify-center"
    >
      <Logo size="lg" showText={true} showPoweredBy={false} variant="dark" />
    </motion.div>
    <motion.button
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, ...smoothTransition }}
      className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white px-6 py-3 rounded-lg text-sm font-semibold"
    >
      List My Property
    </motion.button>
  </motion.div>
)

const V2PropertyForm = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
        <div className="text-sm font-semibold text-white mb-4">Property Details</div>
        <div className="space-y-3">
          {[
            { label: 'Property Type', value: 'High street' },
            { label: 'Size', value: '1,000 sq ft' },
            { label: 'Location', value: 'Indiranagar' },
          ].map((field, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 * i, ...quickTransition }}
              className="bg-gray-900 rounded-lg p-3 border border-gray-700 flex justify-between items-center"
            >
              <div className="text-xs text-gray-400">{field.label}</div>
              <div className="text-xs text-gray-300 font-medium">{field.value}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
)

const V2MapPin = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="h-full bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="h-full bg-gray-900 rounded-lg relative">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(to right, #FF5200 1px, transparent 1px), linear-gradient(to bottom, #FF5200 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full flex items-center justify-center shadow-lg">
            <MapPinIcon className="w-6 h-6 text-white" />
          </div>
        </motion.div>
      </div>
    </div>
  </motion.div>
)

const V2BrandMatches = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="text-sm font-semibold text-white mb-3">Matched Brands</div>
      <div className="space-y-2">
        {[
          { name: 'Brand Alpha', score: 92 },
          { name: 'Brand Beta', score: 88 },
        ].map((brand, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 * i, ...quickTransition }}
            className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-center justify-between"
          >
            <div className="text-sm text-gray-300">{brand.name}</div>
            <button className="text-xs text-[#FF5200] hover:text-[#E4002B]">View Brand Profile →</button>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
)

// Variant 3: Speed Hook
const V3FastOnboarding = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.2 * i, duration: 0.3 }}
              className="h-10 bg-gray-900 rounded border border-gray-700"
            />
          ))}
        </div>
      </div>
    </div>
  </motion.div>
)

const V3Analyzing = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-12"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-4 border-[#FF5200] border-t-transparent rounded-full mb-4"
    />
    <div className="text-sm text-gray-300">Analyzing...</div>
  </motion.div>
)

const V3InstantMatches = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="text-center mb-4">
        <div className="text-sm font-semibold text-white mb-1">Top 5 Matches</div>
        <div className="text-xs text-gray-400">Minutes, not months</div>
      </div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, ...quickTransition }}
        className="bg-gray-800 rounded-lg p-4 border-2 border-[#FF5200]"
      >
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-semibold text-white">Property Match</div>
          <div className="text-xs bg-[#FF5200]/20 text-[#FF5200] px-2 py-1 rounded">BFI 94%</div>
        </div>
      </motion.div>
    </div>
  </motion.div>
)

// Variant 4: Location Intelligence Focus
const V4MapZoom = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="h-full bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col">
      <div className="text-xs text-gray-400 mb-2">Indiranagar</div>
      <div className="flex-1 bg-gray-900 rounded-lg relative overflow-hidden">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={smoothTransition}
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(to right, #FF5200 1px, transparent 1px), linear-gradient(to bottom, #FF5200 1px, transparent 1px)',
            backgroundSize: '15px 15px'
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-[#FF5200]/30 to-[#E4002B]/30 rounded-full" />
      </div>
    </div>
  </motion.div>
)

const V4Heatmap = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="h-full bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="h-full bg-gray-900 rounded-lg relative">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full"
        />
        <div className="absolute bottom-4 left-4 text-xs text-gray-400">Footfall Heatmap</div>
      </div>
    </div>
  </motion.div>
)

const V4HighScore = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex flex-col items-center justify-center"
  >
    <div className="bg-gray-800 rounded-xl p-4 border-2 border-[#FF5200] max-w-xs">
      <div className="text-sm font-semibold text-white mb-2">Best Match</div>
      <div className="text-2xl font-bold text-[#FF5200] mb-2">PFI 96%</div>
      <div className="text-xs text-gray-400">Location intelligence enhanced</div>
    </div>
  </motion.div>
)

// Variant 5: BFI/PFI Scoring Explainer
const V5Profiles = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-4xl mx-auto h-full flex gap-4 items-center justify-center">
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={smoothTransition}
        className="bg-gray-800 rounded-xl p-4 border border-gray-700"
      >
        <UsersIcon className="w-8 h-8 text-[#FF5200] mb-2" />
        <div className="text-xs text-gray-300">Brand Profile</div>
      </motion.div>
      <ArrowRight className="w-6 h-6 text-gray-600" />
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, ...smoothTransition }}
        className="bg-gray-800 rounded-xl p-4 border border-gray-700"
      >
        <BuildingIcon className="w-8 h-8 text-[#FF5200] mb-2" />
        <div className="text-xs text-gray-300">Property Profile</div>
      </motion.div>
    </div>
  </motion.div>
)

const V5Scoring = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex flex-col items-center justify-center"
  >
    <div className="w-full max-w-md space-y-4">
      {[
        { label: 'BFI', score: 92 },
        { label: 'PFI', score: 88 },
      ].map((item, i) => (
        <div key={i}>
          <div className="flex justify-between mb-2">
            <div className="text-sm font-semibold text-white">{item.label}</div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.3 }}
              className="text-sm font-bold text-[#FF5200]"
            >
              {item.score}%
            </motion.div>
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.8 + i * 0.3, duration: 0.8 }}
            className="h-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full"
          />
        </div>
      ))}
    </div>
    <div className="mt-6 text-center text-sm text-gray-300">Top Match Ranked</div>
  </motion.div>
)

// Variant 6: Dashboard Walkthrough (Brand)
const V6Dashboard = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="text-sm font-semibold text-white mb-4">Brand Dashboard</div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * i, ...quickTransition }}
              className="bg-gray-900 rounded-lg p-3 border border-gray-700 flex items-center justify-between"
            >
              <div className="text-xs text-gray-300">Match {i}</div>
              <button className="text-xs bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white px-3 py-1 rounded">Connect</button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
)

// Variant 7: Dashboard Walkthrough (Owner)
const V7OwnerDashboard = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="text-sm font-semibold text-white mb-4">Owner Dashboard</div>
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-2">Property: High Street Unit</div>
          <div className="h-20 bg-gray-900 rounded border border-gray-700" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 * i, ...quickTransition }}
              className={`bg-gray-900 rounded-lg p-3 border-2 ${
                i === 1 ? 'border-[#FF5200]' : 'border-gray-700'
              }`}
            >
              <div className="text-xs text-gray-300">Matched Brand {i}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
)

// Variant 8: From Onboarding to Match
const V8FullJourney = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-12 flex flex-col items-center justify-center"
  >
    <div className="flex items-center gap-3 mb-6">
      {['Onboard', 'Analyze', 'Match'].map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 * i, ...quickTransition }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center mb-2">
            <CheckCircleIcon className="w-6 h-6 text-white" />
          </div>
          <div className="text-xs text-gray-400">{step}</div>
        </motion.div>
      ))}
    </div>
    <div className="text-center text-sm font-semibold text-white">Your best matches are ready</div>
  </motion.div>
)

// Variant 9: High-Street Expansion
const V9HighStreet = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="h-full bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col">
      <div className="text-sm font-semibold text-white mb-3">High Street Locations</div>
      <div className="flex-1 bg-gray-900 rounded-lg relative">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(to right, #FF5200 1px, transparent 1px), linear-gradient(to bottom, #FF5200 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full"
        />
      </div>
    </div>
  </motion.div>
)

// Variant 10: Multi-City Brand Expansion
const V10MultiCity = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="h-full bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="text-sm font-semibold text-white mb-3">Multi-City Expansion</div>
      <div className="h-full bg-gray-900 rounded-lg relative">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(to right, #FF5200 1px, transparent 1px), linear-gradient(to bottom, #FF5200 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        {['Indiranagar', 'Koramangala', 'HSR'].map((area, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 * i, ...quickTransition }}
            className="absolute"
            style={{
              top: `${20 + i * 30}%`,
              left: `${30 + i * 20}%`,
            }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full" />
            <div className="text-xs text-gray-400 mt-1">{area}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
)

// Variant 11: Data-Driven Decisions
const V11Data = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="text-sm font-semibold text-white mb-4">Data Dashboard</div>
        <div className="grid grid-cols-3 gap-3">
          {['Scores', 'Maps', 'Insights'].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 * i, ...quickTransition }}
              className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-center"
            >
              <BarChartIcon className="w-6 h-6 text-[#FF5200] mx-auto mb-1" />
              <div className="text-xs text-gray-300">{item}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
)

// Variant 12: First Match Free
const V12FirstMatch = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="space-y-2">
        <motion.div
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.02, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-lg p-4 border-2 border-[#FF5200]"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Match 1</div>
              <div className="text-xs text-gray-400">Unlocked</div>
            </div>
            <Unlock className="w-5 h-5 text-[#FF5200]" />
          </div>
        </motion.div>
        {[2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
          >
            <div>
              <div className="text-sm text-gray-600">Match {i}</div>
              <div className="text-xs text-gray-500">Locked</div>
            </div>
            <Lock className="w-5 h-5 text-gray-600" />
          </motion.div>
        ))}
      </div>
      <div className="text-center mt-4 text-sm text-gray-300">Unlock full access</div>
    </div>
  </motion.div>
)

// Variant 13: Mobile-First Experience
const V13Mobile = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex items-center justify-center"
  >
    <div className="w-full max-w-xs bg-gray-800 rounded-2xl p-4 border border-gray-700">
      <div className="text-xs font-semibold text-white mb-3">Mobile View</div>
      <div className="space-y-2 mb-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-300">Match {i}</div>
          </div>
        ))}
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        className="w-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-2 rounded-lg text-xs font-semibold"
      >
        Connect
      </motion.button>
    </div>
  </motion.div>
)

// Variant 14: Investor/Partner Overview
const V14Overview = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8"
  >
    <div className="grid grid-cols-2 gap-3 h-full">
      {[
        { label: 'Brand Onboard', icon: UsersIcon },
        { label: 'Property Onboard', icon: BuildingIcon },
        { label: 'AI Matching', icon: ZapIcon },
        { label: 'Results', icon: BarChartIcon },
      ].map((item, i) => {
        const Icon = item.icon
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 * i, ...quickTransition }}
            className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col items-center justify-center"
          >
            <Icon className="w-8 h-8 text-[#FF5200] mb-2" />
            <div className="text-xs text-gray-300 text-center">{item.label}</div>
          </motion.div>
        )
      })}
    </div>
  </motion.div>
)

// Variant 15: Confidence Close
const V15Confidence = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={quickTransition}
    className="w-full h-full bg-gray-900 p-4 sm:p-8 flex flex-col items-center justify-center"
  >
    <div className="max-w-md">
      <div className="bg-gray-800 rounded-xl p-6 border-2 border-[#FF5200] mb-4">
        <div className="text-3xl font-bold text-[#FF5200] mb-2">96% Match</div>
        <div className="text-sm text-gray-300 mb-4">Why this match</div>
        <div className="space-y-2 text-xs text-gray-400">
          <div>✓ Perfect location fit</div>
          <div>✓ Budget aligned</div>
          <div>✓ Size optimal</div>
        </div>
      </div>
      <div className="text-center text-lg font-semibold text-white">Right brand. Right location.</div>
    </div>
  </motion.div>
)

// Variant definitions (30 seconds total)
export const VIDEO_VARIANTS: Record<string, VideoVariant> = {
  // Full Platform - 30-45s explainer for brands & owners
  'full-platform': {
    name: 'Full Platform Video (30-45s)',
    description: 'One video for brands & owners: Problem → Solution → How it works → CTA. Use with voiceover transcript.',
    type: 'explainer',
    scenes: [
      { component: FullPlatformScene1Problem, duration: 8 },   // 0-8s: Problem
      { component: FullPlatformScene2Solution, duration: 7 },  // 8-15s: Solution
      { component: FullPlatformScene3HowItWorks, duration: 20 }, // 15-35s: How it works
      { component: FullPlatformScene4CTA, duration: 10 },      // 35-45s: CTA
    ],
    totalDuration: 45
  },
  // Complete Flow - Main showcase video
  'complete-flow': {
    name: 'Complete Flow: Brand → Property',
    description: 'Full journey: Homepage → Onboarding → AI Analysis → Top 5 Matches → Connect',
    type: 'explainer',
    scenes: [
      { component: Scene1Homepage, duration: 5 },      // 0-5s: Homepage hero
      { component: Scene2Onboarding, duration: 6 },    // 5-11s: Brand onboarding
      { component: Scene3Analysis, duration: 6 },      // 11-17s: AI analysis
      { component: Scene4Matches, duration: 8 },       // 17-25s: Top 5 matches
      { component: Scene5Connect, duration: 5 },       // 25-30s: Connect CTA
    ],
    totalDuration: 30
  },
  // Brand Onboarding Explainer
  'brand-onboarding': {
    name: 'Brand Onboarding Explainer',
    description: 'How brands onboard: Homepage → Brand details & Locations → Profile ready → Matching begins → Show matched Properties and connect with Expert',
    type: 'explainer',
    scenes: [
      { component: BrandScene1Entry, duration: 4 },                    // 0-4s: Entry - "Looking for the right space?"
      { component: BrandScene2Start, duration: 4 },                    // 4-8s: Start brand flow - "Start with your brand."
      { component: BrandScene3DetailsAndLocations, duration: 8 },      // 8-16s: Brand details & Locations - "Define your requirements and location preferences."
      { component: BrandScene4Profile, duration: 6 },                  // 16-22s: Profile ready - "Your brand profile is ready."
      { component: BrandScene5Matching, duration: 3 },                 // 22-25s: Matching begins - "Matching begins instantly."
      { component: BrandScene6MatchesAndExpert, duration: 5 },         // 25-30s: Matched Properties & Expert Connect
    ],
    totalDuration: 30
  },
  // Property Onboarding Explainer
  'property-onboarding': {
    name: 'Property Onboarding Explainer',
    description: 'How property owners list: Homepage → Property details → Location pin → Profile live → Brands matching',
    type: 'explainer',
    scenes: [
      { component: PropertyScene1Entry, duration: 4 },   // 0-4s: Entry - "Have a space to lease?"
      { component: PropertyScene2Start, duration: 4 },   // 4-8s: Start property flow - "List your property."
      { component: PropertyScene3Details, duration: 6 }, // 8-14s: Property details - "Share your property details."
      { component: PropertyScene4Location, duration: 6 }, // 14-20s: Location pinning - "Pin the exact location."
      { component: PropertyScene5Profile, duration: 6 }, // 20-26s: Profile ready - "Your property profile is live."
      { component: PropertyScene6Matches, duration: 4 }, // 26-30s: Ready for matches - "Relevant brands start matching."
    ],
    totalDuration: 30
  },
  'intro-1': {
    name: 'Variant 1: Brand → Property (Core Flow)',
    description: 'Café brand finds property: homepage → onboarding → AI analysis → Top 5 Matches',
    type: 'intro',
    scenes: [
      { component: V1Homepage, duration: 6 },
      { component: V1Onboarding, duration: 8 },
      { component: V1Analysis, duration: 8 },
      { component: V1Matches, duration: 8 },
    ],
    totalDuration: 30
  },
  'intro-2': {
    name: 'Variant 2: Property → Brand (Owner Flow)',
    description: 'Property owner finds brand: homepage → property form → map → matched brands',
    type: 'intro',
    scenes: [
      { component: V2Homepage, duration: 6 },
      { component: V2PropertyForm, duration: 8 },
      { component: V2MapPin, duration: 8 },
      { component: V2BrandMatches, duration: 8 },
    ],
    totalDuration: 30
  },
  'intro-3': {
    name: 'Variant 3: Speed Hook (Instant Results)',
    description: 'Fast onboarding → analyzing → immediate Top 5 Matches reveal',
    type: 'intro',
    scenes: [
      { component: V3FastOnboarding, duration: 10 },
      { component: V3Analyzing, duration: 8 },
      { component: V3InstantMatches, duration: 12 },
    ],
    totalDuration: 30
  },
  'intro-4': {
    name: 'Variant 4: Location Intelligence Focus',
    description: 'Map zoom → footfall heatmap → competitor pins → high PFI match',
    type: 'intro',
    scenes: [
      { component: V4MapZoom, duration: 10 },
      { component: V4Heatmap, duration: 10 },
      { component: V4HighScore, duration: 10 },
    ],
    totalDuration: 30
  },
  'intro-5': {
    name: 'Variant 5: BFI/PFI Scoring Explainer',
    description: 'Brand & property profiles → scores calculating → top match ranked',
    type: 'intro',
    scenes: [
      { component: V5Profiles, duration: 12 },
      { component: V5Scoring, duration: 18 },
    ],
    totalDuration: 30
  },
  'intro-6': {
    name: 'Variant 6: Dashboard Walkthrough (Brand)',
    description: 'Brand dashboard → match cards → filters → Connect CTA',
    type: 'intro',
    scenes: [
      { component: V6Dashboard, duration: 30 },
    ],
    totalDuration: 30
  },
  'intro-7': {
    name: 'Variant 7: Dashboard Walkthrough (Owner)',
    description: 'Owner dashboard → property selected → matching brands → brand details',
    type: 'intro',
    scenes: [
      { component: V7OwnerDashboard, duration: 30 },
    ],
    totalDuration: 30
  },
  'explainer-8': {
    name: 'Variant 8: From Onboarding to Match',
    description: 'Homepage → form → analysis → match reveal',
    type: 'explainer',
    scenes: [
      { component: V8FullJourney, duration: 30 },
    ],
    totalDuration: 30
  },
  'explainer-9': {
    name: 'Variant 9: High-Street Expansion Use Case',
    description: 'Brand selects High Street → map zoom → footfall → matched properties',
    type: 'explainer',
    scenes: [
      { component: V9HighStreet, duration: 30 },
    ],
    totalDuration: 30
  },
  'explainer-10': {
    name: 'Variant 10: Multi-City Brand Expansion',
    description: 'Multiple locations selected → map pans → matches grouped → best match',
    type: 'explainer',
    scenes: [
      { component: V10MultiCity, duration: 30 },
    ],
    totalDuration: 30
  },
  'explainer-11': {
    name: 'Variant 11: Data-Driven Decisions',
    description: 'Hesitation → dashboard appears → scores/maps/insights → confident choice',
    type: 'explainer',
    scenes: [
      { component: V11Data, duration: 30 },
    ],
    totalDuration: 30
  },
  'explainer-12': {
    name: 'Variant 12: First Match Free',
    description: 'Dashboard → first match unlocked → others locked → unlock CTA',
    type: 'explainer',
    scenes: [
      { component: V12FirstMatch, duration: 30 },
    ],
    totalDuration: 30
  },
  'explainer-13': {
    name: 'Variant 13: Mobile-First Experience',
    description: 'Mobile homepage → tap onboarding → scroll matches → tap Connect',
    type: 'explainer',
    scenes: [
      { component: V13Mobile, duration: 30 },
    ],
    totalDuration: 30
  },
  'explainer-14': {
    name: 'Variant 14: Investor/Partner Overview',
    description: 'Platform overview: dual onboarding → matching → dashboard results',
    type: 'explainer',
    scenes: [
      { component: V14Overview, duration: 30 },
    ],
    totalDuration: 30
  },
  'explainer-15': {
    name: 'Variant 15: Confidence Close',
    description: 'Match dashboard → high score → why this match panel → confidence message',
    type: 'explainer',
    scenes: [
      { component: V15Confidence, duration: 30 },
    ],
    totalDuration: 30
  },
  'brand-requirements-ad': {
    name: 'Active Brand Requirements Ad',
    description: 'Show active brand requirements and invite property owners to list matching properties',
    type: 'explainer',
    scenes: [
      { component: BrandReqScene1Context, duration: 4 },        // 0-4s: Context
      { component: BrandReqScene2BrandList, duration: 10 },     // 4-14s: Brand list with requirements
      { component: BrandReqScene3Requirements, duration: 6 },  // 14-20s: Requirements
      { component: BrandReqScene4CallToAction, duration: 6 },   // 20-26s: Call to action
      { component: BrandReqScene5CTA, duration: 4 },            // 26-30s: CTA/Close
      { component: BrandReqScene6LogoZoom, duration: 4 },      // 30-34s: Logo zoom-in
    ],
    totalDuration: 34
  },
}
