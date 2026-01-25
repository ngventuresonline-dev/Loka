# Fix Prisma Generate File Lock Error

## Problem
```
EPERM: operation not permitted, rename '...\query_engine-windows.dll.node.tmp...' -> '...\query_engine-windows.dll.node'
```

This error occurs when Prisma tries to regenerate the client but the files are locked by a running process (usually the dev server).

## Solutions

### Option 1: Stop Dev Server (Recommended)
1. Stop your Next.js dev server (Ctrl+C in the terminal running `npm run dev`)
2. Wait 2-3 seconds for file handles to release
3. Run: `npx prisma generate`
4. Restart dev server: `npm run dev`

### Option 2: Kill Node Processes
If stopping the dev server doesn't work:

**Windows PowerShell:**
```powershell
# Find Node processes
Get-Process node | Select-Object Id, ProcessName, Path

# Kill all Node processes (be careful!)
Stop-Process -Name node -Force

# Then regenerate
npx prisma generate
```

**Windows CMD:**
```cmd
taskkill /F /IM node.exe
npx prisma generate
```

### Option 3: Restart VS Code/Cursor
Sometimes the IDE locks files:
1. Close VS Code/Cursor completely
2. Reopen the project
3. Run: `npx prisma generate`

### Option 4: Manual Cleanup
If all else fails:
1. Stop all Node processes
2. Delete `node_modules\.prisma` folder
3. Run: `npx prisma generate`

## After Regeneration
Once Prisma generates successfully, restart your dev server. The `map_link` workaround will be active and properties will store `map_link` in the `amenities` JSONB field.
