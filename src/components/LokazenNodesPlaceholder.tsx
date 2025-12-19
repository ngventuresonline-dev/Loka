'use client'

import { getBrandLogo } from '@/lib/brand-logos'

interface LokazenNodesPlaceholderProps {
  className?: string
  aspectRatio?: 'square' | 'wide' | 'tall'
}

export default function LokazenNodesPlaceholder({ 
  className = '', 
  aspectRatio = 'wide' 
}: LokazenNodesPlaceholderProps) {
  const aspectClasses = {
    square: 'aspect-square',
    wide: 'aspect-video',
    tall: 'aspect-[3/4]'
  }

  // Get brand logos for scrolling animation
  const allBrands = [
    'Biggies Burger', 'Original Burger Co.', 'Mumbai Pav Co.', 'Truffles', 'Burger Seigneur',
    'The Flour Girl Cafe', 'Eleven Bakehouse', 'Madam Chocolate', 'Sandowitch',
    'Blr Brewing Co.', 'Blue Tokai', 'TAN Coffee', 'Zed The Baker', 'Qirfa',
    'Samosa Party', 'Melts- Cruncheese', 'Bawri', 'GoRally- Sports'
  ]
  
  const brandLogoData = allBrands.map(brand => ({
    brand,
    logoPath: getBrandLogo(brand),
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

  const uniqueLogos = logoDataWithSize

  // SS2/Lokazen nodes configuration - exact same as LokazenNodesLoader
  const nodes = [
    { id: 'center', x: 50, y: 50, delay: 0 },
    { id: 'top', x: 50, y: 30, delay: 0.2 },
    { id: 'bottom', x: 50, y: 70, delay: 0.4 },
    { id: 'left', x: 30, y: 50, delay: 0.6 },
    { id: 'right', x: 70, y: 50, delay: 0.8 },
  ]

  return (
    <div className={`relative ${aspectClasses[aspectRatio]} w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-lg ${className}`}>
      {/* Scrolling brand logos background - light opacity */}
      <div className="absolute inset-0 opacity-20">
        <div className="relative w-full h-full overflow-hidden">
          {/* Scrolling row */}
          <div className="absolute top-1/3 left-0 w-full">
            <div className="flex gap-6 md:gap-8 animate-[scrollReverse_30s_linear_infinite] w-max">
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
                    className={`relative flex-shrink-0 flex items-center justify-center ${
                      isLarge ? 'h-16 md:h-20' : 'h-12 md:h-16'
                    }`}
                  >
                    <img
                      src={logoPath}
                      alt=""
                      className={`relative h-full w-auto object-contain rounded-lg opacity-40 ${
                        isLarge 
                          ? 'max-w-[120px] md:max-w-[140px]' 
                          : 'max-w-[100px] md:max-w-[120px]'
                      }`}
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

          {/* Second scrolling row - opposite direction */}
          <div className="absolute bottom-1/3 left-0 w-full">
            <div className="flex gap-6 md:gap-8 animate-[scroll_35s_linear_infinite] w-max">
              {[
                ...uniqueLogos.slice().reverse(),
                ...uniqueLogos,
                ...uniqueLogos
              ].map((logoItem, idx) => {
                const logoPath = logoItem.logoPath as string
                
                return (
                  <div
                    key={`placeholder-logo-2-${idx}-${logoPath}`}
                    className="relative flex-shrink-0 flex items-center justify-center h-10 md:h-14"
                  >
                    <img
                      src={logoPath}
                      alt=""
                      className="relative h-full w-auto object-contain rounded-lg opacity-30 max-w-[90px] md:max-w-[110px]"
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

      {/* Center Lokazen SS2 nodes - exact same as LokazenNodesLoader */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <svg
          className="w-32 h-32 md:w-40 md:h-40"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Glow filter for pulsing nodes */}
            <filter id="placeholder-center-glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Radial gradient for nodes */}
            <radialGradient id="placeholder-center-node-gradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(255, 82, 0, 0.9)" />
              <stop offset="50%" stopColor="rgba(255, 82, 0, 0.6)" />
              <stop offset="100%" stopColor="rgba(255, 82, 0, 0.2)" />
            </radialGradient>
            
            {/* Radial gradient for rings */}
            <radialGradient id="placeholder-center-ring-gradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(255, 82, 0, 0.3)" />
              <stop offset="100%" stopColor="rgba(255, 82, 0, 0)" />
            </radialGradient>
          </defs>

          {/* Concentric rings */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="rgba(255, 82, 0, 0.15)"
            strokeWidth="0.5"
            opacity="0.6"
            style={{
              animation: 'pulseRing 3s ease-in-out infinite',
            }}
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255, 82, 0, 0.1)"
            strokeWidth="0.5"
            opacity="0.4"
            style={{
              animation: 'pulseRing 3.5s ease-in-out infinite',
              animationDelay: '0.5s',
            }}
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255, 82, 0, 0.08)"
            strokeWidth="0.5"
            opacity="0.3"
            style={{
              animation: 'pulseRing 4s ease-in-out infinite',
              animationDelay: '1s',
            }}
          />

          {/* SS2/Lokazen nodes */}
          {nodes.map((node) => (
            <g key={node.id} filter="url(#placeholder-center-glow)">
              {/* Outer glow ring */}
              <circle
                cx={node.x}
                cy={node.y}
                r="6"
                fill="rgba(255, 82, 0, 0.2)"
                opacity="0.6"
                style={{
                  animation: `pulseNode 2s ease-in-out infinite`,
                  animationDelay: `${node.delay}s`,
                }}
              />
              {/* Main node */}
              <circle
                cx={node.x}
                cy={node.y}
                r="3"
                fill="url(#placeholder-center-node-gradient)"
                style={{
                  animation: `pulseNodeMain 1.5s ease-in-out infinite`,
                  animationDelay: `${node.delay + 0.3}s`,
                }}
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
