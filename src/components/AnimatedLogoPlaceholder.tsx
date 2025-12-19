'use client'

import { getBrandLogo, getBrandInitial } from '@/lib/brand-logos'

interface AnimatedLogoPlaceholderProps {
  className?: string
  aspectRatio?: 'square' | 'wide' | 'tall'
}

export default function AnimatedLogoPlaceholder({ 
  className = '', 
  aspectRatio = 'wide' 
}: AnimatedLogoPlaceholderProps) {
  const aspectClasses = {
    square: 'aspect-square',
    wide: 'aspect-video',
    tall: 'aspect-[3/4]'
  }

  // Get brand logos for animation
  const allBrands = [
    'Truffles', 'Original Burger Co.', 'Mumbai Pav Co.', 'Evil Onigiri', 'Roma Deli', 
    'Blr Brewing Co.', 'Burger Seigneur', 'Biggies Burger', 
    'The Flour Girl Cafe', 'Bawri', 'Boba Bhai', 'GoRally- Sports', 'Dolphins Bar & Kitchen', 
    'Klutch- Sports', 'Sun Kissed Smoothie', 'Qirfa', 'Zed The Baker', 
    'Blue Tokai', 'Sandowitch', 'Madam Chocolate', 'Eleven Bakehouse', 'Kunafa Story', 
    'Namaste- South Indian', 'Kried Ko- Burger', 'Samosa Party', 'Melts- Cruncheese', 
    'TAN Coffee', 'Block Two Coffee'
  ]
  
  const brandLogoData = allBrands.map(brand => ({
    brand,
    logoPath: getBrandLogo(brand),
    initial: getBrandInitial(brand)
  })).filter(item => item.logoPath !== null)

  const largerLogos = [
    '/logos/Eleven-Bakehouse-Coloured-Logos-01.png',
    '/logos/Burger Seigneur Logo 1.png',
    '/logos/blr brewing co logo.png',
    '/logos/Original_Burger_Co_Logo.png',
    '/logos/Madam Chocolate Logo .png',
    '/logos/Sandowitch logo.jpg'
  ]

  const logoDataWithSize = brandLogoData.map(item => ({
    ...item,
    isLarge: largerLogos.includes(item.logoPath as string)
  }))

  const uniqueLogos = logoDataWithSize.slice(0, 12) // Use more logos for placeholder

  return (
    <div className={`relative ${aspectClasses[aspectRatio]} w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-lg ${className}`}>
      {/* Animated scrolling logos */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full overflow-hidden">
          {/* First row - scrolling left */}
          <div className="absolute top-1/4 left-0 w-full">
            <div className="flex gap-6 animate-[scroll_30s_linear_infinite] w-max">
              {[
                ...uniqueLogos,
                ...uniqueLogos,
                ...uniqueLogos
              ].map((logoItem, idx) => {
                const logoPath = logoItem.logoPath as string
                const isLarge = logoItem.isLarge
                
                return (
                  <div
                    key={`placeholder-logo-1-${idx}-${logoPath}`}
                    className={`relative flex-shrink-0 flex items-center justify-center h-12 md:h-16 opacity-40`}
                  >
                    <img
                      src={logoPath}
                      alt=""
                      className="relative h-full w-auto object-contain rounded-lg max-w-[80px] md:max-w-[100px]"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Second row - scrolling right */}
          <div className="absolute bottom-1/4 left-0 w-full">
            <div className="flex gap-6 animate-[scrollReverse_35s_linear_infinite] w-max">
              {[
                ...uniqueLogos.reverse(),
                ...uniqueLogos,
                ...uniqueLogos
              ].map((logoItem, idx) => {
                const logoPath = logoItem.logoPath as string
                
                return (
                  <div
                    key={`placeholder-logo-2-${idx}-${logoPath}`}
                    className={`relative flex-shrink-0 flex items-center justify-center h-10 md:h-14 opacity-30`}
                  >
                    <img
                      src={logoPath}
                      alt=""
                      className="relative h-full w-auto object-contain rounded-lg max-w-[70px] md:max-w-[90px]"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-100/80 via-transparent to-gray-100/80"></div>
      
      {/* Center brand indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-full p-4 border-2 border-[#FF5200]/20">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl">N&G</span>
          </div>
        </div>
      </div>
    </div>
  )
}

