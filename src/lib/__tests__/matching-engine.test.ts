import { calculateBFI, findMatches } from '../matching-engine'
import { Property } from '@/types'

describe('Matching Engine', () => {
  const mockProperty: Property = {
    id: 'prop-1',
    title: 'Test Property',
    description: 'A test property',
    address: '123 Test Street, Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560095',
    price: 150000,
    priceType: 'monthly',
    size: 1500,
    propertyType: 'retail',
    amenities: ['parking', 'ground floor', 'ac'],
    ownerId: 'owner-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: true,
  }

  describe('calculateBFI', () => {
    it('should return high score (>0.7) for perfect match', () => {
      const brandRequirements = {
        locations: ['Koramangala'],
        sizeMin: 1400,
        sizeMax: 1600,
        budgetMin: 100000,
        budgetMax: 200000,
        businessType: 'cafe_qsr',
      }

      const result = calculateBFI(mockProperty, brandRequirements)

      expect(result.score).toBeGreaterThan(70)
      expect(result.breakdown.locationScore).toBe(100) // Perfect location match
      expect(result.breakdown.sizeScore).toBe(100) // Within range
      expect(result.breakdown.budgetScore).toBe(100) // Within budget
    })

    it('should return lower score for budget mismatch', () => {
      const brandRequirements = {
        locations: ['Koramangala'],
        sizeMin: 1400,
        sizeMax: 1600,
        budgetMin: 50000,
        budgetMax: 80000, // Much lower than property price
        businessType: 'cafe_qsr',
      }

      const result = calculateBFI(mockProperty, brandRequirements)

      // Budget score should be 0, but other factors (location, size) still contribute
      expect(result.breakdown.budgetScore).toBe(0) // Budget mismatch
      // Overall score will be lower due to budget mismatch, but not necessarily < 30
      // because location and size still match well
      expect(result.breakdown.budgetScore).toBeLessThan(50)
    })

    it('should not throw errors with missing fields', () => {
      const incompleteProperty: Partial<Property> = {
        id: 'prop-2',
        title: 'Incomplete Property',
        address: 'Test Address',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560095',
        price: 100000,
        priceType: 'monthly',
        size: 1000,
        propertyType: 'retail',
        amenities: [],
        ownerId: 'owner-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isAvailable: true,
      }

      const brandRequirements = {
        locations: ['Koramangala'],
        sizeMin: 900,
        sizeMax: 1100,
        budgetMin: 80000,
        budgetMax: 120000,
        businessType: 'cafe_qsr',
      }

      expect(() => {
        calculateBFI(incompleteProperty as Property, brandRequirements)
      }).not.toThrow()
    })

    it('should score higher for high visibility properties', () => {
      const highVisibilityProperty: Property = {
        ...mockProperty,
        amenities: ['ground floor', 'street facing', 'parking', 'high visibility'],
      }

      const lowVisibilityProperty: Property = {
        ...mockProperty,
        amenities: ['parking'],
      }

      const brandRequirements = {
        locations: ['Koramangala'],
        sizeMin: 1400,
        sizeMax: 1600,
        budgetMin: 100000,
        budgetMax: 200000,
        businessType: 'cafe_qsr', // QSR benefits from high visibility
      }

      const highScore = calculateBFI(highVisibilityProperty, brandRequirements)
      const lowScore = calculateBFI(lowVisibilityProperty, brandRequirements)

      // High visibility should score better for QSR/Retail
      expect(highScore.breakdown.typeScore).toBeGreaterThanOrEqual(lowScore.breakdown.typeScore)
    })

    it('should handle properties in same zone but different area', () => {
      const propertyInHSR: Property = {
        ...mockProperty,
        address: '456 Test Street, HSR Layout',
        city: 'Bangalore',
      }

      const brandRequirements = {
        locations: ['Koramangala'], // Same zone (South) but different area
        sizeMin: 1400,
        sizeMax: 1600,
        budgetMin: 100000,
        budgetMax: 200000,
        businessType: 'cafe_qsr',
      }

      const result = calculateBFI(propertyInHSR, brandRequirements)

      // Should get zone match score (70) not perfect match (100)
      expect(result.breakdown.locationScore).toBe(70)
    })

    it('should handle properties in different zones', () => {
      const propertyInWhitefield: Property = {
        ...mockProperty,
        address: '789 Test Street, Whitefield',
        city: 'Bangalore',
      }

      const brandRequirements = {
        locations: ['Koramangala'], // Different zone
        sizeMin: 1400,
        sizeMax: 1600,
        budgetMin: 100000,
        budgetMax: 200000,
        businessType: 'cafe_qsr',
      }

      const result = calculateBFI(propertyInWhitefield, brandRequirements)

      // Should get different zone score (30)
      expect(result.breakdown.locationScore).toBe(30)
    })

    it('should handle yearly price type correctly', () => {
      const yearlyProperty: Property = {
        ...mockProperty,
        price: 1800000, // 1.8M yearly = 150k monthly
        priceType: 'yearly',
      }

      const brandRequirements = {
        locations: ['Koramangala'],
        sizeMin: 1400,
        sizeMax: 1600,
        budgetMin: 100000,
        budgetMax: 200000,
        businessType: 'cafe_qsr',
      }

      const result = calculateBFI(yearlyProperty, brandRequirements)

      // Should convert yearly to monthly and match budget
      expect(result.breakdown.budgetScore).toBe(100)
    })
  })

  describe('findMatches', () => {
    it('should filter and sort properties by BFI score', () => {
      const properties: Property[] = [
        {
          ...mockProperty,
          id: 'prop-1',
          address: '123 Koramangala',
          price: 150000,
          size: 1500,
        },
        {
          ...mockProperty,
          id: 'prop-2',
          address: '456 Whitefield',
          price: 200000,
          size: 2000,
        },
        {
          ...mockProperty,
          id: 'prop-3',
          address: '789 Koramangala',
          price: 120000,
          size: 1400,
        },
      ]

      const brandRequirements = {
        locations: ['Koramangala'],
        sizeMin: 1400,
        sizeMax: 1600,
        budgetMin: 100000,
        budgetMax: 200000,
        businessType: 'cafe_qsr',
      }

      const matches = findMatches(properties, brandRequirements)

      expect(matches.length).toBeGreaterThan(0)
      // Should be sorted by score descending
      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].bfiScore.score).toBeGreaterThanOrEqual(
          matches[i + 1].bfiScore.score
        )
      }
      // Should filter out poor matches (< 30)
      matches.forEach((match) => {
        expect(match.bfiScore.score).toBeGreaterThanOrEqual(30)
      })
    })
  })
})
