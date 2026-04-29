'use client'

import { useEffect, useRef, useState } from 'react'
import type { ZonesResponse } from '@/app/api/brand-intelligence/zones/route'

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0)
  const done = useRef(false)
  useEffect(() => {
    if (!target || done.current) return
    done.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return val
}

function Stat({ target, label, suffix = '' }: { target: number; label: string; suffix?: string }) {
  const val = useCountUp(target)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
        {val.toLocaleString()}{suffix}
      </span>
      <span className="text-[10px] text-gray-600 uppercase tracking-widest">{label}</span>
    </div>
  )
}

export default function BrandIntelStatStrip() {
  const [data, setData] = useState<ZonesResponse | null>(null)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/brand-intelligence/zones')
      .then(r => r.json())
      .then((d: ZonesResponse) => setData(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!data) return  // component renders null until data loads; ref is null too
    const el = ref.current
    if (!el) return
    // If already in view when data loads, show immediately
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0, rootMargin: '100px 0px 100px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [data])

  if (!data) return null

  return (
    <div ref={ref} className="relative z-10 w-full bg-[#030712] border-y border-white/[0.05] overflow-hidden">
      {/* Subtle sweep */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[600px] bg-gradient-to-r from-transparent via-[#FF5200]/4 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Stats row */}
          <div className="flex items-center gap-8 sm:gap-12">
            <div className="flex items-center gap-2 mr-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5200] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF5200]" />
              </span>
              <span className="text-[10px] text-[#FF5200] font-semibold uppercase tracking-widest hidden sm:block">Live</span>
            </div>

            {visible && (
              <>
                <Stat target={data.totalOutlets} label="Outlets" />
                <div className="w-px h-8 bg-white/[0.06]" />
                <Stat target={data.totalBrands} label="Brands" />
                <div className="w-px h-8 bg-white/[0.06]" />
                <Stat target={data.totalZones} label="Zones" />
                <div className="w-px h-8 bg-white/[0.06] hidden sm:block" />
                <div className="hidden sm:flex flex-col items-center gap-0.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-white">Bangalore</span>
                  <span className="text-[10px] text-gray-600 uppercase tracking-widest">City</span>
                </div>
              </>
            )}
          </div>

          {/* CTA */}
          <a
            href="/location-intelligence"
            className="flex-shrink-0 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
          >
            <span>Explore brand intelligence</span>
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
