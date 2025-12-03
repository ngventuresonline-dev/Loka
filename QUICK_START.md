# 🚀 Quick Setup Guide - No Docker Needed!

## ✅ You've Already Added OpenAI API Key!

Great! Your OpenAI key is set. Now let's get the database running.

---

## 🗄️ Database Setup - Neon (Easiest Option)

### Why Neon?
- ✅ **FREE** tier with 0.5 GB storage
- ✅ **No installation** needed
- ✅ **Production-ready** from day 1
- ✅ **Auto-scales** when needed
- ✅ **Built-in backups**

---

## 📝 Step-by-Step Setup (5 minutes)

### Step 1: Create Neon Account

1. **Open**: https://neon.tech
2. **Sign up** - Use GitHub or Email (FREE)
3. **Create a Project**:
   - Name: `ngventures`
   - Region: Choose closest to you
   - Postgres Version: Latest (default)

### Step 2: Get Connection String

After creating project, you'll see:

```
Connection String
postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/ngventures?sslmode=require
```

**Copy this entire string!** (Click the copy button)

### Step 3: Update .env.local

1. Open `.env.local` in your editor
2. Find this line:
   ```
   DATABASE_URL="REPLACE_WITH_YOUR_NEON_DATABASE_URL"
   ```
3. **Replace it** with your Neon connection string:
   ```
   DATABASE_URL="postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/ngventures?sslmode=require"
   ```
4. **Save the file** (Ctrl+S)

---

## 🎬 Initialize Your Database

Now run these commands in PowerShell:

```powershell
# 1. Generate Prisma Client
npm run db:generate

# 2. Create all tables
npm run db:push

# 3. Add sample data (6 properties)
npm run db:seed

# 4. Start your server!
npm run dev
```

---

## 🧪 Test It!

1. Open **http://localhost:3000**
2. Try the AI search bar:
   - "Looking for QSR space in Indiranagar"
   - "I need a restaurant in Koramangala"
   - "Small cafe under 50k per month"

---

## 🎉 What You'll Have

After running these commands:
- ✅ Database with 5 tables created
- ✅ 6 sample properties in Bangalore
- ✅ 3 sample users (2 owners, 1 brand)
- ✅ AI search working with real data
- ✅ Full REST API operational

---

## 💡 Alternative: Supabase (Also Great!)

If you prefer Supabase:

1. **Go to**: https://supabase.com
2. **Create project** (FREE tier)
3. **Go to**: Settings > Database
4. **Copy**: Connection String (URI)
5. **Update** `.env.local`

Both Neon and Supabase are excellent choices!

---

## 🆘 Troubleshooting

### "Can't reach database server"
- Make sure you copied the ENTIRE connection string from Neon
- Check that it includes `?sslmode=require` at the end
- Verify your internet connection

### "Environment variable not found"
- Make sure `.env.local` is saved
- Restart your dev server (`Ctrl+C` then `npm run dev`)

### "Prisma error"
- Run: `npm run db:generate` again
- Then: `npm run db:push`

---

## 📊 Database Browser

Want to see your data in a nice UI?

```powershell
npm run db:studio
```

This opens Prisma Studio at **http://localhost:5555** where you can:
- View all tables
- Edit data
- Add new properties
- Manage users

---

## ✨ Next Commands After Setup

```powershell
# View database in browser
npm run db:studio

# Start dev server
npm run dev

# Add more sample data
npm run db:seed
```

---

## 🎯 Ready?

1. ✅ Sign up at https://neon.tech
2. ✅ Copy connection string
3. ✅ Update `.env.local`
4. ✅ Run the 4 commands above
5. ✅ Test at http://localhost:3000

**You're minutes away from having a fully functional AI-powered platform!** 🚀
