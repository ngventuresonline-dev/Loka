import type { ReactNode } from 'react'
import Link from 'next/link'
import { Fraunces, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Button from '@/components/ui/Button'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
  variable: '--font-fraunces',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plusjakarta',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-jetbrains',
})

function MonoEyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className={`${jetbrains.className} text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[#FF5200]/90 mb-3`}
    >
      {children}
    </p>
  )
}

function AdQuantumMark({ className = 'w-5 h-5 sm:w-6 sm:h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="10" cy="20" r="6" fill="#FF5200" className="opacity-95" />
      <circle cx="22" cy="20" r="4.5" fill="#FF3800" className="opacity-85" />
      <circle cx="16" cy="10" r="3.5" fill="#FF8040" className="opacity-90" />
    </svg>
  )
}

function MetaAdV5Creative() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      <p className={`${jetbrains.className} text-[9px] sm:text-[10px] font-semibold tracking-[0.18em] uppercase text-stone-500 mb-2`}>
        Live creative · V5 · Lokazen orange
      </p>
      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-[#FF5200] shadow-2xl shadow-[#FF5200]/25 ring-1 ring-black/10">
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full border-[28px] border-white/[0.06]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-6 -right-6 w-36 h-36 rounded-full border-[18px] border-white/[0.05]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-14 -left-14 w-52 h-52 rounded-full border-[22px] border-black/[0.06]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent"
          aria-hidden
        />

        <div className="relative z-[1] h-full flex flex-col p-5 sm:p-6 text-white">
          <div className="flex items-center gap-2 mb-auto">
            <AdQuantumMark className="w-[22px] h-[22px]" />
            <div>
              <div className="text-[13px] font-extrabold tracking-tight leading-none">
                Lok<span className="opacity-70">a</span>zen
              </div>
              <div className={`${jetbrains.className} text-[6px] font-semibold tracking-[0.2em] uppercase text-white/50 mt-0.5`}>
                Powered by AI
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-black/20 border border-white/20 rounded px-2.5 py-1.5 w-fit mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className={`${jetbrains.className} text-[7px] sm:text-[8px] font-semibold tracking-[0.16em] uppercase text-white/95`}>
              Live Requirement · Jubilee Hills
            </span>
          </div>

          <h3 className={`${fraunces.className} text-lg sm:text-xl font-extrabold leading-[1.08] tracking-tight mb-2`}>
            Established
            <br />
            <span className="text-black/35 italic font-bold">Bangalore brand</span>
            <br />
            4,500 sq.ft.
            <br />
            <span className="text-black/35 italic font-bold">space for rent.</span>
          </h3>

          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
            <p className="text-[9px] sm:text-[10px] font-bold text-white/85 leading-snug">
              Jubilee Hills, Hyderabad · Premium F&amp;B · Immediate
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              ['Size', '4,000–5,500 sqft'],
              ['Frontage', '~40 ft'],
              ['Floor', 'G + Mezz'],
              ['Parking', '10+ cars'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="inline-flex flex-col gap-0.5 bg-black/15 border border-white/15 rounded px-2 py-1.5 min-w-0"
              >
                <span className={`${jetbrains.className} text-[6px] font-semibold tracking-[0.14em] uppercase text-white/60`}>
                  {k}
                </span>
                <span className="text-[9px] font-extrabold text-white leading-tight">{v}</span>
              </div>
            ))}
          </div>

          <Link
            href="/hyderabad/list-property"
            className="mt-auto group rounded-lg border border-white/15 bg-black/20 p-3 flex items-center justify-between gap-2 hover:bg-black/30 transition-colors"
          >
            <div className="min-w-0 text-left">
              <div className="text-[9px] sm:text-[10px] font-extrabold text-white">List your property on</div>
              <div className={`${jetbrains.className} text-[7px] sm:text-[8px] font-semibold text-white/75 tracking-wide truncate`}>
                lokazen.in/hyderabad/list-property
              </div>
              <div className={`${jetbrains.className} text-[6px] text-white/40 tracking-[0.12em] uppercase mt-0.5`}>
                RERA-registered platform
              </div>
            </div>
            <span className="shrink-0 rounded bg-white text-[#FF5200] px-2.5 py-1.5 text-[8px] font-extrabold group-hover:bg-stone-100 transition-colors">
              List Now →
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

type MiniStep = { title: string; hint?: string }

type ChipTone = 'orange' | 'gray' | 'green' | 'blue'

type FlowStageData = {
  num: string
  label: string
  title: string
  lead: string
  steps: MiniStep[]
  chips: { label: string; tone: ChipTone }[]
  circleClass: string
  lineTone?: 'orange' | 'neutral'
  alert?: { tone: 'blue'; body: string }
}

const FLOW_STAGES: FlowStageData[] = [
  {
    num: '02',
    label: 'Stage 02 · Owner action',
    title: 'Owner clicks and lists in under 2 minutes.',
    lead:
      'They land on lokazen.in/hyderabad/list-property — the page mirrors this creative so there is zero disconnect. A tight form captures everything we need.',
    steps: [
      {
        title: 'Landing page confirms the mandate is live and Jubilee-specific.',
        hint: 'Name · WhatsApp · Size · Rent · Floor · Frontage · Availability',
      },
      {
        title: 'Owner submits — property details hit Lokazen in real time.',
        hint: 'Platform ingestion + lead ID instantly',
      },
      {
        title: 'Inline success state.',
        hint: '"We\'ve received your property. Our team will reach out within 24 hours."',
      },
    ],
    chips: [
      { label: 'Quick listing', tone: 'orange' },
      { label: 'Under 2 minutes', tone: 'gray' },
      { label: 'Instant confirmation', tone: 'green' },
    ],
    circleClass: 'bg-[#FF5200] text-white',
    lineTone: 'orange',
  },
  {
    num: '03',
    label: 'Stage 03 · Lokazen internal',
    title: 'Lokazen team is notified instantly.',
    lead: 'The moment the form fires, ops sees the full payload — contact, specs, and fit against The Kind brief.',
    steps: [
      {
        title: 'Lokazen receives owner name, WhatsApp, size, rent, and address.',
        hint: 'No CSV handoffs — structured lead in-product',
      },
      {
        title: 'Hyderabad ground network activated for verification.',
        hint: 'Local presence = faster truth on the ground',
      },
      {
        title: 'Lead tracked end-to-end in Lokazen.',
        hint: 'Submission → qualification → LIR → brand decision → closure',
      },
    ],
    chips: [
      { label: 'Instant alert', tone: 'orange' },
      { label: '24hr response SLA', tone: 'gray' },
      { label: 'Pipeline visibility', tone: 'blue' },
    ],
    circleClass: 'bg-[#1C2416] text-white',
    lineTone: 'neutral',
  },
  {
    num: '04',
    label: 'Stage 04 · Qualification',
    title: 'Property verified against The Kind brief.',
    lead:
      'We call the owner, validate the five non-negotiables for this mandate, and only then burn calendar on a site visit.',
    steps: [
      {
        title: 'Lokazen contacts owner within 24 hours.',
        hint: 'Size · ~40ft frontage · G+Mezz · 10+ bays · Jubilee Hills pin',
      },
      {
        title: 'Site visit scheduled only if it clears the gate.',
        hint: 'Photos, condition, landlord appetite verified on-site',
      },
      {
        title: 'Unqualified inventory never reaches The Kind.',
        hint: 'Protects your team\'s attention',
      },
    ],
    chips: [
      { label: '5 hard criteria', tone: 'orange' },
      { label: 'Site visit gated', tone: 'gray' },
      { label: 'Qualified only', tone: 'green' },
    ],
    circleClass: 'bg-[#7A8F5C] text-white',
    lineTone: 'neutral',
  },
  {
    num: '05',
    label: 'Stage 05 · Intelligence',
    title: 'Location Intelligence Report — built for the expansion desk.',
    lead:
      'Every survivor property gets a Lokazen LIR: BFI, 500m competition, catchment, rent bench — delivered straight to The Kind\'s decision-makers.',
    steps: [
      {
        title: 'LIR generated on the qualified Jubilee Hills asset.',
        hint: 'BFI · competition map · demographics · rent vs market',
      },
      {
        title: 'Lokazen-branded pack shared with The Kind.',
        hint: 'One narrative, one file — not a broker screenshot thread',
      },
      {
        title: 'Brand signals go / no-go; Lokazen choreographs next steps.',
        hint: 'Introduction only when you are ready',
      },
    ],
    chips: [
      { label: 'LIR generated', tone: 'orange' },
      { label: 'Lokazen delivers', tone: 'gray' },
      { label: 'BFI scored', tone: 'blue' },
    ],
    circleClass: 'bg-[#A8967B] text-white',
    lineTone: 'neutral',
    alert: {
      tone: 'blue',
      body: 'This is the separation from a traditional broker: The Kind receives intelligence — not just an address and a rent figure.',
    },
  },
  {
    num: '06',
    label: 'Stage 06 · Closure',
    title: 'Brand approves. Lokazen closes the loop.',
    lead:
      'Once The Kind confirms, we facilitate the brand–owner introduction and stay through execution. Success fee fires only on a signed lease.',
    steps: [
      {
        title: 'Approval driven by LIR + verified site experience.',
        hint: 'Same data language your team already reviewed',
      },
      {
        title: 'Lokazen facilitates introduction and term conversations.',
        hint: 'Both sides aligned on mandate fit before deep legal',
      },
      {
        title: 'Lease signed → Lokazen success fee.',
        hint: 'Aligned incentives end to end',
      },
    ],
    chips: [
      { label: 'Deal closed', tone: 'green' },
      { label: 'Success fee on closure', tone: 'orange' },
      { label: 'End-to-end managed', tone: 'gray' },
    ],
    circleClass: 'bg-[#C9A96E] text-[#1C2416]',
    lineTone: 'neutral',
  },
]

const chipTone: Record<ChipTone, string> = {
  orange: 'bg-[#FF5200]/5 border-[#FF5200]/25 text-[#B83200]',
  gray: 'bg-stone-100 border-[#E8E1D3] text-stone-600',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-950',
}

const LIR_FEATURES = [
  {
    title: 'Brand Fit Index (BFI)',
    desc: 'Scores how cleanly the box fits The Kind\'s roastery + service model in this micro-market.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    title: 'Competition · 500m',
    desc: 'F&B and hospitality density The Kind would compete with day and night.',
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  },
  {
    title: 'Catchment demographics',
    desc: 'Spend bands and household mix for the walk + drive catchment around the pin.',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
  {
    title: 'Rent vs market',
    desc: 'Where the ask sits versus recent comps on comparable frontage in the corridor.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  },
  {
    title: 'Footfall & day-parts',
    desc: 'Busy-hour proxies so The Kind can read weekday lunch vs weekend evening pull.',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
  {
    title: 'Accessibility & visibility',
    desc: 'Approach, parking choreography, façade read, and signage headroom for the brand.',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  },
] as const

const SOURCING_PILLARS = [
  {
    title: 'Paid social + WhatsApp',
    body:
      'This V5 square runs as the hero unit across Instagram, Facebook, and WhatsApp Status / click-to-WhatsApp — geo-fenced and interest-layered so Jubilee Hills owners and serious brokers see The Kind-sized requirements, not generic “space available” noise.',
  },
  {
    title: 'Hyderabad ground cell',
    body:
      'Parallel to the ad, the Lokazen Hyderabad network is briefed on the exact Kind mandate — frontage, floor plate, parking count — so consultants can ping owners who will never scroll Meta but will take a WhatsApp call.',
  },
  {
    title: 'Direct owner + broker lane',
    body:
      'Curated outreach to known commercial owners and corridor brokers with the same brief deck. No daisy chains: conversations are anchored on the published requirement and the list funnel.',
  },
] as const

export default function HyderabadHowItWorksPage() {
  const fontVars = `${fraunces.variable} ${plusJakarta.variable} ${jetbrains.variable}`

  return (
    <div className={`min-h-screen bg-[#FAF7F1] text-[#1A1A14] ${fontVars} ${plusJakarta.className}`}>
      <Navbar primaryCta={{ href: '/contact-us', label: 'Talk to Lokazen' }} />

      {/* Hero */}
      <header
        id="hero"
        className="relative min-h-[88vh] flex flex-col bg-[#1C2416] text-white pt-24 sm:pt-28 pb-0 overflow-hidden"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="pointer-events-none absolute -right-20 top-24 w-[400px] h-[400px] rounded-full border-[40px] border-[#C9A96E]/[0.08]" />
        <div className="pointer-events-none absolute right-1/4 bottom-10 w-72 h-72 rounded-full bg-[#FF5200]/10 blur-[100px]" />

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-10">
            <div className={`${jetbrains.className} text-[10px] sm:text-xs tracking-[0.14em] uppercase text-white/45`}>
              <span className="text-[#FF5200] font-semibold">Confidential</span>
              <span className="text-white/35"> · </span>
              April 2026
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> · </span>
              Hyderabad expansion
            </div>
            <div className={`${jetbrains.className} text-[10px] sm:text-xs tracking-[0.12em] uppercase text-right text-white/40 sm:max-w-xs`}>
              Prepared for <span className="text-[#C9A96E] font-medium text-white/80">The Kind Roastery</span>
              <br />
              <span className="text-white/30">× Lokazen</span>
            </div>
          </div>

          <h1
            className={`${fraunces.className} text-[2.35rem] leading-[1.02] sm:text-5xl md:text-6xl lg:text-[3.5rem] font-extrabold tracking-tight text-white max-w-4xl`}
          >
            From ad to
            <br />
            signed lease.
            <br />
            <span className="text-[#C9A96E] italic font-bold">The full story for The Kind.</span>
          </h1>

          <p className="mt-8 text-base sm:text-lg text-white/65 max-w-2xl leading-relaxed">
            This page is the exact playbook Lokazen is running to surface, qualify, and close a Jubilee Hills asset for{' '}
            <strong className="text-white/90">The Kind Roastery</strong> — premium Bangalore F&amp;B expanding with a
            flagship-format space in Hyderabad. One creative. One list URL. One accountable chain to lease execution.
          </p>

          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 border-t border-white/10 -mx-4 sm:mx-0 sm:rounded-t-lg overflow-hidden">
            {[
              ['6', 'Stages in the journey'],
              ['48h', 'Owner funnel SLA'],
              ['4,500', 'sq.ft. target band'],
              ['24h', 'Qualification SLA'],
            ].map(([n, l]) => (
              <div
                key={l}
                className="border-r border-b sm:border-b-0 border-white/10 last:border-r-0 px-4 sm:px-6 py-5 bg-white/[0.03]"
              >
                <div className={`${fraunces.className} text-2xl sm:text-3xl font-extrabold text-[#FF5200]`}>{n}</div>
                <div className="text-[11px] sm:text-xs text-white/45 font-medium mt-1 leading-snug">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Kind context */}
      <section className="border-b border-[#E8E1D3] bg-[#F5F1EA] py-12 sm:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MonoEyebrow>Why this page exists</MonoEyebrow>
          <h2 className={`${fraunces.className} text-2xl sm:text-3xl font-extrabold text-[#1A1A14] mb-4`}>
            Built for The Kind Roastery — not “any F&amp;B”
          </h2>
          <p className="text-stone-600 leading-relaxed text-sm sm:text-base">
            The Kind already operates multiple flagship-grade outlets in Bangalore. The Hyderabad move needs a{' '}
            <strong className="text-stone-800">Jubilee Hills</strong> box with real frontage, parking that matches
            evening service, and a floor plate that fits a roastery-led experience. Lokazen is not blasting a generic
            vacancy — we are running a <strong className="text-stone-800">named mandate</strong> with creative,
            data, and ground truth aligned to that brief.
          </p>
        </div>
      </section>

      {/* Stage 01 — Meta creative */}
      <section id="meta-creative" className="border-b border-[#E8E1D3] py-14 sm:py-20 md:py-24 bg-[#FAF7F1]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <MonoEyebrow>Stage 01 · Feed</MonoEyebrow>
          <h2 className={`${fraunces.className} text-3xl sm:text-4xl font-extrabold text-[#1A1A14] mb-4 max-w-3xl`}>
            The Meta ad owners see — before they ever talk to a broker.
          </h2>
          <p className="text-stone-600 text-base sm:text-lg max-w-3xl leading-relaxed mb-12">
            A Jubilee Hills owner or broker scrolls Instagram, Facebook, or WhatsApp. The Lokazen requirement creative
            interrupts the feed: specific numbers, credible Lokazen branding, and a single CTA into the list funnel.
            <strong className="text-stone-800"> No vague “call for details” — the brief is the hook.</strong>
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            <MetaAdV5Creative />

            <div>
              <p className={`${jetbrains.className} text-[10px] font-semibold tracking-[0.18em] uppercase text-stone-500 mb-6`}>
                Meta copy deck · Primary text &amp; headline
              </p>

              <div className="mb-8">
                <span className={`${jetbrains.className} text-[10px] font-bold tracking-[0.14em] uppercase text-[#FF5200]`}>
                  Headline
                </span>
                <p className={`${fraunces.className} mt-2 text-xl sm:text-2xl font-extrabold text-[#1A1A14] leading-snug`}>
                  Jubilee Hills property owners — this one&apos;s for you.
                </p>
              </div>

              <div className="h-px bg-[#E8E1D3] mb-8" />

              <div className="mb-8">
                <span className={`${jetbrains.className} text-[10px] font-bold tracking-[0.14em] uppercase text-[#FF5200]`}>
                  Primary text
                </span>
                <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
                  A Bangalore brand with multiple flagship outlets is looking for 4,500 sq.ft. in Jubilee Hills for rent.{' '}
                  <strong className="text-stone-800">Right now.</strong> Ground floor + mezzanine, ~40 ft frontage,
                  parking for 10+ cars.
                  <br />
                  <br />
                  List your property on lokazen.in — RERA-registered platform, zero listing fee, matched in 48 hours.
                </p>
              </div>

              <div className="h-px bg-[#E8E1D3] mb-6" />

              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${chipTone.orange}`}>
                  Instagram · Facebook · WhatsApp
                </span>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${chipTone.gray}`}>
                  1:1 square format
                </span>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${chipTone.gray}`}>
                  Zero listing fee
                </span>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${chipTone.green}`}>
                  Geo: Jubilee Hills + adjacency
                </span>
              </div>
            </div>
          </div>

          {/* Micro flow strip */}
          <div className="mt-14 sm:mt-16 rounded-2xl border border-[#E8E1D3] bg-white/80 p-6 sm:p-8 shadow-sm">
            <p className={`${jetbrains.className} text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-500 mb-6`}>
              Click path · zero ambiguity
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
              {[
                ['1 · Impression', 'Owner sees the square creative in-feed or in-channel.'],
                ['2 · Click', 'CTA routes to the Hyderabad list experience — same numbers as the ad.'],
                ['3 · List', 'Sub-two-minute form → instant confirmation → Lokazen ops alert.'],
              ].map(([t, d]) => (
                <div key={t} className="relative md:pr-6 md:border-r md:border-[#E8E1D3] last:border-0 last:pr-0">
                  <div className={`${fraunces.className} text-lg font-bold text-[#1A1A14] mb-2`}>{t}</div>
                  <p className="text-sm text-stone-600 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sourcing */}
      <section id="sourcing" className="border-b border-[#E8E1D3] py-14 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <MonoEyebrow>Parallel demand gen</MonoEyebrow>
          <h2 className={`${fraunces.className} text-3xl sm:text-4xl font-extrabold text-[#1A1A14] mb-4 max-w-3xl`}>
            The ad is the tip of the spear — not the whole army.
          </h2>
          <p className="text-stone-600 max-w-3xl mb-12 leading-relaxed">
            For The Kind&apos;s Hyderabad entry we run the creative above <em>alongside</em> consultant-led outreach
            so we do not depend on a single channel for inventory.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {SOURCING_PILLARS.map((p) => (
              <article
                key={p.title}
                className="rounded-2xl border border-[#E8E1D3] bg-[#FAF7F1] p-6 sm:p-7 hover:border-[#FF5200]/30 transition-colors"
              >
                <h3 className={`${fraunces.className} text-lg font-bold text-[#1A1A14] mb-3`}>{p.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stages 02-06 */}
      <section id="journey" className="py-14 sm:py-20 md:py-24 bg-[#FAF7F1] border-b border-[#E8E1D3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <MonoEyebrow>Stages 02 — 06</MonoEyebrow>
          <h2 className={`${fraunces.className} text-3xl sm:text-4xl font-extrabold text-[#1A1A14] mb-4 max-w-3xl`}>
            What happens after the click.
          </h2>
          <p className="text-stone-600 text-base sm:text-lg max-w-3xl leading-relaxed mb-14 sm:mb-16">
            From list submission to The Kind&apos;s lease signature — the Lokazen operating system for this mandate.
          </p>

          <div className="space-y-0">
            {FLOW_STAGES.map((stage, idx) => {
              const last = idx === FLOW_STAGES.length - 1
              const lineClass =
                stage.lineTone === 'orange' ? 'bg-[#FF5200]/25' : 'bg-[#E8E1D3]'

              return (
                <div key={stage.num} className="relative flex gap-4 sm:gap-6">
                  <div className="flex flex-col items-center w-12 sm:w-14 shrink-0">
                    <div
                      className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full text-base sm:text-lg font-extrabold shadow-md ${stage.circleClass}`}
                    >
                      {stage.num}
                    </div>
                    {!last ? <div className={`w-0.5 flex-1 min-h-[3rem] mt-2 ${lineClass}`} aria-hidden /> : null}
                  </div>

                  <div className={`pb-14 sm:pb-16 ${last ? '' : ''} min-w-0 flex-1`}>
                    <p className={`${jetbrains.className} text-[9px] sm:text-[10px] font-semibold tracking-[0.18em] uppercase text-stone-400 mb-2`}>
                      {stage.label}
                    </p>
                    <h3 className={`${fraunces.className} text-xl sm:text-2xl md:text-[1.65rem] font-extrabold text-[#1A1A14] mb-3 leading-snug`}>
                      {stage.title}
                    </h3>
                    <p className="text-stone-600 leading-relaxed mb-6 max-w-2xl">{stage.lead}</p>

                    <ul className="space-y-3 mb-6">
                      {stage.steps.map((s) => (
                        <li key={s.title} className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#FF5200] shrink-0" />
                          <div>
                            <p className="text-sm sm:text-[15px] text-[#1A1A14] font-medium leading-snug">{s.title}</p>
                            {s.hint ? (
                              <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">{s.hint}</p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {stage.chips.map((c) => (
                        <span
                          key={c.label}
                          className={`rounded-full border px-3 py-1 text-[11px] sm:text-xs font-semibold ${chipTone[c.tone]}`}
                        >
                          {c.label}
                        </span>
                      ))}
                    </div>

                    {stage.alert ? (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950 leading-relaxed max-w-2xl">
                        {stage.alert.body}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* LIR */}
      <section id="lir" className="py-14 sm:py-20 bg-white border-b border-[#E8E1D3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <MonoEyebrow>Inside the LIR</MonoEyebrow>
          <h2 className={`${fraunces.className} text-3xl sm:text-4xl font-extrabold text-[#1A1A14] mb-4 max-w-3xl`}>
            What The Kind&apos;s expansion desk actually receives.
          </h2>
          <p className="text-stone-600 max-w-3xl mb-10 leading-relaxed">
            Six tiles, one narrative — so your team compares sites on intelligence, not vibes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {LIR_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[#E8E1D3] bg-[#FAF7F1] p-5 sm:p-6 hover:border-[#FF5200]/25 transition-colors"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF5200]/10 text-[#FF5200]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={f.icon} />
                  </svg>
                </div>
                <h3 className={`${fraunces.className} font-bold text-[#1A1A14]`}>{f.title}</h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mandate card */}
      <section id="brief" className="py-14 sm:py-16 bg-[#F5F1EA]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#FF5200]/20 border-l-4 border-l-[#FF5200] bg-white shadow-sm p-6 sm:p-10">
            <p className={`${jetbrains.className} text-[10px] font-semibold tracking-[0.2em] uppercase text-[#E4002B] mb-2`}>
              Published mandate · The Kind Roastery
            </p>
            <h2 className={`${fraunces.className} text-2xl font-extrabold text-[#1A1A14] mb-6`}>Jubilee Hills brief</h2>
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {[
                ['Location', 'Jubilee Hills'],
                ['Size', '4,000–5,500 sq.ft.'],
                ['Frontage', '~40ft'],
                ['Floor', 'Ground + Mezzanine'],
                ['Parking', '10+ cars'],
                ['Category', 'Premium F&B / roastery'],
                ['Timeline', 'Immediate'],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-[#E8E1D3] pb-3 sm:border-0 sm:pb-0">
                  <dt className="font-bold text-stone-800">{k}</dt>
                  <dd className="text-stone-600 mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section id="cta" className="relative py-16 sm:py-20 md:py-24 bg-[#1C2416] text-white overflow-hidden">
        <div className="pointer-events-none absolute -right-24 bottom-0 w-[340px] h-[340px] rounded-full border-[44px] border-[#C9A96E]/[0.07]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#FF5200]/10 via-transparent to-transparent" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className={`${jetbrains.className} text-[10px] sm:text-xs tracking-[0.22em] uppercase text-white/35 mb-5`}>
            Lokazen · RERA-registered · lokazen.in
          </p>
          <h2 className={`${fraunces.className} text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold leading-tight mb-6`}>
            One ad. One form.
            <br />
            <span className="text-[#C9A96E] italic font-bold">One signed lease.</span>
          </h2>
          <p className="text-white/60 leading-relaxed text-base sm:text-lg mb-10">
            Lokazen owns the chain from the moment a Jubilee Hills owner sees The Kind-sized creative to the day your
            team walks the shortlisted box. Brokers optional —{' '}
            <strong className="text-white/85">accountability isn&apos;t.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button href="/contact-us" size="lg" className="min-w-[220px]">
              Book a walkthrough with Lokazen
            </Button>
            <Link
              href="/hyderabad/list-property"
              className={`${jetbrains.className} text-xs font-medium tracking-wide text-[#C9A96E] hover:text-white underline underline-offset-4`}
            >
              View owner list URL →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
