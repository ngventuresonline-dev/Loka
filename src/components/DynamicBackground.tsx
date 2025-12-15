'use client'

import { useEffect, useState } from 'react'
import { getTheme, getPaletteColors } from '@/lib/theme'

type BackgroundProps = {
  paletteOverride?: string
  backgroundOverride?: string
}

type Particle = {
  x: number
  y: number
  baseX: number
  baseY: number
  color: string
  id: number
  size: number
}

type Trail = {
  x: number
  y: number
  color: string
  id: number
  opacity: number
}


export default function DynamicBackground({ paletteOverride, backgroundOverride }: BackgroundProps = {}) {
  const [theme, setTheme] = useState({ palette: 'cosmic-purple', background: 'floating-orbs' })
  const [mounted, setMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Particle[]>([])
  const [trail, setTrail] = useState<Trail[]>([])
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setMounted(true)
    const currentTheme = getTheme()
    setTheme(currentTheme)

    const colors = ['#FF5200', '#E4002B', '#FF6B35']
    
    // Create static particles spread across the screen
    const initialParticles: Particle[] = []
    for (let i = 0; i < 80; i++) {
      const baseX = Math.random() * window.innerWidth
      const baseY = Math.random() * (window.innerHeight * 3) // Spread across full page height
      initialParticles.push({
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        color: colors[Math.floor(Math.random() * colors.length)],
        id: i,
        size: Math.random() * 1.5 + 0.5 // Random size between 0.5px and 2px
      })
    }
    setParticles(initialParticles)

    let trailId = 0
    let lastTrailTime = 0

    // Track mouse movement and create trail
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      
      // Create trail dots every 50ms
      const now = Date.now()
      if (now - lastTrailTime > 50) {
        const color = colors[Math.floor(Math.random() * colors.length)]
        setTrail(prev => {
          const newTrail = [...prev, {
            x: e.clientX,
            y: e.clientY,
            color,
            id: trailId++,
            opacity: 0.4
          }]
          // Keep only last 20 trail dots
          return newTrail.slice(-20)
        })
        lastTrailTime = now
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    
    // Track scroll position
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll)
    
    // Fade out trail dots
    const trailInterval = setInterval(() => {
      setTrail(prev => prev.slice(1))
    }, 150)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      clearInterval(trailInterval)
    }
  }, [])

  const paletteId = paletteOverride || theme.palette
  const backgroundId = backgroundOverride || theme.background
  const colors = getPaletteColors(paletteId)

  if (!mounted) {
    return null
  }

  // Floating Orbs Background
  if (backgroundId === 'floating-orbs') {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ height: '100%', pointerEvents: 'none' }}>
        {/* Subtle gradient background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30"></div>
        </div>

        {/* Static star particles that move when mouse is near */}
        {particles.map((particle) => {
          const dx = mousePosition.x - particle.baseX
          const dy = mousePosition.y - particle.baseY + window.scrollY
          const distance = Math.sqrt(dx * dx + dy * dy)
          const maxDistance = 120
          
          // Move particle away from cursor if within range
          const force = Math.max(0, (maxDistance - distance) / maxDistance)
          const offsetX = force * dx * 0.4
          const offsetY = force * dy * 0.4

          return (
            <div
              key={particle.id}
              className="absolute rounded-full animate-[twinkle_3s_ease-in-out_infinite]"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: particle.baseX,
                top: particle.baseY,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
                opacity: 0.3,
                transform: `translate(${-offsetX}px, ${-offsetY}px)`,
                transition: 'transform 0.3s ease-out',
                zIndex: 0
              }}
            ></div>
          )
        })}

        {/* Mouse trail dots */}
        {trail.map((dot, index) => (
          <div
            key={dot.id}
            className="absolute rounded-full"
            style={{
              width: '2px',
              height: '2px',
              left: dot.x,
              top: dot.y + window.scrollY,
              backgroundColor: dot.color,
              boxShadow: `0 0 8px ${dot.color}`,
              opacity: (index / trail.length) * 0.5,
              transform: 'translate(-50%, -50%)',
              transition: 'opacity 0.3s ease-out',
              zIndex: 1
            }}
          ></div>
        ))}

      </div>
    )
  }  // Add other background types here in the future
  return null
}
