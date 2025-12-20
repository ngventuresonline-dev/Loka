import type { MetadataRoute } from 'next'

const BASE_URL = 'https://lokazen.in'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/filter/brand', '/filter/owner', '/about', '/location-intelligence'],
      disallow: ['/admin', '/dashboard', '/auth', '/api', '/onboarding', '/_next', '/static'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}


