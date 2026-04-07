'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TrustedByLeadingBrands from '@/components/TrustedByLeadingBrands'
import LogoImage from '@/components/LogoImage'
import { getBrandLogo } from '@/lib/brand-logos'
import { brandPlacements } from '@/lib/brand-placements'
import { PhonePeCheckout } from '@/components/PhonePeCheckout'

const PRIME_ZONES = ['Indiranagar', 'Koramangala', 'Whitefield', 'MG Road', 'HSR Layout', 'Brigade Road']

/** Shown in pricing, plans, process, FAQ, and CTA so brands see it consistently. */
const SUCCESS_FEE_NOTE = 'Success fee applies on deal closure'

const PROCESS_STEPS = [
  { num: '01', title: 'Choose Plan', desc: `Pick Starter, Professional, or Premium. Pay your onboarding fee and start in minutes. ${SUCCESS_FEE_NOTE} (separate from plan fees).`, color: 'FF5200' },
  { num: '02', title: 'Get Matched', desc: 'Our AI and experts curate property matches based on your requirements.', color: 'E4002B' },
  { num: '03', title: 'Visit Sites', desc: 'Schedule and attend site visits with our team (included in Professional & Premium).', color: 'FF6B35' },
  { num: '04', title: 'Close Deal', desc: `Negotiate and sign. We support you through documentation and handover. ${SUCCESS_FEE_NOTE}.`, color: '22c55e' },
]

const WHY_CHOOSE = [
  { title: 'Expert Consultancy', desc: 'Advisory from search to lease—expert guidance every step.', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { title: 'Dedicated Support', desc: 'Personal account manager on Professional and Premium plans.', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { title: 'Market Knowledge', desc: 'Deep expertise in Bangalore commercial real estate.', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { title: 'Faster Results', desc: 'Access our database and network for quicker placement.', icon: 'M13 10V3L4 14h9l-1 8 10-12h-9l1-8z' },
  { title: 'Better Deals', desc: 'Expert negotiation to secure the best terms for you.', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { title: 'Data Intelligence', desc: 'Location reports, footfall, and demographics for every property.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

const FAQ_ITEMS = [
  { q: "What's in each plan?", a: `Starter: property database access, AI matching, location reports, owner contacts, email support, 30 days. Professional adds dedicated manager, 3 site visits, negotiation support, WhatsApp, 60 days. Premium adds 24/7 priority support, unlimited site visits, legal review, multi-location, 90 days. ${SUCCESS_FEE_NOTE} (in addition to the plan fee; terms shared before you commit).` },
  { q: 'How long does it take?', a: 'Typically 2–4 weeks from onboarding to lease signing, depending on your requirements and market availability.' },
  { q: 'What fees are included?', a: `Your plan’s onboarding fee covers our placement and advisory support. ${SUCCESS_FEE_NOTE} — separate from the onboarding fee. Standard market practices (e.g. one month’s rent to property owner) may also apply at closure.` },
  { q: 'Can I upgrade?', a: 'Yes. You can upgrade anytime and pay only the difference for the new plan.' },
  { q: 'Which areas are covered?', a: 'We serve prime commercial zones in Bangalore: Indiranagar, Koramangala, Whitefield, MG Road, HSR Layout, Brigade Road, and 15+ more locations.' },
  { q: 'We run multiple outlets or a franchise—can you help?', a: 'Yes. Share your expansion roadmap, preferred micro-markets, and rollout timing. Premium is built for multi-location searches; Professional works well for a focused cluster. We align shortlists so each site fits your brand standards and ops constraints.' },
  { q: 'Do you work on exclusivity for a micro-market?', a: 'We can prioritise your search in specific corridors or wards and avoid obvious conflicts where agreed. Exact exclusivity depends on mandate scope and timing—tell us your priority catchments and we’ll confirm what we can commit to before you onboard.' },
  { q: 'What if we do not close a deal within the plan window?', a: 'Reach out to support@lokazen.in with your case reference. Extensions or upgrades depend on how far along the pipeline is; we focus on keeping momentum with fresh options and clear next steps rather than leaving you guessing.' },
]

type BrandCategory = {
  id: string
  label: string
  tagline: string
  points: string[]
  intel: string
}

const BRAND_CATEGORY_GUIDANCE: BrandCategory[] = [
  {
    id: 'fb',
    label: 'F&B & QSR',
    tagline: 'Throughput, compliance, and visibility',
    points: [
      'Frontage and evening/weekend pull often matter more than the lowest rent per sq.ft.',
      'Validate grease trap, exhaust, water load, and landlord permissions before you commit emotionally to a unit.',
      'We weigh footfall, competitor clusters, and delivery catchment when shortlisting.',
    ],
    intel: 'Peak-hour footfall, catchment spend bands, dine-in vs delivery mix, and nearby F&B density.',
  },
  {
    id: 'cafe',
    label: 'Café & bakery',
    tagline: 'Day-part rhythm and seating',
    points: [
      'Morning office traffic and weekend dwell time behave differently—micro-market choice should match your day-parts.',
      'Outdoor seating, parking, and façade character can drive trial as much as raw footfall.',
      'We look for adjacencies (offices, colleges, retail) that match your average ticket.',
    ],
    intel: 'Weekday vs weekend patterns, seating-friendly frontage, and competing cafés within walking distance.',
  },
  {
    id: 'retail',
    label: 'Retail & lifestyle',
    tagline: 'Conversion and brand adjacency',
    points: [
      'High streets vs malls trade off rent, CAM, and operating hours—your category usually has a natural fit.',
      'Co-tenancy and anchor traffic affect conversion more than headline footfall numbers alone.',
      'We shortlist with visibility, vitrine depth, and stock movement in mind—not just size.',
    ],
    intel: 'Shopping patterns, anchor draw, vitrine visibility, and category-relevant co-tenants.',
  },
  {
    id: 'beauty',
    label: 'Beauty & wellness',
    tagline: 'Privacy, appointments, and repeat visits',
    points: [
      'Upper-floor or quieter frontages can work when your model is appointment-led and parking is easy.',
      'Ceiling height, wet areas, and power for equipment need a quick ops check early.',
      'Catchment income and competitor density guide positioning for premium vs mass.',
    ],
    intel: 'Residential catchment quality, parking access, nearby salons/spas, and suitable floor plates.',
  },
  {
    id: 'services',
    label: 'Services & clinics',
    tagline: 'Access, trust, and compliance',
    points: [
      'Signage visibility and lift access matter when you are not relying on walk-in impulse.',
      'Fire NOC, usage permissions, and floor loading vary—flag your compliance needs up front.',
      'We balance rent efficiency with professional address credibility for your segment.',
    ],
    intel: 'Commute patterns for your clientele, building grade, and permissible use for your service type.',
  },
  {
    id: 'cloud',
    label: 'Cloud / delivery kitchen',
    tagline: 'Logistics over storefront',
    points: [
      'Aggregator reach, rider access, and parking for handoff beat “pretty” frontage.',
      'Load-in, storage, and hood requirements differ from a dine-in fit-out—size accordingly.',
      'We map delivery radii and competitor density to suggest practical micro-markets.',
    ],
    intel: 'Delivery heat maps (where available), rider access, ceiling height for exhaust, and dark-kitchen clusters.',
  },
]

/** Category guidance auto-rotate + progress bar (keep in sync with `category-tab-progress` in tailwind.config.js). */
const CATEGORY_TAB_ROTATE_MS = 6500

const MATCHING_INTEL_POINTS = [
  {
    title: 'Structured brief',
    desc: 'We translate your budget band, size, catchments, and non-negotiables into a searchable mandate.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: 'Curated shortlist',
    desc: 'Algorithms surface candidates; our team filters for fit, landlord appetite, and real availability.',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
  {
    title: 'Location intelligence',
    desc: 'Reports layer footfall proxies, demographics, and competitor context—so you compare apples to apples.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    title: 'What we do not claim',
    desc: 'We do not guarantee a specific rent, footfall number, or lease outcome—markets move; we stay transparent.',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
]

const COMPARE_PATHS = [
  {
    title: 'Self-search',
    subtitle: 'DIY outreach',
    rows: ['You source listings', 'Intel varies by listing', 'Time cost on your team', 'Negotiation on you'],
  },
  {
    title: 'Traditional broker',
    subtitle: 'Relationship-led',
    rows: ['Inventory depends on broker', 'Insights vary widely', 'Often success-fee heavy', 'Less productised data'],
  },
  {
    title: 'Lokazen',
    subtitle: 'Platform + experts',
    rows: ['500+ verified inventory lens', 'Location reports & matching', 'Clear plan + advisory', 'Human curation on Pro/Premium'],
    highlight: true,
  },
] as const

const READINESS_CHECKLIST = [
  'Approximate monthly rent band and security deposit comfort',
  'Size range (carpet / built-up) and frontage preferences',
  'Target micro-markets or “no-go” corridors',
  'Launch or relocation timeline and decision-maker',
  'Entity ready to sign (or timeline to incorporate)',
  'Non-negotiables: parking, hours, exhaust, loading, etc.',
]

const LEASE_BASICS: { title: string; body: string; icon: string }[] = [
  {
    title: 'Security deposit',
    body: 'Often a multiple of monthly rent; negotiate clarity on interest (if any) and refund timeline.',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    title: 'Lock-in & exit',
    body: 'Lock-in protects both sides; understand notice period, exit penalties, and fit-out amortisation clauses.',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    title: 'Rent escalation',
    body: 'Fixed step-ups vs percentage bumps—model 3–5 years so total occupancy cost is predictable.',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
  {
    title: 'CAM & charges',
    body: 'Common area maintenance and utilities can surprise—ask what is included vs billed separately.',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    title: 'Handover & fit-out',
    body: 'Shell vs warm shell, rent-free fit-out days, and who does MEP/fire baseline work.',
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  },
  {
    title: 'Permitted use',
    body: 'Ensure the agreement and building NOC align with your category—especially F&B and health.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
]

// Logo slider helpers (match homepage)
const LOGOS_WHITE_BG = ['Sun Kissed Smoothie', 'Biggies Burger', 'Truffles', 'Namaste- South Indian', 'Dolphins Bar & Kitchen', 'Samosa Party', 'Bawri']
const LOGOS_BLACK_BG = ['Sandowitch']
function needsBackgroundRemoval(brandName: string) {
  return [...LOGOS_WHITE_BG, ...LOGOS_BLACK_BG].some(
    (name) => brandName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(brandName.toLowerCase())
  )
}
function hasBlackBackground(brandName: string) {
  return LOGOS_BLACK_BG.some(
    (name) => brandName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(brandName.toLowerCase())
  )
}

const COLS_PER_ROW = 3

const DASHBOARD_MOCK_CATEGORIES = [
  {
    id: 'cafe',
    tabLabel: 'Café / Beverage',
    initial: 'C',
    title: 'Premium Café Space',
    detailLine: '12th Main, Indiranagar · 280 sqft',
    rent: '₹85,000/mo',
    bfi: 88,
  },
  {
    id: 'qsr',
    tabLabel: 'QSR / Fast Casual',
    initial: 'Q',
    title: 'Prime Corner QSR Space',
    detailLine: '17th Main, Koramangala · 450 sqft',
    rent: '₹1,55,000/mo',
    bfi: 81,
  },
  {
    id: 'salon',
    tabLabel: 'Salon & Wellness',
    initial: 'S',
    title: 'Ground Floor Retail',
    detailLine: 'HSR Layout 27th Main · 350 sqft',
    rent: '₹90,000/mo',
    bfi: 79,
  },
  {
    id: 'retail',
    tabLabel: 'Retail & Lifestyle',
    initial: 'R',
    title: 'High-Street Retail Space',
    detailLine: 'Commercial Street · 600 sqft',
    rent: '₹2,20,000/mo',
    bfi: 75,
  },
] as const

export default function ForBrandsPage() {
  const pricingRef = useRef<HTMLDivElement>(null)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [dashboardMockTab, setDashboardMockTab] = useState(0)
  const [showPremiumSoon, setShowPremiumSoon] = useState(false)
  const [phonepeOpen, setPhonepeOpen] = useState(false)
  const [phonepeRedirectUrl, setPhonepeRedirectUrl] = useState<string | null>(null)
  const [phonepeMerchantOrderId, setPhonepeMerchantOrderId] = useState<string | null>(null)
  const [phonepePlan, setPhonepePlan] = useState<'starter' | 'professional' | 'premium'>('starter')
  const [phonepeLoading, setPhonepeLoading] = useState(false)
  const [phonepeError, setPhonepeError] = useState<string | null>(null)
  const [categoryTab, setCategoryTab] = useState<string>(BRAND_CATEGORY_GUIDANCE[0]?.id ?? 'fb')
  const categoryTabRowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = window.setInterval(() => {
      setCategoryTab((prev) => {
        const idx = BRAND_CATEGORY_GUIDANCE.findIndex((c) => c.id === prev)
        const i = idx < 0 ? 0 : idx
        const next = (i + 1) % BRAND_CATEGORY_GUIDANCE.length
        return BRAND_CATEGORY_GUIDANCE[next]!.id
      })
    }, CATEGORY_TAB_ROTATE_MS)
    return () => window.clearInterval(id)
  }, [])

  /** Keep the active pill in view inside the tab row only — never scrollIntoView (that scrolls the page). */
  useEffect(() => {
    const row = categoryTabRowRef.current
    const btn = row?.querySelector<HTMLElement>(`[data-category-tab="${categoryTab}"]`)
    if (!row || !btn) return
    if (row.scrollWidth <= row.clientWidth) return

    const rowRect = row.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const btnCenter = btnRect.left + btnRect.width / 2
    const rowCenter = rowRect.left + rowRect.width / 2
    const delta = btnCenter - rowCenter
    if (Math.abs(delta) < 2) return

    row.scrollBy({ left: delta, behavior: 'smooth' })
  }, [categoryTab])

  const startPhonePePayment = async (plan: 'starter' | 'professional' | 'premium') => {
    setPhonepePlan(plan)
    setPhonepeLoading(true)
    setPhonepeError(null)
    setPhonepeRedirectUrl(null)
    setPhonepeMerchantOrderId(null)
    try {
      const res = await fetch('/api/payments/phonepe/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow: 'brand', referenceId: plan }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Payment creation failed')
      setPhonepeRedirectUrl(json.redirectUrl)
      setPhonepeMerchantOrderId(json.merchantOrderId || null)
      setPhonepeOpen(true)
    } catch (err) {
      setPhonepeError(err instanceof Error ? err.message : 'Failed to start payment')
    } finally {
      setPhonepeLoading(false)
    }
  }

  const onPhonePeConcluded = () => {
    const q = phonepeMerchantOrderId ? `?merchantOrderId=${encodeURIComponent(phonepeMerchantOrderId)}` : '?state=COMPLETED'
    window.location.href = `/payment/result${q}`
  }
  const fullCount = Math.floor(brandPlacements.length / COLS_PER_ROW) * COLS_PER_ROW
  const lastRowItems = brandPlacements.slice(fullCount)

  const scrollToPricing = () => pricingRef.current?.scrollIntoView({ behavior: 'smooth' })
  const onPremiumClick = () => setShowPremiumSoon(true)

  return (
    <main className="min-h-screen bg-white antialiased">
      <Navbar primaryCta={{ href: '/onboarding/brand', label: 'Brand Onboard' }} />

      {/* Same gradient background as homepage */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255, 82, 0, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 82, 0, 0.5) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
            animation: 'grid 40s linear infinite'
          }} />
        </div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#FF5200]/10 via-[#E4002B]/5 to-transparent rounded-full blur-[120px] animate-[float_20s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#E4002B]/8 via-[#FF6B35]/4 to-transparent rounded-full blur-[100px] animate-[float_25s_ease-in-out_infinite_5s]" />
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-gradient-to-br from-[#FF6B35]/6 via-[#FF5200]/3 to-transparent rounded-full blur-[90px] animate-[float_18s_ease-in-out_infinite_10s]" />
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 left-1/6 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_5s_ease-in-out_infinite]" />
          <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_5s_ease-in-out_infinite_1s]" />
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-[#FF6B35] to-transparent animate-[scan_5s_ease-in-out_infinite_2s]" />
          <div className="absolute top-0 right-1/6 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_5s_ease-in-out_infinite_3s]" />
        </div>
      </div>

      {/* Section 1: Hero — dark BG (from our platform / about For Brands) */}
      <div className="relative min-h-screen flex flex-col items-center pt-20 sm:pt-24 pb-16 sm:pb-20 bg-gradient-to-b from-[#0A0A0A] via-black to-[#0A0A0A] overflow-hidden border-b border-white/5" style={{ zIndex: 10 }}>
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(#FF5200 1px, transparent 1px), linear-gradient(90deg, #FF5200 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'grid 20s linear infinite',
        }} />
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-[#FF5200]/25 to-[#E4002B]/20 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-[#E4002B]/20 to-[#FF5200]/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]" />
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_4s_ease-in-out_infinite]" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_4s_ease-in-out_infinite_2s]" />
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          {[ { top: '18%', left: '12%' }, { top: '28%', left: '82%' }, { top: '55%', left: '18%' }, { top: '72%', left: '78%' }, { top: '42%', left: '88%' }, { top: '22%', left: '52%' } ].map((dot, i) => (
            <div key={i} className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] animate-pulse" style={{ top: dot.top, left: dot.left, animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>

        <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.07] backdrop-blur-xl border border-[#FF5200]/35 rounded-full mb-4 sm:mb-6 shadow-[0_0_24px_rgba(255,82,0,0.15)] opacity-0 animate-[fadeInUp_0.8s_ease-out_0.1s_forwards]">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] animate-pulse" />
            <span className="text-sm font-medium text-white">For Brands — Premium placement & advisory</span>
          </div>

          <h1 className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-2 sm:mb-2.5 md:mb-3 leading-tight tracking-tight opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards] px-2 sm:px-4">
            <span className="text-white">Find & Secure Your Perfect</span>
            <br className="block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-[length:200%_200%] animate-gradientShift">Commercial Space</span>
          </h1>
          <p className="text-center text-sm sm:text-base md:text-lg lg:text-xl text-white/70 mb-6 sm:mb-8 max-w-2xl mx-auto opacity-0 animate-[fadeInUp_0.8s_ease-out_0.25s_forwards] px-3 sm:px-4 leading-relaxed">
            Full-service property placement with dedicated expert support
          </p>

          <div className="mt-2 mb-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center opacity-0 animate-[fadeInUp_0.8s_ease-out_0.3s_forwards] px-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={scrollToPricing}
              className="relative min-h-[48px] inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold text-white bg-[#FF5200] hover:bg-[#E4002B] shadow-lg shadow-[#FF5200]/25 hover:shadow-[#FF5200]/40 hover:scale-[1.02] transition-all duration-200"
            >
              <span className="relative z-10">View Our Plans</span>
            </button>
            <Link
              href="/contact-us"
              className="min-h-[48px] inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold text-white border-2 border-white/20 bg-white/[0.06] backdrop-blur-md hover:bg-white/10 hover:border-[#FF5200]/50 transition-all duration-200"
            >
              Talk to placement team
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
            {[
              { value: '50+', label: 'Brands placed' },
              { value: '500+', label: 'Properties' },
              { value: '20+', label: 'Prime Locations' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] backdrop-blur border border-white/10">
                <span className="text-lg sm:text-xl font-bold text-[#FF5200]">{stat.value}</span>
                <span className="text-sm text-white/60">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Product Preview — below hero stats, inside dark hero */}
          <div className="mt-8 sm:mt-12 w-full max-w-5xl mx-auto px-2 sm:px-4 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.5s_forwards]">
            <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
              <div className="bg-[#1a1a1a] px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3">
                <div className="flex gap-1 sm:gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 bg-[#2a2a2a] rounded-md sm:rounded-lg px-2.5 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs text-gray-400 text-center truncate">
                  lokazen.in/dashboard/brand
                </div>
              </div>
              <div className="bg-white flex flex-col lg:flex-row min-h-0 lg:h-72 overflow-hidden">
                {(() => {
                  const mock = DASHBOARD_MOCK_CATEGORIES[dashboardMockTab] ?? DASHBOARD_MOCK_CATEGORIES[0]
                  return (
                    <>
                <div className="w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 bg-white p-3 gap-2.5 sm:p-4 sm:gap-4 flex flex-col">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#FF5200] flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">{mock.initial}</div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#0A0A0A] truncate">{mock.tabLabel}</p>
                      <p className="hidden sm:block text-[10px] text-gray-400 truncate">{mock.tabLabel}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {DASHBOARD_MOCK_CATEGORIES.map((c, i) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setDashboardMockTab(i)}
                        className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full transition-colors ${
                          i === dashboardMockTab ? 'bg-[#FF5200] text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {c.tabLabel}
                      </button>
                    ))}
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
                    <p className="text-xl sm:text-2xl font-black text-[#FF5200] leading-none">15</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">Matched properties</p>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-[8px] sm:text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Your requirements</p>
                    {[
                      ['Size', '100–300 sqft'],
                      ['Location', 'HSR, Koramangala, Indiranagar'],
                      ['Budget', '₹50K–₹1.2L/mo'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] leading-snug">
                        <span className="text-gray-400 font-medium w-12 sm:w-14 flex-shrink-0">{k}</span>
                        <span className="text-gray-700 font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-[#F8F7F4] p-3 sm:p-5 flex flex-col sm:flex-row gap-2.5 sm:gap-4 overflow-hidden min-h-0">
                  <div className="flex-1 bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 min-w-0">
                    <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs font-bold text-[#0A0A0A] leading-snug">{mock.title}</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 leading-snug">{mock.detailLine}</p>
                        <p className="text-[9px] sm:text-[10px] font-semibold text-[#FF5200] mt-0.5">{mock.rent}</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#FF5200] flex items-center justify-center flex-shrink-0">
                        <p className="text-white text-[10px] sm:text-xs font-black leading-none text-center">{mock.bfi}<br /><span className="text-[7px] sm:text-[8px]">BFI</span></p>
                      </div>
                    </div>
                    <div className="space-y-1 sm:space-y-1.5">
                      {([['Location Match', 100], ['Budget Fit', 100], ['Size Match', 100], ['Type Match', 95]] as const).map(([label, pct]) => (
                        <div key={label} className="flex items-center gap-1 sm:gap-2">
                          <span className="text-[8px] sm:text-[9px] text-gray-400 w-[4.25rem] sm:w-24 flex-shrink-0 leading-tight">{label}</span>
                          <div className="flex-1 h-1 sm:h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#FF5200] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-gray-700 w-7 text-right">{pct}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="relative mt-2 sm:mt-3">
                      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                        {([['Conservative', '₹3L'], ['Base Case', '₹5L'], ['Optimistic', '₹9L']] as const).map(([l, v]) => (
                          <div key={l} className="bg-gray-50 rounded-md sm:rounded-lg p-1.5 sm:p-2 text-center">
                            <p className="text-[7px] sm:text-[8px] text-gray-400 uppercase tracking-wide leading-tight">{l}</p>
                            <p className="text-xs sm:text-sm font-black text-[#0A0A0A] select-none" style={{ filter: 'blur(4px)' }}>{v}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-1 sm:mt-1.5 flex items-center justify-center gap-1 text-[8px] sm:text-[9px] text-gray-400 text-center">
                        <svg className="w-3 h-3 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Unlock with brand onboarding
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-44 h-28 sm:h-auto flex-shrink-0 bg-gray-100 rounded-lg sm:rounded-xl overflow-hidden relative min-h-[7rem] sm:min-h-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 176 288" preserveAspectRatio="none">
                      {[0, 40, 80, 120, 160, 200, 240, 280].map((y) => (
                        <line key={`h-${y}`} x1="0" y1={y} x2="176" y2={y} stroke="#666" strokeWidth="0.5" />
                      ))}
                      {[0, 40, 80, 120, 160].map((x) => (
                        <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="288" stroke="#666" strokeWidth="0.5" />
                      ))}
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 bg-[#FF5200] rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-[10px] font-black">{mock.bfi}</span>
                      </div>
                      <div className="w-2 h-2 bg-[#FF5200] mx-auto -mt-0.5" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                    </div>
                    {[[30, 60], [120, 100], [60, 180], [140, 200]].map(([x, y], i) => (
                      <div key={i} className="absolute w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center" style={{ left: x, top: y }}>
                        <span className="text-white text-[7px] font-bold">{75 - i * 3}</span>
                      </div>
                    ))}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2 sm:left-2 sm:right-2 bg-white/90 rounded-md sm:rounded-lg p-1 sm:p-1.5 text-center">
                      <p className="text-[7px] sm:text-[8px] font-semibold text-gray-700 leading-tight">15 matched properties</p>
                    </div>
                  </div>
                </div>
                    </>
                  )
                })()}
              </div>
            </div>
            <p className="text-center text-[11px] sm:text-xs text-white/50 mt-2 sm:mt-3 leading-snug px-1">Your personalised brand dashboard — live matches, location intelligence, revenue potential</p>
          </div>

          <div className="mt-10 flex flex-col items-center gap-2 opacity-70">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Scroll</span>
            <button type="button" onClick={scrollToPricing} className="w-8 h-8 rounded-full border-2 border-white/25 flex items-center justify-center hover:border-[#FF5200] text-white/70 hover:text-[#FF5200] transition-colors" aria-label="Scroll to plans">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF5200]/60 to-transparent opacity-60" />
      </div>

      {/* Section 2: Trusted by Leading Brands — exact copy from homepage */}
      <div className="relative z-10 mt-8 sm:mt-12 md:mt-16 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.8s_forwards]">
        <TrustedByLeadingBrands />
      </div>

      {/* Section 3: What We Do — 3 cards, homepage featured brand cards design */}
      <section className="relative z-10 bg-[#F8F7F4] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-flex items-center px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-white rounded-full mb-3 sm:mb-4 border border-gray-200/80 shadow-sm">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 sm:mr-2.5" />
              <span className="text-xs sm:text-sm font-medium text-[#0A0A0A]">What We Do</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-2 px-4">
              Full-Service <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Placement</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {([
              { title: 'AI-Powered Matching', desc: 'Access 500+ verified properties. Get personalized matches and continuous updates.', icon: 'M13 10V3L4 14h7v7l9-11h-7z', stat: '500+', statLabel: 'Properties scored' },
              { title: 'Dedicated Expert Support', desc: 'Assigned account manager, on-ground site visits, and negotiation support.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', stat: '24hr', statLabel: 'response' },
              { title: 'Market Intelligence', desc: 'Footfall, demographics, competitor mapping, and pricing insights.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', stat: '42', statLabel: 'locations enriched' },
            ] as const).map((card, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-100 border-b-4 border-b-gray-100 p-8 hover:border-[#FF5200]/30 hover:shadow-lg hover:border-b-[#FF5200] transition-all group shadow-sm"
              >
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#FF5200] transition-colors">
                  <svg className="w-6 h-6 text-[#FF5200] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} /></svg>
                </div>
                <p className="text-3xl font-black text-[#0A0A0A] mb-0.5">{card.stat}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{card.statLabel}</p>
                <h3 className="text-lg font-bold text-[#0A0A0A] mb-2">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category-wise guidance */}
      <section className="relative z-10 py-14 md:py-20 overflow-hidden bg-[#F8F7F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white border border-gray-200/80 shadow-sm mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] mr-2 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-[#0A0A0A]">By category</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-2">
              Guidance for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">your segment</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Practical lenses we use when shortlisting—so you compare locations with the right criteria, not generic buzzwords.
            </p>
          </div>
          <div
            ref={categoryTabRowRef}
            className="flex gap-2 overflow-x-auto pb-2 mb-6 md:mb-8 -mx-1 px-1 md:flex-wrap md:justify-center md:overflow-visible scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] md:[scrollbar-width:auto]"
          >
            {BRAND_CATEGORY_GUIDANCE.map((c) => {
              const active = categoryTab === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  data-category-tab={c.id}
                  onClick={() => setCategoryTab(c.id)}
                  className={`snap-start shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out border min-h-[44px] motion-safe:transition-[transform,box-shadow,background-color,border-color,color] ${
                    active
                      ? 'text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] border-transparent shadow-lg shadow-[#FF5200]/20 motion-safe:scale-[1.02]'
                      : 'text-[#0A0A0A] bg-white border-gray-200 hover:border-[#FF5200]/40 hover:shadow-md shadow-sm motion-safe:scale-100'
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
          <div
            className="mb-5 md:mb-7 max-w-full px-0.5"
            aria-hidden
          >
            <div className="relative h-1 rounded-full bg-gray-300/80 overflow-hidden">
              <div
                key={categoryTab}
                className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] motion-safe:animate-category-tab-progress motion-reduce:scale-x-100 motion-reduce:animate-none"
              />
            </div>
          </div>
          {(() => {
            const cat = BRAND_CATEGORY_GUIDANCE.find((c) => c.id === categoryTab) ?? BRAND_CATEGORY_GUIDANCE[0]
            if (!cat) return null
            return (
              <div
                key={categoryTab}
                className="relative rounded-3xl p-[1px] bg-gradient-to-br from-[#FF5200]/50 via-[#E4002B]/30 to-[#FF6B35]/40 shadow-2xl shadow-black/40 motion-safe:animate-category-reveal motion-reduce:opacity-100"
              >
                <div className="rounded-[22px] bg-gray-900/90 backdrop-blur-xl border border-white/5 overflow-hidden">
                  <div className="grid lg:grid-cols-5 gap-0">
                    <div className="lg:col-span-3 p-5 sm:p-8 md:p-10">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35] mb-1.5 sm:mb-2">{cat.label}</p>
                      <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">{cat.tagline}</h3>
                      <ul className="space-y-3 sm:space-y-4">
                        {cat.points.map((pt, i) => (
                          <li key={i} className="flex gap-2.5 sm:gap-3 text-gray-300 text-sm sm:text-base leading-relaxed">
                            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF5200]/20 to-[#E4002B]/10 border border-[#FF5200]/20 flex items-center justify-center text-[#FF5200] text-xs font-bold">{i + 1}</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="lg:col-span-2 p-5 sm:p-8 md:p-10 bg-gradient-to-br from-[#FF5200]/10 via-transparent to-[#E4002B]/5 border-t lg:border-t-0 lg:border-l border-white/10">
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-bold text-white">Intel we emphasise</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{cat.intel}</p>
                      <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/10">
                        <Link href="/contact-us" className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B35] hover:text-[#FF5200] transition-colors">
                          Discuss your brief
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* Which plan fits you */}
      <section className="relative z-10 py-14 md:py-20 bg-gradient-to-b from-white via-orange-50/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-12">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#FF5200]/10 border border-[#FF5200]/20 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5200] mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-800">Choose confidently</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Which plan <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">fits you?</span>
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto mt-2">A quick decision lens—upgrade anytime if your search gets more hands-on.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            <div className="group relative rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-gray-100 to-transparent rounded-bl-full opacity-60" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs font-bold uppercase tracking-wide mb-4">Starter</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">You know the market reasonably well</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                  You want verified inventory, AI-led matching, location reports, and owner contacts—without a heavy field programme. Ideal when you can run visits yourself and mainly need speed and data.
                </p>
                <ul className="space-y-2.5 text-sm sm:text-base text-gray-700">
                  <li className="flex gap-2"><span className="text-[#FF5200] font-bold">✓</span> Tight budget for advisory, strong internal ops</li>
                  <li className="flex gap-2"><span className="text-[#FF5200] font-bold">✓</span> Single location, clear micro-market shortlist</li>
                  <li className="flex gap-2"><span className="text-[#FF5200] font-bold">✓</span> Email-led coordination works for you</li>
                </ul>
                <button type="button" onClick={scrollToPricing} className="mt-8 w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors">
                  See Starter pricing
                </button>
              </div>
            </div>
            <div className="group relative rounded-2xl border-2 border-[#FF5200] bg-white p-8 shadow-xl shadow-[#FF5200]/10 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/5 via-transparent to-[#E4002B]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white text-[10px] font-bold uppercase tracking-wide">Most brands</div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#FF5200]/10 text-[#E4002B] text-xs font-bold uppercase tracking-wide mb-4">Professional</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">You want experts on the ground</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                  Dedicated manager, scheduled site visits, negotiation support, and WhatsApp—when the lease outcome matters as much as the shortlist.
                </p>
                <ul className="space-y-2.5 text-sm sm:text-base text-gray-700">
                  <li className="flex gap-2"><span className="text-[#FF5200] font-bold">✓</span> First flagship or high-stakes spend</li>
                  <li className="flex gap-2"><span className="text-[#FF5200] font-bold">✓</span> You value deal support, not just listings</li>
                  <li className="flex gap-2"><span className="text-[#FF5200] font-bold">✓</span> Faster alignment with stakeholders via manager</li>
                </ul>
                <button type="button" onClick={scrollToPricing} className="mt-8 w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:opacity-95 shadow-md transition-opacity">
                  See Professional pricing
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-8 max-w-xl mx-auto">
            <span className="font-semibold text-gray-700">Premium</span> suits multi-location programmes, priority support, and deeper legal review—available as we roll it out.{' '}
            <Link href="/contact-us" className="text-[#FF5200] font-medium hover:underline">Ask us</Link> if you are unsure.
          </p>
        </div>
      </section>

      {/* How matching & data work */}
      <section className="relative z-10 py-14 md:py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-12">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Under the hood</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              How <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">matching</span> works
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto mt-2">Product and people together—so you are not guessing from stale listings alone.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MATCHING_INTEL_POINTS.map((item, idx) => (
              <div key={idx} className="relative rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/80 p-6 hover:border-[#FF5200]/40 hover:shadow-lg transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center shadow-lg mb-4 group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare paths */}
      <section className="relative z-10 py-14 md:py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="absolute top-20 right-0 w-72 h-72 bg-[#FF5200]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Three ways brands <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">search</span>
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto mt-2">Same city, different trade-offs—pick what matches how you like to decide.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-stretch md:items-center">
            {COMPARE_PATHS.map((col, idx) => {
              const win = 'highlight' in col && col.highlight
              return (
                <div
                  key={idx}
                  className={`rounded-2xl p-6 sm:p-8 flex flex-col border-2 transition-all duration-300 ${
                    win
                      ? 'order-first md:order-none bg-[#0A0A0A] border-[#FF5200]/50 text-white md:scale-105 shadow-2xl shadow-black/50 z-10'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {win && (
                    <div className="text-xs font-bold uppercase tracking-wide text-[#FF5200] mb-2">Recommended</div>
                  )}
                  <h3 className={`text-xl font-bold ${win ? 'text-white' : 'text-gray-900'}`}>{col.title}</h3>
                  <p className={`text-sm mb-6 ${win ? 'text-gray-400' : 'text-gray-500'}`}>{col.subtitle}</p>
                  <ul className="space-y-3 flex-1">
                    {col.rows.map((row, i) => (
                      <li key={i} className={`flex gap-2 text-sm sm:text-base leading-snug ${win ? 'text-gray-200' : 'text-gray-700'}`}>
                        <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${win ? 'bg-[#FF5200]' : 'bg-gray-300'}`} />
                        {row}
                      </li>
                    ))}
                  </ul>
                  {win && (
                    <button
                      type="button"
                      onClick={scrollToPricing}
                      className="mt-8 w-full inline-flex items-center justify-center min-h-[48px] rounded-xl font-semibold text-white bg-[#FF5200] hover:bg-[#E4002B] transition-colors"
                    >
                      Get started →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Readiness checklist + Lease basics — aligned headers, equal visual weight */}
      <section className="relative z-10 py-14 md:py-24 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,82,0,0.2), transparent), radial-gradient(circle at 100% 100%, rgba(228,0,43,0.12), transparent 50%)',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 border border-white/10 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5200] mr-2" />
              <span className="text-xs font-semibold text-gray-200 tracking-wide">Prepare &amp; understand</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Two things <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">smart brands</span> lock early
            </h2>
            <p className="text-gray-400 text-base sm:text-lg mt-3 leading-relaxed">
              Your brief, sharpened. Lease vocabulary, demystified—so decisions stay fast and confident.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 xl:gap-12 items-stretch">
            {/* Column A — checklist */}
            <div className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 sm:p-8 lg:p-10 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF5200] to-[#E4002B] shadow-lg shadow-[#FF5200]/20">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35] mb-1">Before you onboard</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">Readiness checklist</h3>
                  <p className="text-gray-400 text-sm sm:text-base mt-2 leading-relaxed">
                    Sharpening these upfront saves weeks of back-and-forth and keeps shortlists relevant.
                  </p>
                </div>
              </div>
              <ul className="space-y-4 flex-1">
                {READINESS_CHECKLIST.map((line, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center mt-0.5 shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </span>
                    <span className="text-gray-200 text-base leading-relaxed pt-0.5">{line}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/contact-us"
                className="mt-8 sm:mt-10 inline-flex w-full sm:w-auto min-h-[52px] items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold bg-white text-gray-900 hover:bg-gray-100 shadow-xl shadow-black/20 transition-all active:scale-[0.99]"
              >
                Share your brief
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>

            {/* Column B — lease basics */}
            <div className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 sm:p-8 lg:p-10 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15">
                  <svg className="h-7 w-7 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35] mb-1">Bengaluru context</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">Commercial lease basics</h3>
                  <p className="text-gray-400 text-sm sm:text-base mt-2 leading-relaxed">
                    Orientation only—not legal advice. Have your counsel review the agreement before you sign.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
                {LEASE_BASICS.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5 hover:border-[#FF5200]/35 hover:bg-black/35 transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF5200]/15 text-[#FF6B35] group-hover:bg-[#FF5200]/25 transition-colors">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-sm sm:text-base mb-1.5">{item.title}</h4>
                        <p className="text-gray-400 text-sm sm:text-[15px] leading-relaxed">{item.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Pricing — premium cards, orange accents */}
      <section id="pricing" ref={pricingRef} className="relative z-10 py-12 md:py-16 bg-gradient-to-b from-gray-50/50 to-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 backdrop-blur-xl border border-[#FF5200]/20 rounded-full mb-3 shadow-[0_0_20px_rgba(255,82,0,0.1)]">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Plans</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Simple, transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">pricing</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mt-3 leading-relaxed">
              {SUCCESS_FEE_NOTE}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* Starter */}
            <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm flex flex-col overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200" />
              <h3 className="text-xl font-bold text-gray-900 mb-1 mt-1">Starter</h3>
              <div className="text-4xl font-black text-gray-900 mb-6">₹4,999</div>
              <ul className="space-y-3 flex-1 text-gray-600 text-sm">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Property database access</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> AI matching</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Location reports</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Owner contacts</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Email support</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> 30 days validity</li>
                <li className="flex items-center gap-2 pt-1 border-t border-gray-100 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200] flex-shrink-0" /> {SUCCESS_FEE_NOTE}</li>
              </ul>
              <button
                type="button"
                onClick={() => startPhonePePayment('starter')}
                disabled={phonepeLoading}
                className="mt-8 w-full inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 min-h-[48px] transition-all disabled:opacity-70"
              >
                {phonepeLoading && phonepePlan === 'starter' ? 'Loading…' : 'Get Started'}
              </button>
            </div>

            {/* Professional — highlighted */}
            <div className="relative bg-white rounded-2xl border-2 border-[#FF5200] p-8 shadow-xl shadow-[#FF5200]/10 flex flex-col z-10 ring-2 ring-[#FF5200] ring-offset-2 ring-offset-white overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF5200]" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white text-sm font-semibold">MOST POPULAR</div>
              <h3 className="text-xl font-bold text-gray-900 mb-1 mt-2">Professional</h3>
              <div className="text-4xl font-black text-gray-900 mb-6">₹9,999</div>
              <ul className="space-y-3 flex-1 text-gray-600 text-sm">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Everything in Starter</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Dedicated account manager</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> On-ground site visits</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Negotiation support</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Deal assistance</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> WhatsApp support</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> 60 days validity</li>
                <li className="flex items-center gap-2 pt-1 border-t border-gray-100 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200] flex-shrink-0" /> {SUCCESS_FEE_NOTE}</li>
              </ul>
              <button
                type="button"
                onClick={() => startPhonePePayment('professional')}
                disabled={phonepeLoading}
                className="mt-8 w-full inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-white bg-[#FF5200] hover:bg-[#E4002B] shadow-lg min-h-[48px] transition-all disabled:opacity-70"
              >
                {phonepeLoading && phonepePlan === 'professional' ? 'Loading…' : 'Get Started'}
              </button>
            </div>

            {/* Premium */}
            <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm flex flex-col overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#0A0A0A]" />
              <h3 className="text-xl font-bold text-gray-900 mb-1 mt-1">Premium</h3>
              <div className="text-4xl font-black text-gray-900 mb-6">₹19,999</div>
              <ul className="space-y-3 flex-1 text-gray-600 text-sm">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Everything in Professional</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> 24/7 priority support</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Unlimited site visits</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Legal document review</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Post-lease support</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Multi-location search</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> 90 days validity</li>
                <li className="flex items-center gap-2 pt-1 border-t border-gray-100 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200] flex-shrink-0" /> {SUCCESS_FEE_NOTE}</li>
              </ul>
              <button type="button" onClick={onPremiumClick} className="mt-8 w-full inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 min-h-[48px] transition-all">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Launching soon toast for Premium */}
      {showPremiumSoon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowPremiumSoon(false)} role="dialog" aria-label="Launching soon">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <p className="text-xl font-bold text-gray-900 mb-2">Launching soon</p>
            <p className="text-gray-600 text-sm mb-6">Premium plan is coming. Stay tuned.</p>
            <button type="button" onClick={() => setShowPremiumSoon(false)} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:opacity-95">
              OK
            </button>
          </div>
        </div>
      )}

      {/* Section 5: Process Timeline — 4 steps, homepage How it works card style */}
      <section className="relative z-10 bg-gradient-to-b from-white via-gray-50/30 to-white py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-20 w-96 h-96 bg-gradient-to-br from-[#FF5200]/5 to-transparent rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite]" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-gradient-to-br from-[#E4002B]/5 to-transparent rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]" />
        </div>
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-flex items-center px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-white/80 backdrop-blur-xl border border-[#FF5200]/20 rounded-full mb-3 md:mb-5 shadow-[0_0_20px_rgba(255,82,0,0.1)]">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Process</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              From plan to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">placement</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 lg:gap-6">
            {PROCESS_STEPS.map((step, idx) => (
              <div key={idx} className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#FF5200] hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF5200]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform flex-shrink-0 ${step.color === '22c55e' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-[#FF5200] to-[#E4002B]'}`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {idx === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />}
                      {idx === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
                      {idx === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />}
                      {idx === 3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-3xl font-black ${step.color === '22c55e' ? 'text-green-600' : ''}`} style={step.color !== '22c55e' ? { color: `#${step.color}` } : undefined}>{step.num}</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-[#FF5200]/30 to-transparent" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Service Areas */}
      <section className="relative z-10 bg-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Service areas</h2>
          <p className="text-gray-600 mb-8">Prime zones we serve</p>
          <div className="flex flex-wrap justify-center gap-3">
            {PRIME_ZONES.map((zone) => (
              <span key={zone} className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                {zone}
              </span>
            ))}
            <span className="px-4 py-2 rounded-full bg-[#FF5200]/10 text-gray-800 text-sm font-medium border border-[#FF5200]/20">
              + 15 more commercial locations
            </span>
          </div>
        </div>
      </section>

      {/* Section 7: Recent Placements — all 12 in one view: one row on desktop, two on tablet */}
      <section className="relative z-10 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-8 md:py-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{
          backgroundImage: 'linear-gradient(rgba(255,82,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,82,0,0.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute top-1/3 left-0 w-72 h-72 bg-[#FF5200]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-0 w-72 h-72 bg-[#E4002B]/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-4 md:mb-5">
            <div className="inline-flex items-center px-3 py-1.5 bg-white/10 backdrop-blur rounded-full mb-2 border border-[#FF5200]/25">
              <span className="w-1.5 h-1.5 bg-[#FF5200] rounded-full mr-2" />
              <span className="text-xs sm:text-sm font-medium text-white">Few of our recent placements</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
              Brands we&apos;ve <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">placed</span>
            </h2>
            <p className="text-sm text-gray-400">Across Bangalore</p>
          </div>
          {/* 3 per line; last row (if fewer than 3) is center-aligned */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {brandPlacements.slice(0, fullCount).map((p, idx) => (
              <div
                key={`${p.brand}-${p.location}-${idx}`}
                className="group rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700/80 hover:border-[#FF5200]/50 hover:bg-gray-800/80 transition-all duration-200 p-2 sm:p-2.5"
              >
                <div className="flex flex-col items-center text-center min-w-0">
                  {getBrandLogo(p.brand) ? (
                    <div className="h-8 sm:h-9 w-full flex items-center justify-center mb-1.5 flex-shrink-0">
                      <LogoImage
                        src={getBrandLogo(p.brand)!}
                        alt={p.brand}
                        brandName={p.brand}
                        style={{ height: '32px', minHeight: '32px', maxHeight: '36px' }}
                        shouldRemoveBg={needsBackgroundRemoval(p.brand)}
                        hasBlackBackground={hasBlackBackground(p.brand)}
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-gray-700/80 flex items-center justify-center font-bold text-white text-xs mb-1.5 flex-shrink-0">
                      {p.brand.charAt(0)}
                    </div>
                  )}
                  <p className="font-semibold text-white text-[11px] sm:text-xs truncate w-full leading-tight" title={p.brand}>{p.brand}</p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 truncate w-full" title={p.location}>{p.location}</p>
                  <p className="text-[10px] sm:text-[11px] text-[#FF5200] font-medium mt-0.5">{p.size}</p>
                </div>
              </div>
            ))}
          </div>
          {lastRowItems.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-2 sm:mt-3">
              {lastRowItems.map((p, idx) => (
                <div
                  key={`last-${p.brand}-${p.location}-${idx}`}
                  className="group rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700/80 hover:border-[#FF5200]/50 hover:bg-gray-800/80 transition-all duration-200 p-2 sm:p-2.5 min-w-0 w-full max-w-[calc((100%-1rem)/3)] sm:max-w-[calc((100%-1.5rem)/3)]"
                >
                  <div className="flex flex-col items-center text-center min-w-0">
                    {getBrandLogo(p.brand) ? (
                      <div className="h-8 sm:h-9 w-full flex items-center justify-center mb-1.5 flex-shrink-0">
                        <LogoImage
                          src={getBrandLogo(p.brand)!}
                          alt={p.brand}
                          brandName={p.brand}
                          style={{ height: '32px', minHeight: '32px', maxHeight: '36px' }}
                          shouldRemoveBg={needsBackgroundRemoval(p.brand)}
                          hasBlackBackground={hasBlackBackground(p.brand)}
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-gray-700/80 flex items-center justify-center font-bold text-white text-xs mb-1.5 flex-shrink-0">
                        {p.brand.charAt(0)}
                      </div>
                    )}
                    <p className="font-semibold text-white text-[11px] sm:text-xs truncate w-full leading-tight" title={p.brand}>{p.brand}</p>
                    <p className="text-[10px] sm:text-[11px] text-gray-400 truncate w-full" title={p.location}>{p.location}</p>
                    <p className="text-[10px] sm:text-[11px] text-[#FF5200] font-medium mt-0.5">{p.size}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 7b: Brands we're currently placing */}
      <section className="relative z-10 bg-white py-10 md:py-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center px-3 py-1.5 bg-[#FF5200]/10 rounded-full mb-2 border border-[#FF5200]/20">
              <span className="w-1.5 h-1.5 bg-[#FF5200] rounded-full mr-2 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Currently placing</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              Brands we&apos;re <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">placing now</span>
            </h2>
            <p className="text-sm text-gray-500">Active searches across prime locations</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              'Truffles',
              'Namaste',
              'Boba Bhai',
              'Original Burger Co',
              'Mumbai Pav Co.',
              'Kried',
              'Sandowitch',
              'Block Two Coffee',
            ].map((brandName) => (
              <div
                key={brandName}
                className="rounded-xl bg-gray-50 border border-gray-200 hover:border-[#FF5200]/40 hover:shadow-md transition-all duration-200 p-4 flex flex-col items-center text-center"
              >
                {getBrandLogo(brandName) ? (
                  <div className={`h-12 w-full flex items-center justify-center mb-3 flex-shrink-0 ${brandName === 'Block Two Coffee' ? 'grayscale' : ''}`}>
                    <LogoImage
                      src={getBrandLogo(brandName)!}
                      alt={brandName}
                      brandName={brandName}
                      style={{ height: '48px', minHeight: '48px', maxHeight: '48px' }}
                      shouldRemoveBg={brandName === 'Sandowitch' ? false : needsBackgroundRemoval(brandName)}
                      hasBlackBackground={false}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-lg mb-3 flex-shrink-0">
                    {brandName.charAt(0)}
                  </div>
                )}
                <p className="font-semibold text-gray-900 text-sm leading-tight" title={brandName}>{brandName}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: Why Choose Us — 6 icon cards */}
      <section className="relative z-10 bg-gradient-to-b from-white via-gray-50/30 to-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Choose Us</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {WHY_CHOOSE.map((item, idx) => (
              <div key={idx} className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#FF5200] hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200]/10 to-[#E4002B]/10 rounded-xl flex items-center justify-center text-[#FF5200] flex-shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 9: FAQ — accordion, homepage card style + expandable */}
      <section className="relative z-10 bg-white py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">FAQ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Got <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Questions?</span>
            </h2>
          </div>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, idx) => (
              <div
                key={idx}
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className={`group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border p-4 sm:p-5 min-h-[56px] transition-all duration-300 cursor-pointer overflow-hidden ${faqOpen === idx ? 'border-[#FF5200] shadow-lg' : 'border-gray-200 hover:border-[#FF5200]'}`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start gap-3 relative z-10">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 mb-1.5">{faq.q}</h3>
                    <div className={`overflow-hidden transition-all duration-300 ${faqOpen === idx ? 'max-h-96' : 'max-h-0'}`}>
                      <p className="text-sm text-gray-600 leading-relaxed pt-1">{faq.a}</p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5 transition-transform duration-300 ${faqOpen === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 10: Final CTA — full-width gradient, 3 pricing buttons */}
      <section className="relative z-10 py-12 md:py-16 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(255,82,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,82,0,0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to find your perfect commercial space?
          </h2>
          <p className="text-gray-300 mb-8 sm:mb-10 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Join brands who secured their ideal locations with Lokazen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center flex-wrap">
            <button
              type="button"
              onClick={() => startPhonePePayment('starter')}
              disabled={phonepeLoading}
              className="w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-gray-800 bg-gray-200 hover:bg-gray-100 border border-gray-300 min-h-[48px] transition-all disabled:opacity-70"
            >
              Starter — ₹4,999
            </button>
            <button
              type="button"
              onClick={() => startPhonePePayment('professional')}
              disabled={phonepeLoading}
              className="w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:opacity-95 shadow-lg min-h-[48px] transition-all disabled:opacity-70"
            >
              Professional — ₹9,999
            </button>
            <button type="button" onClick={onPremiumClick} className="w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-gray-800 bg-gray-200 hover:bg-gray-100 border border-gray-300 min-h-[48px] transition-all">
              Premium — ₹19,999
            </button>
            <Link
              href="/contact-us"
              className="w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-white border-2 border-white/30 bg-white/5 hover:bg-white/10 min-h-[48px] transition-all"
            >
              Book a conversation
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-6 max-w-lg mx-auto leading-relaxed">
            Secure payment • No hidden plan fees • {SUCCESS_FEE_NOTE}
          </p>
          {phonepeError && (
            <p className="mt-2 text-sm text-red-400">{phonepeError}</p>
          )}
        </div>
      </section>

      <PhonePeCheckout
        redirectUrl={phonepeRedirectUrl}
        open={phonepeOpen}
        onClose={() => { setPhonepeOpen(false); setPhonepeRedirectUrl(null); setPhonepeMerchantOrderId(null) }}
        onConcluded={onPhonePeConcluded}
        onCancel={() => setPhonepeOpen(false)}
      />

      <Footer />
    </main>
  )
}

