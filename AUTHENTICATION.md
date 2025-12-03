# N&G Ventures Authentication System

## Overview
Complete authentication system with account creation, login, and session management using browser localStorage (easily upgradeable to a real database).

## Features

### ✅ User Registration (`/auth/register`)
- Full name, email, phone (optional)
- Password with confirmation
- User type selection (Brand or Property Owner)
- Email validation
- Password strength requirements (minimum 6 characters)
- Duplicate email detection
- SHA-256 password hashing
- Beautiful Cosmic Purple & Blue theme UI

### ✅ User Login (`/auth/login`)
- Email and password authentication
- "Remember me" option
- Password verification
- Session management (24-hour expiry)
- Error handling with user-friendly messages
- Social login buttons (Google & GitHub - UI only, needs OAuth implementation)

### ✅ Session Management
- Automatic 24-hour session expiry
- Persistent login across page refreshes
- Secure session storage
- Easy logout functionality

### ✅ User Interface
- User menu in navbar with avatar
- Dropdown menu with:
  - Dashboard link
  - Profile link
  - Settings link
  - Logout button
- Responsive design
- Smooth animations

## How It Works

### 1. **Account Creation Flow**
```
User visits /auth/register
  ↓
Fills out registration form
  ↓
Validates input (email format, password length, matching passwords)
  ↓
Checks for existing email
  ↓
Hashes password with SHA-256
  ↓
Creates user object and saves to localStorage
  ↓
Creates session
  ↓
Redirects to onboarding based on user type
```

### 2. **Login Flow**
```
User visits /auth/login
  ↓
Enters email and password
  ↓
System finds user by email
  ↓
Verifies password hash
  ↓
Creates session (24-hour expiry)
  ↓
Redirects to homepage
```

### 3. **Session Management**
- Sessions stored in `localStorage` as JSON
- Contains: userId, email, userType, name, timestamp
- Automatically checked on page load
- Expires after 24 hours
- Can be manually cleared via logout

## File Structure

```
src/
├── lib/
│   └── auth.ts                 # Authentication utilities
├── contexts/
│   └── AuthContext.tsx         # React context for auth state
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx       # Login page
│   │   └── register/
│   │       └── page.tsx       # Registration page
│   └── layout.tsx             # Root layout with AuthProvider
└── components/
    └── Navbar.tsx             # Updated with user menu
```

## Authentication API

### `createUser(email, password, name, userType, phone?)`
Creates a new user account.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password (will be hashed)
- `name` (string): User's full name
- `userType` ('brand' | 'owner'): Type of user
- `phone` (string, optional): User's phone number

**Returns:**
```typescript
{
  success: boolean;
  user?: User;
  error?: string;
}
```

### `loginUser(email, password)`
Authenticates a user and creates a session.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:**
```typescript
{
  success: boolean;
  user?: User;
  error?: string;
}
```

### `getCurrentUser()`
Gets the currently logged-in user.

**Returns:** `User | null`

### `isAuthenticated()`
Checks if a user is currently logged in.

**Returns:** `boolean`

### `logout()`
Logs out the current user and clears the session.

### `updateUser(userId, updates)`
Updates a user's information.

**Parameters:**
- `userId` (string): User's unique ID
- `updates` (Partial<User>): Fields to update

**Returns:** `boolean`

## Using the Auth Context

```tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function MyComponent() {
  const { user, isLoggedIn, logout, refreshUser } = useAuth()

  if (isLoggedIn) {
    return (
      <div>
        <p>Welcome, {user?.name}!</p>
        <button onClick={logout}>Logout</button>
      </div>
    )
  }

  return <a href="/auth/login">Login</a>
}
```

## Storage Schema

### Users Storage (`ngventures_users`)
```json
[
  {
    "id": "user_1730851234567_abc123def",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+1 (555) 123-4567",
    "userType": "brand",
    "passwordHash": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "createdAt": "2025-11-05T10:30:00.000Z",
    "onboardingComplete": false,
    "subscriptionTier": "free"
  }
]
```

### Session Storage (`ngventures_session`)
```json
{
  "userId": "user_1730851234567_abc123def",
  "email": "john@example.com",
  "userType": "brand",
  "name": "John Doe",
  "timestamp": 1730851234567
}
```

## Security Notes

### Current Implementation (Development/Demo)
- ✅ Password hashing with SHA-256
- ✅ Session expiry (24 hours)
- ✅ Input validation
- ✅ Duplicate email prevention
- ⚠️ LocalStorage (not secure for production)
- ⚠️ Client-side only

### For Production Upgrade
To make this production-ready, you should:

1. **Backend API**
   - Create Next.js API routes (`/api/auth/login`, `/api/auth/register`)
   - Move authentication logic to server-side
   - Use proper database (PostgreSQL, MongoDB, etc.)

2. **Better Password Security**
   - Use bcrypt or argon2 instead of SHA-256
   - Add salt to passwords
   - Implement rate limiting

3. **Secure Sessions**
   - Use HTTP-only cookies instead of localStorage
   - Implement JWT tokens
   - Add CSRF protection
   - Use secure session stores (Redis, etc.)

4. **OAuth Integration**
   - Implement actual Google OAuth
   - Implement GitHub OAuth
   - Use NextAuth.js library

5. **Additional Security**
   - Email verification
   - Password reset functionality
   - Two-factor authentication (2FA)
   - Account lockout after failed attempts

## Testing

### Create a Test Account
1. Go to `http://localhost:3001/auth/register`
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
3. Select user type (Brand or Owner)
4. Click "Create Account"

### Login
1. Go to `http://localhost:3001/auth/login`
2. Enter credentials:
   - Email: test@example.com
   - Password: test123
3. Click "Sign In"

### Check Session
1. Refresh the page - you should stay logged in
2. Check navbar - you'll see your user avatar and menu
3. Click avatar to see dropdown menu

### Logout
1. Click your avatar in the navbar
2. Click "Logout"
3. You'll be redirected to homepage (logged out)

## Upgrading to Production Database

When ready to upgrade, replace localStorage calls in `src/lib/auth.ts` with API calls:

```typescript
// Instead of:
const users = getAllUsers() // localStorage

// Use:
const response = await fetch('/api/auth/users')
const users = await response.json()
```

Then create API routes that connect to your database.

## Support

For issues or questions, please check the documentation or create an issue in the repository.

---

**Built with ❤️ for N&G Ventures**
