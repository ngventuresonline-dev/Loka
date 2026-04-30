import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Brand Onboarding | Lokazen',
  description: 'Set up your brand profile on Lokazen and start finding the perfect commercial space in Bangalore.',
  openGraph: {
    title: 'Brand Onboarding | Lokazen',
    description: 'Set up your brand profile and find the perfect commercial space in Bangalore.',
    url: 'https://www.lokazen.in/onboarding/brand',
    siteName: 'Lokazen',
    type: 'website',
  },
}

export default function BrandOnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
