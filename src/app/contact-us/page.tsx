'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type ContactFormData = {
  name: string
  phone: string
  email: string
  bestTime: string
  additionalRequirements: string
}

const initialFormData: ContactFormData = {
  name: '',
  phone: '',
  email: '',
  bestTime: '',
  additionalRequirements: '',
}

export default function ContactUsPage() {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusMessage('')
    setStatusType('')

    if (!formData.name.trim() || !formData.phone.trim()) {
      setStatusType('error')
      setStatusMessage('Name and phone are required.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/contact-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          searchCriteria: 'Submitted from contact-us page',
        }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        throw new Error(errorPayload?.error || 'Failed to submit request')
      }

      setStatusType('success')
      setStatusMessage('Thank you! Our team will contact you within 24 hours.')
      setFormData(initialFormData)
    } catch (error) {
      console.error('Contact form submission failed:', error)
      setStatusType('error')
      setStatusMessage('We could not submit your request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/40 to-rose-50/40">
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-xl p-6 sm:p-8">
            <p className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-[#E4002B]">
              Contact Lokazen
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Get matched with the right commercial space faster.
            </h1>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Tell us your requirement and our team will connect you with shortlisted properties or qualified
              brand leads, depending on your use case.
            </p>

            <div className="mt-8 space-y-4 text-sm sm:text-base">
              <a
                href="mailto:support@lokazen.in"
                className="flex items-center gap-3 text-gray-700 hover:text-[#FF5200] transition-colors"
              >
                <span className="w-10 h-10 rounded-xl bg-[#FF5200]/10 text-[#FF5200] flex items-center justify-center">
                  @
                </span>
                support@lokazen.in
              </a>
              <a
                href="tel:+919686613899"
                className="flex items-center gap-3 text-gray-700 hover:text-[#FF5200] transition-colors"
              >
                <span className="w-10 h-10 rounded-xl bg-[#E4002B]/10 text-[#E4002B] flex items-center justify-center">
                  +91
                </span>
                +91 96866 13899
              </a>
              <p className="flex items-start gap-3 text-gray-700">
                <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                  IN
                </span>
                Kokarya Business Synergy Centre, Jayanagar, Bengaluru 560041
              </p>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-[#FF5200]/10 via-[#E4002B]/10 to-[#FF5200]/10 border border-[#FF5200]/20">
              <p className="text-sm text-gray-700">
                Looking to start right away? Use the guided flows for{' '}
                <Link href="/filter/brand" className="text-[#E4002B] font-semibold hover:underline">
                  brand search
                </Link>{' '}
                or{' '}
                <Link href="/filter/owner" className="text-[#E4002B] font-semibold hover:underline">
                  property listing
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900">Request a callback</h2>
            <p className="mt-2 text-sm text-gray-600">
              Share your details and we will reach out within 24 hours.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF5200]/30 focus:border-[#FF5200] transition-colors"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone / WhatsApp *
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF5200]/30 focus:border-[#FF5200] transition-colors"
                  placeholder="+91 98xxxxxx"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF5200]/30 focus:border-[#FF5200] transition-colors"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label htmlFor="bestTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Best time to reach you
                </label>
                <select
                  id="bestTime"
                  value={formData.bestTime}
                  onChange={(event) => setFormData((prev) => ({ ...prev, bestTime: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF5200]/30 focus:border-[#FF5200] transition-colors bg-white"
                >
                  <option value="">Select preferred slot</option>
                  <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                  <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                  <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                </select>
              </div>

              <div>
                <label htmlFor="additionalRequirements" className="block text-sm font-medium text-gray-700 mb-1">
                  What do you need help with?
                </label>
                <textarea
                  id="additionalRequirements"
                  value={formData.additionalRequirements}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, additionalRequirements: event.target.value }))
                  }
                  className="w-full min-h-28 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF5200]/30 focus:border-[#FF5200] transition-colors resize-y"
                  placeholder="Tell us your city, budget, size requirements, or expansion plans."
                />
              </div>

              {statusMessage ? (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    statusType === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {statusMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white font-semibold py-3.5 hover:from-[#E4002B] hover:to-[#FF5200] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit request'}
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
