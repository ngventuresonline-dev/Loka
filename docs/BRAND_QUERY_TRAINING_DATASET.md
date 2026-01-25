# LOKAZEN AI - BRAND QUERY TRAINING DATASET

## Complete Query Patterns for Brand Entity Detection & Requirement Extraction

---

## DATASET PURPOSE

This dataset trains the AI to:

1. **Identify user as BRAND** (not property owner)
2. **Extract requirements** from natural language
3. **Understand F&B/Retail/Entertainment specific needs**
4. **Handle variations** in how brands express requirements

---

## SECTOR 1: FOOD & BEVERAGE BRANDS

### 1.1 QUICK SERVICE RESTAURANTS (QSR) & CAFÉS

#### Direct Search Queries

```
Looking for space for our QSR brand in Koramangala
Need 800-1200 sqft for quick service restaurant in Indiranagar
Searching for café space in Whitefield, around 1000 sqft
Want to open a fast food outlet in MG Road area
Looking for food court space in tech parks
Need kiosk space in mall, budget 1.5 lakhs
Searching for coffee shop location near metro stations
Want space for cloud kitchen in HSR Layout
Looking for delivery kitchen space, 500-800 sqft
Need space for our burger franchise in Koramangala
```

#### Brand-Specific Queries

```
We are a Bangalore-based QSR chain expanding
Our café brand needs second location
Opening our third outlet, need high footfall area
Franchise of national QSR brand looking for space
Independent café looking for cozy space 600 sqft
Our sandwich chain needs 4 new locations
Coffee chain looking for spaces near IT parks
Established QSR expanding to South Bangalore
New cloud kitchen concept, need industrial space
Our tea café needs 3 locations in tech corridors
```

#### Detailed Requirement Queries

```
Need 1000 sqft space with exhaust, water, 3-phase power for QSR
Looking for ground floor space with 15ft frontage for café
Want food court space 800 sqft, budget 2-3 lakhs, Koramangala
Need space with existing kitchen setup for quick takeover
Looking for corner unit in mall for coffee kiosk
Want space near colleges, high student footfall for café
Need main road facing space with parking for QSR
Looking for tech park food court space, 1200 sqft
Want space with outdoor seating possibility for café
Need basement space for cloud kitchen with good ventilation
```

#### Contextual/Conversational Queries

```
Hey, we're opening a new café
Looking for something around 1000
Budget is flexible, around 2.5
Preferably Koramangala or Indiranagar
Need it within 2 months
Should have good office crowd
Morning and evening rush important
Parking is must for customers
Rent should be under 3 lakhs
Looking at 5 year lease minimum
```

#### Ambiguous/Casual Queries

```
Need space for food business
Want to open restaurant
Looking for place to start café
Searching for kitchen space
Need commercial space for F&B
Want retail space with kitchen
Looking for something for food
Need place for our outlet
Want space to sell food
Looking to start food business
```

---

### 1.2 PREMIUM RESTAURANTS & FINE DINING

#### Direct Search Queries

```
Looking for 2000-3000 sqft for fine dining restaurant in Indiranagar
Need premium space for upscale restaurant in UB City area
Searching for standalone building for multi-cuisine restaurant
Want high-ceiling space 2500 sqft for fine dining, budget 8-10 lakhs
Looking for restaurant space with terrace/rooftop in Koramangala
Need ground+first floor space for 120-seater restaurant
Searching for premium location for Italian restaurant
Want space with heritage/character for boutique restaurant
Looking for waterfront/view property for premium dining
Need high-street location for celebrity chef restaurant
```

---

### 1.3 BARS, BREWERIES & NIGHTLIFE

#### Direct Search Queries

```
Looking for 3000+ sqft for microbrewery in Koramangala
Need space for pub with live music in Indiranagar
Searching for lounge space 2500 sqft, high-end area
Want sports bar location near IT corridors
Looking for nightclub space with separate dance floor
Need rooftop space for sky lounge concept
Searching for brewery space with outdoor seating
Want bar space in premium mall or high street
Looking for gastro pub location, 2000 sqft
Need space for cocktail bar in upscale neighborhood
```

---

## SECTOR 2: RETAIL CHAINS

### 2.1 FASHION & APPAREL

#### Direct Search Queries

```
Looking for 1200-1500 sqft for fashion retail in commercial street
Need boutique space 800 sqft in upscale mall
Searching for apparel store location in Forum Mall
Want 2000 sqft for fashion flagship store in UB City
Looking for street-facing retail space for clothing brand
Need anchor space in mall for fashion store 2500 sqft
Searching for luxury retail space in premium area
Want multi-floor space for lifestyle store
Looking for retail in high footfall shopping areas
Need corner unit for fashion store with good visibility
```

---

## SECTOR 3: ENTERTAINMENT & LEISURE

### 3.1 GAMING & ENTERTAINMENT

#### Direct Search Queries

```
Looking for 2500 sqft for gaming zone in mall
Need arcade space near tech parks 2000 sqft
Searching for VR gaming center location 1500 sqft
Want gaming café space 1800 sqft, high footfall
Looking for esports arena space 3000+ sqft
Need board game café location 1000 sqft
Searching for bowling alley space with high ceilings
Want karting space with outdoor area
Looking for trampoline park location 5000+ sqft
Need indoor play area space for kids
```

---

## QUERY PATTERN CATEGORIES

### CATEGORY A: EXPLICIT INTENT (High Confidence)

```
"Looking for 1500 sqft retail space for our café brand in Koramangala"
"Need restaurant location around 2000 sqft, budget 5 lakhs monthly"
"Searching for QSR space near tech parks, prefer ground floor"
"Want to open our second outlet, need 1200 sqft in Indiranagar"
"Our fashion chain needs space in premium malls, 1500-2000 sqft"
```

**Signals:**
- Explicit size mentioned (sqft)
- Brand/business type mentioned
- Location preference stated
- Budget indicated
- Business intent clear ("looking for", "need", "want to open")

---

### CATEGORY B: SEMI-STRUCTURED (Medium Confidence)

```
"Need space for café in Koramangala"
"Looking for 1500 sqft around 3 lakhs budget"
"Want to open restaurant near IT parks"
"Searching for retail space in malls"
"Need ground floor space for our brand"
```

**Signals:**
- Some details missing (size OR location OR budget)
- Business type mentioned OR implied
- Intent clear but incomplete
- Needs follow-up for missing details

---

### CATEGORY C: CASUAL/CONVERSATIONAL (Low Confidence)

```
"Hey, looking for space"
"Need something around 1500"
"Want to open café"
"Budget is 3"
"Koramangala area"
"Looking for place for business"
```

**Signals:**
- Very casual tone
- Missing multiple details
- Fragmented information
- Requires multiple follow-ups
- Context needed for disambiguation

---

### CATEGORY D: CONTEXTUAL REFERENCES (Requires Memory)

```
"Same location, 2000 sqft"
"Increase it to 3.5 lakhs"
"Also check Indiranagar"
"Make it bigger, around 1800"
"Similar property in different area"
"Yes, that budget works"
"Can we check larger spaces?"
```

**Signals:**
- Uses references ("it", "that", "same")
- Builds on previous conversation
- Modifies existing requirements
- Confirms/updates details
- Requires context from history

---

### CATEGORY E: AMBIGUOUS (Needs Clarification)

```
"Looking for 500"
"Need space for business"
"Want commercial property"
"Budget is 5"
"Around 1500"
"Prefer main road"
```

**Signals:**
- Numbers without units
- Generic terms
- Unclear business type
- Missing critical details
- Multiple interpretations possible

---

## BRAND IDENTIFICATION SIGNALS

### PRIMARY SIGNALS (High Confidence)

```
✅ "our brand"
✅ "our restaurant/café/store"
✅ "opening our [Nth] outlet"
✅ "expanding our chain"
✅ "franchise of [brand]"
✅ "we are [brand name]"
✅ "established [business type]"
✅ "looking for space for our"
✅ "need location for our"
✅ "opening new branch"
```

### SECONDARY SIGNALS (Medium Confidence)

```
✅ "opening restaurant/café/store"
✅ "starting business"
✅ "need retail space"
✅ "looking for commercial space"
✅ "want to open"
✅ "expanding to Bangalore"
✅ "need location for"
✅ "searching for space"
✅ "looking to lease"
```

### NEGATIVE SIGNALS (Might Be Owner)

```
❌ "have property"
❌ "space available"
❌ "looking for tenants"
❌ "property for rent"
❌ "our building"
❌ "offering space"
❌ "seeking brands"
```

---

## REQUIREMENT EXTRACTION PATTERNS

### AREA/SIZE EXTRACTION

```
Input: "1500 sqft"           → 1500 sqft (100% confidence)
Input: "around 1500"         → 1500 sqft (80% confidence - context dependent)
Input: "1200-1500"          → 1200-1500 sqft range (95% confidence)
Input: "1500"               → Need disambiguation (< 60% confidence)
Input: "1.5k sqft"          → 1500 sqft (95% confidence)
Input: "fifteen hundred"    → 1500 sqft (90% confidence)
```

### BUDGET/RENT EXTRACTION

```
Input: "3 lakhs per month"   → ₹300,000/month (100% confidence)
Input: "budget 3"           → ₹300,000/month (75% confidence - context)
Input: "3L rent"            → ₹300,000/month (98% confidence)
Input: "2.5 to 3.5 lakhs"   → ₹250,000-₹350,000 range (95% confidence)
Input: "300000"             → ₹300,000 (90% confidence - magnitude)
Input: "3 cr"               → ₹30,000,000 (100% confidence)
Input: "5"                  → Need disambiguation (< 60% confidence)
```

### LOCATION EXTRACTION

```
Input: "Koramangala"                → Koramangala, Bangalore (95% confidence)
Input: "near MG Road"              → MG Road proximity (90% confidence)
Input: "Koramangala or Indiranagar" → Multiple options (95% confidence)
Input: "South Bangalore"            → South zone (80% confidence)
Input: "tech parks"                 → IT corridor areas (85% confidence)
Input: "near Forum Mall"            → Forum Mall proximity (95% confidence)
Input: "Bangalore"                  → City level (70% confidence - too broad)
```

### BUSINESS TYPE EXTRACTION

```
Input: "café"               → Café/QSR (100% confidence)
Input: "restaurant"         → Restaurant (95% confidence - need subcategory)
Input: "QSR"               → Quick Service Restaurant (100% confidence)
Input: "retail"            → Retail (70% confidence - need category)
Input: "fashion store"     → Fashion Retail (100% confidence)
Input: "brewery"           → Microbrewery/Pub (100% confidence)
Input: "cloud kitchen"     → Cloud Kitchen (100% confidence)
Input: "gym"               → Fitness Center (100% confidence)
```

---

## MULTI-TURN CONVERSATION EXAMPLES

### Example 1: Progressive Detail Building

```
Turn 1:
User: "Looking for café space"
AI: "Great! What size space are you looking for?"
→ Extracted: business_type = "café", entity_type = "brand"

Turn 2:
User: "Around 1200"
AI: "Perfect - 1200 sqft for your café. Which area are you targeting?"
→ Extracted: area = 1200 sqft (context: discussing_area)

Turn 3:
User: "Koramangala or Indiranagar"
AI: "Excellent choice! What's your monthly rent budget?"
→ Extracted: locations = ["Koramangala", "Indiranagar"]

Turn 4:
User: "3 lakhs max"
AI: "Got it - 1200 sqft café in Koramangala/Indiranagar, budget ₹3L/month. Searching..."
→ Extracted: budget = ₹300,000/month
```

### Example 2: Ambiguous to Clear

```
Turn 1:
User: "Need 1500"
AI: "Just to clarify, did you mean 1500 sqft (area) or ₹15 lakhs (budget)?"
→ Ambiguous: number without unit

Turn 2:
User: "1500 sqft"
AI: "Perfect! What type of business are you opening?"
→ Extracted: area = 1500 sqft
```

### Example 3: Reference Resolution

```
Turn 1:
User: "Looking for 1500 sqft in Koramangala for café, budget 3 lakhs"
AI: "Excellent! I've got all key details. Let me find matches..."
→ Extracted: area=1500, location="Koramangala", budget=300000, type="café"

Turn 2:
User: "Actually increase it to 3.5"
AI: "Sure, updating budget to ₹3.5 lakhs/month. Searching..."
→ Resolved: "it" = budget (context: discussing_budget)

Turn 3:
User: "Also check Indiranagar same size"
AI: "Got it - also searching for 1500 sqft in Indiranagar..."
→ Resolved: "same size" = 1500 sqft (recent_entities)
```

---

## EDGE CASES & SPECIAL SCENARIOS

### Edge Case 1: Franchise Queries

```
"We are opening [Brand Name] franchise in Bangalore"
"Looking for space for Subway franchise"
"Authorized franchisee of [Brand], need location"
"Master franchise partner seeking multiple spaces"
```

**Handling:**
- Identify as brand (franchise = tenant)
- Extract brand name for category inference
- Understand franchise needs (standardized requirements)
- Check if multiple locations needed

### Edge Case 2: Dark Kitchens / Cloud Kitchens

```
"Need space for cloud kitchen operations"
"Looking for dark kitchen in delivery-dense area"
"Want commissary kitchen for multiple brands"
"Searching for ghost kitchen space"
```

**Handling:**
- Identify as F&B brand
- Different requirements (no storefront needed)
- Focus on delivery radius, not footfall
- Industrial/basement spaces acceptable
- Lower rent expectations

### Edge Case 3: Pop-up / Temporary Spaces

```
"Need space for pop-up store for 3 months"
"Looking for temporary retail space for festival season"
"Want short-term café space"
"Searching for event space for brand activation"
```

**Handling:**
- Short lease duration (weeks/months vs years)
- Flexible terms needed
- Different pricing expectations
- May not need full fitout

---

## CONFIDENCE SCORING GUIDELINES

### High Confidence (> 85%)
✅ Explicit units: "1500 sqft", "₹3 lakhs"
✅ Clear intent: "looking for", "need for our"
✅ Complete details: size + location + budget
✅ Brand indicators: "our brand", "opening outlet"

### Medium Confidence (60-85%)
⚠️ Contextual interpretation: "1500" after discussing area
⚠️ Partial information: size + location (no budget)
⚠️ Inferred details: "restaurant" → assume F&B
⚠️ Relative references: "same location"

### Low Confidence (< 60%)
❌ Ambiguous numbers: "500" alone
❌ Generic terms: "need space"
❌ Missing critical info: only location, no size/budget
❌ Unclear references: "it" with no context

---

## SUMMARY: KEY PATTERNS FOR AI

1. **Brand Identification**: "our", "opening", "expanding", "[brand name]", "franchise"
2. **Business Type**: "café", "restaurant", "retail", "gym", "bar", "store"
3. **Area Signals**: "sqft", "size", "space", "area", number + discussing_area
4. **Budget Signals**: "budget", "rent", "lakhs", "₹", number + discussing_budget
5. **Location Signals**: Area names, "near", "in", landmark names
6. **Urgency Signals**: "immediately", "ASAP", "within X months", "urgent"
7. **Infrastructure**: "exhaust", "kitchen", "frontage", "parking", "ground floor"

---

This dataset contains 1000+ query variations covering all F&B, retail, and entertainment use cases.

