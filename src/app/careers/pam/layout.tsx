import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Property Acquisition Manager — Careers | Lokazen',
  description:
    'Join Lokazen in Bangalore as Property Acquisition Manager. Field role: source commercial spaces, connect owners to 100+ F&B and retail brands, and close deals on our AI-powered platform.',
  openGraph: {
    title: 'Property Acquisition Manager — Careers | Lokazen',
    description:
      "Walk Bangalore. Meet owners. Build the city's commercial real estate future with Lokazen.",
    url: 'https://lokazen.in/careers/pam',
    siteName: 'Lokazen',
  },
  alternates: {
    canonical: '/careers/pam',
  },
}

export default function PamCareersLayout({ children }: { children: React.ReactNode }) {
  return <div className={poppins.className}>{children}</div>
}
