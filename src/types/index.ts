export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  priceType: 'monthly' | 'yearly' | 'sqft';
  securityDeposit?: number; // Security deposit amount
  rentEscalation?: number; // Annual rent escalation percentage
  size: number; // in sq ft
  propertyType: 'office' | 'retail' | 'warehouse' | 'restaurant' | 'other';
  amenities: string[];
  // Power & Utilities
  storePowerCapacity?: string; // e.g., "10 KW", "25 KW"
  powerBackup?: boolean;
  waterFacility?: boolean;
  images?: string[];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  isAvailable: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  userType: 'brand' | 'owner';
  createdAt: Date;
  profile?: BrandProfile | OwnerProfile;
}

export interface BrandProfile {
  companyName: string;
  industry: string;
  preferredLocations: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  requirements: {
    minSize: number;
    maxSize: number;
    propertyTypes: Property['propertyType'][];
    mustHaveAmenities: string[];
  };
}

export interface OwnerProfile {
  companyName?: string;
  licenseNumber?: string;
  totalProperties: number;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  brandId: string;
  ownerId: string;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  createdAt: Date;
  responses: InquiryResponse[];
}

export interface InquiryResponse {
  id: string;
  inquiryId: string;
  senderId: string;
  message: string;
  createdAt: Date;
}
