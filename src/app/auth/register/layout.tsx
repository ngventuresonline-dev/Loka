import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account | Lokazen',
  description: 'Join Lokazen — connect your brand with premium commercial spaces in Bangalore or list your property today.',
  openGraph: {
    title: 'Create Account | Lokazen',
    description: 'Join Lokazen — connect your brand with premium commercial spaces in Bangalore.',
    url: 'https://www.lokazen.in/auth/register',
    siteName: 'Lokazen',
    type: 'website',
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
