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
  const [isMobile, setIsMobile] = useState(false);
  const [anyCardOpen, setAnyCardOpen] = useState(false);

  useEffect(() => {
    // Get brand logo - only on client side
    if (typeof window !== 'undefined') {
      const logo = getBrandLogo(placement.brand);
      if (logo && typeof logo === 'string') {
        setLogoPath(logo);
      }
      
      // Detect mobile screen size
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [placement.brand]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Close other popups by dispatching a custom event
    if (!isClicked) {
      // Close all other popups before opening this one
      const event = new CustomEvent('closeAllPinPopups', { detail: { excludeIndex: index } });
      window.dispatchEvent(event);
      // Notify that a card is now open
      const openEvent = new CustomEvent('pinCardOpened', { detail: { index } });
      window.dispatchEvent(openEvent);
      setAnyCardOpen(true);
    } else {
      // Closing this card
      const closeEvent = new CustomEvent('pinCardClosed', { detail: { index } });
      window.dispatchEvent(closeEvent);
      setAnyCardOpen(false);
    }
    
    setIsClicked(!isClicked);
    if (onPinClick) {
      onPinClick(placement);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClicked(false);
    setAnyCardOpen(false);
    const closeEvent = new CustomEvent('pinCardClosed', { detail: { index } });
    window.dispatchEvent(closeEvent);
  };

  // Listen for close events from other pins
  useEffect(() => {
    const handleClosePopups = (e: CustomEvent) => {
      if (e.detail?.excludeIndex !== index && isClicked) {
        setIsClicked(false);
        setAnyCardOpen(false);
      }
    };

    const handleCardOpened = (e: CustomEvent) => {
      if (e.detail?.index !== index && !isClicked) {
        setAnyCardOpen(true);
      }
    };

    const handleCardClosed = (e: CustomEvent) => {
      if (e.detail?.index !== index) {
        // Check if any other card is still open
        setTimeout(() => {
          const openCards = document.querySelectorAll('.pin-popup-container');
          if (openCards.length === 0) {
            setAnyCardOpen(false);
          }
        }, 100);
      } else {
        setAnyCardOpen(false);
      }
    };

    window.addEventListener('closeAllPinPopups' as any, handleClosePopups as EventListener);
    window.addEventListener('pinCardOpened' as any, handleCardOpened as EventListener);
    window.addEventListener('pinCardClosed' as any, handleCardClosed as EventListener);
    
    return () => {
      window.removeEventListener('closeAllPinPopups' as any, handleClosePopups as EventListener);
      window.removeEventListener('pinCardOpened' as any, handleCardOpened as EventListener);
      window.removeEventListener('pinCardClosed' as any, handleCardClosed as EventListener);
    };
  }, [index, isClicked]);

  // Pin size and animations (slightly larger on mobile for readability)
  const baseSize = isMobile ? 36 : 32;
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
  
  // Responsive popup size - larger cards as requested
  const popupWidth = isMobile ? 320 : 240;
  const popupHeight = isMobile ? 150 : 110;
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

  // Hide pin if another card is open (unless this is the open card)
  const shouldHide = anyCardOpen && !isClicked;

  return (
    <g
      className="brand-placement-pin"
      transform={`translate(${x}, ${y})`}
      style={{ 
        cursor: 'pointer',
        opacity: shouldHide ? 0.3 : 1,
        pointerEvents: shouldHide ? 'none' : 'all',
        transition: 'opacity 0.2s ease',
      }}
      onMouseEnter={() => !shouldHide && setIsHovered(true)}
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
            zIndex: 1000,
          }}
        >
          {/* Popup background with higher z-index effect */}
          <rect
            x="0"
            y="0"
            width={popupWidth}
            height={popupHeight}
            rx="10"
            fill="white"
            stroke="#FF5200"
            strokeWidth="2"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
              pointerEvents: 'all',
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Close button */}
          <g
            onClick={handleClose}
            style={{ cursor: 'pointer' }}
            transform={`translate(${popupWidth - 28}, 8)`}
          >
            <circle
              cx="10"
              cy="10"
              r="10"
              fill="#F3F4F6"
              stroke="#D1D5DB"
              strokeWidth="1"
              style={{
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.setAttribute('fill', '#EF4444');
                e.currentTarget.setAttribute('stroke', '#DC2626');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.setAttribute('fill', '#F3F4F6');
                e.currentTarget.setAttribute('stroke', '#D1D5DB');
              }}
            />
            <line
              x1="6"
              y1="6"
              x2="14"
              y2="14"
              stroke="#6B7280"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
            <line
              x1="14"
              y1="6"
              x2="6"
              y2="14"
              stroke="#6B7280"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
          </g>

          {/* Brand logo in popup */}
          {logoPath ? (
            <image
              href={logoPath}
              x="14"
              y="14"
              width={isMobile ? "64" : "48"}
              height={isMobile ? "64" : "48"}
              style={{
                objectFit: 'contain',
              }}
            />
          ) : (
            <circle cx={isMobile ? "46" : "38"} cy={isMobile ? "46" : "38"} r={isMobile ? "32" : "24"} fill="#FF5200" />
          )}

          {/* Brand name */}
          <text
            x={isMobile ? "90" : "70"}
            y={isMobile ? "36" : "28"}
            fill="#1F2937"
            fontSize={isMobile ? "20" : "16"}
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            {placement.brand}
          </text>

          {/* Location */}
          <text
            x={isMobile ? "90" : "70"}
            y={isMobile ? "60" : "50"}
            fill="#6B7280"
            fontSize={isMobile ? "15" : "12"}
            fontFamily="system-ui, sans-serif"
          >
            {placement.location}
          </text>

          {/* Size badge */}
          <rect
            x={isMobile ? "90" : "70"}
            y={isMobile ? "80" : "68"}
            width={isMobile ? "100" : "80"}
            height={isMobile ? "28" : "22"}
            rx="5"
            fill="#FF5200"
            opacity="0.1"
            stroke="#FF5200"
            strokeWidth="1"
          />
          <text
            x={isMobile ? "140" : "110"}
            y={isMobile ? "97" : "82"}
            textAnchor="middle"
            fill="#FF5200"
            fontSize={isMobile ? "13" : "11"}
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

