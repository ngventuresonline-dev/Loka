'use client'

import { getBrandLogo } from '@/lib/brand-logos'

const BRANDS = [
  'Truffles', 'Original Burger Co.', 'Mumbai Pav Co.', 'Evil Onigiri', 'Roma Deli',
  'Blr Brewing Co.', 'Burger Seigneur', 'Biggies Burger',
  'The Flour Girl Cafe', 'Bawri', 'Boba Bhai', 'GoRally- Sports', 'Dolphins Bar & Kitchen',
  'Klutch- Sports', 'Sun Kissed Smoothie', 'Qirfa', 'Zed The Baker',
  'Blue Tokai', 'Sandowitch', 'Madam Chocolate', 'Eleven Bakehouse', 'Kunafa Story',
  'Namaste- South Indian', 'Kried Ko- Burger', 'Samosa Party', 'Melts- Cruncheese',
  'TAN Coffee', 'Block Two Coffee'
]

export default function TrustedBrandsRow() {
  const logos = BRANDS.map((brand) => getBrandLogo(brand)).filter(Boolean) as string[]
  const track = [...logos, ...logos, ...logos]

  return (
    <section className="relative z-10 bg-white py-12">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="text-center mb-6 sm:mb-8">
          <p className="inline-flex items-center px-4 py-1.5 rounded-full border border-gray-200/70 bg-white text-xs sm:text-sm font-semibold text-gray-700 shadow-sm">
            <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2 animate-pulse" />
            Trusted brands
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-3">
            Loved by fast-growing F&amp;B leaders
          </h2>
        </div>

        <div className="overflow-hidden">
          <div className="flex items-center gap-6 w-max animate-[scrollReverse_35s_linear_infinite]">
            {track.map((logo, idx) => (
              <div
                key={`${logo}-${idx}`}
                className="flex-shrink-0 h-14 md:h-16 flex items-center justify-center"
              >
                <img
                  src={logo}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-auto object-contain mix-blend-multiply"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

