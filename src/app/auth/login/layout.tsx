import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | Lokazen',
  description: 'Sign in to your Lokazen account to access commercial property listings and location intelligence.',
  openGraph: {
    title: 'Sign In | Lokazen',
    description: 'Sign in to your Lokazen account.',
    url: 'https://www.lokazen.in/auth/login',
    siteName: 'Lokazen',
    type: 'website',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
