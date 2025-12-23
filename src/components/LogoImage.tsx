'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface LogoImageProps {
  src: string
  alt: string
  brandName: string
  className?: string
  style?: React.CSSProperties
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
  shouldRemoveBg?: boolean
  hasBlackBackground?: boolean
}

/**
 * Robust Logo Image Component with Fallbacks and Retry Logic
 * Ensures logos NEVER disappear - always shows something
 */
export default function LogoImage({
  src,
  alt,
  brandName,
  className = '',
  style = {},
  loading = 'lazy',
  fetchPriority = 'auto',
  shouldRemoveBg = false,
  hasBlackBackground = false,
}: LogoImageProps) {
  const [imageError, setImageError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const imgRef = useRef<HTMLImageElement>(null)
  const maxRetries = 3

  // Get brand initial for fallback
  const getInitial = (name: string) => {
    if (!name) return '?'
    const words = name.trim().split(/\s+/)
    if (words.length > 1) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  // Retry loading on error
  useEffect(() => {
    if (imageError && retryCount < maxRetries && imgRef.current) {
      const timer = setTimeout(() => {
        setImageError(false)
        setRetryCount(prev => prev + 1)
        // Force reload by adding timestamp
        if (imgRef.current) {
          const newSrc = src.includes('?') 
            ? src.split('?')[0] + `?retry=${retryCount + 1}&t=${Date.now()}`
            : src + `?retry=${retryCount + 1}&t=${Date.now()}`
          imgRef.current.src = newSrc
        }
      }, 1000 * (retryCount + 1)) // Exponential backoff

      return () => clearTimeout(timer)
    }
  }, [imageError, retryCount, src])

  // Preload image
  useEffect(() => {
    if (src && !imageError) {
      const img = new window.Image()
      img.onload = () => setIsLoading(false)
      img.onerror = () => {
        setIsLoading(false)
        if (retryCount < maxRetries) {
          setImageError(true)
        }
      }
      img.src = src
    }
  }, [src, imageError, retryCount])

  // If image failed after all retries, show fallback
  if (imageError && retryCount >= maxRetries) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl ${className}`}
        style={{ ...style, minHeight: style.height || '64px' }}
      >
        <span className="text-gray-600 font-bold text-lg">
          {getInitial(brandName)}
        </span>
      </div>
    )
  }

  // Use Next.js Image for better optimization, but fallback to regular img if needed
  return (
    <div 
      className="relative w-full h-full flex items-center justify-center" 
      style={{
        ...style,
        willChange: 'auto',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl animate-pulse">
          <span className="text-gray-400 text-xs">{getInitial(brandName)}</span>
        </div>
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        className={`relative h-full w-auto object-contain rounded-2xl max-w-[120px] sm:max-w-[150px] md:max-w-[180px] transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${
          shouldRemoveBg 
            ? hasBlackBackground 
              ? 'logo-no-bg-black' 
              : 'logo-no-bg'
            : ''
        } ${className}`}
        style={{ 
          height: style.height || '64px', 
          minHeight: style.minHeight || '64px',
          maxWidth: '100%',
          willChange: 'auto',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          ...style 
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          setIsLoading(false)
          if (retryCount < maxRetries) {
            setImageError(true)
          } else {
            // After max retries, show fallback
            target.style.display = 'none'
          }
        }}
        onLoad={(e) => {
          setIsLoading(false)
          const target = e.target as HTMLImageElement
          target.style.opacity = '1'
          target.style.visibility = 'visible'
        }}
      />
    </div>
  )
}

