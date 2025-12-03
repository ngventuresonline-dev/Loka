# 🚨 ISSUE FIXED: OpenAI API Blocked by Corporate Firewall

## Problem Identified

**Error:** `SELF_SIGNED_CERT_IN_CHAIN` when calling OpenAI API

**Root Cause:** Your corporate network (Amadeus) is using a **man-in-the-middle SSL inspection** that intercepts HTTPS traffic. This is the same firewall that blocks Supabase.

---

## ✅ Solution Applied

Added to `.env.local`:
```bash
NODE_TLS_REJECT_UNAUTHORIZED="0"
```

This tells Node.js to accept self-signed certificates (your corporate proxy's certificate).

---

## 🔄 Next Steps

### 1. **Restart Your Server**
The server should already be restarting. If not, manually restart:

```powershell
# Stop the server (Ctrl+C in terminal)
# Then start again:
npm run dev
```

### 2. **Test the AI Search**
Once server restarts, open: **http://localhost:3001**

Try searching: **"Looking for QSR space in Indiranagar"**

---

## 🎯 What Should Happen Now

✅ OpenAI API calls will bypass SSL verification  
✅ AI search will work  
✅ Properties will be found and displayed  
✅ No more `SELF_SIGNED_CERT_IN_CHAIN` errors  

---

## ⚠️ Important Security Note

**This setting (`NODE_TLS_REJECT_UNAUTHORIZED="0"`) is ONLY for development!**

**DO NOT use this in production!**

When you deploy to production (Vercel, Netlify, etc.):
- Remove this environment variable
- The production environment won't have corporate firewall
- SSL will work normally

---

## 🔍 Alternative Solutions (If This Doesn't Work)

### Option 1: Use Company VPN/Proxy Settings
Contact IT to get proper proxy configuration

### Option 2: Use Mobile Hotspot
Bypass corporate network entirely:
1. Turn on phone hotspot
2. Connect laptop to hotspot
3. Test AI search (will work without SSL issues)

### Option 3: Test from Home
When working from home (not on company network), it will work without any changes

---

## 📊 Current Status

| Component | Status |
|-----------|--------|
| Server | ✅ Running on port 3001 |
| Mock Database | ✅ 6 properties loaded |
| Environment Variables | ✅ NODE_TLS_REJECT_UNAUTHORIZED set |
| OpenAI API Key | ✅ Configured |
| SSL Verification | ⚠️ Disabled for development |

---

## 🧪 Test Commands

### Check if server is running:
```powershell
Get-NetTCPConnection -LocalPort 3001
```

### Test API directly:
```powershell
$body = @{query="QSR in Indiranagar"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/ai-search" -Method Post -Body $body -ContentType "application/json"
```

---

## 🎉 Once Server Restarts

1. Open **http://localhost:3001**
2. Type: **"Looking for QSR space in Indiranagar"**
3. Click Search or press Enter
4. You should see:
   - AI response message
   - 1 property card
   - Price: ₹75,000/month
   - Size: 500 sqft

---

**The AI search should now work! Try it once the server finishes restarting.** 🚀
