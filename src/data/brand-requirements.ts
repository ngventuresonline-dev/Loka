export type BusinessType = 
  | 'QSR' 
  | 'Cloud Kitchen' 
  | 'Café' 
  | 'Fine Dining' 
  | 'Bar' 
  | 'Bakery' 
  | 'Sports Facility' 
  | 'Casual Dining';

export type SizeCategory = 'Small' | 'Medium' | 'Large' | 'Extra Large' | 'Mega';

export type BudgetCategory = 'Budget' | 'Mid' | 'Premium' | 'High-end';

export type Timeline = 'Immediate' | 'Within 1 month' | '1-2 months' | 'Flexible';

export interface BrandRequirement {
  brandName: string;
  businessType: BusinessType;
  sizeRequirement: {
    category: SizeCategory;
    range: string;
    sqft: { min: number; max: number };
  };
  budgetRange: {
    category: BudgetCategory;
    range: string;
    monthly: { min: number; max: number };
  };
  preferredLocations: {
    primary: string[];
    secondary?: string[];
  };
  mustHaveFeatures: string[];
  timeline: Timeline;
  bfiWeights: {
    location: number;
    budget: number;
    size: number;
    features: number;
  };
}

export const brandRequirements: BrandRequirement[] = [
  // Fine Dining
  // Casual Dining
  {
    brandName: 'Truffles',
    businessType: 'Casual Dining',
    sizeRequirement: {
      category: 'Large',
      range: '1,500-2,000 sqft',
      sqft: { min: 1500, max: 2000 }
    },
    budgetRange: {
      category: 'Premium',
      range: '₹1.5L-2.5L/month',
      monthly: { min: 150000, max: 250000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Indiranagar', 'HSR Layout']
    },
    mustHaveFeatures: ['Ground floor', 'Parking', 'High footfall'],
    timeline: 'Within 1 month',
    bfiWeights: {
      location: 35,
      budget: 25,
      size: 25,
      features: 15
    }
  },
  
  {
    brandName: 'Namaste- South Indian',
    businessType: 'Casual Dining',
    sizeRequirement: {
      category: 'Large',
      range: '2,000-3,000 sqft',
      sqft: { min: 2000, max: 3000 }
    },
    budgetRange: {
      category: 'Premium',
      range: '₹1.5L-2.5L/month',
      monthly: { min: 150000, max: 250000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout'],
      secondary: ['Marathahalli', 'Bellandur']
    },
    mustHaveFeatures: ['Ground floor', 'Parking', 'Kitchen setup', 'High footfall'],
    timeline: '1-2 months',
    bfiWeights: {
      location: 30,
      budget: 25,
      size: 30,
      features: 15
    }
  },
  
  {
    brandName: 'Roma Deli',
    businessType: 'Casual Dining',
    sizeRequirement: {
      category: 'Large',
      range: '2,500-3,500 sqft',
      sqft: { min: 2500, max: 3500 }
    },
    budgetRange: {
      category: 'High-end',
      range: '₹3L-4.5L/month',
      monthly: { min: 300000, max: 450000 }
    },
    preferredLocations: {
      primary: ['Indiranagar', 'Koramangala'],
      secondary: ['MG Road', 'Church Street']
    },
    mustHaveFeatures: ['Ground floor', 'Corner unit', 'Parking', 'High ceiling', 'Natural light'],
    timeline: '1-2 months',
    bfiWeights: {
      location: 40,
      budget: 20,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Dolphins Bar & Kitchen',
    businessType: 'Bar',
    sizeRequirement: {
      category: 'Large',
      range: '2,000-3,000 sqft',
      sqft: { min: 2000, max: 3000 }
    },
    budgetRange: {
      category: 'Premium',
      range: '₹2L-3.5L/month',
      monthly: { min: 200000, max: 350000 }
    },
    preferredLocations: {
      primary: ['Indiranagar', 'Koramangala', 'MG Road'],
      secondary: ['HSR Layout', 'Whitefield']
    },
    mustHaveFeatures: ['Ground floor', 'Parking', 'High ceiling', 'Late night access'],
    timeline: '1-2 months',
    bfiWeights: {
      location: 35,
      budget: 25,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Blr Brewing Co.',
    businessType: 'Bar',
    sizeRequirement: {
      category: 'Extra Large',
      range: '3,500-5,000 sqft',
      sqft: { min: 3500, max: 5000 }
    },
    budgetRange: {
      category: 'High-end',
      range: '₹3L-5L/month',
      monthly: { min: 300000, max: 500000 }
    },
    preferredLocations: {
      primary: ['Indiranagar', 'Koramangala', 'Whitefield'],
      secondary: ['HSR Layout', 'MG Road']
    },
    mustHaveFeatures: ['Parking', 'Terrace', 'High ceiling', 'Brewing equipment space'],
    timeline: '1-2 months',
    bfiWeights: {
      location: 30,
      budget: 25,
      size: 30,
      features: 15
    }
  },

  // QSR Brands
  {
    brandName: 'Original Burger Co.',
    businessType: 'QSR',
    sizeRequirement: {
      category: 'Medium',
      range: '800-1,200 sqft',
      sqft: { min: 800, max: 1200 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹80K-1.2L/month',
      monthly: { min: 80000, max: 120000 }
    },
    preferredLocations: {
      primary: ['Whitefield', 'Marathahalli', 'Koramangala'],
      secondary: ['HSR Layout', 'Indiranagar']
    },
    mustHaveFeatures: ['Ground floor', 'Corner unit', 'High footfall'],
    timeline: 'Immediate',
    bfiWeights: {
      location: 35,
      budget: 25,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Burger Seigneur',
    businessType: 'QSR',
    sizeRequirement: {
      category: 'Medium',
      range: '600-1,000 sqft',
      sqft: { min: 600, max: 1000 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹70K-1L/month',
      monthly: { min: 70000, max: 100000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'HSR Layout', 'Indiranagar'],
      secondary: ['Bellandur', 'Whitefield']
    },
    mustHaveFeatures: ['Ground floor', 'High footfall', 'Metro nearby'],
    timeline: 'Within 1 month',
    bfiWeights: {
      location: 40,
      budget: 30,
      size: 20,
      features: 10
    }
  },
  {
    brandName: 'Biggies Burger',
    businessType: 'QSR',
    sizeRequirement: {
      category: 'Medium',
      range: '800-1,200 sqft',
      sqft: { min: 800, max: 1200 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹75K-1.1L/month',
      monthly: { min: 75000, max: 110000 }
    },
    preferredLocations: {
      primary: ['Marathahalli', 'Whitefield', 'Bellandur'],
      secondary: ['HSR Layout', 'Electronic City']
    },
    mustHaveFeatures: ['Ground floor', 'Parking', 'High footfall'],
    timeline: 'Within 1 month',
    bfiWeights: {
      location: 30,
      budget: 30,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Kried Ko- Burger',
    businessType: 'QSR',
    sizeRequirement: {
      category: 'Medium',
      range: '600-900 sqft',
      sqft: { min: 600, max: 900 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹60K-90K/month',
      monthly: { min: 60000, max: 90000 }
    },
    preferredLocations: {
      primary: ['HSR Layout', 'Koramangala', 'Indiranagar'],
      secondary: ['Bellandur', 'Whitefield']
    },
    mustHaveFeatures: ['Ground floor', 'Corner unit', 'High footfall'],
    timeline: 'Immediate',
    bfiWeights: {
      location: 35,
      budget: 30,
      size: 25,
      features: 10
    }
  },
  {
    brandName: 'Samosa Party',
    businessType: 'QSR',
    sizeRequirement: {
      category: 'Small',
      range: '400-700 sqft',
      sqft: { min: 400, max: 700 }
    },
    budgetRange: {
      category: 'Budget',
      range: '₹45K-70K/month',
      monthly: { min: 45000, max: 70000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Indiranagar', 'HSR Layout'],
      secondary: ['Whitefield', 'Marathahalli']
    },
    mustHaveFeatures: ['Ground floor', 'High footfall', 'Metro nearby'],
    timeline: 'Immediate',
    bfiWeights: {
      location: 40,
      budget: 30,
      size: 20,
      features: 10
    }
  },

  // Cloud Kitchens
  {
    brandName: 'Mumbai Pav Co.',
    businessType: 'QSR',
    sizeRequirement: {
      category: 'Small',
      range: '600-1,000 sqft',
      sqft: { min: 600, max: 1000 }
    },
    budgetRange: {
      category: 'Budget',
      range: '₹60K-90K/month',
      monthly: { min: 60000, max: 90000 }
    },
    preferredLocations: {
      primary: ['HSR Layout', 'Bellandur'],
      secondary: ['Whitefield', 'Marathahalli', 'Electronic City']
    },
    mustHaveFeatures: ['Ground floor', 'Kitchen setup', 'Parking', 'High footfall'],
    timeline: 'Immediate',
    bfiWeights: {
      location: 30,
      budget: 30,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Evil Onigiri',
    businessType: 'Casual Dining',
    sizeRequirement: {
      category: 'Small',
      range: '500-800 sqft',
      sqft: { min: 500, max: 800 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹70K-1L/month',
      monthly: { min: 70000, max: 100000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Indiranagar', 'HSR Layout'],
      secondary: ['Bellandur', 'Whitefield']
    },
    mustHaveFeatures: ['Ground floor', 'Kitchen setup', 'High footfall', 'Parking'],
    timeline: 'Within 1 month',
    bfiWeights: {
      location: 35,
      budget: 25,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Qirfa',
    businessType: 'Cloud Kitchen',
    sizeRequirement: {
      category: 'Small',
      range: '400-700 sqft',
      sqft: { min: 400, max: 700 }
    },
    budgetRange: {
      category: 'Budget',
      range: '₹50K-75K/month',
      monthly: { min: 50000, max: 75000 }
    },
    preferredLocations: {
      primary: ['HSR Layout', 'Bellandur', 'Whitefield'],
      secondary: ['Marathahalli', 'Electronic City']
    },
    mustHaveFeatures: ['Kitchen setup', 'Parking', 'Delivery access'],
    timeline: 'Immediate',
    bfiWeights: {
      location: 20,
      budget: 35,
      size: 25,
      features: 20
    }
  },
  {
    brandName: 'Melts- Cruncheese',
    businessType: 'Cloud Kitchen',
    sizeRequirement: {
      category: 'Small',
      range: '500-800 sqft',
      sqft: { min: 500, max: 800 }
    },
    budgetRange: {
      category: 'Budget',
      range: '₹55K-85K/month',
      monthly: { min: 55000, max: 85000 }
    },
    preferredLocations: {
      primary: ['Bellandur', 'HSR Layout', 'Whitefield'],
      secondary: ['Marathahalli', 'Koramangala']
    },
    mustHaveFeatures: ['Kitchen setup', 'Parking', 'Delivery access'],
    timeline: 'Within 1 month',
    bfiWeights: {
      location: 25,
      budget: 30,
      size: 25,
      features: 20
    }
  },

  // Cafés
  {
    brandName: 'Blue Tokai',
    businessType: 'Café',
    sizeRequirement: {
      category: 'Medium',
      range: '800-1,200 sqft',
      sqft: { min: 800, max: 1200 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹1L-1.5L/month',
      monthly: { min: 100000, max: 150000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Whitefield', 'Bellandur'],
      secondary: ['Indiranagar', 'HSR Layout']
    },
    mustHaveFeatures: ['Corner unit', 'Natural light', 'Metro nearby', 'Parking'],
    timeline: 'Immediate',
    bfiWeights: {
      location: 40,
      budget: 25,
      size: 20,
      features: 15
    }
  },
  {
    brandName: 'TAN Coffee',
    businessType: 'Café',
    sizeRequirement: {
      category: 'Medium',
      range: '600-1,000 sqft',
      sqft: { min: 600, max: 1000 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹80K-1.2L/month',
      monthly: { min: 80000, max: 120000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Indiranagar', 'HSR Layout'],
      secondary: ['Whitefield', 'Bellandur']
    },
    mustHaveFeatures: ['Corner unit', 'Natural light', 'High footfall', 'Metro nearby'],
    timeline: 'Within 1 month',
    bfiWeights: {
      location: 35,
      budget: 25,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Block Two Coffee',
    businessType: 'Café',
    sizeRequirement: {
      category: 'Medium',
      range: '700-1,100 sqft',
      sqft: { min: 700, max: 1100 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹90K-1.3L/month',
      monthly: { min: 90000, max: 130000 }
    },
    preferredLocations: {
      primary: ['Indiranagar', 'Koramangala', 'Whitefield'],
      secondary: ['HSR Layout', 'Marathahalli']
    },
    mustHaveFeatures: ['Corner unit', 'Natural light', 'Parking', 'High footfall'],
    timeline: 'Within 1 month',
    bfiWeights: {
      location: 35,
      budget: 25,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'The Flour Girl Cafe',
    businessType: 'Café',
    sizeRequirement: {
      category: 'Medium',
      range: '800-1,300 sqft',
      sqft: { min: 800, max: 1300 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹1L-1.4L/month',
      monthly: { min: 100000, max: 140000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Indiranagar', 'HSR Layout'],
      secondary: ['Whitefield', 'Bellandur']
    },
    mustHaveFeatures: ['Ground floor', 'Natural light', 'Parking', 'High footfall'],
    timeline: '1-2 months',
    bfiWeights: {
      location: 35,
      budget: 25,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Sun Kissed Smoothie',
    businessType: 'Café',
    sizeRequirement: {
      category: 'Small',
      range: '400-700 sqft',
      sqft: { min: 400, max: 700 }
    },
    budgetRange: {
      category: 'Budget',
      range: '₹50K-80K/month',
      monthly: { min: 50000, max: 80000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Indiranagar', 'HSR Layout'],
      secondary: ['Whitefield', 'Bellandur']
    },
    mustHaveFeatures: ['Ground floor', 'Corner unit', 'High footfall', 'Metro nearby'],
    timeline: 'Immediate',
    bfiWeights: {
      location: 40,
      budget: 30,
      size: 20,
      features: 10
    }
  },

  // Bakeries
  {
    brandName: 'Zed The Baker',
    businessType: 'Bakery',
    sizeRequirement: {
      category: 'Medium',
      range: '1,000-1,500 sqft',
      sqft: { min: 1000, max: 1500 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹1L-1.5L/month',
      monthly: { min: 100000, max: 150000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Indiranagar', 'HSR Layout'],
      secondary: ['Whitefield', 'Bellandur']
    },
    mustHaveFeatures: ['Ground floor', 'Kitchen setup', 'Parking', 'Display area'],
    timeline: 'Within 1 month',
    bfiWeights: {
      location: 30,
      budget: 25,
      size: 30,
      features: 15
    }
  },
  {
    brandName: 'Madam Chocolate',
    businessType: 'Bakery',
    sizeRequirement: {
      category: 'Medium',
      range: '800-1,200 sqft',
      sqft: { min: 800, max: 1200 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹90K-1.3L/month',
      monthly: { min: 90000, max: 130000 }
    },
    preferredLocations: {
      primary: ['Indiranagar', 'Koramangala', 'Whitefield'],
      secondary: ['HSR Layout', 'Bellandur']
    },
    mustHaveFeatures: ['Ground floor', 'Kitchen setup', 'Natural light', 'Display area'],
    timeline: 'Within 1 month',
    bfiWeights: {
      location: 35,
      budget: 25,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Eleven Bakehouse',
    businessType: 'Bakery',
    sizeRequirement: {
      category: 'Medium',
      range: '1,000-1,400 sqft',
      sqft: { min: 1000, max: 1400 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹1L-1.4L/month',
      monthly: { min: 100000, max: 140000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Indiranagar', 'HSR Layout'],
      secondary: ['Whitefield', 'Bellandur']
    },
    mustHaveFeatures: ['Ground floor', 'Kitchen setup', 'Parking', 'Display area', 'Natural light'],
    timeline: '1-2 months',
    bfiWeights: {
      location: 30,
      budget: 25,
      size: 30,
      features: 15
    }
  },
  {
    brandName: 'Sandowitch',
    businessType: 'QSR',
    sizeRequirement: {
      category: 'Small',
      range: '500-800 sqft',
      sqft: { min: 500, max: 800 }
    },
    budgetRange: {
      category: 'Budget',
      range: '₹55K-85K/month',
      monthly: { min: 55000, max: 85000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Indiranagar', 'HSR Layout'],
      secondary: ['Whitefield', 'Bellandur']
    },
    mustHaveFeatures: ['Ground floor', 'Kitchen setup', 'High footfall', 'Corner unit'],
    timeline: 'Immediate',
    bfiWeights: {
      location: 35,
      budget: 30,
      size: 25,
      features: 10
    }
  },

  // Sports Facilities
  {
    brandName: 'GoRally- Sports',
    businessType: 'Sports Facility',
    sizeRequirement: {
      category: 'Mega',
      range: '8,000-20,000 sqft',
      sqft: { min: 8000, max: 20000 }
    },
    budgetRange: {
      category: 'High-end',
      range: '₹5L-12L/month',
      monthly: { min: 500000, max: 1200000 }
    },
    preferredLocations: {
      primary: ['Whitefield', 'Sarjapur', 'Marathahalli'],
      secondary: ['Bellandur', 'HSR Layout', 'Yelahanka']
    },
    mustHaveFeatures: ['Ground floor', 'Parking', 'High ceiling', 'Large open space', 'Equipment installation space'],
    timeline: '1-2 months',
    bfiWeights: {
      location: 25,
      budget: 25,
      size: 35,
      features: 15
    }
  },
  {
    brandName: 'Klutch- Sports',
    businessType: 'Sports Facility',
    sizeRequirement: {
      category: 'Mega',
      range: '8,000-20,000 sqft',
      sqft: { min: 8000, max: 20000 }
    },
    budgetRange: {
      category: 'High-end',
      range: '₹5L-12L/month',
      monthly: { min: 500000, max: 1200000 }
    },
    preferredLocations: {
      primary: ['Whitefield', 'Sarjapur', 'Marathahalli'],
      secondary: ['Bellandur', 'HSR Layout', 'Yelahanka']
    },
    mustHaveFeatures: ['Ground floor', 'Parking', 'High ceiling', 'Large open space', 'Equipment installation space'],
    timeline: '1-2 months',
    bfiWeights: {
      location: 25,
      budget: 25,
      size: 35,
      features: 15
    }
  },

  // Other Bars
  {
    brandName: 'Birch, by Romeo Lane',
    businessType: 'Fine Dining',
    sizeRequirement: {
      category: 'Mega',
      range: '5,000-6,000 sqft',
      sqft: { min: 5000, max: 6000 }
    },
    budgetRange: {
      category: 'High-end',
      range: '₹4L-6L/month',
      monthly: { min: 400000, max: 600000 }
    },
    preferredLocations: {
      primary: ['Indiranagar', 'Koramangala'],
      secondary: ['MG Road', 'Whitefield']
    },
    mustHaveFeatures: ['Ground floor', 'Parking', 'Natural light', 'Outdoor seating', 'High ceiling', 'Ambiance'],
    timeline: '1-2 months',
    bfiWeights: {
      location: 40,
      budget: 20,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Romeo Lane',
    businessType: 'Bar',
    sizeRequirement: {
      category: 'Large',
      range: '1,500-2,500 sqft',
      sqft: { min: 1500, max: 2500 }
    },
    budgetRange: {
      category: 'Premium',
      range: '₹1.5L-2.5L/month',
      monthly: { min: 150000, max: 250000 }
    },
    preferredLocations: {
      primary: ['Indiranagar', 'Koramangala', 'MG Road'],
      secondary: ['HSR Layout', 'Whitefield']
    },
    mustHaveFeatures: ['Ground floor', 'Parking', 'Late night access', 'Ambiance'],
    timeline: '1-2 months',
    bfiWeights: {
      location: 35,
      budget: 25,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Bawri',
    businessType: 'Fine Dining',
    sizeRequirement: {
      category: 'Mega',
      range: '5,000-6,000 sqft',
      sqft: { min: 5000, max: 6000 }
    },
    budgetRange: {
      category: 'High-end',
      range: '₹4L-6L/month',
      monthly: { min: 400000, max: 600000 }
    },
    preferredLocations: {
      primary: ['Indiranagar', 'Koramangala'],
      secondary: ['MG Road', 'Whitefield']
    },
    mustHaveFeatures: ['Ground floor', 'Parking', 'Kitchen setup', 'High ceiling', 'Ambiance', 'Natural light'],
    timeline: '1-2 months',
    bfiWeights: {
      location: 40,
      budget: 20,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Boba Bhai',
    businessType: 'Casual Dining',
    sizeRequirement: {
      category: 'Medium',
      range: '800-1,200 sqft',
      sqft: { min: 800, max: 1200 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹85K-1.2L/month',
      monthly: { min: 85000, max: 120000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Indiranagar', 'HSR Layout'],
      secondary: ['Whitefield', 'Bellandur']
    },
    mustHaveFeatures: ['Ground floor', 'Corner unit', 'High footfall', 'Metro nearby'],
    timeline: 'Within 1 month',
    bfiWeights: {
      location: 35,
      budget: 25,
      size: 25,
      features: 15
    }
  },
  {
    brandName: 'Kunafa Story',
    businessType: 'Casual Dining',
    sizeRequirement: {
      category: 'Medium',
      range: '600-1,000 sqft',
      sqft: { min: 600, max: 1000 }
    },
    budgetRange: {
      category: 'Mid',
      range: '₹70K-1L/month',
      monthly: { min: 70000, max: 100000 }
    },
    preferredLocations: {
      primary: ['Koramangala', 'Indiranagar', 'HSR Layout'],
      secondary: ['Whitefield', 'Bellandur']
    },
    mustHaveFeatures: ['Ground floor', 'High footfall', 'Kitchen setup'],
    timeline: 'Immediate',
    bfiWeights: {
      location: 35,
      budget: 30,
      size: 25,
      features: 10
    }
  }
];

// Export helper functions
export const getBrandRequirement = (brandName: string): BrandRequirement | undefined => {
  return brandRequirements.find(brand => 
    brand.brandName.toLowerCase() === brandName.toLowerCase()
  );
};

export const getBrandsByType = (businessType: BusinessType): BrandRequirement[] => {
  return brandRequirements.filter(brand => brand.businessType === businessType);
};

export const getBrandsBySizeCategory = (category: SizeCategory): BrandRequirement[] => {
  return brandRequirements.filter(brand => brand.sizeRequirement.category === category);
};

export const getBrandsByBudgetCategory = (category: BudgetCategory): BrandRequirement[] => {
  return brandRequirements.filter(brand => brand.budgetRange.category === category);
};

