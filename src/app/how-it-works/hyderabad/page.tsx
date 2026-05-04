import Image from 'next/image'
import Link from 'next/link'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

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

type Verdict = 'Lead Rec' | 'Strong Rec' | 'Conditional' | 'Pass'

type ShortlistProperty = {
  id: string
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
    bfi: 78,
    verdict: 'Strong Rec',
    name: 'P2 — Jubilee Hills Checkpost (Corner Unit)',
    summary:
      'Metro access, corner visibility, rent at market. 3,200 sqft fits brief cleanly. Black Fuel 1.5km.',
    chips: ['3,200 sqft', '₹3.2L/mo', 'Corner frontage'],
    image: '/properties/hyd/jh-checkpost-corner.png',
    pdf: '/lir/TheKind_LIR_JHCheckpost_2.pdf',
    maps: 'https://www.google.com/maps/place/Jubilee+Hills+Check+Post/@17.4298,78.4089,17z',
  },
  {
    id: 'P4',
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

function bfiBadgeClass(bfi: number): string {
  if (bfi >= 80) return 'bg-emerald-600 text-white'
  if (bfi >= 65) return 'bg-amber-500 text-stone-900'
  return 'bg-red-600 text-white'
}

function verdictPillClass(verdict: Verdict, pass?: boolean): string {
  if (pass || verdict === 'Pass') {
    return 'bg-stone-200 text-stone-700 border border-stone-300'
  }
  if (verdict === 'Lead Rec') return 'bg-[#FF5200]/15 text-[#B83200] border border-[#FF5200]/30'
  if (verdict === 'Strong Rec') return 'bg-emerald-50 text-emerald-900 border border-emerald-200'
  return 'bg-amber-50 text-amber-950 border border-amber-200'
}

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

        {/* Property grid */}
        <section className="py-12 sm:py-16 md:py-20" aria-labelledby="shortlist-heading">
          <h2 id="shortlist-heading" className="sr-only">
            Shortlisted properties by BFI
          </h2>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {PROPERTIES.map((p) => (
              <article
                key={p.id}
                className={`group flex flex-col rounded-2xl border bg-white overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  p.pass ? 'border-stone-300 bg-stone-50/80' : 'border-[#E8E1D3]'
                }`}
              >
                <div className="relative aspect-[16/9] w-full bg-stone-200 shrink-0">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className={`object-cover ${p.pass ? 'brightness-[0.92] contrast-[0.98]' : ''}`}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                  <div
                    className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${bfiBadgeClass(p.bfi)}`}
                  >
                    BFI {p.bfi}
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-5 sm:p-6">
                  <span
                    className={`inline-flex w-fit max-w-full rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-semibold mb-3 ${verdictPillClass(p.verdict, p.pass)}`}
                  >
                    {p.verdict}
                  </span>
                  <h3 className={`${fraunces.className} text-lg sm:text-xl font-bold text-[#1A1A14] leading-snug mb-3`}>
                    {p.name}
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed flex-1 mb-4">{p.summary}</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {p.chips.map((c) => (
                      <span
                        key={c}
                        className="inline-block rounded-md border border-[#E8E1D3] bg-[#FAF7F1] px-2 py-1 text-[11px] sm:text-xs font-medium text-stone-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Link
                      href={p.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-[#FF5200] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E4002B] transition-colors text-center"
                    >
                      View Full LIR
                    </Link>
                    <Link
                      href={p.maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border-2 border-[#FF5200]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#B83200] hover:border-[#FF5200] hover:bg-[#FF5200]/5 transition-colors text-center"
                    >
                      View on Maps
                    </Link>
                  </div>
                </div>
              </article>
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
