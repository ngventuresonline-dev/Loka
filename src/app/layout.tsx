import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import GoogleMapsErrorHandler from '@/components/GoogleMapsErrorHandler'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Lokazen - Connect Brands with Properties | AI-Powered Commercial Real Estate Matching',
  description:
    'Brands: Find your ideal commercial space. Owners: List properties and connect with qualified tenants. AI-powered matchmaking for retail, QSR, F&B spaces in Bangalore. Get matched instantly.',
  keywords: [
    'commercial property listing',
    'find retail space',
    'list commercial property',
    'tenant matching',
    'brand space requirements',
    'property owners Bangalore',
  ],
  openGraph: {
    title: 'Lokazen - Connect Brands with Properties | AI-Powered Commercial Real Estate Matching',
    description:
      'Brands: Find your ideal commercial space. Owners: List properties and connect with qualified tenants. AI-powered matchmaking for retail, QSR, F&B spaces in Bangalore. Get matched instantly.',
    url: 'https://lokazen.in',
    siteName: 'Lokazen',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: 'https://lokazen.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Lokazen - AI-Powered Commercial Real Estate Matching Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lokazen - Connect Brands with Properties | AI-Powered Commercial Real Estate Matching',
    description:
      'Brands: Find your ideal commercial space. Owners: List properties and connect with qualified tenants. AI-powered matchmaking for retail, QSR, F&B spaces in Bangalore. Get matched instantly.',
    images: ['https://lokazen.in/og-image.jpg'],
    creator: '@lokazen',
  },
  icons: {
    icon: '/lokazen-favicon.svg',
    shortcut: '/lokazen-favicon.svg',
    apple: '/lokazen-favicon.svg',
  },
  metadataBase: new URL('https://lokazen.in'),
  alternates: {
    canonical: '/',
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
        <GoogleMapsErrorHandler />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
