'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import DynamicBackground from '@/components/DynamicBackground'
import { encodePropertyId } from '@/lib/property-slug'

// ─── Types ────────────────────────────────────────────────────────────────────

type BrandInfo = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  companyName?: string | null
  industry?: string | null
  preferredLocations?: string[] | null
  budgetMin?: number | null
  budgetMax?: number | null
  minSize?: number | null
  maxSize?: number | null
}

type Stats = {
  totalViews: number
  totalSaved: number
  totalInquiries: number
  pendingInquiries: number
}

type PropertyView = {
  id: string
  propertyId: string
  viewedAt: string
  property: {
    title: string
    address: string
    city: string
    price: number
    priceType: string
    size: number
    propertyType: string
    images?: string[]
    status: string
  }
}

type SavedProperty = {
  id: string
  savedAt: string
  property: {
    id: string
    title: string
    address: string
    city: string
    price: number
    priceType: string
    size: number
    propertyType: string
    images?: string[]
    status?: string
  }
}

type Inquiry = {
  id: string
  message: string
  status: string
  createdAt: string
  property: {
    id: string
    title: string
    address: string
    city: string
    images?: string[]
    price: number
    priceType: string
  }
  owner?: { id: string; name: string; email: string }
}

type DashboardData = {
  brand: BrandInfo | null
  stats: Stats
  recentViews: PropertyView[]
  savedProperties: SavedProperty[]
  inquiries: Inquiry[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, priceType: string) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
  switch (priceType) {
    case 'monthly': return `${formatted}/mo`
    case 'yearly': return `${formatted}/yr`
    case 'sqft': return `${formatted}/sqft`
    default: return formatted
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    responded: 'bg-green-50 text-green-700 border-green-200',
    closed: 'bg-gray-100 text-gray-600 border-gray-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  }
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function PropertyCard({
  image,
  title,
  address,
  price,
  priceType,
  size,
  badge,
  badgeClass,
  href,
  meta,
}: {
  image?: string
  title: string
  address: string
  price: number
  priceType: string
  size: number
  badge?: string
  badgeClass?: string
  href: string
  meta?: string
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      <div className="relative h-40 bg-gray-100 flex-shrink-0">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
            <svg className="w-10 h-10 text-[#FF5200]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        {badge && (
          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-1 group-hover:text-[#FF5200] transition-colors">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-1">{address}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-base font-bold text-[#FF5200]">{formatPrice(price, priceType)}</span>
          <span className="text-xs text-gray-400">{size.toLocaleString()} sqft</span>
        </div>
        {meta && <p className="text-[11px] text-gray-400 mt-1">{meta}</p>}
      </div>
    </Link>
  )
}

function EmptyState({ message, cta, ctaHref }: { message: string; cta?: string; ctaHref?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
      <p className="text-sm text-gray-500 mb-3">{message}</p>
      {cta && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-lg hover:shadow-md transition-all"
        >
          {cta}
        </Link>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function BrandDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [brandId, setBrandId] = useState<string | null>(null)
  const [brandName, setBrandName] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'inquiries'>('overview')

  useEffect(() => {
    const storedId = typeof window !== 'undefined' ? localStorage.getItem('brandId') : null
    const storedName = typeof window !== 'undefined' ? localStorage.getItem('brandName') : null

    if (!storedId) {
      router.replace('/dashboard/brand/login')
      return
    }

    setBrandId(storedId)
    if (storedName) setBrandName(storedName)
    fetchDashboard(storedId)
  }, [router])

  const fetchDashboard = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/brand?brandId=${encodeURIComponent(id)}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        if (json.brand?.name) setBrandName(json.brand.name)
      }
    } catch (err) {
      console.error('[Brand Dashboard] Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <DynamicBackground />
        <Navbar />
        <div className="relative z-10 pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#FF5200] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const stats = data?.stats ?? { totalViews: 0, totalSaved: 0, totalInquiries: 0, pendingInquiries: 0 }
  const brand = data?.brand ?? null
  const recentViews = data?.recentViews ?? []
  const savedProperties = data?.savedProperties ?? []
  const inquiries = data?.inquiries ?? []

  return (
    <div className="min-h-screen relative">
      <DynamicBackground />
      <Navbar />

      <div className="relative z-10 pt-16 sm:pt-24 pb-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-[0_18px_60px_rgba(0,0,0,0.04)] p-4 sm:p-6 md:p-8">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 tracking-wide">
                  Welcome back,
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 leading-snug">
                  {brandName || brand?.companyName || 'Brand Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">
                  {brand?.industry ? `${brand.industry} · ` : ''}
                  {brand?.phone || brand?.email || ''}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link
                  href="/properties/results"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-xl hover:shadow-md transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Spaces
                </Link>
                <Link
                  href="/onboarding/brand"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:border-[#FF5200] hover:text-[#FF5200] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Update Preferences
                </Link>
              </div>
            </div>

            {/* ── Preference Summary ── */}
            {brand && (brand.budgetMin || brand.preferredLocations) && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100">
                <p className="text-xs font-semibold text-[#FF5200] uppercase tracking-wide mb-2">Your Requirements</p>
                <div className="flex flex-wrap gap-2">
                  {brand.budgetMin && brand.budgetMax && (
                    <span className="px-3 py-1 rounded-full bg-white border border-orange-200 text-xs text-gray-700 font-medium">
                      Budget: ₹{brand.budgetMin.toLocaleString('en-IN')} – ₹{brand.budgetMax.toLocaleString('en-IN')}/mo
                    </span>
                  )}
                  {brand.minSize && brand.maxSize && (
                    <span className="px-3 py-1 rounded-full bg-white border border-orange-200 text-xs text-gray-700 font-medium">
                      Size: {brand.minSize.toLocaleString()}–{brand.maxSize.toLocaleString()} sqft
                    </span>
                  )}
                  {Array.isArray(brand.preferredLocations) &&
                    brand.preferredLocations.map((loc: string) => (
                      <span key={loc} className="px-3 py-1 rounded-full bg-white border border-orange-200 text-xs text-gray-700 font-medium">
                        {loc}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <StatCard
                label="Properties Viewed"
                value={stats.totalViews}
                accent="bg-blue-50 text-blue-600"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              />
              <StatCard
                label="Saved Spaces"
                value={stats.totalSaved}
                accent="bg-pink-50 text-pink-600"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Inquiries Sent"
                value={stats.totalInquiries}
                accent="bg-purple-50 text-purple-600"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                }
              />
              <StatCard
                label="Pending Replies"
                value={stats.pendingInquiries}
                accent="bg-orange-50 text-[#FF5200]"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* ── Tabs ── */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex gap-1 text-sm overflow-x-auto">
                {(
                  [
                    { key: 'overview', label: `Recent Views (${recentViews.length})` },
                    { key: 'saved', label: `Saved Spaces (${savedProperties.length})` },
                    { key: 'inquiries', label: `Inquiries (${inquiries.length})` },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`whitespace-nowrap px-4 py-2.5 border-b-2 font-medium transition-colors ${
                      activeTab === key
                        ? 'border-[#FF5200] text-[#FF5200]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* ── Tab: Recent Views ── */}
            {activeTab === 'overview' && (
              <>
                {recentViews.length === 0 ? (
                  <EmptyState
                    message="You haven't viewed any properties yet."
                    cta="Browse Spaces"
                    ctaHref="/properties/results"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {recentViews.map((v) => (
                      <PropertyCard
                        key={v.id}
                        href={`/properties/${encodePropertyId(v.propertyId)}`}
                        image={
                          Array.isArray(v.property.images)
                            ? v.property.images[0]
                            : undefined
                        }
                        title={v.property.title}
                        address={`${v.property.address}, ${v.property.city}`}
                        price={v.property.price}
                        priceType={v.property.priceType}
                        size={v.property.size}
                        badge={v.property.status === 'approved' ? 'Live' : v.property.status === 'rejected' ? 'Unavailable' : 'Pending'}
                        badgeClass={statusBadge(v.property.status)}
                        meta={`Viewed ${formatDate(v.viewedAt)}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Tab: Saved Spaces ── */}
            {activeTab === 'saved' && (
              <>
                {savedProperties.length === 0 ? (
                  <EmptyState
                    message="You haven't saved any properties yet. Click the heart icon on any property to save it."
                    cta="Browse Spaces"
                    ctaHref="/properties/results"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {savedProperties.map((sp) => (
                      <PropertyCard
                        key={sp.id}
                        href={`/properties/${encodePropertyId(sp.property.id)}`}
                        image={
                          Array.isArray(sp.property.images)
                            ? (sp.property.images as string[])[0]
                            : undefined
                        }
                        title={sp.property.title}
                        address={`${sp.property.address}, ${sp.property.city}`}
                        price={Number(sp.property.price)}
                        priceType={sp.property.priceType}
                        size={sp.property.size}
                        badge={
                          sp.property.status === 'approved'
                            ? 'Live'
                            : sp.property.status === 'rejected'
                            ? 'Unavailable'
                            : 'Pending'
                        }
                        badgeClass={statusBadge(sp.property.status || 'pending')}
                        meta={`Saved ${formatDate(sp.savedAt)}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Tab: Inquiries ── */}
            {activeTab === 'inquiries' && (
              <>
                {inquiries.length === 0 ? (
                  <EmptyState
                    message="You haven't sent any inquiries yet. Find a space you like and reach out to the owner."
                    cta="Browse Spaces"
                    ctaHref="/properties/results"
                  />
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-4">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {Array.isArray(inq.property.images) && inq.property.images[0] ? (
                              <Image
                                src={inq.property.images[0]}
                                alt={inq.property.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
                                <svg className="w-7 h-7 text-[#FF5200]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <Link
                                href={`/properties/${encodePropertyId(inq.property.id)}`}
                                className="font-semibold text-gray-900 text-sm hover:text-[#FF5200] transition-colors truncate"
                              >
                                {inq.property.title}
                              </Link>
                              <span
                                className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${statusBadge(inq.status)}`}
                              >
                                {inq.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2 truncate">
                              {inq.property.address}, {inq.property.city}
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 mb-2">
                              {inq.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>{formatDate(inq.createdAt)}</span>
                              {inq.owner && (
                                <span>Owner: {inq.owner.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Footer CTA ── */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                Need help finding the right space?{' '}
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF5200] font-medium hover:underline"
                >
                  Chat with us on WhatsApp
                </a>
              </p>
              <Link
                href="/filter/brand"
                className="text-sm font-medium text-gray-600 hover:text-[#FF5200] transition-colors"
              >
                Refine your search criteria →
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
