# Quick Fix Guide: Google Maps Not Showing

## 🔴 The Error You're Seeing

**"This page didn't load Google Maps correctly. See the JavaScript console for technical details."**

This is a **Google Maps API error**. The most common causes are:

---

## ✅ Step 1: Check Browser Console (CRITICAL)

1. **Open Browser DevTools**: Press `F12` or right-click → "Inspect"
2. **Go to Console tab**
3. **Look for red error messages** - They will tell you exactly what's wrong

Common error messages you might see:
- `RefererNotAllowedMapError` → API key restrictions blocking your domain
- `ApiNotActivatedMapError` → Required APIs not enabled
- `BillingNotEnabledMapError` → Billing not enabled
- `InvalidKeyMapError` → API key is wrong or invalid

**Share the exact error message from the console!**

---

## ✅ Step 2: Check API Key Restrictions

Your API key: `AIzaSyD0tK5OhNswLWB3KEiacJJyT64KULzqCF4`

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. **Check "Application restrictions"**:
   - If it says "HTTP referrers (web sites)", make sure it includes:
     - `localhost:3000/*`
     - `127.0.0.1:3000/*`
   - **For testing**: Temporarily set to "None" to see if this is the issue

4. **Check "API restrictions"**:
   - Should include:
     - ✅ Maps JavaScript API
     - ✅ Geocoding API
     - ✅ Places API
   - Or set to "Don't restrict key" for testing

---

## ✅ Step 3: Verify APIs Are Enabled

1. Go to: https://console.cloud.google.com/apis/library
2. Search for each API and verify they say "API enabled":
   - **Maps JavaScript API** ← Most important!
   - **Geocoding API**
   - **Places API**

If any say "Enable API", click that button.

---

## ✅ Step 4: Check Billing

Google Maps requires billing (even with free credits).

1. Go to: https://console.cloud.google.com/billing
2. Verify your project has a billing account linked
3. If not, link a billing account

---

## ✅ Step 5: Test API Key Directly

Open this URL in your browser (replace with your actual key):

```
https://maps.googleapis.com/maps/api/js?key=AIzaSyD0tK5OhNswLWB3KEiacJJyT64KULzqCF4&callback=initMap
```

**What you should see:**
- ✅ **JavaScript code** → API key works!
- ❌ **Error message** → API key has issues (check the error)

---

## 🔍 Diagnostic Component

I've added a diagnostic component that shows in the bottom-right corner (development only).

It will show:
- ✅ API Key: Set or Missing
- ✅ Script Loaded: Yes or No
- ✅ Google Maps Available: Yes or No
- ❌ Any errors

**Look for the red box in the bottom-right corner of your page!**

---

## 🚀 Most Common Fix

**90% of the time, it's API key restrictions:**

1. Go to Google Cloud Console → Credentials
2. Click your API key
3. Under "Application restrictions":
   - Change from "HTTP referrers" to **"None"** (temporarily)
4. Save and wait 1-2 minutes
5. Refresh your app

If this fixes it, then add proper restrictions:
- `localhost:3000/*`
- `127.0.0.1:3000/*`
- Your production domain

---

## 📞 What to Share

Please share:
1. **The exact error message from browser console** (F12 → Console tab)
2. **What the diagnostic component shows** (red box in bottom-right)
3. **Screenshot of your API key settings** (if possible)

This will help me identify the exact issue!
