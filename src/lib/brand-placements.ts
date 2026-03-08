/**
 * Brand Placement Data and Utilities
 * Maps brand placements to their coordinates on the Bangalore map
 */

// Area coordinates (matching BangaloreMapIllustration)
const areaCoordinates: Record<string, { x: number; y: number }> = {
  'MG Road': { x: 420, y: 300 },
  'Brigade Road': { x: 405, y: 305 },
  'Residency Road': { x: 425, y: 310 },
  'Indiranagar': { x: 580, y: 320 },
  'Whitefield': { x: 900, y: 278 },
  'Marathahalli': { x: 880, y: 420 },
  'Koramangala': { x: 550, y: 480 },
  'HSR Layout': { x: 660, y: 520 },
  'Bellandur': { x: 780, y: 540 },
  'Sarjapur Road': { x: 820, y: 580 },
  'Jayanagar': { x: 480, y: 620 },
  'JP Nagar': { x: 440, y: 670 },
  'Electronic City': { x: 500, y: 750 },
  'Manyata Tech Park': { x: 400, y: 240 },
  'Hennur/Hebbal': { x: 950, y: 230 },
};

function getAreaCoordinates(areaName: string): { x: number; y: number } | null {
  return areaCoordinates[areaName] || null;
}

export interface BrandPlacement {
  brand: string;
  location: string;
  size: string;
}

/**
 * Brand placements data
 */
export const brandPlacements: BrandPlacement[] = [
  { brand: "Mumbai Pav Co.", location: "Sarjapur Road", size: "300 sqft" },
  { brand: "Mumbai Pav Co.", location: "JP Nagar", size: "150 sqft" },
  { brand: "Mumbai Pav Co.", location: "Residency Road", size: "200 sqft" },
  { brand: "Burger Seigneur", location: "Indiranagar 80ft", size: "3,500 sqft" },
  { brand: "Eleven Bakehouse", location: "Indiranagar 100ft", size: "1,000 sqft" },
  { brand: "Sandowitch", location: "Indiranagar 100ft", size: "500 sqft" },
  { brand: "Madam Chocolate", location: "Indiranagar 100ft", size: "500 sqft" },
  { brand: "Evil Onigiri", location: "Indiranagar Double Road", size: "1,000 sqft" },
  { brand: "Tan Coffee", location: "Koramangala 80 Ft Road", size: "2,200 sqft" },
  { brand: "The Flour Girl Cafe", location: "Koramangala 80 Ft Road", size: "1,000 sqft" },
  { brand: "GoRally", location: "HAL Indiranagar", size: "15,000 sqft" },
  { brand: "Klutch Sports", location: "Arekere, Bannerghatta Road", size: "15,000 sqft" },
  { brand: "Minibe", location: "Indiranagar 80ft Road", size: "1,000 sqft" },
  { brand: "Wrapafella", location: "Indiranagar 100ft Road", size: "500 sqft" },
  { brand: "Mumbai Pav Co.", location: "Manyata Tech Park, Hebbal", size: "150 sqft" },
  { brand: "Meltin Desires", location: "Primeco ITPL, Whitefield", size: "400 sqft" },
];

/**
 * Map location strings to base area coordinates
 */
const locationToBaseArea: Record<string, string> = {
  "Sarjapur Road": "Sarjapur Road",
  "JP Nagar": "JP Nagar",
  "Residency Road": "Residency Road",
  "Indiranagar 80ft": "Indiranagar",
  "Indiranagar 80ft Road": "Indiranagar",
  "Indiranagar 100ft": "Indiranagar",
  "Indiranagar 100ft Road": "Indiranagar",
  "Indiranagar Double Road": "Indiranagar",
  "HAL Indiranagar": "Indiranagar",
  "Koramangala 80 Ft Road": "Koramangala",
  "Arekere, Bannerghatta Road": "Jayanagar", // Close to Jayanagar area
  "Manyata Tech Park": "Manyata Tech Park",
  "Hennur/Hebbal": "Hennur/Hebbal",
  "Manyata Tech Park, Hennur/Hebbal": "Hennur/Hebbal",
  "Manyata Tech Park, Hebbal": "Hennur/Hebbal",
  "Primeco ITPL": "Whitefield",
  "Primeco ITPL, Whitefield": "Whitefield",
};

/**
 * Check if two locations belong to the same base area
 */
function isSameBaseArea(loc1: string, loc2: string): boolean {
  const base1 = locationToBaseArea[loc1] || loc1.split(',')[0].trim().split(' ')[0];
  const base2 = locationToBaseArea[loc2] || loc2.split(',')[0].trim().split(' ')[0];
  
  // Special handling for Indiranagar variations
  if ((loc1.includes('Indiranagar') || base1 === 'Indiranagar') &&
      (loc2.includes('Indiranagar') || base2 === 'Indiranagar')) {
    return true;
  }
  
  // Special handling for Koramangala variations
  if ((loc1.includes('Koramangala') || base1 === 'Koramangala') &&
      (loc2.includes('Koramangala') || base2 === 'Koramangala')) {
    return true;
  }
  
  return base1 === base2;
}

/**
 * Get coordinates for a brand placement
 * Handles multiple placements in the same area with smart positioning
 */
export function getPlacementCoordinates(
  placement: BrandPlacement,
  index: number,
  allPlacements: BrandPlacement[]
): { x: number; y: number } | null {
  try {
    // Find base area for this location
    const locationParts = placement.location.split(',');
    const firstPart = locationParts[0]?.trim() || placement.location.trim();
    const baseArea = locationToBaseArea[placement.location] || 
                     locationToBaseArea[firstPart] ||
                     firstPart.split(' ')[0] ||
                     placement.location;
    
    const baseCoords = getAreaCoordinates(baseArea);
    if (!baseCoords) {
      console.warn(`No coordinates found for area: ${baseArea} (location: ${placement.location})`);
      return null;
    }

  // Indiranagar: place brands on distinct lines to avoid overlays
  const isIndiranagar100ft = placement.location.includes('Indiranagar') && placement.location.includes('100ft');
  const isIndiranagar80ft = placement.location.includes('Indiranagar') && placement.location.includes('80ft');
  const isIndiranagarDoubleRoad = placement.location.includes('Indiranagar Double Road');
  const isHennurHebbal = baseArea === 'Hennur/Hebbal';

  let offsetX = 0;
  let offsetY = 0;

  if (baseArea === 'Indiranagar') {
    // Line 1: 100ft Indiranagar – all brands on one line, no overlaps (direction: toward Koramangala, down-left)
    if (isIndiranagar100ft) {
      const line1Placements = allPlacements.filter(p => p.location.includes('Indiranagar') && p.location.includes('100ft'));
      const line1Index = line1Placements.findIndex(p => p.brand === placement.brand && p.location === placement.location);
      const startX = -75;
      const startY = -25;
      // Line 1: along 100ft – step left and down so no overlays
      offsetX = startX + line1Index * 28;
      offsetY = startY + line1Index * 38;
    }
    // Line 2: 80ft road – Burger Seigneur & Minibe
    else if (isIndiranagar80ft) {
      const line2Placements = allPlacements.filter(p =>
        (p.location.includes('Indiranagar') && p.location.includes('80ft'))
      );
      const line2Index = line2Placements.findIndex(p => p.brand === placement.brand && p.location === placement.location);
      offsetX = 30 + line2Index * 32;   // right of center
      offsetY = 18 + line2Index * 28;   // slightly down
    }
    // Line 3: Indiranagar double road
    else if (isIndiranagarDoubleRoad) {
      const line3Placements = allPlacements.filter(p => p.location.includes('Indiranagar Double Road'));
      const line3Index = line3Placements.findIndex(p => p.brand === placement.brand && p.location === placement.location);
      offsetX = -35 + line3Index * 40;
      offsetY = 42 + line3Index * 35;
    }
    // HAL Indiranagar – keep separate
    else if (placement.location.includes('HAL Indiranagar')) {
      offsetX = 55;
      offsetY = -8;
    }
  } else if (isHennurHebbal) {
    // Hennur/Hebbal (Manyata Tech Park) – pin inward so visible on mobile
    offsetX = 45;
    offsetY = 0;
  } else {
    // Non-Indiranagar: group by same location for spacing
    const sameLocationPlacements = allPlacements.filter(
      p => isSameBaseArea(p.location, placement.location) && p.location === placement.location
    );
    const sameLocationIndex = sameLocationPlacements.findIndex(p =>
      p.brand === placement.brand && p.location === placement.location
    );

    if (sameLocationPlacements.length > 1) {
      const spacing = 55;
      const startOffset = -(sameLocationPlacements.length - 1) * spacing / 2;
      offsetX = startOffset + sameLocationIndex * spacing;
      offsetY = (sameLocationIndex % 2 === 0) ? -6 : 6;
    }

    if (placement.location.includes('Koramangala 80 Ft Road')) {
      offsetX += (sameLocationIndex === 0) ? -25 : 25;
      offsetY += 18;
    } else if (placement.location.includes('Sarjapur Road')) {
      offsetX += -12;
      offsetY += 22;
    } else if (placement.location.includes('JP Nagar')) {
      offsetX += 10;
      offsetY += 18;
    } else if (placement.location.includes('Residency Road')) {
      offsetX += -22;
      offsetY += 12;
    } else if (placement.location.includes('Bannerghatta Road')) {
      offsetX += -18;
      offsetY += 28;
    } else if (placement.location.includes('Primeco ITPL')) {
      offsetX += 15;
      offsetY += 28;
    }
  }

    return {
      x: baseCoords.x + offsetX,
      y: baseCoords.y + offsetY,
    };
  } catch (error) {
    console.error('Error calculating placement coordinates:', error, placement);
    return null;
  }
}

