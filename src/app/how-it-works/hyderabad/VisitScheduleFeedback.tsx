import { ExternalLink, MapPin, Route } from 'lucide-react'
import {
  VISIT_SCHEDULE,
  VISIT_ROUTE_MAPS_URL,
  bfiBadgeClass,
  visitStatusStyles,
} from './visit-schedule-data'

export function VisitScheduleFeedback() {
  return (
    <>
      <ol className="mt-8 sm:mt-10 space-y-3 sm:space-y-4 list-none p-0 m-0">
        {VISIT_SCHEDULE.map((row) => {
          const st = visitStatusStyles(row.status)
          return (
            <li key={row.rowId}>
              <div className="rounded-xl border border-l-[3px] border-l-[#FF5200]/35 border-[#E8E1D3] bg-white pl-3.5 transition-colors duration-200 hover:bg-[#F5F1EA]/70 sm:pl-4 md:border-l-4 md:pl-5">
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
