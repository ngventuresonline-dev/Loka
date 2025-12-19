'use client'

interface LokazenNodesLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LokazenNodesLoader({ size = 'md', className = '' }: LokazenNodesLoaderProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  // SS2/Lokazen nodes configuration - 5 nodes in a cross-like formation
  const nodes = [
    { id: 'center', x: 50, y: 50, delay: 0 },
    { id: 'top', x: 50, y: 30, delay: 0.2 },
    { id: 'bottom', x: 50, y: 70, delay: 0.4 },
    { id: 'left', x: 30, y: 50, delay: 0.6 },
    { id: 'right', x: 70, y: 50, delay: 0.8 },
  ]

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className={sizeClasses[size]}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glow filter for pulsing nodes */}
          <filter id="lokazen-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Radial gradient for nodes */}
          <radialGradient id="node-gradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(255, 82, 0, 0.9)" />
            <stop offset="50%" stopColor="rgba(255, 82, 0, 0.6)" />
            <stop offset="100%" stopColor="rgba(255, 82, 0, 0.2)" />
          </radialGradient>
          
          {/* Radial gradient for rings */}
          <radialGradient id="ring-gradient" cx="50%" cy="50%">
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
          <g key={node.id} filter="url(#lokazen-glow)">
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
              fill="url(#node-gradient)"
              style={{
                animation: `pulseNodeMain 1.5s ease-in-out infinite`,
                animationDelay: `${node.delay + 0.3}s`,
              }}
            />
          </g>
        ))}
      </svg>
    </div>
  )
}

