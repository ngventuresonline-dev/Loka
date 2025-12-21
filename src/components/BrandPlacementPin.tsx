'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { getBrandLogo } from '@/lib/brand-logos';

export interface BrandPlacement {
  brand: string;
  location: string;
  size: string;
}

interface BrandPlacementPinProps {
  placement: BrandPlacement;
  x: number;
  y: number;
  index: number;
  onPinClick?: (placement: BrandPlacement) => void;
}

/**
 * Brand Placement Pin Component
 * Interactive pin for displaying brand placements on the map
 * Memoized for performance optimization
 */
const BrandPlacementPin = memo(function BrandPlacementPin({
  placement,
  x,
  y,
  index,
  onPinClick,
}: BrandPlacementPinProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [logoPath, setLogoPath] = useState<string | null>(null);

  useEffect(() => {
    // Get brand logo - only on client side
    if (typeof window !== 'undefined') {
      const logo = getBrandLogo(placement.brand);
      if (logo && typeof logo === 'string') {
        setLogoPath(logo);
      }
    }
  }, [placement.brand]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Close other popups by dispatching a custom event
    if (!isClicked) {
      // Close all other popups before opening this one
      const event = new CustomEvent('closeAllPinPopups', { detail: { excludeIndex: index } });
      window.dispatchEvent(event);
    }
    
    setIsClicked(!isClicked);
    if (onPinClick) {
      onPinClick(placement);
    }
  };

  // Listen for close events from other pins
  useEffect(() => {
    const handleClosePopups = (e: CustomEvent) => {
      if (e.detail?.excludeIndex !== index && isClicked) {
        setIsClicked(false);
      }
    };

    window.addEventListener('closeAllPinPopups' as any, handleClosePopups as EventListener);
    return () => {
      window.removeEventListener('closeAllPinPopups' as any, handleClosePopups as EventListener);
    };
  }, [index, isClicked]);

  // Pin size and animations
  const baseSize = 32;
  const hoverScale = isHovered ? 1.15 : 1;
  const clickScale = isClicked ? 1.1 : 1;
  const finalScale = hoverScale * clickScale;
  const pinSize = baseSize * finalScale;

  // Calculate popup position to avoid edge overflow and overlaps
  // Use viewBox bounds: "330 190 750 600" (x: 330-1080, y: 190-790)
  const viewBoxX = 330;
  const viewBoxY = 190;
  const viewBoxWidth = 750;
  const viewBoxHeight = 600;
  const viewBoxRight = viewBoxX + viewBoxWidth;
  const viewBoxBottom = viewBoxY + viewBoxHeight;
  
  const popupWidth = 200;
  const popupHeight = 90;
  const padding = 15;
  
  // Calculate X position - prefer right side, but flip to left if too close to right edge
  let popupX: number;
  if (x + popupWidth + padding > viewBoxRight) {
    // Position to the left of pin
    popupX = x - popupWidth - padding;
  } else {
    // Position to the right of pin
    popupX = x + padding;
  }
  
  // Ensure popup stays within viewBox bounds
  if (popupX < viewBoxX) {
    popupX = viewBoxX + padding;
  }
  if (popupX + popupWidth > viewBoxRight) {
    popupX = viewBoxRight - popupWidth - padding;
  }
  
  // Calculate Y position - prefer above, but flip to below if not enough space
  let popupY: number;
  const spaceAbove = y - viewBoxY;
  const spaceBelow = viewBoxBottom - y;
  
  // Prefer positioning above if there's enough space (at least popupHeight + padding)
  if (spaceAbove >= popupHeight + padding) {
    // Position above pin
    popupY = y - popupHeight - padding;
  } else if (spaceBelow >= popupHeight + padding) {
    // Position below pin if not enough space above
    popupY = y + padding;
  } else {
    // If neither side has enough space, position where there's more space
    if (spaceAbove > spaceBelow) {
      popupY = viewBoxY + padding;
    } else {
      popupY = viewBoxBottom - popupHeight - padding;
    }
  }
  
  // Ensure popup stays within viewBox bounds
  if (popupY < viewBoxY) {
    popupY = viewBoxY + padding;
  }
  if (popupY + popupHeight > viewBoxBottom) {
    popupY = viewBoxBottom - popupHeight - padding;
  }

  return (
    <g
      className="brand-placement-pin"
      transform={`translate(${x}, ${y})`}
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Outer glow ring - only visible on hover for better performance */}
      {isHovered && (
        <circle
          cx="0"
          cy="0"
          r={pinSize / 2 + 4}
          fill="none"
          stroke="#FF5200"
          strokeWidth="2"
          opacity={0.6}
          style={{
            transition: 'opacity 0.2s ease',
          }}
        />
      )}

      {/* Pin background (white) */}
      <circle
        cx="0"
        cy="0"
        r={pinSize / 2}
        fill="white"
        stroke="#FF5200"
        strokeWidth="2.5"
        style={{
          filter: isHovered
            ? 'drop-shadow(0 0 12px rgba(255, 82, 0, 0.8))'
            : 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Brand logo inside pin */}
      {logoPath ? (
        <image
          href={logoPath}
          x={-pinSize / 2 + 4}
          y={-pinSize / 2 + 4}
          width={pinSize - 8}
          height={pinSize - 8}
          style={{
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#FF5200"
          fontSize={pinSize * 0.35}
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          style={{ pointerEvents: 'none' }}
        >
          {placement.brand.charAt(0).toUpperCase()}
        </text>
      )}

      {/* Pin point/arrow */}
      <polygon
        points={`0,${pinSize / 2 + 8} -6,${pinSize / 2} 6,${pinSize / 2}`}
        fill="#FF5200"
        stroke="white"
        strokeWidth="1"
      />

      {/* Popup card when clicked */}
      {isClicked && (
        <g
          className="pin-popup pin-popup-container"
          transform={`translate(${popupX - x}, ${popupY - y})`}
          style={{ 
            pointerEvents: 'all',
            isolation: 'isolate',
          }}
        >
          {/* Popup background with higher z-index effect */}
          <rect
            x="0"
            y="0"
            width={popupWidth}
            height={popupHeight}
            rx="8"
            fill="white"
            stroke="#FF5200"
            strokeWidth="2"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
              pointerEvents: 'all',
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Brand logo in popup */}
          {logoPath ? (
            <image
              href={logoPath}
              x="10"
              y="10"
              width="40"
              height="40"
              style={{
                objectFit: 'contain',
              }}
            />
          ) : (
            <circle cx="30" cy="30" r="20" fill="#FF5200" />
          )}

          {/* Brand name */}
          <text
            x="60"
            y="25"
            fill="#1F2937"
            fontSize="14"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            {placement.brand}
          </text>

          {/* Location */}
          <text
            x="60"
            y="42"
            fill="#6B7280"
            fontSize="11"
            fontFamily="system-ui, sans-serif"
          >
            {placement.location}
          </text>

          {/* Size badge */}
          <rect
            x="60"
            y="58"
            width="70"
            height="18"
            rx="4"
            fill="#FF5200"
            opacity="0.1"
            stroke="#FF5200"
            strokeWidth="1"
          />
          <text
            x="95"
            y="69"
            textAnchor="middle"
            fill="#FF5200"
            fontSize="10"
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
          >
            {placement.size}
          </text>
        </g>
      )}

    </g>
  );
});

export default BrandPlacementPin;

