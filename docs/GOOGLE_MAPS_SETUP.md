# Google Maps Integration Status & Setup Guide

## 📊 Current Status

### ✅ What's Already Integrated

1. **Package Installed**: `@react-google-maps/api` (v2.20.8) ✅
2. **Configuration File**: `src/lib/google-maps-config.ts` ✅
3. **Error Handler**: `src/components/GoogleMapsErrorHandler.tsx` ✅
4. **Usage in Components**:
   - ✅ `LocationIntelligence` component (property match pages)
   - ✅ Owner onboarding page (property location selection)
   - ✅ Location intelligence API route

### ❌ What's Missing

1. **API Key**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` not found in `.env` file ❌
2. **Required APIs**: Need to enable in Google Cloud Console:
   - Maps JavaScript API
   - Geocoding API
   - Places API

---

## 🔧 Setup Instructions

### Step 1: Get Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Click "New Project" or select an existing one
   - Give it a name (e.g., "Lokazen")

3. **Enable Billing** (Required for Google Maps APIs)
   - Go to: https://console.cloud.google.com/billing
   - Link a billing account to your project
   - Note: Google provides $200/month free credit for Maps usage

4. **Enable Required APIs**
   Navigate to: https://console.cloud.google.com/apis/library
   
   Enable these three APIs:
   - **Maps JavaScript API** - For displaying maps
   - **Geocoding API** - For converting addresses to coordinates
   - **Places API** - For location search and place details

5. **Create API Key**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

6. **Restrict API Key** (Recommended for Security)
   - Click on the created API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose only:
     - Maps JavaScript API
     - Geocoding API
     - Places API
   - Under "Application restrictions", add:
     - HTTP referrers (web sites)
     - Add your domains:
       - `localhost:3000/*` (for development)
       - `*.vercel.app/*` (if using Vercel)
       - Your production domain (e.g., `lokazen.com/*`)

### Step 2: Add API Key to Environment Variables

Add the following line to your `.env` file:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Important**: 
- Replace `your_api_key_here` with your actual API key
- The `NEXT_PUBLIC_` prefix is required for Next.js to expose it to the browser
- Restart your development server after adding the key

### Step 3: Verify Setup

1. **Restart Development Server**
   ```bash
   npm run dev
   ```

2. **Test Map Display**
   - Navigate to: Owner onboarding page (`/onboarding/owner`)
   - Try entering a location or Google Maps link
   - The map should display with a marker

3. **Test Property Pages**
   - Navigate to a property match page (`/properties/[id]/match`)
   - Check if the Location Intelligence section displays the map correctly

4. **Check Browser Console**
   - Open DevTools (F12)
   - Look for any Google Maps errors
   - Should NOT see: "API key not found" warning

---

## 📍 Where Google Maps is Used

### 1. Location Intelligence Component
**File**: `src/components/LocationIntelligence.tsx`
- Displays map with property location
- Shows competitor markers
- Displays radius circles
- Used in property match pages

### 2. Owner Onboarding Page
**File**: `src/app/onboarding/owner/page.tsx`
- Interactive map for property location selection
- Marker placement
- Coordinate extraction from Google Maps links

### 3. Location Intelligence API
**File**: `src/app/api/location-intelligence/route.ts`
- Uses Google Maps API for geocoding
- Fetches competitor data from Places API

---

## 🔍 Troubleshooting

### Issue: Maps not displaying
**Solution**: 
- Check if API key is correctly set in `.env`
- Verify the key is not restricted incorrectly
- Check browser console for errors
- Ensure APIs are enabled in Google Cloud Console

### Issue: "API key not found" warning
**Solution**:
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is in `.env` file
- Restart development server
- Check for typos in variable name

### Issue: "This page can't load Google Maps correctly"
**Solution**:
- Check API key restrictions
- Ensure HTTP referrers include your domain
- Verify billing is enabled

### Issue: Maps load but no markers appear
**Solution**:
- Check if coordinates are valid
- Verify Places API is enabled
- Check browser console for JavaScript errors

---

## 💰 Pricing Information

Google Maps Platform offers:
- **$200/month free credit** (covers most small-to-medium usage)
- **Pay-as-you-go** pricing after free credit
- Typical costs:
  - Maps JavaScript API: $7 per 1,000 loads
  - Geocoding API: $5 per 1,000 requests
  - Places API: Varies by request type

**Monitor Usage**: https://console.cloud.google.com/billing

---

## 🔒 Security Best Practices

1. ✅ **Restrict API Key** to only required APIs
2. ✅ **Add HTTP referrer restrictions** to prevent unauthorized use
3. ✅ **Never commit API keys** to version control (already in `.gitignore`)
4. ✅ **Use different keys** for development and production
5. ✅ **Monitor usage** regularly in Google Cloud Console

---

## ✅ Next Steps After Setup

1. Add API key to `.env` file
2. Restart development server
3. Test map display on owner onboarding page
4. Test Location Intelligence on property match pages
5. Monitor API usage in Google Cloud Console

---

## 📝 Files Modified/Checked

- ✅ `.env` - Added `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` placeholder
- ✅ `src/lib/google-maps-config.ts` - Configuration file (already exists)
- ✅ `src/components/LocationIntelligence.tsx` - Uses Google Maps
- ✅ `src/app/onboarding/owner/page.tsx` - Uses Google Maps
- ✅ `package.json` - Package already installed

---

**Status**: ⚠️ **SETUP REQUIRED** - API key needs to be added to `.env` file
