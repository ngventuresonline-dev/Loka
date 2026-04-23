'use client'

import { useCallback, useRef, useState } from 'react'
import { Handshake, MapPin, Users } from 'lucide-react'
import Logo from '@/components/Logo'

const BRAND_ORANGE = '#FF5200'
const BRAND_DARK = '#0F0E0D'
const CARD_DARK = '#1A1917'
const BORDER_MUTED = '#2C2C2A'
const SECTION_LIGHT = '#F5F3EF'

const EXPERIENCE_OPTIONS = ['Fresher', '1–2 years', '2–4 years', '4+ years'] as const
const LANGUAGE_OPTIONS = ['Kannada', 'Hindi', 'English', 'Tamil', 'Telugu', 'Other'] as const

const FIELD_CLASS =
  'w-full rounded-lg border border-[#2C2C2A] bg-[#1A1917] px-4 py-3 text-white outline-none transition-[box-shadow,border-color] placeholder:text-neutral-500 focus:border-[#FF5200] focus:ring-1 focus:ring-[#FF5200]'

export default function PamCareersContent() {
  const applySectionRef = useRef<HTMLElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [currentCity, setCurrentCity] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [languages, setLanguages] = useState<Record<string, boolean>>({})
  const [twoWheeler, setTwoWheeler] = useState<'yes' | 'no' | ''>('')
  const [whyRole, setWhyRole] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const scrollToApply = () => {
    applySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) => ({ ...prev, [lang]: !prev[lang] }))
  }

  const selectedLanguages = Object.entries(languages)
    .filter(([, v]) => v)
    .map(([k]) => k)

  const validateResumeFile = useCallback((file: File | null) => {
    if (!file) return 'Resume is required'
    if (file.size > 5 * 1024 * 1024) return 'Resume must be 5MB or smaller'
    const lower = file.name.toLowerCase()
    const okExt = lower.endsWith('.pdf') || lower.endsWith('.doc')
    const m = file.type.toLowerCase()
    const okMime =
      m === 'application/pdf' ||
      m === 'application/msword' ||
      m === 'application/octet-stream' ||
      m === ''
    if (!okExt || !okMime) return 'Please upload a PDF or DOC file only'
    return null
  }, [])

  const onFileChosen = (file: File | null) => {
    const err = validateResumeFile(file)
    if (err) {
      setFormError(err)
      setResumeFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setFormError(null)
    setResumeFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!fullName.trim() || !email.trim() || !phone.trim() || !currentCity.trim() || !experienceYears) {
      setFormError('Please complete all required fields.')
      return
    }

    if (selectedLanguages.length === 0) {
      setFormError('Select at least one language you speak fluently.')
      return
    }

    if (twoWheeler !== 'yes' && twoWheeler !== 'no') {
      setFormError('Please answer whether you have a two-wheeler.')
      return
    }

    const resumeErr = validateResumeFile(resumeFile)
    if (resumeErr) {
      setFormError(resumeErr)
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('full_name', fullName.trim())
      fd.append('email', email.trim())
      fd.append('phone', phone.trim())
      fd.append('current_city', currentCity.trim())
      fd.append('experience_years', experienceYears)
      selectedLanguages.forEach((lang) => fd.append('languages', lang))
      fd.append('has_two_wheeler', twoWheeler)
      if (whyRole.trim()) fd.append('why_this_role', whyRole.trim())
      fd.append('resume', resumeFile as File)

      const res = await fetch('/api/careers/apply', {
        method: 'POST',
        body: fd,
      })
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }

      if (!res.ok || !data.success) {
        setFormError(data.error || 'Submission failed. Please try again.')
        return
      }

      setSuccess(true)
    } catch {
      setFormError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Section 1 — Hero */}
      <section className="relative overflow-hidden" style={{ backgroundColor: BRAND_DARK }}>
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: BRAND_ORANGE }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-12 lg:pb-24 lg:pt-16">
          <div className="mb-10 sm:mb-12">
            <Logo variant="dark" showPoweredBy={false} size="lg" href="https://lokazen.in" />
          </div>

          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50 sm:text-sm">
                Now Hiring · Bangalore
              </p>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Property Acquisition Manager
              </h1>
              <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">
                Walk Bangalore. Meet owners. Build the city&apos;s commercial real estate future.
              </p>
              <button
                type="button"
                onClick={scrollToApply}
                className="mt-8 inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] sm:text-base"
                style={{ backgroundColor: BRAND_ORANGE, boxShadow: `0 12px 40px ${BRAND_ORANGE}44` }}
              >
                Apply Now
              </button>

              <div className="mt-10 flex flex-wrap gap-3">
                {['100+ Active Brands', '500+ Properties', '20+ Corridors'].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/90 sm:text-sm"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl border p-6 sm:p-8"
              style={{ backgroundColor: CARD_DARK, borderColor: BORDER_MUTED }}
            >
              <ul className="space-y-4 text-sm text-white/90 sm:text-base">
                <li className="font-semibold text-white">Full-time · Bangalore · Field Role</li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: BRAND_ORANGE }} />
                  Deal incentives on every closure
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: BRAND_ORANGE }} />
                  Quarterly performance bonuses
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: BRAND_ORANGE }} />
                  Travel allowance included
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — About */}
      <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: SECTION_LIGHT }}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">About Lokazen</p>
            <h2 className="mt-3 text-2xl font-bold leading-snug text-neutral-900 sm:text-3xl">
              Bangalore&apos;s first AI-powered commercial real estate matchmaking platform
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-neutral-700 sm:text-base">
              We match F&B and retail brands — Biggies Burger, Boba Bhai, TAN Coffee, Samosa Party and 100+ more —
              with verified commercial spaces across Bangalore using AI scoring. RERA registered under N &amp; G
              Ventures.
            </p>

            <div className="mt-10 space-y-6">
              {[
                { title: 'Source properties across every Bangalore corridor', Icon: MapPin },
                { title: 'Connect owners to 100+ active brand briefs', Icon: Users },
                { title: 'Drive site visits and close deals', Icon: Handshake },
              ].map(({ title, Icon }) => (
                <div key={title} className="flex gap-4">
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border bg-white"
                    style={{ borderColor: BORDER_MUTED, color: BRAND_ORANGE }}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <p className="pt-2 text-sm font-medium text-neutral-900 sm:text-base">{title}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl border p-6 sm:p-8"
            style={{ backgroundColor: CARD_DARK, borderColor: BORDER_MUTED }}
          >
            <h3 className="text-lg font-bold text-white sm:text-xl">What you&apos;ll do</h3>
            <ul className="mt-6 list-disc space-y-4 pl-5 text-sm text-white/90 marker:text-[#FF5200] sm:text-base">
              <li className="pl-1">
                Walk commercial streets across Bangalore — high streets, tech parks, residential hubs
              </li>
              <li className="pl-1">Meet property owners cold, pitch Lokazen, get spaces listed</li>
              <li className="pl-1">Match spaces to active F&B and retail brand briefs</li>
              <li className="pl-1">Coordinate site visits and support negotiation</li>
              <li className="pl-1">Log all activity on our AI-powered workforce dashboard</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3 — Form */}
      <section
        ref={applySectionRef}
        id="apply-form"
        className="scroll-mt-8 py-16 sm:py-20 lg:py-24"
        style={{ backgroundColor: BRAND_DARK }}
      >
        <div className="mx-auto max-w-[680px] px-4 sm:px-6">
          {!success ? (
            <>
              <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Apply for this Role</h2>
              <p className="mt-2 text-center text-sm text-white/60 sm:text-base">
                Takes 3 minutes. We read every application.
              </p>

              <form className="mt-10 space-y-6" onSubmit={handleSubmit} noValidate>
                {formError && (
                  <div
                    className="rounded-lg border px-4 py-3 text-sm text-white"
                    style={{ borderColor: BRAND_ORANGE, backgroundColor: `${CARD_DARK}` }}
                  >
                    {formError}
                  </div>
                )}

                <div>
                  <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-white/80">
                    Full Name <span className="text-[#FF5200]">*</span>
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={FIELD_CLASS}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">
                    Email Address <span className="text-[#FF5200]">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={FIELD_CLASS}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-white/80">
                    Phone Number <span className="text-[#FF5200]">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={FIELD_CLASS}
                    placeholder="+91 …"
                  />
                </div>

                <div>
                  <label htmlFor="current_city" className="mb-2 block text-sm font-medium text-white/80">
                    Current City <span className="text-[#FF5200]">*</span>
                  </label>
                  <input
                    id="current_city"
                    name="current_city"
                    type="text"
                    required
                    value={currentCity}
                    onChange={(e) => setCurrentCity(e.target.value)}
                    className={FIELD_CLASS}
                    placeholder="City you live in"
                  />
                </div>

                <div>
                  <label htmlFor="experience_years" className="mb-2 block text-sm font-medium text-white/80">
                    Years of experience in field sales / real estate / BD <span className="text-[#FF5200]">*</span>
                  </label>
                  <select
                    id="experience_years"
                    name="experience_years"
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className={
                      FIELD_CLASS +
                      ' cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat'
                    }
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a3a3a3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    }}
                  >
                    <option value="" disabled className="bg-neutral-900 text-neutral-400">
                      Select experience
                    </option>
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-neutral-900 text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <fieldset>
                  <legend className="mb-3 text-sm font-medium text-white/80">
                    Languages you speak fluently <span className="text-[#FF5200]">*</span>
                  </legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <label
                        key={lang}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm text-white/90 transition hover:border-[#FF5200]/50"
                        style={{
                          borderColor: BORDER_MUTED,
                          backgroundColor: languages[lang] ? `${CARD_DARK}` : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          name="languages"
                          value={lang}
                          checked={!!languages[lang]}
                          onChange={() => toggleLanguage(lang)}
                          className="h-4 w-4 rounded border-neutral-600 text-[#FF5200] focus:ring-[#FF5200]"
                        />
                        {lang}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-sm font-medium text-white/80">
                    Do you have a two-wheeler? <span className="text-[#FF5200]">*</span>
                  </legend>
                  <div className="flex flex-wrap gap-6">
                    {(['yes', 'no'] as const).map((v) => (
                      <label key={v} className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
                        <input
                          type="radio"
                          name="has_two_wheeler"
                          value={v}
                          checked={twoWheeler === v}
                          onChange={() => setTwoWheeler(v)}
                          className="h-4 w-4 border-neutral-600 text-[#FF5200] focus:ring-[#FF5200]"
                        />
                        {v === 'yes' ? 'Yes' : 'No'}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="why_this_role" className="mb-2 block text-sm font-medium text-white/80">
                    Why do you want this role? <span className="text-white/40">(optional)</span>
                  </label>
                  <textarea
                    id="why_this_role"
                    name="why_this_role"
                    rows={3}
                    value={whyRole}
                    onChange={(e) => setWhyRole(e.target.value)}
                    className={FIELD_CLASS + ' min-h-[5rem] resize-y'}
                    placeholder="A few lines is enough."
                  />
                </div>

                <div>
                  <span className="mb-2 block text-sm font-medium text-white/80">
                    Upload Resume <span className="text-[#FF5200]">*</span>
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,application/pdf,application/msword"
                    className="sr-only"
                    onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOver(false)
                      const f = e.dataTransfer.files?.[0]
                      if (f) onFileChosen(f)
                    }}
                    className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center text-sm transition sm:text-base"
                    style={{
                      borderColor: dragOver ? BRAND_ORANGE : `${BRAND_ORANGE}99`,
                      backgroundColor: dragOver ? `${CARD_DARK}` : 'transparent',
                    }}
                  >
                    <span className="font-medium text-white/90">Drop your resume or click to upload</span>
                    <span className="mt-2 text-xs text-white/45">PDF or DOC · max 5MB</span>
                    {resumeFile && (
                      <span className="mt-3 text-xs font-semibold text-[#FF5200]">{resumeFile.name}</span>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg py-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                  style={{ backgroundColor: BRAND_ORANGE }}
                >
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
              </form>
            </>
          ) : (
            <div
              className="rounded-2xl border px-6 py-14 text-center sm:px-10"
              style={{ backgroundColor: CARD_DARK, borderColor: BORDER_MUTED }}
            >
              <div
                className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                style={{ backgroundColor: `${BRAND_ORANGE}22`, color: BRAND_ORANGE }}
              >
                ✓
              </div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">Application received.</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
                We&apos;ll be in touch within 3 working days.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
