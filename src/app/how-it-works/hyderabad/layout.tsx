import type { Metadata } from 'next'

const title = 'How Lokazen Works — Hyderabad Expansion'
const description =
  'End-to-end commercial property sourcing and matchmaking for F&B brands expanding to Hyderabad.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://lokazen.in/how-it-works/hyderabad',
    siteName: 'Lokazen',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  alternates: {
    canonical: '/how-it-works/hyderabad',
  },
}

export default function HyderabadHowItWorksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
