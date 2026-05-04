import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { VisitScheduleFeedback } from './VisitScheduleFeedback'
import { HyderabadShortlistPropertyCard } from './HyderabadShortlistPropertyCard'
import type { Verdict } from './hyderabad-shortlist-types'

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

type ShortlistProperty = {
  id: string
  feedbackCode: string
  bfi: number
  verdict: Verdict
  name: string
  summary: string
  chips: [string, string, string]
  image: string
  pdf: string
  maps: string
  pass?: boolean
}

const PROPERTIES: ShortlistProperty[] = [
  {
    id: 'P3',
    feedbackCode: 'P3',
    bfi: 85,
    verdict: 'Lead Rec',
    name: 'P3 — Road No. 45, Jubilee Hills (Aidu Kitchen)',
    summary:
      "Hyderabad's most active premium F&B corridor. ₹1.5–2.2Cr existing fitout. TRUE BLACK 100m away validates specialty demand. Road 45's first all-veg specialty roastery.",
    chips: ['5,000 sqft SBU', '₹16L/mo (nego. ₹11–12L)', '40–50ft frontage'],
    image: '/properties/hyd/road45-aidu.png',
    pdf: '/lir/TheKind_LIR_Road45_v2.pdf',
    maps: 'https://www.google.com/maps/place/Aidu+Kitchen/@17.4271923,78.4060177,19z',
  },
  {
    id: 'P6',
    feedbackCode: 'P6',
    bfi: 80,
    verdict: 'Strong Rec',
    name: 'P6 — Road No. 59, Jubilee Hills (OKA)',
    summary:
      "OKA Bar & Bistro fitout intact — double-height indoor, courtyard, rooftop al fresco. Adjacent to Chutney's (18,456 reviews). 4 distinct seating zones.",
    chips: ['6,000 sqft G+2', '₹12L/mo', 'Valet parking'],
    image: '/properties/hyd/road59-oka.png',
    pdf: '/lir/TheKind_LIR_OKA_Road59.pdf',
    maps: 'https://maps.app.goo.gl/71EBWD19zX47R1rz5',
  },
  {
    id: 'P2',
    feedbackCode: 'P2',
    bfi: 78,
    verdict: 'Strong Rec',
    name: 'P2 — Jubilee Hills Checkpost (Corner Unit)',
    summary:
      'Metro access, corner visibility, rent at market. 3,200 sqft fits brief cleanly. Black Fuel 1.5km.',
    chips: ['3,200 sqft', '₹3.2L/mo', 'Corner frontage'],
    image: '/properties/hyd/jh-checkpost-corner.png',
    pdf: '/lir/TheKind_LIR_JHCheckpost_2.pdf',
    maps:
      'https://www.google.com/maps/place/17%C2%B025\'53.0%22N+78%C2%B025\'17.1%22E/@17.4313889,78.4214167,17z/data=!3m1!4b1!4m4!3m3!8m2!3d17.4313889!4d78.4214167!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDQyOS4wIKXMDSoASAFQAw%3D%3D',
  },
  {
    id: 'P4',
    feedbackCode: 'P4',
    bfi: 74,
    verdict: 'Conditional',
    name: 'P4 — Plot 484/A, Road No. 36, Jubilee Hills',
    summary:
      'Peddamma Gudi Metro at doorstep. Peddamma Temple opposite — thousands of daily devotees. ALANATI premium neighbour. Shell condition, rent above market.',
    chips: ['4,000 sqft G+1', '₹12L/mo (nego. ₹8–9L)', '50ft frontage'],
    image: '/properties/hyd/road36-plot484a.png',
    pdf: '/lir/TheKind_LIR_Road36_Plot484A.pdf',
    maps: 'https://maps.app.goo.gl/ZrCszDwEzgwfL64o9',
  },
  {
    id: 'P5',
    feedbackCode: 'P5',
    bfi: 72,
    verdict: 'Conditional',
    name: 'P5 — JH Checkpost Road, G+2+PH Bungalow',
    summary:
      'Independent bungalow beside SABOO Luxury Showroom. KBR Park 400m. 70ft frontage with penthouse terrace potential. Size 2x brief — needs partial floor arrangement.',
    chips: ['11,000 sqft G+2+PH', '₹9.5L/mo', '70ft frontage'],
    image: '/properties/hyd/jh-checkpost-bungalow.png',
    pdf: '/lir/TheKind_LIR_Road_92__Bungalow.pdf',
    maps: 'https://maps.app.goo.gl/SVmKchEGo4Xz1mK79',
  },
  {
    id: 'P1',
    feedbackCode: 'P1',
    bfi: 68,
    verdict: 'Conditional',
    name: 'P1 — Road No. 92, Jubilee Hills (Villa)',
    summary:
      "Behind Hakim's Aalim. KBR Park 500m drives morning + evening peaks. Blue Tokai Jubilee Hills closure removes nearest specialty competitor. Visibility must be ground-truthed.",
    chips: ['4,500 sqft SBU', '₹5L/mo (counter ₹3.75–4.25L)', '60ft frontage'],
    image: '/properties/hyd/road92-villa.png',
    pdf: '/lir/TheKind_LIR_Road92_v3.pdf',
    maps: 'https://maps.app.goo.gl/pLZDjFDxV2sFhPacA',
  },
  {
    id: 'BH',
    feedbackCode: 'BH-RD3',
    bfi: 40,
    verdict: 'Pass',
    name: 'BH Road 3 — Green Valley, Banjara Hills (PASS)',
    summary:
      'Secondary road, no metro. Katha Specialty Coffee in same micro-market. Currently occupied by DINEHILL. Size 2x brief at high fixed cost. Lokazen recommends pass.',
    chips: ['10,000 sqft', '₹10L/mo', 'Currently occupied'],
    image: '/properties/hyd/bh-road3.png',
    pdf: '/lir/TheKind_LIR_BH_Road3.pdf',
    maps: 'https://maps.app.goo.gl/wN2qMXR87j8c2hydA',
    pass: true,
  },
]

export default function HyderabadHowItWorksPage() {
  const fontVars = `${fraunces.variable} ${plusJakarta.variable}`

  return (
    <div className={`min-h-screen bg-[#FAF7F1] text-[#1A1A14] ${fontVars} ${plusJakarta.className}`}>
      <Navbar primaryCta={{ href: '/contact-us', label: 'Talk to Lokazen' }} />

      <main>
        {/* Hero */}
        <header className="relative border-b border-[#E8E1D3] bg-white pt-24 sm:pt-28 pb-12 sm:pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p
              className={`${fraunces.className} text-[10px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-[#FF5200] mb-4`}
            >
              Confidential · April–May 2026 · The Kind Roastery × Lokazen
            </p>
            <h1 className={`${fraunces.className} text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1A1A14] max-w-4xl leading-[1.1]`}>
              Hyderabad shortlist — 7 properties evaluated
            </h1>
            <p className="mt-6 text-base sm:text-lg text-stone-600 max-w-3xl leading-relaxed">
              Each property has been ground-checked, scored on the Lokazen BFI, and presented as a full Location Intelligence Report. Click any card for the detailed LIR.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm sm:text-base font-semibold text-stone-800 border-t border-[#E8E1D3] pt-8">
              <span>7 Properties</span>
              <span className="text-stone-300 hidden sm:inline" aria-hidden>
                ·
              </span>
              <span>6 Recommended</span>
              <span className="text-stone-300 hidden sm:inline" aria-hidden>
                ·
              </span>
              <span>1 Pass</span>
              <span className="text-stone-300 hidden sm:inline" aria-hidden>
                ·
              </span>
              <span>Jubilee Hills + Banjara Hills</span>
            </div>
          </div>
        </header>

        {/* Visit schedule */}
        <section className="border-b border-[#E8E1D3] bg-white py-12 sm:py-14 md:py-16" aria-labelledby="visit-schedule-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p
              className={`${fraunces.className} text-[10px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-[#FF5200] mb-3`}
            >
              Site visits · Today
            </p>
            <h2
              id="visit-schedule-heading"
              className={`${fraunces.className} text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1A14]`}
            >
              Confirmed visit schedule
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-stone-600 leading-relaxed">
              Five properties scheduled across Jubilee Hills. Tap any time slot to open the property in Maps. Use the
              brand feedback column on each row to share who is attending, priorities, and questions so Lokazen can prep
              before you arrive.
            </p>

            <VisitScheduleFeedback />
          </div>
        </section>

        {/* Property grid */}
        <section className="py-12 sm:py-16 md:py-20" aria-labelledby="shortlist-heading">
          <h2 id="shortlist-heading" className="sr-only">
            Shortlisted properties by BFI
          </h2>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {PROPERTIES.map((p) => (
              <HyderabadShortlistPropertyCard key={p.id} p={p} headingFontClass={fraunces.className} />
            ))}
          </div>
        </section>

        {/* Footer strip */}
        <section className="border-t border-[#E8E1D3] bg-[#F5F1EA] py-6 sm:py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm sm:text-base text-stone-600 font-medium">
              Pipeline live · Lokazen continues evaluating Jubilee Hills and Banjara Hills properties.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
