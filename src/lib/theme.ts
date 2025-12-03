export type ThemeConfig = {
  palette: string
  background: string
}

export const colorPalettes = {
  'cosmic-purple': {
    bg: 'from-[#0a0e27] via-[#1a0b2e] to-[#16003b]',
    primary: 'from-violet-600 to-fuchsia-600',
    secondary: 'from-cyan-600 to-blue-600',
    accent: 'from-fuchsia-600 to-violet-600',
    text: 'text-violet-200',
    particlePrimary: 'bg-violet-400',
    particleSecondary: 'bg-cyan-400',
    glowPrimary: 'bg-violet-500/10',
    glowSecondary: 'bg-cyan-500/10',
    glowTertiary: 'bg-fuchsia-500/10',
    gradientText: 'from-violet-400 via-fuchsia-400 to-cyan-400',
    border: 'border-violet-500/20',
    borderHover: 'hover:border-violet-400/50',
    shadow: 'shadow-violet-500/50',
  },
  'sunset-blaze': {
    bg: 'from-[#1a0b1a] via-[#2d1b3d] to-[#4a1942]',
    primary: 'from-orange-500 to-pink-600',
    secondary: 'from-pink-600 to-purple-600',
    accent: 'from-amber-500 to-rose-600',
    text: 'text-orange-200',
    particlePrimary: 'bg-orange-400',
    particleSecondary: 'bg-pink-400',
    glowPrimary: 'bg-orange-500/10',
    glowSecondary: 'bg-pink-500/10',
    glowTertiary: 'bg-purple-500/10',
    gradientText: 'from-orange-400 via-pink-400 to-purple-400',
    border: 'border-orange-500/20',
    borderHover: 'hover:border-orange-400/50',
    shadow: 'shadow-orange-500/50',
  },
  'ocean-breeze': {
    bg: 'from-[#001a33] via-[#002d4d] to-[#003d5c]',
    primary: 'from-cyan-400 to-teal-600',
    secondary: 'from-blue-500 to-cyan-600',
    accent: 'from-teal-400 to-emerald-600',
    text: 'text-cyan-200',
    particlePrimary: 'bg-cyan-400',
    particleSecondary: 'bg-teal-400',
    glowPrimary: 'bg-cyan-500/10',
    glowSecondary: 'bg-teal-500/10',
    glowTertiary: 'bg-blue-500/10',
    gradientText: 'from-cyan-400 via-teal-400 to-blue-400',
    border: 'border-cyan-500/20',
    borderHover: 'hover:border-cyan-400/50',
    shadow: 'shadow-cyan-500/50',
  },
  'neon-city': {
    bg: 'from-[#0d0221] via-[#1a0b33] to-[#0d0221]',
    primary: 'from-fuchsia-500 to-pink-600',
    secondary: 'from-lime-400 to-green-600',
    accent: 'from-cyan-400 to-blue-600',
    text: 'text-fuchsia-200',
    particlePrimary: 'bg-fuchsia-400',
    particleSecondary: 'bg-lime-400',
    glowPrimary: 'bg-fuchsia-500/10',
    glowSecondary: 'bg-lime-500/10',
    glowTertiary: 'bg-cyan-500/10',
    gradientText: 'from-fuchsia-400 via-lime-400 to-cyan-400',
    border: 'border-fuchsia-500/20',
    borderHover: 'hover:border-fuchsia-400/50',
    shadow: 'shadow-fuchsia-500/50',
  },
  'royal-gold': {
    bg: 'from-[#1a0f2e] via-[#2d1b4e] to-[#1a0f2e]',
    primary: 'from-amber-400 to-yellow-600',
    secondary: 'from-purple-600 to-indigo-700',
    accent: 'from-yellow-500 to-orange-600',
    text: 'text-amber-200',
    particlePrimary: 'bg-amber-400',
    particleSecondary: 'bg-purple-400',
    glowPrimary: 'bg-amber-500/10',
    glowSecondary: 'bg-purple-500/10',
    glowTertiary: 'bg-indigo-500/10',
    gradientText: 'from-amber-400 via-yellow-400 to-purple-400',
    border: 'border-amber-500/20',
    borderHover: 'hover:border-amber-400/50',
    shadow: 'shadow-amber-500/50',
  },
  'emerald-forest': {
    bg: 'from-[#0a1f1a] via-[#0d2b26] to-[#0a3832]',
    primary: 'from-emerald-500 to-green-600',
    secondary: 'from-teal-500 to-cyan-600',
    accent: 'from-lime-500 to-emerald-600',
    text: 'text-emerald-200',
    particlePrimary: 'bg-emerald-400',
    particleSecondary: 'bg-teal-400',
    glowPrimary: 'bg-emerald-500/10',
    glowSecondary: 'bg-teal-500/10',
    glowTertiary: 'bg-green-500/10',
    gradientText: 'from-emerald-400 via-teal-400 to-cyan-400',
    border: 'border-emerald-500/20',
    borderHover: 'hover:border-emerald-400/50',
    shadow: 'shadow-emerald-500/50',
  },
  'cherry-blossom': {
    bg: 'from-[#2d1525] via-[#3d1f35] to-[#4a1942]',
    primary: 'from-pink-400 to-rose-600',
    secondary: 'from-rose-500 to-purple-600',
    accent: 'from-fuchsia-400 to-pink-600',
    text: 'text-pink-200',
    particlePrimary: 'bg-pink-400',
    particleSecondary: 'bg-rose-400',
    glowPrimary: 'bg-pink-500/10',
    glowSecondary: 'bg-rose-500/10',
    glowTertiary: 'bg-purple-500/10',
    gradientText: 'from-pink-400 via-rose-400 to-purple-400',
    border: 'border-pink-500/20',
    borderHover: 'hover:border-pink-400/50',
    shadow: 'shadow-pink-500/50',
  },
  'arctic-aurora': {
    bg: 'from-[#0a1a2e] via-[#112d4e] to-[#0f3460]',
    primary: 'from-blue-400 to-cyan-500',
    secondary: 'from-cyan-400 to-teal-500',
    accent: 'from-sky-400 to-blue-600',
    text: 'text-blue-200',
    particlePrimary: 'bg-blue-400',
    particleSecondary: 'bg-cyan-400',
    glowPrimary: 'bg-blue-500/10',
    glowSecondary: 'bg-cyan-500/10',
    glowTertiary: 'bg-teal-500/10',
    gradientText: 'from-blue-400 via-cyan-400 to-teal-400',
    border: 'border-blue-500/20',
    borderHover: 'hover:border-blue-400/50',
    shadow: 'shadow-blue-500/50',
  },
  'lava-flow': {
    bg: 'from-[#1a0606] via-[#330a0a] to-[#4a0e0e]',
    primary: 'from-red-500 to-orange-600',
    secondary: 'from-orange-500 to-yellow-600',
    accent: 'from-rose-600 to-red-700',
    text: 'text-orange-200',
    particlePrimary: 'bg-red-400',
    particleSecondary: 'bg-orange-400',
    glowPrimary: 'bg-red-500/10',
    glowSecondary: 'bg-orange-500/10',
    glowTertiary: 'bg-yellow-500/10',
    gradientText: 'from-red-400 via-orange-400 to-yellow-400',
    border: 'border-red-500/20',
    borderHover: 'hover:border-red-400/50',
    shadow: 'shadow-red-500/50',
  },
}

export type PaletteId = keyof typeof colorPalettes

export function getTheme(): ThemeConfig {
  if (typeof window === 'undefined') {
    return { palette: 'cosmic-purple', background: 'floating-orbs' }
  }
  const stored = localStorage.getItem('ngventures-theme')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return { palette: 'cosmic-purple', background: 'floating-orbs' }
    }
  }
  return { palette: 'cosmic-purple', background: 'floating-orbs' }
}

export function setTheme(config: ThemeConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ngventures-theme', JSON.stringify(config))
  }
}

export function getPaletteColors(paletteId: string) {
  return colorPalettes[paletteId as PaletteId] || colorPalettes['cosmic-purple']
}
