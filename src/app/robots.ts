import type { MetadataRoute } from 'next'
import { getSiteBaseUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = getSiteBaseUrl()
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/blog', '/filter/brand', '/filter/owner', '/about', '/location-intelligence'],
      disallow: ['/admin', '/dashboard', '/auth', '/api', '/onboarding', '/_next', '/static'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}


