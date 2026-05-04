'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  ExternalLink,
  MapPin,
  Route,
} from 'lucide-react'
import {
  VISIT_SCHEDULE,
  VISIT_ROUTE_MAPS_URL,
  bfiBadgeClass,
  visitStatusStyles,
} from './visit-schedule-data'

type RowVisitState = { confirmed: boolean; confirmedAt: string | null }

function formatConfirmedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const time = d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const datePart = d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
  })
  return `Confirmed at ${time}, ${datePart}`
}

function VisitDoneBar({
  propertyIdConfigured,
  confirmed,
  confirmedAtIso,
  busy,
  error,
  onToggle,
  rowId,
}: {
  propertyIdConfigured: boolean
  confirmed: boolean
  confirmedAtIso: string | null
  busy: boolean
  error: string | null
  onToggle: (id: string, next: boolean) => void
  rowId: string
}) {
  const disabled = busy || !propertyIdConfigured

  return (
    <div
      className="mt-3 rounded-xl border border-[#E8E1D3] px-3 py-3 sm:px-4 sm:py-3.5"
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
              aria-busy={busy}
              disabled={disabled}
              title={
                propertyIdConfigured
                  ? confirmed
                    ? 'Mark visit as not complete'
                    : 'Mark visit complete'
                  : 'Set NEXT_PUBLIC_KIND_HYD_*_PROPERTY_ID to enable sync'
              }
              onClick={() => onToggle(rowId, !confirmed)}
              className={`relative flex h-9 w-[3.35rem] shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5200] disabled:cursor-not-allowed disabled:opacity-45 ${
                confirmed ? 'justify-end bg-[#FF5200]' : 'justify-start bg-stone-300'
              }`}
            >
              <span className="pointer-events-none block h-7 w-7 rounded-full bg-white shadow-md ring-1 ring-black/5" />
            </button>
          </div>
          {confirmed && confirmedAtIso ? (
            <p className="mt-1.5 text-xs text-stone-500">{formatConfirmedAt(confirmedAtIso)}</p>
          ) : null}
          {!propertyIdConfigured ? (
            <p className="mt-1.5 text-xs text-stone-500">
              Sync disabled until property UUID env vars are set for this row.
            </p>
          ) : null}
          {error ? <p className="mt-1.5 text-xs font-medium text-red-700">{error}</p> : null}
        </div>
      </div>
    </div>
  )
}

function VisitCollapsedSummary({
  row,
  confirmedAtIso,
  onExpand,
}: {
  row: (typeof VISIT_SCHEDULE)[number]
  confirmedAtIso: string | null
  onExpand: () => void
}) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#FFF8F2]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5200] sm:gap-4 sm:px-4 sm:py-3.5"
      aria-expanded={false}
      aria-label={`Expand details for ${row.title}`}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#FF5200] bg-[#FF5200]/12"
        aria-hidden
      >
        <Check className="h-4 w-4 text-[#FF5200]" strokeWidth={2.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <span className="text-sm font-bold text-[#1A1A14]">{row.title}</span>
          <span className="shrink-0 text-xs font-semibold text-stone-500">{row.time}</span>
        </div>
        {confirmedAtIso ? (
          <p className="mt-0.5 truncate text-xs text-stone-500">
            {formatConfirmedAt(confirmedAtIso)}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-stone-500">Site visit marked done</p>
        )}
      </div>
      <ChevronDown className="h-5 w-5 shrink-0 text-stone-400" aria-hidden />
    </button>
  )
}

export function VisitScheduleFeedback() {
  const [byRowId, setByRowId] = useState<Record<string, RowVisitState>>({})
  const byRowIdRef = useRef(byRowId)
  /** When visit is done, row is collapsed unless user expanded it here. */
  const [doneRowExpanded, setDoneRowExpanded] = useState<Record<string, boolean>>({})
  const [busyRow, setBusyRow] = useState<string | null>(null)
  const [errorByRow, setErrorByRow] = useState<Record<string, string | null>>({})

  useEffect(() => {
    byRowIdRef.current = byRowId
  }, [byRowId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/hyderabad/site-visit-brand-status', { method: 'GET' })
        const data = (await res.json()) as {
          byRowId?: Record<string, RowVisitState>
        }
        if (!cancelled && data.byRowId) {
          setByRowId(data.byRowId)
        }
      } catch {
        /* keep defaults */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const toggleDone = useCallback(async (rowId: string, next: boolean) => {
    const prev = byRowIdRef.current[rowId] ?? { confirmed: false, confirmedAt: null }
    setErrorByRow((e) => ({ ...e, [rowId]: null }))
    const optimistic: RowVisitState = {
      confirmed: next,
      confirmedAt: next ? new Date().toISOString() : null,
    }
    setByRowId((s) => ({ ...s, [rowId]: optimistic }))
    if (next) {
      setDoneRowExpanded((e) => ({ ...e, [rowId]: false }))
    } else {
      setDoneRowExpanded((e) => {
        const { [rowId]: _, ...rest } = e
        return rest
      })
    }
    setBusyRow(rowId)
    try {
      const res = await fetch('/api/hyderabad/site-visit-brand-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, confirmed: next }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean
        confirmed?: boolean
        brandConfirmedAt?: string | null
        error?: string
      }
      if (!res.ok || !data.success) {
        setByRowId((s) => ({ ...s, [rowId]: prev }))
        setErrorByRow((e) => ({
          ...e,
          [rowId]: data.error || `Could not save (${res.status})`,
        }))
        return
      }
      setByRowId((s) => ({
        ...s,
        [rowId]: {
          confirmed: Boolean(data.confirmed),
          confirmedAt: data.brandConfirmedAt ?? null,
        },
      }))
      if (data.confirmed) {
        setDoneRowExpanded((e) => ({ ...e, [rowId]: false }))
      } else {
        setDoneRowExpanded((e) => {
          const { [rowId]: _r, ...rest } = e
          return rest
        })
      }
    } catch {
      setByRowId((s) => ({ ...s, [rowId]: prev }))
      setErrorByRow((e) => ({ ...e, [rowId]: 'Network error' }))
    } finally {
      setBusyRow(null)
    }
  }, [])

  return (
    <>
      <ol className="mt-8 sm:mt-10 space-y-3 sm:space-y-4 list-none p-0 m-0">
        {VISIT_SCHEDULE.map((row) => {
          const st = visitStatusStyles(row.status)
          const visit = byRowId[row.rowId] ?? { confirmed: false, confirmedAt: null }
          const isDone = visit.confirmed
          const configured = Boolean(row.propertyId)
          const isExpanded = !isDone || doneRowExpanded[row.rowId] === true
          return (
            <li key={row.rowId}>
              <div
                className={`rounded-xl border border-l-[3px] border-l-[#FF5200]/35 pl-3.5 transition-colors duration-200 sm:pl-4 md:border-l-4 md:pl-5 ${
                  isDone && !isExpanded
                    ? 'border-[#E8E1D3] bg-[#FFFCF8]'
                    : isDone
                      ? 'border-[#E8E1D3] bg-white'
                      : 'border-[#E8E1D3] bg-white hover:bg-[#F5F1EA]/70'
                }`}
              >
                {isDone && !isExpanded ? (
                  <VisitCollapsedSummary
                    row={row}
                    confirmedAtIso={visit.confirmedAt}
                    onExpand={() =>
                      setDoneRowExpanded((e) => ({ ...e, [row.rowId]: true }))
                    }
                  />
                ) : (
                  <>
                    {isDone && isExpanded ? (
                      <div className="flex justify-end border-b border-[#E8E1D3] px-3 pt-2 sm:px-4 sm:pt-2.5 md:px-5 md:pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            setDoneRowExpanded((e) => ({ ...e, [row.rowId]: false }))
                          }
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5200]"
                          aria-expanded={true}
                          aria-controls={`visit-details-${row.rowId}`}
                        >
                          <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
                          Hide details
                        </button>
                      </div>
                    ) : null}
                    <div
                      id={`visit-details-${row.rowId}`}
                      className="flex flex-col gap-3 py-4 pr-4 sm:py-5 sm:pr-5 md:grid md:grid-cols-[140px_minmax(0,1fr)_auto] md:gap-x-6 md:gap-y-1 md:items-start md:py-5 md:pr-6"
                    >
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
                    <VisitDoneBar
                      rowId={row.rowId}
                      propertyIdConfigured={configured}
                      confirmed={visit.confirmed}
                      confirmedAtIso={visit.confirmedAt}
                      busy={busyRow === row.rowId}
                      error={errorByRow[row.rowId] ?? null}
                      onToggle={toggleDone}
                    />
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
                  </>
                )}
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
