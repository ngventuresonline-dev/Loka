# IMAGE UPLOAD & DISPLAY DEBUG REPORT
**Date:** January 25, 2026  
**Issue:** Images uploaded during owner property creation but not visible on property listing page  
**Status:** ROOT CAUSE IDENTIFIED

---

## 🔍 ROOT CAUSE ANALYSIS

### **PRIMARY ISSUE: Images Are Never Uploaded**

**Location:** `src/app/onboarding/owner/page.tsx`  
**Line 871-873:**
```typescript
// For now we skip actual media upload and only save structured data.
// Media files can be handled in a separate flow when storage is configured.
const mediaUrls: string[] = []
```

**Problem:** 
- Files are selected and stored in `formData.photos` (File objects)
- But `mediaUrls` is hardcoded to empty array `[]`
- Files are NEVER uploaded to storage
- Empty array is sent to API
- Database receives empty `images` JSONB array

---

## 📋 DETAILED FINDINGS

### 1. IMAGE UPLOAD FLOW

#### **Frontend Form (`src/app/onboarding/owner/page.tsx`)**

**File Selection (Lines 1533-1563):**
- ✅ File input accepts `image/*,video/*`
- ✅ Files stored in `formData.photos` (File objects)
- ✅ Files stored in `formData.videos` (File objects)
- ✅ Photo previews work (lines 1591-1612)
- ❌ **Files NEVER uploaded to storage**

**Form Submission (Lines 868-951):**
```typescript
// Line 871-873: SKIPPED UPLOAD
const mediaUrls: string[] = []

// Line 926 (update) or 949 (create): Empty array sent
images: mediaUrls,  // Always []
```

**Expected Flow (NOT IMPLEMENTED):**
1. User selects files → stored in `formData.photos`
2. Files should be uploaded to Supabase Storage
3. Storage returns URLs
4. URLs stored in `mediaUrls` array
5. URLs sent to API
6. API saves URLs to database `images` JSONB field

**Actual Flow (CURRENT):**
1. User selects files → stored in `formData.photos`
2. ❌ **Upload step skipped**
3. `mediaUrls = []` (empty)
4. Empty array sent to API
5. API saves `[]` to database
6. No images to display

---

### 2. STORAGE INFRASTRUCTURE EXISTS BUT UNUSED

**File:** `src/lib/supabase/storage.ts`

**Available Functions:**
- ✅ `uploadPropertyImage(file, propertyId, index)` - Uploads single image
- ✅ `uploadPropertyImages(files, propertyId)` - Uploads multiple images
- ✅ Returns public URLs from Supabase Storage
- ✅ Bucket: `property-images`

**Problem:** These functions exist but are **NEVER CALLED** in owner onboarding flow.

**Why Not Used:**
- Comment says "when storage is configured" but storage IS configured
- Functions are available but not imported/used
- Upload logic was commented out or skipped

---

### 3. DATABASE STRUCTURE

**Prisma Schema (`prisma/schema.prisma`):**
```prisma
images  Json?  // JSONB array of image URLs
```

**Expected Format:**
```json
["https://supabase.co/storage/.../image1.jpg", "https://.../image2.jpg"]
```

**Actual Format (Current):**
```json
[]  // Empty array
```

**SQL Query Result (Expected):**
```sql
SELECT id, title, images, jsonb_array_length(images) as image_count
FROM properties
WHERE id = 'prop-088';
```

**Expected Output:**
- `images`: `[]` (empty array)
- `image_count`: `0`

---

### 4. API HANDLING

#### **Property Creation API (`src/app/api/owner/property/route.ts`)**

**Line 365-367:**
```typescript
const images = property.images && property.images.length > 0
  ? property.images
  : []
```

**Line 446:**
```typescript
images,  // Saved to database (currently empty array)
```

**Status:** ✅ API correctly handles images array  
**Problem:** Receives empty array because upload never happened

---

### 5. IMAGE DISPLAY COMPONENTS

#### **PropertyCard Component (`src/components/PropertyCard.tsx`)**

**Lines 89-105:**
```typescript
const getInitialImageSrc = () => {
  if (property.images && property.images.length > 0) {
    const src = property.images[0]
    // Skip broken local paths, localhost images, and Unsplash fallback images
    if (
      src.startsWith('/images/') || 
      src.includes('localhost:3000/images') || 
      src.includes('unsplash') ||
      !src || 
      src.trim() === ''
    ) {
      return null
    }
    return src
  }
  return null
}
```

**Display Logic (Lines 132-147):**
- ✅ Checks for `property.images` array
- ✅ Uses first image if available
- ✅ Shows placeholder if no image
- ✅ Handles image load errors

**Status:** ✅ Component correctly displays images  
**Problem:** No images to display because array is empty

#### **Admin Pending Properties Page (`src/app/admin/properties/pending/page.tsx`)**

**Lines 374-419:**
- ❌ **NO IMAGE COLUMN** in table
- Only shows: Property, Location, Owner, Size, Price, Submitted, Actions
- Images not displayed in table view

**Status:** Table view doesn't show images (design choice, not a bug)

---

### 6. OTHER COMPONENTS USING IMAGES

**Files That Display Images:**
1. ✅ `src/components/PropertyCard.tsx` - Main card component
2. ✅ `src/app/page.tsx` - Homepage property cards
3. ✅ `src/components/PropertyDetailsModal.tsx` - Property modal
4. ✅ `src/app/properties/[id]/match/page.tsx` - Match page
5. ✅ `src/app/profile/brand/page.tsx` - Brand profile
6. ✅ `src/app/profile/owner/page.tsx` - Owner profile
7. ✅ `src/components/AiSearchModal.tsx` - AI search results

**All Components:**
- ✅ Check for `property.images` array
- ✅ Display first image if available
- ✅ Show placeholder if empty
- ✅ Handle errors gracefully

**Status:** All display components work correctly  
**Problem:** They have no images to display

---

## 🐛 ISSUE SUMMARY

### **The Problem:**
1. ❌ Images selected in form but **never uploaded**
2. ❌ Empty array `[]` sent to API
3. ❌ Database stores empty array
4. ❌ Display components have no images to show

### **Why It Happens:**
- Upload code was skipped/disabled (line 871-873)
- Comment suggests "storage not configured" but it IS configured
- Storage utility functions exist but unused
- Files remain as File objects, never converted to URLs

### **What Should Happen:**
1. ✅ User selects images → stored in `formData.photos`
2. ✅ **Upload files to Supabase Storage** (MISSING STEP)
3. ✅ Get public URLs from storage
4. ✅ Store URLs in `mediaUrls` array
5. ✅ Send URLs to API
6. ✅ API saves URLs to database
7. ✅ Display components show images

---

## 📊 DATABASE CHECK RESULTS

### **Expected SQL Query:**
```sql
SELECT 
  id,
  title,
  images,
  jsonb_array_length(images) as image_count
FROM properties
WHERE id = 'prop-088'
LIMIT 1;
```

### **Expected Results:**
- `images`: `[]` or `null` (empty)
- `image_count`: `0`

### **If Images Were Uploaded:**
- `images`: `["https://...", "https://..."]`
- `image_count`: `2` (or number of images)

---

## 🔧 FIX REQUIRED

### **Files That Need Changes:**

1. **`src/app/onboarding/owner/page.tsx`** (CRITICAL)
   - **Line 871-873:** Remove skip logic
   - **Add:** Upload images to Supabase Storage before submission
   - **Add:** Import `uploadPropertyImages` from `@/lib/supabase/storage`
   - **Add:** Upload files and get URLs
   - **Change:** Set `mediaUrls` to uploaded URLs instead of empty array

2. **`src/app/admin/properties/pending/page.tsx`** (OPTIONAL)
   - Add image thumbnail column to table (if desired)
   - Currently shows text-only table

---

## 📝 CODE CHANGES NEEDED

### **Fix Upload Flow:**

**Before (Line 871-873):**
```typescript
// For now we skip actual media upload and only save structured data.
// Media files can be handled in a separate flow when storage is configured.
const mediaUrls: string[] = []
```

**After (Should be):**
```typescript
// Upload images to Supabase Storage
let mediaUrls: string[] = []
if (formData.photos.length > 0) {
  try {
    // Upload images and get URLs
    const uploadResult = await uploadPropertyImages(
      formData.photos,
      propertyId || 'temp-' + Date.now() // Use temp ID or property ID
    )
    if (uploadResult.success && uploadResult.urls) {
      mediaUrls = uploadResult.urls
    }
  } catch (error) {
    console.error('Image upload failed:', error)
    // Continue without images or show error
  }
}
```

**Required Import:**
```typescript
import { uploadPropertyImages } from '@/lib/supabase/storage'
```

**Note:** Property ID needed for upload - may need to:
- Upload after property creation (two-step process)
- Use temporary ID then update
- Or upload to temp folder then move

---

## 🎯 VERIFICATION STEPS

### **After Fix:**

1. **Test Upload:**
   - Create property with images
   - Check browser Network tab for Supabase Storage requests
   - Verify files uploaded successfully

2. **Check Database:**
   ```sql
   SELECT id, title, images, jsonb_array_length(images) as image_count
   FROM properties
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   - Should show `image_count > 0`
   - `images` should contain URL strings

3. **Check Display:**
   - View property on listing page
   - Images should appear in PropertyCard
   - Check browser console for image load errors

4. **Check API Response:**
   - GET `/api/properties/{id}`
   - Response should include `images` array with URLs
   - URLs should be valid Supabase Storage URLs

---

## ⚠️ ADDITIONAL CONSIDERATIONS

### **Storage Configuration:**
- ✅ Supabase Storage bucket exists: `property-images`
- ✅ Upload functions implemented
- ⚠️ Need to verify bucket permissions (public read)
- ⚠️ Need to verify upload permissions

### **Error Handling:**
- What if upload fails? (Continue without images? Show error?)
- What if property creation fails after upload? (Cleanup uploaded files?)
- What if storage quota exceeded?

### **Performance:**
- Uploading multiple images can be slow
- Consider showing upload progress
- Consider async upload after property creation

---

## 📌 SUMMARY

### **Root Cause:**
Images are selected but **never uploaded to storage**. Empty array is saved to database.

### **Fix:**
Implement image upload to Supabase Storage before property submission.

### **Impact:**
- **High:** All properties created via owner onboarding have no images
- **Low:** Display components work correctly (just have no data)
- **Medium:** Admin can manually add images via edit form

### **Priority:**
🔴 **HIGH** - Core functionality broken

---

**END OF DEBUG REPORT**

**Next Steps:** Implement image upload functionality in owner onboarding form.
