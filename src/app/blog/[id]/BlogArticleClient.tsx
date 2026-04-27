'use client'

import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { BlogPost } from '@/lib/blog-posts'
import { brandPlacements } from '@/lib/brand-placements'
import { getBrandLogo } from '@/lib/brand-logos'
import { getHeroBrandLogos } from '@/lib/blog-hero-brands'
import { publicSrc } from '@/lib/public-image-src'
import DOMPurify from 'isomorphic-dompurify'

function formatArticleHtml(html: string): string {
  return html
    .replace(/<h2>/g, '<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 pt-4 border-t border-gray-200">')
    .replace(/<h3>/g, '<h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">')
    .replace(/<p>/g, '<p class="text-gray-700 leading-relaxed mb-4">')
    .replace(/<ul>/g, '<ul class="list-disc list-inside space-y-2 mb-6 text-gray-700 ml-4">')
    .replace(/<li>/g, '<li class="leading-relaxed">')
    .replace(/<strong>/g, '<strong class="font-bold text-gray-900">')
    .replace(
      /<a href=/g,
      '<a class="text-[#FF5200] font-semibold underline underline-offset-2 hover:text-[#E4002B] transition-colors" href='
    )
}

interface BlogArticleClientProps {
  post: BlogPost
}

export default function BlogArticleClient({ post }: BlogArticleClientProps) {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="fixed inset-0 z-0 bg-white overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full blur-[120px] opacity-10" />
      </div>

      <article className="relative z-10 pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#FF5200] transition-colors mb-8"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>

          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#FF5200]/10 to-[#E4002B]/10 border border-[#FF5200]/20 rounded-full text-sm font-semibold text-[#FF5200]">
              {post.category}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
              </time>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{post.readTime}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-12">
            {post.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg">
                {tag}
              </span>
            ))}
          </div>

          <div className="relative w-full aspect-[2/1] max-h-[420px] min-h-[200px] rounded-2xl mb-8 overflow-hidden border border-zinc-200 bg-zinc-100 shadow-sm">
            <Image
              src={post.coverImage}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          {post.variant === 'placements' && (
            <div className="mb-12 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 shrink-0">Featured brands</span>
              <div className="flex flex-wrap justify-center gap-2">
                {getHeroBrandLogos(10).map(({ brand, logoSrc }) => (
                  <div
                    key={brand}
                    title={brand}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-white bg-white shadow-sm"
                  >
                    {logoSrc ? (
                      <Image
                        src={publicSrc(logoSrc)}
                        alt={`${brand} logo`}
                        width={40}
                        height={40}
                        className="max-h-8 w-auto max-w-[2.25rem] object-contain"
                      />
                    ) : (
                      <span className="text-xs font-bold text-[#FF5200]">{brand.charAt(0)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-none text-lg" style={{ color: '#374151' }}>
            <div
              className="space-y-6 leading-relaxed max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatArticleHtml(post.content)) }}
            />
          </div>

          {post.variant === 'placements' && (
            <section className="mt-16" aria-labelledby="placements-gallery-heading">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                <div>
                  <h2 id="placements-gallery-heading" className="text-2xl md:text-3xl font-bold text-gray-900">
                    Recent Bangalore placements
                  </h2>
                  <p className="text-gray-600 mt-2 text-base">
                    Same data as our public placement map—logos shown where provided by the brand.
                  </p>
                </div>
                <Link
                  href="/#brand-placements"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-900 font-semibold text-sm hover:border-[#FF5200] hover:text-[#FF5200] transition-colors"
                >
                  View on homepage map
                </Link>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5 list-none p-0 m-0">
                {brandPlacements.map((row, i) => {
                  const logo = getBrandLogo(row.brand)
                  return (
                    <li
                      key={`${row.brand}-${row.location}-${i}`}
                      className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-[#FF5200]/30 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                          {logo ? (
                            <Image
                              src={publicSrc(logo)}
                              alt={`${row.brand} logo`}
                              width={80}
                              height={80}
                              className="object-contain max-h-14 w-auto max-w-[4.5rem]"
                            />
                          ) : (
                            <span className="text-xl font-bold text-[#FF5200]" aria-hidden>
                              {row.brand.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 text-lg leading-tight">{row.brand}</p>
                          <p className="text-sm text-gray-600 mt-1">{row.location}</p>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#FF5200] mt-2">{row.size}</p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {post.faq && post.faq.length > 0 && (
            <section className="mt-16 border-t border-gray-200 pt-12" aria-labelledby="blog-faq-heading">
              <h2 id="blog-faq-heading" className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Frequently asked questions
              </h2>
              <dl className="space-y-6">
                {post.faq.map((item) => (
                  <div key={item.question} className="rounded-xl border border-gray-100 bg-gray-50/80 p-5">
                    <dt className="font-semibold text-gray-900">{item.question}</dt>
                    <dd className="mt-2 text-gray-700 leading-relaxed">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div className="mt-16 p-8 bg-gradient-to-br from-[#FF5200]/10 via-[#E4002B]/10 to-transparent rounded-2xl border-2 border-[#FF5200]/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Find your next commercial space</h2>
            <p className="text-gray-700 mb-6">
              Lokazen combines verified listings, AI-assisted matching, and placement experts for retail and F&B teams
              expanding in India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/filter/brand"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#FF5200]/30 transition-all"
              >
                Find your space
              </Link>
              <Link
                href="/location-intelligence"
                className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-[#FF5200] text-[#FF5200] rounded-xl font-semibold hover:bg-[#FF5200]/5 transition-all"
              >
                Location intelligence
              </Link>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}
