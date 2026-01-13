'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoVariant, VIDEO_VARIANTS } from './variants'

interface ExplainerVideoProps {
  variant?: keyof typeof VIDEO_VARIANTS | VideoVariant
  autoPlay?: boolean
  onComplete?: () => void
  className?: string
}

export default function ExplainerVideo({ 
  variant = 'complete-flow',
  autoPlay = true, 
  onComplete,
  className = ''
}: ExplainerVideoProps) {
  const [currentScene, setCurrentScene] = useState<number>(1)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  
  const variantConfig = typeof variant === 'string' 
    ? VIDEO_VARIANTS[variant] 
    : variant

  if (!variantConfig) {
    console.warn(`Variant ${variant} not found, using default`)
    return null
  }

  const { scenes, totalDuration } = variantConfig

  useEffect(() => {
    if (!isPlaying) return

    const sceneTimes = scenes.map((_, index) => 
      scenes.slice(0, index).reduce((sum, s) => sum + s.duration, 0)
    )

    let elapsed = 0
    const interval = setInterval(() => {
      elapsed += 0.05
      
      for (let i = sceneTimes.length - 1; i >= 0; i--) {
        if (elapsed >= sceneTimes[i]) {
          setCurrentScene(i + 1)
          break
        }
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval)
        if (onComplete) onComplete()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [isPlaying, onComplete, scenes, totalDuration])

  const CurrentSceneComponent = scenes[currentScene - 1]?.component

  return (
    <div className={`relative w-full bg-gray-900 overflow-hidden ${className}`} style={{ 
      height: 'min(600px, 100vh)',
      minHeight: '400px'
    }}>
      <AnimatePresence mode="wait">
        {CurrentSceneComponent && (
          <CurrentSceneComponent key={`scene-${currentScene}`} />
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-gray-800/90 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-700">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  )
}

// Export variants for external use
export { VIDEO_VARIANTS, type VideoVariant }
export type { ExplainerVideoProps }
