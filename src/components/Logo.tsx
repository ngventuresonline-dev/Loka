'use client'

import Link from 'next/link'
import LokaNodesMark from '@/components/LokaNodesMark'

interface LogoProps {
  showText?: boolean
  showPoweredBy?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  href?: string
  variant?: 'light' | 'dark' // For background-aware text colors
}

export default function Logo({ showText = true, showPoweredBy = true, size = 'md', className = '', href = '/', variant = 'light' }: LogoProps) {
  const markFrame = {
    sm: 'w-10 h-10 sm:w-12 sm:h-12',
    md: 'w-12 h-12 sm:w-14 sm:h-14',
    lg: 'w-16 h-16 sm:w-20 sm:h-20',
  }[size]

  const oFrame = {
    sm: 'w-[1.1rem] h-[1.1rem] sm:w-[1.2rem] sm:h-[1.2rem]',
    md: 'w-[1.25rem] h-[1.25rem] sm:w-[1.4rem] sm:h-[1.4rem]',
    lg: 'w-8 h-8 sm:w-9 sm:h-9',
  }[size]

  const textSizes = {
    sm: { main: 'text-sm sm:text-sm', domain: 'text-[10px] sm:text-[10px]' },
    md: { main: 'text-base sm:text-lg md:text-xl lg:text-2xl', domain: 'text-xs sm:text-xs' },
    lg: { main: 'text-2xl sm:text-3xl md:text-4xl', domain: 'text-sm sm:text-sm' },
  }

  const textSize = textSizes[size]
  const markVariant = variant === 'dark' ? 'dark' : 'light'
  const textColor = variant === 'dark' ? 'text-white' : 'text-gray-900'
  const domainColor = variant === 'dark' ? 'text-gray-300' : 'text-gray-600'

  const LogoContent = () => (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <div className={`relative ${markFrame} flex-shrink-0`}>
        <LokaNodesMark className="block h-full w-full" size={100} variant={markVariant} />
      </div>

      {showText && (
        <div className="min-w-0 flex flex-col">
          <h1 className={`${textSize.main} font-black ${textColor} flex items-center leading-tight`}>
            <span className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">L</span>
            <span
              className="relative inline-flex items-center justify-center"
              style={{ width: '0.85em', height: '1em', marginLeft: '0.04em', marginRight: '0.04em' }}
            >
              <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${oFrame}`}>
                <LokaNodesMark className="h-full w-full" size={100} variant={markVariant} />
              </span>
            </span>
            <span className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">ka</span>
            <span className={textColor}>zen</span>
          </h1>
          {showPoweredBy && (
            <div className={`${textSize.domain} ${domainColor} leading-tight font-medium`}>
              Powered By Ai
            </div>
          )}
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
