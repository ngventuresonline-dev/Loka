import type { Metadata } from 'next'

const title = 'The Kind Roastery × Lokazen — Hyderabad Owner Journey'
const description =
  'Confidential walkthrough: the Meta creative, owner funnel, and Lokazen stages from ad impression to signed lease for The Kind’s Jubilee Hills expansion.'

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
