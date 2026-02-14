# LOKAZEN AI - PROPERTY OWNER QUERY TRAINING DATASET

## Owner vs Brand Distinction Training

---

## PURPOSE

Train AI to differentiate:
- **BRANDS** (seeking space - tenants) 
- **OWNERS** (offering space - landlords)

This prevents confusion and ensures correct entity classification.

---

## PROPERTY OWNER QUERY PATTERNS

### Pattern 1: Explicit Ownership Declaration

```
"I have 1500 sqft property available in Koramangala"
"We own a commercial space for rent"
"Our building has 2000 sqft available"
"Property owner looking for tenants"
"Have space for lease in Indiranagar"
"Commercial property available for rent"
"We are property owners seeking brands"
"Landlord looking for F&B tenants"
"Have retail space to offer"
"Property for rent in tech park"
```

**Signals:**
- "have property/space"
- "own", "owned by"
- "available for rent/lease"
- "landlord", "lessor", "property owner"
- "looking for tenants"
- "space to offer"

---

### Pattern 2: Offering Space

```
"Space available in Forum Mall"
"Retail space for lease 1200 sqft"
"Restaurant space available with kitchen"
"Commercial property seeking F&B brands"
"Looking for restaurant brands for our property"
"Seeking retail chains for mall space"
"Have 2000 sqft looking for café brands"
"Property available for established brands"
"Space for rent to QSR chains"
"Looking for brands to lease our space"
```

**Signals:**
- "[space/property] available"
- "[space/property] for lease/rent"
- "seeking brands/tenants"
- "looking for [brand type]"

---

### Pattern 3: Property Details (Owner Perspective)

```
"1500 sqft property with 3-phase power available"
"Ground floor space with parking for rent"
"Mall space near anchor tenant available"
"Property with existing kitchen setup for lease"
"Commercial building space seeking tenants"
"Have corner unit in premium location"
"Property with good footfall for rent"
"Space with all amenities looking for tenant"
```

**Signals:**
- Describing what THEY have (not what they need)
- "with" + amenities (offering, not requesting)
- Focus on property features, not business requirements

---

## CRITICAL DISTINCTIONS

### BRAND (Seeking) vs OWNER (Offering)

| Query | Entity Type | Reasoning |
|-------|-------------|-----------|
| "Looking for 1500 sqft space" | BRAND | Seeking space |
| "Have 1500 sqft space available" | OWNER | Offering space |
| "Need restaurant location" | BRAND | Need = seeking |
| "Looking for restaurant brands" | OWNER | Looking for tenants |
| "Our café needs space" | BRAND | Business needs space |
| "Our property needs tenant" | OWNER | Property needs tenant |
| "Want to open store" | BRAND | Opening = need space |
| "Want to rent out space" | OWNER | Rent out = offering |
| "Searching for mall space" | BRAND | Searching to occupy |
| "Mall space available" | OWNER | Available = offering |
| "Budget 3 lakhs for rent" | BRAND | Will pay rent |
| "Rent expectation 3 lakhs" | OWNER | Will receive rent |
| "Looking for property to lease" | BRAND | To lease = become tenant |
| "Property for lease" | OWNER | Offering for lease |

---

## AMBIGUOUS QUERIES (Need Clarification)

### Queries That Could Be Either

```
"1500 sqft in Koramangala"
→ Could be: Brand looking OR Owner offering
→ Action: Ask clarification

"Commercial space Indiranagar"
→ Could be: Brand seeking OR Owner advertising
→ Action: Ask clarification

"Restaurant space near tech park"
→ Could be: Brand looking OR Owner marketing
→ Action: Ask clarification

"3 lakhs monthly"
→ Could be: Budget to pay OR Rent to receive
→ Action: Ask clarification

"Space with kitchen"
→ Could be: Brand requirement OR Owner feature
→ Action: Ask clarification
```

---

## LINGUISTIC PATTERNS

### BRAND (Tenant) Language

**Action Verbs:**
- Looking for
- Searching for
- Need
- Want
- Seeking
- Require
- Planning to open
- Expanding
- Opening
- Starting

**Possession:**
- Our brand/business/café/store
- Our chain/franchise/outlet
- Our company

**Intent:**
- To open
- To start
- To launch
- To expand
- To establish

**Financial:**
- Budget is X
- Can afford X
- Willing to pay X
- Budget range X-Y

---

### OWNER (Landlord) Language

**Possession:**
- Our property
- Our building
- Our space
- We have/own
- Available property
- Property portfolio

**Availability:**
- Available for rent
- Available for lease
- Space available
- Property vacant
- Ready to occupy
- Immediate availability

**Seeking:**
- Looking for tenants
- Seeking brands
- Need occupiers
- Searching for lessees
- Want established brands

**Financial:**
- Rent expectation X
- Rental income X
- Seeking X rent
- Rent is X
- Negotiable rent

---

## CONFIDENCE SCORING

### High Confidence BRAND (> 90%)
✅ "our [business] needs space"
✅ "opening our [Nth] outlet"
✅ "expanding our chain"
✅ "budget is X" (to pay)
✅ "looking for space for our"
✅ "need location for our business"

### High Confidence OWNER (> 90%)
✅ "have property available"
✅ "looking for tenants"
✅ "space for rent/lease"
✅ "rent expectation X" (to receive)
✅ "seeking brands for our property"
✅ "property owner looking for"

### Medium Confidence (60-90%)
⚠️ "looking for space" (probably brand)
⚠️ "space available" (probably owner)
⚠️ "commercial property" (need context)
⚠️ "restaurant space" (need context)

### Low Confidence (< 60%)
❌ "1500 sqft Koramangala"
❌ "commercial space"
❌ "3 lakhs monthly"
❌ "main road property"
→ NEEDS CLARIFICATION

---

This owner dataset + brand dataset = Complete training for entity classification.

