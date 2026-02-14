# Google Maps Troubleshooting Guide

## 🔴 Current Issue: Maps Not Showing

You're seeing the error: **"This page didn't load Google Maps correctly"**

This typically means one of these issues:

---

## ✅ Step 1: Verify API Key is Loaded

### Check Browser Console
1. Open your browser DevTools (F12)
2. Go to the **Console** tab
3. Look for messages starting with `[Google Maps]`
4. You should see: `[Google Maps] API key loaded: AIza...CF4`

**If you see "API key not found":**
- The dev server wasn't restarted after adding the key
- **Solution**: Stop your dev server (Ctrl+C) and restart it: `npm run dev`

---

## ✅ Step 2: Check API Key Restrictions

The most common issue is **API key restrictions blocking your request**.

### In Google Cloud Console:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key: `AIzaSyD0tK5OhNswLWB3KEiacJJyT64KULzqCF4`
3. Check **"API restrictions"**:
   - Should be set to "Restrict key"
   - Should include ONLY:
     - ✅ Maps JavaScript API
     - ✅ Geocoding API
     - ✅ Places API
   - If it says "Don't restrict key", that's fine for development
   - If it's restricted to other APIs, **remove those restrictions**

4. Check **"Application restrictions"**:
   - If set to "HTTP referrers (web sites)", make sure it includes:
     - `localhost:3000/*`
     - `127.0.0.1:3000/*`
     - Your production domain (if applicable)
   - **For testing**: Temporarily set to "None" to see if restrictions are the issue

---

## ✅ Step 3: Verify Required APIs Are Enabled

1. Go to: https://console.cloud.google.com/apis/library
2. Search for and verify these APIs are **ENABLED**:
   - ✅ **Maps JavaScript API** - Click and verify it says "API enabled"
   - ✅ **Geocoding API** - Click and verify it says "API enabled"
   - ✅ **Places API** - Click and verify it says "API enabled"

If any say "Enable API", click that button.

---

## ✅ Step 4: Check Billing Status

Google Maps APIs require billing to be enabled (even with free credits).

1. Go to: https://console.cloud.google.com/billing
2. Verify your project has a billing account linked
3. If not, link a billing account (Google provides $200/month free credit)

---

## ✅ Step 5: Check for .env.local File

Next.js loads environment variables in this order:
1. `.env.local` (highest priority)
2. `.env.development` or `.env.production`
3. `.env` (lowest priority)

**Check if you have a `.env.local` file:**
- If it exists, make sure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is also set there
- Or remove `.env.local` if you want to use `.env`

---

## ✅ Step 6: Verify Environment Variable Format

In your `.env` file, make sure:
- ✅ No quotes around the value: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD0tK5OhNswLWB3KEiacJJyT64KULzqCF4`
- ❌ NOT: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyD0tK5OhNswLWB3KEiacJJyT64KULzqCF4"`
- ✅ No spaces: `KEY=value`
- ❌ NOT: `KEY = value`

---

## ✅ Step 7: Test API Key Directly

Test if your API key works by visiting this URL in your browser:

```
https://maps.googleapis.com/maps/api/js?key=AIzaSyD0tK5OhNswLWB3KEiacJJyT64KULzqCF4&callback=initMap
```

**Expected results:**
- ✅ If you see JavaScript code → API key works
- ❌ If you see an error message → API key has issues

Common error messages:
- `"RefererNotAllowedMapError"` → API key restrictions are blocking your domain
- `"ApiNotActivatedMapError"` → Required APIs aren't enabled
- `"BillingNotEnabledMapError"` → Billing isn't enabled

---

## 🔍 Debug Checklist

Run through this checklist:

- [ ] Dev server restarted after adding API key?
- [ ] API key has no quotes in `.env` file?
- [ ] No `.env.local` file overriding `.env`?
- [ ] Maps JavaScript API enabled?
- [ ] Geocoding API enabled?
- [ ] Places API enabled?
- [ ] Billing account linked?
- [ ] API key restrictions allow `localhost:3000/*`?
- [ ] Browser console shows API key loaded message?

---

## 🚀 Quick Fix Steps

1. **Restart dev server** (most common fix):
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Temporarily remove API restrictions** (for testing):
   - Go to Google Cloud Console → Credentials
   - Edit your API key
   - Set "Application restrictions" to "None"
   - Save and wait 1-2 minutes
   - Refresh your app

3. **Check browser console** for the actual error message
   - The improved error handling will now show the exact error

---

## 📝 Common Error Messages & Solutions

| Error Message | Solution |
|--------------|----------|
| `RefererNotAllowedMapError` | Add `localhost:3000/*` to API key restrictions |
| `ApiNotActivatedMapError` | Enable Maps JavaScript API in Google Cloud Console |
| `BillingNotEnabledMapError` | Link a billing account to your project |
| `InvalidKeyMapError` | Check API key is correct (no typos) |
| `OverQueryLimitMapError` | You've exceeded free quota (check billing) |

---

## 🆘 Still Not Working?

1. **Check browser console** - The error message will tell you exactly what's wrong
2. **Check Network tab** - Look for failed requests to `maps.googleapis.com`
3. **Try incognito mode** - Rules out browser cache issues
4. **Check Google Cloud Console** - Look for error logs in the API dashboard

---

## 📞 Need More Help?

Share the exact error message from:
1. Browser console (F12 → Console tab)
2. Network tab (F12 → Network tab → Filter: "maps.googleapis.com")
3. The error message shown on the page (now improved to show actual error)
