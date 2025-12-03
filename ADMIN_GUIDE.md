# N&G Ventures - Admin & User System Guide

## 🎯 Overview

N&G Ventures now has a complete three-tier user system:

### User Types

1. **Admin** - Full access to all system data and users
2. **Brand** - Can view property matches and manage their profile
3. **Property Owner** - Can list properties and view inquiries

---

## 👑 Admin Access

### Default Admin Credentials
**Email:** `admin@ngventures.com`  
**Password:** `admin123`

> ⚠️ **Important:** Change the default password after first login!

### Admin Capabilities

The admin dashboard (`/admin`) provides:

- **User Management**
  - View all registered users (brands, owners, admins)
  - See detailed user information (email, phone, type, tier, onboarding status)
  - Delete users (except other admins)
  - Filter by user type

- **System Statistics**
  - Total users count
  - Breakdown by user type (brands, owners, admins)
  - Subscription tier distribution
  - Account creation dates

- **Data Insights**
  - Monitor onboarding completion rates
  - Track subscription upgrades
  - View user activity timestamps

---

## 🔐 User Access Levels

### Admin Users
- **Access:** Full system access via `/admin` dashboard
- **Permissions:** View all users, delete non-admin users, access all statistics
- **Auto-redirect:** Admins are automatically redirected to `/admin` when visiting homepage
- **Onboarding:** Admins skip onboarding (auto-complete)
- **Default Tier:** Enterprise

### Brand Users
- **Access:** Property search and matching system
- **Permissions:** View property matches, save favorites, send inquiries
- **Dashboard:** Brand-specific dashboard with AI-powered matches
- **Onboarding:** 4-step onboarding (Business Info → Requirements → Demographics → Preferences)
- **Default Tier:** Free (upgradeable to Premium/Enterprise)

### Property Owner Users
- **Access:** Property listing and management
- **Permissions:** List properties, manage listings, view inquiries
- **Dashboard:** Owner-specific dashboard with property analytics
- **Onboarding:** 4-step onboarding (Business Info → Property Details → Amenities → Photos)
- **Default Tier:** Free (upgradeable to Premium/Enterprise)

---

## 🚀 Getting Started

### For Admins

1. Visit `http://localhost:3001/auth/login`
2. Login with admin credentials:
   - Email: `admin@ngventures.com`
   - Password: `admin123`
3. You'll be automatically redirected to `/admin`
4. View all users, statistics, and manage accounts

### For Brands

1. Visit `http://localhost:3001/auth/register`
2. Select "Brand" as user type
3. Complete registration form
4. Complete 4-step onboarding
5. Access property matches in dashboard

### For Property Owners

1. Visit `http://localhost:3001/auth/register`
2. Select "Property Owner" as user type
3. Complete registration form
4. Complete 4-step onboarding
5. Start listing properties

---

## 🔧 Technical Implementation

### Authentication System

The system uses localStorage-based authentication (demo):

**Storage Keys:**
- `ngventures_users` - All user accounts
- `ngventures_session` - Current user session (24-hour expiry)

**Security Features:**
- SHA-256 password hashing
- Session management with auto-expiry
- Role-based access control
- Admin privilege checking

### User Data Structure

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  userType: 'admin' | 'brand' | 'owner';
  passwordHash: string;
  createdAt: string;
  onboardingComplete: boolean;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  isAdmin?: boolean;
}
```

### Admin Helper Functions

```typescript
// Check if user is admin
isAdmin(user: User): boolean

// Check admin access for current session
checkAdminAccess(): boolean

// Get all users (admin only)
getAllUsersAdmin(): User[]

// Get system statistics (admin only)
getUserStatistics(): Statistics

// Delete user (admin only)
deleteUser(userId: string): boolean

// Initialize default admin account
initializeAdminAccount(): Promise<void>
```

---

## 📊 Admin Dashboard Features

### Overview Tab
- Total users, brands, owners, admins
- Visual statistics cards with gradients
- Real-time user counts

### Users Tab
- Complete user list with all details
- Search and filter capabilities
- User deletion (non-admins only)

### Brands Tab
- Filtered view of brand accounts
- Brand-specific statistics
- Subscription tier breakdown

### Owners Tab
- Filtered view of property owner accounts
- Owner-specific statistics
- Property listing counts

---

## 🎨 UI Features

### Admin Dashboard Design
- **Cosmic Purple & Blue theme** consistent with brand
- **Gradient backgrounds** with animated blobs
- **Modern cards** with glassmorphism effects
- **Color-coded badges** for user types and tiers
- **Responsive tables** with hover effects
- **Real-time statistics** with icon badges

### Access Control
- Automatic redirects based on user type
- Protected admin routes
- Session validation on page load
- Unauthorized access prevention

---

## 🔮 Future Enhancements

### Recommended Upgrades (Production)

1. **Database Migration**
   - Move from localStorage to PostgreSQL/MongoDB
   - Implement proper schema with indexes
   - Add data persistence and backup

2. **Enhanced Security**
   - Replace SHA-256 with bcrypt/argon2
   - Implement JWT tokens
   - Add refresh token mechanism
   - Enable two-factor authentication

3. **Admin Features**
   - User impersonation (view as user)
   - Bulk user operations
   - Email user directly from admin panel
   - Activity logs and audit trails
   - Export user data (CSV/Excel)
   - Advanced filtering and search

4. **Analytics**
   - User behavior tracking
   - Conversion funnels
   - Property match success rates
   - Revenue analytics

5. **Communication**
   - In-app messaging between admins and users
   - Email notifications
   - SMS alerts
   - Push notifications

---

## 🛠️ Testing Accounts

Create test accounts to explore different experiences:

### Brand Account
- Email: `test-brand@example.com`
- Password: `test123`
- Type: Brand
- Purpose: Test property search and matching

### Owner Account
- Email: `test-owner@example.com`
- Password: `test123`
- Type: Property Owner
- Purpose: Test property listing features

### Admin Account (Pre-created)
- Email: `admin@ngventures.com`
- Password: `admin123`
- Type: Admin
- Purpose: System administration

---

## 📝 Notes

- Admin account is automatically created on first app load
- Admins cannot delete other admins
- Admins skip onboarding flow
- All users default to 'free' tier (except admins → 'enterprise')
- Sessions expire after 24 hours
- Password minimum: 6 characters

---

## 🚨 Security Reminders

1. **Change default admin password immediately**
2. **Don't share admin credentials**
3. **This is a demo system using localStorage**
4. **Migrate to proper database for production**
5. **Implement proper password hashing (bcrypt) for production**
6. **Add rate limiting and CSRF protection**
7. **Enable HTTPS in production**

---

## 📞 Support

For admin access issues or questions:
- Check browser console for initialization messages
- Verify localStorage data: `localStorage.getItem('ngventures_users')`
- Clear localStorage to reset: `localStorage.clear()`
- Restart dev server: `npm run dev`

---

**Built with Next.js 15, TypeScript, Tailwind CSS**  
**Theme: Cosmic Purple & Blue**  
**Version: 2.0 - Multi-User System**
