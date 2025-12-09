// Brand logo and color mappings
export const getBrandLogo = (brandName: string): string | null => {
  const logoMap: Record<string, string> = {
    'Truffles': '/logos/truffles logo.jpg',
    'Original Burger Co.': '/logos/Original_Burger_Co_Logo.png',
    'Mumbai Pav Co.': '/logos/MPC.jpg',
    'Blr Brewing Co.': '/logos/blr brewing co logo.png',
    'Blue Tokai': '/logos/Blue Tokai.jpg',
    'Namaste- South Indian': '/logos/Namaste logo.jpg',
    'Namaste': '/logos/Namaste logo.jpg',
    // Add more mappings as logos become available
  }
  return logoMap[brandName] || null
}

export const getBrandColor = (brandName: string, businessType: string): {
  borderColor: string
  iconBg: string
  iconColor: string
  shadowColor: string
  glowColor: string
} => {
  // Brand-specific colors (matching homepage)
  const brandColors: Record<string, any> = {
    'Truffles': {
      borderColor: 'teal-400',
      iconBg: 'teal-50',
      iconColor: 'teal-600',
      shadowColor: 'teal-500/30',
      glowColor: 'teal-500/20'
    },
    'Original Burger Co.': {
      borderColor: 'blue-400',
      iconBg: 'blue-50',
      iconColor: 'blue-600',
      shadowColor: 'blue-500/30',
      glowColor: 'blue-500/20'
    },
    'Blr Brewing Co.': {
      borderColor: 'amber-500',
      iconBg: 'amber-50',
      iconColor: 'amber-600',
      shadowColor: 'amber-600/30',
      glowColor: 'amber-600/20'
    },
    'Mumbai Pav Co.': {
      borderColor: 'blue-600',
      iconBg: 'blue-50',
      iconColor: 'blue-600',
      shadowColor: 'blue-700/30',
      glowColor: 'blue-700/20'
    },
    'Blue Tokai': {
      borderColor: 'sky-400',
      iconBg: 'sky-50',
      iconColor: 'sky-600',
      shadowColor: 'sky-500/30',
      glowColor: 'sky-500/20'
    },
    'Namaste- South Indian': {
      borderColor: 'orange-500',
      iconBg: 'orange-50',
      iconColor: 'orange-600',
      shadowColor: 'orange-600/30',
      glowColor: 'orange-600/20'
    },
    'Namaste': {
      borderColor: 'orange-500',
      iconBg: 'orange-50',
      iconColor: 'orange-600',
      shadowColor: 'orange-600/30',
      glowColor: 'orange-600/20'
    }
  }

  // Default colors based on business type if brand not found
  const defaultColors: Record<string, any> = {
    'QSR': {
      borderColor: 'blue-400',
      iconBg: 'blue-50',
      iconColor: 'blue-600',
      shadowColor: 'blue-500/30',
      glowColor: 'blue-500/20'
    },
    'Casual Dining': {
      borderColor: 'orange-400',
      iconBg: 'orange-50',
      iconColor: 'orange-600',
      shadowColor: 'orange-500/30',
      glowColor: 'orange-500/20'
    },
    'Fine Dining': {
      borderColor: 'purple-400',
      iconBg: 'purple-50',
      iconColor: 'purple-600',
      shadowColor: 'purple-500/30',
      glowColor: 'purple-500/20'
    },
    'Café': {
      borderColor: 'amber-400',
      iconBg: 'amber-50',
      iconColor: 'amber-600',
      shadowColor: 'amber-500/30',
      glowColor: 'amber-500/20'
    },
    'Bakery': {
      borderColor: 'pink-400',
      iconBg: 'pink-50',
      iconColor: 'pink-600',
      shadowColor: 'pink-500/30',
      glowColor: 'pink-500/20'
    },
    'Bar': {
      borderColor: 'red-400',
      iconBg: 'red-50',
      iconColor: 'red-600',
      shadowColor: 'red-500/30',
      glowColor: 'red-500/20'
    },
    'Cloud Kitchen': {
      borderColor: 'gray-400',
      iconBg: 'gray-50',
      iconColor: 'gray-600',
      shadowColor: 'gray-500/30',
      glowColor: 'gray-500/20'
    },
    'Sports Facility': {
      borderColor: 'green-400',
      iconBg: 'green-50',
      iconColor: 'green-600',
      shadowColor: 'green-500/30',
      glowColor: 'green-500/20'
    }
  }

  return brandColors[brandName] || defaultColors[businessType] || {
    borderColor: 'gray-400',
    iconBg: 'gray-50',
    iconColor: 'gray-600',
    shadowColor: 'gray-500/30',
    glowColor: 'gray-500/20'
  }
}

