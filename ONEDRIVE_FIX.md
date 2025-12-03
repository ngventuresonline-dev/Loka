# 🚨 ISSUE: Server Not Starting (OneDrive Conflict)

## Problem
Your project is in **OneDrive folder** which is causing file locking issues with the `.next` build folder.

**Error:** `EPERM: operation not permitted` and `EINVAL: invalid argument, readlink`

---

## ✅ SOLUTION: Exclude .next from OneDrive Sync

### Option 1: Quick Fix (Recommended)

Run this in PowerShell as **Administrator**:

```powershell
# Navigate to your project
cd "C:\Users\ndiwakar\OneDrive - Amadeus Workplace\Desktop\New folder"

# Exclude .next from OneDrive sync
attrib +U ".next" /S /D

# Clean and restart
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
npm run dev
```

### Option 2: Move Project (Best Long-Term)

Move your project OUT of OneDrive folder:

```powershell
# Create a local dev folder
New-Item -Path "C:\Dev" -ItemType Directory -Force

# Move project
Move-Item -Path "C:\Users\ndiwakar\OneDrive - Amadeus Workplace\Desktop\New folder" -Destination "C:\Dev\commercial-real-estate"

# Navigate to new location
cd "C:\Dev\commercial-real-estate"

# Start server
npm run dev
```

### Option 3: Pause OneDrive Temporarily

1. Right-click **OneDrive icon** in system tray
2. Click **"Pause syncing"**
3. Choose **"2 hours"**
4. Run: `npm run dev`

---

## 🎯 Why This Happens

OneDrive syncs files in real-time, which conflicts with Next.js trying to:
- Create/delete temporary build files
- Create symlinks
- Write trace files
- Lock files during compilation

---

## ⚡ Quick Test (Without Moving)

Try this in a **NEW PowerShell window as Administrator**:

```powershell
# Go to project
cd "C:\Users\ndiwakar\OneDrive - Amadeus Workplace\Desktop\New folder"

# Force delete .next
Remove-Item -Path ".next" -Recurse -Force

# Wait a moment
Start-Sleep -Seconds 3

# Try starting
npm run dev
```

---

## 📊 Check if Server is Actually Running

Even if it says "Starting...", check if it's accessible:

```powershell
# Test connection
Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing
```

Or just **open in browser**: http://localhost:3001

---

## 🔍 What to Do Right Now

### Step 1: Check Current Terminal
Look at the terminal where `npm run dev` is running.
- Does it say "Ready in X.Xs"?
- Or stuck on "Starting..."?

### Step 2: Try Opening Browser
**Even if it says "Starting"**, try opening: **http://localhost:3001**

Sometimes Next.js shows "Starting" but actually works!

### Step 3: If Still Not Working
Run this in PowerShell (**AS ADMINISTRATOR**):

```powershell
# Kill all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean everything
cd "C:\Users\ndiwakar\OneDrive - Amadeus Workplace\Desktop\New folder"
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue

# Reinstall and start
npm install
npm run dev
```

---

## ✅ Permanent Fix

Add this to your **`.gitignore`** file (already done, but verify):

```
.next/
node_modules/
.env.local
*.log
```

And **configure OneDrive** to exclude:
- `.next` folder
- `node_modules` folder (should already be excluded)
- `.git` folder

---

## 🎯 Expected Output When Working

When server starts successfully, you should see:

```
  ▲ Next.js 15.0.1
  - Local:        http://localhost:3001
  - Environments: .env.local, .env

✓ Starting...
✓ Ready in 3.5s
```

Then you can open: **http://localhost:3001**

---

## 🆘 Still Not Working?

Try opening a **NEW terminal as Administrator** and run:

```powershell
cd "C:\Users\ndiwakar\OneDrive - Amadeus Workplace\Desktop\New folder"
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
npm run dev
```

Or check if the server is actually running by opening **http://localhost:3001** in your browser!

---

**TLDR:** OneDrive is locking Next.js build files. Either exclude `.next` from OneDrive sync, or move the project to `C:\Dev\` folder.
