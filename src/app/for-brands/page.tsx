'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TrustedByLeadingBrands from '@/components/TrustedByLeadingBrands'
import LogoImage from '@/components/LogoImage'
import { getBrandLogo } from '@/lib/brand-logos'
import { brandPlacements } from '@/lib/brand-placements'

const CASHFREE_STARTER = process.env.NEXT_PUBLIC_CASHFREE_LINK_STARTER || 'https://payments.cashfree.com/forms/BrandRegistration'
const CASHFREE_PRO = process.env.NEXT_PUBLIC_CASHFREE_LINK_PRO || 'https://payments.cashfree.com/forms/ProfessionalPackage'
const CASHFREE_PREMIUM = process.env.NEXT_PUBLIC_CASHFREE_LINK_PREMIUM || '/onboarding/brand?plan=premium'

const PRIME_ZONES = ['Indiranagar', 'Koramangala', 'Whitefield', 'MG Road', 'HSR Layout', 'Brigade Road']

const PROCESS_STEPS = [
  { num: '01', title: 'Choose Plan', desc: 'Pick Starter, Professional, or Premium. Pay your service fee and onboard in minutes.', color: 'FF5200' },
  { num: '02', title: 'Get Matched', desc: 'Our AI and experts curate property matches based on your requirements.', color: 'E4002B' },
  { num: '03', title: 'Visit Sites', desc: 'Schedule and attend site visits with our team (included in Professional & Premium).', color: 'FF6B35' },
  { num: '04', title: 'Close Deal', desc: 'Negotiate and sign. We support you through documentation and handover.', color: '22c55e' },
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
  { q: "What's in each plan?", a: 'Starter: property database access, AI matching, location reports, owner contacts, email support, 30 days. Professional adds dedicated manager, 3 site visits, negotiation support, WhatsApp, 60 days. Premium adds 24/7 priority support, unlimited site visits, legal review, multi-location, 90 days.' },
  { q: 'How long does it take?', a: 'Typically 2–4 weeks from onboarding to lease signing, depending on your requirements and market availability.' },
  { q: 'What fees are included?', a: 'Your plan’s service fee covers our placement and advisory support. A success fee may apply on deal closure. Standard market practices (e.g. one month’s rent to property owner) may also apply at closure.' },
  { q: 'Can I upgrade?', a: 'Yes. You can upgrade anytime and pay only the difference for the new plan.' },
  { q: 'Which areas are covered?', a: 'We serve prime commercial zones in Bangalore: Indiranagar, Koramangala, Whitefield, MG Road, HSR Layout, Brigade Road, and 15+ more locations.' },
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

const COLS_LG = 12

export default function ForBrandsPage() {
  const pricingRef = useRef<HTMLDivElement>(null)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [showPremiumSoon, setShowPremiumSoon] = useState(false)
  const fullCount = Math.floor(brandPlacements.length / COLS_LG) * COLS_LG
  const lastRowItems = brandPlacements.slice(fullCount)

  const scrollToPricing = () => pricingRef.current?.scrollIntoView({ behavior: 'smooth' })
  const onPremiumClick = () => setShowPremiumSoon(true)

  return (
    <main className="min-h-screen bg-white antialiased">
      <Navbar />

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
      <div className="relative min-h-screen flex flex-col items-center justify-center pt-20 sm:pt-24 pb-16 sm:pb-20 bg-gradient-to-b from-gray-900 via-black to-gray-900 overflow-hidden" style={{ zIndex: 10 }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(#FF5200 1px, transparent 1px), linear-gradient(90deg, #FF5200 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'grid 20s linear infinite',
        }} />
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-[#FF5200]/30 to-[#E4002B]/30 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-[#E4002B]/30 to-[#FF6B35]/30 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]" />
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_4s_ease-in-out_infinite]" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_4s_ease-in-out_infinite_2s]" />
        </div>
        {/* Floating dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
          {[ { top: '18%', left: '12%' }, { top: '28%', left: '82%' }, { top: '55%', left: '18%' }, { top: '72%', left: '78%' }, { top: '42%', left: '88%' }, { top: '22%', left: '52%' } ].map((dot, i) => (
            <div key={i} className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] animate-pulse" style={{ top: dot.top, left: dot.left, animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>

        <div className="relative text-center max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 w-full py-6 sm:py-8 md:py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-[#FF5200]/30 rounded-full mb-4 sm:mb-6 shadow-[0_0_20px_rgba(255,82,0,0.2)] opacity-0 animate-[fadeInUp_0.8s_ease-out_0.1s_forwards]">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] animate-pulse" />
            <span className="text-sm font-medium text-white">For Brands — Premium placement & advisory</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-2 sm:mb-2.5 md:mb-3 leading-tight tracking-tight opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards] px-2 sm:px-4">
            <span className="text-white">Find & Secure Your Perfect</span>
            <br className="block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] bg-[length:200%_200%] animate-gradientShift">Commercial Space</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto opacity-0 animate-[fadeInUp_0.8s_ease-out_0.25s_forwards] px-3 sm:px-4">
            Full-service property placement with dedicated expert support
          </p>

          <div className="mt-2 mb-10 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.3s_forwards]">
            <button
              onClick={scrollToPricing}
              className="relative inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:shadow-xl hover:shadow-[#FF5200]/40 hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <span className="relative z-10">View Our Plans</span>
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
            {[
              { value: '50+', label: 'Brands placed' },
              { value: '500+', label: 'Properties' },
              { value: '20+', label: 'Prime Locations' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/10">
                <span className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">{stat.value}</span>
                <span className="text-sm text-gray-400">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 sm:mt-14 flex flex-wrap justify-center items-center gap-4 sm:gap-6 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.5s_forwards]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 border border-[#FF5200]/30 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF5200]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8 4-8-4m0 0l8-4 8 4m0-6v8l-8 4m8-4l8-4m-8 4V3" /></svg>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-8 h-0.5 bg-gradient-to-r from-[#FF5200]/60 to-[#E4002B]/60 rounded-full" />
              <span className="w-2 h-2 rounded-full bg-[#FF5200] animate-pulse" />
              <span className="w-12 h-0.5 bg-gradient-to-r from-[#E4002B]/60 to-[#FF5200]/60 rounded-full" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 border border-[#E4002B]/30 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#E4002B]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2 21v-2a4 4 0 014-4h12a4 4 0 014 4v2M4 7v10h16V7M4 7h16a2 2 0 00-2-2H6a2 2 0 00-2 2v10" /></svg>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500 hidden sm:inline">AI-matched</span>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scroll</span>
          <button onClick={scrollToPricing} className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center hover:border-[#FF5200] text-white/80 hover:text-[#FF5200] transition-colors" aria-label="Scroll to plans">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent opacity-50" />
      </div>

      {/* Section 2: Trusted by Leading Brands — exact copy from homepage */}
      <div className="relative z-10 mt-8 sm:mt-12 md:mt-16 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.8s_forwards]">
        <TrustedByLeadingBrands />
      </div>

      {/* Section 3: What We Do — 3 cards, homepage featured brand cards design */}
      <section className="relative z-10 bg-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-flex items-center px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-gray-50 rounded-full mb-3 sm:mb-4 border border-gray-200">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 sm:mr-2.5" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">What We Do</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 px-4">
              Full-Service <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Placement</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              { title: 'AI-Powered Matching', desc: 'Access 500+ verified properties. Get personalized matches and continuous updates.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { title: 'Dedicated Expert Support', desc: 'Assigned account manager, on-ground site visits, and negotiation support.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
              { title: 'Market Intelligence', desc: 'Footfall, demographics, competitor mapping, and pricing insights.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            ].map((card, idx) => (
              <div key={idx} className="relative group">
                <div className="relative bg-white backdrop-blur-xl rounded-2xl p-6 border-2 border-gray-200 hover:border-[#FF5200] overflow-hidden shadow-lg hover:shadow-[#FF5200]/30 transition-all duration-500">
                  <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl z-20" style={{ background: 'linear-gradient(to right, #FF5200, #E4002B, #FF6B35)' }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/40 to-transparent rounded-bl-full" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-105 transition-transform">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} /></svg>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{card.desc}</p>
                  </div>
                  <div className="absolute inset-0 rounded-2xl border-2 border-[#FF5200] opacity-0 group-hover:opacity-100 group-hover:animate-ping pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Pricing — premium cards, orange accents */}
      <section id="pricing" ref={pricingRef} className="relative z-10 py-12 md:py-16 bg-gradient-to-b from-gray-50/50 to-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 backdrop-blur-xl border border-[#FF5200]/20 rounded-full mb-3 shadow-[0_0_20px_rgba(255,82,0,0.1)]">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Plans</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Simple, transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">pricing</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* Starter */}
            <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#FF5200] to-[#E4002B]" />
              <h3 className="text-xl font-bold text-gray-900 mb-1">Starter</h3>
              <div className="text-4xl font-black text-gray-900 mb-6">₹4,999</div>
              <ul className="space-y-3 flex-1 text-gray-600 text-sm">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Property database access</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> AI matching</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Location reports</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Owner contacts</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Email support</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> 30 days validity</li>
              </ul>
              <Link href={CASHFREE_STARTER} className="mt-8 w-full inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 min-h-[48px] transition-all">
                Get Started
              </Link>
            </div>

            {/* Professional — highlighted */}
            <div className="relative bg-white rounded-2xl border-2 border-[#FF5200] p-8 shadow-xl shadow-[#FF5200]/10 flex flex-col lg:-my-2 lg:scale-[1.02] z-10">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35]" />
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
              </ul>
              <Link href={CASHFREE_PRO} className="mt-8 w-full inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:opacity-95 shadow-lg min-h-[48px] transition-all">
                Get Started
              </Link>
            </div>

            {/* Premium */}
            <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#FF5200] to-[#E4002B]" />
              <h3 className="text-xl font-bold text-gray-900 mb-1">Premium</h3>
              <div className="text-4xl font-black text-gray-900 mb-6">₹19,999</div>
              <ul className="space-y-3 flex-1 text-gray-600 text-sm">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Everything in Professional</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> 24/7 priority support</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Unlimited site visits</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Legal document review</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Post-lease support</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> Multi-location search</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5200]" /> 90 days validity</li>
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
          {/* Full rows in grid; last row in flex so Wrapafella, Minibe, MPC stay on one line with no empty gap */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 sm:gap-3">
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
            <div className="flex flex-nowrap justify-center gap-2 sm:gap-3 mt-2 sm:mt-3">
              {lastRowItems.map((p, idx) => (
                <div
                  key={`last-${p.brand}-${p.location}-${idx}`}
                  className="group rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700/80 hover:border-[#FF5200]/50 hover:bg-gray-800/80 transition-all duration-200 p-2 sm:p-2.5 min-w-0 flex-shrink-0 w-28 sm:w-32"
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
                className={`group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border p-5 transition-all duration-300 cursor-pointer overflow-hidden ${faqOpen === idx ? 'border-[#FF5200] shadow-lg' : 'border-gray-200 hover:border-[#FF5200]'}`}
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
        <div className="max-w-4xl mx-auto px-6 sm:px-8 relative z-10 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to find your perfect commercial space?
          </h2>
          <p className="text-gray-300 mb-10 text-lg">
            Join brands who secured their ideal locations with Lokazen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
            <Link href={CASHFREE_STARTER} className="w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-gray-800 bg-gray-200 hover:bg-gray-100 border border-gray-300 min-h-[48px] transition-all">
              Starter — ₹4,999
            </Link>
            <Link href={CASHFREE_PRO} className="w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:opacity-95 shadow-lg min-h-[48px] transition-all">
              Professional — ₹9,999
            </Link>
            <button type="button" onClick={onPremiumClick} className="w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-gray-800 bg-gray-200 hover:bg-gray-100 border border-gray-300 min-h-[48px] transition-all">
              Premium — ₹19,999
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-6">Secure payment • No hidden fees</p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
