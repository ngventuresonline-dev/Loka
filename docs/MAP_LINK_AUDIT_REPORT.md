# MAP_LINK FIELD AUDIT REPORT
**Date:** January 25, 2026  
**Purpose:** Investigate `map_link` field usage before removal  
**Status:** INVESTIGATION ONLY - NO CHANGES MADE

---

## 1. DATABASE SCHEMA ANALYSIS

### 1.1 Prisma Schema (`prisma/schema.prisma`)
**Location:** Line 108  
**Field Definition:**
```prisma
mapLink              String?            @map("map_link") @db.VarChar(1000)
```
- **Field Name (Prisma):** `mapLink` (camelCase)
- **Database Column:** `map_link` (snake_case)
- **Type:** `String?` (nullable)
- **Max Length:** 1000 characters
- **Mapped Column:** `map_link`

### 1.2 SQL Schema (`database/schema.sql`)
**Location:** Line 125  
**Column Definition:**
```sql
map_link VARCHAR(1000), -- Google Maps link
```
- **Column Name:** `map_link`
- **Type:** `VARCHAR(1000)`
- **Nullable:** Yes (no NOT NULL constraint)
- **Comment:** "Google Maps link"

### 1.3 Migration Files Found
1. **`database/migrations/add_map_link_column.sql`** - Idempotent migration with existence check
2. **`database/migrations/20251223_add_map_link_to_properties.sql`** - Simple ADD COLUMN IF NOT EXISTS
3. **`database/migrations/add_map_link_simple.sql`** - Basic migration script

**Conclusion:** Column `map_link` exists in database schema and Prisma model.

---

## 2. LINK-RELATED COLUMNS SEARCH

### Database Columns Found:
- ✅ **`map_link`** - VARCHAR(1000) - Google Maps link (PRIMARY FIELD)

### No Other Link/URL/Map Columns Found:
- ❌ No `mapLink` column (only Prisma field name)
- ❌ No `googleMapLink` column
- ❌ No `url` column
- ❌ No other map-related columns

---

## 3. CODEBASE USAGE ANALYSIS

### 3.1 Files Using `map_link` / `mapLink` (78 occurrences found)

#### **Frontend Components:**

1. **`src/app/onboarding/owner/page.tsx`** (47 occurrences)
   - **Line 183:** `mapLink: ''` - Form state initialization
   - **Line 196:** `googleMapLink: ''` - Form state (separate field)
   - **Line 338:** `mapLink: property.mapLink || ''` - Loading property data
   - **Line 353:** `googleMapLink: ''` - Reset on edit
   - **Line 658:** `handleMapLinkInput` function - Handles map link input
   - **Line 663:** `mapLink: value` - Updates form state
   - **Line 677:** Logging form change for `mapLink`
   - **Line 716:** `formData.mapLink.trim()` - Validation check
   - **Line 791:** `formData.mapLink.trim() || formData.googleMapLink.trim()` - Validation
   - **Line 828:** Same validation pattern
   - **Line 832:** Validation check
   - **Line 837:** Google Maps link validation
   - **Line 844:** Extract coordinates from `mapLink`
   - **Line 900:** `finalMapLink` calculation
   - **Line 927:** `mapLink: finalMapLink` - Property creation payload
   - **Line 941:** `mapLink: finalMapLink` - Property update payload
   - **Line 1106:** Display `formData.mapLink` in summary
   - **Line 1315:** Input field value binding
   - **Line 1321-1322:** Update both `googleMapLink` and `mapLink`
   - **Line 1333-1334:** Same dual update pattern
   - **Line 1377:** Conditional rendering based on `mapLink`

2. **`src/app/admin/properties/[id]/page.tsx`** (3 occurrences)
   - **Line 29:** `mapLink: ''` - Form state initialization
   - **Line 361:** `mapLink: prop.mapLink || ''` - Loading property data
   - **Line 434:** `mapLink: formData.mapLink || null` - Update payload
   - **Line 660:** Input field binding
   - **Line 661:** onChange handler

#### **API Routes:**

3. **`src/app/api/owner/property/route.ts`** (20 occurrences)
   - **Line 43:** `mapLink?: string` - Type definition
   - **Line 72:** `property?.mapLink` - Check for mapLink
   - **Line 73:** `property.mapLink.trim()` - Extract coordinates
   - **Line 99:** `property?.mapLink` - Validation check
   - **Line 100-103:** Multiple validation patterns for Google Maps links
   - **Line 107:** Validation check
   - **Line 115:** Warning log about mapLink
   - **Line 462:** `propertyData.mapLink = property.mapLink` - Set property data
   - **Line 463:** Conditional assignment
   - **Line 486-487:** Error handling for missing `map_link` column
   - **Line 491:** Warning about missing column
   - **Line 492:** `delete propertyData.mapLink` - Fallback removal

4. **`src/app/api/properties/[id]/route.ts`** (3 occurrences)
   - **Line 79:** Error check for `map_link` column
   - **Line 80:** Error message check
   - **Line 85:** Migration SQL to add column
   - **Line 130:** `mapLink: null` - Fallback when column doesn't exist

5. **`src/app/api/admin/properties/route.ts`** (5 occurrences)
   - **Line 467:** `const mapLink = body.mapLink ? String(body.mapLink).trim() : ''`
   - **Line 577:** `mapLink: mapLink || null` - Property creation
   - **Line 701:** `if (updateData.mapLink !== undefined)` - Update check
   - **Line 706:** `data.mapLink = updateData.mapLink || null` - Update assignment
   - **Line 709:** Error handling for missing `map_link` column
   - **Line 710:** Warning log
   - **Line 712:** `delete data.mapLink` - Fallback removal

---

## 4. PROPERTY CREATION FLOW

### 4.1 Form Submission (`src/app/onboarding/owner/page.tsx`)
**Field Names Used:**
- `formData.mapLink` - Primary field
- `formData.googleMapLink` - Secondary field (synced with mapLink)

**Submission Payload (Line 927-941):**
```typescript
property: {
  mapLink: finalMapLink,  // Combined from mapLink || googleMapLink
  // ... other fields
}
```

### 4.2 API Handler (`src/app/api/owner/property/route.ts`)
**Property Creation (Line 462-463):**
```typescript
if (property.mapLink) {
  propertyData.mapLink = property.mapLink
}
```

**Error Handling (Line 481-503):**
- Tries to create with `mapLink`
- If column doesn't exist, removes `mapLink` and retries
- Logs warning about missing column

---

## 5. APPROVAL/REJECT ENDPOINTS

### 5.1 Approve Endpoint (`src/app/api/admin/properties/[id]/approve/route.ts`)
**Lines 44-50:** Property update
```typescript
const property = await prisma.property.update({
  where: { id: propertyId },
  data: { 
    status: 'approved',
    availability: true
  },
})
```
**✅ NO `map_link` REFERENCE** - Only updates `status` and `availability`

### 5.2 Reject Endpoint (`src/app/api/admin/properties/[id]/reject/route.ts`)
**Lines 44-50:** Property update
```typescript
const property = await prisma.property.update({
  where: { id: propertyId },
  data: { 
    status: 'rejected',
    availability: false
  },
})
```
**✅ NO `map_link` REFERENCE** - Only updates `status` and `availability`

**Conclusion:** Approval/reject endpoints do NOT touch `map_link` field.

---

## 6. PROPERTY DATA STRUCTURE

### 6.1 Form Fields (`src/app/onboarding/owner/page.tsx`)
**Form State (Line 180-197):**
```typescript
{
  mapLink: '',           // Primary field
  googleMapLink: '',     // Secondary field (synced)
  latitude: '',
  longitude: '',
  // ... other fields
}
```

### 6.2 API Payload Structure
**Create Property:**
```typescript
{
  property: {
    mapLink: string,     // Google Maps URL
    latitude?: number,
    longitude?: number,
    // ... other fields
  }
}
```

**Update Property:**
```typescript
{
  mapLink: string | null,
  // ... other fields
}
```

---

## 7. SUMMARY OF FINDINGS

### ✅ CONFIRMED EXISTENCE:
1. **Database Column:** `map_link` VARCHAR(1000) - EXISTS
2. **Prisma Field:** `mapLink` mapped to `map_link` - EXISTS
3. **Migration Files:** 3 migration files found - EXISTS

### 📍 USAGE LOCATIONS:
1. **Owner Onboarding Form** - Primary input field (47 occurrences)
2. **Admin Property Edit** - Edit form field (3 occurrences)
3. **Property Creation API** - Saves mapLink to database (20 occurrences)
4. **Property Update API** - Updates mapLink (5 occurrences)
5. **Property Fetch API** - Returns mapLink (3 occurrences)

### ❌ NOT USED IN:
- ✅ Approval endpoint - NO map_link updates
- ✅ Reject endpoint - NO map_link updates
- ✅ Property listing queries - NO map_link filtering

### 🔄 FIELD BEHAVIOR:
- **Nullable:** Yes (can be NULL)
- **Validation:** Google Maps URL validation exists
- **Coordinate Extraction:** Extracts lat/lng from mapLink
- **Fallback Handling:** Code handles missing column gracefully

---

## 8. IMPACT ASSESSMENT

### Files Requiring Changes (if removing map_link):

1. **Prisma Schema** (`prisma/schema.prisma`)
   - Remove `mapLink` field from Property model (Line 108)

2. **Database Migration**
   - Create migration to drop `map_link` column

3. **Frontend Forms:**
   - `src/app/onboarding/owner/page.tsx` - Remove mapLink field (47 changes)
   - `src/app/admin/properties/[id]/page.tsx` - Remove mapLink field (3 changes)

4. **API Routes:**
   - `src/app/api/owner/property/route.ts` - Remove mapLink handling (20 changes)
   - `src/app/api/properties/[id]/route.ts` - Remove mapLink fallback (3 changes)
   - `src/app/api/admin/properties/route.ts` - Remove mapLink handling (5 changes)

### Files NOT Requiring Changes:
- ✅ `src/app/api/admin/properties/[id]/approve/route.ts` - No map_link usage
- ✅ `src/app/api/admin/properties/[id]/reject/route.ts` - No map_link usage

---

## 9. RECOMMENDATIONS

### Before Removal:
1. ✅ **Backup existing data** - Export any map_link values if needed
2. ✅ **Check for dependencies** - Verify no external systems use map_link
3. ✅ **Coordinate extraction** - Ensure lat/lng are being saved separately
4. ✅ **Migration order** - Drop column AFTER code changes are deployed

### Removal Strategy:
1. **Phase 1:** Remove from forms and API (code changes)
2. **Phase 2:** Deploy code changes
3. **Phase 3:** Run migration to drop column
4. **Phase 4:** Regenerate Prisma client

---

## 10. RISK ASSESSMENT

### Low Risk:
- ✅ Approval/reject endpoints unaffected
- ✅ Field is nullable (no data loss risk)
- ✅ Fallback handling exists

### Medium Risk:
- ⚠️ Owner onboarding form heavily uses mapLink
- ⚠️ Coordinate extraction depends on mapLink
- ⚠️ Admin edit form uses mapLink

### High Risk:
- ⚠️ **None identified** - Field appears to be supplementary

---

**END OF AUDIT REPORT**

**Next Steps:** Review findings and proceed with removal plan if approved.
