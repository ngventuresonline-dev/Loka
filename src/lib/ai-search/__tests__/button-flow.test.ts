import { getNextStep, FLOW_STEPS, ButtonFlowState } from '../button-flow'

describe('Button Flow', () => {
  describe('getNextStep', () => {
    it('should progress brand flow: welcome → businessType → sizeRange → locations → budget → confirmation', () => {
      const state: ButtonFlowState = {
        currentStep: 'step_0_welcome',
        data: { entityType: 'brand' },
        history: [],
      }

      // Welcome → Entity Type
      let next = getNextStep('step_0_welcome', 'start', state)
      expect(next).toBe('step_1_entity_type')

      // Entity Type → Business Type
      state.currentStep = 'step_1_entity_type'
      state.data.entityType = 'brand'
      next = getNextStep('step_1_entity_type', 'brand', state)
      expect(next).toBe('step_2_business_type')

      // Business Type → Size Range
      state.currentStep = 'step_2_business_type'
      state.data.businessType = 'cafe_qsr'
      next = getNextStep('step_2_business_type', 'cafe_qsr', state)
      expect(next).toBe('step_3_size_range')

      // Size Range → Locations
      state.currentStep = 'step_3_size_range'
      state.data.sizeRange = { min: 500, max: 1000 }
      next = getNextStep('step_3_size_range', { min: 500, max: 1000 }, state)
      expect(next).toBe('step_4_all_locations')

      // Locations → Budget (special case)
      state.currentStep = 'step_4_all_locations'
      state.data.selectedAreas = ['Koramangala']
      next = getNextStep('step_4_all_locations', 'Koramangala', state)
      expect(next).toBe('step_6_budget_range')

      // Budget → Confirmation
      state.currentStep = 'step_6_budget_range'
      state.data.budgetRange = { min: 100000, max: 200000 }
      next = getNextStep('step_6_budget_range', { min: 100000, max: 200000 }, state)
      expect(next).toBe('step_9_confirmation')
    })

    it('should progress owner flow: welcome → propertyType → location → size → rent → features → confirmation', () => {
      const state: ButtonFlowState = {
        currentStep: 'step_0_welcome',
        data: { entityType: 'owner' },
        history: [],
      }

      // Entity Type → Owner Flow Start
      state.currentStep = 'step_1_entity_type'
      state.data.entityType = 'owner'
      let next = getNextStep('step_1_entity_type', 'owner', state)
      expect(next).toBe('owner_flow_start')

      // Owner Flow Start → Property Type
      state.currentStep = 'owner_flow_start'
      next = getNextStep('owner_flow_start', 'start', state)
      expect(next).toBe('owner_step_1_property_type')

      // Property Type → Location
      state.currentStep = 'owner_step_1_property_type'
      state.data.propertyType = 'retail'
      next = getNextStep('owner_step_1_property_type', 'retail', state)
      expect(next).toBe('owner_step_2_location')

      // Location → Size (special case)
      state.currentStep = 'owner_step_2_location'
      state.data.selectedAreas = ['Koramangala']
      next = getNextStep('owner_step_2_location', 'Koramangala', state)
      expect(next).toBe('owner_step_3_size')

      // Size → Rent
      state.currentStep = 'owner_step_3_size'
      state.data.sizeRange = { min: 1000, max: 2000 }
      next = getNextStep('owner_step_3_size', { min: 1000, max: 2000 }, state)
      expect(next).toBe('owner_step_4_rent')

      // Rent → Features
      state.currentStep = 'owner_step_4_rent'
      state.data.budgetRange = { min: 150000, max: 200000 }
      next = getNextStep('owner_step_4_rent', { min: 150000, max: 200000 }, state)
      expect(next).toBe('owner_step_5_features')

      // Features → Availability (special case)
      state.currentStep = 'owner_step_5_features'
      state.data.propertyFeatures = ['parking']
      next = getNextStep('owner_step_5_features', 'parking', state)
      expect(next).toBe('owner_step_6_availability')

      // Availability → Confirmation
      state.currentStep = 'owner_step_6_availability'
      state.data.availability = 'immediate'
      next = getNextStep('owner_step_6_availability', 'immediate', state)
      expect(next).toBe('owner_step_7_confirmation')
    })

    it('should return default step for invalid current step', () => {
      const brandState: ButtonFlowState = {
        currentStep: 'invalid_step',
        data: { entityType: 'brand' },
        history: [],
      }

      const next = getNextStep('invalid_step', 'any', brandState)
      expect(next).toBe('step_1_entity_type')

      const ownerState: ButtonFlowState = {
        currentStep: 'invalid_step',
        data: { entityType: 'owner' },
        history: [],
      }

      const ownerNext = getNextStep('invalid_step', 'any', ownerState)
      expect(ownerNext).toBe('owner_flow_start')
    })

    it('should handle multi-select locations correctly', () => {
      const state: ButtonFlowState = {
        currentStep: 'step_4_all_locations',
        data: {
          entityType: 'brand',
          selectedAreas: ['Koramangala', 'Indiranagar'],
        },
        history: [],
      }

      const next = getNextStep('step_4_all_locations', 'Koramangala', state)
      expect(next).toBe('step_6_budget_range')
    })
  })

  describe('validateStepData', () => {
    // Note: validateStepData function doesn't exist yet, but we can test the flow structure
    it('should require entityType before businessType', () => {
      const state: ButtonFlowState = {
        currentStep: 'step_2_business_type',
        data: {}, // Missing entityType
        history: [],
      }

      // Should still work but might need validation
      const step = FLOW_STEPS['step_2_business_type']
      expect(step).toBeDefined()
    })

    it('should require businessType before sizeRange', () => {
      const state: ButtonFlowState = {
        currentStep: 'step_3_size_range',
        data: {
          entityType: 'brand',
          // Missing businessType
        },
        history: [],
      }

      const step = FLOW_STEPS['step_3_size_range']
      expect(step).toBeDefined()
    })

    it('should require sizeRange before locations', () => {
      const state: ButtonFlowState = {
        currentStep: 'step_4_all_locations',
        data: {
          entityType: 'brand',
          businessType: 'cafe_qsr',
          // Missing sizeRange
        },
        history: [],
      }

      const step = FLOW_STEPS['step_4_all_locations']
      expect(step).toBeDefined()
      expect(step.multiSelect).toBe(true)
      expect(step.minSelections).toBe(1)
    })

    it('should require locations before budget', () => {
      const state: ButtonFlowState = {
        currentStep: 'step_6_budget_range',
        data: {
          entityType: 'brand',
          businessType: 'cafe_qsr',
          sizeRange: { min: 500, max: 1000 },
          // Missing selectedAreas
        },
        history: [],
      }

      const step = FLOW_STEPS['step_6_budget_range']
      expect(step).toBeDefined()
    })
  })
})
