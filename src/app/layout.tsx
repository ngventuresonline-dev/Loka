import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import GoogleMapsErrorHandler from '@/components/GoogleMapsErrorHandler'

export const metadata: Metadata = {
  title: 'Lokazen - AI-Powered Commercial Real Estate Platform',
  description: 'Connect brands with property owners for commercial real estate. AI-powered matching platform.',
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
      </body>
    </html>
  )
}
