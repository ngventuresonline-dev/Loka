'use client'

import { useEffect, useState } from 'react'
import type { ZoneData, ZonesResponse } from '@/app/api/brand-intelligence/zones/route'

const CAT_COLOR: Record<string, string> = {
  'Restaurant':   '#FF5200',
  'Cafe':         '#FF6B35',
  'Bakery':       '#F97316',
  'Dessert':      '#FBBF24',
  'Apparel':      '#8B5CF6',
  'Jewellery':    '#F59E0B',
  'Footwear':     '#06B6D4',
  'Eyewear':      '#0EA5E9',
  'Electronics':  '#3B82F6',
  'Salon':        '#EC4899',
  'Spa':          '#A78BFA',
  'Beauty':       '#DB2777',
  'Sports':       '#15803D',
  'Kids':         '#CA8A04',
  'Home':         '#9333EA',
  'Gym':          '#22C55E',
  'Supermarket':  '#14B8A6',
  'Pharmacy':     '#10B981',
  'QSR':          '#E4002B',
  'Bar':          '#EF4444',
  'Cinema':       '#F472B6',
  'Coworking':    '#6366F1',
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

function ZoneCard({ zone }: { zone: ZoneData }) {
  const color = densityColor(zone.totalOutlets)
  const barMax = Math.max(...zone.categories.slice(0, 4).map(c => c.count), 1)
  return (
    <div
      className="flex-shrink-0 w-64 rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-4 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
      style={{ boxShadow: `0 0 30px ${color}12` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Zone</div>
          <div className="text-base font-bold text-gray-900 leading-tight">{zone.zone}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
          >
            {densityLabel(zone.totalOutlets)}
          </span>
          <span className="text-2xl font-bold font-mono" style={{ color }}>{zone.totalOutlets.toLocaleString()}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">outlets</span>
        </div>
      </div>

      <div className="space-y-2">
        {zone.categories.slice(0, 4).map(c => (
          <div key={c.category}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-gray-600 truncate flex items-center gap-1">
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLOR[c.category] ?? '#FF5200' }} />
                {c.category}
              </span>
              <span className="text-gray-500 font-mono ml-1">{c.count}</span>
            </div>
            <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(c.count / barMax) * 100}%`,
                  backgroundColor: CAT_COLOR[c.category] ?? '#FF5200',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-1 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
        <span>{zone.totalBrands} brands</span>
        <span>{zone.categories.length} categories</span>
      </div>
    </div>
  )
}

export default function BrandIntelTeaser() {
  const [data, setData] = useState<ZonesResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/brand-intelligence/zones')
      .then(r => r.json())
      .then((d: ZonesResponse) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const topZones = data?.zones.slice(0, 4) ?? []

  return (
    <section className="relative z-10 bg-white py-16 md:py-20 overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full bg-[#FF5200]/3 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#8B5CF6]/3 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #FF5200 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5200]/10 border border-[#FF5200]/25 mb-4">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5200] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF5200]" />
              </span>
              <span className="text-[#FF5200] text-xs font-semibold tracking-widest uppercase">Brand Intelligence</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              See your competitive<br />landscape before you sign.
            </h2>
            <p className="mt-2 text-gray-600 text-sm max-w-md">
              {data
                ? `${data.totalOutlets.toLocaleString()} outlets across ${data.totalZones} zones — mapped, categorised, and ready.`
                : 'Loading market data…'}
            </p>
          </div>
          <a
            href="/location-intelligence"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:border-[#FF5200]/40 hover:text-gray-900 transition-all duration-200"
          >
            Explore full map
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Zone cards horizontal scroll */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-64 h-56 rounded-2xl bg-white border border-gray-200 animate-pulse" />
                ))
              : topZones.map(z => <ZoneCard key={z.zone} zone={z} />)
            }

            {/* Locked card */}
            {!loading && (
              <div className="flex-shrink-0 w-64 rounded-2xl border border-gray-200 bg-gray-50 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 backdrop-blur-sm bg-white/60" />
                <div className="relative z-10 flex flex-col items-center gap-3 p-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#FF5200]/10 border border-[#FF5200]/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-1">Micro-zone analysis</div>
                    <div className="text-[11px] text-gray-600">Neighbourhood drill-downs, competitor gaps, and full category breakdown</div>
                  </div>
                  <a
                    href="/location-intelligence"
                    className="mt-1 px-4 py-2 rounded-xl bg-[#FF5200] text-white text-xs font-semibold hover:bg-[#e64a00] transition-colors"
                  >
                    Unlock full map →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right fade overlay */}
          <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </section>
  )
}
