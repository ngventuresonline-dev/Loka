'use client'

import { useMemo } from 'react'
import { getBrandLogo, getBrandInitial } from '@/lib/brand-logos'
import LogoImage from '@/components/LogoImage'

const ALL_BRANDS = [
  'Truffles', 'Original Burger Co.', 'Mumbai Pav Co.', 'Evil Onigiri', 'Roma Deli',
  'Blr Brewing Co.', 'Burger Seigneur', 'Biggies Burger',
  'The Flour Girl Cafe', 'Bawri', 'Boba Bhai', 'GoRally- Sports', 'Dolphins Bar & Kitchen',
  'Klutch- Sports', 'Sun Kissed Smoothie', 'Qirfa', 'Zed The Baker',
  'Blue Tokai', 'Sandowitch', 'Madam Chocolate', 'Eleven Bakehouse', 'Kunafa Story',
  'Namaste- South Indian', 'Kried Ko- Burger', 'Samosa Party', 'Melts- Cruncheese',
  'TAN Coffee', 'Block Two Coffee',
]

const TRUSTED_ROW_1 = [
  'Truffles', 'Original Burger Co.', 'Mumbai Pav Co.', 'Evil Onigiri', 'Roma Deli',
  'Blr Brewing Co.', 'Burger Seigneur', 'Biggies Burger', 'The Flour Girl Cafe', 'Bawri',
  'Boba Bhai', 'GoRally- Sports', 'Dolphins Bar & Kitchen', 'Klutch- Sports',
]

const TRUSTED_ROW_3 = [
  'Sun Kissed Smoothie', 'Qirfa', 'Zed The Baker', 'Blue Tokai', 'Sandowitch',
  'Madam Chocolate', 'Eleven Bakehouse', 'Kunafa Story', 'Namaste- South Indian',
  'Kried Ko- Burger', 'Samosa Party', 'Melts- Cruncheese', 'TAN Coffee', 'Block Two Coffee',
]

const LARGER_LOGOS = [
  '/logos/Eleven-Bakehouse-Coloured-Logos-01.png',
  '/logos/Burger Seigneur Logo 1.png',
  '/logos/blr brewing co logo.png',
  '/logos/Original_Burger_Co_Logo.png',
  '/logos/Madam Chocolate Logo .png',
  '/logos/Sandowitch logo.jpg',
]

const LOGOS_WHITE_BG = ['Sun Kissed Smoothie', 'Biggies Burger', 'Truffles', 'Namaste- South Indian', 'Dolphins Bar & Kitchen', 'Samosa Party', 'Bawri']
const LOGOS_BLACK_BG = ['Sandowitch']

function needsBackgroundRemoval(brandName: string) {
  return [...LOGOS_WHITE_BG, ...LOGOS_BLACK_BG].some(
    (name) => brandName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(brandName.toLowerCase())
  )
}
function hasBlackBackground(brandName: string) {
  return LOGOS_BLACK_BG.some(
    (name) => brandName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(brandName.toLowerCase())
  )
}

export default function TrustedByLeadingBrands() {
  const uniqueLogos = useMemo(() => {
    return ALL_BRANDS.map((brand) => ({
      brand,
      logoPath: getBrandLogo(brand),
      initial: getBrandInitial(brand),
      isLarge: LARGER_LOGOS.includes(getBrandLogo(brand) || ''),
    })).filter((item) => item.logoPath !== null)
  }, [])

  return (
    <div className="relative z-10 mt-8 sm:mt-12 md:mt-16">
      <div className="text-center mb-14 md:mb-16">
        <div className="relative inline-flex items-center px-5 py-2 bg-gray-50 border border-gray-200 rounded-full">
          <span className="relative w-1.5 h-1.5 bg-gray-400 rounded-full mr-2.5" />
          <span className="relative text-sm font-medium text-gray-700">Trusted by Leading Brands</span>
        </div>
      </div>

      <div className="relative mb-5 w-full overflow-hidden">
        <div className="flex gap-5 md:gap-6 w-max animate-[scroll_35s_linear_infinite]">
          {[...TRUSTED_ROW_1, ...TRUSTED_ROW_1, ...TRUSTED_ROW_1].map((brand, idx) => (
            <div key={`r1-${idx}`} className="relative flex-shrink-0 h-16 md:h-18 px-7 md:px-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center select-none">
              <span className="relative text-gray-700 font-semibold text-sm md:text-base whitespace-nowrap">{brand}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mb-5 w-full overflow-hidden">
        <div className="flex gap-6 md:gap-8 w-max items-center animate-[scrollReverse_40s_linear_infinite]">
          {[...uniqueLogos, ...uniqueLogos, ...uniqueLogos].map((logoItem, idx) => {
            const logoPath = logoItem.logoPath as string
            const brandName = logoItem.brand
            return (
              <div key={`logo-${idx}`} className="relative flex-shrink-0 w-auto flex items-center justify-center h-16 md:h-20">
                <div className="relative h-full flex items-center justify-center w-full">
                  <LogoImage
                    src={logoPath}
                    alt={`${brandName} logo`}
                    brandName={brandName}
                    loading={idx < 6 ? 'eager' : 'lazy'}
                    fetchPriority={idx < 6 ? 'high' : 'low'}
                    shouldRemoveBg={needsBackgroundRemoval(brandName)}
                    hasBlackBackground={hasBlackBackground(brandName)}
                    style={{ height: '64px', minHeight: '64px' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="relative mb-5 w-full overflow-hidden">
        <div className="flex gap-5 md:gap-6 w-max animate-[scroll_38s_linear_infinite]">
          {[...TRUSTED_ROW_3, ...TRUSTED_ROW_3, ...TRUSTED_ROW_3].map((brand, idx) => (
            <div key={`r3-${idx}`} className="relative flex-shrink-0 h-16 md:h-18 px-7 md:px-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center select-none">
              <span className="relative text-gray-700 font-semibold text-sm md:text-base whitespace-nowrap">{brand}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
