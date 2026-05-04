'use client'

import { useCallback, useLayoutEffect, useState } from 'react'
import { Check, ExternalLink, MapPin, Route } from 'lucide-react'
import {
  VISIT_SCHEDULE,
  VISIT_ROUTE_MAPS_URL,
  bfiBadgeClass,
  visitStatusStyles,
} from './visit-schedule-data'

const DONE_LS_KEY = 'lokazen-hyd-visit-site-done-v1'

function loadDoneMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(DONE_LS_KEY)
    if (!raw) return {}
    const p = JSON.parse(raw) as unknown
    if (typeof p !== 'object' || p === null || Array.isArray(p)) return {}
    const out: Record<string, boolean> = {}
    for (const [k, v] of Object.entries(p)) {
      if (typeof v === 'boolean') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

function VisitDoneBar({
  rowId,
  done,
  onToggle,
}: {
  rowId: string
  done: boolean
  onToggle: (id: string) => void
}) {
  return (
    <div
      className={`mt-3 flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors sm:py-2.5 ${
        done ? 'border-emerald-200 bg-emerald-50/90' : 'border-[#E8E1D3] bg-[#FAF7F1]/90'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        {done ? (
          <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
        ) : null}
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-600 sm:text-xs">
          Site visit done
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={done}
        aria-label={done ? 'Mark site visit as not complete' : 'Mark site visit as complete'}
        onClick={() => onToggle(rowId)}
        className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5200] ${
          done ? 'justify-end bg-emerald-600' : 'justify-start bg-stone-300'
        }`}
      >
        <span className="pointer-events-none block h-6 w-6 rounded-full bg-white shadow-sm ring-1 ring-black/5" />
      </button>
    </div>
  )
}

export function VisitScheduleFeedback() {
  const [visitDone, setVisitDone] = useState<Record<string, boolean>>({})

  useLayoutEffect(() => {
    setVisitDone(loadDoneMap())
  }, [])

  const toggleDone = useCallback((id: string) => {
    setVisitDone((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try {
        localStorage.setItem(DONE_LS_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return (
    <>
      <ol className="mt-8 sm:mt-10 space-y-3 sm:space-y-4 list-none p-0 m-0">
        {VISIT_SCHEDULE.map((row) => {
          const st = visitStatusStyles(row.status)
          const isDone = Boolean(visitDone[row.rowId])
          return (
            <li key={row.rowId}>
              <div
                className={`rounded-xl border border-l-[3px] border-l-[#FF5200]/35 pl-3.5 transition-colors duration-200 sm:pl-4 md:border-l-4 md:pl-5 ${
                  isDone
                    ? 'border-emerald-200/80 bg-emerald-50/30 hover:bg-emerald-50/50'
                    : 'border-[#E8E1D3] bg-white hover:bg-[#F5F1EA]/70'
                }`}
              >
                <div className="flex flex-col gap-3 py-4 pr-4 sm:py-5 sm:pr-5 md:grid md:grid-cols-[140px_minmax(0,1fr)_auto] md:gap-x-6 md:gap-y-1 md:items-start md:py-5 md:pr-6">
                  <a
                    href={row.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/time flex shrink-0 items-center gap-2 text-xs font-semibold text-stone-600 hover:text-[#B83200] sm:text-sm md:w-[140px] md:flex-col md:items-start md:gap-2 md:text-lg md:font-semibold md:text-[#1A1A14] md:leading-none"
                    aria-label={`Open ${row.title} in Maps at ${row.time}`}
                  >
                    <MapPin
                      className="h-4 w-4 shrink-0 text-[#FF5200] md:h-5 md:w-5"
                      aria-hidden
                    />
                    <span className="border-b border-dashed border-stone-300 group-hover/time:border-[#FF5200]/50 md:border-0">
                      {row.time}
                    </span>
                  </a>

                  <div className="min-w-0 md:pt-0.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                      <h3 className="text-base font-bold text-[#1A1A14] leading-snug sm:text-[17px]">
                        {row.title}
                      </h3>
                      {row.lead ? (
                        <span className="inline-flex items-center rounded-md bg-[#FF5200]/12 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#B83200] ring-1 ring-[#FF5200]/25">
                          LEAD
                        </span>
                      ) : null}
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${bfiBadgeClass(row.bfi)}`}
                      >
                        BFI {row.bfi}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${st.dot}`} aria-hidden />
                      <span className={`text-sm font-medium ${st.text}`}>{row.status}</span>
                    </div>
                    {row.poc ? (
                      <p className="mt-2 text-sm font-semibold text-stone-800">POC: {row.poc}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-stone-600 leading-relaxed">{row.note}</p>
                    <VisitDoneBar rowId={row.rowId} done={isDone} onToggle={toggleDone} />
                  </div>

                  <div className="flex pt-1 md:justify-end md:pt-0.5">
                    <a
                      href={row.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B83200] hover:text-[#FF5200] transition-colors"
                    >
                      Open in Maps
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    </a>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-4 sm:mt-5 rounded-xl border border-[#E8E1D3] bg-[#F5F1EA] p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 gap-3">
            <Route className="h-5 w-5 shrink-0 text-[#FF5200] mt-0.5" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                Multi-stop route
              </p>
              <p className="mt-1 text-sm sm:text-base text-stone-700 font-medium leading-snug">
                Open all 5 stops in Google Maps
              </p>
            </div>
          </div>
          <a
            href={VISIT_ROUTE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-[#FF5200] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E4002B] transition-colors sm:self-center"
          >
            Open route
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          </a>
        </div>
      </div>
    </>
  )
}
