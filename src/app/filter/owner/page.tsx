'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { logSessionEvent, getClientSessionUserId } from '@/lib/session-logger'
import { trackFilterApply } from '@/lib/tracking'
import { useSessionTracking } from '@/hooks/useSessionTracking'
import {
  fnbPropertyTypes,
  ownerFilterPropertyTypes as propertyTypes,
  ownerFilterLocations as locations,
  ownerFilterFeaturesCategories as featuresCategories,
  ownerFilterAvailabilities as availabilities,
} from '@/data/owner-filter-options'
import {
  fraunces,
  plusJakarta,
  SizeSlider,
  RentSlider,
  SecurityDepositInput,
  FilterCard,
} from '@/components/owner-filter/OwnerFilterFormBlocks'

const primeAreas = [
  'Koramangala',
  'Indiranagar',
  'Whitefield',
  'HSR Layout',
  'Jayanagar',
  'BTM Layout',
  'MG Road',
  'Marathahalli',
]

// Flatten for backward compatibility (avoid Array.prototype.flat compatibility issues)
const features = Object.values(featuresCategories).reduce<string[]>((acc, items) => acc.concat(items), [])

export default function OwnerFilterPage() {
  const router = useRouter()

  // Progressive session tracking
  const sessionTracking = useSessionTracking({
    userType: 'owner',
    autoTrackPageViews: true,
    entryPage: '/filter/owner',
  })

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
    availability: false,
  })

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

  const scheduleOwnerLog = (action: string, extraData: Record<string, unknown> = {}) => {
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

  const handleSubmit = async () => {
    // Validate all fields
    const newErrors = {
      propertyType: propertyTypeSelected.size === 0,
      size: sizeValue === 0,
      location: locationSelected.size === 0,
      rent: rentValue === 0,
      deposit: false, // Optional field
      features: featuresSelected.size === 0,
      availability: availabilitySelected.size === 0,
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
      availability: Array.from(availabilitySelected)[0],
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

    // Track filter application
    trackFilterApply(filterData, 'owner')

    // Progressive session tracking - mark form as complete
    await sessionTracking.trackFormComplete('owner_filter', filterData)

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
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E4002B] flex-shrink-0"></div>
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
              visibleCount={fnbPropertyTypes.length}
              compactCapsules
              instructionText="Highest & Instant matches for FnB properties"
              moreLabel="Choose from more property types"
              onSelectionChange={(set) => {
                setPropertyTypeSelected(set)
                scheduleOwnerLog('filter_change', { filter_step: buildOwnerFilterSessionPayload() })
                // Progressive session tracking
                sessionTracking.trackFilterUpdate({
                  propertyType: Array.from(set)[0] || null,
                })
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
                // Progressive session tracking
                sessionTracking.trackFilterUpdate({
                  size,
                })
              }}
              error={errors.size}
            />
          </div>
          <div data-field="location" className="overflow-visible relative z-20">
            <FilterCard
              title="Property Location"
              items={locations}
              index={2}
              required
              useDropdown={true}
              visibleCount={primeAreas.length}
              compactCapsules
              instructionText="Select the primary location of your property"
              moreLabel="Search or type to add another area"
              searchableOptions={true}
              onSelectionChange={(set) => {
                setLocationSelected(set)
                scheduleOwnerLog('filter_change', { filter_step: buildOwnerFilterSessionPayload() })
                sessionTracking.trackFilterUpdate({
                  location: Array.from(set)[0] || null,
                })
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
                // Progressive session tracking
                sessionTracking.trackFilterUpdate({
                  rent,
                })
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

        {/* Apply Button - Centered, only visible when form is valid */}
        <AnimatePresence>
          {isFormValid && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="flex justify-center mt-8 sm:mt-10 md:mt-12 mb-6 sm:mb-8"
            >
              <motion.button
                onClick={handleSubmit}
                className="group relative px-8 py-4 sm:px-12 sm:py-5 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold overflow-hidden bg-gradient-to-r from-[#E4002B] to-[#FF5200] text-white shadow-[0_8px_24px_rgba(228,0,43,0.4)] cursor-pointer"
                style={{ fontFamily: plusJakarta.style.fontFamily }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200] to-[#E4002B] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center gap-2">
                  Apply Filters
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 rounded-xl border-2 border-white/30 opacity-0 group-hover:opacity-100"></div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Note */}
      <div className="relative z-0 mt-8 sm:mt-10 md:mt-12 mb-6 sm:mb-8 flex justify-center px-4">
        <p
          className="max-w-3xl text-[10px] sm:text-xs md:text-sm text-gray-500 text-center leading-relaxed"
          style={{ fontFamily: plusJakarta.style.fontFamily }}
        >
          We use your preferences to instantly match your property with high-intent FnB and retail brands. Your details are kept confidential and only shared with verified matches to speed up closures.
        </p>
      </div>

      {/* Bottom Glow Line */}
      <div className="relative z-0 mt-8 sm:mt-10 md:mt-12 h-px bg-gradient-to-r from-transparent via-[#E4002B] to-transparent opacity-50"></div>
    </div>
  )
}
