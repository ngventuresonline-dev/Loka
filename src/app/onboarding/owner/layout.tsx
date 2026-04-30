import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Property Owner Onboarding | Lokazen',
  description: 'List your commercial property on Lokazen and connect with the right brands in Bangalore.',
  openGraph: {
    title: 'Property Owner Onboarding | Lokazen',
    description: 'List your commercial property and connect with the right brands in Bangalore.',
    url: 'https://www.lokazen.in/onboarding/owner',
    siteName: 'Lokazen',
    type: 'website',
  },
}

export default function OwnerOnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
