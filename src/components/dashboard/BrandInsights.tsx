'use client'

import { useEffect, useState, useCallback, type ReactNode } from 'react'
import Link from 'next/link'
import { formatDistanceToNowStrict } from 'date-fns'
import { encodePropertyId } from '@/lib/property-slug'
import type { BrandInsightsStored } from '@/lib/ai/brand-insights-types'

type ApiReady = {
  status: 'ready'
  insights: BrandInsightsStored
  generatedAt: string
  expiresAt: string
}

type ApiGenerating = {
  status: 'generating'
  message?: string
}

type FetchState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'ready'; data: ApiReady }
  | { phase: 'generating'; data: ApiGenerating }
  | { phase: 'error'; message: string }

export type BrandInsightsProps = {
  brandId: string
  /** Optional: helps server auth resolve the session (same pattern as other brand APIs) */
  userEmail?: string | null
}

export function BrandInsights({ brandId, userEmail }: BrandInsightsProps) {
  const [state, setState] = useState<FetchState>({ phase: 'idle' })

  const load = useCallback(async () => {
    if (!brandId) return
    setState({ phase: 'loading' })
    try {
      const qs = new URLSearchParams()
      qs.set('userId', brandId)
      if (userEmail) qs.set('userEmail', userEmail)
      const res = await fetch(`/api/ai/insights/${encodeURIComponent(brandId)}?${qs.toString()}`, {
        credentials: 'same-origin',
      })
      const json = (await res.json()) as ApiReady | ApiGenerating | { error?: string }
      if (!res.ok) {
        setState({ phase: 'error', message: (json as { error?: string }).error || 'Could not load insights' })
        return
      }
      if ('status' in json && json.status === 'generating') {
        setState({ phase: 'generating', data: json })
        return
      }
      if ('status' in json && json.status === 'ready' && 'insights' in json) {
        setState({ phase: 'ready', data: json as ApiReady })
        return
      }
      setState({ phase: 'error', message: 'Unexpected response' })
    } catch {
      setState({ phase: 'error', message: 'Network error' })
    }
  }, [brandId, userEmail])

  useEffect(() => {
    void load()
  }, [load])

  const lastUpdated =
    state.phase === 'ready'
      ? formatDistanceToNowStrict(new Date(state.data.generatedAt), { addSuffix: true })
      : null

  return (
    <section
      className="rounded-2xl border border-emerald-900/15 bg-gradient-to-br from-[#0a2e2e] via-[#0d3a38] to-[#0a2524] p-6 text-stone-100 shadow-lg"
      aria-labelledby="brand-insights-heading"
    >
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">Loka.ai</p>
          <h2 id="brand-insights-heading" className="font-serif text-xl font-semibold text-stone-50 sm:text-2xl">
            Market insights
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Refreshed on a schedule — not generated when you open this page.
          </p>
        </div>
        {lastUpdated && (
          <p className="text-sm text-stone-400">Last updated {lastUpdated}</p>
        )}
      </div>

      {(state.phase === 'loading' || state.phase === 'idle') && (
        <div className="grid gap-4 md:grid-cols-3">
          <InsightCard title="Market pulse" accent="amber">
            <p className="text-sm text-stone-400">Reading saved insights…</p>
          </InsightCard>
          <InsightCard title="Top matches" accent="emerald" className="md:col-span-1">
            <p className="text-sm text-stone-400">Reading saved insights…</p>
          </InsightCard>
          <InsightCard title="Zone alert" accent="rose">
            <p className="text-sm text-stone-400">Reading saved insights…</p>
          </InsightCard>
        </div>
      )}

      {state.phase === 'generating' && (
        <div className="rounded-xl border border-amber-400/25 bg-black/20 px-4 py-6 text-center">
          <p className="text-stone-200">Insights updating…</p>
          <p className="mt-2 text-sm text-stone-400">
            {state.data.message ||
              'Your next scheduled insight run will populate this section. Check back soon.'}
          </p>
        </div>
      )}

      {state.phase === 'error' && (
        <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">
          {state.message}
        </p>
      )}

      {state.phase === 'ready' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <InsightCard title="Market pulse" accent="amber">
            {state.data.insights.market_pulse.length === 0 ? (
              <p className="text-sm text-stone-400">No market pulse lines in this snapshot.</p>
            ) : (
              <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-stone-200">
                {state.data.insights.market_pulse.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </InsightCard>

          <InsightCard title="Top matches" accent="emerald" className="lg:col-span-1">
            {state.data.insights.property_recommendations.length === 0 ? (
              <p className="text-sm text-stone-400">No property picks in this run. Next refresh may include matches.</p>
            ) : (
              <ul className="space-y-4">
                {state.data.insights.property_recommendations.map((m) => (
                  <li key={m.property_id || m.title} className="text-sm">
                    {m.property_id ? (
                      <Link
                        href={`/properties/${encodePropertyId(m.property_id)}`}
                        className="font-medium text-amber-100 underline decoration-amber-400/40 underline-offset-2 hover:decoration-amber-300"
                      >
                        {m.title || 'View listing'}
                      </Link>
                    ) : (
                      <span className="font-medium text-stone-100">{m.title}</span>
                    )}
                    <p className="mt-1 text-stone-400">{m.reasoning}</p>
                  </li>
                ))}
              </ul>
            )}
          </InsightCard>

          <InsightCard title="Zone alert" accent="rose">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-200/90">
              {(state.data.insights.zone_alerts.type || 'update').replace(/_/g, ' ')}
            </p>
            <p className="mt-2 font-medium text-stone-100">{state.data.insights.zone_alerts.headline}</p>
            <p className="mt-2 text-sm text-stone-400">{state.data.insights.zone_alerts.detail}</p>
          </InsightCard>
        </div>
      )}
    </section>
  )
}

function InsightCard({
  title,
  accent,
  children,
  className = '',
}: {
  title: string
  accent: 'amber' | 'emerald' | 'rose'
  children: ReactNode
  className?: string
}) {
  const ring =
    accent === 'amber'
      ? 'border-amber-400/20'
      : accent === 'emerald'
        ? 'border-emerald-400/20'
        : 'border-rose-400/20'
  return (
    <div
      className={`rounded-xl border ${ring} bg-black/25 p-4 backdrop-blur-sm ${className}`}
    >
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-300">{title}</h3>
      {children}
    </div>
  )
}
