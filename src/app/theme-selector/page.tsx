'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getTheme, setTheme, type ThemeConfig } from '@/lib/theme'

type ColorPalette = {
  id: string
  name: string
  description: string
  colors: {
    bg: string
    primary: string
    secondary: string
    accent: string
    text: string
  }
  gradient: string
}

type BackgroundDesign = {
  id: string
  name: string
  description: string
  preview: string
}

const colorPalettes: ColorPalette[] = [
  {
    id: 'cosmic-purple',
    name: 'Cosmic Purple & Cyan',
    description: 'Current: Sophisticated deep space vibes with violet and cyan',
    colors: {
      bg: 'from-[#0a0e27] via-[#1a0b2e] to-[#16003b]',
      primary: 'from-violet-600 to-fuchsia-600',
      secondary: 'from-cyan-600 to-blue-600',
      accent: 'from-fuchsia-600 to-violet-600',
      text: 'text-violet-200'
    },
    gradient: 'bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-600'
  },
  {
    id: 'sunset-blaze',
    name: 'Sunset Blaze',
    description: 'Vibrant orange, pink, and purple sunset energy',
    colors: {
      bg: 'from-[#1a0b1a] via-[#2d1b3d] to-[#4a1942]',
      primary: 'from-orange-500 to-pink-600',
      secondary: 'from-pink-600 to-purple-600',
      accent: 'from-amber-500 to-rose-600',
      text: 'text-orange-200'
    },
    gradient: 'bg-gradient-to-br from-orange-500 via-pink-600 to-purple-700'
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Fresh aqua, turquoise, and deep blue oceanic feel',
    colors: {
      bg: 'from-[#001a33] via-[#002d4d] to-[#003d5c]',
      primary: 'from-cyan-400 to-teal-600',
      secondary: 'from-blue-500 to-cyan-600',
      accent: 'from-teal-400 to-emerald-600',
      text: 'text-cyan-200'
    },
    gradient: 'bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600'
  },
  {
    id: 'neon-city',
    name: 'Neon City',
    description: 'Electric magenta, lime, and cyan cyberpunk aesthetic',
    colors: {
      bg: 'from-[#0d0221] via-[#1a0b33] to-[#0d0221]',
      primary: 'from-fuchsia-500 to-pink-600',
      secondary: 'from-lime-400 to-green-600',
      accent: 'from-cyan-400 to-blue-600',
      text: 'text-fuchsia-200'
    },
    gradient: 'bg-gradient-to-br from-fuchsia-500 via-cyan-400 to-lime-400'
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    description: 'Luxurious gold, amber, and deep purple royalty',
    colors: {
      bg: 'from-[#1a0f2e] via-[#2d1b4e] to-[#1a0f2e]',
      primary: 'from-amber-400 to-yellow-600',
      secondary: 'from-purple-600 to-indigo-700',
      accent: 'from-yellow-500 to-orange-600',
      text: 'text-amber-200'
    },
    gradient: 'bg-gradient-to-br from-amber-400 via-purple-600 to-indigo-700'
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest',
    description: 'Rich emerald, jade, and teal natural elegance',
    colors: {
      bg: 'from-[#0a1f1a] via-[#0d2b26] to-[#0a3832]',
      primary: 'from-emerald-500 to-green-600',
      secondary: 'from-teal-500 to-cyan-600',
      accent: 'from-lime-500 to-emerald-600',
      text: 'text-emerald-200'
    },
    gradient: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600'
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    description: 'Soft pink, rose, and lavender spring vibes',
    colors: {
      bg: 'from-[#2d1525] via-[#3d1f35] to-[#4a1942]',
      primary: 'from-pink-400 to-rose-600',
      secondary: 'from-rose-500 to-purple-600',
      accent: 'from-fuchsia-400 to-pink-600',
      text: 'text-pink-200'
    },
    gradient: 'bg-gradient-to-br from-pink-400 via-rose-500 to-purple-600'
  },
  {
    id: 'arctic-aurora',
    name: 'Arctic Aurora',
    description: 'Cool ice blue, mint, and turquoise northern lights',
    colors: {
      bg: 'from-[#0a1a2e] via-[#112d4e] to-[#0f3460]',
      primary: 'from-blue-400 to-cyan-500',
      secondary: 'from-cyan-400 to-teal-500',
      accent: 'from-sky-400 to-blue-600',
      text: 'text-blue-200'
    },
    gradient: 'bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-500'
  },
  {
    id: 'lava-flow',
    name: 'Lava Flow',
    description: 'Hot red, orange, and yellow volcanic energy',
    colors: {
      bg: 'from-[#1a0606] via-[#330a0a] to-[#4a0e0e]',
      primary: 'from-red-500 to-orange-600',
      secondary: 'from-orange-500 to-yellow-600',
      accent: 'from-rose-600 to-red-700',
      text: 'text-orange-200'
    },
    gradient: 'bg-gradient-to-br from-red-500 via-orange-600 to-yellow-500'
  }
]

const backgroundDesigns: BackgroundDesign[] = [
  {
    id: 'floating-orbs',
    name: 'Floating Orbs',
    description: 'Current: Elegant glass morphism orbs with soft gradients',
    preview: 'orbs'
  },
  {
    id: 'geometric-mesh',
    name: 'Geometric Mesh',
    description: 'Abstract geometric shapes with gradient mesh overlay',
    preview: 'geometric'
  },
  {
    id: 'wave-motion',
    name: 'Wave Motion',
    description: 'Animated waves flowing across the screen',
    preview: 'waves'
  },
  {
    id: 'particle-field',
    name: 'Particle Field',
    description: 'Dense particle field with connection lines',
    preview: 'particles'
  },
  {
    id: 'aurora-lights',
    name: 'Aurora Lights',
    description: 'Flowing aurora borealis effect with light streaks',
    preview: 'aurora'
  },
  {
    id: 'grid-matrix',
    name: 'Grid Matrix',
    description: 'Futuristic grid with glowing intersections',
    preview: 'grid'
  },
  {
    id: 'liquid-morphism',
    name: 'Liquid Morphism',
    description: 'Smooth liquid blobs morphing and flowing',
    preview: 'liquid'
  },
  {
    id: 'constellation',
    name: 'Constellation',
    description: 'Star field with connecting constellation lines',
    preview: 'constellation'
  }
]

export default function ThemeSelector() {
  const router = useRouter()
  const [selectedPalette, setSelectedPalette] = useState('cosmic-purple')
  const [selectedBackground, setSelectedBackground] = useState('floating-orbs')
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    const currentTheme = getTheme()
    setSelectedPalette(currentTheme.palette)
    setSelectedBackground(currentTheme.background)
  }, [])

  const handleApplyTheme = () => {
    setIsApplying(true)
    const newTheme: ThemeConfig = {
      palette: selectedPalette,
      background: selectedBackground
    }
    setTheme(newTheme)
    
    // Show success message
    setTimeout(() => {
      setIsApplying(false)
      // Redirect to home to see the changes
      router.push('/')
    }, 1000)
  }

  const handlePreview = () => {
    // Store temporary preview theme
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('preview-theme', JSON.stringify({
        palette: selectedPalette,
        background: selectedBackground
      }))
    }
    router.push('/?preview=true')
  }

  const currentPalette = colorPalettes.find(p => p.id === selectedPalette) || colorPalettes[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a0b2e] to-[#16003b] text-white">
      {/* Header */}
      <div className="relative z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Theme Customizer
              </h1>
              <p className="text-white/60 mt-1">Choose your perfect color palette and background design</p>
            </div>
            <Link 
              href="/"
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-full font-semibold transition-all duration-300 hover:scale-105"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Color Palettes Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-3">Color Palettes</h2>
            <p className="text-white/70 text-lg">Choose from vibrant, eye-catching color combinations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {colorPalettes.map((palette) => (
              <div
                key={palette.id}
                onClick={() => setSelectedPalette(palette.id)}
                className={`group cursor-pointer relative bg-white/5 backdrop-blur-xl border-2 rounded-3xl p-6 transition-all duration-500 hover:scale-105 ${
                  selectedPalette === palette.id 
                    ? 'border-violet-500 shadow-2xl shadow-violet-500/30' 
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                {selectedPalette === palette.id && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    Selected
                  </div>
                )}
                
                {/* Gradient Preview */}
                <div className={`w-full h-32 ${palette.gradient} rounded-2xl mb-4 shadow-lg relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all duration-300"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                    <div className={`w-8 h-8 bg-gradient-to-br ${palette.colors.primary} rounded-lg shadow-lg`}></div>
                    <div className={`w-8 h-8 bg-gradient-to-br ${palette.colors.secondary} rounded-lg shadow-lg`}></div>
                    <div className={`w-8 h-8 bg-gradient-to-br ${palette.colors.accent} rounded-lg shadow-lg`}></div>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-2">{palette.name}</h3>
                <p className="text-white/60 text-sm">{palette.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Background Designs Section */}
        <section>
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-3">Background Designs</h2>
            <p className="text-white/70 text-lg">Select a background animation style</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {backgroundDesigns.map((design) => (
              <div
                key={design.id}
                onClick={() => setSelectedBackground(design.id)}
                className={`group cursor-pointer relative bg-white/5 backdrop-blur-xl border-2 rounded-3xl p-6 transition-all duration-500 hover:scale-105 ${
                  selectedBackground === design.id 
                    ? 'border-cyan-500 shadow-2xl shadow-cyan-500/30' 
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                {selectedBackground === design.id && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    Selected
                  </div>
                )}

                {/* Design Preview */}
                <div className="w-full h-40 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl mb-4 relative overflow-hidden border border-white/10">
                  {design.preview === 'orbs' && (
                    <>
                      <div className="absolute top-4 left-4 w-16 h-16 bg-violet-500/40 rounded-full blur-xl animate-pulse"></div>
                      <div className="absolute bottom-4 right-4 w-20 h-20 bg-cyan-500/40 rounded-full blur-xl animate-pulse delay-1000"></div>
                    </>
                  )}
                  {design.preview === 'geometric' && (
                    <>
                      <div className="absolute top-6 left-6 w-12 h-12 border-2 border-violet-400/50 rotate-45"></div>
                      <div className="absolute bottom-6 right-6 w-16 h-16 border-2 border-cyan-400/50 rotate-12 rounded-lg"></div>
                    </>
                  )}
                  {design.preview === 'waves' && (
                    <div className="absolute inset-0">
                      <div className="absolute w-full h-8 bg-gradient-to-r from-violet-500/40 to-cyan-500/40 blur-sm animate-[wave_3s_ease-in-out_infinite]"></div>
                      <div className="absolute w-full h-8 top-12 bg-gradient-to-r from-cyan-500/40 to-fuchsia-500/40 blur-sm animate-[wave_3s_ease-in-out_infinite_1s]"></div>
                    </div>
                  )}
                  {design.preview === 'particles' && (
                    <>
                      {[...Array(15)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-violet-400 rounded-full animate-pulse"
                          style={{
                            left: `${(i * 23) % 90}%`,
                            top: `${(i * 31) % 90}%`,
                            animationDelay: `${i * 0.2}s`
                          }}
                        ></div>
                      ))}
                    </>
                  )}
                  {design.preview === 'aurora' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-500/30 blur-2xl"></div>
                  )}
                  {design.preview === 'grid' && (
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf6_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf6_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-30"></div>
                  )}
                  {design.preview === 'liquid' && (
                    <>
                      <div className="absolute top-8 left-8 w-20 h-16 bg-violet-500/40 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-lg animate-[morph_8s_ease-in-out_infinite]"></div>
                      <div className="absolute bottom-8 right-8 w-16 h-20 bg-cyan-500/40 rounded-[30%_60%_70%_40%/50%_60%_30%_60%] blur-lg animate-[morph_8s_ease-in-out_infinite_2s]"></div>
                    </>
                  )}
                  {design.preview === 'constellation' && (
                    <>
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1.5 h-1.5 bg-white rounded-full"
                          style={{
                            left: `${(i * 27) % 85}%`,
                            top: `${(i * 19) % 85}%`,
                          }}
                        ></div>
                      ))}
                      <svg className="absolute inset-0 w-full h-full opacity-30">
                        <line x1="20%" y1="20%" x2="60%" y2="40%" stroke="white" strokeWidth="1" />
                        <line x1="60%" y1="40%" x2="80%" y2="70%" stroke="white" strokeWidth="1" />
                      </svg>
                    </>
                  )}
                </div>

                <h3 className="text-lg font-bold mb-2">{design.name}</h3>
                <p className="text-white/60 text-sm">{design.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Apply Button */}
        <div className="mt-16 text-center">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Apply?</h3>
            <p className="text-white/70 mb-6">
              You&apos;ve selected <span className="text-violet-400 font-semibold">{currentPalette.name}</span> with{' '}
              <span className="text-cyan-400 font-semibold">
                {backgroundDesigns.find(d => d.id === selectedBackground)?.name}
              </span> background
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={handleApplyTheme}
                disabled={isApplying}
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-xl shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplying ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </span>
                ) : (
                  'Apply Theme'
                )}
              </button>
              <button 
                onClick={handlePreview}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300"
              >
                Preview First
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
