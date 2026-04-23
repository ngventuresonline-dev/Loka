'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { BlogPostListItem } from '@/lib/blog-posts'
import { getHeroBrandLogos } from '@/lib/blog-hero-brands'
import { publicSrc } from '@/lib/public-image-src'

const CATEGORY_ORDER = [
  'All',
  'Placements',
  'Location Intelligence',
  'Market Analysis',
  'Industry Insights',
  'Technology',
]

interface BlogPageClientProps {
  posts: BlogPostListItem[]
}

export default function BlogPageClient({ posts }: BlogPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const heroBrands = useMemo(() => getHeroBrandLogos(12), [])

  const categories = useMemo(() => {
    const present = new Set(posts.map((p) => p.category))
    const ordered = CATEGORY_ORDER.filter((c) => c === 'All' || present.has(c))
    const rest = [...present].filter((c) => !CATEGORY_ORDER.includes(c)).sort()
    return [...ordered, ...rest]
  }, [posts])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        q === '' ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [posts, selectedCategory, searchQuery])

  const { featured, gridPosts } = useMemo(() => {
    const f = filteredPosts.find((p) => p.variant === 'placements')
    if (!f) return { featured: null as BlogPostListItem | null, gridPosts: filteredPosts }
    return {
      featured: f,
      gridPosts: filteredPosts.filter((p) => p.id !== f.id),
    }
  }, [filteredPosts])

  const latestDate = posts[0]?.date
  const articleCount = posts.length

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-orange-50/35 text-zinc-900">
      <Navbar />

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.12) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 78%)',
          }}
        />
        <div className="absolute -top-24 right-0 w-[min(100%,520px)] h-[520px] bg-gradient-to-bl from-[#FF5200]/10 via-[#E4002B]/6 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-gradient-to-tr from-orange-200/35 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 md:pt-32 md:pb-28">
        {/* Hero */}
        <header className="mb-10 md:mb-14 rounded-3xl border border-zinc-200/90 bg-white/85 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="relative p-8 md:p-12 lg:p-14 grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-12 items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#FF5200]/25 bg-gradient-to-r from-[#FF5200]/8 to-[#E4002B]/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#c2410c]">
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#FF5200] to-[#E4002B]" />
                  Lokazen · Insights
                </span>
                <span className="text-xs font-medium text-zinc-500">Feb–Apr 2026 series</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.08] mb-5">
                Commercial real estate{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">
                  intelligence
                </span>
                <span className="text-zinc-900"> &amp; playbooks</span>
              </h1>

              <p className="text-lg text-zinc-600 max-w-2xl leading-relaxed mb-8">
                Location scoring, lease strategy, compliance, and{' '}
                <strong className="text-zinc-800 font-semibold">real Bangalore placements</strong>—written for
                operators and owners on{' '}
                <span className="whitespace-nowrap text-zinc-800 font-medium">www.lokazen.in</span>.
              </p>

              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm text-white shadow-md">
                  <span className="font-bold text-lg tabular-nums">{articleCount}</span>
                  <span className="text-white/80">guides</span>
                </div>
                {latestDate && (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-600">
                    <span className="text-zinc-400">Latest</span>
                    <time className="font-semibold text-zinc-800" dateTime={latestDate}>
                      {new Date(latestDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                )}
              </div>
            </div>

            {/* Partner logos + Lokazen mark — light panel (no broken invert on SVG) */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex justify-center mb-5">
                <Image
                  src="/lokazen-logo-text.svg"
                  alt="Lokazen"
                  width={200}
                  height={56}
                  className="h-10 w-auto max-w-full object-contain object-left"
                  priority
                />
              </div>
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
                Brands on our map
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {heroBrands.map(({ brand, logoSrc }) => (
                  <div
                    key={brand}
                    title={brand}
                    className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50/80 shadow-sm"
                  >
                    {logoSrc ? (
                      <Image
                        src={publicSrc(logoSrc)}
                        alt={`${brand} logo`}
                        width={48}
                        height={48}
                        className="max-h-10 w-auto max-w-[2.75rem] object-contain"
                      />
                    ) : (
                      <span className="text-sm font-bold text-[#FF5200]" aria-hidden>
                        {brand.charAt(0)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <Link
                href="/#brand-placements"
                className="mt-5 block text-center text-sm font-semibold text-[#FF5200] hover:text-[#E4002B] transition-colors"
              >
                See live placement map →
              </Link>
            </div>
          </div>
        </header>

        {/* Search & filters */}
        <div className="mb-10 md:mb-12 rounded-2xl border border-zinc-200/90 bg-white/95 backdrop-blur-md shadow-sm p-4 sm:p-5">
          <label htmlFor="blog-search" className="sr-only">
            Search articles
          </label>
          <div className="relative mb-5">
            <input
              id="blog-search"
              type="search"
              placeholder="Search by title, topic, or tag…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50/50 py-3.5 pl-12 pr-4 text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF5200] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FF5200]/12 transition-all"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <p className="text-xs font-medium text-zinc-500 mb-2.5 uppercase tracking-wide">Topics</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white shadow-md shadow-orange-500/20'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-transparent'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-24 rounded-3xl border border-dashed border-zinc-300 bg-white/70">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">No articles match</h2>
            <p className="text-zinc-600 max-w-md mx-auto mb-6">Try another topic or clear the search box.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
              }}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            {featured && (
              <section className="mb-12 md:mb-14" aria-labelledby="featured-heading">
                <h2 id="featured-heading" className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500 mb-4">
                  Featured
                </h2>

                <Link href={`/blog/${featured.id}`} className="group block">
                  <article className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-lg transition-shadow hover:shadow-xl">
                    <div className="relative aspect-[21/9] min-h-[200px] max-h-[320px] w-full bg-zinc-100">
                      <Image
                        src={featured.coverImage}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width: 1280px) 100vw, 1200px"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm">
                            {featured.category}
                          </span>
                          <span className="rounded-full bg-[#FF5200] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            New
                          </span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-sm line-clamp-3">
                          {featured.title}
                        </h3>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 px-6 py-5 md:px-8 md:py-6 bg-zinc-50/50">
                      <p className="text-zinc-600 text-base leading-relaxed line-clamp-2 mb-5">{featured.excerpt}</p>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 shrink-0">
                            On the platform
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {heroBrands.slice(0, 8).map(({ brand, logoSrc }) => (
                              <div
                                key={`feat-${brand}`}
                                className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white"
                                title={brand}
                              >
                                {logoSrc ? (
                                  <Image
                                    src={publicSrc(logoSrc)}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="max-h-7 w-auto max-w-[1.75rem] object-contain"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-[#FF5200]">{brand.charAt(0)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF5200] shrink-0">
                          Read full article
                          <span aria-hidden>→</span>
                        </span>
                      </div>
                      <time className="mt-3 block text-xs text-zinc-400" dateTime={featured.date}>
                        {new Date(featured.date).toLocaleDateString('en-IN', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        · {featured.readTime}
                      </time>
                    </div>
                  </article>
                </Link>
              </section>
            )}

            <div className="flex items-baseline justify-between gap-4 mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-zinc-900">
                {featured ? 'More articles' : 'All articles'}
              </h2>
              <span className="text-sm text-zinc-500 tabular-nums">{gridPosts.length} articles</span>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7 list-none p-0 m-0">
              {gridPosts.map((post) => (
                <li key={post.id}>
                  <Link href={`/blog/${post.id}`} className="group block h-full">
                    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/10">
                      <div className="absolute top-0 left-0 right-0 z-[1] h-1 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35]" />

                      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-zinc-100">
                        <Image
                          src={post.coverImage}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                          <span className="inline-flex rounded-md bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-white/20 backdrop-blur-md">
                            {post.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-5 md:p-6">
                        <h3 className="text-lg font-bold text-zinc-900 leading-snug mb-3 group-hover:text-[#FF5200] transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-zinc-600 leading-relaxed line-clamp-3 flex-1 mb-4">{post.excerpt}</p>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                          <span className="truncate text-xs text-zinc-500">{post.author}</span>
                          <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
                            <time dateTime={post.date}>
                              {new Date(post.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </time>
                            <span className="text-zinc-300">·</span>
                            <span>{post.readTime}</span>
                          </div>
                        </div>

                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#FF5200] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                          Read
                          <span aria-hidden>→</span>
                        </span>
                      </div>
                    </article>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <section className="mt-16 md:mt-20 rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50/90 via-white to-rose-50/40 p-8 md:p-10 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">Ready for your next space?</h2>
              <p className="text-zinc-600 leading-relaxed">
                Shortlist scored listings, book site visits, and move toward LOI with Lokazen—built for retail and
                F&amp;B expansion in India.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 shrink-0">
              <Link
                href="/filter/brand"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#FF5200] to-[#E4002B] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 hover:opacity-95 transition-opacity"
              >
                Find commercial space
              </Link>
              <Link
                href="/location-intelligence"
                className="inline-flex items-center justify-center rounded-xl border-2 border-zinc-900 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
              >
                Location intelligence
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
