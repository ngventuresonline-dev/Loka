# Vercel Deployment Guide

This guide explains how to deploy the Loka platform to Vercel and fix common deployment issues.

## ✅ Build Configuration

The project is configured with:
- **Postinstall script**: Automatically generates Prisma client after `npm install`
- **Build command**: `npm run build` (includes Prisma generation)
- **Install command**: `npm install --legacy-peer-deps`

## 🔑 Required Environment Variables

You **MUST** set these environment variables in your Vercel project settings:

### 1. Database Connection
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?connection_limit=1
```

**Important**: 
- Use the **direct connection** (port 5432), not the pooler (port 6543)
- Include `?connection_limit=1` to avoid prepared statement errors
- URL-encode special characters in password (e.g., `@` becomes `%40`)

### 2. AI Configuration
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Supabase Configuration (if using Supabase Auth/Storage)
```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Authentication (if using NextAuth)
```
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.vercel.app
```

## 📝 How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable:
   - **Name**: The variable name (e.g., `DATABASE_URL`)
   - **Value**: The variable value
   - **Environment**: Select `Production`, `Preview`, and `Development` as needed
4. Click **Save**
5. **Redeploy** your project for changes to take effect

## 🚀 Deployment Steps

1. **Push to GitHub**: Ensure all code is pushed to your repository
   ```bash
   git add .
   git commit -m "Fix Vercel deployment"
   git push
   ```

2. **Vercel Auto-Deploy**: Vercel will automatically detect the push and start building

3. **Monitor Build Logs**: 
   - Go to your Vercel project dashboard
   - Click on the deployment
   - Check the build logs for any errors

## 🔧 Common Issues and Fixes

### Issue 1: "Prisma Client not generated"
**Error**: `Cannot find module '@prisma/client'` or similar

**Fix**: 
- ✅ Already fixed! The `postinstall` script now automatically generates Prisma client
- Ensure `DATABASE_URL` is set in Vercel environment variables

### Issue 2: "Database connection failed"
**Error**: Connection timeout or authentication errors

**Fix**:
- Verify `DATABASE_URL` is correct in Vercel
- Use direct connection (port 5432) not pooler (port 6543)
- Check that your Supabase database allows connections from Vercel IPs
- Ensure password is URL-encoded

### Issue 3: "Environment variable not found"
**Error**: `Error: Environment variable not found: DATABASE_URL`

**Fix**:
- Go to Vercel Settings > Environment Variables
- Add the missing variable
- Redeploy the project

### Issue 4: "Build failed: Type errors"
**Error**: TypeScript compilation errors

**Fix**:
- Run `npm run build` locally first to catch errors
- Fix all TypeScript errors before pushing
- Ensure Prisma client is generated: `npm run db:generate`

### Issue 5: "Prepared statement already exists"
**Error**: `ERROR: prepared statement "s0" already exists`

**Fix**:
- Add `?connection_limit=1` to your `DATABASE_URL`
- This is already configured in the Prisma client setup

## 📊 Build Process

When Vercel builds your project, it will:

1. **Install dependencies**: `npm install --legacy-peer-deps`
2. **Postinstall**: Automatically runs `prisma generate`
3. **Build**: Runs `npm run build` which:
   - Generates Prisma client again (for safety)
   - Compiles TypeScript
   - Builds Next.js application
   - Optimizes assets

## ✅ Verification Checklist

Before deploying, ensure:

- [ ] All environment variables are set in Vercel
- [ ] `DATABASE_URL` uses direct connection (port 5432)
- [ ] `DATABASE_URL` includes `?connection_limit=1`
- [ ] Local build succeeds: `npm run build`
- [ ] All code is committed and pushed to GitHub
- [ ] Vercel is connected to your GitHub repository

## 🔍 Testing Deployment

After deployment:

1. Visit your Vercel URL (e.g., `https://loka-chi.vercel.app`)
2. Check the `/status` endpoint to verify all services are working
3. Test key features:
   - Homepage loads
   - AI search works
   - Database queries succeed
   - API routes respond correctly

## 📞 Support

If deployment still fails:

1. Check Vercel build logs for specific error messages
2. Verify all environment variables are set correctly
3. Test the build locally: `npm run build`
4. Check Vercel deployment logs for runtime errors

---

**Last Updated**: 2025-01-27
**Status**: ✅ Configured for Vercel deployment

