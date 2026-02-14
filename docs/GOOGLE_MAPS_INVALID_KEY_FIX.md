# Fix: InvalidKeyMapError - Google Maps API Key Invalid

## 🔴 Error: InvalidKeyMapError

Your API key `AIzaSyD0tK5OhNswLWB3KEiacJJyT64KULzqCF4` is being rejected by Google Maps.

---

## ✅ Step 1: Verify API Key Exists

1. Go to: https://console.cloud.google.com/apis/credentials
2. Check if the API key `AIzaSyD0tK5OhNswLWB3KEiacJJyT64KULzqCF4` exists
3. If it doesn't exist or was deleted, you need to create a new one

---

## ✅ Step 2: Create New API Key (If Needed)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the new API key
4. Update your `.env` file:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_new_api_key_here
   ```
5. **Restart your dev server** (important!)

---

## ✅ Step 3: Enable Required APIs

Even if the key exists, these APIs must be enabled:

1. Go to: https://console.cloud.google.com/apis/library
2. Enable these APIs:
   - ✅ **Maps JavaScript API** (most important!)
   - ✅ **Geocoding API**
   - ✅ **Places API**

**For each API:**
- Search for it
- Click on it
- Click **"Enable API"** if not already enabled
- Wait 1-2 minutes

---

## ✅ Step 4: Check API Key Restrictions

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Check **"API restrictions"**:
   - Should include: **Maps JavaScript API**, **Geocoding API**, **Places API**
   - Or set to **"Don't restrict key"** (for testing)

4. Check **"Application restrictions"**:
   - If set to "HTTP referrers", ensure it includes:
     - `localhost:3000/*`
     - `127.0.0.1:3000/*`
   - **For testing**: Temporarily set to **"None"**

5. **Save** and wait 1-2 minutes

---

## ✅ Step 5: Verify Billing

Google Maps requires billing (even with free credits):

1. Go to: https://console.cloud.google.com/billing
2. Ensure a billing account is linked to your project
3. If not, link a billing account

---

## ✅ Step 6: Test API Key

Test your API key directly:

1. Open this URL in your browser (replace with your actual key):
   ```
   https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&callback=initMap
   ```

2. **What you should see:**
   - ✅ **JavaScript code** → API key works!
   - ❌ **Error message** → Check what the error says

3. **Common errors:**
   - `RefererNotAllowedMapError` → API restrictions blocking
   - `ApiNotActivatedMapError` → Maps JavaScript API not enabled
   - `BillingNotEnabledMapError` → Billing not enabled
   - `InvalidKeyMapError` → API key is wrong or deleted

---

## ✅ Step 7: Update .env and Restart

1. **Update `.env` file** with the correct API key:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_correct_api_key_here
   ```

2. **Restart dev server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Clear browser cache** (Ctrl+Shift+Delete) or use incognito mode

---

## 🔍 Quick Checklist

- [ ] API key exists in Google Cloud Console
- [ ] Maps JavaScript API is enabled
- [ ] Geocoding API is enabled
- [ ] Places API is enabled
- [ ] Billing account is linked
- [ ] API key restrictions allow Maps JavaScript API
- [ ] Application restrictions allow localhost:3000 (or set to None)
- [ ] `.env` file has correct API key
- [ ] Dev server restarted after updating `.env`
- [ ] Browser cache cleared

---

## 🆘 Still Getting InvalidKeyMapError?

**Most common causes:**

1. **API key was deleted** → Create a new one
2. **Maps JavaScript API not enabled** → Enable it in API Library
3. **API key restrictions blocking** → Temporarily remove restrictions
4. **Wrong API key copied** → Double-check the key in `.env`

**Next steps:**
1. Create a fresh API key
2. Enable all required APIs
3. Temporarily remove all restrictions
4. Update `.env` and restart server
5. Test again

---

## 📝 Example: Creating a New API Key

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click**: "Create Credentials" → "API Key"
3. **Copy** the generated key
4. **Enable APIs**:
   - Maps JavaScript API
   - Geocoding API
   - Places API
5. **Update `.env`**:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your_new_key
   ```
6. **Restart dev server**
7. **Test** - maps should work now!
