import type { Metadata } from 'next'

const title = 'The Kind Roastery × Lokazen — Hyderabad Shortlist (6 Properties)'
const description =
  'Confidential April–May 2026: six Jubilee Hills and Banjara Hills properties evaluated on the Lokazen BFI, with full Location Intelligence Reports and maps links.'

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
