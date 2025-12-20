import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import GoogleMapsErrorHandler from '@/components/GoogleMapsErrorHandler'
import { Analytics } from '@vercel/analytics/react'

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
        url: 'https://lokazen.in/lokazen-favicon.svg',
        width: 64,
        height: 64,
        alt: 'Lokazen - AI-Powered Commercial Real Estate Matching Platform',
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lokazen - Connect Brands with Properties | AI-Powered Commercial Real Estate Matching',
    description:
      'Brands: Find your ideal commercial space. Owners: List properties and connect with qualified tenants. AI-powered matchmaking for retail, QSR, F&B spaces in Bangalore. Get matched instantly.',
    images: ['https://lokazen.in/lokazen-favicon.svg'],
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.lokazen.in" />
        {/* Preload critical API endpoints */}
        <link rel="prefetch" href="/api/brands" as="fetch" crossOrigin="anonymous" />
        <link rel="prefetch" href="/api/properties?limit=20" as="fetch" crossOrigin="anonymous" />
      </head>
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
