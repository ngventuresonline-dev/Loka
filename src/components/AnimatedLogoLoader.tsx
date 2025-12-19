'use client'

import { getBrandLogo, getBrandInitial } from '@/lib/brand-logos'

interface AnimatedLogoLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function AnimatedLogoLoader({ size = 'md', className = '' }: AnimatedLogoLoaderProps) {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
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

  const uniqueLogos = logoDataWithSize.slice(0, 8) // Use first 8 logos for loader

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative w-full max-w-md overflow-hidden">
        <div className="flex gap-4 animate-[scroll_20s_linear_infinite] w-max">
          {[
            ...uniqueLogos,
            ...uniqueLogos,
            ...uniqueLogos
          ].map((logoItem, idx) => {
            const logoPath = logoItem.logoPath as string
            const isLarge = logoItem.isLarge
            
            return (
              <div
                key={`loader-logo-${idx}-${logoPath}`}
                className={`relative flex-shrink-0 flex items-center justify-center ${
                  isLarge ? sizeClasses.md : sizeClasses[size]
                }`}
              >
                <div className="relative h-full w-full flex items-center justify-center">
                  <img
                    src={logoPath}
                    alt={`Brand logo ${idx + 1}`}
                    className={`relative h-full w-auto object-contain rounded-xl transition-all duration-300 ${
                      isLarge 
                        ? 'max-w-[120px]' 
                        : 'max-w-[100px]'
                    }`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

