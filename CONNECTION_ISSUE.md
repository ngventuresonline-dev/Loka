# 🚨 Connection Issue - Let's Switch to Neon

## Problem
Your network (possibly Amadeus corporate firewall) is blocking connections to Supabase.

## ✅ Solution: Use Neon Instead (2 minutes)

Neon often works better with corporate networks!

### Step 1: Create Neon Account
1. **Go to**: https://neon.tech
2. **Sign up** with GitHub (free, no credit card)
3. **Create project** named "ngventures"

### Step 2: Copy Connection String
- **Immediately after creating**, you'll see "Connection Details"
- **Click COPY** next to "Connection string"
- It will look like:
  ```
  postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
  ```

### Step 3: Update .env
Replace the DATABASE_URL in `.env` and `.env.local` with your Neon string

### Step 4: Run Setup
```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'; npx prisma db push
npm run db:seed
npm run dev
```

---

## 💡 Why Neon Works Better:
- ✅ Different ports/protocols
- ✅ Better for corporate networks  
- ✅ Just as good as Supabase
- ✅ Shows connection string immediately

---

## 🆘 Alternative: Check Supabase Status

If you want to keep trying Supabase:

1. **Check if project is "Active"** in Supabase dashboard
2. **Try from a different network** (mobile hotspot?)
3. **Check Amadeus firewall settings**

But honestly, **Neon is faster to set up!** 🚀
