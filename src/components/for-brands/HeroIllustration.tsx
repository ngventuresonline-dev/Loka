'use client'

/**
 * Futuristic hero illustration for For Brands landing.
 * Theme: Lokazen orange/red gradient, abstract CRE matchmaking — nodes, grid, floating volumes.
 */
export default function HeroIllustration() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      <svg
        className="w-full max-w-4xl h-[320px] sm:h-[380px] md:h-[420px] opacity-90"
        viewBox="0 0 800 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="hero-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF5200" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#E4002B" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="hero-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E4002B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.6" />
          </linearGradient>
          <filter id="hero-glow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="hero-soft-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Perspective grid */}
        <g opacity="0.15" stroke="url(#hero-grad-1)" strokeWidth="0.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={80 + i * 45}
              y1={420}
              x2={400 + (80 + i * 45 - 400) * 0.4}
              y2={80}
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={80}
              y1={420 - i * 38}
              x2={720}
              y2={80 + (420 - i * 38 - 80) * 0.25}
            />
          ))}
        </g>

        {/* Central ring */}
        <ellipse
          cx="400"
          cy="200"
          rx="140"
          ry="50"
          fill="none"
          stroke="url(#hero-grad-1)"
          strokeWidth="2"
          opacity="0.5"
          filter="url(#hero-soft-glow)"
        />
        <ellipse
          cx="400"
          cy="200"
          rx="100"
          ry="36"
          fill="none"
          stroke="url(#hero-grad-2)"
          strokeWidth="1"
          opacity="0.4"
        />

        {/* Floating 3D-ish building blocks (isometric feel) */}
        <g filter="url(#hero-glow)">
          {/* Block 1 */}
          <path
            d="M220 280 L280 250 L280 210 L220 240 Z"
            fill="url(#hero-grad-1)"
            fillOpacity="0.35"
          />
          <path
            d="M280 250 L340 220 L340 260 L280 290 Z"
            fill="url(#hero-grad-2)"
            fillOpacity="0.3"
          />
          <path
            d="M220 240 L280 210 L340 220 L280 250 Z"
            fill="url(#hero-grad-1)"
            fillOpacity="0.25"
          />
          {/* Block 2 */}
          <path
            d="M480 260 L540 230 L540 190 L480 220 Z"
            fill="url(#hero-grad-1)"
            fillOpacity="0.4"
          />
          <path
            d="M540 230 L600 200 L600 240 L540 270 Z"
            fill="url(#hero-grad-2)"
            fillOpacity="0.35"
          />
          <path
            d="M480 220 L540 190 L600 200 L540 230 Z"
            fill="url(#hero-grad-1)"
            fillOpacity="0.3"
          />
          {/* Block 3 */}
          <path
            d="M560 320 L620 290 L620 250 L560 280 Z"
            fill="url(#hero-grad-2)"
            fillOpacity="0.3"
          />
          <path
            d="M620 290 L680 260 L680 300 L620 330 Z"
            fill="url(#hero-grad-1)"
            fillOpacity="0.25"
          />
          <path
            d="M560 280 L620 250 L680 260 L620 290 Z"
            fill="url(#hero-grad-2)"
            fillOpacity="0.2"
          />
        </g>

        {/* Connection nodes and lines */}
        <g stroke="url(#hero-grad-1)" strokeWidth="1.5" opacity="0.6">
          <line x1="250" y1="255" x2="390" y2="195" />
          <line x1="510" y1="225" x2="400" y2="200" />
          <line x1="590" y1="270" x2="510" y2="225" />
        </g>
        <g fill="url(#hero-grad-1)" filter="url(#hero-glow)">
          <circle cx="250" cy="255" r="8" />
          <circle cx="400" cy="200" r="12" />
          <circle cx="510" cy="225" r="8" />
          <circle cx="590" cy="270" r="8" />
        </g>

        {/* Accent orbs */}
        <circle cx="160" cy="180" r="40" fill="url(#hero-grad-1)" fillOpacity="0.12" />
        <circle cx="640" cy="140" r="50" fill="url(#hero-grad-2)" fillOpacity="0.1" />
      </svg>
    </div>
  )
}
