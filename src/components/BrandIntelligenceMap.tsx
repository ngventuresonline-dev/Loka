'use client'

import { useEffect, useState, useRef } from 'react'
import type { ZoneData, ZonesResponse } from '@/app/api/brand-intelligence/zones/route'

const ZONE_POS: Record<string, { x: number; y: number; label: string }> = {
  // Far North
  'Yelahanka':       { x: 155, y: 32,  label: 'Yelahanka' },
  // North
  'Sahakar Nagar':   { x: 178, y: 52,  label: 'Sahakar Nagar' },
  'Hebbal':          { x: 202, y: 68,  label: 'Hebbal' },
  'Manyata':         { x: 232, y: 80,  label: 'Manyata' },
  'Thanisandra':     { x: 240, y: 58,  label: 'Thanisandra' },
  'New BEL Road':    { x: 118, y: 92,  label: 'New BEL Rd' },
  'Peenya':          { x: 82,  y: 108, label: 'Peenya' },
  // North-Central
  'RT Nagar':        { x: 188, y: 106, label: 'RT Nagar' },
  'Kalyan Nagar':    { x: 240, y: 105, label: 'Kalyan Nagar' },
  'Ramamurthynagar': { x: 268, y: 118, label: 'Ramamurthy Ngr' },
  'Yeshwanthpur':    { x: 105, y: 128, label: 'Yeshwanthpur' },
  'Malleshwaram':    { x: 122, y: 152, label: 'Malleshwaram' },
  'Rajajinagar':     { x: 82,  y: 165, label: 'Rajajinagar' },
  // Central
  'Shivajinagar':    { x: 188, y: 165, label: 'Shivajinagar' },
  'Frazer Town':     { x: 218, y: 152, label: 'Frazer Town' },
  'Indiranagar':     { x: 248, y: 158, label: 'Indiranagar' },
  'MG Road':         { x: 188, y: 188, label: 'MG Road' },
  'Langford Town':   { x: 178, y: 210, label: 'Langford Town' },
  // East
  'KR Puram':        { x: 282, y: 145, label: 'KR Puram' },
  'Mahadevapura':    { x: 295, y: 175, label: 'Mahadevapura' },
  'Whitefield':      { x: 338, y: 188, label: 'Whitefield' },
  'Brookefield':     { x: 305, y: 202, label: 'Brookefield' },
  'Marathahalli':    { x: 272, y: 222, label: 'Marathahalli' },
  'Varthur':         { x: 318, y: 248, label: 'Varthur' },
  // Koramangala / HSR / BTM belt
  'Koramangala':     { x: 205, y: 258, label: 'Koramangala' },
  'Jayanagar':       { x: 155, y: 272, label: 'Jayanagar' },
  'Basavanagudi':    { x: 162, y: 248, label: 'Basavanagudi' },
  'BTM Layout':      { x: 178, y: 300, label: 'BTM Layout' },
  'HSR Layout':      { x: 225, y: 308, label: 'HSR Layout' },
  'Bellandur':       { x: 255, y: 318, label: 'Bellandur' },
  'Sarjapur Road':   { x: 280, y: 338, label: 'Sarjapur Rd' },
  // South-West
  'Banashankari':    { x: 120, y: 318, label: 'Banashankari' },
  'JP Nagar':        { x: 142, y: 338, label: 'JP Nagar' },
  'Vijayanagar':     { x: 88,  y: 230, label: 'Vijayanagar' },
  'Uttarahalli':     { x: 102, y: 355, label: 'Uttarahalli' },
  'Kengeri':         { x: 72,  y: 348, label: 'Kengeri' },
  // South
  'Arekere':         { x: 205, y: 368, label: 'Arekere' },
  'Hulimavu':        { x: 222, y: 385, label: 'Hulimavu' },
  'Bommanahalli':    { x: 228, y: 342, label: 'Bommanahalli' },
  'Electronic City': { x: 205, y: 415, label: 'Electronic City' },
}

const CAT_COLOR: Record<string, string> = {
  'Restaurant':  '#FF5200',
  'Cafe':        '#FF6B35',
  'QSR':         '#E4002B',
  'Bakery':      '#F97316',
  'Dessert':     '#FBBF24',
  'Apparel':     '#8B5CF6',
  'Jewellery':   '#F59E0B',
  'Footwear':    '#06B6D4',
  'Electronics': '#3B82F6',
  'Supermarket': '#14B8A6',
  'Pharmacy':    '#10B981',
  'Gym':         '#22C55E',
  'Salon':       '#EC4899',
  'Spa':         '#A78BFA',
  'Coworking':   '#6366F1',
  'Bar':         '#EF4444',
  'Cinema':      '#F472B6',
  'Books':       '#84CC16',
  'Other':       '#6B7280',
}

// Priority order for category filter chips — QSR and key categories always visible
const CAT_PRIORITY = [
  'Restaurant', 'Cafe', 'QSR', 'Bakery', 'Dessert',
  'Gym', 'Salon', 'Spa',
  'Apparel', 'Footwear', 'Jewellery', 'Electronics',
  'Supermarket', 'Pharmacy', 'Coworking', 'Bar', 'Cinema', 'Books',
]

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
function densityColor(n: number) {
  if (n >= 1000) return '#FF5200'
  if (n >= 400)  return '#FF6B35'
  if (n >= 150)  return '#F59E0B'
  return '#10B981'
}
function densityLabel(n: number) {
  if (n >= 1000) return 'Prime'
  if (n >= 400)  return 'Core'
  if (n >= 150)  return 'Active'
  return 'Emerging'
}
function bubbleR(n: number, maxN: number) {
  return 8 + (n / maxN) * 26
}

function AnimCount({ target, duration = 1400 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef(false)
  useEffect(() => {
    if (ref.current) return
    ref.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return <>{val.toLocaleString()}</>
}

function CategoryPanel({ zone, filter, allZones }: { zone: ZoneData; filter: string; allZones: ZoneData[] }) {
  const catColor = CAT_COLOR[filter] ?? '#FF5200'
  const catEntry = zone.categories.find(c => c.category === filter)
  const catCount = catEntry?.count ?? 0

  const zonesForCat = allZones
    .map(z => ({ zone: z.zone, count: z.categories.find(c => c.category === filter)?.count ?? 0 }))
    .filter(z => z.count > 0)
    .sort((a, b) => b.count - a.count)

  const rank = zonesForCat.findIndex(z => z.zone === zone.zone) + 1
  const pct = zone.totalOutlets > 0 ? ((catCount / zone.totalOutlets) * 100).toFixed(1) : '0'
  const catBrands = zone.brandsByCategory?.[filter] ?? []

  // Top 5 zones for comparison; always include current zone
  const top5 = zonesForCat.slice(0, 5)
  const currentInTop5 = top5.some(z => z.zone === zone.zone)
  const compareZones = currentInTop5
    ? top5
    : [...top5.slice(0, 4), { zone: zone.zone, count: catCount }].sort((a, b) => b.count - a.count)
  const compareMax = compareZones[0]?.count ?? 1

  if (catCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${catColor}15`, border: `1px solid ${catColor}30` }}>
          <span className="text-lg">—</span>
        </div>
        <div>
          <div className="text-sm text-gray-700">No {filter} outlets mapped here yet</div>
          <div className="text-[11px] text-gray-500 mt-1">Try another zone on the map</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 3-stat row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-2 py-2.5 text-center">
          <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: catColor }}>{catCount.toLocaleString()}</div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">outlets</div>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-2 py-2.5 text-center">
          <div className="text-2xl font-bold text-gray-900 font-mono">#{rank || '—'}</div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">of {zonesForCat.length}</div>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-2 py-2.5 text-center">
          <div className="text-2xl font-bold text-gray-900 font-mono">{pct}%</div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">of zone</div>
        </div>
      </div>

      {/* Top brands for this category */}
      {catBrands.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Top {filter} brands here</div>
          <div className="flex flex-wrap gap-1.5">
            {catBrands.map(b => (
              <span key={b} className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ color: catColor, backgroundColor: `${catColor}12`, border: `1px solid ${catColor}30` }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Zone comparison */}
      {compareZones.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Zone comparison</div>
          <div className="space-y-1.5">
            {compareZones.map(z => {
              const isCurrent = z.zone === zone.zone
              return (
                <div key={z.zone} className="flex items-center gap-2">
                  <span className={`text-[10px] w-[90px] truncate flex-shrink-0 ${isCurrent ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                    {isCurrent ? '▸ ' : '  '}{ZONE_POS[z.zone]?.label ?? z.zone}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(z.count / compareMax) * 100}%`, backgroundColor: catColor, opacity: isCurrent ? 1 : 0.4 }} />
                  </div>
                  <span className={`text-[10px] font-mono w-7 text-right flex-shrink-0 ${isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>{z.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <a href="/for-brands#pricing"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:brightness-110"
        style={{ background: `linear-gradient(135deg, ${catColor}dd, ${catColor})`, boxShadow: `0 4px 20px ${catColor}40` }}>
        Find {filter} space in {ZONE_POS[zone.zone]?.label ?? zone.zone}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </>
  )
}

export default function BrandIntelligenceMap() {
  const [data, setData] = useState<ZonesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/brand-intelligence/zones')
      .then(r => r.json())
      .then((d: ZonesResponse) => {
        setData(d)
        if (d.zones?.length) setSelected(d.zones[0].zone)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const zoneMap = new Map((data?.zones ?? []).map(z => [z.zone, z]))
  const activeZone = selected ? zoneMap.get(selected) ?? null : null
  const maxOutlets = Math.max(...(data?.zones ?? []).map(z => z.totalOutlets), 1)

  const presentCats = new Set(
    (data?.zones ?? []).flatMap(z => z.categories.map(c => c.category))
  )
  const allCats = CAT_PRIORITY.filter(c => presentCats.has(c))

  const bars = activeZone ? activeZone.categories.slice(0, 6) : []
  const barMax = Math.max(...bars.map(c => c.count), 1)

  if (!mounted) return null

  return (
    <section className="relative w-full bg-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-[#FF5200]/4 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#E4002B]/3 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #FF5200 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-16 md:pb-24">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5200]/10 border border-[#FF5200]/25 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5200] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5200]" />
              </span>
              <span className="text-[#FF5200] text-xs font-semibold tracking-widest uppercase">Live Brand Intelligence</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Every brand.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#FF6B35]">Every zone.</span>{' '}
              <span className="text-gray-400 font-light">Bangalore.</span>
            </h2>
          </div>
          {data && (
            <div className="flex gap-3 flex-wrap sm:flex-nowrap sm:justify-end">
              {[
                { n: data.totalOutlets, label: 'outlets' },
                { n: data.totalBrands,  label: 'brands'  },
                { n: data.totalZones,   label: 'zones'   },
              ].map(({ n, label }) => (
                <div key={label} className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-xl font-bold text-gray-900 font-mono tabular-nums"><AnimCount target={n} /></span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setFilter(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
              !filter ? 'bg-[#FF5200] border-[#FF5200] text-white shadow-[0_0_16px_rgba(255,82,0,0.4)]'
                      : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
            }`}
          >All</button>
          {allCats.map(cat => (
            <button key={cat} onClick={() => setFilter(filter === cat ? null : cat)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                filter === cat ? 'text-white border-transparent shadow-lg'
                               : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
              }`}
              style={filter === cat ? { backgroundColor: CAT_COLOR[cat] ?? '#FF5200', boxShadow: `0 0 20px ${CAT_COLOR[cat] ?? '#FF5200'}50` } : {}}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLOR[cat] ?? '#FF5200' }} />
              {cat}
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-[58%_1fr] gap-5 items-start">

          {/* SVG Map */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Bangalore — {data?.zones.length ?? 0} neighbourhoods mapped</span>
              <div className="flex items-center gap-4 text-[10px] text-gray-500 uppercase tracking-wider">
                {[
                  { color: '#FF5200', label: '1k+ Prime' },
                  { color: '#FF6B35', label: '400+ Core' },
                  { color: '#F59E0B', label: '150+ Active' },
                  { color: '#10B981', label: 'Emerging' },
                ].map(({ color, label }) => (
                  <span key={label} className="hidden sm:flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 sm:p-5">
              {loading ? (
                <div className="flex items-center justify-center h-[460px] text-gray-500 text-sm">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-[#FF5200]/30 border-t-[#FF5200] animate-spin" />
                    <span>Mapping {(data?.zones.length ?? 40)} neighbourhoods…</span>
                  </div>
                </div>
              ) : (
                <svg viewBox="0 0 380 460" className="w-full h-auto min-h-[520px] sm:min-h-[460px] sm:max-h-[560px]" style={{ fontFamily: 'inherit' }}>
                  <defs>
                    <filter id="bim-glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="bim-glow-strong" x="-80%" y="-80%" width="260%" height="260%">
                      <feGaussianBlur stdDeviation="7" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <pattern id="bim-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
                    </pattern>
                    <linearGradient id="bim-scan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF5200" stopOpacity="0" />
                      <stop offset="50%" stopColor="#FF5200" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#FF5200" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <rect width="380" height="460" fill="url(#bim-grid)" />

                  {/* Bangalore map: stylised outline + ring roads + major spokes */}
                  <g pointerEvents="none">
                    {/* Rough BBMP city outline — hand-traced approximation */}
                    <path d="M 80 100 C 70 130, 60 180, 60 220 C 55 260, 65 310, 90 350 C 115 380, 160 395, 200 390 C 245 385, 290 365, 320 330 C 345 295, 350 250, 345 210 C 340 165, 320 120, 290 90 C 255 60, 200 45, 155 55 C 115 65, 90 80, 80 100 Z"
                      fill="none" stroke="rgba(255,82,0,0.18)" strokeWidth="1" strokeDasharray="2 3" />

                    {/* Outer Ring Road (ORR) — dashed ellipse */}
                    <ellipse cx="190" cy="210" rx="138" ry="148"
                      fill="none" stroke="rgba(255,82,0,0.28)" strokeWidth="0.9" strokeDasharray="5 4" />
                    <text x="335" y="100" fontSize="5.5" fill="rgba(255,82,0,0.55)" fontWeight="700" letterSpacing="0.5">ORR</text>

                    {/* Inner ring road / CBD halo */}
                    <ellipse cx="195" cy="200" rx="60" ry="72"
                      fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="0.6" strokeDasharray="2 3" />

                    {/* Major spoke roads from city centre */}
                    <line x1="195" y1="200" x2="155" y2="32"  stroke="rgba(0,0,0,0.07)" strokeWidth="0.6" />  {/* Bellary Rd N */}
                    <line x1="195" y1="200" x2="338" y2="188" stroke="rgba(0,0,0,0.07)" strokeWidth="0.6" />  {/* Old Madras E */}
                    <line x1="195" y1="200" x2="280" y2="338" stroke="rgba(0,0,0,0.07)" strokeWidth="0.6" />  {/* Sarjapur SE */}
                    <line x1="195" y1="200" x2="178" y2="338" stroke="rgba(0,0,0,0.07)" strokeWidth="0.6" />  {/* Hosur S */}
                    <line x1="195" y1="200" x2="72"  y2="348" stroke="rgba(0,0,0,0.07)" strokeWidth="0.6" />  {/* Mysore SW */}
                    <line x1="195" y1="200" x2="82"  y2="108" stroke="rgba(0,0,0,0.07)" strokeWidth="0.6" />  {/* Tumkur NW */}

                    {/* City centre marker (Cubbon Park / MG Road) */}
                    <circle cx="195" cy="200" r="2.5" fill="rgba(255,82,0,0.35)" />
                  </g>

                  {/* Scan line */}
                  <rect width="380" height="40" fill="url(#bim-scan)">
                    <animateTransform attributeName="transform" type="translate"
                      values="0,-40;0,500;0,-40" dur="9s" repeatCount="indefinite" calcMode="linear" />
                  </rect>

                  {/* Thin connector web */}
                  {(data?.zones ?? []).flatMap((za, i) =>
                    (data?.zones ?? []).slice(i + 1, i + 3).map(zb => {
                      const pa = ZONE_POS[za.zone]; const pb = ZONE_POS[zb.zone]
                      if (!pa || !pb) return null
                      const dist = Math.sqrt((pa.x-pb.x)**2 + (pa.y-pb.y)**2)
                      if (dist > 110) return null
                      return (
                        <line key={`${za.zone}-${zb.zone}`}
                          x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                          stroke="rgba(255,82,0,0.07)" strokeWidth="0.8" strokeDasharray="3 5" />
                      )
                    })
                  )}

                  {/* Zone bubbles */}
                  {(data?.zones ?? []).map(z => {
                    const pos = ZONE_POS[z.zone]
                    if (!pos) return null
                    const displayCount = filter
                      ? (z.categories.find(c => c.category === filter)?.count ?? 0)
                      : z.totalOutlets
                    if (filter && displayCount === 0) return null
                    const dispMax = filter
                      ? Math.max(...(data?.zones ?? []).map(zz => zz.categories.find(c => c.category === filter)?.count ?? 0), 1)
                      : maxOutlets
                    const r = bubbleR(displayCount, dispMax)
                    const color = filter ? (CAT_COLOR[filter] ?? '#FF5200') : densityColor(z.totalOutlets)
                    const isSel = selected === z.zone
                    const isHov = hovered === z.zone

                    return (
                      <g key={z.zone}
                        onClick={() => setSelected(z.zone)}
                        onMouseEnter={() => setHovered(z.zone)}
                        onMouseLeave={() => setHovered(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {isSel && (
                          <>
                            <circle cx={pos.x} cy={pos.y} r={r + 7} fill="none" stroke={color} strokeWidth="1" opacity="0.3">
                              <animate attributeName="r" values={`${r+5};${r+16};${r+5}`} dur="2.5s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
                            </circle>
                            <circle cx={pos.x} cy={pos.y} r={r + 3} fill="none" stroke={color} strokeWidth="0.7" opacity="0.2">
                              <animate attributeName="r" values={`${r+2};${r+10};${r+2}`} dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                            </circle>
                          </>
                        )}

                        {(isSel || isHov) && (
                          <circle cx={pos.x} cy={pos.y} r={r + 4} fill={color} opacity={0.18} filter="url(#bim-glow-strong)" />
                        )}

                        <circle cx={pos.x} cy={pos.y} r={r}
                          fill={color}
                          opacity={isSel ? 1 : isHov ? 0.88 : 0.70}
                          filter={isSel ? 'url(#bim-glow)' : undefined}
                          stroke={isSel ? '#fff' : 'none'}
                          strokeWidth={1.5}
                          style={{ transition: 'opacity 0.2s' }}
                        />

                        <circle cx={pos.x} cy={pos.y} r={r * 0.68} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" />

                        {r > 10 && (
                          <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                            fill="#fff" fontSize={r > 20 ? '9.5' : '7.5'} fontWeight="800" letterSpacing="-0.3"
                            style={{ pointerEvents: 'none' }}>
                            {fmt(displayCount)}
                          </text>
                        )}

                        <text x={pos.x} y={pos.y + r + 9} textAnchor="middle"
                          fill={isSel ? '#111827' : '#4B5563'}
                          fontSize="7" fontWeight={isSel ? '700' : '500'}
                          style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}>
                          {pos.label}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {activeZone ? (
              <div key={`${activeZone.zone}-${filter ?? 'all'}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 backdrop-blur-sm"
                style={{
                  boxShadow: `0 0 40px ${filter ? (CAT_COLOR[filter] ?? '#FF5200') : densityColor(activeZone.totalOutlets)}18`,
                  animation: 'bim-fadein 0.25s ease-out',
                }}
              >
                {/* Zone header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Selected zone</div>
                    <h3 className="text-xl font-bold text-gray-900">{ZONE_POS[activeZone.zone]?.label ?? activeZone.zone}</h3>
                  </div>
                  {filter ? (
                    <button
                      onClick={() => setFilter(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80"
                      style={{ color: CAT_COLOR[filter] ?? '#FF5200', backgroundColor: `${CAT_COLOR[filter] ?? '#FF5200'}18`, border: `1px solid ${CAT_COLOR[filter] ?? '#FF5200'}35` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CAT_COLOR[filter] ?? '#FF5200' }} />
                      {filter}
                      <span className="opacity-60 ml-0.5">×</span>
                    </button>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <div className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ color: densityColor(activeZone.totalOutlets), backgroundColor: `${densityColor(activeZone.totalOutlets)}18`, border: `1px solid ${densityColor(activeZone.totalOutlets)}35` }}>
                        {densityLabel(activeZone.totalOutlets)}
                      </div>
                      <div className="text-3xl font-bold font-mono tabular-nums" style={{ color: densityColor(activeZone.totalOutlets) }}>
                        {activeZone.totalOutlets.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">outlets</div>
                    </div>
                  )}
                </div>

                {filter ? (
                  <CategoryPanel zone={activeZone} filter={filter} allZones={data?.zones ?? []} />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[{ v: activeZone.totalBrands, l: 'brands' }, { v: activeZone.categories.length, l: 'categories' }].map(({ v, l }) => (
                        <div key={l} className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                          <div className="text-lg font-bold font-mono text-gray-900">{v.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">{l}</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2.5 mb-4">
                      {bars.map((c, i) => (
                        <div key={c.category} style={{ animationDelay: `${i * 40}ms` }}>
                          <div className="flex justify-between items-center mb-1">
                            <button
                              onClick={() => setFilter(c.category)}
                              className="text-xs text-gray-600 truncate max-w-[160px] flex items-center gap-1.5 hover:text-gray-900 transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLOR[c.category] ?? '#FF5200' }} />
                              {c.category}
                            </button>
                            <span className="text-xs font-mono text-gray-500 ml-2 flex-shrink-0">{c.count.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ width: `${(c.count / barMax) * 100}%`, backgroundColor: CAT_COLOR[c.category] ?? '#FF5200', boxShadow: `0 0 8px ${CAT_COLOR[c.category] ?? '#FF5200'}60`, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {activeZone.topBrands.slice(0, 9).map(b => (
                        <span key={b} className="px-2 py-0.5 rounded-full text-[10px] text-gray-700 bg-gray-50 border border-gray-200">{b}</span>
                      ))}
                    </div>

                    <a href="/for-brands#pricing"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #FF5200, #E4002B)', boxShadow: '0 4px 20px rgba(255,82,0,0.3)' }}>
                      Find space in {ZONE_POS[activeZone.zone]?.label ?? activeZone.zone}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 flex items-center justify-center h-48 text-gray-500 text-sm">
                {loading ? <div className="w-6 h-6 rounded-full border-2 border-[#FF5200]/30 border-t-[#FF5200] animate-spin" /> : 'Click a zone on the map'}
              </div>
            )}

            {/* Zone list */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">All neighbourhoods</span>
                <span className="text-[10px] text-gray-500">{data?.zones.length ?? 0} zones</span>
              </div>
              <div className="overflow-y-auto max-h-[280px] divide-y divide-gray-200"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#FF520030 transparent' }}>
                {(data?.zones ?? []).map(z => {
                  const isSel = selected === z.zone
                  const catCount = filter ? (z.categories.find(c => c.category === filter)?.count ?? 0) : null
                  const color = densityColor(z.totalOutlets)
                  const catColor = filter ? (CAT_COLOR[filter] ?? '#FF5200') : null
                  return (
                    <button key={z.zone} onClick={() => setSelected(z.zone)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-all duration-150 ${isSel ? 'bg-gray-100' : 'hover:bg-white'}`}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: catColor && catCount ? catColor : color, boxShadow: isSel ? `0 0 6px ${catColor && catCount ? catColor : color}` : 'none' }} />
                      <span className={`text-xs flex-1 ${isSel ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{z.zone}</span>
                      {filter && catCount !== null && catCount > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: catColor ?? '#FF5200', backgroundColor: `${catColor ?? '#FF5200'}15` }}>
                          {catCount}
                        </span>
                      )}
                      <span className="text-xs font-bold font-mono tabular-nums w-10 text-right" style={{ color }}>{z.totalOutlets.toLocaleString()}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom teaser */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 bg-white cursor-not-allowed">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm text-gray-500">Search your brand across Bangalore…</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full border border-[#FF5200]/30 text-[#FF5200] font-semibold uppercase tracking-wider">Soon</span>
            </div>
          </div>
          <a href="/for-brands#pricing"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5200] text-white text-sm font-semibold hover:bg-[#e64a00] transition-colors">
            Onboard your brand
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      <style>{`
        @keyframes bim-fadein { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </section>
  )
}
