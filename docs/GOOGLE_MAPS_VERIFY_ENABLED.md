# Next Steps: APIs Added to Restrictions - Verify They're Enabled

## ✅ What You've Done

- ✅ Maps JavaScript API added to API restrictions
- ✅ Geocoding API added to API restrictions  
- ✅ Places API added to API restrictions
- ✅ Application restrictions: None

**But still getting InvalidKeyMapError?** Let's verify the APIs are actually **ENABLED**.

---

## 🔍 Step 1: Verify APIs Are ENABLED (Not Just Added to Restrictions)

**Important:** Adding APIs to restrictions ≠ Enabling them in your project!

1. Go to: https://console.cloud.google.com/apis/library
2. Search for **"Maps JavaScript API"**
3. Click on it
4. Check if it says **"API enabled"** or **"Enable API"**
5. If it says **"Enable API"**, click that button
6. Repeat for:
   - **Geocoding API**
   - **Places API**
7. Wait 1-2 minutes after enabling

---

## 🔍 Step 2: Verify Billing

Google Maps requires billing (even with free credits):

1. Go to: https://console.cloud.google.com/billing
2. Ensure a billing account is linked to your project
3. If not, link a billing account

---

## 🔍 Step 3: Test API Key Directly

Test if your API key works now:

1. Open this URL in your browser:
   ```
   https://maps.googleapis.com/maps/api/js?key=AIzaSyD0tK5OhNswLWB3KEiacJJyT64KULzqCF4&callback=initMap
   ```

2. **What you should see:**
   - ✅ **JavaScript code** → API key works!
   - ❌ **Error message** → Check what the error says

---

## 🔍 Step 4: Restart Dev Server

After enabling APIs:

1. **Stop your dev server** (Ctrl+C)
2. **Restart it:**
   ```bash
   npm run dev
   ```

---

## 🔍 Step 5: Clear Browser Cache

1. Press **Ctrl+Shift+Delete**
2. Clear cached images and files
3. Or use **Incognito mode** to test

---

## 🔍 Step 6: Check for Propagation Delay

Google Cloud changes can take 1-5 minutes to propagate:

1. Wait 2-3 minutes after enabling APIs
2. Refresh your app
3. Test again

---

## 🆘 Still Not Working?

**Check these:**

1. **Are APIs ENABLED?** (not just in restrictions)
   - Go to API Library and verify each says "API enabled"

2. **Is billing enabled?**
   - Check billing dashboard

3. **What does the test URL show?**
   - Share the error message if any

4. **Try temporarily removing ALL restrictions:**
   - Set API restrictions to "Don't restrict key"
   - Set Application restrictions to "None"
   - Test if maps work
   - If yes, add back restrictions one by one

---

## 📋 Quick Checklist

- [ ] Maps JavaScript API is **ENABLED** (not just in restrictions)
- [ ] Geocoding API is **ENABLED**
- [ ] Places API is **ENABLED**
- [ ] Billing account is linked
- [ ] Dev server restarted
- [ ] Browser cache cleared
- [ ] Waited 2-3 minutes for propagation
- [ ] Test URL shows JavaScript code (not error)

---

## 🎯 Most Likely Issue

**The APIs are added to restrictions but NOT ENABLED in your project.**

**Fix:** Go to API Library and click "Enable API" for each one!
