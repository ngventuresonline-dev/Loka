# Supabase Quick Start - Your Project

## ✅ Your Supabase Project Details

**Project URL**: `https://pasuywntzuyomkwfagep.supabase.co`  
**Database Host**: `db.pasuywntzuyomkwfagep.supabase.co`  
**Database**: `postgres`  
**Port**: `5432`  
**Username**: `postgres`  
**Password**: `[TWEETYdolls@123]`

## 🚀 Quick Setup Steps

### 1. Get Your Supabase API Keys

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project: `pasuywntzuyomkwfagep`
3. Go to **Settings** > **API**
4. Copy:
   - **Project URL**: `https://pasuywntzuyomkwfagep.supabase.co` ✅ (already have)
   - **anon/public key**: Copy this (starts with `eyJ...`)
   - **service_role key**: Copy this (starts with `eyJ...`) - Keep secret!

### 2. Create `.env.local` File

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pasuywntzuyomkwfagep.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here

# Database Connection (Supabase PostgreSQL)
# Original password: [TWEETYdolls@123]
# URL encoded password: %5BTWEETYdolls%40123%5D
# Special characters: [ = %5B, @ = %40, ] = %5D
DATABASE_URL=postgresql://postgres:%5BTWEETYdolls%40123%5D@db.pasuywntzuyomkwfagep.supabase.co:5432/postgres

# AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

**Important**: Replace `paste_your_anon_key_here` and `paste_your_service_role_key_here` with your actual keys from Supabase dashboard.

### 3. Set Up Database Tables

Run Prisma to create all tables:

```bash
npm run db:generate
npm run db:push
```

This will create all your tables in Supabase PostgreSQL.

### 4. Create Storage Buckets

1. Go to Supabase Dashboard > **Storage**
2. Create these buckets:

   **Bucket: `property-images`**
   - Public: ✅ Yes
   - File size limit: 10 MB
   - Allowed MIME types: `image/*`

   **Bucket: `user-avatars`**
   - Public: ✅ Yes
   - File size limit: 5 MB
   - Allowed MIME types: `image/*`

3. Set Storage Policies (in SQL Editor):

```sql
-- Property Images: Public read, authenticated write
CREATE POLICY "Public Read Property Images" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated Upload Property Images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- User Avatars: Public read, owner write
CREATE POLICY "Public Read User Avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "User Upload Own Avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 5. Test Connection

```bash
npm run dev
```

Visit `http://localhost:3000` and test:
- Sign up a new user
- Sign in
- Upload a property image

### 6. Verify in Supabase Dashboard

- **Authentication** > **Users**: Should see new users
- **Table Editor**: Should see your tables (users, properties, etc.)
- **Storage**: Should see uploaded files

## 🔐 Password URL Encoding

Your password `[TWEETYdolls@123]` contains special characters that need URL encoding:

- `[` → `%5B`
- `@` → `%40`
- `]` → `%5D`

So the encoded password is: `%5BTWEETYdolls%40123%5D`

The connection string is already correctly formatted in the `.env.local` example above.

## ✅ Checklist

- [ ] Got API keys from Supabase dashboard
- [ ] Created `.env.local` with all variables
- [ ] Ran `npm run db:push` to create tables
- [ ] Created storage buckets
- [ ] Set storage policies
- [ ] Tested sign up/sign in
- [ ] Tested image upload

## 🆘 Troubleshooting

**"Missing Supabase environment variables"**
- Check `.env.local` exists in project root
- Restart dev server after creating `.env.local`

**"Database connection failed"**
- Verify password is URL encoded correctly
- Check database is accessible (Supabase dashboard > Database > Connection pooling)

**"Storage bucket not found"**
- Create buckets in Supabase Dashboard > Storage
- Check bucket names match exactly: `property-images`, `user-avatars`

---

**Ready to go!** Your Supabase integration is configured. 🚀

