// Enhanced types for the GVS workflow system
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  userType: 'brand' | 'owner';
  createdAt: Date;
  profile?: BrandProfile | OwnerProfile;
  onboardingComplete: boolean;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
}

export interface BrandProfile {
  // Contact Information
  email: string;
  phone: string;
  contactPerson: string;
  
  // Basic Information
  companyName: string;
  industry: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  website?: string;
  
  // Location Preferences
  preferredLocations: string[];
  locationFlexibility: 'strict' | 'flexible' | 'very_flexible';
  
  // Budget & Financial
  budgetRange: {
    min: number;
    max: number;
    currency: string;
  };
  leaseLength: 'short_term' | 'medium_term' | 'long_term'; // <1yr, 1-3yr, 3+yr
  
  // Space Requirements
  requirements: {
    minSize: number;
    maxSize: number;
    propertyTypes: Property['propertyType'][];
    mustHaveAmenities: string[];
    niceToHaveAmenities: string[];
  };
  
  // Business Needs
  expectedFootfall: 'low' | 'medium' | 'high';
  targetDemographics: string[];
  operatingHours: string;
  accessibility: boolean;
  
  // CRM Integration
  crmRecord: CRMRecord;
  
  // Matching Score Data
  bfi_score?: number; // Brand Fit Index
  lastMatchUpdate?: Date;
}

export interface OwnerProfile {
  // Contact Information
  name: string;
  email: string;
  phone: string;
  
  // Basic Information
  companyName?: string;
  type: 'individual' | 'company' | 'investor';
  businessLicense?: string;
  experience?: string;
  portfolioSize?: string;
  
  // Portfolio
  properties: Property[];
  totalProperties?: number;
  portfolioValue?: number;
  specializations?: Property['propertyType'][];
  
  // Business Model
  preferredTenantTypes?: string[];
  minimumLeaseLength?: number;
  flexibilityLevel?: 'strict' | 'moderate' | 'flexible';
  
  // CRM Integration
  crmRecord: CRMRecord;
  
  // Matching Score Data
  pfi_score?: number; // Property Fit Index
  lastMatchUpdate?: Date;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  
  // Location Data
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  
  // Property Details
  price: number;
  priceType: 'monthly' | 'yearly' | 'sqft';
  size: number;
  propertyType: 'office' | 'retail' | 'warehouse' | 'restaurant' | 'other';
  condition?: 'excellent' | 'good' | 'fair' | 'needs_renovation';
  securityDeposit?: number;
  rentEscalation?: number;
  
  // Features & Amenities
  amenities: string[];
  images?: string[];
  accessibility?: boolean;
  parking?: boolean;
  publicTransport?: boolean;
  storePowerCapacity?: string;
  powerBackup?: boolean;
  waterFacility?: boolean;
  
  // Business Information
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  isAvailable: boolean;
  availabilityDate?: Date;
  
  // Location Intelligence (Advanced)
  locationIntelligence?: {
    footfallData?: FootfallData;
    demographics?: DemographicData;
    competitors?: CompetitorData[];
    accessibilityScore?: number;
  };
  
  // Matching Scores
  matchingScores?: {
    [brandId: string]: number;
  };
}

// Location Intelligence Types
export interface FootfallData {
  dailyAverage: number;
  peakHours: string[];
  seasonalTrends: {
    month: string;
    multiplier: number;
  }[];
}

export interface DemographicData {
  ageGroups: {
    range: string;
    percentage: number;
  }[];
  incomeLevel: 'low' | 'medium' | 'high' | 'mixed';
  lifestyle: string[];
}

export interface CompetitorData {
  name: string;
  type: string;
  distance: number; // in meters
  category: 'direct' | 'indirect';
}

// Matching System Types
export interface MatchResult {
  id: string;
  brandId: string;
  propertyId: string;
  score: number;
  breakdown: {
    locationMatch: number;
    budgetMatch: number;
    sizeMatch: number;
    amenityMatch: number;
    demographicMatch?: number;
    competitorMatch?: number;
  };
  reasons: string[];
  createdAt: Date;
  status: 'active' | 'viewed' | 'contacted' | 'dismissed';
}

export interface MatchingPreferences {
  weights: {
    location: number;
    budget: number;
    size: number;
    amenities: number;
    demographics: number;
    competitors: number;
  };
  filters: {
    maxDistance?: number;
    strictBudget: boolean;
    strictSize: boolean;
  };
}

// CRM & Communication Types
export interface CRMRecord {
  id: string;
  userId: string;
  userType: 'brand' | 'owner';
  activity: 'onboarding' | 'match_generated' | 'match_viewed' | 'contact_made' | 'deal_closed';
  details: Record<string, any>;
  timestamp: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'match_found' | 'profile_updated' | 'contact_request' | 'system_update';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// Payment & Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate?: Date;
  features: string[];
  matchesPerMonth: number;
  currentMatches: number;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  createdAt: Date;
}
