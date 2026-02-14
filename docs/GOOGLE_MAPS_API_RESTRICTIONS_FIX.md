# Fix: API Key Restrictions - Maps JavaScript API Missing

## 🔴 Issue Found

Your API key has **"API restrictions"** set to **"Restrict key"** with **32 APIs** selected.

The `InvalidKeyMapError` means **Maps JavaScript API is NOT included** in those 32 APIs.

---

## ✅ Fix Steps

### Step 1: Check Selected APIs

1. In Google Cloud Console, click on the dropdown that says **"32 APIs"**
2. Look for these APIs in the list:
   - ✅ **Maps JavaScript API** ← MUST be included!
   - ✅ **Geocoding API**
   - ✅ **Places API**

### Step 2: Add Missing APIs

If Maps JavaScript API is missing:

1. Click the dropdown **"32 APIs"**
2. Search for **"Maps JavaScript API"**
3. Check the box to add it
4. Also add:
   - **Geocoding API**
   - **Places API**
5. Click **"Save"** or **"Done"**
6. Wait 1-2 minutes for changes to propagate

### Step 3: Alternative - Temporarily Remove Restrictions

For quick testing:

1. Select **"Don't restrict key"** under API restrictions
2. Click **"Save"**
3. Wait 1-2 minutes
4. Test your maps
5. If it works, add back restrictions with Maps JavaScript API included

---

## ✅ Required APIs for Google Maps

Make sure these are in your selected APIs:

1. **Maps JavaScript API** ← Required for displaying maps
2. **Geocoding API** ← Required for address to coordinates conversion
3. **Places API** ← Required for location search and place details

---

## 🔍 How to Verify

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your API key
3. Under "API restrictions", click the dropdown
4. Search for "Maps JavaScript API"
5. If it's NOT checked, check it and save

---

## 🚀 Quick Fix

**Fastest solution:**

1. Under "API restrictions", select **"Don't restrict key"**
2. Save
3. Wait 1-2 minutes
4. Restart your dev server
5. Test maps

If maps work, then add back restrictions with Maps JavaScript API included.

---

## 📝 Summary

- ✅ Application restrictions: "None" (good, no issues there)
- ❌ API restrictions: Missing Maps JavaScript API
- ✅ Fix: Add Maps JavaScript API to the selected APIs, or temporarily remove restrictions

**The key is valid, but it's restricted to APIs that don't include Maps JavaScript API!**
