# Production Location Intelligence Fix

## Issue
Location intelligence data not loading in production, but works fine on localhost.

## Root Causes Identified

### 1. **Missing Environment Variable in Production** (Most Likely)
- The Google Maps API key must be set in your production deployment platform (Vercel, etc.)
- **Required variables:**
  - `GOOGLE_MAPS_API_KEY` (preferred for server-side API routes)
  - OR `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (works but less ideal for API routes)

### 2. **Google Cloud Console API Restrictions**
- Production domain not whitelisted in Google Cloud Console
- API restrictions blocking production server IPs
- Required APIs not enabled:
  - **Places API** (for competitor data)
  - **Geocoding API** (for address → coordinates)
  - **Maps JavaScript API** (for map display)

### 3. **Billing/Quota Issues**
- Google Cloud billing not enabled
- API quota exceeded
- Free tier limits reached

## Fixes Applied

### 1. Improved Error Handling
- API now returns clear error messages when API key is missing in production
- Better logging for Google API errors (REQUEST_DENIED, OVER_QUERY_LIMIT, etc.)
- Errors are now visible in API responses instead of silent failures

### 2. Environment Variable Priority
- Server-side API routes now prioritize `GOOGLE_MAPS_API_KEY` (more reliable)
- Falls back to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for compatibility

## Production Deployment Checklist

### Step 1: Set Environment Variables
In your deployment platform (Vercel, etc.):

1. Go to **Project Settings** → **Environment Variables**
2. Add:
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
   OR
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
3. **Important:** Set this for **Production** environment (not just Preview/Development)
4. Redeploy after adding the variable

### Step 2: Verify Google Cloud Console Settings

1. **Enable Required APIs:**
   - Go to: https://console.cloud.google.com/apis/library
   - Enable:
     - ✅ **Places API**
     - ✅ **Geocoding API**
     - ✅ **Maps JavaScript API**

2. **Check API Restrictions:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click on your API key
   - Under **API restrictions**, ensure:
     - ✅ **Places API** is selected
     - ✅ **Geocoding API** is selected
     - ✅ **Maps JavaScript API** is selected

3. **Check Application Restrictions (HTTP referrers):**
   - Under **Application restrictions**, if using "HTTP referrers", add:
     - `https://your-production-domain.com/*`
     - `https://*.your-production-domain.com/*`
   - **OR** if using "None" (less secure but simpler), ensure no restrictions

4. **Verify Billing:**
   - Go to: https://console.cloud.google.com/billing
   - Ensure billing is enabled (required even for free tier)

### Step 3: Test in Production

1. Deploy the updated code
2. Navigate to a property page with location intelligence
3. Check browser console for errors
4. Check production server logs for error messages

### Step 4: Verify API Key is Accessible

The API will now return a clear error if the key is missing:
```json
{
  "success": false,
  "error": "Google Maps API key not configured...",
  "details": "Location intelligence requires Google Maps API key..."
}
```

## Debugging Production Issues

### Check Production Logs
Look for these log messages:
- `[LocationIntelligence API] Google Maps API key not found...`
- `[LocationIntelligence API] Places API access denied...`
- `[LocationIntelligence API] Places API quota exceeded...`

### Common Error Messages

1. **"Google Maps API key not configured"**
   - **Fix:** Set `GOOGLE_MAPS_API_KEY` or `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in production environment variables

2. **"REQUEST_DENIED" from Google API**
   - **Fix:** Check API restrictions in Google Cloud Console, ensure production domain is whitelisted

3. **"OVER_QUERY_LIMIT"**
   - **Fix:** Check billing/quota limits in Google Cloud Console

4. **Empty competitor data but other data works**
   - This is normal if Google Places API returns ZERO_RESULTS (no competitors found)
   - Demographics and footfall estimates will still work

## Testing Locally vs Production

- **Localhost:** Uses `.env.local` file
- **Production:** Uses environment variables set in deployment platform
- **Important:** Variables must be set separately for each environment

## Next Steps

1. ✅ Code fixes applied (better error handling)
2. ⏳ Set environment variables in production
3. ⏳ Verify Google Cloud Console settings
4. ⏳ Test in production
5. ⏳ Monitor production logs for any issues
