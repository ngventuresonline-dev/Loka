# Test Output Format

## FILE: src/lib/__tests__/matching-engine.test.ts
**TESTS:** calculateBFI() and findMatches() functions
- Perfect match returns score > 0.7
- Budget mismatch handled correctly
- Missing fields don't throw errors
- High visibility scores higher
- Zone matching logic
- Yearly price conversion
- Property filtering and sorting

**RUN:** `npm test -- src/lib/__tests__/matching-engine.test.ts`
**EXPECTED:** All 8 tests pass ✓

---

## FILE: src/lib/ai-search/__tests__/normalization.test.ts
**TESTS:** normalizeBudget(), normalizeArea(), normalizeLocation()
- "50-100" → {min:50, max:100}
- "under 80" → {min:0, max:80}
- "5 lakhs" → {min:500000, max:500000}
- "500-1000 sqft" → {min:500, max:1000}
- Extract city and areas from location strings
- Handle various formats (lakhs, crores, K, sqft, sqm, acres)

**RUN:** `npm test -- src/lib/ai-search/__tests__/normalization.test.ts`
**EXPECTED:** All normalization tests pass ✓

---

## FILE: src/lib/ai-search/__tests__/button-flow.test.ts
**TESTS:** getNextStep() function
- Brand flow progression: welcome→businessType→sizeRange→locations→budget→confirmation
- Owner flow progression: welcome→propertyType→location→size→rent→features→confirmation
- Multi-select locations handling
- Invalid step handling

**RUN:** `npm test -- src/lib/ai-search/__tests__/button-flow.test.ts`
**EXPECTED:** All flow progression tests pass ✓

---

## FILE: src/components/__tests__/PropertyCard.test.tsx
**TESTS:** PropertyCard component rendering and interactions
- Renders address, size, rent correctly
- Shows shortlist button for brands only
- Calls onShortlist when clicked
- Displays images if provided
- BFI score badge display
- Match reasons display
- Availability status

**RUN:** `npm test -- src/components/__tests__/PropertyCard.test.tsx`
**EXPECTED:** All component rendering tests pass ✓

---

## FILE: src/components/__tests__/ButtonFlowModal.test.tsx
**TESTS:** ButtonFlowModal component flow
- Renders welcome step on open
- Progresses when option selected
- Multi-select works for locations
- Shows summary at end
- Saves to localStorage
- Auto-scrolls

**RUN:** `npm test -- src/components/__tests__/ButtonFlowModal.test.tsx`
**EXPECTED:** All modal flow tests pass ✓

---

## FILE: src/components/onboarding/__tests__/BrandOnboardingForm.test.tsx
**TESTS:** BrandOnboardingForm component
- Renders all fields (brandName, category, minArea, maxArea, budgetMax)
- Shows validation errors when empty
- Pre-fills from localStorage
- Submits correctly when valid

**RUN:** `npm test -- src/components/onboarding/__tests__/BrandOnboardingForm.test.tsx`
**EXPECTED:** All form tests pass ✓

---

## FILE: src/app/api/ai-search/__tests__/route.test.ts
**TESTS:** /api/ai-search POST endpoint
- Returns 200 with valid query
- Returns 400 for invalid query
- Detects entity type correctly
- Extracts details from query
- Handles API errors (returns 500)
- Handles missing API key
- Owner redirect handling
- Conversation history parsing

**RUN:** `npm test -- src/app/api/ai-search/__tests__/route.test.ts`
**EXPECTED:** All API endpoint tests pass ✓

---

## FILE: src/app/api/status/__tests__/route.test.ts
**TESTS:** /api/status GET endpoint
- Returns 200 status
- Returns {status:'ok', timestamp}
- System information included
- Check results (Anthropic, Database, Environment)
- Response time included
- Error handling

**RUN:** `npm test -- src/app/api/status/__tests__/route.test.ts`
**EXPECTED:** All status endpoint tests pass ✓

---

## FILE: e2e/brand-onboarding.spec.ts
**TESTS:** Complete brand onboarding journey
1. Navigate to homepage
2. Click register/login
3. Fill form with test-${Date.now()}@lokazen.com
4. Verify redirect to onboarding
5. Fill brand form
6. Submit and verify dashboard
7. Check brand name appears
Also test validation errors

**RUN:** `npm run test:e2e -- e2e/brand-onboarding.spec.ts`
**EXPECTED:** E2E onboarding flow completes successfully ✓

---

## FILE: e2e/property-search.spec.ts
**TESTS:** Property search and shortlisting
Login as brand, then:
1. Open AI search
2. Type "cafe space in Bandra"
3. Verify results load
4. Shortlist first property
5. Check saved properties

**RUN:** `npm run test:e2e -- e2e/property-search.spec.ts`
**EXPECTED:** E2E search flow completes successfully ✓

---

## FILE: e2e/admin-dashboard.spec.ts
**TESTS:** Admin dashboard access
Login as admin, then:
1. Access /admin
2. Verify metrics shown
3. Test export (if exists)
4. Navigate admin sections
5. Verify authentication required

**RUN:** `npm run test:e2e -- e2e/admin-dashboard.spec.ts`
**EXPECTED:** E2E admin flow completes successfully ✓

---

## Overall Test Suite

**RUN:** `npm test`
**EXPECTED:** All unit and component tests pass ✓

**RUN:** `npm run test:coverage`
**EXPECTED:** Coverage report generated, meets 50% threshold (target: 70%) ✓

**RUN:** `npm run test:e2e`
**EXPECTED:** All E2E tests pass (requires dev server running) ✓

**RUN:** `npm run build`
**EXPECTED:** Build succeeds without errors ✓
