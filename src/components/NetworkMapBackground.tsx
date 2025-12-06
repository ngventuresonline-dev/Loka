'use client'

import { useMemo } from 'react'

interface NetworkNode {
  id: string
  x: number
  y: number
  connections: string[]
}

// Predefined offsets for consistent rendering (avoid hydration issues)
const nodeOffsets = [
  -0.8, 1.2, -1.1, 0.9, -0.5, 1.5, -1.3, 0.7, -0.9, 1.1, -0.6, 1.4,
  0.8, -1.2, 1.1, -0.9, 0.5, -1.5, 1.3, -0.7, 0.9, -1.1, 0.6, -1.4,
  -0.7, 1.3, -1.0, 0.8, -0.4, 1.6, -1.2, 0.6, -0.8, 1.2, -0.5, 1.5,
  0.7, -1.3, 1.0, -0.8, 0.4, -1.6, 1.2, -0.6, 0.8, -1.2, 0.5, -1.5,
  -0.9, 1.1, -1.2, 0.9, -0.6, 1.4, -1.4, 0.7, -0.7, 1.3, -0.4, 1.6,
  0.9, -1.1, 1.2, -0.9, 0.6, -1.4, 1.4, -0.7, 0.7, -1.3, 0.4, -1.6,
  -0.6, 1.4, -0.9, 1.1, -0.3, 1.7, -1.1, 0.8, -0.5, 1.5, -0.2, 1.8,
  0.6, -1.4, 0.9, -1.1, 0.3, -1.7, 1.1, -0.8, 0.5, -1.5, 0.2, -1.8,
]

export default function NetworkMapBackground() {
  // Generate network nodes in a grid-like pattern with consistent offsets
  const nodes = useMemo((): NetworkNode[] => {
    const nodeList: NetworkNode[] = []
    const cols = 12
    const rows = 8
    const spacingX = 100 / (cols + 1)
    const spacingY = 100 / (rows + 1)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const id = `node-${row}-${col}`
        const baseX = spacingX * (col + 1)
        const baseY = spacingY * (row + 1)
        const index = row * cols + col
        
        // Use predefined offsets for consistency
        const offsetX = nodeOffsets[index % nodeOffsets.length] || 0
        const offsetY = nodeOffsets[(index + 1) % nodeOffsets.length] || 0
        
        const x = baseX + offsetX
        const y = baseY + offsetY

        nodeList.push({
          id,
          x,
          y,
          connections: []
        })
      }
    }

    // Create connections (connect to neighbors)
    nodeList.forEach((node, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      
      // Connect to right neighbor
      if (col < cols - 1) {
        node.connections.push(nodeList[index + 1].id)
      }
      
      // Connect to bottom neighbor
      if (row < rows - 1) {
        node.connections.push(nodeList[index + cols].id)
      }
      
      // Some diagonal connections for more organic feel (deterministic based on index)
      if ((index % 7 === 0 || index % 11 === 0) && col < cols - 1 && row < rows - 1) {
        node.connections.push(nodeList[index + cols + 1].id)
      }
    })

    return nodeList
  }, [])

  // Generate connection lines
  const connections: Array<{ from: NetworkNode; to: NetworkNode }> = []
  nodes.forEach((node) => {
    node.connections.forEach((targetId) => {
      const target = nodes.find((n) => n.id === targetId)
      if (target) {
        // Avoid duplicates
        if (!connections.some((c) => c.from.id === targetId && c.to.id === node.id)) {
          connections.push({ from: node, to: target })
        }
      }
    })
  })

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.05 }}
      >
        <defs>
          {/* Gradient for fade effect at edges */}
          <radialGradient id="fadeGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="40%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.3)" />
          </radialGradient>

          {/* Glow filter for pulsing dots */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pattern for subtle texture */}
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="0.3" fill="rgba(224, 224, 224, 0.1)" />
          </pattern>
        </defs>

        {/* Background fade mask */}
        <rect width="100" height="100" fill="url(#fadeGradient)" />

        {/* Connection lines */}
        {connections.map((conn, index) => {
          const delay = (index * 0.1) % 10
          return (
            <line
              key={`line-${conn.from.id}-${conn.to.id}`}
              x1={conn.from.x}
              y1={conn.from.y}
              x2={conn.to.x}
              y2={conn.to.y}
              stroke="rgba(224, 224, 224, 0.3)"
              strokeWidth="0.15"
              opacity="0.4"
              strokeLinecap="round"
              style={{
                animation: `fadeLine 10s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          )
        })}

        {/* Accent lines (some with orange tint) */}
        {connections.slice(0, Math.floor(connections.length * 0.2)).map((conn, index) => {
          const delay = (index * 0.15) % 10
          return (
            <line
              key={`accent-line-${conn.from.id}-${conn.to.id}`}
              x1={conn.from.x}
              y1={conn.from.y}
              x2={conn.to.x}
              y2={conn.to.y}
              stroke="rgba(255, 82, 0, 0.05)"
              strokeWidth="0.2"
              opacity="0.3"
              strokeLinecap="round"
              style={{
                animation: `fadeLine 12s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          )
        })}

        {/* Network nodes/dots */}
        {nodes.map((node, index) => {
          const delay = (index * 0.08) % 8
          return (
            <g key={node.id}>
              {/* Outer glow ring */}
              <circle
                cx={node.x}
                cy={node.y}
                r="0.8"
                fill="rgba(255, 82, 0, 0.1)"
                opacity="0.5"
                filter="url(#glow)"
                style={{
                  animation: `pulseDot 4s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
              {/* Main dot */}
              <circle
                cx={node.x}
                cy={node.y}
                r="0.4"
                fill="rgba(255, 82, 0, 0.15)"
                style={{
                  animation: `pulseDotMain 3.5s ease-in-out infinite`,
                  animationDelay: `${delay + 0.5}s`,
                }}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

