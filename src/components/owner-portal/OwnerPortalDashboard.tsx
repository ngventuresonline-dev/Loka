'use client'

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ownerApiQuery, type OwnerSession } from '@/lib/owner-portal-fetch'
import { encodePropertyId } from '@/lib/property-slug'
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  UserCircle,
  Bell,
  Plus,
  EllipsisVertical,
  LogOut,
} from 'lucide-react'
import { format } from 'date-fns'

type Section = 'overview' | 'listings' | 'leads' | 'visits' | 'profile'

type Summary = {
  totalListings: number
  views30d: number
  qualifiedLeads: number
  siteVisitsDone: number
  pipeline: {
    pending: number
    contacted: number
    scheduled: number
    closed: number
  }
  upcomingVisits: Array<{
    id: string
    scheduledAt: string
    brandName: string
    brandInitials: string
    propertyTitle: string
    propertyId: string
  }>
}

type ListingRow = {
  id: string
  title: string
  locality: string
  city: string
  size: number
  price: string
  priceType: string
  isAvailable: boolean
  description: string | null
  amenities: unknown
  images: unknown
  mapLink: string | null
  views30d: number
  leadCount: number
  visitCount: number
  viewsBarMax: number
}

type LeadRow = {
  id: string
  status: string | null
  message: string
  createdAt: string | null
  brandId: string
  brandName: string
  propertyId: string
  propertyTitle: string
}

type VisitRow = {
  id: string
  status: string
  outcome: string | null
  notes: string | null
  scheduledAt: string
  brandName: string
  propertyTitle: string
}

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

function pricePerSqftLabel(price: number, size: number, priceType: string) {
  if (!size || size <= 0) return '—'
  if (priceType === 'sqft') return `${formatInr(price)}/sqft`
  const monthly = priceType === 'yearly' ? price / 12 : price
  return `${formatInr(monthly / size)}/sqft`
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function amenityTags(amenities: unknown): string[] {
  if (!amenities) return []
  if (Array.isArray(amenities)) {
    return amenities.filter((a): a is string => typeof a === 'string')
  }
  if (typeof amenities === 'object' && amenities !== null && 'features' in amenities) {
    const f = (amenities as { features?: unknown }).features
    if (Array.isArray(f)) return f.filter((a): a is string => typeof a === 'string')
  }
  return []
}

function imageList(images: unknown): string[] {
  if (!Array.isArray(images)) return []
  return images.filter((u): u is string => typeof u === 'string' && u.length > 0)
}

function inquiryStatusLabel(s: string | null) {
  switch (s) {
    case 'pending':
      return { text: 'Pending', className: 'bg-amber-50 text-amber-800 border-amber-200' }
    case 'contacted':
    case 'responded':
      return { text: 'Contacted', className: 'bg-orange-50 text-[#FF5200] border-orange-200' }
    case 'scheduled':
      return { text: 'Scheduled', className: 'bg-blue-50 text-blue-800 border-blue-200' }
    case 'completed':
    case 'closed':
      return { text: 'Completed', className: 'bg-green-50 text-green-800 border-green-200' }
    case 'cancelled':
      return { text: 'Cancelled', className: 'bg-gray-100 text-gray-700 border-gray-200' }
    default:
      return { text: s || '—', className: 'bg-gray-50 text-gray-700 border-gray-200' }
  }
}

function visitStatusBadge(status: string) {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-50 text-blue-800 border-blue-200'
    case 'completed':
      return 'bg-green-50 text-green-800 border-green-200'
    case 'cancelled':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'no_show':
      return 'bg-red-50 text-red-800 border-red-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

const NAV: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'listings', label: 'My Listings', icon: Building2 },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'visits', label: 'Site Visits', icon: Calendar },
  { id: 'profile', label: 'Profile', icon: UserCircle },
]

export default function OwnerPortalDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, isLoggedIn, logout } = useAuth()

  const lookupOwnerId = searchParams.get('userId')
  const authOwner =
    isLoggedIn && user && user.userType === 'owner' ? user : null

  const sessionForApi = useMemo((): OwnerSession | null => {
    if (authOwner) {
      return { userId: authOwner.id, userEmail: authOwner.email }
    }
    if (lookupOwnerId) {
      return { userId: lookupOwnerId, userEmail: null }
    }
    return null
  }, [authOwner, lookupOwnerId])

  const waitingForAuth = authLoading && !lookupOwnerId

  const [ownerCard, setOwnerCard] = useState<{ name: string; email: string } | null>(
    null
  )

  const [section, setSection] = useState<Section>('overview')
  const [toast, setToast] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const [summary, setSummary] = useState<Summary | null>(null)
  const [overviewListings, setOverviewListings] = useState<ListingRow[]>([])
  const [allListings, setAllListings] = useState<ListingRow[]>([])
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [visits, setVisits] = useState<VisitRow[]>([])
  const [profileData, setProfileData] = useState<{
    name: string
    email: string
    phone: string | null
    ownerProfile: {
      companyName: string | null
      licenseNumber: string | null
      totalProperties: number | null
    } | null
  } | null>(null)

  const [listFilter, setListFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [leadFilter, setLeadFilter] = useState<string>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [scheduleInquiry, setScheduleInquiry] = useState<{
    id: string
    dt: string
  } | null>(null)
  const [visitComplete, setVisitComplete] = useState<{
    id: string
    outcome: string
  } | null>(null)
  const [scheduleModal, setScheduleModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [section])
  const [modalForm, setModalForm] = useState({
    propertyId: '',
    brandId: '',
    scheduledAt: '',
    notes: '',
  })

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    companyName: '',
    licenseNumber: '',
  })

  const q = sessionForApi ? ownerApiQuery(sessionForApi) : ''

  const displayName = ownerCard?.name ?? authOwner?.name ?? 'Owner'
  const displayEmail = ownerCard?.email ?? authOwner?.email ?? ''

  useEffect(() => {
    if (!sessionForApi) return
    let cancelled = false
    const qs = ownerApiQuery(sessionForApi)
    fetch(`/api/owner/profile?${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return
        setOwnerCard({
          name: d.name || 'Owner',
          email: d.email || '',
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [lookupOwnerId, authOwner?.id, authOwner?.email])

  useEffect(() => {
    if (!lookupOwnerId || typeof window === 'undefined') return
    try {
      window.localStorage.setItem('ownerId', lookupOwnerId)
    } catch {
      /* ignore */
    }
  }, [lookupOwnerId])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!scheduleModal || !sessionForApi) return
    if (allListings.length > 0) return
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/owner/listings?${ownerApiQuery(sessionForApi)}`)
      if (!res.ok) return
      const j = await res.json()
      if (!cancelled) setAllListings(j.listings || [])
    })()
    return () => {
      cancelled = true
    }
  }, [scheduleModal, sessionForApi, allListings.length])

  useEffect(() => {
    if (waitingForAuth) return
    if (sessionForApi) return
    if (isLoggedIn && user && user.userType !== 'owner') {
      router.replace('/')
      return
    }
    router.replace('/profile')
  }, [waitingForAuth, sessionForApi, router, isLoggedIn, user])

  useEffect(() => {
    if (!sessionForApi) return
    let cancelled = false
    ;(async () => {
      try {
        const [sRes, oRes] = await Promise.all([
          fetch(`/api/owner/summary?${q}`),
          fetch(`/api/owner/listings?${q}&top=4`),
        ])
        if (!sRes.ok || !oRes.ok) throw new Error('fetch')
        const sJson = await sRes.json()
        const oJson = await oRes.json()
        if (cancelled) return
        setSummary(sJson)
        setOverviewListings(oJson.listings || [])
      } catch {
        if (!cancelled) {
          setSummary(null)
          setOverviewListings([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionForApi, q, tick])

  useEffect(() => {
    if (!sessionForApi) return
    if (section !== 'listings') return
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/owner/listings?${q}`)
      if (!res.ok) return
      const j = await res.json()
      if (!cancelled) setAllListings(j.listings || [])
    })()
    return () => {
      cancelled = true
    }
  }, [sessionForApi, q, section, tick])

  useEffect(() => {
    if (!sessionForApi) return
    if (section !== 'leads') return
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/owner/leads?${q}&status=${encodeURIComponent(leadFilter)}`)
      if (!res.ok) return
      const j = await res.json()
      if (!cancelled) setLeads(j.leads || [])
    })()
    return () => {
      cancelled = true
    }
  }, [sessionForApi, q, section, leadFilter, tick])

  useEffect(() => {
    if (!sessionForApi) return
    if (section !== 'visits') return
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/owner/visits?${q}`)
      if (!res.ok) return
      const j = await res.json()
      if (!cancelled) setVisits(j.visits || [])
    })()
    return () => {
      cancelled = true
    }
  }, [sessionForApi, q, section, tick])

  useEffect(() => {
    if (!sessionForApi) return
    if (section !== 'profile') return
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/owner/profile?${q}`)
      if (!res.ok) return
      const j = await res.json()
      if (cancelled) return
      setProfileData(j)
      setProfileForm({
        name: j.name || '',
        phone: j.phone || '',
        companyName: j.ownerProfile?.companyName || '',
        licenseNumber: j.ownerProfile?.licenseNumber || '',
      })
    })()
    return () => {
      cancelled = true
    }
  }, [sessionForApi, q, section, tick])

  const filteredListings = useMemo(() => {
    if (listFilter === 'active') return allListings.filter((l) => l.isAvailable)
    if (listFilter === 'inactive') return allListings.filter((l) => !l.isAvailable)
    return allListings
  }, [allListings, listFilter])

  const sectionTitle = useMemo(() => {
    const n = NAV.find((x) => x.id === section)
    return n?.label ?? 'Overview'
  }, [section])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3200)
  }

  const patchListing = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/owner/listings/${id}?${q}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      showToast(e.error || 'Update failed')
      return false
    }
    refresh()
    return true
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    const slug = encodePropertyId(id)
    const res = await fetch(`/api/properties/${slug}?${q}`, { method: 'DELETE' })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      showToast(e.error || 'Delete failed')
      return
    }
    showToast('Listing removed')
    refresh()
  }

  const patchLead = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/owner/leads/${id}?${q}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      showToast(e.error || 'Update failed')
      return false
    }
    refresh()
    return true
  }

  const patchVisit = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/owner/visits/${id}?${q}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      showToast(e.error || 'Update failed')
      return false
    }
    refresh()
    return true
  }

  const saveProfile = async () => {
    const res = await fetch(`/api/owner/profile?${q}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profileForm.name,
        phone: profileForm.phone,
        companyName: profileForm.companyName,
        licenseNumber: profileForm.licenseNumber,
      }),
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      showToast(e.error || 'Save failed')
      return
    }
    showToast('Profile saved')
    refresh()
  }

  const submitScheduleModal = async () => {
    if (!modalForm.propertyId || !modalForm.brandId || !modalForm.scheduledAt) {
      showToast('Fill property, brand, and date/time')
      return
    }
    const res = await fetch(`/api/owner/visits?${q}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: modalForm.propertyId,
        brandId: modalForm.brandId,
        scheduledAt: new Date(modalForm.scheduledAt).toISOString(),
        notes: modalForm.notes,
      }),
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      showToast(e.error || 'Could not schedule')
      return
    }
    setScheduleModal(false)
    setModalForm({ propertyId: '', brandId: '', scheduledAt: '', notes: '' })
    showToast('Visit scheduled')
    refresh()
  }

  if (waitingForAuth || !sessionForApi) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Loading…
      </div>
    )
  }

  const NavButton = ({
    id,
    label,
    icon: Icon,
    mobile,
  }: {
    id: Section
    label: string
    icon: typeof LayoutDashboard
    mobile?: boolean
  }) => {
    const active = section === id
    const base =
      'flex items-center gap-2 rounded-lg text-sm font-medium transition-colors'
    const desktop = active
      ? 'bg-[#FF5200]/10 text-[#FF5200] border-r-2 border-[#FF5200] pr-3 py-2.5 pl-3 -mr-px'
      : 'text-gray-600 hover:bg-gray-50 py-2.5 px-3'
    const mob = active
      ? 'flex-1 flex flex-col items-center gap-0.5 py-2 text-[#FF5200]'
      : 'flex-1 flex flex-col items-center gap-0.5 py-2 text-gray-500'
    return (
      <button
        type="button"
        onClick={() => setSection(id)}
        className={mobile ? mob : `${base} ${desktop} w-full text-left`}
      >
        <Icon className={mobile ? 'w-5 h-5' : 'w-4 h-4 flex-shrink-0'} strokeWidth={1.75} />
        <span className={mobile ? 'text-[10px] font-medium' : ''}>{label}</span>
      </button>
    )
  }

  const statCard = (
    label: string,
    value: number | string,
    delta: string
  ) => (
    <div
      key={label}
      className="relative bg-white rounded-xl border border-gray-100 p-4 overflow-hidden"
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5 bg-[#FF5200]"
        aria-hidden
      />
      <div className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">
        {label}
      </div>
      <div className="text-[28px] font-medium text-gray-900 mt-1 tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{delta}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 md:pb-0">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] rounded-lg bg-gray-900 text-white text-sm px-4 py-2 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:flex-col w-[220px] flex-shrink-0 border-r border-gray-200 bg-white fixed inset-y-0 z-20">
          <div className="p-4 border-b border-gray-100">
            <Link href="/" className="block text-lg font-bold text-[#FF5200] tracking-tight">
              Lokazen
            </Link>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-2">
              Owner Portal
            </p>
          </div>
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {NAV.map((item) => (
              <NavButton key={item.id} {...item} />
            ))}
          </nav>
          <div className="p-3 border-t border-gray-100 flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#FF5200]/15 text-[#FF5200] flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials(displayName)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">{displayName}</div>
              <div className="text-[10px] text-gray-500 truncate">{displayEmail || '—'}</div>
            </div>
          </div>
        </aside>

        <div className="flex-1 md:ml-[220px] flex flex-col min-w-0">
          <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{sectionTitle}</h1>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Link
                href="/onboarding/owner"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#FF5200] text-white text-sm font-medium px-3 py-2 hover:bg-[#e64a00] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Listing
              </Link>
              <button
                type="button"
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              <div
                ref={mobileMenuRef}
                className="relative md:hidden"
              >
                <button
                  type="button"
                  aria-expanded={mobileMenuOpen}
                  aria-haspopup="menu"
                  aria-label="More options"
                  onClick={() => setMobileMenuOpen((o) => !o)}
                  className={`p-2 rounded-lg border transition-colors ${
                    mobileMenuOpen
                      ? 'border-[#FF5200]/40 bg-[#FF5200]/10 text-[#FF5200]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <EllipsisVertical className="w-5 h-5" strokeWidth={1.75} />
                </button>
                {mobileMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1.5 w-[min(17rem,calc(100vw-2rem))] py-1.5 bg-white rounded-xl border border-gray-100 shadow-lg shadow-gray-200/80 z-50 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs font-medium text-gray-900 truncate">{displayName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{displayEmail || '—'}</p>
                    </div>
                    <Link
                      href="/onboarding/owner"
                      role="menuitem"
                      onClick={() => setMobileMenuOpen(false)}
                      className="sm:hidden flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    >
                      <Plus className="w-4 h-4 text-[#FF5200]" strokeWidth={1.75} />
                      Add Listing
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setSection('profile')
                        setMobileMenuOpen(false)
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                        section === 'profile'
                          ? 'bg-[#FF5200]/10 text-[#FF5200] font-medium'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <UserCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                      Profile
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        if (authOwner) logout()
                        router.push('/')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0 text-gray-500" strokeWidth={1.75} />
                      {authOwner ? 'Sign out' : 'Back to home'}
                    </button>
                  </div>
                )}
              </div>
              <div className="hidden md:flex w-9 h-9 rounded-full bg-[#FF5200]/15 text-[#FF5200] items-center justify-center text-xs font-semibold">
                {initials(displayName)}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
            {section === 'overview' && summary && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  {statCard('Total Listings', summary.totalListings, 'Live & draft properties')}
                  {statCard('Views (30d)', summary.views30d, 'Property detail views')}
                  {statCard('Qualified Leads', summary.qualifiedLeads, 'Contacted · Scheduled · Won')}
                  {statCard('Site Visits Done', summary.siteVisitsDone, 'Completed walkthroughs')}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-semibold text-gray-900">My Listings</h2>
                      <button
                        type="button"
                        className="text-sm font-medium text-[#FF5200]"
                        onClick={() => setSection('listings')}
                      >
                        See all
                      </button>
                    </div>
                    {overviewListings.length === 0 ? (
                      <p className="text-sm text-gray-500 py-6 text-center">
                        No listings yet. Add your first property.
                      </p>
                    ) : (
                      <div className="overflow-x-auto -mx-4 px-4">
                        <table className="w-full text-sm min-w-[520px]">
                          <thead>
                            <tr className="text-left text-[10px] uppercase text-gray-500 border-b border-gray-100">
                              <th className="pb-2 pr-2">Property</th>
                              <th className="pb-2 pr-2">Status</th>
                              <th className="pb-2 pr-2">Views</th>
                              <th className="pb-2 pr-2">Leads</th>
                              <th className="pb-2 pr-2">Visits</th>
                              <th className="pb-2"> </th>
                            </tr>
                          </thead>
                          <tbody>
                            {overviewListings.map((row) => {
                              const max = row.viewsBarMax || 1
                              const pct = Math.round((row.views30d / max) * 100)
                              return (
                                <tr key={row.id} className="border-b border-gray-50 align-top">
                                  <td className="py-3 pr-2">
                                    <div className="font-medium text-gray-900">{row.title}</div>
                                    <div className="text-xs text-gray-500">
                                      {row.locality} · {row.size.toLocaleString()} sqft ·{' '}
                                      {pricePerSqftLabel(Number(row.price), row.size, row.priceType)}
                                    </div>
                                  </td>
                                  <td className="py-3 pr-2">
                                    <span
                                      className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${
                                        row.isAvailable
                                          ? 'bg-green-50 text-green-800 border-green-200'
                                          : 'bg-gray-100 text-gray-600 border-gray-200'
                                      }`}
                                    >
                                      {row.isAvailable ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="py-3 pr-2">
                                    <div className="text-xs font-medium tabular-nums">{row.views30d}</div>
                                    <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden w-16">
                                      <div
                                        className="h-full bg-[#FF5200] rounded-full"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </td>
                                  <td className="py-3 pr-2 tabular-nums">{row.leadCount}</td>
                                  <td className="py-3 pr-2 tabular-nums">{row.visitCount}</td>
                                  <td className="py-3">
                                    <Link
                                      href={`/onboarding/owner?edit=${encodeURIComponent(row.id)}`}
                                      className="text-xs font-medium text-[#FF5200]"
                                    >
                                      Manage
                                    </Link>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <h2 className="font-semibold text-gray-900 mb-3">Lead Pipeline</h2>
                      <div className="space-y-3">
                        {[
                          {
                            key: 'pending',
                            title: 'Pending',
                            sub: 'Awaiting response',
                            color: 'bg-amber-500',
                            count: summary.pipeline.pending,
                            text: 'text-amber-700',
                          },
                          {
                            key: 'contacted',
                            title: 'Contacted',
                            sub: 'In conversation',
                            color: 'bg-[#FF5200]',
                            count: summary.pipeline.contacted,
                            text: 'text-[#FF5200]',
                          },
                          {
                            key: 'scheduled',
                            title: 'Scheduled',
                            sub: 'Visit booked',
                            color: 'bg-blue-500',
                            count: summary.pipeline.scheduled,
                            text: 'text-blue-700',
                          },
                          {
                            key: 'closed',
                            title: 'Completed / Cancelled',
                            sub: 'Closed',
                            color: 'bg-green-500',
                            count: summary.pipeline.closed,
                            text: 'text-green-700',
                          },
                        ].map((row) => (
                          <div key={row.key} className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded ${row.color} flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">{row.title}</div>
                              <div className="text-xs text-gray-500">{row.sub}</div>
                            </div>
                            <div className={`text-sm font-semibold tabular-nums ${row.text}`}>
                              {row.count}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <h2 className="font-semibold text-gray-900 mb-3">Upcoming Site Visits</h2>
                      {summary.upcomingVisits.length === 0 ? (
                        <p className="text-sm text-gray-500">No visits scheduled.</p>
                      ) : (
                        <ul className="space-y-3">
                          {summary.upcomingVisits.map((v) => (
                            <li key={v.id} className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {v.brandInitials}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900">{v.brandName}</div>
                                <div className="text-xs text-gray-600">{v.propertyTitle}</div>
                                <div className="text-xs text-[#FF5200] mt-0.5">
                                  {format(new Date(v.scheduledAt), "d MMM yyyy · h:mm a")}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {section === 'overview' && !summary && (
              <div className="text-center py-16 text-gray-500 text-sm">Could not load overview.</div>
            )}

            {section === 'listings' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 w-fit">
                    {(['all', 'active', 'inactive'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setListFilter(t)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${
                          listFilter === t
                            ? 'bg-[#FF5200]/10 text-[#FF5200]'
                            : 'text-gray-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/onboarding/owner"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FF5200] text-white text-sm font-medium px-3 py-2 hover:bg-[#e64a00]"
                  >
                    <Plus className="w-4 h-4" />
                    Add Listing
                  </Link>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                      <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-3 py-2">Property</th>
                          <th className="px-3 py-2">Locality</th>
                          <th className="px-3 py-2">Size</th>
                          <th className="px-3 py-2">Price</th>
                          <th className="px-3 py-2">Active</th>
                          <th className="px-3 py-2">Views</th>
                          <th className="px-3 py-2">Leads</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredListings.map((row) => {
                          const open = expandedIds.has(row.id)
                          return (
                            <Fragment key={row.id}>
                              <tr className="border-t border-gray-100 align-middle">
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    className="text-left font-medium text-[#FF5200] hover:underline"
                                    onClick={() => {
                                      const n = new Set(expandedIds)
                                      if (n.has(row.id)) n.delete(row.id)
                                      else n.add(row.id)
                                      setExpandedIds(n)
                                    }}
                                  >
                                    {row.title}
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-gray-600">{row.locality}</td>
                                <td className="px-3 py-2 tabular-nums">{row.size.toLocaleString()}</td>
                                <td className="px-3 py-2">
                                  {formatInr(Number(row.price))}
                                  <span className="text-gray-400 text-xs">/{row.priceType}</span>
                                </td>
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={row.isAvailable}
                                    onClick={() => patchListing(row.id, { isAvailable: !row.isAvailable })}
                                    className={`relative w-10 h-5 rounded-full transition-colors ${
                                      row.isAvailable ? 'bg-[#FF5200]' : 'bg-gray-300'
                                    }`}
                                  >
                                    <span
                                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                        row.isAvailable ? 'translate-x-5' : ''
                                      }`}
                                    />
                                  </button>
                                </td>
                                <td className="px-3 py-2 tabular-nums">{row.views30d}</td>
                                <td className="px-3 py-2 tabular-nums">{row.leadCount}</td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <Link
                                      href={`/onboarding/owner?edit=${encodeURIComponent(row.id)}`}
                                      className="text-[#FF5200] font-medium"
                                    >
                                      Edit
                                    </Link>
                                    <span className="text-gray-300">|</span>
                                    <button
                                      type="button"
                                      className="text-red-600 font-medium"
                                      onClick={() => deleteListing(row.id)}
                                    >
                                      Delete
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                      type="button"
                                      className="text-gray-700 font-medium"
                                      onClick={() => patchListing(row.id, { isAvailable: !row.isAvailable })}
                                    >
                                      Toggle
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {open && (
                                <tr className="bg-gray-50/80">
                                  <td colSpan={8} className="px-3 py-3 text-sm">
                                    <p className="text-gray-700 line-clamp-3 mb-2">
                                      {row.description || 'No description.'}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                      {amenityTags(row.amenities).map((a) => (
                                        <span
                                          key={a}
                                          className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-200"
                                        >
                                          {a}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      {imageList(row.images).slice(0, 6).map((src, i) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          key={i}
                                          src={src}
                                          alt=""
                                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                        />
                                      ))}
                                    </div>
                                    {row.mapLink && (
                                      <a
                                        href={row.mapLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-medium text-[#FF5200]"
                                      >
                                        Open map
                                      </a>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredListings.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-10">No listings match this filter.</p>
                  )}
                </div>
              </div>
            )}

            {section === 'leads' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-0.5 w-fit max-w-full overflow-x-auto">
                  {['all', 'pending', 'contacted', 'scheduled', 'completed'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLeadFilter(t)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md capitalize whitespace-nowrap ${
                        leadFilter === t ? 'bg-[#FF5200]/10 text-[#FF5200]' : 'text-gray-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[720px]">
                      <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-3 py-2">Brand</th>
                          <th className="px-3 py-2">Property</th>
                          <th className="px-3 py-2">Message</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead) => {
                          const badge = inquiryStatusLabel(lead.status)
                          const msg =
                            lead.message.length > 80
                              ? `${lead.message.slice(0, 80)}…`
                              : lead.message
                          return (
                            <tr key={lead.id} className="border-t border-gray-100 align-top">
                              <td className="px-3 py-2 font-medium">{lead.brandName}</td>
                              <td className="px-3 py-2 text-gray-700">{lead.propertyTitle}</td>
                              <td className="px-3 py-2 text-gray-600 max-w-[200px]">{msg}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${badge.className}`}
                                >
                                  {badge.text}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                                {lead.createdAt
                                  ? format(new Date(lead.createdAt), 'd MMM yyyy')
                                  : '—'}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col gap-2 items-start">
                                  {lead.status === 'pending' && (
                                    <button
                                      type="button"
                                      className="text-xs font-medium text-[#FF5200]"
                                      onClick={() => patchLead(lead.id, { status: 'contacted' })}
                                    >
                                      Mark Contacted
                                    </button>
                                  )}
                                  {(lead.status === 'contacted' || lead.status === 'responded') && (
                                    <div className="flex flex-col gap-1 w-full max-w-[200px]">
                                      {scheduleInquiry?.id === lead.id ? (
                                        <>
                                          <input
                                            type="datetime-local"
                                            className="text-xs border rounded px-2 py-1 w-full"
                                            value={scheduleInquiry.dt}
                                            onChange={(e) =>
                                              setScheduleInquiry({ id: lead.id, dt: e.target.value })
                                            }
                                          />
                                          <button
                                            type="button"
                                            className="text-xs font-medium text-white bg-[#FF5200] rounded px-2 py-1"
                                            onClick={async () => {
                                              if (!scheduleInquiry.dt) return
                                              const ok = await patchLead(lead.id, {
                                                status: 'scheduled',
                                                scheduledAt: new Date(
                                                  scheduleInquiry.dt
                                                ).toISOString(),
                                              })
                                              if (ok) setScheduleInquiry(null)
                                            }}
                                          >
                                            Confirm schedule
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          type="button"
                                          className="text-xs font-medium text-[#FF5200]"
                                          onClick={() =>
                                            setScheduleInquiry({ id: lead.id, dt: '' })
                                          }
                                        >
                                          Schedule Visit
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  {lead.status === 'scheduled' && (
                                    <button
                                      type="button"
                                      className="text-xs font-medium text-green-700"
                                      onClick={() => patchLead(lead.id, { status: 'completed' })}
                                    >
                                      Mark Complete
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {leads.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-10">No leads yet.</p>
                  )}
                </div>
              </div>
            )}

            {section === 'visits' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setScheduleModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF5200] text-white text-sm font-medium px-3 py-2"
                  >
                    <Plus className="w-4 h-4" />
                    Schedule Visit
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[880px]">
                      <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-3 py-2">Brand</th>
                          <th className="px-3 py-2">Property</th>
                          <th className="px-3 py-2">When</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Outcome</th>
                          <th className="px-3 py-2">Notes</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visits.map((v) => (
                          <tr key={v.id} className="border-t border-gray-100 align-top">
                            <td className="px-3 py-2 font-medium">{v.brandName}</td>
                            <td className="px-3 py-2">{v.propertyTitle}</td>
                            <td className="px-3 py-2 text-xs whitespace-nowrap">
                              {format(new Date(v.scheduledAt), 'd MMM yyyy · h:mm a')}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${visitStatusBadge(v.status)}`}
                              >
                                {v.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs">{v.outcome || '—'}</td>
                            <td className="px-3 py-2 text-xs text-gray-600 max-w-[140px] truncate">
                              {v.notes || '—'}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-col gap-2 items-start">
                                {v.status === 'scheduled' && (
                                  <>
                                    {visitComplete?.id === v.id ? (
                                      <div className="flex flex-col gap-1 w-full max-w-[200px]">
                                        <select
                                          className="text-xs border rounded px-2 py-1"
                                          value={visitComplete.outcome}
                                          onChange={(e) =>
                                            setVisitComplete({ id: v.id, outcome: e.target.value })
                                          }
                                        >
                                          <option value="">Select outcome</option>
                                          <option value="Interested">Interested</option>
                                          <option value="Not Interested">Not Interested</option>
                                          <option value="Follow Up">Follow Up</option>
                                          <option value="Offer Made">Offer Made</option>
                                        </select>
                                        <button
                                          type="button"
                                          className="text-xs font-medium text-white bg-green-600 rounded px-2 py-1"
                                          onClick={async () => {
                                            if (!visitComplete.outcome) return
                                            const ok = await patchVisit(v.id, {
                                              status: 'completed',
                                              outcome: visitComplete.outcome,
                                            })
                                            if (ok) setVisitComplete(null)
                                          }}
                                        >
                                          Save complete
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        className="text-xs font-medium text-[#FF5200]"
                                        onClick={() =>
                                          setVisitComplete({ id: v.id, outcome: '' })
                                        }
                                      >
                                        Mark Complete
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="text-xs text-gray-600"
                                      onClick={() => patchVisit(v.id, { status: 'cancelled' })}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {visits.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-10">No site visits yet.</p>
                  )}
                </div>
              </div>
            )}

            {section === 'profile' && profileData && (
              <div className="max-w-lg space-y-6">
                {!profileData.ownerProfile && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Complete your owner profile (company and license) so brands can verify you faster.
                  </div>
                )}
                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
                      readOnly
                      value={profileData.email}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={profileForm.companyName}
                      onChange={(e) =>
                        setProfileForm((p) => ({ ...p, companyName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      License number
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={profileForm.licenseNumber}
                      onChange={(e) =>
                        setProfileForm((p) => ({ ...p, licenseNumber: e.target.value }))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveProfile}
                    className="w-full sm:w-auto rounded-lg bg-[#FF5200] text-white text-sm font-medium px-4 py-2.5 hover:bg-[#e64a00]"
                  >
                    Save profile
                  </button>
                </div>
              </div>
            )}

            {section === 'profile' && !profileData && (
              <div className="text-sm text-gray-500 py-12 text-center">Loading profile…</div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 flex safe-area-pb">
        <NavButton id="overview" label="Overview" icon={LayoutDashboard} mobile />
        <NavButton id="listings" label="Listings" icon={Building2} mobile />
        <NavButton id="leads" label="Leads" icon={Users} mobile />
        <NavButton id="visits" label="Visits" icon={Calendar} mobile />
      </nav>

      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-3">Schedule site visit</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Property</label>
                <select
                  className="w-full border rounded-lg px-2 py-2"
                  value={modalForm.propertyId}
                  onChange={(e) => setModalForm((m) => ({ ...m, propertyId: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {allListings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Brand user ID</label>
                <input
                  className="w-full border rounded-lg px-2 py-2 text-xs"
                  placeholder="Brand account id (UUID)"
                  value={modalForm.brandId}
                  onChange={(e) => setModalForm((m) => ({ ...m, brandId: e.target.value }))}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Paste the brand user id from your lead record, or ask support.
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date & time</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg px-2 py-2"
                  value={modalForm.scheduledAt}
                  onChange={(e) => setModalForm((m) => ({ ...m, scheduledAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes</label>
                <textarea
                  className="w-full border rounded-lg px-2 py-2 text-sm min-h-[72px]"
                  value={modalForm.notes}
                  onChange={(e) => setModalForm((m) => ({ ...m, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button
                type="button"
                className="px-3 py-2 text-sm text-gray-600"
                onClick={() => setScheduleModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg bg-[#FF5200] text-white"
                onClick={submitScheduleModal}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
