'use client'

import { useCallback, useRef, useState } from 'react'
import { Handshake, MapPin, Users } from 'lucide-react'
import Logo from '@/components/Logo'
import TrustedByLeadingBrands from '@/components/TrustedByLeadingBrands'

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
  const [currentCompany, setCurrentCompany] = useState('')
  const [currentCtc, setCurrentCtc] = useState('')
  const [expectedCtc, setExpectedCtc] = useState('')
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

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !currentCity.trim() ||
      !currentCompany.trim() ||
      !currentCtc.trim() ||
      !expectedCtc.trim() ||
      !experienceYears
    ) {
      setFormError('Please complete all required fields.')
      return
    }

    if (!whyRole.trim()) {
      setFormError('Please tell us why you want this role.')
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
      fd.append('current_company', currentCompany.trim())
      fd.append('current_ctc', currentCtc.trim())
      fd.append('expected_ctc', expectedCtc.trim())
      fd.append('experience_years', experienceYears)
      selectedLanguages.forEach((lang) => fd.append('languages', lang))
      fd.append('has_two_wheeler', twoWheeler)
      fd.append('why_this_role', whyRole.trim())
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
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-9 lg:pb-16 lg:pt-12">
          <div className="mb-5 sm:mb-8">
            <Logo variant="dark" showPoweredBy={false} size="md" href="https://lokazen.in" />
          </div>

          <div className="grid grid-cols-1 items-start gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 sm:mb-3 sm:text-xs">
                Now Hiring · Bangalore
              </p>
              <h1 className="text-2xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
                Property Acquisition Manager
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:mt-4 sm:text-base sm:text-lg">
                Walk Bangalore. Meet owners. Build the city&apos;s commercial real estate future — sourcing spaces,
                aligning them with live brand briefs on Lokazen, and moving deals from first hello toward closure. Field
                role: corridor work, cold outreach, site visits, and CRM updates with our matching team.
              </p>
              <button
                type="button"
                onClick={scrollToApply}
                className="mt-5 inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] sm:mt-6 sm:px-8 sm:py-3.5 sm:text-base"
                style={{ backgroundColor: BRAND_ORANGE, boxShadow: `0 12px 40px ${BRAND_ORANGE}44` }}
              >
                Apply Now
              </button>

              <div className="mt-6 flex flex-wrap gap-2 sm:mt-7 sm:gap-3">
                {['100+ Active Brands', '500+ Properties', '20+ Corridors'].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/90 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl border p-5 sm:rounded-2xl sm:p-7 lg:p-8"
              style={{ backgroundColor: CARD_DARK, borderColor: BORDER_MUTED }}
            >
              <ul className="space-y-3 text-xs text-white/90 sm:space-y-3.5 sm:text-sm lg:text-base">
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
      <section className="py-12 sm:py-16 lg:py-20" style={{ backgroundColor: SECTION_LIGHT }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-14">
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
              <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
                As Property Acquisition Manager, you sit at the intersection of supply and demand: you grow our
                inventory of quality commercial spaces, keep owner relationships warm, and translate street-level
                intelligence into structured data our matching engine can score — so brands get fewer junk leads and
                owners get serious tenants.
              </p>

              <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
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
              className="rounded-xl border p-5 sm:rounded-2xl sm:p-7 lg:p-8"
              style={{ backgroundColor: CARD_DARK, borderColor: BORDER_MUTED }}
            >
              <h3 className="text-base font-bold text-white sm:text-lg lg:text-xl">What you&apos;ll do</h3>
              <ul className="mt-4 list-disc space-y-3 pl-4 text-sm text-white/90 marker:text-[#FF5200] sm:mt-5 sm:space-y-3.5 sm:pl-5 sm:text-base">
                <li className="pl-1">
                  Walk commercial streets across Bangalore — high streets, tech parks, residential hubs, and emerging
                  catchments
                </li>
                <li className="pl-1">Meet property owners cold, pitch Lokazen&apos;s model, and get accurate spaces listed</li>
                <li className="pl-1">Match spaces to active F&amp;B and retail brand briefs using Lokazen match scores</li>
                <li className="pl-1">Coordinate site visits, align owner and brand expectations, and support negotiation</li>
                <li className="pl-1">
                  Capture photos, rent expectations, timelines, and handover constraints so our team can brief brands
                  with confidence
                </li>
                <li className="pl-1">
                  Log every visit, call, and follow-up on our AI-powered workforce dashboard — your pipeline should
                  always be visible to leadership
                </li>
                <li className="pl-1">
                  Partner with internal teams on corridor campaigns, owner events, and priority listings when brands
                  run city-wide searches
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-neutral-200 bg-white/80 p-5 sm:mt-14 sm:rounded-2xl sm:p-8 lg:p-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-xs">Role in depth</p>
            <h3 className="mt-1.5 text-lg font-bold text-neutral-900 sm:mt-2 sm:text-xl lg:text-2xl">What success looks like</h3>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700 sm:mt-5 sm:space-y-4 sm:text-base">
              <p>
                You will be measured on listing quality, pipeline depth, site-visit velocity, and closures supported
                through Lokazen — not just meetings held. We care about verified inventory, accurate pricing signals, and
                owners who trust the platform enough to prioritise Lokazen-led brands.
              </p>
              <p>
                A typical week blends solo field work with structured check-ins: corridor sweeps, revisits to warm
                leads, coordinating with our brand team on hot briefs, and tightening notes so nothing is lost between
                the street and the dashboard.
              </p>
              <p>
                You should be comfortable with ambiguity (every lane has a different story), resilient to rejection,
                and excited to represent a young, well-funded proptech brand that is redefining how Bangalore fills its
                shopfronts.
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden pb-1 sm:mt-12">
            <p className="mx-auto max-w-2xl px-1 text-center text-xs text-neutral-600 sm:text-sm lg:text-base">
              The same brand marquee as our homepage — the operators you&apos;ll reference when pitching owners already
              trust Lokazen for expansion and matching.
            </p>
            <div className="mt-4 -mx-1 sm:mt-5 sm:mx-0">
              <TrustedByLeadingBrands />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Form */}
      <section
        ref={applySectionRef}
        id="apply-form"
        className="scroll-mt-6 py-12 sm:scroll-mt-8 sm:py-16 lg:py-20"
        style={{ backgroundColor: BRAND_DARK }}
      >
        <div className="mx-auto max-w-[680px] px-4 sm:px-6">
          {!success ? (
            <>
              <h2 className="text-center text-xl font-bold text-white sm:text-2xl lg:text-3xl">Apply for this Role</h2>
              <p className="mt-1.5 text-center text-xs text-white/60 sm:mt-2 sm:text-sm lg:text-base">
                Takes a few minutes. We read every application.
              </p>

              <form className="mt-7 space-y-5 sm:mt-9 sm:space-y-6" onSubmit={handleSubmit} noValidate>
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
                  <label htmlFor="current_company" className="mb-2 block text-sm font-medium text-white/80">
                    Current company you&apos;re working for <span className="text-[#FF5200]">*</span>
                  </label>
                  <input
                    id="current_company"
                    name="current_company"
                    type="text"
                    required
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    className={FIELD_CLASS}
                    placeholder="Employer name, or Independent / Between roles"
                  />
                </div>

                <div>
                  <label htmlFor="current_ctc" className="mb-2 block text-sm font-medium text-white/80">
                    Current CTC <span className="text-[#FF5200]">*</span>
                  </label>
                  <input
                    id="current_ctc"
                    name="current_ctc"
                    type="text"
                    required
                    value={currentCtc}
                    onChange={(e) => setCurrentCtc(e.target.value)}
                    className={FIELD_CLASS}
                    placeholder="e.g. ₹3.5 lakhs LPA, or fixed + variable breakdown"
                  />
                </div>

                <div>
                  <label htmlFor="expected_ctc" className="mb-2 block text-sm font-medium text-white/80">
                    Expected CTC <span className="text-[#FF5200]">*</span>
                  </label>
                  <input
                    id="expected_ctc"
                    name="expected_ctc"
                    type="text"
                    required
                    value={expectedCtc}
                    onChange={(e) => setExpectedCtc(e.target.value)}
                    className={FIELD_CLASS}
                    placeholder="What you are looking for in this move"
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
                    Why do you want this role? <span className="text-[#FF5200]">*</span>
                  </label>
                  <textarea
                    id="why_this_role"
                    name="why_this_role"
                    rows={3}
                    required
                    value={whyRole}
                    onChange={(e) => setWhyRole(e.target.value)}
                    className={FIELD_CLASS + ' min-h-[5rem] resize-y'}
                    placeholder="A few lines is enough — we read every answer."
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
                    className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 py-8 text-center text-sm transition sm:px-4 sm:py-10 sm:text-base"
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
              className="rounded-xl border px-5 py-10 text-center sm:rounded-2xl sm:px-10 sm:py-14"
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
                We&apos;ll be in touch within 3 working days. A confirmation has also been sent to the email address
                you provided (check spam if you don&apos;t see it).
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
