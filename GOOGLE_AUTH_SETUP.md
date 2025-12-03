# Google Authentication Setup Guide

## 🔐 Complete Authentication System

Your N&G Ventures platform now has a **fully functional authentication system** with:

✅ **Email/Password Registration & Login** (Working Now!)
✅ **Google OAuth Integration** (Setup Required)
✅ **Session Management** (24-hour sessions)
✅ **Password Hashing** (SHA-256)
✅ **User Storage** (LocalStorage for demo)
✅ **Protected Routes**

---

## 📧 Current Working Features

### 1. Email/Password Authentication ✅
- **Register**: Create account at `/auth/register`
- **Login**: Sign in at `/auth/login`
- **Logout**: Clear session and return to homepage
- **Session**: Auto-expires after 24 hours

### Test It Now:
1. Go to `http://localhost:3001/auth/register`
2. Create an account with any email/password
3. Login and access your dashboard!

---

## 🔧 Google OAuth Setup (Optional)

To enable "Continue with Google" button, follow these steps:

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name it "N&G Ventures" or similar
4. Click "Create"

### Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: External
   - App name: N&G Ventures
   - User support email: your email
   - Developer contact: your email
   - Scopes: email, profile
   - Save and continue

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: N&G Ventures Web
   
5. **Authorized redirect URIs** - Add these:
   ```
   http://localhost:3001/auth/google/callback
   http://localhost:3000/auth/google/callback
   ```
   
6. Click "Create"
7. **Copy your Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

### Step 4: Add to Environment Variables

1. Create `.env.local` file in your project root if it doesn't exist:
   ```bash
   touch .env.local
   ```

2. Add your Google Client ID:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   ```

3. Restart your Next.js development server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

### Step 5: Test Google Login

1. Go to `/auth/login`
2. Click "Continue with Google"
3. Should redirect to Google login
4. After authentication, returns to your app

---

## 🏗️ How Authentication Works

### Registration Flow
```
User fills form → Validate inputs → Hash password → 
Save to localStorage → Create session → Redirect to home
```

### Login Flow
```
User enters credentials → Find user by email → 
Verify password hash → Create session → Redirect to home
```

### Google OAuth Flow
```
Click Google button → Redirect to Google → 
User grants permission → Google callback → 
Check if user exists → Create/Login user → 
Create session → Redirect to home
```

### Session Management
```
- Sessions stored in localStorage
- Auto-expire after 24 hours
- Checked on every page load
- Can logout manually
```

---

## 🗄️ Current Storage System

**LocalStorage** (Good for demo, upgrade for production):
- `ngventures_users`: Array of all registered users
- `ngventures_session`: Current active session

### For Production, Migrate To:
- **Database**: PostgreSQL, MongoDB, MySQL
- **Backend**: Next.js API routes with proper encryption
- **Auth Service**: Supabase, Auth0, Firebase Auth
- **Password**: bcrypt instead of SHA-256
- **Sessions**: JWT tokens, Redis sessions

---

## 📝 Files Modified/Created

### New Files:
- ✅ `/src/lib/auth.ts` - Authentication logic
- ✅ `/src/app/auth/login/page.tsx` - Login page
- ✅ `/src/app/auth/register/page.tsx` - Register page
- ✅ `GOOGLE_AUTH_SETUP.md` - This documentation

### Authentication Functions:
```typescript
// In /src/lib/auth.ts
- createUser() - Register new user
- loginUser() - Authenticate user
- loginWithGoogle() - OAuth login
- logout() - Clear session
- isAuthenticated() - Check if logged in
- getCurrentUser() - Get logged in user
- updateUser() - Update user info
```

---

## 🧪 Testing the System

### Test Registration:
```
Name: John Doe
Email: john@example.com
Password: test123
User Type: Brand
```

### Test Login:
```
Email: john@example.com
Password: test123
```

### Check Storage (Browser DevTools):
1. Open DevTools (F12)
2. Go to "Application" tab
3. Expand "Local Storage"
4. Click on `http://localhost:3001`
5. See `ngventures_users` and `ngventures_session`

---

## 🚀 Next Steps

1. **Test current email/password authentication** ✅
2. **Optionally set up Google OAuth** (follow steps above)
3. **Add forgot password functionality**
4. **Add email verification**
5. **Migrate to database for production**
6. **Add two-factor authentication**
7. **Implement refresh tokens**

---

## 🆘 Troubleshooting

### "Google login shows alert"
- This is normal! Google Client ID not configured yet
- Follow Step 4 to add your Client ID
- Or just use email/password login

### "Can't create account"
- Check browser console for errors
- Make sure LocalStorage is enabled
- Try different email

### "Session expired"
- Sessions expire after 24 hours
- Just login again

### "Lost my users"
- LocalStorage cleared (cleared browser data)
- This is why production needs a database!

---

## 🎉 You're All Set!

Your authentication system is **fully functional** right now with email/password!

Google OAuth is optional and can be added anytime by following the setup steps above.

**Start using it:**
1. Visit: `http://localhost:3001/auth/register`
2. Create your account
3. Login and enjoy!

---

*For questions or issues, check the code in `/src/lib/auth.ts` and `/src/app/auth/` pages.*
