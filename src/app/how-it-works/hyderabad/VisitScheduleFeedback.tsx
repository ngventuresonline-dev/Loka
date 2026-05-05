'use client'

import { useCallback, useState } from 'react'
import { Check, Circle, Clock, ExternalLink, MapPin, Route } from 'lucide-react'
import {
  VISIT_SCHEDULE,
  VISIT_ROUTE_MAPS_URL,
  bfiBadgeClass,
  visitStatusStyles,
} from './visit-schedule-data'

function SiteVisitDoneToggle({
  rowId,
  confirmed,
  onToggle,
}: {
  rowId: string
  confirmed: boolean
  onToggle: (id: string, next: boolean) => void
}) {
  return (
    <div
      className="rounded-xl border border-[#E8E1D3] px-3 py-3 sm:px-4 sm:py-3.5"
      style={{ backgroundColor: '#FFF8F2' }}
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#FF5200] ${
            confirmed ? 'bg-[#FF5200]/12' : 'bg-white'
          }`}
          aria-hidden
        >
          {confirmed ? (
            <Check className="h-4 w-4 text-[#FF5200]" strokeWidth={2.75} />
          ) : (
            <Circle className="h-4 w-4 text-[#FF5200]" strokeWidth={2.25} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-[#1A1A14]">Site visit done</span>
            <button
              type="button"
              role="switch"
              aria-checked={confirmed}
              aria-label={confirmed ? 'Mark site visit as not done' : 'Mark site visit as done'}
              title={confirmed ? 'Mark visit as not complete' : 'Mark visit complete'}
              onClick={() => onToggle(rowId, !confirmed)}
              className={`relative flex h-9 w-[3.35rem] shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5200] ${
                confirmed ? 'justify-end bg-[#FF5200]' : 'justify-start bg-stone-300'
              }`}
            >
              <span className="pointer-events-none block h-7 w-7 rounded-full bg-white shadow-md ring-1 ring-black/5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function VisitScheduleFeedback() {
  const [doneByRow, setDoneByRow] = useState<Record<string, boolean>>({})

  const setDone = useCallback((rowId: string, next: boolean) => {
    setDoneByRow((s) => ({ ...s, [rowId]: next }))
  }, [])

  return (
    <>
      <ol className="mt-8 sm:mt-10 space-y-4 sm:space-y-5 list-none p-0 m-0">
        {VISIT_SCHEDULE.map((row) => {
          const st = visitStatusStyles(row.status)
          const done = doneByRow[row.rowId] ?? false
          return (
            <li key={row.rowId}>
              <article className="overflow-hidden rounded-2xl border border-[#E8E1D3] border-l-[3px] border-l-[#FF5200]/50 bg-white shadow-sm transition-shadow hover:shadow-md md:border-l-4">
                <header className="border-b border-[#E8E1D3] bg-[#FAF7F1]/80 px-4 py-3.5 sm:px-5 sm:py-4">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                    <h3 className="min-w-0 flex-1 text-base font-bold leading-snug text-[#1A1A14] sm:text-[17px]">
                      {row.title}
                    </h3>
                    {row.lead ? (
                      <span className="inline-flex shrink-0 items-center rounded-md bg-[#FF5200]/12 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#B83200] ring-1 ring-[#FF5200]/25">
                        LEAD
                      </span>
                    ) : null}
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${bfiBadgeClass(row.bfi)}`}
                    >
                      BFI {row.bfi}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-stone-700">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-[#FF5200]" aria-hidden />
                    {row.time}
                  </p>
                </header>

                <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${st.dot}`} aria-hidden />
                    <span className={`text-sm font-medium ${st.text}`}>{row.status}</span>
                  </div>
                  {row.poc ? (
                    <p className="text-sm font-semibold text-stone-800">POC: {row.poc}</p>
                  ) : null}
                  <p className="text-sm leading-relaxed text-stone-600">{row.note}</p>
                </div>

                <footer className="space-y-3 border-t border-[#E8E1D3] bg-white px-4 py-4 sm:px-5 sm:py-4">
                  <SiteVisitDoneToggle rowId={row.rowId} confirmed={done} onToggle={setDone} />
                  <a
                    href={row.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8E1D3] bg-[#FAF7F1]/60 px-4 py-3 text-sm font-semibold text-[#B83200] transition-colors hover:border-[#FF5200]/30 hover:bg-[#FFF8F2] hover:text-[#FF5200] sm:w-auto sm:justify-start"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-[#FF5200]" aria-hidden />
                    Open in Maps
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  </a>
                </footer>
              </article>
            </li>
          )
        })}
      </ol>

      <div className="mt-4 sm:mt-5 rounded-xl border border-[#E8E1D3] bg-[#F5F1EA] p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 gap-3">
            <Route className="mt-0.5 h-5 w-5 shrink-0 text-[#FF5200]" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                Multi-stop route
              </p>
              <p className="mt-1 text-sm font-medium leading-snug text-stone-700 sm:text-base">
                Open all 4 stops in Google Maps
              </p>
            </div>
          </div>
          <a
            href={VISIT_ROUTE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-[#FF5200] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E4002B] sm:self-center"
          >
            Open route
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          </a>
        </div>
      </div>
    </>
  )
}
