# Google Maps InvalidKeyMapError - Complete Fix Guide

## Problem
The map script loads successfully (`isLoaded: true`), but Google rejects the API key with `InvalidKeyMapError` when trying to initialize the map. This causes the map to appear briefly and then disappear.

## Root Cause
The API key `AIzaSyD0tK5OhNswLWB3KEiacJJyT64KULzqCF4` is being rejected by Google Maps Platform. This happens AFTER the script loads, which is why `useLoadScript` doesn't catch it as a `loadError`.

## Step-by-Step Fix

### 1. Verify API Key Exists in Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Find your API key: `AIzaSyD0tK5OhNswLWB3KEiacJJyT64KULzqCF4`
5. If it doesn't exist, create a new one

### 2. Check Application Restrictions (CRITICAL)
1. Click on your API key to edit it
2. Under **Application restrictions**, check:
   - **If set to "HTTP referrers"**: Add these URLs:
     - `http://localhost:3000/*`
     - `http://127.0.0.1:3000/*`
     - `http://localhost:*/*` (for any port)
     - `http://127.0.0.1:*/*` (for any port)
   - **OR set to "None"** for testing (less secure but easier to debug)
3. **Save** the changes

### 3. Verify API Restrictions (CRITICAL)
1. Under **API restrictions**, ensure:
   - **Maps JavaScript API** is selected (not just listed, but actually ENABLED)
   - **Geocoding API** is selected
   - **Places API** is selected
2. **OR** set to "Don't restrict key" for testing
3. **Save** the changes

### 4. Enable Required APIs (CRITICAL)
1. Go to **APIs & Services** > **Library**
2. Search for and **ENABLE** these APIs:
   - **Maps JavaScript API** (MUST be enabled, not just in restrictions)
   - **Geocoding API**
   - **Places API**
3. Wait 1-2 minutes for changes to propagate

### 5. Verify Billing is Enabled
1. Go to **Billing** in Google Cloud Console
2. Ensure billing account is linked to your project
3. Google Maps Platform requires billing to be enabled (even for free tier)

### 6. Test API Key Directly
Open this URL in your browser (replace YOUR_API_KEY with your actual key):
```
https://maps.googleapis.com/maps/api/js?key=AIzaSyD0tK5OhNswLWB3KEiacJJyT64KULzqCF4&callback=initMap
```

If you see an error, the API key is invalid or misconfigured.

### 7. Regenerate API Key (If Nothing Works)
1. In Google Cloud Console, go to **Credentials**
2. Click on your API key
3. Click **Regenerate key**
4. Copy the new key
5. Update `.env` file with the new key
6. Restart your dev server

## Common Issues

### Issue 1: API Restrictions vs Application Restrictions
- **API Restrictions**: Which APIs the key can access
- **Application Restrictions**: Which websites/apps can use the key
- **Both must be configured correctly**

### Issue 2: HTTP Referrer Restrictions
If you set HTTP referrer restrictions, make sure to include:
- `http://localhost:3000/*`
- `http://127.0.0.1:3000/*`
- Your production domain (when deploying)

### Issue 3: API Not Actually Enabled
Just adding an API to restrictions doesn't enable it. You must:
1. Go to **APIs & Services** > **Library**
2. Search for the API
3. Click **Enable**

### Issue 4: Billing Not Enabled
Google Maps Platform requires billing to be enabled, even for the free tier ($200/month credit).

## Verification Checklist
- [ ] API key exists in Google Cloud Console
- [ ] Application restrictions allow `localhost:3000` and `127.0.0.1:3000`
- [ ] API restrictions include Maps JavaScript API, Geocoding API, Places API
- [ ] Maps JavaScript API is **ENABLED** (not just in restrictions)
- [ ] Geocoding API is **ENABLED**
- [ ] Places API is **ENABLED**
- [ ] Billing account is linked to the project
- [ ] API key in `.env` matches the one in Google Cloud Console
- [ ] Dev server has been restarted after `.env` changes

## After Making Changes
1. Wait 1-2 minutes for Google Cloud changes to propagate
2. Restart your Next.js dev server
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for any remaining errors

## Still Not Working?
If the map still doesn't load after following all steps:
1. Try regenerating the API key
2. Temporarily remove all restrictions (for testing only)
3. Verify the API key works by testing it directly in a browser
4. Check if there are any quota limits exceeded in Google Cloud Console
