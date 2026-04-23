import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getSiteBaseUrl } from '@/lib/site-url'

const base = getSiteBaseUrl()

export const metadata: Metadata = {
  title: 'Commercial Real Estate Blog | Lokazen',
  description:
    'Lokazen publishes location intelligence, retail and F&B placement insights, and commercial leasing guides for operators and property owners in India.',
  alternates: { canonical: `${base}/blog` },
  openGraph: {
    type: 'website',
    url: `${base}/blog`,
    siteName: 'Lokazen',
    title: 'Commercial Real Estate Blog | Lokazen',
    description:
      'Location intelligence, placement stories, and leasing playbooks for brands scaling commercial space in India.',
    locale: 'en_IN',
    images: [{ url: `${base}/lokazen-logo-text.svg`, width: 1200, height: 630, alt: 'Lokazen' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Commercial Real Estate Blog | Lokazen',
    description: 'Location intelligence and placement insights from Lokazen.',
    images: [`${base}/lokazen-logo-text.svg`],
  },
}

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children
}
