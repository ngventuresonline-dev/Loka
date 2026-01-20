import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import GoogleMapsErrorHandler from '@/components/GoogleMapsErrorHandler'
import SupabaseInitializer from '@/components/SupabaseInitializer'
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
      </head>
      <body className="font-sans antialiased text-gray-900">
        {/* Google Tag Manager */}
        <Script
          id="gtm-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TQ3RGK37');`,
          }}
        />
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TQ3RGK37"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {/* Google Analytics */}
        <Script
          id="ga-src"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-GFTJMV4G59"
        />
        <Script
          id="ga-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-GFTJMV4G59');
            `,
          }}
        />

        {/* Microsoft Clarity */}
        <Script
          id="clarity-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "v3r7u519pf");`,
          }}
        />

        {/* Meta Pixel */}
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '25821305420838603');
fbq('track', 'PageView');`,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=25821305420838603&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        <GoogleMapsErrorHandler />
        <SupabaseInitializer />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
