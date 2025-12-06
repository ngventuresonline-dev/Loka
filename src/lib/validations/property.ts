/**
 * Zod validation schemas for Property operations
 */

import { z } from 'zod'

// Property type enum
export const PropertyTypeEnum = z.enum([
  'retail',
  'restaurant',
  'qsr',
  'office',
  'kiosk',
  'commercial',
  'warehouse',
  'mixed_use',
  'other',
])

// Condition enum
export const ConditionEnum = z.enum([
  'excellent',
  'good',
  'fair',
  'needs-renovation',
])

// Price type enum
export const PriceTypeEnum = z.enum(['monthly', 'yearly', 'one-time'])

// Create Property Schema
export const CreatePropertySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  
  // Location
  address: z.string().min(5, 'Address must be at least 5 characters').max(500, 'Address too long'),
  city: z.string().min(2, 'City required').max(100, 'City name too long'),
  state: z.string().min(2, 'State required').max(100, 'State name too long'),
  country: z.string().default('India'),
  zipCode: z.string().min(5, 'ZIP code required').max(20, 'ZIP code too long'),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  
  // Property Details
  size: z.number().int().positive('Size must be positive').max(10000000, 'Size too large'),
  propertyType: PropertyTypeEnum,
  condition: ConditionEnum,
  
  // Pricing
  price: z.number().positive('Price must be positive').max(1000000000, 'Price too large'),
  priceType: PriceTypeEnum,
  securityDeposit: z.number().positive().optional().nullable(),
  negotiable: z.boolean().default(true),
  
  // Amenities & Features
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url('Invalid image URL')).default([]),
  
  // Availability
  availability: z.boolean().default(true),
  availableFrom: z.string().datetime().optional().nullable(),
  isVerified: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  
  // Accessibility
  parking: z.boolean().default(false),
  publicTransport: z.boolean().default(false),
  accessibility: z.boolean().default(false),
  
  // Owner (will be set from auth)
  ownerId: z.string().optional(), // Will be set from authenticated user
})

// Update Property Schema (all fields optional)
export const UpdatePropertySchema = CreatePropertySchema.partial().extend({
  id: z.string().optional(), // Don't allow updating ID
  ownerId: z.string().optional(), // Don't allow changing owner
  createdAt: z.any().optional(), // Don't allow updating timestamps
  updatedAt: z.any().optional(),
})

// Property Query/Filter Schema
export const PropertyQuerySchema = z.object({
  // Pagination
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  
  // Filters
  city: z.string().optional(),
  state: z.string().optional(),
  propertyType: PropertyTypeEnum.optional(),
  minSize: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  maxSize: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  minPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  priceType: PriceTypeEnum.optional(),
  availability: z.string().optional().transform((val) => val === 'true'),
  isVerified: z.string().optional().transform((val) => val === 'true'),
  isFeatured: z.string().optional().transform((val) => val === 'true'),
  parking: z.string().optional().transform((val) => val === 'true'),
  publicTransport: z.string().optional().transform((val) => val === 'true'),
  accessibility: z.string().optional().transform((val) => val === 'true'),
  
  // Search
  search: z.string().optional(), // Full-text search
  
  // Sort
  sortBy: z.enum(['price', 'size', 'createdAt', 'views', 'relevance']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  
  // Owner filter
  ownerId: z.string().optional(),
})

// Type exports
export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>
export type PropertyQueryInput = z.infer<typeof PropertyQuerySchema>

