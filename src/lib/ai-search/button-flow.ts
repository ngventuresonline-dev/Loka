/**
 * BUTTON-BASED CONVERSATION FLOW
 * Eliminates ambiguity - guided step-by-step experience
 */

export type EntityType = 'brand' | 'owner'
export type BusinessType = 'cafe_qsr' | 'restaurant' | 'bar_brewery' | 'cloud_kitchen' | 'retail_fashion' | 'retail_other' | 'gym_wellness' | 'entertainment' | 'other'
export type SizeRange = 'tiny' | 'small' | 'medium' | 'large' | 'very_large' | 'mega' | 'land' | 'custom'
export type Timeline = 'immediate' | '1_month' | '2_months' | '3_months' | 'flexible'

export interface ButtonFlowState {
  currentStep: string
  data: {
    entityType?: EntityType
    businessType?: BusinessType
    sizeRange?: { min: number; max: number } | 'land' | 'custom'
    customSize?: number
    // locationZone removed - using selectedAreas directly
    selectedAreas?: string[]
    budgetRange?: { min: number; max: number } | 'flexible'
    timeline?: Timeline
    brandName?: string
    contactPerson?: string
    phone?: string
    email?: string
    additionalNotes?: string
    // Owner-specific fields
    propertyType?: string
    propertyFeatures?: string[]
    availability?: Timeline
  }
  history: string[]
}

export interface ButtonOption {
  id: string
  label: string
  sublabel?: string
  icon?: string
  value: any
  next: string
  recommendedFor?: string[]
}

export interface FlowStep {
  step: string
  question: {
    type: 'text' | 'html'
    content: string
    subtitle?: string
  }
  buttons: ButtonOption[]
  allowSkip: boolean
  layout: 'list' | 'grid_2_columns' | 'grid_3_columns' | 'checklist'
  multiSelect?: boolean
  minSelections?: number
  maxSelections?: number
}

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

export const FLOW_STEPS: Record<string, FlowStep> = {
  step_0_welcome: {
    step: 'step_0_welcome',
    question: {
      type: 'text',
      content: 'Welcome to Lokazen!\n\nI\'ll help you find the perfect commercial space in Bangalore.\n\nLet\'s get started with a few quick questions.'
    },
    buttons: [
      {
        id: 'start',
        label: "Let's Go!",
        value: 'start',
        next: 'step_1_entity_type'
      }
    ],
    allowSkip: false,
    layout: 'list'
  },

  step_1_entity_type: {
    step: 'step_1_entity_type',
    question: {
      type: 'text',
      content: 'First, let me know who you are:'
    },
    buttons: [
      {
        id: 'brand',
        label: 'I\'m looking for space',
        sublabel: 'For my business/brand',
        icon: 'search',
        value: 'brand',
        next: 'step_2_business_type'
      },
      {
        id: 'owner',
        label: 'I have space available',
        sublabel: 'Property owner/broker',
        icon: 'building',
        value: 'owner',
        next: 'owner_flow_start'
      }
    ],
    allowSkip: false,
    layout: 'list'
  },

  step_2_business_type: {
    step: 'step_2_business_type',
    question: {
      type: 'text',
      content: 'Great! What type of business are you opening?'
    },
    buttons: [
      {
        id: 'qsr_cafe',
        label: 'Café / QSR',
        sublabel: 'Quick service, coffee shop',
        icon: 'coffee',
        value: 'cafe_qsr',
        next: 'step_3_size_range'
      },
      {
        id: 'restaurant',
        label: 'Restaurant',
        sublabel: 'Casual/fine dining',
        icon: 'restaurant',
        value: 'restaurant',
        next: 'step_3_size_range'
      },
      {
        id: 'bar_brewery',
        label: 'Bar / Brewery',
        sublabel: 'Pub, microbrewery, lounge',
        icon: 'bar',
        value: 'bar_brewery',
        next: 'step_3_size_range'
      },
      {
        id: 'cloud_kitchen',
        label: 'Cloud Kitchen',
        sublabel: 'Delivery only',
        icon: 'kitchen',
        value: 'cloud_kitchen',
        next: 'step_3_size_range'
      },
      {
        id: 'retail_fashion',
        label: 'Fashion Retail',
        sublabel: 'Clothing, accessories',
        icon: 'fashion',
        value: 'retail_fashion',
        next: 'step_3_size_range'
      },
      {
        id: 'retail_other',
        label: 'Other Retail',
        sublabel: 'Electronics, lifestyle, etc',
        icon: 'retail',
        value: 'retail_other',
        next: 'step_3_size_range'
      },
      {
        id: 'gym_wellness',
        label: 'Gym / Wellness',
        sublabel: 'Fitness, spa, salon',
        icon: 'fitness',
        value: 'gym_wellness',
        next: 'step_3_size_range'
      },
      {
        id: 'entertainment',
        label: 'Entertainment',
        sublabel: 'Gaming, sports, leisure',
        icon: 'entertainment',
        value: 'entertainment',
        next: 'step_3_size_range'
      },
      {
        id: 'other',
        label: 'Other',
        sublabel: 'Tell us more',
        icon: 'other',
        value: 'other',
        next: 'step_3_size_range'
      }
    ],
    allowSkip: false,
    layout: 'grid_2_columns'
  },

  step_3_size_range: {
    step: 'step_3_size_range',
    question: {
      type: 'text',
      content: 'Perfect! How much space do you need?'
    },
    buttons: [
      {
        id: 'tiny',
        label: '100 - 500 sqft',
        sublabel: 'Kiosk, small counter',
        icon: 'kiosk',
        value: { min: 100, max: 500 },
        recommendedFor: ['cafe_qsr', 'cloud_kitchen'],
        next: 'step_4_all_locations'
      },
      {
        id: 'small',
        label: '500 - 1,000 sqft',
        sublabel: 'Small café, boutique',
        icon: 'small',
        value: { min: 500, max: 1000 },
        recommendedFor: ['cafe_qsr', 'retail_fashion'],
        next: 'step_4_all_locations'
      },
      {
        id: 'medium',
        label: '1,000 - 2,000 sqft',
        sublabel: 'Restaurant, retail store',
        icon: 'medium',
        value: { min: 1000, max: 2000 },
        recommendedFor: ['restaurant', 'cafe_qsr', 'retail_fashion', 'retail_other'],
        next: 'step_4_all_locations'
      },
      {
        id: 'large',
        label: '2,000 - 5,000 sqft',
        sublabel: 'Fine dining, large retail',
        icon: 'large',
        value: { min: 2000, max: 5000 },
        recommendedFor: ['restaurant', 'bar_brewery', 'retail_other', 'gym_wellness'],
        next: 'step_4_all_locations'
      },
      {
        id: 'very_large',
        label: '5,000 - 10,000 sqft',
        sublabel: 'Brewery, showroom, gym',
        icon: 'very-large',
        value: { min: 5000, max: 10000 },
        recommendedFor: ['bar_brewery', 'gym_wellness', 'entertainment'],
        next: 'step_4_all_locations'
      },
      {
        id: 'mega',
        label: '10,000+ sqft',
        sublabel: 'Anchor store, large facility',
        icon: 'mega',
        value: { min: 10000, max: 999999 },
        recommendedFor: ['entertainment', 'gym_wellness'],
        next: 'step_4_all_locations'
      },
      {
        id: 'custom',
        label: 'Custom Size',
        sublabel: 'Enter exact size',
        icon: 'custom',
        value: 'custom',
        next: 'step_3c_custom_size'
      }
    ],
    allowSkip: false,
    layout: 'list'
  },

  step_4_all_locations: {
    step: 'step_4_all_locations',
    question: {
      type: 'text',
      content: 'Select your preferred locations in Bangalore:',
      subtitle: 'Choose one or multiple areas'
    },
    buttons: [
      // All major Bangalore locations
      { id: 'koramangala', label: 'Koramangala', icon: 'location', value: 'Koramangala', next: 'step_6_budget_range' },
      { id: 'indiranagar', label: 'Indiranagar', icon: 'location', value: 'Indiranagar', next: 'step_6_budget_range' },
      { id: 'whitefield', label: 'Whitefield', icon: 'location', value: 'Whitefield', next: 'step_6_budget_range' },
      { id: 'hsr_layout', label: 'HSR Layout', icon: 'location', value: 'HSR Layout', next: 'step_6_budget_range' },
      { id: 'marathahalli', label: 'Marathahalli', icon: 'location', value: 'Marathahalli', next: 'step_6_budget_range' },
      { id: 'bellandur', label: 'Bellandur', icon: 'location', value: 'Bellandur', next: 'step_6_budget_range' },
      { id: 'sarjapur_road', label: 'Sarjapur Road', icon: 'location', value: 'Sarjapur Road', next: 'step_6_budget_range' },
      { id: 'mg_road', label: 'MG Road', icon: 'location', value: 'MG Road', next: 'step_6_budget_range' },
      { id: 'brigade_road', label: 'Brigade Road', icon: 'location', value: 'Brigade Road', next: 'step_6_budget_range' },
      { id: 'jayanagar', label: 'Jayanagar', icon: 'location', value: 'Jayanagar', next: 'step_6_budget_range' },
      { id: 'btm_layout', label: 'BTM Layout', icon: 'location', value: 'BTM Layout', next: 'step_6_budget_range' },
      { id: 'jp_nagar', label: 'JP Nagar', icon: 'location', value: 'JP Nagar', next: 'step_6_budget_range' },
      { id: 'electronic_city', label: 'Electronic City', icon: 'location', value: 'Electronic City', next: 'step_6_budget_range' },
      { id: 'malleshwaram', label: 'Malleshwaram', icon: 'location', value: 'Malleshwaram', next: 'step_6_budget_range' },
      { id: 'yeshwanthpur', label: 'Yeshwanthpur', icon: 'location', value: 'Yeshwanthpur', next: 'step_6_budget_range' },
      { id: 'rajajinagar', label: 'Rajajinagar', icon: 'location', value: 'Rajajinagar', next: 'step_6_budget_range' },
      { id: 'hebbal', label: 'Hebbal', icon: 'location', value: 'Hebbal', next: 'step_6_budget_range' },
      { id: 'commercial_street', label: 'Commercial Street', icon: 'location', value: 'Commercial Street', next: 'step_6_budget_range' },
      { id: 'church_street', label: 'Church Street', icon: 'location', value: 'Church Street', next: 'step_6_budget_range' },
      { id: 'ub_city', label: 'UB City', icon: 'location', value: 'UB City', next: 'step_6_budget_range' }
    ],
    allowSkip: false,
    layout: 'checklist',
    multiSelect: true,
    minSelections: 1,
    maxSelections: 20
  },

  step_6_budget_range: {
    step: 'step_6_budget_range',
    question: {
      type: 'text',
      content: 'What\'s your monthly rent budget?'
    },
    buttons: [
      {
        id: 'budget_50k_1l',
        label: '₹50K - ₹1L',
        sublabel: 'Small spaces, kiosks',
        icon: 'budget',
        value: { min: 50000, max: 100000 },
        next: 'step_9_confirmation'
      },
      {
        id: 'budget_1_2l',
        label: '₹1L - ₹2L',
        sublabel: 'Small café, boutique',
        icon: 'budget-medium',
        value: { min: 100000, max: 200000 },
        next: 'step_9_confirmation'
      },
      {
        id: 'budget_2_3l',
        label: '₹2L - ₹3L',
        sublabel: 'Medium restaurant, retail',
        icon: 'budget-medium',
        value: { min: 200000, max: 300000 },
        next: 'step_9_confirmation'
      },
      {
        id: 'budget_3_5l',
        label: '₹3L - ₹5L',
        sublabel: 'Restaurant, large retail',
        icon: 'budget-high',
        value: { min: 300000, max: 500000 },
        next: 'step_9_confirmation'
      },
      {
        id: 'budget_5_10l',
        label: '₹5L - ₹10L',
        sublabel: 'Fine dining, brewery',
        icon: 'budget-high',
        value: { min: 500000, max: 1000000 },
        next: 'step_9_confirmation'
      },
      {
        id: 'budget_10_20l',
        label: '₹10L - ₹20L',
        sublabel: 'Premium spaces',
        icon: 'budget-premium',
        value: { min: 1000000, max: 2000000 },
        next: 'step_9_confirmation'
      },
      {
        id: 'budget_20l_plus',
        label: '₹20L+',
        sublabel: 'Large format, anchor',
        icon: 'budget-premium',
        value: { min: 2000000, max: 99999999 },
        next: 'step_9_confirmation'
      },
      {
        id: 'budget_flexible',
        label: 'Flexible / Negotiable',
        sublabel: 'Open to discussion',
        icon: 'flexible',
        value: 'flexible',
        next: 'step_9_confirmation'
      }
    ],
    allowSkip: false,
    layout: 'list'
  },

  step_7_timeline: {
    step: 'step_7_timeline',
    question: {
      type: 'text',
      content: 'When do you need the space?'
    },
    buttons: [
      {
        id: 'immediate',
        label: 'Immediately',
        sublabel: 'Ready to move in ASAP',
        icon: 'urgent',
        value: 'immediate',
        next: 'step_9_confirmation'
      },
      {
        id: '1_month',
        label: 'Within 1 month',
        sublabel: 'Starting soon',
        icon: 'soon',
        value: '1_month',
        next: 'step_9_confirmation'
      },
      {
        id: '2_months',
        label: '1-2 months',
        sublabel: 'Planning phase',
        icon: 'planning',
        value: '2_months',
        next: 'step_9_confirmation'
      },
      {
        id: '3_months',
        label: '2-3 months',
        sublabel: 'Early exploration',
        icon: 'exploring',
        value: '3_months',
        next: 'step_9_confirmation'
      },
      {
        id: 'flexible',
        label: 'Flexible timeline',
        sublabel: 'Just exploring options',
        icon: 'flexible-timeline',
        value: 'flexible',
        next: 'step_9_confirmation'
      }
    ],
    allowSkip: false,
    layout: 'list'
  },


  step_9_confirmation: {
    step: 'step_9_confirmation',
    question: {
      type: 'text',
      content: 'Perfect! Review your details:'
    },
    buttons: [
      {
        id: 'confirm',
        label: 'Looks Good! Find Matches',
        value: 'confirm',
        next: 'step_10_searching'
      },
      {
        id: 'edit',
        label: 'Make Changes',
        value: 'edit',
        next: 'step_edit_menu'
      }
    ],
    allowSkip: false,
    layout: 'list'
  },

  // ============================================================================
  // OWNER FLOW STEPS
  // ============================================================================

  owner_flow_start: {
    step: 'owner_flow_start',
    question: {
      type: 'text',
      content: 'Great! Let\'s list your property.\n\nI\'ll help you create an attractive listing that matches with the right brands.'
    },
    buttons: [
      {
        id: 'owner_start',
        label: "Let's Begin",
        value: 'start',
        next: 'owner_step_1_property_type'
      }
    ],
    allowSkip: false,
    layout: 'list'
  },

  owner_step_1_property_type: {
    step: 'owner_step_1_property_type',
    question: {
      type: 'text',
      content: 'What type of property are you listing?'
    },
    buttons: [
      {
        id: 'owner_retail',
        label: 'Retail Space',
        sublabel: 'Shop, storefront, showroom',
        icon: 'retail',
        value: 'retail',
        next: 'owner_step_2_location'
      },
      {
        id: 'owner_restaurant',
        label: 'Restaurant Space',
        sublabel: 'Dining, café, food court',
        icon: 'restaurant',
        value: 'restaurant',
        next: 'owner_step_2_location'
      },
      {
        id: 'owner_office',
        label: 'Office Space',
        sublabel: 'Commercial office, co-working',
        icon: 'building',
        value: 'office',
        next: 'owner_step_2_location'
      },
      {
        id: 'owner_warehouse',
        label: 'Warehouse / Storage',
        sublabel: 'Storage, logistics, industrial',
        icon: 'building',
        value: 'warehouse',
        next: 'owner_step_2_location'
      },
      {
        id: 'owner_mixed',
        label: 'Mixed Use',
        sublabel: 'Multi-purpose space',
        icon: 'building',
        value: 'mixed',
        next: 'owner_step_2_location'
      },
      {
        id: 'owner_land',
        label: 'Land / Plot',
        sublabel: 'Vacant land for development',
        icon: 'building',
        value: 'land',
        next: 'owner_step_2_location'
      }
    ],
    allowSkip: false,
    layout: 'grid_2_columns'
  },

  owner_step_2_location: {
    step: 'owner_step_2_location',
    question: {
      type: 'text',
      content: 'Where is your property located?',
      subtitle: 'Select one or multiple locations'
    },
    buttons: [
      { id: 'owner_koramangala', label: 'Koramangala', icon: 'location', value: 'Koramangala', next: 'owner_step_3_size' },
      { id: 'owner_indiranagar', label: 'Indiranagar', icon: 'location', value: 'Indiranagar', next: 'owner_step_3_size' },
      { id: 'owner_whitefield', label: 'Whitefield', icon: 'location', value: 'Whitefield', next: 'owner_step_3_size' },
      { id: 'owner_hsr_layout', label: 'HSR Layout', icon: 'location', value: 'HSR Layout', next: 'owner_step_3_size' },
      { id: 'owner_marathahalli', label: 'Marathahalli', icon: 'location', value: 'Marathahalli', next: 'owner_step_3_size' },
      { id: 'owner_bellandur', label: 'Bellandur', icon: 'location', value: 'Bellandur', next: 'owner_step_3_size' },
      { id: 'owner_sarjapur_road', label: 'Sarjapur Road', icon: 'location', value: 'Sarjapur Road', next: 'owner_step_3_size' },
      { id: 'owner_mg_road', label: 'MG Road', icon: 'location', value: 'MG Road', next: 'owner_step_3_size' },
      { id: 'owner_brigade_road', label: 'Brigade Road', icon: 'location', value: 'Brigade Road', next: 'owner_step_3_size' },
      { id: 'owner_jayanagar', label: 'Jayanagar', icon: 'location', value: 'Jayanagar', next: 'owner_step_3_size' },
      { id: 'owner_btm_layout', label: 'BTM Layout', icon: 'location', value: 'BTM Layout', next: 'owner_step_3_size' },
      { id: 'owner_jp_nagar', label: 'JP Nagar', icon: 'location', value: 'JP Nagar', next: 'owner_step_3_size' },
      { id: 'owner_electronic_city', label: 'Electronic City', icon: 'location', value: 'Electronic City', next: 'owner_step_3_size' },
      { id: 'owner_malleshwaram', label: 'Malleshwaram', icon: 'location', value: 'Malleshwaram', next: 'owner_step_3_size' },
      { id: 'owner_yeshwanthpur', label: 'Yeshwanthpur', icon: 'location', value: 'Yeshwanthpur', next: 'owner_step_3_size' },
      { id: 'owner_rajajinagar', label: 'Rajajinagar', icon: 'location', value: 'Rajajinagar', next: 'owner_step_3_size' },
      { id: 'owner_hebbal', label: 'Hebbal', icon: 'location', value: 'Hebbal', next: 'owner_step_3_size' },
      { id: 'owner_commercial_street', label: 'Commercial Street', icon: 'location', value: 'Commercial Street', next: 'owner_step_3_size' },
      { id: 'owner_church_street', label: 'Church Street', icon: 'location', value: 'Church Street', next: 'owner_step_3_size' },
      { id: 'owner_ub_city', label: 'UB City', icon: 'location', value: 'UB City', next: 'owner_step_3_size' }
    ],
    allowSkip: false,
    layout: 'checklist',
    multiSelect: true,
    minSelections: 1,
    maxSelections: 5
  },

  owner_step_3_size: {
    step: 'owner_step_3_size',
    question: {
      type: 'text',
      content: 'What\'s the size of your property?'
    },
    buttons: [
      {
        id: 'owner_tiny',
        label: '100 - 500 sqft',
        sublabel: 'Kiosk, small counter',
        icon: 'kiosk',
        value: { min: 100, max: 500 },
        next: 'owner_step_4_rent'
      },
      {
        id: 'owner_small',
        label: '500 - 1,000 sqft',
        sublabel: 'Small shop, boutique',
        icon: 'small',
        value: { min: 500, max: 1000 },
        next: 'owner_step_4_rent'
      },
      {
        id: 'owner_medium',
        label: '1,000 - 2,000 sqft',
        sublabel: 'Restaurant, retail store',
        icon: 'medium',
        value: { min: 1000, max: 2000 },
        next: 'owner_step_4_rent'
      },
      {
        id: 'owner_large',
        label: '2,000 - 5,000 sqft',
        sublabel: 'Fine dining, large retail',
        icon: 'large',
        value: { min: 2000, max: 5000 },
        next: 'owner_step_4_rent'
      },
      {
        id: 'owner_very_large',
        label: '5,000 - 10,000 sqft',
        sublabel: 'Brewery, showroom, gym',
        icon: 'very-large',
        value: { min: 5000, max: 10000 },
        next: 'owner_step_4_rent'
      },
      {
        id: 'owner_mega',
        label: '10,000+ sqft',
        sublabel: 'Anchor store, large facility',
        icon: 'mega',
        value: { min: 10000, max: 999999 },
        next: 'owner_step_4_rent'
      },
      {
        id: 'owner_custom',
        label: 'Custom Size',
        sublabel: 'Enter exact size',
        icon: 'custom',
        value: 'custom',
        next: 'owner_step_3c_custom_size'
      }
    ],
    allowSkip: false,
    layout: 'list'
  },

  owner_step_4_rent: {
    step: 'owner_step_4_rent',
    question: {
      type: 'text',
      content: 'What\'s your expected monthly rent?'
    },
    buttons: [
      {
        id: 'owner_rent_50k_1l',
        label: '₹50K - ₹1L',
        sublabel: 'Small spaces, kiosks',
        icon: 'budget',
        value: { min: 50000, max: 100000 },
        next: 'owner_step_5_features'
      },
      {
        id: 'owner_rent_1_2l',
        label: '₹1L - ₹2L',
        sublabel: 'Small café, boutique',
        icon: 'budget-medium',
        value: { min: 100000, max: 200000 },
        next: 'owner_step_5_features'
      },
      {
        id: 'owner_rent_2_3l',
        label: '₹2L - ₹3L',
        sublabel: 'Medium restaurant, retail',
        icon: 'budget-medium',
        value: { min: 200000, max: 300000 },
        next: 'owner_step_5_features'
      },
      {
        id: 'owner_rent_3_5l',
        label: '₹3L - ₹5L',
        sublabel: 'Restaurant, large retail',
        icon: 'budget-high',
        value: { min: 300000, max: 500000 },
        next: 'owner_step_5_features'
      },
      {
        id: 'owner_rent_5_10l',
        label: '₹5L - ₹10L',
        sublabel: 'Fine dining, brewery',
        icon: 'budget-high',
        value: { min: 500000, max: 1000000 },
        next: 'owner_step_5_features'
      },
      {
        id: 'owner_rent_10_20l',
        label: '₹10L - ₹20L',
        sublabel: 'Premium spaces',
        icon: 'budget-premium',
        value: { min: 1000000, max: 2000000 },
        next: 'owner_step_5_features'
      },
      {
        id: 'owner_rent_20l_plus',
        label: '₹20L+',
        sublabel: 'Large format, anchor',
        icon: 'budget-premium',
        value: { min: 2000000, max: 99999999 },
        next: 'owner_step_5_features'
      },
      {
        id: 'owner_rent_flexible',
        label: 'Flexible / Negotiable',
        sublabel: 'Open to discussion',
        icon: 'flexible',
        value: 'flexible',
        next: 'owner_step_5_features'
      }
    ],
    allowSkip: false,
    layout: 'list'
  },

  owner_step_5_features: {
    step: 'owner_step_5_features',
    question: {
      type: 'text',
      content: 'What features does your property have?',
      subtitle: 'Select all that apply'
    },
    buttons: [
      {
        id: 'owner_parking',
        label: 'Parking Available',
        sublabel: 'Dedicated parking space',
        icon: 'building',
        value: 'parking',
        next: 'owner_step_6_availability'
      },
      {
        id: 'owner_ac',
        label: 'AC / Climate Control',
        sublabel: 'Air conditioning included',
        icon: 'building',
        value: 'ac',
        next: 'owner_step_6_availability'
      },
      {
        id: 'owner_kitchen',
        label: 'Kitchen Setup',
        sublabel: 'Fully equipped kitchen',
        icon: 'kitchen',
        value: 'kitchen',
        next: 'owner_step_6_availability'
      },
      {
        id: 'owner_washroom',
        label: 'Washroom Facilities',
        sublabel: 'Restroom available',
        icon: 'building',
        value: 'washroom',
        next: 'owner_step_6_availability'
      },
      {
        id: 'owner_storage',
        label: 'Storage Space',
        sublabel: 'Additional storage area',
        icon: 'building',
        value: 'storage',
        next: 'owner_step_6_availability'
      },
      {
        id: 'owner_security',
        label: 'Security',
        sublabel: '24/7 security available',
        icon: 'building',
        value: 'security',
        next: 'owner_step_6_availability'
      },
      {
        id: 'owner_elevator',
        label: 'Elevator Access',
        sublabel: 'Elevator available',
        icon: 'building',
        value: 'elevator',
        next: 'owner_step_6_availability'
      },
      {
        id: 'owner_highway',
        label: 'Highway Access',
        sublabel: 'Near main road',
        icon: 'location',
        value: 'highway',
        next: 'owner_step_6_availability'
      }
    ],
    allowSkip: true,
    layout: 'checklist',
    multiSelect: true,
    minSelections: 0,
    maxSelections: 8
  },

  owner_step_6_availability: {
    step: 'owner_step_6_availability',
    question: {
      type: 'text',
      content: 'When is the property available?'
    },
    buttons: [
      {
        id: 'owner_available_now',
        label: 'Available Now',
        sublabel: 'Ready to move in',
        icon: 'urgent',
        value: 'immediate',
        next: 'owner_step_7_confirmation'
      },
      {
        id: 'owner_available_1m',
        label: 'Within 1 month',
        sublabel: 'Available soon',
        icon: 'soon',
        value: '1_month',
        next: 'owner_step_7_confirmation'
      },
      {
        id: 'owner_available_2m',
        label: '1-2 months',
        sublabel: 'Planning phase',
        icon: 'planning',
        value: '2_months',
        next: 'owner_step_7_confirmation'
      },
      {
        id: 'owner_available_3m',
        label: '2-3 months',
        sublabel: 'Early availability',
        icon: 'exploring',
        value: '3_months',
        next: 'owner_step_7_confirmation'
      },
      {
        id: 'owner_available_flexible',
        label: 'Flexible',
        sublabel: 'Open to discussion',
        icon: 'flexible-timeline',
        value: 'flexible',
        next: 'owner_step_7_confirmation'
      }
    ],
    allowSkip: false,
    layout: 'list'
  },

  owner_step_7_confirmation: {
    step: 'owner_step_7_confirmation',
    question: {
      type: 'text',
      content: 'Perfect! Review your property details:'
    },
    buttons: [
      {
        id: 'owner_confirm',
        label: 'Looks Good! List Property',
        value: 'confirm',
        next: 'owner_step_8_listing'
      },
      {
        id: 'owner_edit',
        label: 'Make Changes',
        value: 'edit',
        next: 'owner_edit_menu'
      }
    ],
    allowSkip: false,
    layout: 'list'
  }
}

// All Bangalore locations - comprehensive list (used in step_4_all_locations)
export const ALL_BANGALORE_LOCATIONS = [
  'Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Marathahalli', 'Bellandur',
  'Sarjapur Road', 'MG Road', 'Brigade Road', 'Jayanagar', 'BTM Layout', 'JP Nagar',
  'Electronic City', 'Malleshwaram', 'Yeshwanthpur', 'Rajajinagar', 'Hebbal',
  'Commercial Street', 'Church Street', 'UB City', 'Bannerghatta Road',
  'Manyata Tech Park', 'Vijayanagar', 'Peenya', 'Magadi Road', 'Mysore Road',
  'Richmond Road', 'Lavelle Road', 'Sadashivanagar', 'Basavanagudi', 'RR Nagar',
  'Kengeri', 'Yelahanka', 'Devanahalli', 'Old Madras Road', 'KR Puram'
]

/**
 * Check if a button is recommended for current business type
 */
export function isRecommended(button: ButtonOption, businessType?: BusinessType): boolean {
  if (!button.recommendedFor || !businessType) return false
  return button.recommendedFor.includes(businessType)
}

/**
 * Get next step based on current step and selection
 */
export function getNextStep(currentStep: string, selection: any, state: ButtonFlowState): string {
  const step = FLOW_STEPS[currentStep]
  if (!step) {
    // Default based on entity type
    if (state.data.entityType === 'owner') return 'owner_flow_start'
    return 'step_1_entity_type'
  }

  // Handle special cases for brand flow
  if (currentStep === 'step_4_all_locations') {
    // After selecting locations, go to budget
    return 'step_6_budget_range'
  }

  // Handle special cases for owner flow
  if (currentStep === 'owner_step_2_location') {
    // After selecting locations, go to size
    return 'owner_step_3_size'
  }

  if (currentStep === 'owner_step_5_features') {
    // After selecting features, go to availability
    return 'owner_step_6_availability'
  }

  // Default: use button's next value
  const selectedButton = step.buttons.find(b => b.value === selection || (typeof selection === 'object' && JSON.stringify(b.value) === JSON.stringify(selection)))
  return selectedButton?.next || (state.data.entityType === 'owner' ? 'owner_flow_start' : 'step_1_entity_type')
}

