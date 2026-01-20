import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import GoogleMapsErrorHandler from '@/components/GoogleMapsErrorHandler'
import CookieConsent from '@/components/CookieConsent'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

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
        url: '/lokazen-social.png',
        width: 1200,
        height: 630,
        alt: 'Lokazen - AI-Powered Commercial Real Estate Matching Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lokazen - Connect Brands with Properties | AI-Powered Commercial Real Estate Matching',
    description:
      'Brands: Find your ideal commercial space. Owners: List properties and connect with qualified tenants. AI-powered matchmaking for retail, QSR, F&B spaces in Bangalore. Get matched instantly.',
    images: ['/lokazen-social.png'],
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
        {/* Microsoft Clarity */}
        <Script
          id="clarity-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "v3r7u519pf");`,
          }}
        />
      </head>
      <body className="font-sans antialiased text-gray-900">
        <CookieConsent />
        <GoogleMapsErrorHandler />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
