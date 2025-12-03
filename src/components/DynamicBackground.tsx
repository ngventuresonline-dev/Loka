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

type Location = {
  name: string
  x: number
  y: number
  color: string
}

export default function DynamicBackground({ paletteOverride, backgroundOverride }: BackgroundProps = {}) {
  const [theme, setTheme] = useState({ palette: 'cosmic-purple', background: 'floating-orbs' })
  const [mounted, setMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Particle[]>([])
  const [trail, setTrail] = useState<Trail[]>([])
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)

  // Prime locations across major Indian cities - spread across margins
  const locations: Location[] = [
    // Bangalore - Left margin
    { name: 'Indiranagar, Bangalore', x: 8, y: 15, color: '#FF5200' },
    { name: 'Koramangala, Bangalore', x: 6, y: 35, color: '#E4002B' },
    { name: 'HSR Layout, Bangalore', x: 10, y: 55, color: '#FF6B35' },
    
    // Bangalore - Right margin
    { name: 'Whitefield, Bangalore', x: 92, y: 25, color: '#FF5200' },
    { name: 'Electronic City, Bangalore', x: 94, y: 45, color: '#E4002B' },
    
    // Delhi NCR - Left margin
    { name: 'Connaught Place, Delhi', x: 5, y: 75, color: '#FF6B35' },
    { name: 'Cyber City, Gurgaon', x: 8, y: 95, color: '#FF5200' },
    { name: 'Saket, Delhi', x: 7, y: 115, color: '#E4002B' },
    
    // Delhi NCR - Right margin
    { name: 'Nehru Place, Delhi', x: 93, y: 65, color: '#FF6B35' },
    { name: 'Noida Sector 18', x: 91, y: 85, color: '#FF5200' },
    
    // Mumbai - Left margin
    { name: 'Bandra, Mumbai', x: 6, y: 135, color: '#E4002B' },
    { name: 'Lower Parel, Mumbai', x: 9, y: 155, color: '#FF6B35' },
    { name: 'Andheri, Mumbai', x: 7, y: 175, color: '#FF5200' },
    
    // Mumbai - Right margin
    { name: 'BKC, Mumbai', x: 92, y: 105, color: '#E4002B' },
    { name: 'Powai, Mumbai', x: 94, y: 125, color: '#FF6B35' },
    
    // Other Cities - Left margin
    { name: 'Jubilee Hills, Hyderabad', x: 8, y: 195, color: '#FF5200' },
    { name: 'Koregaon Park, Pune', x: 6, y: 215, color: '#E4002B' },
    { name: 'Park Street, Kolkata', x: 9, y: 235, color: '#FF6B35' },
    
    // Other Cities - Right margin
    { name: 'T Nagar, Chennai', x: 93, y: 145, color: '#FF5200' },
    { name: 'Gachibowli, Hyderabad', x: 91, y: 165, color: '#E4002B' },
    { name: 'SG Highway, Ahmedabad', x: 94, y: 185, color: '#FF6B35' },
  ]

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

        {/* Location markers - visible in blank spaces */}
        {locations.map((location, index) => {
          // Calculate pixel position for hover detection
          const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1000
          const locY = (location.y / 100) * viewportHeight
          const locX = (location.x / 100) * (typeof window !== 'undefined' ? window.innerWidth : 1920)
          
          // Calculate distance from mouse (accounting for scroll)
          const dx = mousePosition.x - locX
          const dy = mousePosition.y - locY
          const distance = Math.sqrt(dx * dx + dy * dy)
          const isNear = distance < 250 // Larger detection radius
          
          return (
            <div
              key={index}
              className="absolute transition-all duration-300 pointer-events-auto cursor-pointer"
              style={{
                left: `${location.x}%`,
                top: `${location.y}vh`,
                transform: 'translate(-50%, -50%)',
                zIndex: 2
              }}
              onMouseEnter={() => setHoveredLocation(location.name)}
              onMouseLeave={() => setHoveredLocation(null)}
            >
              {/* Location dot - always visible */}
              <div 
                className="relative w-3 h-3 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: location.color,
                  boxShadow: isNear ? `0 0 20px ${location.color}, 0 0 10px ${location.color}` : `0 0 8px ${location.color}`,
                  opacity: isNear ? 0.7 : 0.05,
                  transform: isNear ? 'scale(2)' : 'scale(1)'
                }}
              >
                {/* Pulsing ring on hover */}
                {isNear && (
                  <div 
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{
                      backgroundColor: location.color,
                      opacity: 0.4
                    }}
                  ></div>
                )}
              </div>
              
              {/* Location label - shows on hover */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-full mt-3 whitespace-nowrap pointer-events-none transition-all duration-300"
                style={{
                  opacity: isNear || hoveredLocation === location.name ? 0.8 : 0,
                  transform: `translateY(${isNear || hoveredLocation === location.name ? '0' : '-10px'})`,
                  pointerEvents: 'none'
                }}
              >
                <div 
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-xl backdrop-blur-sm"
                  style={{
                    backgroundColor: location.color,
                    boxShadow: `0 8px 24px ${location.color}60`,
                    opacity: 0.8
                  }}
                >
                  {location.name}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }  // Add other background types here in the future
  return null
}
