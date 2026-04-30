import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'Lokazen - Commercial Real Estate Platform',
  description: 'Connect brands with property owners for commercial real estate in Bangalore. AI-powered matching platform.',
  openGraph: {
    title: 'Lokazen - Commercial Real Estate Platform',
    description: 'Connect brands with property owners for commercial real estate in Bangalore. AI-powered matching platform.',
    url: 'https://www.lokazen.in',
    siteName: 'Lokazen',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lokazen - Commercial Real Estate Platform',
    description: 'Connect brands with property owners for commercial real estate in Bangalore.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-gray-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
