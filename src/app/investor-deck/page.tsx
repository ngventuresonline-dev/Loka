'use client'

import Link from 'next/link'
import Image from 'next/image'
import { brandPlacements } from '@/lib/brand-placements'
import { getBrandLogo, getBrandInitial } from '@/lib/brand-logos'
import Logo from '@/components/Logo'

const ORANGE = '#FF5200'
const RED = '#E4002B'

// Unique brands from placements for "Brands we've placed" + Mini Bay - By Sakare
const uniqueBrandNames = Array.from(new Set(brandPlacements.map(p => p.brand)))
const brandsPlacedDisplay = [...uniqueBrandNames, "Mini Bay - By Sakare"]

// Brands we are currently placing (emerging)
const brandsCurrentlyPlacing = [
  'Truffles', 'Block Two Coffee', 'Namaste', 'Original Burger Co', 'Boba Bhai', 'Kried Burgers',
]

export default function InvestorDeckPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="md" href="/" variant="dark" showPoweredBy={false} />
          </div>
          <Link href="/" className="text-sm font-medium px-4 py-2 rounded-lg border border-white/10 hover:border-[#FF5200]/50 hover:text-[#FF5200] transition-colors">
            Back to platform
          </Link>
        </div>
      </nav>

      <main className="pt-20 pb-24">
        {/* Cover — punchy + illustration */}
        <section className="min-h-[85vh] flex flex-col justify-center px-6 max-w-5xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-30" aria-hidden>
            <svg className="absolute top-1/4 right-0 w-[min(50vw,400px)] h-[min(50vw,400px)] -translate-y-1/2" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="80" stroke="url(#coverGrad)" strokeWidth="1" fill="none" />
              <circle cx="100" cy="100" r="60" stroke="url(#coverGrad)" strokeWidth="0.5" fill="none" opacity="0.6" />
              <circle cx="60" cy="70" r="8" fill="#FF5200" opacity="0.8" />
              <circle cx="140" cy="80" r="8" fill="#E4002B" opacity="0.8" />
              <circle cx="80" cy="130" r="8" fill="#FF5200" opacity="0.6" />
              <circle cx="120" cy="50" r="6" fill="#E4002B" opacity="0.6" />
              <line x1="60" y1="70" x2="100" y2="100" stroke="url(#coverGrad)" strokeWidth="0.5" opacity="0.5" />
              <line x1="140" y1="80" x2="100" y2="100" stroke="url(#coverGrad)" strokeWidth="0.5" opacity="0.5" />
              <line x1="80" y1="130" x2="100" y2="100" stroke="url(#coverGrad)" strokeWidth="0.5" opacity="0.5" />
              <defs><linearGradient id="coverGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FF5200" /><stop offset="100%" stopColor="#E4002B" /></linearGradient></defs>
            </svg>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF5200]/10 border border-[#FF5200]/20 text-[#FF5200] text-xs font-semibold uppercase tracking-wider w-fit mb-6 relative z-10">
            Bangalore · ₹1 Cr · 3–5 investors · 3–8x
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-4 relative z-10">
            <span className="bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(90deg, ${ORANGE}, ${RED})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Commercial real estate
            </span>
            <br />
            <span className="text-white">matchmaking, powered by AI.</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-xl mb-2">
            Brands find space. Owners find tenants. Deals close faster.
          </p>
          <p className="text-sm text-gray-400">Confidential · Lokazen (Proprietorship)</p>
        </section>

        {/* Problem — visual, minimal text + illustration */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">The problem</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Leasing is broken for both sides</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white/5 border-l-4 border-[#FF5200] p-6 flex gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-[#FF5200]/10 flex items-center justify-center" aria-hidden>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-[#FF5200]">
                    <path d="M8 14h4v8H8v-8zm12 0h4v8h-4v-8zM10 12V8a2 2 0 012-2h8a2 2 0 012 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="16" cy="20" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M14 10l2-4 2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-[#FF5200] font-semibold mb-2">Brands</h3>
                  <p className="text-gray-300 text-sm">Months to find space. Broker fees. No fit guarantee.</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 border-l-4 border-[#E4002B] p-6 flex gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-[#E4002B]/10 flex items-center justify-center" aria-hidden>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-[#E4002B]">
                    <path d="M6 28V12l10-6 10 6v16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M16 6v22M10 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-[#E4002B] font-semibold mb-2">Owners</h3>
                  <p className="text-gray-300 text-sm">Vacancy = zero revenue. No visibility into who wants their asset.</p>
                </div>
              </div>
            </div>
            <p className="mt-6 text-gray-400 text-sm text-center">Most discovery still happens on WhatsApp and spreadsheets.</p>
          </div>
        </section>

        {/* Solution — one line + 3 tiles + illustration */}
        <section className="py-16 px-6 border-t border-white/5 bg-gradient-to-b from-[#FF5200]/5 to-transparent">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">The solution</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Two-sided AI matchmaking</h2>
            <div className="flex justify-center mb-8" aria-hidden>
              <svg width="280" height="64" viewBox="0 0 280 64" fill="none" className="text-[#FF5200]">
                <rect x="8" y="16" width="56" height="32" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.8"/>
                <text x="36" y="38" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="600" opacity="0.9">Brands</text>
                <path d="M64 32h24l20-8v16l-20-8H64" stroke="url(#solGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <circle cx="152" cy="32" r="14" fill="none" stroke="url(#solGrad)" strokeWidth="2"/>
                <text x="152" y="36" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="700">AI</text>
                <path d="M216 32h-24l-20 8V24l20 8H216" stroke="url(#solGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <rect x="224" y="16" width="56" height="32" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.8" className="text-[#E4002B]"/>
                <text x="252" y="38" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="600" opacity="0.9">Owners</text>
                <defs><linearGradient id="solGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FF5200"/><stop offset="100%" stopColor="#E4002B"/></linearGradient></defs>
              </svg>
            </div>
            <p className="text-gray-300 text-sm mb-6 text-center">BFI/PFI scoring. Natural-language search. Deals close faster.</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Brands', sub: 'Filter · Match · Reach out', c: ORANGE },
                { label: 'Owners', sub: 'List once · Get matched', c: RED },
                { label: 'AI', sub: 'BFI/PFI · Conversational search', c: ORANGE },
              ].map((item, i) => (
                <div key={i} className="rounded-xl border border-white/15 p-5 text-center" style={{ borderTopColor: item.c, borderTopWidth: 3 }}>
                  <span className="font-semibold text-white" style={{ color: item.c }}>{item.label}</span>
                  <p className="text-gray-400 text-xs mt-1">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BMRCL hero — landmark (traction) + illustration */}
        <section className="py-16 md:py-24 px-6 border-t border-white/5 bg-gradient-to-b from-[#FF5200]/15 via-[#FF5200]/5 to-transparent">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-[#E4002B]/20 text-[#E4002B] text-xs font-bold uppercase tracking-wider mb-6">
              Landmark placement
            </div>
            <div className="flex justify-center mb-6" aria-hidden>
              <svg width="240" height="48" viewBox="0 0 240 48" fill="none">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <rect key={i} x={8 + i * 29} y="8" width="24" height="32" rx="2" fill={i < 4 ? 'url(#bmrclFill)' : 'rgba(255,255,255,0.08)'} stroke={i < 4 ? '#FF5200' : 'rgba(255,255,255,0.2)'} strokeWidth="1" />
                ))}
                <defs><linearGradient id="bmrclFill" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FF5200" stopOpacity="0.4"/><stop offset="100%" stopColor="#E4002B" stopOpacity="0.2"/></linearGradient></defs>
              </svg>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-6">
              <div className="text-7xl md:text-8xl font-black text-white leading-none" style={{ textShadow: `0 0 60px ${ORANGE}40` }}>
                4<span className="text-[#FF5200]">/</span>8
              </div>
              <div className="text-left md:text-left">
                <p className="text-xl md:text-2xl font-bold text-white mb-1">
                  Ground-floor brands placed by Lokazen
                </p>
                <p className="text-[#FF5200] font-semibold text-lg">BMRCL Indiranagar</p>
                <p className="text-gray-300 text-sm mt-0.5">Nomad Walk-in Street</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm max-w-xl mx-auto">
              We placed 4 out of 8 brands on the ground floor of Bangalore Metro’s Indiranagar retail strip—proof that our matchmaking works at scale in high-visibility projects.
            </p>
          </div>
        </section>

        {/* Few brands we've placed — with logos where available + illustration */}
        <section className="py-16 px-6 border-t border-white/10 bg-gradient-to-b from-[#E4002B]/5 to-transparent">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-6" aria-hidden>
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none" className="text-[#FF5200] opacity-80">
                <path d="M8 12h24v16H8z" stroke="currentColor" strokeWidth="1.5" rx="2"/>
                <path d="M14 18h4v4h-4zM22 18h4v4h-4z" fill="currentColor" opacity="0.6"/>
              </svg>
            </div>
            <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">Proof</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Few brands we’ve placed</h2>
            <div className="flex flex-wrap gap-3">
              {brandsPlacedDisplay.map((name, i) => {
                const logoPath = getBrandLogo(name)
                const initial = getBrandInitial(name)
                return (
                  <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-gray-200 text-sm font-medium">
                    {logoPath ? (
                      <span className="relative w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                        <Image src={logoPath} alt={name} fill className="object-contain" sizes="28px" unoptimized />
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-lg flex-shrink-0 bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center text-white text-xs font-bold">
                        {initial}
                      </span>
                    )}
                    {name}
                  </span>
                )
              })}
            </div>
            <p className="text-gray-400 text-xs mt-4">Across Indiranagar, Koramangala, Sarjapur Road, JP Nagar, Residency Road, HAL, Bannerghatta Road & more.</p>
          </div>
        </section>

        {/* Brands we are currently placing — with logos where available */}
        <section className="py-16 px-6 border-t border-white/10 bg-gradient-to-b from-[#FF5200]/5 to-transparent">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">Pipeline</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Brands we are currently placing</h2>
            <p className="text-gray-300 text-sm mb-6">Emerging F&B and retail brands scaling across Bangalore and beyond.</p>
            <div className="flex flex-wrap gap-3">
              {brandsCurrentlyPlacing.map((name, i) => {
                const logoPath = getBrandLogo(name)
                const initial = getBrandInitial(name)
                return (
                  <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5200]/10 border border-[#FF5200]/25 text-gray-100 text-sm font-medium">
                    {logoPath ? (
                      <span className="relative w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                        <Image src={logoPath} alt={name} fill className="object-contain" sizes="28px" unoptimized />
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-lg flex-shrink-0 bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                        {initial}
                      </span>
                    )}
                    {name}
                  </span>
                )
              })}
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-gray-300 text-sm font-medium">
                + many more emerging brands
              </span>
            </div>
          </div>
        </section>

        {/* Market — big numbers + illustration */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-center mb-6" aria-hidden>
              <svg width="160" height="48" viewBox="0 0 160 48" fill="none" className="text-[#FF5200] opacity-70">
                <path d="M8 32V20l24-12 24 12v12M32 8v24M56 20v12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="80" cy="24" r="6" fill="currentColor" opacity="0.5"/>
                <path d="M80 18v4l3 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">Market</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Bangalore first</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: 'India', sub: 'Large retail real estate market' },
                { value: 'Bangalore', sub: 'Key retail & F&B expansion hub' },
                { value: 'High streets + malls', sub: 'Mix we serve' },
                { value: '8–15%', sub: 'Typical commercial vacancy (opportunity)' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-white/5 border border-white/15 p-4 text-center">
                  <div className="text-lg font-bold text-white">{item.value}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-gray-400 text-sm">We expand to Mumbai, Delhi NCR, Hyderabad after proving unit economics in Bangalore.</p>
          </div>
        </section>

        {/* Proprietary tech — 4 icons + one line each */}
        <section className="py-16 px-6 border-t border-white/5 bg-gradient-to-b from-[#FF5200]/5 to-transparent">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">Proprietary tech</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Built in-house</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'BFI & PFI', line: 'Dual scoring · Location, size, budget, type' },
                { title: 'AI search', line: 'Natural language · Brand vs owner · Disambiguation' },
                { title: 'Bangalore data', line: 'Zones · Areas · Landmarks · Extensible' },
                { title: 'Listing engine', line: 'Format-aware descriptions · Title generation' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl border border-[#FF5200]/20 bg-[#0f172a]/80 p-4">
                  <h3 className="font-semibold text-[#FF5200] text-sm">{item.title}</h3>
                  <p className="text-gray-400 text-xs mt-1">{item.line}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Revenue — 4 tiles, short */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">Revenue streams</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Multiple levers</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { t: 'Listing & visibility', d: 'Premium listings · Brand subscriptions' },
                { t: 'Success fee', d: '% of first-year lease when deal closes' },
                { t: 'Lead monetization', d: 'Qualified intros · Unlock contacts' },
                { t: 'Data (future)', d: 'Market reports · Benchmarks · Heatmaps' },
              ].map((item, i) => (
                <div key={i} className={`rounded-xl p-4 border ${i < 2 ? 'border-[#FF5200]/30 bg-[#FF5200]/5' : 'border-white/15 bg-white/5'}`}>
                  <span className="font-semibold text-white text-sm">{item.t}</span>
                  <p className="text-gray-400 text-xs mt-0.5">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use of funds — visual bars + illustration */}
        <section className="py-16 px-6 border-t border-white/5 bg-gradient-to-b from-[#E4002B]/5 to-transparent">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-center mb-6" aria-hidden>
              <svg width="80" height="48" viewBox="0 0 80 48" fill="none" className="text-[#FF5200] opacity-70">
                <rect x="8" y="8" width="14" height="32" rx="2" fill="url(#pie1)" />
                <rect x="26" y="14" width="14" height="26" rx="2" fill="url(#pie2)" />
                <rect x="44" y="18" width="14" height="22" rx="2" fill="url(#pie3)" />
                <rect x="62" y="24" width="14" height="16" rx="2" fill="url(#pie4)" />
                <defs><linearGradient id="pie1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FF5200"/><stop offset="100%" stopColor="#E4002B"/></linearGradient><linearGradient id="pie2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FF5200" stopOpacity="0.9"/><stop offset="100%" stopColor="#E4002B" stopOpacity="0.9"/></linearGradient><linearGradient id="pie3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FF5200" stopOpacity="0.7"/><stop offset="100%" stopColor="#E4002B" stopOpacity="0.7"/></linearGradient><linearGradient id="pie4" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FF5200" stopOpacity="0.5"/><stop offset="100%" stopColor="#E4002B" stopOpacity="0.5"/></linearGradient></defs>
              </svg>
            </div>
            <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">Use of funds · ₹1 Cr</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Where the money goes</h2>
            <div className="space-y-4">
              {[
                { label: 'Growth & supply', pct: 38, sub: 'City expansion · Listings · Brands' },
                { label: 'Marketing & acquisition', pct: 28, sub: 'Performance · Partnerships · SEO' },
                { label: 'Product & tech', pct: 22, sub: 'BFI/PFI · AI · Mobile · Infra' },
                { label: 'Operations & runway', pct: 12, sub: 'Team · Legal · Runway' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-medium">{item.label}</span>
                    <span className="text-[#FF5200] font-semibold">{item.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r transition-all duration-700" style={{ width: `${item.pct}%`, background: `linear-gradient(90deg, ${ORANGE}, ${RED})` }} />
                  </div>
                  <p className="text-gray-400 text-xs">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5-year — bar chart style + growth curve illustration */}
        <section className="py-16 px-6 border-t border-white/5 relative">
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-md h-32 pointer-events-none opacity-10" aria-hidden>
            <svg viewBox="0 0 200 80" fill="none" className="w-full h-full text-[#FF5200]">
              <path d="M0 70 Q40 60 80 45 T160 20 T200 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">5-year projection</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Revenue & scale (illustrative)</h2>
            <div className="overflow-x-auto">
              <div className="flex items-end gap-3 md:gap-6 min-w-[400px] h-48">
                {[
                  { y: 'Y1', rev: '₹25–50L', h: 8 },
                  { y: 'Y2', rev: '₹1.5–3 Cr', h: 18 },
                  { y: 'Y3', rev: '₹4–7 Cr', h: 32 },
                  { y: 'Y4', rev: '₹10–16 Cr', h: 52 },
                  { y: 'Y5', rev: '₹22–35 Cr', h: 100 },
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col justify-end h-32">
                      <div
                        className="w-full rounded-t transition-all duration-700"
                        style={{ height: `${item.h}%`, background: `linear-gradient(180deg, ${ORANGE}, ${RED})` }}
                      />
                    </div>
                    <span className="text-white font-semibold text-sm">{item.y}</span>
                    <span className="text-[#FF5200] text-xs font-medium">{item.rev}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-gray-400 text-xs">Bangalore → +1 city → +2 cities. Supports 3–8x return on ₹1 Cr.</p>
          </div>
        </section>

        {/* Round — big numbers */}
        <section className="py-16 px-6 border-t border-white/5 bg-gradient-to-b from-[#FF5200]/10 to-transparent">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">The round</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">₹1 Cr · 3–5 investors · 3–8x</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { v: '₹1 Cr', l: 'Total raise' },
                { v: '3–5', l: 'Max investors' },
                { v: '₹20–33L', l: 'Cheque size' },
                { v: '3–8x', l: 'Target return (5–7 yr)' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-white/5 border border-[#FF5200]/20 p-5 text-center">
                  <div className="text-2xl font-black text-[#FF5200]">{item.v}</div>
                  <div className="text-gray-400 text-xs mt-1">{item.l}</div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border-2 border-[#FF5200]/30 bg-[#0f172a]/80 p-6">
              <p className="text-white text-sm mb-2"><strong>3x</strong> on ₹1 Cr → <span className="text-[#FF5200]">₹3 Cr</span> return. <strong>8x</strong> → <span className="text-[#FF5200]">₹8 Cr</span> return. Y5 revenue ₹22–35 Cr supports this at 1–2x revenue multiple.</p>
              <p className="text-gray-400 text-xs">Stake & valuation in conversation. Cap table & scenarios under NDA.</p>
            </div>
          </div>
        </section>

        {/* Growth — 3 phases, visual */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">Growth plan</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Milestones</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { phase: '0–18 mo', title: 'Bangalore', k: '500+ props · 400+ brands · 75–150 deals' },
                { phase: '18–36 mo', title: 'BLR + 1 city', k: '1,500+ props · 1,200+ brands · 300–500 deals' },
                { phase: '36–60 mo', title: 'BLR + 3 cities', k: '7,000+ props · 5,000+ brands · 1,500+ deals' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl border border-white/15 bg-white/5 p-5">
                  <span className="text-[#FF5200] font-bold text-sm">{item.phase}</span>
                  <h3 className="text-white font-semibold mt-1">{item.title}</h3>
                  <p className="text-gray-400 text-xs mt-2">{item.k}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Moat — 4 one-liners */}
        <section className="py-16 px-6 border-t border-white/5 bg-gradient-to-b from-[#FF5200]/5 to-transparent">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">Why we win</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Moat</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'AI & data flywheel · First-mover in Bangalore commercial',
                'Two-sided liquidity · Network effects',
                'Vertical focus · Retail, QSR, F&B only',
                'Execution speed · Live product · Light structure',
              ].map((line, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/15 px-4 py-3">
                  <span className="text-[#FF5200]">◆</span>
                  <span className="text-gray-200 text-sm">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Bangalore + Marketing + Risks — one row */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-white/15 p-4">
                <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">Why Bangalore</p>
                <p className="text-gray-200 text-sm">HQ · Retail/F&B hub · Replicate to Mumbai, NCR, Hyderabad</p>
              </div>
              <div className="rounded-xl border border-white/15 p-4">
                <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">Marketing</p>
                <p className="text-gray-200 text-sm">Performance + partnerships (brands) · Direct + broker channel (owners)</p>
              </div>
              <div className="rounded-xl border border-white/15 p-4">
                <p className="text-[#FF5200] font-bold text-xs uppercase tracking-widest mb-2">Risks we watch</p>
                <p className="text-gray-200 text-sm">Broker pushback → lead-gen partner · Chicken-egg → dual onboarding · City dependency → prove then expand</p>
              </div>
            </div>
          </div>
        </section>

        {/* Vision + CTA */}
        <section className="py-20 px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
              Default platform for commercial space discovery in India
            </h2>
            <p className="text-gray-300 text-sm max-w-xl mx-auto mb-10">
              Every brand looking for space and every owner with inventory starts on Lokazen. Days, not months.
            </p>
            <div className="rounded-2xl border-2 border-[#FF5200]/30 bg-gradient-to-br from-[#FF5200]/10 to-[#E4002B]/10 p-8 max-w-lg mx-auto">
              <p className="text-white font-semibold mb-2">Raising ₹1 Cr · 3–5 investors</p>
              <p className="text-gray-200 text-sm">Detailed model, cap table & walkthrough under NDA. Stake & valuation in conversation.</p>
              <p className="text-[#FF5200] font-semibold mt-4">Lokazen · Bangalore · Proprietorship</p>
            </div>
          </div>
        </section>

        <footer className="py-10 px-6 border-t border-white/10 text-center text-gray-400 text-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br" style={{ background: `linear-gradient(135deg, ${ORANGE}, ${RED})` }} />
            <span className="font-semibold text-gray-400">Lokazen</span>
          </div>
          <p className="text-gray-400">Confidential · 2026</p>
          <Link href="/" className="inline-block mt-3 text-[#FF5200] hover:underline">Back to platform →</Link>
        </footer>
      </main>
    </div>
  )
}
