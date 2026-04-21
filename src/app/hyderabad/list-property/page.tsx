'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ownerFilterFeaturesCategories as featuresCategories,
  ownerFilterAvailabilities as availabilities,
} from '@/data/owner-filter-options'
import {
  fraunces,
  plusJakarta,
  SizeSlider,
  RentSlider,
  FilterCard,
} from '@/components/owner-filter/OwnerFilterFormBlocks'

const HYDERABAD_LOCALITIES = [
  'Jubilee Hills',
  'Banjara Hills',
  'Kondapur',
  'Financial District',
  'Kokapet',
  'Madhapur',
  'Gachibowli',
  'Nanakramguda',
  'Film Nagar',
  'Hitech City',
]

/** Replaces generic property type — cafe-only flow */
const CAFE_FORMAT_OPTIONS = [
  'Standalone cafe / bistro',
  'Mall or food court unit',
  'High-street storefront',
  'Hotel or commercial complex',
  'Rooftop / terrace cafe',
]

const KITCHEN_SETUP_OPTIONS = [
  'Fully fitted kitchen',
  'Warm shell (basic services)',
  'Shell space (needs full fit-out)',
  'Counter / takeaway only',
]

const features = Object.values(featuresCategories).reduce<string[]>((acc, items) => acc.concat(items), [])

const LOKAZEN_HOME = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.lokazen.in').replace(/\/$/, '')

function isValidIndianMobile(input: string): boolean {
  const d = input.replace(/\D/g, '')
  let ten = d
  if (d.length === 12 && d.startsWith('91')) ten = d.slice(2)
  else if (d.length === 11 && d.startsWith('0')) ten = d.slice(1)
  return ten.length === 10 && /^[6-9]\d{9}$/.test(ten)
}

function isValidGmapUrl(url: string): boolean {
  const u = url.trim().toLowerCase()
  if (!u.startsWith('http://') && !u.startsWith('https://')) return false
  try {
    const { hostname } = new URL(u)
    const h = hostname.replace(/^www\./, '')
    return (
      h === 'maps.app.goo.gl' ||
      h === 'goo.gl' ||
      (h.includes('google.') && (u.includes('/maps') || h.startsWith('maps.google')))
    )
  } catch {
    return false
  }
}

export default function HyderabadListPropertyPage() {
  const [ownerName, setOwnerName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cafeFormatSelected, setCafeFormatSelected] = useState<Set<string>>(new Set())
  const [kitchenSetupSelected, setKitchenSetupSelected] = useState<Set<string>>(new Set())
  const [sizeValue, setSizeValue] = useState<number>(1000)
  const [locationSelected, setLocationSelected] = useState<Set<string>>(new Set())
  const [mapLink, setMapLink] = useState('')
  const [rentValue, setRentValue] = useState<number>(100000)
  const [featuresSelected, setFeaturesSelected] = useState<Set<string>>(new Set())
  const [availabilitySelected, setAvailabilitySelected] = useState<Set<string>>(new Set())

  const [errors, setErrors] = useState({
    contactName: false,
    contactPhone: false,
    cafeFormat: false,
    kitchenSetup: false,
    size: false,
    location: false,
    mapLink: false,
    rent: false,
    features: false,
    availability: false,
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showThanksModal, setShowThanksModal] = useState(false)

  const formLocked = showThanksModal

  const isFormValid =
    ownerName.trim().length > 0 &&
    isValidIndianMobile(whatsapp) &&
    cafeFormatSelected.size > 0 &&
    kitchenSetupSelected.size > 0 &&
    sizeValue > 0 &&
    locationSelected.size > 0 &&
    mapLink.trim().length > 0 &&
    isValidGmapUrl(mapLink) &&
    rentValue > 0 &&
    featuresSelected.size > 0 &&
    availabilitySelected.size > 0

  useEffect(() => {
    if (!showThanksModal) return
    const id = window.setTimeout(() => {
      window.location.href = LOKAZEN_HOME
    }, 2800)
    return () => window.clearTimeout(id)
  }, [showThanksModal])

  const handleSubmit = async () => {
    const newErrors = {
      contactName: ownerName.trim().length === 0,
      contactPhone: !isValidIndianMobile(whatsapp),
      cafeFormat: cafeFormatSelected.size === 0,
      kitchenSetup: kitchenSetupSelected.size === 0,
      size: sizeValue === 0,
      location: locationSelected.size === 0,
      mapLink: !isValidGmapUrl(mapLink),
      rent: rentValue === 0,
      features: featuresSelected.size === 0,
      availability: availabilitySelected.size === 0,
    }
    setErrors(newErrors)
    setSubmitError(null)

    if (Object.values(newErrors).some(Boolean)) {
      const firstError = Object.entries(newErrors).find(([_, hasError]) => hasError)
      if (firstError) {
        document.querySelector(`[data-field="${firstError[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/hyderabad/list-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: ownerName.trim(),
          whatsapp,
          cafeFormat: Array.from(cafeFormatSelected)[0],
          kitchenSetup: Array.from(kitchenSetupSelected)[0],
          locality: Array.from(locationSelected)[0],
          mapLink: mapLink.trim(),
          size: sizeValue,
          rent: rentValue,
          features: Array.from(featuresSelected),
          availability: Array.from(availabilitySelected)[0],
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setSubmitError(typeof data.error === 'string' ? data.error : 'Something went wrong. Please try again.')
        return
      }
      setShowThanksModal(true)
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`${fraunces.variable} ${plusJakarta.variable} min-h-screen relative overflow-hidden`}>
      <div className="fixed inset-0 bg-gradient-to-br from-[#E4002B]/5 via-[#FF5200]/3 to-[#FF6B35]/5"></div>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-[#E4002B]/15 to-[#FF5200]/15 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-[#FF5200]/15 to-[#FF6B35]/15 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]"></div>
      </div>

      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_4s_ease-in-out_infinite]"></div>
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_4s_ease-in-out_infinite_2s]"></div>
      </div>

      <AnimatePresence>
        {showThanksModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="thanks-title"
          >
            <div className="absolute inset-0 bg-black/35 backdrop-blur-md" aria-hidden />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-md rounded-2xl border border-white/50 bg-white/20 px-6 py-8 sm:px-8 sm:py-10 shadow-[0_25px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl"
              style={{ fontFamily: plusJakarta.style.fontFamily }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
              <div className="relative z-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#E4002B] to-[#FF5200] shadow-lg shadow-[#E4002B]/40">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2
                  id="thanks-title"
                  className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3"
                  style={{ fontFamily: fraunces.style.fontFamily }}
                >
                  Thank you
                </h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  We&apos;ve received your property details. Our team will reach out within 24 hours.
                </p>
                <p className="mt-4 text-xs sm:text-sm text-gray-600/90">Taking you to Lokazen…</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-12 pb-24 sm:pb-32 md:pb-40">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-6 sm:mb-8 md:mb-10"
        >
          <div className="relative w-full max-w-2xl mx-auto bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-6 border-2 border-[#E4002B]/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E4002B]/10 via-[#FF5200]/5 to-transparent rounded-xl sm:rounded-2xl pointer-events-none" />
            <div className="relative z-10 text-center sm:text-left">
              <h1
                className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3"
                style={{ fontFamily: fraunces.style.fontFamily }}
              >
                List Hyderabad Property
              </h1>
              <p
                className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xl mx-auto sm:mx-0"
                style={{ fontFamily: plusJakarta.style.fontFamily }}
              >
                An established Bangalore brand is actively looking for premium commercial space in Jubilee Hills.
                Submit your property details and we&apos;ll be in touch within 24 hours.
              </p>
            </div>
          </div>
        </motion.div>

        {submitError && (
          <div
            className="mb-6 max-w-2xl mx-auto rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 text-center"
            style={{ fontFamily: plusJakarta.style.fontFamily }}
          >
            {submitError}
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 md:gap-8 overflow-visible mb-8 sm:mb-12 md:mb-16">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0 }}
            className="relative group overflow-visible"
          >
            <div className="relative bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-[#E4002B]/30 hover:border-[#E4002B] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#E4002B]/50 group-hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E4002B]/20 via-[#FF5200]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#E4002B]/40 to-transparent rounded-bl-full group-hover:w-32 group-hover:h-32 transition-all duration-500"></div>

              <div className="relative z-10 space-y-4 sm:space-y-5">
                <h3
                  className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900"
                  style={{ fontFamily: fraunces.style.fontFamily }}
                >
                  Contact
                </h3>

                <div data-field="contactName">
                  <label
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2"
                    style={{ fontFamily: plusJakarta.style.fontFamily }}
                  >
                    Contact name (owner or listing) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoComplete="name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    disabled={formLocked}
                    placeholder="Your full name"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white border-2 border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/20 outline-none transition-all duration-200 disabled:opacity-60"
                    style={{ fontFamily: plusJakarta.style.fontFamily }}
                  />
                  {errors.contactName && (
                    <p className="mt-2 text-xs sm:text-sm text-red-600">Please enter your name</p>
                  )}
                </div>

                <div data-field="contactPhone">
                  <label
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2"
                    style={{ fontFamily: plusJakarta.style.fontFamily }}
                  >
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    disabled={formLocked}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white border-2 border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/20 outline-none transition-all duration-200 disabled:opacity-60"
                    style={{ fontFamily: plusJakarta.style.fontFamily }}
                  />
                  {errors.contactPhone && (
                    <p className="mt-2 text-xs sm:text-sm text-red-600">Enter a valid 10-digit Indian mobile number</p>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          <div data-field="cafeFormat" className="overflow-visible relative">
            <FilterCard
              title="What best describes your cafe space?"
              items={CAFE_FORMAT_OPTIONS}
              index={1}
              required
              useDropdown={true}
              instructionText="Select the option that best matches your listing"
              moreLabel="Choose format"
              onSelectionChange={(set) => setCafeFormatSelected(set)}
              error={errors.cafeFormat}
            />
          </div>

          <div data-field="kitchenSetup" className="overflow-visible relative">
            <FilterCard
              title="Kitchen & fit-out"
              items={KITCHEN_SETUP_OPTIONS}
              index={2}
              required
              useDropdown={true}
              instructionText="How is the kitchen / service area set up today?"
              moreLabel="Choose setup"
              onSelectionChange={(set) => setKitchenSetupSelected(set)}
              error={errors.kitchenSetup}
            />
          </div>

          <div data-field="size">
            <SizeSlider
              index={3}
              required
              onSizeChange={(size) => setSizeValue(size)}
              error={errors.size}
            />
          </div>

          <div data-field="location" className="overflow-visible relative">
            <FilterCard
              title="Property Location — Hyderabad."
              items={HYDERABAD_LOCALITIES}
              index={4}
              required
              useDropdown={true}
              instructionText="Select the locality for your property"
              moreLabel="Choose locality"
              onSelectionChange={(set) => setLocationSelected(set)}
              error={errors.location}
            />
          </div>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="relative group overflow-visible"
          >
            <div data-field="mapLink" className="relative bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-[#FF5200]/30 hover:border-[#FF5200] transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[#FF5200]/50 group-hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative z-10">
                <h3
                  className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2"
                  style={{ fontFamily: fraunces.style.fontFamily }}
                >
                  Google Maps location link <span className="text-red-500 text-base sm:text-lg">*</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                  Paste a share link from Google Maps (maps.google.com, Google Maps app link, or goo.gl/maps).
                </p>
                <input
                  type="url"
                  value={mapLink}
                  onChange={(e) => setMapLink(e.target.value)}
                  disabled={formLocked}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white border-2 border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/20 outline-none transition-all duration-200 disabled:opacity-60"
                  style={{ fontFamily: plusJakarta.style.fontFamily }}
                />
                {errors.mapLink && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600">Please add a valid Google Maps link</p>
                )}
              </div>
            </div>
          </motion.section>

          <div data-field="rent">
            <RentSlider
              index={5}
              required
              onRentChange={(rent) => setRentValue(rent)}
              error={errors.rent}
            />
          </div>

          <div data-field="features" className="overflow-visible relative">
            <FilterCard
              title="Features"
              items={features}
              multi
              index={6}
              required
              useDropdown={true}
              categories={featuresCategories}
              compactCapsules
              instructionText="Choose features relevant to your cafe space"
              onSelectionChange={(set) => setFeaturesSelected(set)}
              error={errors.features}
            />
          </div>

          <div data-field="availability">
            <FilterCard
              title="Availability"
              items={availabilities}
              index={7}
              required
              onSelectionChange={(set) => setAvailabilitySelected(set)}
              error={errors.availability}
            />
          </div>
        </div>

        <AnimatePresence>
          {isFormValid && !showThanksModal && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="flex justify-center mt-8 sm:mt-10 md:mt-12 mb-6 sm:mb-8"
            >
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || formLocked}
                className="group relative px-8 py-4 sm:px-12 sm:py-5 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold overflow-hidden bg-gradient-to-r from-[#E4002B] to-[#FF5200] text-white shadow-[0_8px_24px_rgba(228,0,43,0.4)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: plusJakarta.style.fontFamily }}
                whileHover={{ scale: submitting || formLocked ? 1 : 1.05, y: submitting || formLocked ? 0 : -2 }}
                whileTap={{ scale: submitting || formLocked ? 1 : 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200] to-[#E4002B] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {submitting ? 'Submitting…' : 'Submit Requirement Match'}
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

      <div className="relative z-0 mt-8 sm:mt-10 md:mt-12 mb-6 sm:mb-8 flex justify-center px-4">
        <p
          className="max-w-3xl text-[10px] sm:text-xs md:text-sm text-gray-500 text-center leading-relaxed"
          style={{ fontFamily: plusJakarta.style.fontFamily }}
        >
          We use your preferences to instantly match your property with high-intent FnB and retail brands. Your details are kept confidential and only shared with verified matches to speed up closures.
        </p>
      </div>

      <div className="relative z-0 mt-8 sm:mt-10 md:mt-12 h-px bg-gradient-to-r from-transparent via-[#E4002B] to-transparent opacity-50"></div>
    </div>
  )
}
