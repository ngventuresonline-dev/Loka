'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  fnbPropertyTypes,
  ownerFilterPropertyTypes as propertyTypes,
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

const features = Object.values(featuresCategories).reduce<string[]>((acc, items) => acc.concat(items), [])

function isValidIndianMobile(input: string): boolean {
  const d = input.replace(/\D/g, '')
  let ten = d
  if (d.length === 12 && d.startsWith('91')) ten = d.slice(2)
  else if (d.length === 11 && d.startsWith('0')) ten = d.slice(1)
  return ten.length === 10 && /^[6-9]\d{9}$/.test(ten)
}

export default function HyderabadListPropertyPage() {
  const [ownerName, setOwnerName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [propertyTypeSelected, setPropertyTypeSelected] = useState<Set<string>>(new Set())
  const [sizeValue, setSizeValue] = useState<number>(1000)
  const [locationSelected, setLocationSelected] = useState<Set<string>>(new Set())
  const [rentValue, setRentValue] = useState<number>(100000)
  const [featuresSelected, setFeaturesSelected] = useState<Set<string>>(new Set())
  const [availabilitySelected, setAvailabilitySelected] = useState<Set<string>>(new Set())

  const [errors, setErrors] = useState({
    contactName: false,
    contactPhone: false,
    propertyType: false,
    size: false,
    location: false,
    rent: false,
    features: false,
    availability: false,
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const isFormValid =
    ownerName.trim().length > 0 &&
    isValidIndianMobile(whatsapp) &&
    propertyTypeSelected.size > 0 &&
    sizeValue > 0 &&
    locationSelected.size > 0 &&
    rentValue > 0 &&
    featuresSelected.size > 0 &&
    availabilitySelected.size > 0

  const handleSubmit = async () => {
    const newErrors = {
      contactName: ownerName.trim().length === 0,
      contactPhone: !isValidIndianMobile(whatsapp),
      propertyType: propertyTypeSelected.size === 0,
      size: sizeValue === 0,
      location: locationSelected.size === 0,
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
          propertyType: Array.from(propertyTypeSelected)[0],
          locality: Array.from(locationSelected)[0],
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
      setSubmitSuccess(true)
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
                List Your Hyderabad Property
              </h1>
              <p
                className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xl mx-auto sm:mx-0"
                style={{ fontFamily: plusJakarta.style.fontFamily }}
              >
                An established Bangalore brand is actively looking for space in Jubilee Hills. Submit your property details and we&apos;ll be in touch within 24 hours.
              </p>
            </div>
          </div>
        </motion.div>

        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8 max-w-2xl mx-auto rounded-xl border-2 border-emerald-200 bg-emerald-50/90 px-4 py-3 sm:px-5 sm:py-4 text-center sm:text-left"
            style={{ fontFamily: plusJakarta.style.fontFamily }}
          >
            <p className="text-sm sm:text-base text-emerald-900 font-medium">
              We&apos;ve received your property details. Our team will reach out within 24 hours.
            </p>
          </motion.div>
        )}

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
            className="relative group overflow-visible z-20"
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
                    Owner/Broker Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoComplete="name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    disabled={submitSuccess}
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
                    disabled={submitSuccess}
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

          <div data-field="propertyType" className="overflow-visible relative z-20">
            <FilterCard
              title="Property Type"
              items={propertyTypes}
              index={1}
              required
              useDropdown={true}
              visibleCount={fnbPropertyTypes.length}
              compactCapsules
              instructionText="Highest & Instant matches for FnB properties"
              moreLabel="Choose from more property types"
              onSelectionChange={(set) => setPropertyTypeSelected(set)}
              error={errors.propertyType}
            />
          </div>

          <div data-field="size">
            <SizeSlider
              index={2}
              required
              onSizeChange={(size) => setSizeValue(size)}
              error={errors.size}
            />
          </div>

          <div data-field="location" className="overflow-visible relative z-20">
            <FilterCard
              title="Property Location — Hyderabad."
              items={HYDERABAD_LOCALITIES}
              index={3}
              required
              useDropdown={true}
              instructionText="Select the locality for your property"
              moreLabel="Choose locality"
              onSelectionChange={(set) => setLocationSelected(set)}
              error={errors.location}
            />
          </div>

          <div data-field="rent">
            <RentSlider
              index={4}
              required
              onRentChange={(rent) => setRentValue(rent)}
              error={errors.rent}
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
              onSelectionChange={(set) => setFeaturesSelected(set)}
              error={errors.features}
            />
          </div>

          <div data-field="availability">
            <FilterCard
              title="Availability"
              items={availabilities}
              index={6}
              required
              onSelectionChange={(set) => setAvailabilitySelected(set)}
              error={errors.availability}
            />
          </div>
        </div>

        <AnimatePresence>
          {isFormValid && !submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="flex justify-center mt-8 sm:mt-10 md:mt-12 mb-6 sm:mb-8"
            >
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="group relative px-8 py-4 sm:px-12 sm:py-5 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold overflow-hidden bg-gradient-to-r from-[#E4002B] to-[#FF5200] text-white shadow-[0_8px_24px_rgba(228,0,43,0.4)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: plusJakarta.style.fontFamily }}
                whileHover={{ scale: submitting ? 1 : 1.05, y: submitting ? 0 : -2 }}
                whileTap={{ scale: submitting ? 1 : 0.95 }}
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
