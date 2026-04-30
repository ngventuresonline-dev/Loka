import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | Lokazen',
  description: 'Learn how Lokazen is revolutionizing commercial real estate in Bangalore — connecting the right brands with the right spaces.',
  openGraph: {
    title: 'About Us | Lokazen',
    description: 'Learn how Lokazen is revolutionizing commercial real estate in Bangalore — connecting the right brands with the right spaces.',
    url: 'https://www.lokazen.in/about',
    siteName: 'Lokazen',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | Lokazen',
    description: 'Learn how Lokazen is revolutionizing commercial real estate in Bangalore.',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
