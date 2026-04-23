import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import BlogArticleClient from './BlogArticleClient'
import type { BlogPost } from '@/lib/blog-posts'
import { getAllBlogSlugs, getBlogPostById } from '@/lib/blog-posts'
import { getSiteBaseUrl } from '@/lib/site-url'

export const dynamicParams = false

export function generateStaticParams() {
  return getAllBlogSlugs().map((id) => ({ id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = getBlogPostById(id)
  if (!post) {
    return { title: 'Blog | Lokazen' }
  }
  const base = getSiteBaseUrl()
  const canonical = `${base}/blog/${id}`
  const ogPath = post.ogImage || '/lokazen-logo-text.svg'
  const ogUrl = ogPath.startsWith('http') ? ogPath : `${base}${ogPath}`

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      siteName: 'Lokazen',
      title: post.metaTitle,
      description: post.metaDescription,
      publishedTime: post.date,
      locale: 'en_IN',
      images: [{ url: ogUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle,
      description: post.metaDescription,
      images: [ogUrl],
    },
    robots: { index: true, follow: true },
  }
}

function buildJsonLd(post: BlogPost, base: string) {
  const canonical = `${base}/blog/${post.id}`
  const imageUrl = post.ogImage ? (post.ogImage.startsWith('http') ? post.ogImage : `${base}${post.ogImage}`) : `${base}/lokazen-logo-text.svg`

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BlogPosting',
      '@id': `${canonical}#article`,
      headline: post.title,
      description: post.metaDescription,
      datePublished: post.date,
      image: [imageUrl],
      author: { '@type': 'Organization', name: post.author },
      publisher: {
        '@type': 'Organization',
        name: 'Lokazen',
        logo: { '@type': 'ImageObject', url: `${base}/lokazen-logo.svg` },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: base },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${base}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
      ],
    },
  ]

  if (post.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: post.faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = getBlogPostById(id)
  if (!post) notFound()

  const base = getSiteBaseUrl()
  const structuredData = buildJsonLd(post, base)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <BlogArticleClient post={post} />
    </>
  )
}
