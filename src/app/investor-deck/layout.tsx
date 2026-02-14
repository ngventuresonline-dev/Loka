import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investor deck | Lokazen — Raising ₹1 Cr · 3–8x return',
  description: 'Lokazen investor deck. Bangalore-based AI commercial real estate matchmaking. Raising ₹1 Cr, 3–5 investors. Use of funds, growth plan, marketing plan, proprietary tech, 5-year projection, 3–8x return.',
  robots: 'noindex, nofollow',
}

export default function InvestorDeckLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
