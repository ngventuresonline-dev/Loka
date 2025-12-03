# 🔍 How to Find Your Database Connection String

## Option 1: Neon (Recommended)

### Step-by-Step with Screenshots Locations:

1. **Sign up at https://neon.tech**
   - Click "Sign Up" (top right)
   - Choose "Continue with GitHub" or "Continue with Email"

2. **Create a New Project**
   - After login, click **"New Project"** button
   - Enter:
     - Name: `ngventures`
     - Region: Choose closest to you (e.g., US East, Europe)
     - Click **"Create Project"**

3. **Find Connection String - EASY WAY:**
   
   **RIGHT ON THE DASHBOARD (Immediately after creating project):**
   - You'll see a page with "Connection Details"
   - Look for a section that says **"Connection string"**
   - You'll see something like:
     ```
     postgresql://neondb_owner:xxxxxxxxxxx@ep-cool-mountain-a5s5f7j2.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - Click the **COPY** button next to it

4. **OR Find It Later:**
   - Click on your project name in the sidebar
   - Click **"Dashboard"** (left sidebar)
   - Scroll down to **"Connection Details"**
   - Under "Connection string", click **"Show password"** checkbox
   - Click **COPY** button

### What It Looks Like:
```
postgresql://[username]:[password]@ep-[project-id].[region].aws.neon.tech/[database]?sslmode=require
```

---

## Option 2: Supabase

### Step-by-Step:

1. **Sign up at https://supabase.com**
   - Click "Start your project"
   - Sign in with GitHub

2. **Create New Project**
   - Click **"New Project"**
   - Organization: Create one or select existing
   - Name: `ngventures`
   - Database Password: Create a strong password (SAVE THIS!)
   - Region: Choose closest
   - Click **"Create new project"** (takes ~2 minutes)

3. **Find Connection String:**
   
   **PATH: Settings > Database > Connection String**
   
   Detailed steps:
   - Look at the **left sidebar**
   - Click the **⚙️ Settings** icon (gear icon at bottom)
   - Click **"Database"** (in the settings menu)
   - Scroll down to **"Connection string"** section
   - You'll see tabs: `URI`, `Session mode`, `Transaction mode`
   - Click **"URI"** tab
   - Click **"Show password"** toggle
   - Click **COPY** button

### What It Looks Like:
```
postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

## 📋 Quick Comparison

| Step | Neon | Supabase |
|------|------|----------|
| Sign Up | neon.tech | supabase.com |
| Find String | Dashboard → Connection Details | Settings → Database → URI |
| Wait Time | Instant | ~2 minutes setup |
| Copy Button | ✅ Yes | ✅ Yes |

---

## ✅ After Copying Connection String

1. **Open `.env.local` in your editor**

2. **Find this line:**
   ```env
   DATABASE_URL="REPLACE_WITH_YOUR_NEON_DATABASE_URL"
   ```

3. **Replace with your copied string:**
   ```env
   DATABASE_URL="postgresql://your-actual-connection-string-here"
   ```

4. **Save the file** (Ctrl+S or Cmd+S)

---

## 🎬 Then Run Setup Commands

```powershell
# 1. Generate Prisma Client
npm run db:generate

# 2. Create tables
npm run db:push

# 3. Add sample data
npm run db:seed

# 4. Start server
npm run dev
```

---

## 🆘 Still Can't Find It?

### For Neon:
- URL: https://console.neon.tech
- Look for: **"Connection string"** on the main dashboard
- Make sure you're on the **Dashboard** tab (left sidebar)

### For Supabase:
- URL: https://app.supabase.com
- Path: **Settings** (bottom left) → **Database** → Scroll to **"Connection string"**
- Make sure **"Show password"** is checked

---

## 💡 Pro Tip

Both Neon and Supabase have a **COPY button** right next to the connection string. Just click it and paste directly into `.env.local`!

---

## ✨ Connection String Format

A valid PostgreSQL connection string looks like this:

```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

**Make sure it includes:**
- ✅ Starts with `postgresql://`
- ✅ Has `@` symbol
- ✅ Ends with database name
- ✅ May have `?sslmode=require` at the end (for cloud databases)

---

## 🎯 Ready to Continue?

Once you have your connection string:
1. ✅ Paste it in `.env.local`
2. ✅ Save the file
3. ✅ Run: `npm run db:generate`
4. ✅ Run: `npm run db:push`
5. ✅ Run: `npm run db:seed`
6. ✅ Run: `npm run dev`

**Your AI-powered platform will be live!** 🚀
