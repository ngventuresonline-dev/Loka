import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Location Intelligence | Lokazen',
  description: 'Make data-driven location decisions with AI-powered foot traffic analysis, demographics, competition mapping, and rent benchmarking for Bangalore.',
  openGraph: {
    title: 'Location Intelligence | Lokazen',
    description: 'Make data-driven location decisions with AI-powered foot traffic analysis, demographics, competition mapping, and rent benchmarking for Bangalore.',
    url: 'https://www.lokazen.in/location-intelligence',
    siteName: 'Lokazen',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Location Intelligence | Lokazen',
    description: 'Make data-driven location decisions with AI-powered foot traffic analysis, demographics, competition mapping, and rent benchmarking.',
  },
}

export default function LocationIntelligenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
