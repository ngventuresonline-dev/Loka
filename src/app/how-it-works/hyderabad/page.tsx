import type { ReactNode } from 'react'
import Link from 'next/link'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Button from '@/components/ui/Button'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-fraunces',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-plusjakarta',
})

const SOURCE_CARDS = [
  {
    title: 'Targeted digital ads',
    body:
      'We run requirement creatives on Instagram, Facebook and WhatsApp targeted at Jubilee Hills property owners and brokers. Specific size, frontage, floor and parking requirements shown directly in the ad. Owners click and list in under 2 minutes.',
    icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
  },
  {
    title: 'Ground network activation',
    body:
      'The Lokazen Hyderabad network — local consultants and property contacts — is briefed on the requirement and activated immediately for direct outreach to owners in the target zone.',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    title: 'Direct owner outreach',
    body:
      'Lokazen proactively reaches out to known commercial property owners and brokers in Jubilee Hills with the requirement brief. No middlemen. Direct conversations.',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
] as const

type Stage = { n: string; title: string; desc: ReactNode; tags: string[] }

const STAGES: Stage[] = [
  {
    n: '01',
    title: 'Owner sees the requirement ad → clicks through to',
    desc: (
      <Link
        href="/hyderabad/list-property"
        className="font-medium text-[#FF5200] hover:text-[#E4002B] underline underline-offset-2"
      >
        lokazen.in/hyderabad/list-property
      </Link>
    ),
    tags: ['Paid social', 'WhatsApp', 'Owner funnel'],
  },
  {
    n: '02',
    title: 'Owner lists their property in under 2 minutes via a quick form',
    desc: 'Instant confirmation.',
    tags: ['Self-serve', 'Instant'],
  },
  {
    n: '03',
    title: 'Lokazen team is notified instantly',
    desc: 'Hyderabad network activated for ground verification.',
    tags: ['Ops', 'Field network'],
  },
  {
    n: '04',
    title: 'Property verified against 5 hard criteria',
    desc: 'Size, ~40ft frontage, ground + mezzanine, 10+ parking, Jubilee Hills. Site visit arranged for qualified properties.',
    tags: ['5-point gate', 'Site visit'],
  },
  {
    n: '05',
    title: 'Lokazen generates a Location Intelligence Report (LIR)',
    desc: 'BFI score, 500m competition map, catchment demographics, rent benchmark — and delivers it to the brand\'s expansion team.',
    tags: ['LIR', 'Data pack'],
  },
  {
    n: '06',
    title: 'Brand approves. Lokazen facilitates the introduction',
    desc: 'Lease signed. Success fee on closure only.',
    tags: ['Intro', 'Lease', 'Success fee'],
  },
]

const LIR_FEATURES = [
  {
    title: 'Brand Fit Index (BFI) score',
    desc: 'How well the unit matches the brand\'s format, visibility, and catchment.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    title: 'Competition map within 500m',
    desc: 'F&B and retail density you can scan in one glance.',
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  },
  {
    title: 'Catchment demographics',
    desc: 'Spend bands, households, and day-part proxies for the trade area.',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
  {
    title: 'Rent vs market benchmark',
    desc: 'Deal context against comparable corridors and recent comps.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  },
  {
    title: 'Footfall and busy hour patterns',
    desc: 'When the street pulls — weekday lunch vs weekend evenings.',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
  {
    title: 'Accessibility and visibility score',
    desc: 'Parking, approach, façade read, and signage potential.',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  },
] as const

function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="max-w-3xl mb-10 md:mb-14">
      {eyebrow ? (
        <p className="text-xs sm:text-sm font-semibold tracking-wide uppercase mb-3 text-[#E4002B]">{eyebrow}</p>
      ) : null}
      <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-gray-900 ${fraunces.className}`}>
        {title}
      </h2>
    </div>
  )
}

export default function HyderabadHowItWorksPage() {
  return (
    <div
      className={`min-h-screen bg-white text-gray-900 ${fraunces.variable} ${plusJakarta.variable} ${plusJakarta.className}`}
    >
      <Navbar primaryCta={{ href: '/contact-us', label: 'Talk to us' }} />

      {/* Hero */}
      <header
        id="hero"
        className="relative min-h-[85vh] sm:min-h-[88vh] flex flex-col bg-[#1C2416] text-white pt-24 sm:pt-28 pb-16 sm:pb-20"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="pointer-events-none absolute top-1/4 -right-24 w-[420px] h-[420px] rounded-full bg-[#FF5200]/15 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#E4002B]/10 blur-[90px]" />

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-white/60 mb-4 font-medium tracking-wide">Hyderabad · Jubilee Hills mandate</p>
          <h1
            className={`${fraunces.className} text-[2rem] leading-[1.12] sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white max-w-4xl text-balance`}
          >
            From requirement to signed lease. End to end.
          </h1>
          <p className="mt-6 text-base sm:text-lg md:text-xl text-white/75 max-w-3xl leading-relaxed">
            How Lokazen finds, qualifies, and closes the right commercial space in Hyderabad — for an established
            Bangalore F&amp;B brand expanding to Jubilee Hills.
          </p>

          <div className="mt-10 flex flex-wrap gap-2 sm:gap-3">
            {['6 Stages', '48hr Qualification', '4,500 sq.ft.', 'Jubilee Hills'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.06] px-3.5 py-2 text-xs sm:text-sm font-medium text-white/90 backdrop-blur-sm"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Source */}
      <section id="source" className="relative py-16 sm:py-20 md:py-24 bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="We don&apos;t wait for properties to come to us." />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {SOURCE_CARDS.map((card) => (
              <article
                key={card.title}
                className="group relative rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm hover:border-[#FF5200]/35 hover:shadow-lg hover:shadow-[#FF5200]/10 transition-all duration-300"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF5200]/12 to-[#E4002B]/8 text-[#FF5200]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={card.icon} />
                  </svg>
                </div>
                <h3 className={`text-lg sm:text-xl font-bold text-gray-900 mb-3 ${fraunces.className}`}>{card.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section id="journey" className="relative py-16 sm:py-20 md:py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Process" title="The 6-stage journey" />

          <ul className="space-y-0">
            {STAGES.map((stage, i) => {
              const isLast = i === STAGES.length - 1
              return (
                <li key={stage.n} className="relative flex gap-4 sm:gap-6 pb-12 sm:pb-16 last:pb-0">
                  <div className="flex flex-col items-center shrink-0 w-11 sm:w-12">
                    <div
                      className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#FF5200] bg-white text-sm font-bold text-[#FF5200] shadow-sm"
                      aria-hidden
                    >
                      {stage.n}
                    </div>
                    {!isLast ? (
                      <div
                        className="flex-1 w-0.5 min-h-[2rem] mt-2 bg-[#FF5200]"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 pt-0.5 pb-2">
                    <h3 className={`text-lg sm:text-xl md:text-2xl font-bold text-gray-900 ${fraunces.className}`}>
                      Stage {stage.n} · {stage.title}
                    </h3>
                    <div className="mt-3 text-gray-600 leading-relaxed max-w-3xl text-sm sm:text-base">
                      {stage.desc}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {stage.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 border border-gray-200/80"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* LIR grid */}
      <section id="lir" className="relative py-16 sm:py-20 md:py-24 bg-stone-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Not a broker&apos;s note. A full intelligence report." />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {LIR_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm hover:border-[#FF5200]/30 transition-colors"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF5200]/10 text-[#FF5200]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={f.icon} />
                  </svg>
                </div>
                <h3 className={`font-bold text-gray-900 text-base sm:text-lg ${fraunces.className}`}>{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brief callout */}
      <section id="brief" className="relative py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#FF5200]/25 bg-gradient-to-br from-orange-50/80 to-white pl-5 sm:pl-6 pr-5 sm:pr-8 py-8 sm:py-10 shadow-sm border-l-4 border-l-[#FF5200]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#E4002B] mb-2">The property brief</p>
            <h2 className={`text-xl sm:text-2xl font-bold text-gray-900 mb-6 ${fraunces.className}`}>
              Exact requirement in market
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm sm:text-base">
              {[
                ['Location', 'Jubilee Hills'],
                ['Size', '4,000–5,500 sq.ft.'],
                ['Frontage', '~40ft'],
                ['Floor', 'Ground + Mezzanine'],
                ['Parking', '10+ cars'],
                ['Category', 'Premium F&B'],
                ['Timeline', 'Immediate'],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col sm:flex-row sm:gap-2 border-b border-gray-200/80 pb-3 last:border-0">
                  <dt className="font-semibold text-gray-800 shrink-0 sm:min-w-[120px]">{k}</dt>
                  <dd className="text-gray-600">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative py-16 sm:py-20 md:py-24 bg-[#1C2416] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20 bg-gradient-to-tr from-[#FF5200]/20 via-transparent to-[#E4002B]/10" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-5 ${fraunces.className}`}>
            One accountable partner. Start to finish.
          </h2>
          <p className="text-base sm:text-lg text-white/75 leading-relaxed mb-10">
            Lokazen handles sourcing, qualification, location intelligence, and deal facilitation — so the brand&apos;s
            expansion team focuses on the decision, not the legwork.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button href="/contact-us" size="lg" className="min-w-[200px]">
              Contact Lokazen
            </Button>
            <Link
              href="/onboarding/brand"
              className="text-sm font-semibold text-white/90 hover:text-white underline underline-offset-4 decoration-[#FF5200] decoration-2"
            >
              Or start brand onboarding
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
