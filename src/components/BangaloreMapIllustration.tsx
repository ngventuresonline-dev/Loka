'use client';

import React, { useMemo } from 'react';

export interface BangaloreMapIllustrationProps {
  /** Width of the SVG */
  width?: number | string;
  /** Height of the SVG */
  height?: number | string;
  /** Background color (transparent by default for homepage overlay) */
  backgroundColor?: string;
  /** Show area labels */
  showLabels?: boolean;
  /** Custom className */
  className?: string;
  /** Show city outline */
  showOutline?: boolean;
  /** Animation speed multiplier */
  animationSpeed?: number;
  /** Additional children to render (e.g., pins, markers) */
  children?: React.ReactNode;
}

// Platform Performance color palette
const COLORS = {
  primary: '#FF5200',
  secondary: '#E4002B',
  accent: '#FF6B35',
  glow: 'rgba(255, 82, 0, 0.4)',
  glowSecondary: 'rgba(228, 0, 43, 0.3)',
  line: 'rgba(255, 82, 0, 0.2)',
  lineAccent: 'rgba(255, 107, 53, 0.3)',
  nodeGlow: 'rgba(255, 82, 0, 0.6)',
  label: '#FFD4C4', // Light warm color for labels on dark background
};

/**
 * Bangalore Map Illustration Component - Animated with Network Lines and Quantum Nodes
 * 
 * A futuristic animated SVG illustration of Bangalore city with network connections
 * and quantum nodes. Designed for homepage with Platform Performance styling.
 */
export default function BangaloreMapIllustration({
  width = '100%',
  height = '100%',
  backgroundColor = 'transparent',
  showLabels = true,
  className = '',
  showOutline = true,
  animationSpeed = 1,
  children,
}: BangaloreMapIllustrationProps) {
  // City outline path - stylized Bangalore shape
  const cityOutline = 'M180,120 L700,120 Q850,125 920,160 L980,210 L1020,300 L1040,420 L1030,580 L1000,680 L940,740 L750,770 L380,770 L200,740 L140,660 L110,520 L100,380 L120,240 L150,160 Z';

  // Major roads/highways as paths - representing key Bangalore roads
  const majorRoads = [
    // Outer Ring Road (eastern arc - major highway)
    'M600,100 Q750,110 850,150 T980,220 T1030,320 T1050,480 T1030,640 T970,710 T850,750 T600,770',
    // Inner Ring Road / Intermediate Ring Road
    'M300,200 Q500,210 700,220 T950,240 T1000,320 T1000,480 T980,600 T900,680 T700,720 T400,720',
    // MG Road (central north-south artery)
    'M400,120 Q410,200 420,280 T430,480 T420,650 T410,750',
    // Hosur Road (southwest to southeast)
    'M300,500 Q450,520 600,540 T850,570',
    // Old Airport Road / Varthur Road (northeast-southeast diagonal)
    'M750,180 Q800,280 820,400 T840,620',
    // Bannerghatta Road (south-central, connecting to south)
    'M450,550 Q500,600 530,680',
    // Sarjapur Road (southeast corridor)
    'M650,500 Q750,530 850,560',
    // Residency Road / Richmond Road (connecting center to south)
    'M400,280 Q410,350 420,450 T430,600',
  ];

  // Area locations with accurate geographic coordinates
  const areas = [
    // Central Business District
    { name: 'Brigade Road', x: 425, y: 310, labelX: 445, labelY: 295 },
    { name: 'Residency Road', x: 405, y: 305, labelX: 400, labelY: 290 },
    // Eastern areas
    { name: 'Indiranagar', x: 580, y: 320, labelX: 600, labelY: 305 },
    // Northeast
    { name: 'Whitefield', x: 950, y: 230, labelX: 940, labelY: 215 },
    // East-central
    { name: 'Marathahalli', x: 880, y: 420, labelX: 900, labelY: 405 },
    // Southeast cluster
    { name: 'Koramangala', x: 550, y: 480, labelX: 570, labelY: 465 },
    { name: 'HSR Layout', x: 660, y: 520, labelX: 640, labelY: 505 },
    { name: 'Bellandur', x: 780, y: 540, labelX: 800, labelY: 525 },
    { name: 'Sarjapur Road', x: 820, y: 580, labelX: 840, labelY: 565 },
    // South areas
    { name: 'Jayanagar', x: 480, y: 620, labelX: 460, labelY: 605 },
    { name: 'JP Nagar', x: 440, y: 670, labelX: 430, labelY: 655 },
    { name: 'Electronic City', x: 500, y: 750, labelX: 470, labelY: 730 },
  ];

  // Generate network connections between nearby areas
  const networkConnections = useMemo(() => {
    const connections: Array<{ from: typeof areas[0]; to: typeof areas[0]; distance: number }> = [];
    
    for (let i = 0; i < areas.length; i++) {
      for (let j = i + 1; j < areas.length; j++) {
        const from = areas[i];
        const to = areas[j];
        const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
        
        // Connect areas that are relatively close (within reasonable distance)
        if (distance < 250) {
          connections.push({ from, to, distance });
        }
      }
    }
    
    // Sort by distance to prioritize closer connections
    return connections.sort((a, b) => a.distance - b.distance);
  }, []);

  // Animation duration based on speed multiplier
  const lineAnimationDuration = 8 / animationSpeed;
  const nodePulseDuration = 3 / animationSpeed;

  // Close all pin popups when clicking on map background
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only close if clicking directly on the SVG (not on a child element)
    if (e.target === e.currentTarget) {
      const event = new CustomEvent('closeAllPinPopups', { detail: { excludeIndex: -1 } });
      window.dispatchEvent(event);
    }
  };

  return (
    <svg
      viewBox="330 190 750 600"
      preserveAspectRatio="xMidYMid meet"
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ backgroundColor }}
      onClick={handleMapClick}
    >
      <defs>
        {/* Gradient definitions for Platform Performance colors */}
        <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.primary} />
          <stop offset="50%" stopColor={COLORS.accent} />
          <stop offset="100%" stopColor={COLORS.secondary} />
        </linearGradient>
        
        <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.secondary} />
          <stop offset="100%" stopColor={COLORS.primary} />
        </linearGradient>

        {/* Glow filter for quantum nodes */}
        <filter id="quantumGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Pulsing glow filter */}
        <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
          </feMerge>
        </filter>

        {/* Radial gradient for node glow */}
        <radialGradient id="nodeGlow">
          <stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.8" />
          <stop offset="50%" stopColor={COLORS.accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={COLORS.secondary} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* City outline with gradient */}
      {showOutline && (
        <path
          d={cityOutline}
          fill="none"
          stroke="url(#primaryGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />
      )}

      {/* Major roads with animated glow */}
      <g stroke={COLORS.line} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
        {majorRoads.map((road, index) => (
          <path 
            key={index} 
            d={road}
            style={{
              filter: 'drop-shadow(0 0 2px rgba(255, 82, 0, 0.3))',
            }}
          />
        ))}
      </g>

      {/* Network connection lines - animated */}
      <g>
        {networkConnections.map((conn, index) => {
          const delay = (index * 0.15) % lineAnimationDuration;
          const pathLength = Math.sqrt(
            Math.pow(conn.to.x - conn.from.x, 2) + Math.pow(conn.to.y - conn.from.y, 2)
          );
          
          return (
            <line
              key={`connection-${index}`}
              x1={conn.from.x}
              y1={conn.from.y}
              x2={conn.to.x}
              y2={conn.to.y}
              stroke={COLORS.lineAccent}
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
              style={{
                filter: 'drop-shadow(0 0 3px rgba(255, 82, 0, 0.4))',
                animation: `fadeLine ${lineAnimationDuration * 1.5}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
                willChange: 'opacity',
              }}
            />
          );
        })}
      </g>

      {/* Quantum nodes at each area location */}
      {areas.map((area, index) => {
        const delay = (index * 0.2) % nodePulseDuration;
        const uniqueId = `node-${index}`;
        return (
          <g key={uniqueId}>
            {/* Outer pulsing ring - subtle pulse */}
            <circle
              cx={area.x}
              cy={area.y}
              r="8"
              fill="none"
              stroke={COLORS.primary}
              strokeWidth="1"
              opacity="0.4"
              style={{
                animation: `quantumPulseOuter ${nodePulseDuration * 1.5}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
                transformOrigin: `${area.x}px ${area.y}px`,
                willChange: 'transform, opacity',
              }}
            />
            
            {/* Middle ring - subtle pulse */}
            <circle
              cx={area.x}
              cy={area.y}
              r="5"
              fill="none"
              stroke={COLORS.accent}
              strokeWidth="1.5"
              opacity="0.6"
              style={{
                animation: `quantumPulseMiddle ${nodePulseDuration * 1.8}s ease-in-out infinite`,
                animationDelay: `${delay + 0.5}s`,
                willChange: 'transform, opacity',
              }}
            />
            
            {/* Core quantum node - subtle pulse */}
            <circle
              cx={area.x}
              cy={area.y}
              r="3"
              fill={COLORS.primary}
              filter="url(#quantumGlow)"
              style={{
                animation: `quantumCore ${nodePulseDuration * 1.2}s ease-in-out infinite`,
                animationDelay: `${delay + 0.2}s`,
                willChange: 'transform, opacity',
              }}
            />
            
            {/* Inner glow */}
            <circle
              cx={area.x}
              cy={area.y}
              r="1.5"
              fill={COLORS.accent}
              opacity="0.9"
            />
          </g>
        );
      })}

      {/* Area labels with Platform Performance styling - enhanced visibility */}
      {showLabels && (
        <g>
          {areas.map((area, index) => (
            <g key={`label-${index}`}>
              {/* Text shadow/backdrop for better visibility */}
              <text
                x={area.labelX}
                y={area.labelY}
                fill="rgba(0, 0, 0, 0.5)"
                fontSize="12"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="600"
                textAnchor="start"
                style={{
                  filter: 'blur(1px)',
                }}
              >
                {area.name}
              </text>
              {/* Main text */}
              <text
                x={area.labelX}
                y={area.labelY}
                fill="#FFFFFF"
                fontSize="12"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="600"
                textAnchor="start"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(255, 82, 0, 0.8))',
                }}
              >
                {area.name}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Additional children (for pins, markers, etc.) */}
      {children && <g>{children}</g>}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeLine {
          0%, 100% { 
            opacity: 0.3; 
          }
          50% { 
            opacity: 0.5; 
          }
        }
        
        @keyframes quantumPulseOuter {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 0.45;
            transform: scale(1.2);
          }
        }
        
        @keyframes quantumPulseMiddle {
          0%, 100% { 
            opacity: 0.5;
            transform: scale(1);
          }
          50% { 
            opacity: 0.65;
            transform: scale(1.15);
          }
        }
        
        @keyframes quantumCore {
          0%, 100% { 
            opacity: 0.9;
            transform: scale(1);
          }
          50% { 
            opacity: 0.95;
            transform: scale(1.1);
          }
        }
      `}</style>
    </svg>
  );
}

/**
 * Helper function to get coordinates for a specific area
 * Useful for placing custom pins or markers
 */
export function getAreaCoordinates(areaName: string): { x: number; y: number } | null {
  const areas: Record<string, { x: number; y: number }> = {
    'Brigade Road': { x: 425, y: 310 },
    'Residency Road': { x: 405, y: 305 },
    'Indiranagar': { x: 580, y: 320 },
    'Whitefield': { x: 950, y: 230 },
    'Marathahalli': { x: 880, y: 420 },
    'Koramangala': { x: 550, y: 480 },
    'HSR Layout': { x: 660, y: 520 },
    'Bellandur': { x: 780, y: 540 },
    'Sarjapur Road': { x: 820, y: 580 },
    'Jayanagar': { x: 480, y: 620 },
    'JP Nagar': { x: 440, y: 670 },
    'Electronic City': { x: 500, y: 750 },
  };

  return areas[areaName] || null;
}

/**
 * List of all available area names
 */
export const BANGALORE_AREAS = [
  'Brigade Road',
  'Residency Road',
  'Indiranagar',
  'Koramangala',
  'Whitefield',
  'Marathahalli',
  'Bellandur',
  'HSR Layout',
  'Sarjapur Road',
  'Jayanagar',
  'JP Nagar',
  'Electronic City',
] as const;
