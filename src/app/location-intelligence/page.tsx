'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { PhonePeCheckout } from '@/components/PhonePeCheckout'
import { useAuth } from '@/contexts/AuthContext'
import dynamic from 'next/dynamic'
const BrandIntelligenceMap = dynamic(() => import('@/components/BrandIntelligenceMap'), { ssr: false })

type PreviewFootfall = {
  dailyAverage: number
  peakHours: string[]
  weekendBoost: number
}

type PreviewMarket = {
  saturationLevel: 'low' | 'medium' | 'high'
  competitorCount: number
  summary: string
}

type PreviewScores = {
  revenueProjectionMonthly?: number
}

type PreviewDemographics = {
  ageGroups: { range: string; percentage: number }[]
  incomeLevel: 'low' | 'medium' | 'high' | 'mixed'
}

type LocationIntelPreview = {
  footfall: PreviewFootfall
  market: PreviewMarket
  scores?: PreviewScores
  demographics: PreviewDemographics
}

// Per-address intelligence report form is hidden until the Mappls backend
// is wired up. Flip this flag to true to bring back the search form,
// preview panel, and payment modal.
const SHOW_INTELLIGENCE_REPORT_FORM = false

export default function LocationIntelligencePage() {
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')
  const [hasUsedFreeSearch, setHasUsedFreeSearch] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [preview, setPreview] = useState<LocationIntelPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [phonepeRedirectUrl, setPhonepeRedirectUrl] = useState<string | null>(null)
  const [phonepeMerchantOrderId, setPhonepeMerchantOrderId] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const { user, isLoggedIn } = useAuth()
  const isAdmin = isLoggedIn && user?.userType === 'admin'

  function mapCategoryToTypes(cat: string): { propertyType?: string; businessType?: string } {
    const c = cat.toLowerCase()
    if (c.includes('f&b') || c.includes('restaurant') || c.includes('cafe')) {
      return { propertyType: 'restaurant', businessType: 'restaurant' }
    }
    if (c.includes('salon') || c.includes('spa') || c.includes('fitness') || c.includes('retail')) {
      return { propertyType: 'retail', businessType: 'retail' }
    }
    if (c.includes('office')) {
      return { propertyType: 'office', businessType: 'office' }
    }
    if (c.includes('health')) {
      return { propertyType: 'retail', businessType: 'healthcare' }
    }
    return { propertyType: 'retail', businessType: undefined }
  }

  async function runPreview() {
    setPreviewLoading(true)
    setPreviewError(null)
    setShowPreview(true)
    setPreview(null)

    try {
      const { propertyType, businessType } = mapCategoryToTypes(category)
      const res = await fetch('/api/location-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: location,
          city: '',
          state: '',
          propertyType,
          businessType,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.data) {
        throw new Error(json?.error || 'Failed to load intelligence')
      }
      const data = json.data
      const footfall: PreviewFootfall = {
        dailyAverage: data.footfall?.dailyAverage ?? 0,
        peakHours: data.footfall?.peakHours ?? [],
        weekendBoost: data.footfall?.weekendBoost ?? 0,
      }
      const market: PreviewMarket = {
        saturationLevel: data.market?.saturationLevel ?? 'medium',
        competitorCount: data.market?.competitorCount ?? 0,
        summary: data.market?.summary ?? 'Market summary not available.',
      }
      const scores: PreviewScores | undefined = data.scores
        ? { revenueProjectionMonthly: data.scores.revenueProjectionMonthly }
        : undefined
      const demographics: PreviewDemographics = {
        ageGroups: data.demographics?.ageGroups ?? [],
        incomeLevel: data.demographics?.incomeLevel ?? 'mixed',
      }
      setPreview({ footfall, market, scores, demographics })
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to load intelligence')
    } finally {
      setPreviewLoading(false)
    }
  }

  const categories = ['Retail', 'F&B', 'Salon & Spa', 'Fitness', 'Office Space', 'Healthcare']

  const handleSearch = async () => {
    if (!location || !category) return

    // Admins can explore intelligence without paywall or free-search limits
    if (isAdmin) {
      await runPreview()
      setHasUsedFreeSearch(false)
      setShowPaymentModal(false)
      return
    }

    const usedFree = localStorage.getItem('usedFreeLocationSearch')

    if (!usedFree) {
      await runPreview()
      localStorage.setItem('usedFreeLocationSearch', 'true')
      setHasUsedFreeSearch(false)
    } else {
      setHasUsedFreeSearch(true)
      setShowPaymentModal(true)
    }
  }

  const startPayment = async () => {
    setPaymentLoading(true)
    setPaymentError(null)
    setPhonepeRedirectUrl(null)
    setPhonepeMerchantOrderId(null)
    try {
      const pendingRes = await fetch('/api/location-reports/create-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, category }),
      })
      const pendingJson = await pendingRes.json()
      if (!pendingJson.success) throw new Error(pendingJson.error || 'Failed to create report')

      const payRes = await fetch('/api/payments/phonepe/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow: 'report',
          referenceId: pendingJson.reportId,
          amountInr: 4999,
        }),
      })
      const payJson = await payRes.json()
      if (!payJson.success) throw new Error(payJson.error || 'Payment creation failed')
      setPhonepeRedirectUrl(payJson.redirectUrl)
      setPhonepeMerchantOrderId(payJson.merchantOrderId || null)
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Failed to start payment')
    } finally {
      setPaymentLoading(false)
    }
  }

  const onPhonePeConcluded = () => {
    const q = phonepeMerchantOrderId
      ? `?merchantOrderId=${encodeURIComponent(phonepeMerchantOrderId)}`
      : '?state=COMPLETED'
    window.location.href = `/payment/result${q}`
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Futuristic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0 animate-gridScroll"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255, 82, 0, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 82, 0, 0.3) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[#FF5200]/20 rounded-full blur-[150px] animate-[float_15s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#E4002B]/20 rounded-full blur-[150px] animate-[float_20s_ease-in-out_infinite_5s]" />
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent animate-scanLine" />
          <div
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#E4002B] to-transparent animate-scanLine"
            style={{ top: '30%', animationDelay: '2s' }}
          />
        </div>
      </div>

      <Navbar />

      <div className="relative z-10 min-h-screen">
        <div className="pt-24 sm:pt-28 md:pt-32 lg:pt-36 xl:pt-40 pb-16 sm:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero */}
            <div className="text-center mb-16">
              {SHOW_INTELLIGENCE_REPORT_FORM && (
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#FF5200]/10 to-[#E4002B]/10 border border-[#FF5200]/30 rounded-full mb-6 backdrop-blur-xl">
                  <span className="w-2 h-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-3 animate-pulse shadow-[0_0_10px_rgba(255,82,0,1)]" />
                  <span className="text-sm font-semibold bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">
                    {isAdmin ? 'Unlimited access for admins' : 'First Search FREE for brands & owners'}
                  </span>
                </div>
              )}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="text-white whitespace-nowrap">Make</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] animate-gradientShift bg-[length:200%_200%] whitespace-nowrap">
                  Data-Driven
                </span>
                <br />
                <span className="text-white whitespace-nowrap">Location&nbsp;Decisions</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-6 sm:mb-8 px-4 sm:px-0">
                Access real-time market intelligence, foot traffic patterns, and competitive analysis
                before you commit to any location.
              </p>
            </div>

            {/* Search */}
            {SHOW_INTELLIGENCE_REPORT_FORM && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="relative group">
                <div className="absolute -inset-[2px] bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] rounded-3xl opacity-50 group-hover:opacity-100 blur-sm transition-all duration-700 animate-gradientShift bg-[length:200%_200%]" />
                <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl p-8 border border-[#FF5200]/20">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Enter Location or Address
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Koramangala, Bangalore or specific address..."
                          className="w-full bg-black/50 border border-[#FF5200]/30 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5200] focus:shadow-[0_0_20px_rgba(255,82,0,0.3)] transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Select Business Category
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={
                              'px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 border-2 ' +
                              (category === cat
                                ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] border-[#FF5200] text-white shadow-[0_0_20px_rgba(255,82,0,0.5)]'
                                : 'bg-black/30 border-[#FF5200]/20 text-gray-400 hover:border-[#FF5200]/50 hover:text-white')
                            }
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={!location || !category}
                      className="w-full py-5 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] text-white rounded-xl font-bold text-lg hover:shadow-[0_0_40px_rgba(255,82,0,0.6)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] relative overflow-hidden group"
                    >
                      <span className="relative z-10">Generate Intelligence Report</span>
                    </button>
                    <p className="text-center text-sm text-gray-500">
                      🎁{' '}
                      {isAdmin
                        ? 'You are logged in as admin – no charges applied.'
                        : 'First search is completely free • Detailed reports from ₹4,999 for brands & other users.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Preview */}
            {SHOW_INTELLIGENCE_REPORT_FORM && showPreview && (
              <div className="max-w-5xl mx-auto mb-20">
                <div className="bg-black/60 border border-[#FF5200]/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
                  {/* ... preview content unchanged ... */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BrandIntelligenceMap />

      {/* Payment modal */}
      {SHOW_INTELLIGENCE_REPORT_FORM && !isAdmin && showPaymentModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-gray-900 border border-[#FF5200]/30 p-6">
            {/* ... modal content unchanged ... */}
          </div>
        </div>
      )}

      {SHOW_INTELLIGENCE_REPORT_FORM && (
        <PhonePeCheckout
          redirectUrl={phonepeRedirectUrl}
          open={!!phonepeRedirectUrl}
          onClose={() => {
            setPhonepeRedirectUrl(null)
            setPhonepeMerchantOrderId(null)
          }}
          onConcluded={onPhonePeConcluded}
          onCancel={() => setPhonepeRedirectUrl(null)}
        />
      )}
    </div>
  )
}
