import { MetadataRoute } from 'next'
import { getAllBlogSlugs, getBlogPostById } from '@/lib/blog-posts'
import { getSiteBaseUrl } from '@/lib/site-url'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteBaseUrl()

  const blogEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    ...getAllBlogSlugs().map((slug) => {
      const post = getBlogPostById(slug)
      return {
        url: `${baseUrl}/blog/${slug}`,
        lastModified: post ? new Date(post.date) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: post?.variant === 'placements' ? 0.85 : 0.65,
      }
    }),
  ]

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/filter/brand`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/filter/owner`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/location-intelligence`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogEntries,
  ]
}
