# Supabase Integration Setup Guide

This guide will help you set up Supabase for the LOKAZEN platform.

## 📋 Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. Your project dependencies installed

## 🚀 Step 1: Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `lokazen` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for project to be provisioned (~2 minutes)

## 🔑 Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

## ⚙️ Step 3: Configure Environment Variables

Create or update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (can use Supabase PostgreSQL or separate)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Existing variables
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

**Note**: You can use Supabase's PostgreSQL database by getting the connection string from:
- Supabase Dashboard > Settings > Database > Connection string > URI

## 🗄️ Step 4: Set Up Database Tables

### Option A: Use Existing Prisma Schema

Your existing Prisma schema will work with Supabase PostgreSQL. Run:

```bash
npm run db:push
```

This will create all tables in your Supabase database.

### Option B: Create Tables via Supabase SQL Editor

1. Go to **SQL Editor** in Supabase dashboard
2. Run the SQL from `database/schema.sql`
3. Or create tables manually via Table Editor

## 📦 Step 5: Create Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Create the following buckets:

   **Bucket 1: `property-images`**
   - Public: ✅ Yes
   - File size limit: 10 MB
   - Allowed MIME types: `image/*`

   **Bucket 2: `user-avatars`**
   - Public: ✅ Yes
   - File size limit: 5 MB
   - Allowed MIME types: `image/*`

   **Bucket 3: `documents`** (optional)
   - Public: ❌ No
   - File size limit: 50 MB
   - Allowed MIME types: `application/pdf`, `application/msword`, etc.

3. For each bucket, set up **Storage Policies**:

   **For `property-images` (Public Read, Authenticated Write):**
   ```sql
   -- Allow public read
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING (bucket_id = 'property-images');

   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated Upload" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'property-images' 
     AND auth.role() = 'authenticated'
   );

   -- Allow owners to delete their own files
   CREATE POLICY "Owner Delete" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'property-images' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

   **For `user-avatars` (Public Read, Owner Write):**
   ```sql
   -- Allow public read
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING (bucket_id = 'user-avatars');

   -- Allow users to upload their own avatar
   CREATE POLICY "User Upload Avatar" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'user-avatars' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Allow users to delete their own avatar
   CREATE POLICY "User Delete Avatar" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'user-avatars' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

## 🔐 Step 6: Configure Authentication

1. Go to **Authentication** > **Settings** in Supabase dashboard
2. Configure:
   - **Site URL**: `http://localhost:3000` (development)
   - **Redirect URLs**: Add your production URL when ready
   - **Email Auth**: Enable
   - **Email Templates**: Customize if needed

3. (Optional) Enable additional providers:
   - Google OAuth
   - GitHub OAuth
   - etc.

## 🧪 Step 7: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test authentication:
   - Try signing up a new user
   - Try signing in
   - Check Supabase Dashboard > Authentication > Users

3. Test storage:
   - Try uploading a property image
   - Check Supabase Dashboard > Storage

## 📝 Step 8: Update Your Code (If Needed)

The integration is already set up! You can now:

1. **Use Supabase Auth** instead of localStorage:
   ```typescript
   import { signIn, signUp, getCurrentUser } from '@/lib/supabase/auth'
   ```

2. **Upload images**:
   ```typescript
   import { uploadPropertyImage } from '@/lib/supabase/storage'
   ```

3. **Use Supabase in API routes**:
   ```typescript
   import { getServerClient } from '@/lib/supabase/server'
   ```

## 🔄 Migration from localStorage Auth

If you want to migrate existing users:

1. Export users from localStorage
2. Create a migration script to:
   - Create Supabase auth users
   - Create user profiles in database
   - Migrate passwords (users will need to reset)

## 🚨 Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` has all required variables
- Restart dev server after adding variables

### "Storage bucket not found"
- Create buckets in Supabase Dashboard > Storage
- Check bucket names match `STORAGE_BUCKETS` in `src/lib/supabase/storage.ts`

### "Authentication failed"
- Check Supabase project is active
- Verify API keys are correct
- Check email confirmation is enabled/disabled as needed

### "RLS Policy Error"
- Set up Row Level Security policies in Supabase
- Or use service role key for admin operations

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

## ✅ Checklist

- [ ] Supabase project created
- [ ] API keys added to `.env.local`
- [ ] Database tables created (via Prisma or SQL)
- [ ] Storage buckets created
- [ ] Storage policies configured
- [ ] Authentication configured
- [ ] Test sign up/sign in works
- [ ] Test image upload works
- [ ] API routes work with Supabase auth

---

**Need Help?** Check the Supabase documentation or create an issue in your repository.


