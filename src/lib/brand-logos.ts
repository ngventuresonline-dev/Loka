/**
 * Brand Logo Mapping Utility
 * Maps brand names to their logo file paths in /public/logos
 * 
 * IMPORTANT: Only exact or case-insensitive matches are used to prevent incorrect logo assignments
 * Logos are mapped based on their actual filenames
 */

const brandLogoMap: Record<string, string> = {
  // Coffee & Beverages
  'Blue Tokai': '/logos/Blue Tokai.jpg',
  'TAN Coffee': '/logos/TAN logo.jpg',
  'TAN': '/logos/TAN logo.jpg',
  'Blr Brewing Co.': '/logos/blr brewing co logo.png',
  'Blr Brewing Co': '/logos/blr brewing co logo.png',
  'blr brewing co': '/logos/blr brewing co logo.png',
  'BLR Brewing Co': '/logos/blr brewing co logo.png',
  
  // Food & Restaurants - QSR & Fast Food
  'Samosa Party': '/logos/Samosa Party Logo.png',
  'Truffles': '/logos/truffles logo.jpg',
  'Original Burger Co.': '/logos/Original_Burger_Co_Logo.png',
  'Original Burger Co': '/logos/Original_Burger_Co_Logo.png',
  'Burger Seigneur': '/logos/Burger Seigneur Logo 1.png',
  'Biggies Burger': '/logos/Biggies Logo.png',
  'Biggie': '/logos/Biggies Logo.png',
  'Biggies': '/logos/Biggies Logo.png',
  'Kried Ko- Burger': '/logos/Kried Logo.jpg',
  'Kried': '/logos/Kried Logo.jpg',
  'Kried Ko': '/logos/Kried Logo.jpg',
  
  // Cafés & Bakeries
  'The Flour Girl Cafe': '/logos/TFG Logo.png',
  'The Flour Girl': '/logos/TFG Logo.png',
  'TFG': '/logos/TFG Logo.png',
  'Flour Girl': '/logos/TFG Logo.png',
  'Eleven Bakehouse': '/logos/Eleven-Bakehouse-Coloured-Logos-01.png',
  'Eleven': '/logos/Eleven-Bakehouse-Coloured-Logos-01.png',
  'Zed The Baker': '/logos/Zed.jpg',
  'Zed': '/logos/Zed.jpg',
  
  // Desserts & Sweets
  'Madam Chocolate': '/logos/Madam Chocolate Logo .png',
  'Melts': '/logos/Melts Logo.jpg',
  'Melts- Cruncheese': '/logos/Melts Logo.jpg',
  'Qirfa': '/logos/Qirfa logo.jpg',
  'Kunafa Story': null, // No logo available
  
  // Sandwiches & Wraps
  'Sandowitch': '/logos/Sandowitch logo.jpg',
  'Boba Bhai': '/logos/Boba Bhai Logo.jpg',
  
  // South Indian & Regional
  'Namaste': '/logos/Namaste logo.jpg',
  'Namaste- South Indian': '/logos/Namaste logo.jpg',
  'Mumbai Pav Co.': '/logos/Mumbai Pav Co.jpg',
  'Mumbai Pav Co': '/logos/Mumbai Pav Co.jpg',
  'MPC': '/logos/Mumbai Pav Co.jpg',
  
  // Other Food Brands
  'Roma Deli': null, // No logo available
  'Evil Onigiri': null, // No logo available
  'Sun Kissed Smoothie': '/logos/Sunkiss logo.jpg',
  'Sunkiss': '/logos/Sunkiss logo.jpg',
  
  // Bars & Entertainment
  'Dolphins Bar & Kitchen': '/logos/Dolphins.jpg',
  'Dolphins': '/logos/Dolphins.jpg',
  'Bawri': '/logos/bawri.jpeg',
  
  // Sports Facilities
  'GoRally- Sports': '/logos/GoRally Logo.png',
  'Go Rally': '/logos/GoRally Logo.png',
  'GoRally': '/logos/GoRally Logo.png',
  'Klutch- Sports': null, // No logo available
  
  // Romeo Lane Brands
  'Romeo Lane': '/logos/Romeo Lane Logo.webp',
  'Birch, by Romeo Lane': '/logos/Romeo Lane Logo.webp',
  'Birch': '/logos/Romeo Lane Logo.webp',
}

/**
 * Get logo path for a brand name
 * Returns the logo path if found, otherwise returns null
 * 
 * Uses only exact and case-insensitive matching to prevent incorrect logo assignments
 */
export function getBrandLogo(brandName: string | null | undefined): string | null {
  if (!brandName) return null
  
  // Normalize brand name: trim whitespace
  const normalizedInput = brandName.trim()
  
  // Try exact match first
  if (brandLogoMap[normalizedInput] !== undefined) {
    const logo = brandLogoMap[normalizedInput]
    // Return null if explicitly set to null (no logo available)
    return logo
  }
  
  // Try case-insensitive match
  const normalizedInputLower = normalizedInput.toLowerCase()
  for (const [key, value] of Object.entries(brandLogoMap)) {
    if (key.toLowerCase() === normalizedInputLower) {
      return value
    }
  }
  
  // No partial matching to prevent incorrect assignments
  // Example: "Samosa Party" should NOT match "Go Rally" logo
  
  return null
}

/**
 * Get brand initial for fallback when logo is not available
 */
export function getBrandInitial(brandName: string | null | undefined): string {
  if (!brandName) return 'B'
  
  // Handle multi-word brand names - use first letter of first word
  const trimmed = brandName.trim()
  const firstChar = trimmed.charAt(0).toUpperCase()
  
  // Handle special cases like "The Flour Girl Cafe" -> "T" (not "F")
  // But "Samosa Party" -> "S"
  return firstChar
}
