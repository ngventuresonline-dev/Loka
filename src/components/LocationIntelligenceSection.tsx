'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { trackInquiry } from '@/lib/tracking'
import { GoogleMap, Marker, Circle, HeatmapLayer, useLoadScript } from '@react-google-maps/api'
import { GOOGLE_MAPS_LIBRARIES, getGoogleMapsApiKey, DEFAULT_MAP_OPTIONS } from '@/lib/google-maps-config'

export interface LocationIntelligenceSectionProps {
  propertyId: string
  location: string
  zone: string
  propertyType: string
  onGetReportClick?: () => void
  onTalkToTeamClick?: () => void
}

interface Competitor {
  name: string
  lat: number
  lng: number
  distanceMeters: number
}

interface ReportData {
  footfallIndex?: number | null
  tradeZoneScore?: number | null
  competitorDensity?: number | null
  catchmentPopulation?: number | null
  zone?: { name: string; heatLevel: 'low' | 'medium' | 'high' }
  insights?: Array<{ headline: string; firstSentence: string; fullText?: string }>
  is_free?: boolean
  source?: string
  coordinates?: { lat: number; lng: number }
  competitors?: Competitor[]
  footfall?: {
    dailyAverage: number
    hourlyPattern?: number[]
    peakHours?: string[]
    weekendBoost?: number
  }
  crowdPullers?: Array<{ name: string; category: string; distanceMeters: number }>
  scores?: {
    revenueProjectionMonthly?: number
    rentViability?: { monthlyRent: number; revenueProjection: number; rentAsPctOfRevenue: number; viable: boolean }
  }
}

const ZONE_COORDS: Record<string, { lat: number; lng: number }> = {
  koramangala: { lat: 12.9352, lng: 77.6245 },
  indiranagar: { lat: 12.9784, lng: 77.6408 },
  'hsr layout': { lat: 12.9121, lng: 77.6446 },
  hsr: { lat: 12.9121, lng: 77.6446 },
  jayanagar: { lat: 12.925, lng: 77.5936 },
  btm: { lat: 12.9166, lng: 77.6101 },
  'btm layout': { lat: 12.9166, lng: 77.6101 },
  'jp nagar': { lat: 12.9063, lng: 77.5857 },
  whitefield: { lat: 12.9698, lng: 77.7499 },
  'mg road': { lat: 12.975, lng: 77.6063 },
  marathahalli: { lat: 12.9593, lng: 77.6974 },
  bellandur: { lat: 12.926, lng: 77.6762 },
  'rammurthy nagar': { lat: 13.021, lng: 77.668 },
  'kasturi nagar': { lat: 13.018, lng: 77.648 },
  'hegde nagar': { lat: 13.058, lng: 77.624 },
  hessarghatta: { lat: 13.139, lng: 77.478 },
  hulimavu: { lat: 12.905, lng: 77.598 },
  'kalyan nagar': { lat: 13.018, lng: 77.648 },
  hebbal: { lat: 13.035, lng: 77.597 },
  yelahanka: { lat: 13.101, lng: 77.596 },
  yeshwanthpur: { lat: 13.028, lng: 77.534 },
  vijayanagar: { lat: 13.009, lng: 77.549 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
}

function signalColor(value: number | null | undefined, invert = false): string {
  if (value == null) return 'text-gray-500'
  const v = typeof value === 'number' ? value : 0
  const score = invert ? 100 - v : v
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function signalBg(value: number | null | undefined, invert = false): string {
  if (value == null) return 'bg-gray-100'
  const v = typeof value === 'number' ? value : 0
  const score = invert ? 100 - v : v
  if (score >= 70) return 'bg-emerald-50 border-emerald-200'
  if (score >= 40) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function getPropertyTypeLabel(type: string): string {
  const t = (type || '').toLowerCase()
  if (t.includes('retail')) return 'Retail'
  if (t.includes('restaurant') || t.includes('cafe') || t.includes('qsr')) return 'F&B'
  if (t.includes('office')) return 'Office'
  if (t.includes('warehouse')) return 'Warehouse'
  return 'Commercial'
}

function getCenter(report: ReportData | null, zone: string): { lat: number; lng: number } {
  if (report?.coordinates?.lat != null && report?.coordinates?.lng != null) {
    return { lat: report.coordinates.lat, lng: report.coordinates.lng }
  }
  const key = zone.toLowerCase().replace(/\s+/g, ' ')
  return ZONE_COORDS[key] ?? ZONE_COORDS.bangalore
}

function buildHeatmapData(
  center: { lat: number; lng: number },
  competitors: Competitor[],
  showHeatmap: boolean
): Array<google.maps.visualization.WeightedLocation> {
  if (typeof window === 'undefined' || !showHeatmap) return []
  const g = (window as any).google
  if (!g?.maps?.LatLng) return []
  const points: Array<google.maps.visualization.WeightedLocation> = []
  const LatLng = g.maps.LatLng
  points.push({
    location: new LatLng(center.lat, center.lng),
    weight: 8,
  })
  const delta = 0.003
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    points.push({
      location: new LatLng(
        center.lat + Math.cos(angle) * delta,
        center.lng + Math.sin(angle) * delta
      ),
      weight: 4,
    })
  }
  // Competitors — activity nodes
  competitors.slice(0, 20).forEach((c) => {
    if (c.lat && c.lng) {
      points.push({
        location: new LatLng(c.lat, c.lng),
        weight: 2,
      })
    }
  })
  return points
}

function FootfallBarChart({
  hourlyPattern,
  dailyAverage,
  className = '',
}: {
  hourlyPattern?: number[]
  dailyAverage?: number
  className?: string
}) {
  const data = useMemo(() => {
    if (hourlyPattern && hourlyPattern.length === 24) {
      const max = Math.max(...hourlyPattern, 1)
      return hourlyPattern.map((v) => (v / max) * 100)
    }
    // Fallback: model typical F&B pattern
    const pattern = [
      2, 1, 1, 1, 2, 4, 6, 8, 9, 10, 11, 12, 11, 8, 6, 5, 6, 8, 9, 10, 8, 5, 3, 2,
    ]
    const max = Math.max(...pattern)
    return pattern.map((v) => (v / max) * 100)
  }, [hourlyPattern])

  return (
    <div className={className}>
      <div className="flex items-end gap-0.5 sm:gap-1 h-20 sm:h-24">
        {data.map((pct, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 rounded-t bg-[#FF5200]/70 hover:bg-[#FF5200] transition-colors"
            style={{ height: `${Math.max(4, pct)}%` }}
            title={`${i}:00 — ${hourlyPattern?.[i]?.toLocaleString() ?? '~'} visitors`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>12a</span>
        <span>6a</span>
        <span>12p</span>
        <span>6p</span>
        <span>12a</span>
      </div>
      {dailyAverage != null && dailyAverage > 0 && (
        <p className="text-xs text-gray-600 mt-2">
          ~{dailyAverage.toLocaleString()} daily visitors in this zone • Category‑adjusted
        </p>
      )}
    </div>
  )
}

const mapContainerStyle = { width: '100%', height: '280px', borderRadius: '12px' }

export function LocationIntelligenceSection({
  propertyId,
  location,
  zone,
  propertyType,
  onGetReportClick,
  onTalkToTeamClick,
}: LocationIntelligenceSectionProps) {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [layerZone, setLayerZone] = useState(true)
  const [layerCompetitors, setLayerCompetitors] = useState(true)
  const { isLoggedIn } = useAuth()

  const { isLoaded: mapsLoaded, loadError: mapsError } = useLoadScript({
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const res = await fetch(`/api/location-reports?propertyId=${encodeURIComponent(propertyId)}`)
        const json = await res.json()
        if (!mounted) return
        if (!res.ok) {
          setError(json?.error || 'Failed to load')
          return
        }
        setReport(json?.report ?? null)
      } catch (e) {
        if (mounted) setError((e as Error)?.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [propertyId])

  const handleGetReport = () => {
    trackInquiry(propertyId, 'Location Report', 'location_report_cta')
    onGetReportClick?.() ?? (window.location.href = '/location-intelligence')
  }

  const handleTalkToTeam = () => {
    trackInquiry(propertyId, 'Talk to Team', 'location_talk_cta')
    onTalkToTeamClick?.() ?? (window.location.href = 'mailto:support@lokazen.in?subject=Location%20Intelligence%20Enquiry')
  }

  const center = getCenter(report, zone)
  const competitors = report?.competitors ?? []
  const zoneName = report?.zone?.name ?? zone
  const heatLevel = report?.zone?.heatLevel ?? 'medium'
  const isFree = report?.is_free === true
  const insights = report?.insights ?? []
  const showGatedInsights = !isFree && !isLoggedIn
  const showHeatmap = layerZone
  const heatmapData = useMemo(
    () => buildHeatmapData(center, layerCompetitors ? competitors : [], showHeatmap),
    [center.lat, center.lng, competitors, layerCompetitors, showHeatmap]
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
  }
  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

  if (loading) {
    return (
      <div className="mt-6 sm:mt-8 rounded-xl bg-[#0A0F1E] border border-[#FF5200]/30 p-6 sm:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-[#FF5200]/20 rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white/5 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-6 sm:mt-8"
    >
      <div className="rounded-xl sm:rounded-2xl bg-[#0A0F1E] border border-[#FF5200]/40 shadow-[0_0_30px_rgba(255,82,0,0.15)] overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-[#FF5200]/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Zone intelligence</h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Bangalore • 2025–26 • {getPropertyTypeLabel(propertyType)}
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border border-[#FF5200]/60 text-[#FF5200] bg-[#FF5200]/10 w-fit">
              Powered by loka.ai
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Footfall index', value: report?.footfallIndex, unit: '/100', insight: report?.footfallIndex != null ? (report.footfallIndex >= 70 ? 'Strong pedestrian traffic.' : report.footfallIndex >= 40 ? 'Moderate — weekend peaks help.' : 'Lower footfall — visibility matters.') : '—', invert: false },
              { label: 'Trade zone score', value: report?.tradeZoneScore, unit: '/100', insight: report?.tradeZoneScore != null ? (report.tradeZoneScore >= 70 ? 'High trade potential.' : report.tradeZoneScore >= 40 ? 'Balanced for your category.' : 'Position carefully.') : '—', invert: false },
              { label: 'Competitors nearby', value: report?.competitorDensity, unit: ' within 1 km', insight: report?.competitorDensity != null ? `${report.competitorDensity} nearby. ${(report.competitorDensity ?? 0) >= 15 ? 'Differentiate.' : 'Good whitespace.'}` : '—', invert: true },
              { label: 'Catchment households', value: report?.catchmentPopulation, unit: '', insight: report?.catchmentPopulation != null ? `~${report.catchmentPopulation.toLocaleString()} in catchment.` : 'Census‑derived.', invert: false },
              { label: 'Revenue potential', value: report?.scores?.revenueProjectionMonthly, unit: ' /mo', format: 'currency', insight: report?.scores?.revenueProjectionMonthly != null ? (report.scores.rentViability?.viable ? 'Rent vs revenue looks viable.' : 'Rent may be high for projected revenue.') : 'Category‑adjusted estimate.', invert: false },
            ].map((stat) => (
              <motion.div key={stat.label} variants={itemVariants} className={`rounded-lg border p-3 sm:p-4 ${signalBg(stat.value, stat.invert)}`}>
                <div className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase tracking-wide">{stat.label}</div>
                <div className={`text-lg sm:text-xl font-bold mt-1 ${signalColor(stat.value, stat.invert)}`}>
                  {stat.value != null
                    ? (stat as { format?: string }).format === 'currency' && stat.value >= 100000
                      ? `₹${(stat.value / 100000).toFixed(1)}L`
                      : (stat as { format?: string }).format === 'currency' && stat.value >= 1000
                        ? `₹${(stat.value / 1000).toFixed(0)}K`
                        : stat.value.toLocaleString()
                    : '—'}
                  {stat.unit}
                </div>
                <p className="text-[11px] sm:text-xs text-gray-600 mt-2 break-words">{stat.insight}</p>
              </motion.div>
            ))}
          </div>

          {/* Map + layers + footfall */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Layer toggles — platform language */}
              <div className="lg:w-48 shrink-0 space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Map overlays</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={layerZone} onChange={(e) => setLayerZone(e.target.checked)} className="rounded border-gray-300 text-[#FF5200] focus:ring-[#FF5200]" />
                  <span className="text-sm text-gray-700">Zone activity</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={layerCompetitors} onChange={(e) => setLayerCompetitors(e.target.checked)} className="rounded border-gray-300 text-[#FF5200] focus:ring-[#FF5200]" />
                  <span className="text-sm text-gray-700">Nearby outlets</span>
                </label>
                <div className="pt-2 text-[10px] text-gray-400">
                  Green → Red: low → high activity
                </div>
              </div>

              {/* Map */}
              <div className="flex-1 min-w-0 rounded-xl overflow-hidden border border-[#FF5200]/20 bg-[#0A0F1E]">
                {mapsLoaded && !mapsError && getGoogleMapsApiKey() ? (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={15}
                    options={{
                      ...DEFAULT_MAP_OPTIONS,
                      styles: [],
                      disableDefaultUI: true,
                      zoomControl: true,
                      gestureHandling: 'greedy',
                    }}
                  >
                    <Circle center={center} radius={800} options={{ strokeColor: '#FF5200', strokeOpacity: 0.4, strokeWeight: 1, fillColor: '#FF5200', fillOpacity: 0.04 }} />
                    <Marker
                      position={center}
                      icon={{
                        path: (window as any).google?.maps?.SymbolPath?.CIRCLE ?? 0,
                        scale: 10,
                        fillColor: '#E4002B',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                      }}
                    />
                    {layerCompetitors && competitors.slice(0, 25).map((c, i) => (
                      <Marker
                        key={i}
                        position={{ lat: c.lat, lng: c.lng }}
                        icon={{
                          path: (window as any).google?.maps?.SymbolPath?.CIRCLE ?? 0,
                          scale: 5,
                          fillColor: '#FF6B35',
                          fillOpacity: 0.9,
                          strokeColor: '#fff',
                          strokeWeight: 1,
                        }}
                      />
                    ))}
                    {showHeatmap && heatmapData.length > 0 && (
                      <HeatmapLayer
                        data={heatmapData}
                        options={{
                          radius: 40,
                          opacity: 0.6,
                          gradient: ['rgba(0,255,0,0)', 'rgba(0,255,0,0.5)', 'rgba(255,255,0,0.7)', 'rgba(255,165,0,0.8)', 'rgba(255,82,0,0.9)'],
                        }}
                      />
                    )}
                  </GoogleMap>
                ) : (
                  <div className="h-[280px] flex items-center justify-center bg-[#0d1525] text-gray-500 text-sm">
                    {mapsError ? 'Map unavailable' : 'Loading map…'}
                  </div>
                )}
              </div>
            </div>

            {/* Footfall by hour — bar chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Footfall by hour</h4>
              <FootfallBarChart
                hourlyPattern={report?.footfall?.hourlyPattern}
                dailyAverage={report?.footfall?.dailyAverage}
              />
            </div>
          </motion.div>

          {/* Micro-zone label */}
          <motion.div variants={itemVariants} className="rounded-lg bg-[#0d1525] border border-[#FF5200]/20 px-4 py-3">
            <div className="text-xs font-medium text-[#FF5200] uppercase tracking-wider">Zone</div>
            <p className="text-sm sm:text-base font-semibold text-white mt-0.5">
              {zoneName} — {heatLevel === 'high' ? 'High' : heatLevel === 'medium' ? 'Medium' : 'Low'} activity {getPropertyTypeLabel(propertyType)}
            </p>
          </motion.div>

          {/* Insight cards */}
          {insights.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {insights.slice(0, 3).map((insight, idx) => (
                <motion.div key={idx} variants={itemVariants} className={`relative rounded-xl border border-slate-200 bg-white p-4 sm:p-5 overflow-visible ${showGatedInsights ? 'min-h-[120px]' : ''}`}>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">{insight.headline}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">{showGatedInsights ? insight.firstSentence : (insight.fullText ?? insight.firstSentence)}</p>
                  {showGatedInsights && (
                    <>
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-end justify-center pb-4 rounded-xl" />
                      <div className="absolute inset-0 flex items-end justify-center pb-4 z-10">
                        <Link href="/location-intelligence" className="text-sm font-semibold text-[#FF5200] hover:text-[#E4002B]">Unlock full report →</Link>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA */}
          <motion.div variants={itemVariants} className="rounded-xl border border-[#FF5200]/30 bg-gradient-to-br from-[#0A0F1E] to-[#0d1525] p-6 sm:p-8">
            <h4 className="text-lg sm:text-xl font-bold text-white mb-2">Make data‑backed decisions before you commit.</h4>
            <p className="text-sm text-gray-400 mb-6">Full zone report • Competitor mapping • Catchment demographics • Site scoring</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button onClick={handleGetReport} className="px-6 py-3 rounded-lg font-semibold text-white bg-[#FF5200] hover:bg-[#E4002B] transition-colors">Get location report</button>
              <button onClick={handleTalkToTeam} className="px-6 py-3 rounded-lg font-semibold text-[#FF5200] border-2 border-[#FF5200] bg-transparent hover:bg-[#FF5200]/10 transition-colors">Talk to our team</button>
            </div>
          </motion.div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-amber-600 text-center">{error}</p>}
    </motion.section>
  )
}

export default LocationIntelligenceSection
