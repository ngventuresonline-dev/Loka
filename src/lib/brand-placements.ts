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
  'Whitefield': { x: 950, y: 200 },
  'Marathahalli': { x: 880, y: 420 },
  'Koramangala': { x: 550, y: 480 },
  'HSR Layout': { x: 660, y: 520 },
  'Bellandur': { x: 780, y: 540 },
  'Sarjapur Road': { x: 820, y: 580 },
  'Jayanagar': { x: 480, y: 620 },
  'JP Nagar': { x: 440, y: 670 },
  'Electronic City': { x: 500, y: 750 },
  'Manyata Tech Park': { x: 400, y: 240 },
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
  { brand: "Wrapafella", location: "Indiranagar 100ft Road", size: "500 sqft" }
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

  // Group placements by location to handle clustering
  const sameLocationPlacements = allPlacements.filter(
    p => isSameBaseArea(p.location, placement.location)
  );
  
  const sameLocationIndex = sameLocationPlacements.findIndex(p => 
    p.brand === placement.brand && p.location === placement.location
  );

  // Calculate offset for multiple pins in same area
  let offsetX = 0;
  let offsetY = 0;

  if (sameLocationPlacements.length > 1) {
    // Arrange horizontally for same road locations
    const spacing = 60; // 60px spacing between pins
    const startOffset = -(sameLocationPlacements.length - 1) * spacing / 2;
    offsetX = startOffset + (sameLocationIndex * spacing);
    
    // Slight vertical offset for visual interest
    offsetY = (sameLocationIndex % 2 === 0) ? -8 : 8;
  }

  // Specific adjustments for different locations
  if (placement.location.includes('Indiranagar 100ft')) {
    offsetX += -40; // Left side of Indiranagar
    offsetY += -15;

    // Fine-tune specific brand pins
    if (placement.brand === 'Eleven Bakehouse') {
      // Move Eleven Bakehouse pin slightly higher
      offsetY += -10;
    }
  } else if (placement.location.includes('Indiranagar 80ft')) {
    offsetX += 20; // Right side
    offsetY += 10;
  } else if (placement.location.includes('Indiranagar Double Road')) {
    offsetX += -20;
    offsetY += 25;
  } else if (placement.location.includes('HAL Indiranagar')) {
    offsetX += 40;
    offsetY += -10;
  } else if (placement.location.includes('Koramangala 80 Ft Road')) {
    offsetX += (sameLocationIndex === 0) ? -30 : 30;
    offsetY += 20;
  } else if (placement.location.includes('Sarjapur Road')) {
    offsetX += -15;
    offsetY += 25;
  } else if (placement.location.includes('JP Nagar')) {
    offsetX += 10;
    offsetY += 20;
  } else if (placement.location.includes('Residency Road')) {
    offsetX += -25;
    offsetY += 15;
  } else if (placement.location.includes('Bannerghatta Road')) {
    offsetX += -20;
    offsetY += 30;
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

