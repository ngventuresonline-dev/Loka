'use client'

import Link from 'next/link'

interface LogoProps {
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  href?: string
  variant?: 'light' | 'dark' // For background-aware text colors
}

export default function Logo({ showText = true, size = 'md', className = '', href = '/', variant = 'light' }: LogoProps) {
  // Mobile-optimized sizes with responsive breakpoints
  const sizeClasses = {
    sm: { 
      container: 'w-10 h-10 sm:w-12 sm:h-12', 
      orb: 'w-1.5 h-1.5 sm:w-2 sm:h-2', 
      centerOrb: 'w-2.5 h-2.5 sm:w-3 sm:h-3', 
      path: 'w-8 h-8 sm:w-10 sm:h-10', 
      path2: 'w-12 h-12 sm:w-14 sm:h-14' 
    },
    md: { 
      container: 'w-12 h-12 sm:w-14 sm:h-14', 
      orb: 'w-2 h-2 sm:w-2.5 sm:h-2.5', 
      centerOrb: 'w-3 h-3 sm:w-3.5 sm:h-3.5', 
      path: 'w-10 h-10 sm:w-12 sm:h-12', 
      path2: 'w-14 h-14 sm:w-16 sm:h-16' 
    },
    lg: { 
      container: 'w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20', 
      orb: 'w-2.5 h-2.5 sm:w-3 sm:h-3', 
      centerOrb: 'w-3.5 h-3.5 sm:w-4 sm:h-4', 
      path: 'w-12 h-12 sm:w-14 sm:h-14', 
      path2: 'w-16 h-16 sm:w-18 sm:h-18' 
    }
  }

  // Mobile-optimized text sizes - Larger on mobile
  const textSizes = {
    sm: { main: 'text-sm sm:text-sm', domain: 'text-[10px] sm:text-[10px]' },
    md: { main: 'text-base sm:text-lg md:text-xl lg:text-2xl', domain: 'text-xs sm:text-xs' },
    lg: { main: 'text-2xl sm:text-3xl md:text-4xl', domain: 'text-sm sm:text-sm' }
  }

  const sizes = sizeClasses[size]
  const textSize = textSizes[size]
  
  // Text colors based on background variant
  const textColor = variant === 'dark' ? 'text-white' : 'text-gray-900'
  const domainColor = variant === 'dark' ? 'text-gray-300' : 'text-gray-600'

  const LogoContent = () => (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {/* Quantum Nodes Logo - Style 17 - Mobile optimized */}
      <div className={`relative ${sizes.container} flex-shrink-0`} style={{ willChange: 'transform' }}>
        {/* Quantum Orbs - Reduced animation on mobile for performance */}
        <div 
          className={`absolute ${sizes.orb} bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full shadow-sm sm:shadow-md shadow-[#FF5200]/30 sm:shadow-[#FF5200]/40`}
          style={{ 
            top: '20%', 
            left: '50%', 
            transform: 'translateX(-50%) translateZ(0)',
            willChange: 'transform',
            // Reduced motion on mobile, full animation on desktop
            animation: 'quantumFloat 4s ease-in-out infinite',
            animationDelay: '0s'
          }}
        />
        <div 
          className={`absolute ${sizes.orb} bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full shadow-sm sm:shadow-md shadow-[#FF5200]/30 sm:shadow-[#FF5200]/40`}
          style={{ 
            top: '50%', 
            right: '20%', 
            transform: 'translateY(-50%) translateZ(0)',
            willChange: 'transform',
            animation: 'quantumFloat 4s ease-in-out infinite',
            animationDelay: '0.5s'
          }}
        />
        <div 
          className={`absolute ${sizes.orb} bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full shadow-sm sm:shadow-md shadow-[#FF5200]/30 sm:shadow-[#FF5200]/40`}
          style={{ 
            bottom: '20%', 
            left: '50%', 
            transform: 'translateX(-50%) translateZ(0)',
            willChange: 'transform',
            animation: 'quantumFloat 4s ease-in-out infinite',
            animationDelay: '1s'
          }}
        />
        <div 
          className={`absolute ${sizes.orb} bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full shadow-sm sm:shadow-md shadow-[#FF5200]/30 sm:shadow-[#FF5200]/40`}
          style={{ 
            top: '50%', 
            left: '20%', 
            transform: 'translateY(-50%) translateZ(0)',
            willChange: 'transform',
            animation: 'quantumFloat 4s ease-in-out infinite',
            animationDelay: '1.5s'
          }}
        />
        {/* Center Orb */}
        <div 
          className={`absolute ${sizes.centerOrb} bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full shadow-sm sm:shadow-md shadow-[#FF5200]/50 sm:shadow-[#FF5200]/60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
        />
        {/* Quantum Paths - Lighter on mobile */}
        <div 
          className={`absolute border border-[#FF5200]/15 sm:border-[#FF5200]/25 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${sizes.path}`}
        />
        <div 
          className={`absolute border border-[#FF5200]/10 sm:border-[#FF5200]/15 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${sizes.path2}`}
        />
      </div>

      {/* Text with "Loka" accent and quantum node "O" - Hidden on very small screens if needed */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <h1 className={`${textSize.main} font-black ${textColor} leading-tight flex items-center`}>
            <span className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">L</span>
            {/* Quantum Node as "O" - Single animated node */}
            <span className="relative inline-flex items-center justify-center" style={{ width: '0.7em', height: '1em', marginLeft: '0.05em', marginRight: '0.05em' }}>
              <div 
                className={`absolute ${size === 'sm' ? 'w-2.5 h-2.5 sm:w-3 sm:h-3' : size === 'md' ? 'w-3 h-3 sm:w-3.5 sm:h-3.5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full shadow-sm sm:shadow-md shadow-[#FF5200]/40 top-1/2 left-1/2`}
                style={{ 
                  animation: 'quantumFloatO 3s ease-in-out infinite',
                  animationDelay: '0s',
                  willChange: 'transform'
                }}
              />
            </span>
            <span className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">ka</span>
            <span className={textColor}>zen</span>
          </h1>
          <div className={`${textSize.domain} ${domainColor} font-medium leading-tight`}>
            Powered By Ai
          </div>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="group touch-manipulation" style={{ WebkitTapHighlightColor: 'transparent' }}>
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}

