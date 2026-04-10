'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { trackFilterApply } from '@/lib/tracking'
import {
  ownerFilterPropertyTypes,
  ownerFilterLocations,
  ownerFilterFeaturesCategories,
  ownerFilterAvailabilities,
} from '@/data/owner-filter-options'

type Props = {
  open: boolean
  onClose: () => void
}

export default function OwnerNewListingModal({ open, onClose }: Props) {
  const router = useRouter()
  const [propertyType, setPropertyType] = useState('')
  const [location, setLocation] = useState('')
  const [size, setSize] = useState('1000')
  const [rent, setRent] = useState('100000')
  const [deposit, setDeposit] = useState('')
  const [features, setFeatures] = useState<Set<string>>(new Set())
  const [availability, setAvailability] = useState('')
  const [attempted, setAttempted] = useState(false)

  const sizeNum = parseInt(size.replace(/[^0-9]/g, ''), 10) || 0
  const rentNum = parseInt(rent.replace(/[^0-9]/g, ''), 10) || 0

  const valid = useMemo(
    () =>
      Boolean(propertyType) &&
      Boolean(location) &&
      sizeNum > 0 &&
      rentNum > 0 &&
      features.size > 0 &&
      Boolean(availability),
    [propertyType, location, sizeNum, rentNum, features.size, availability]
  )

  const reset = useCallback(() => {
    setPropertyType('')
    setLocation('')
    setSize('1000')
    setRent('100000')
    setDeposit('')
    setFeatures(new Set())
    setAvailability('')
    setAttempted(false)
  }, [])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const toggleFeature = (f: string) => {
    setFeatures((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  const handleContinue = () => {
    setAttempted(true)
    if (!valid) return

    const filterData = {
      propertyType,
      locations: [location],
      size: sizeNum,
      rent: rentNum,
      deposit: deposit.trim(),
      features: Array.from(features),
      availability,
    }

    try {
      window.localStorage.setItem('ownerFilterData', JSON.stringify(filterData))
      window.localStorage.setItem(
        'ownerSessionData',
        JSON.stringify({
          propertyType,
          location,
          size: sizeNum,
          rent: rentNum,
          deposit: deposit.trim() || null,
          features: Array.from(features),
          availability,
          contactInfo: { name: null, email: null, phone: null },
        })
      )
    } catch (e) {
      console.error('[OwnerNewListingModal] localStorage', e)
    }

    trackFilterApply(filterData, 'owner')
    onClose()
    router.push('/onboarding/owner?prefilled=true')
  }

  if (!open) return null

  const showErr = (ok: boolean) => attempted && !ok

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-new-listing-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-[#FF5200]/5">
          <div>
            <h2 id="owner-new-listing-title" className="text-base font-semibold text-gray-900">
              New listing — property details
            </h2>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Same details as our public list flow. Next, you&apos;ll pin the exact location and add
              photos for approval.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Property type <span className="text-red-500">*</span>
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5200]/30 focus:border-[#FF5200] ${
                showErr(Boolean(propertyType)) ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="">Select type</option>
              {ownerFilterPropertyTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Area / locality <span className="text-red-500">*</span>
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5200]/30 focus:border-[#FF5200] ${
                showErr(Boolean(location)) ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="">Select area</option>
              {ownerFilterLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Size (sq ft) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={size}
                onChange={(e) => setSize(e.target.value.replace(/[^0-9]/g, ''))}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5200]/30 focus:border-[#FF5200] ${
                  showErr(sizeNum > 0) ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="e.g. 1500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Monthly rent (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={rent}
                onChange={(e) => setRent(e.target.value.replace(/[^0-9]/g, ''))}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5200]/30 focus:border-[#FF5200] ${
                  showErr(rentNum > 0) ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="e.g. 150000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Security deposit (optional)
            </label>
            <input
              type="text"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5200]/30 focus:border-[#FF5200]"
              placeholder="e.g. 3 months or ₹ amount"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Availability <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ownerFilterAvailabilities.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvailability(a)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    availability === a
                      ? 'bg-[#FF5200] text-white border-[#FF5200]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#FF5200]/50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            {showErr(Boolean(availability)) && (
              <p className="text-[11px] text-red-600 mt-1">Choose availability</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Features & amenities <span className="text-red-500">*</span>
            </label>
            <div
              className={`max-h-40 overflow-y-auto rounded-xl border p-2 space-y-2 ${
                showErr(features.size > 0) ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              {Object.entries(ownerFilterFeaturesCategories).map(([cat, items]) => (
                <div key={cat}>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide px-1 py-0.5">
                    {cat}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleFeature(f)}
                        className={`px-2 py-1 rounded-lg text-[11px] border ${
                          features.has(f)
                            ? 'bg-[#FF5200]/10 border-[#FF5200] text-[#FF5200]'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {showErr(features.size > 0) && (
              <p className="text-[11px] text-red-600 mt-1">Select at least one feature</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#FF5200] rounded-xl hover:bg-[#e64a00]"
          >
            Continue to map & photos
          </button>
        </div>
      </div>
    </div>
  )
}
