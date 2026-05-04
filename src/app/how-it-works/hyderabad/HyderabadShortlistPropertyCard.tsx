'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { bfiBadgeClass } from './visit-schedule-data'
import type { Verdict } from './hyderabad-shortlist-types'
import { verdictPillClass } from './hyderabad-shortlist-types'

export type HyderabadCardProperty = {
  id: string
  feedbackCode: string
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

const BRAND_SLUG = 'the-kind-roastery'

type ApiRent = 'yes' | 'no' | 'negotiate' | 'unsure' | null
type ApiSize = 'yes' | 'no' | 'too_small' | 'too_large' | 'unsure' | null
type ApiVis = 'yes' | 'no' | 'unsure' | null
type ApiOverall = 'shortlist' | 'maybe' | 'pass' | null

function ChipRow({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string
  options: { label: string; value: string }[]
  value: string | null
  onChange: (next: string | null) => void
}) {
  return (
    <fieldset className="min-w-0 border-0 p-0 m-0">
      <legend className="mb-1.5 block w-full text-left text-xs font-semibold text-stone-600">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={legend}>
        {options.map((o) => {
          const selected = value === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(selected ? null : o.value)}
              className={`min-h-9 rounded-full border px-3 py-2 text-left text-xs font-semibold transition-colors sm:text-[13px] ${
                selected
                  ? 'border-[#FF5200] bg-[#FF5200] text-white shadow-sm'
                  : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function HyderabadShortlistPropertyCard({
  p,
  headingFontClass,
}: {
  p: HyderabadCardProperty
  headingFontClass: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [rent, setRent] = useState<ApiRent>(null)
  const [size, setSize] = useState<ApiSize>(null)
  const [visibility, setVisibility] = useState<ApiVis>(null)
  const [overall, setOverall] = useState<ApiOverall>(null)
  const [notes, setNotes] = useState('')
  const [submitterName, setSubmitterName] = useState('')
  const [submitterRole, setSubmitterRole] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/brand-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_slug: BRAND_SLUG,
          property_code: p.feedbackCode,
          property_name: p.name,
          rent_ok: rent,
          size_ok: size,
          visibility_ok: visibility,
          overall_verdict: overall,
          feedback_text: notes.trim() || null,
          submitter_name: submitterName.trim() || null,
          submitter_role: submitterRole.trim() || null,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        setError(data.error || 'Something went wrong.')
        return
      }
      setSubmitted(true)
      setExpanded(false)
      setRent(null)
      setSize(null)
      setVisibility(null)
      setOverall(null)
      setNotes('')
      setSubmitterName('')
      setSubmitterRole('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article
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
        <h3 className={`${headingFontClass} text-lg sm:text-xl font-bold text-[#1A1A14] leading-snug mb-3`}>
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
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-[#FF5200] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E4002B] transition-colors text-center"
          >
            View Full LIR
          </Link>
          <Link
            href={p.maps}
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border-2 border-[#FF5200]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#B83200] hover:border-[#FF5200] hover:bg-[#FF5200]/5 transition-colors text-center"
          >
            View on Maps
          </Link>
        </div>

        <div className="mt-5 border-t border-[#E8E1D3] pt-4">
          {submitted ? (
            <p className="text-sm font-medium text-emerald-800">Thanks — recorded.</p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setExpanded((v) => !v)
                  setError(null)
                }}
                className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50 hover:text-[#B83200]"
                aria-expanded={expanded}
              >
                Share feedback
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>

              {expanded ? (
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <ChipRow
                    legend="Rent"
                    value={rent}
                    onChange={(v) => setRent(v as ApiRent)}
                    options={[
                      { label: 'Yes', value: 'yes' },
                      { label: 'Negotiate', value: 'negotiate' },
                      { label: 'No', value: 'no' },
                      { label: 'Unsure', value: 'unsure' },
                    ]}
                  />
                  <ChipRow
                    legend="Size"
                    value={size}
                    onChange={(v) => setSize(v as ApiSize)}
                    options={[
                      { label: 'Yes', value: 'yes' },
                      { label: 'Too small', value: 'too_small' },
                      { label: 'Too large', value: 'too_large' },
                      { label: 'Unsure', value: 'unsure' },
                    ]}
                  />
                  <ChipRow
                    legend="Visibility"
                    value={visibility}
                    onChange={(v) => setVisibility(v as ApiVis)}
                    options={[
                      { label: 'Yes', value: 'yes' },
                      { label: 'No', value: 'no' },
                      { label: 'Unsure', value: 'unsure' },
                    ]}
                  />
                  <ChipRow
                    legend="Overall"
                    value={overall}
                    onChange={(v) => setOverall(v as ApiOverall)}
                    options={[
                      { label: 'Shortlist', value: 'shortlist' },
                      { label: 'Maybe', value: 'maybe' },
                      { label: 'Pass', value: 'pass' },
                    ]}
                  />

                  <div>
                    <label htmlFor={`qf-notes-${p.id}`} className="mb-1.5 block text-xs font-semibold text-stone-600">
                      Notes
                    </label>
                    <textarea
                      id={`qf-notes-${p.id}`}
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything else worth flagging…"
                      className="w-full min-h-[4.5rem] resize-y rounded-lg border border-[#E8E1D3] bg-[#FAF7F1]/80 px-3 py-2 text-sm text-[#1A1A14] placeholder:text-stone-400 outline-none focus:border-[#FF5200]/50 focus:ring-2 focus:ring-[#FF5200]/15"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`qf-name-${p.id}`}
                        className="mb-1.5 block text-xs font-semibold text-stone-600"
                      >
                        Your name (optional)
                      </label>
                      <input
                        id={`qf-name-${p.id}`}
                        type="text"
                        value={submitterName}
                        onChange={(e) => setSubmitterName(e.target.value)}
                        autoComplete="name"
                        className="h-10 w-full rounded-lg border border-[#E8E1D3] bg-white px-3 text-sm outline-none focus:border-[#FF5200]/50 focus:ring-2 focus:ring-[#FF5200]/15"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`qf-role-${p.id}`}
                        className="mb-1.5 block text-xs font-semibold text-stone-600"
                      >
                        Role (optional)
                      </label>
                      <input
                        id={`qf-role-${p.id}`}
                        type="text"
                        value={submitterRole}
                        onChange={(e) => setSubmitterRole(e.target.value)}
                        placeholder="e.g. Founder, Ops"
                        className="h-10 w-full rounded-lg border border-[#E8E1D3] bg-white px-3 text-sm outline-none focus:border-[#FF5200]/50 focus:ring-2 focus:ring-[#FF5200]/15"
                      />
                    </div>
                  </div>

                  {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#FF5200] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E4002B] disabled:opacity-60 transition-colors"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Sending…
                      </>
                    ) : (
                      'Send feedback'
                    )}
                  </button>
                </form>
              ) : null}
            </>
          )}
        </div>
      </div>
    </article>
  )
}
