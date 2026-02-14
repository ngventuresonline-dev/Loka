import { normalizeBudget, normalizeArea, normalizeLocation } from '../normalization'

describe('Normalization Functions', () => {
  describe('normalizeBudget', () => {
    it('should parse "50-100" range format', () => {
      const result = normalizeBudget('50-100')
      
      expect(result.min).toBeDefined()
      expect(result.max).toBeDefined()
      expect(result.unit).toBe('INR')
      expect(result.frequency).toBe('monthly')
    })

    it('should parse "under 80" format', () => {
      const result = normalizeBudget('under 80')
      
      expect(result.min).toBe(0)
      expect(result.max).toBeLessThanOrEqual(80)
      expect(result.unit).toBe('INR')
    })

    it('should parse "5 lakhs" format', () => {
      const result = normalizeBudget('5 lakhs')
      
      expect(result.preferred).toBe(500000)
      expect(result.min).toBeCloseTo(450000, -4) // 0.9 * 500000
      expect(result.max).toBeCloseTo(550000, -4) // 1.1 * 500000
      expect(result.unit).toBe('INR')
      expect(result.frequency).toBe('monthly')
      expect(result.displayValue).toContain('5 lakhs')
    })

    it('should handle "5 lakh" (singular)', () => {
      const result = normalizeBudget('5 lakh')
      
      expect(result.preferred).toBe(500000)
    })

    it('should handle "2.5 lakhs" (decimal)', () => {
      const result = normalizeBudget('2.5 lakhs')
      
      expect(result.preferred).toBe(250000)
    })

    it('should parse "1 crore" format', () => {
      const result = normalizeBudget('1 crore')
      
      expect(result.value).toBe(10000000)
      expect(result.unit).toBe('INR')
      expect(result.frequency).toBe('one-time')
    })

    it('should parse "50K" format', () => {
      const result = normalizeBudget('50K')
      
      expect(result.preferred).toBe(50000)
      expect(result.min).toBeCloseTo(45000, -3)
      expect(result.max).toBeCloseTo(55000, -3)
    })

    it('should handle absolute values', () => {
      const result = normalizeBudget('150000')
      
      expect(result.value || result.preferred).toBeDefined()
    })
  })

  describe('normalizeArea', () => {
    it('should parse "500-1000 sqft" range format', () => {
      const result = normalizeArea('500-1000 sqft')
      
      expect(result.min).toBe(500)
      expect(result.max).toBe(1000)
      expect(result.unit).toBe('sqft')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should parse "500 sqft" format', () => {
      const result = normalizeArea('500 sqft')
      
      expect(result.preferred).toBe(500)
      expect(result.min).toBeCloseTo(450, -1) // 0.9 * 500
      expect(result.max).toBeCloseTo(550, -1) // 1.1 * 500
      expect(result.unit).toBe('sqft')
    })

    it('should convert square meters to sqft', () => {
      const result = normalizeArea('100 sqm')
      
      expect(result.unit).toBe('sqft')
      expect(result.originalUnit).toBe('sqm')
      expect(result.originalValue).toBe(100)
      // 100 sqm * 10.764 = 1076.4 sqft
      expect(result.preferred).toBeCloseTo(1076.4, 0)
    })

    it('should convert acres to sqft', () => {
      const result = normalizeArea('1 acre')
      
      expect(result.unit).toBe('sqft')
      expect(result.originalUnit).toBe('acre')
      // 1 acre = 43560 sqft
      expect(result.preferred).toBeCloseTo(43560, -2)
    })

    it('should handle "1000 square feet" format', () => {
      const result = normalizeArea('1000 square feet')
      
      expect(result.preferred).toBe(1000)
      expect(result.unit).toBe('sqft')
    })

    it('should handle "500 sft" format', () => {
      const result = normalizeArea('500 sft')
      
      expect(result.preferred).toBe(500)
      expect(result.unit).toBe('sqft')
    })
  })

  describe('normalizeLocation', () => {
    it('should extract city from location strings', () => {
      const result = normalizeLocation('Koramangala')
      
      expect(result.official).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should match exact location names', () => {
      const result = normalizeLocation('Koramangala')
      
      expect(result.confidence).toBeGreaterThanOrEqual(0.95)
      expect(result.official).toContain('Koramangala')
    })

    it('should handle location variations', () => {
      const result = normalizeLocation('Koramangala 5th Block')
      
      expect(result.official).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should handle fuzzy matching for typos', () => {
      const result = normalizeLocation('Koramangla') // Missing 'a'
      
      // Should still match with lower confidence
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.matchedVia).toBeDefined()
    })

    it('should return zone information', () => {
      const result = normalizeLocation('Koramangala')
      
      expect(result.zone).toBeDefined()
      expect(result.type).toBeDefined()
    })

    it('should handle partial matches', () => {
      const result = normalizeLocation('HSR')
      
      expect(result.official).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should handle multiple areas in string', () => {
      const result1 = normalizeLocation('Koramangala')
      const result2 = normalizeLocation('Indiranagar')
      
      expect(result1.official).not.toBe(result2.official)
      expect(result1.zone).toBeDefined()
      expect(result2.zone).toBeDefined()
    })
  })
})
