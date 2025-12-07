# Database Tables Explanation - Supabase PostgreSQL

This document explains all the tables in your Supabase database and how they're used in the Commercial Real Estate Platform.

---

## 📊 **Core Tables Overview**

Your database has **9 main tables** organized into these categories:
1. **User Management** (1 table)
2. **User Profiles** (2 tables)
3. **Property Management** (2 tables)
4. **Communication** (2 tables)
5. **Analytics & Tracking** (2 tables)

---

## 1. 👤 **users** Table
**Purpose**: Central user authentication and basic information

**Key Fields**:
- `id` - Unique user identifier (UUID)
- `email` - User's email (unique, used for login)
- `password_hash` - Hashed password for authentication
- `name` - User's full name
- `phone` - Contact phone number
- `user_type` - Enum: `'brand'`, `'owner'`, or `'admin'`
- `is_active` - Whether the account is active
- `created_at`, `updated_at` - Timestamps

**Use Cases**:
- User registration and login
- Authentication across the platform
- Differentiating between brands, property owners, and admins
- Base table that all other user-related tables reference

**Relationships**:
- One user can have ONE `brand_profiles` OR `owner_profiles` (depending on user_type)
- One user can have MANY `properties` (if owner)
- One user can have MANY `inquiries` (as brand or owner)
- One user can have MANY `saved_properties` (if brand)

---

## 2. 🏢 **brand_profiles** Table
**Purpose**: Extended profile information for brands (companies looking for properties)

**Key Fields**:
- `user_id` - Links to `users` table (one-to-one)
- `company_name` - Brand's company name
- `industry` - Industry sector (e.g., "Retail", "Food & Beverage")
- `preferred_locations` - JSON array of preferred cities/areas
- `budget_min` / `budget_max` - Budget range for rent
- `min_size` / `max_size` - Preferred property size range (sq ft)
- `preferred_property_types` - JSON array (e.g., ["retail", "restaurant"])
- `must_have_amenities` - JSON array of required amenities

**Use Cases**:
- Storing brand preferences for AI-powered property matching
- Pre-filling search filters based on brand profile
- Onboarding flow for brands
- Personalized property recommendations

**Example Data**:
```json
{
  "company_name": "Starbucks",
  "industry": "Food & Beverage",
  "preferred_locations": ["Bangalore", "Mumbai", "Delhi"],
  "budget_min": 50000,
  "budget_max": 150000,
  "min_size": 1000,
  "max_size": 3000,
  "preferred_property_types": ["retail", "restaurant"],
  "must_have_amenities": ["Parking", "AC", "WiFi"]
}
```

---

## 3. 🏘️ **owner_profiles** Table
**Purpose**: Extended profile information for property owners

**Key Fields**:
- `user_id` - Links to `users` table (one-to-one)
- `company_name` - Owner's company name (if applicable)
- `license_number` - Business license number
- `total_properties` - Count of properties owned (for stats)

**Use Cases**:
- Verifying property owners
- Displaying owner information on property listings
- Admin dashboard statistics
- Owner onboarding flow

---

## 4. 🏠 **properties** Table
**Purpose**: Commercial real estate property listings

**Key Fields**:
- `id` - Unique property identifier
- `title` - Property title/name
- `description` - Detailed property description
- `address`, `city`, `state`, `zip_code` - Location details
- `price` - Rental price
- `price_type` - Enum: `'monthly'`, `'yearly'`, or `'sqft'`
- `security_deposit` - Security deposit amount
- `rent_escalation` - Annual rent increase percentage
- `size` - Property size in square feet
- `property_type` - Enum: `'office'`, `'retail'`, `'warehouse'`, `'restaurant'`, `'other'`
- `store_power_capacity` - Power capacity (e.g., "15 KW")
- `power_backup` - Boolean for backup power
- `water_facility` - Boolean for water facility
- `amenities` - JSON array of amenities
- `images` - JSON array of image URLs
- `owner_id` - Links to `users` table (the owner)
- `is_available` - Whether property is currently available
- `is_featured` - Whether to show in featured listings
- `views_count` - Number of times property was viewed

**Use Cases**:
- Property listings on the platform
- Search and filter functionality
- Property detail pages
- Owner dashboard (managing their properties)
- Brand search results

**Relationships**:
- Belongs to ONE `users` (owner)
- Has MANY `inquiries` (from brands)
- Has MANY `saved_properties` (saved by brands)
- Has MANY `property_views` (tracking views)

---

## 5. 💬 **inquiries** Table
**Purpose**: Communication between brands and property owners

**Key Fields**:
- `id` - Unique inquiry identifier
- `property_id` - Which property the inquiry is about
- `brand_id` - Brand making the inquiry
- `owner_id` - Property owner receiving the inquiry
- `message` - Inquiry message from brand
- `status` - Enum: `'pending'`, `'responded'`, or `'closed'`
- `created_at`, `updated_at` - Timestamps

**Use Cases**:
- Brands can inquire about properties
- Owners receive and respond to inquiries
- Inquiry management dashboard
- Email notifications for new inquiries

**Relationships**:
- Belongs to ONE `Property`
- Belongs to ONE `User` (brand)
- Belongs to ONE `User` (owner)
- Has MANY `inquiry_responses` (conversation thread)

---

## 6. 💬 **inquiry_responses** Table
**Purpose**: Threaded conversation responses within inquiries

**Key Fields**:
- `id` - Unique response identifier
- `inquiry_id` - Links to parent inquiry
- `sender_id` - User who sent the response (brand or owner)
- `message` - Response message
- `created_at` - Timestamp

**Use Cases**:
- Multi-message conversations between brands and owners
- Reply functionality within inquiries
- Conversation history tracking

**Relationships**:
- Belongs to ONE `Inquiry`
- Belongs to ONE `User` (sender)

---

## 7. ⭐ **saved_properties** Table
**Purpose**: Brands can save/bookmark properties they're interested in

**Key Fields**:
- `id` - Unique saved property identifier
- `user_id` - Brand who saved the property
- `property_id` - Property that was saved
- `notes` - Optional notes about why they saved it
- `created_at` - When it was saved

**Use Cases**:
- "Save for later" functionality
- Brand's saved properties list
- Comparison tool for brands
- Personal property collection

**Relationships**:
- Belongs to ONE `User` (brand)
- Belongs to ONE `Property`
- Unique constraint: A brand can only save a property once

---

## 8. 👁️ **property_views** Table
**Purpose**: Track property views for analytics

**Key Fields**:
- `id` - Unique view identifier
- `property_id` - Property that was viewed
- `user_id` - User who viewed (nullable - can track anonymous views)
- `ip_address` - IP address of viewer
- `user_agent` - Browser/device information
- `viewed_at` - Timestamp of view

**Use Cases**:
- Analytics dashboard
- Popular properties tracking
- View count increments
- User behavior analysis

**Relationships**:
- Belongs to ONE `Property`
- Belongs to ONE `User` (optional - can be null for anonymous views)

---

## 9. 📍 **location_reports** Table
**Purpose**: Location analysis reports (premium feature)

**Key Fields**:
- `id` - Unique report identifier
- `user_id` - User who requested the report
- `location` - Location address being analyzed
- `category` - Report category
- `report_data` - JSON data with analysis results
- `is_free` - Whether it's a free report
- `payment_id` - Payment transaction ID (if paid)
- `amount` - Amount charged
- `status` - Enum: `'pending'`, `'completed'`, or `'failed'`
- `created_at`, `expires_at` - Timestamps

**Use Cases**:
- Premium location analysis feature
- Foot traffic analysis
- Demographics data
- Market insights for brands
- Revenue generation (paid reports)

**Relationships**:
- Belongs to ONE `User`

---

## 🔗 **Table Relationships Summary**

```
users (1)
  ├── brand_profiles (1:1) - If user_type = 'brand'
  ├── owner_profiles (1:1) - If user_type = 'owner'
  ├── properties (1:many) - If user_type = 'owner'
  ├── inquiries (1:many) - As brand OR owner
  ├── inquiry_responses (1:many)
  ├── saved_properties (1:many) - If user_type = 'brand'
  ├── property_views (1:many)
  └── location_reports (1:many)

properties (1)
  ├── inquiries (1:many)
  ├── saved_properties (1:many)
  └── property_views (1:many)

inquiries (1)
  └── inquiry_responses (1:many)
```

---

## 🎯 **How Tables Work Together**

### **Brand Flow**:
1. Brand registers → `users` table
2. Brand completes onboarding → `brand_profiles` table
3. Brand searches properties → `properties` table
4. Brand saves property → `saved_properties` table
5. Brand inquires about property → `inquiries` table
6. Owner responds → `inquiry_responses` table

### **Owner Flow**:
1. Owner registers → `users` table
2. Owner completes onboarding → `owner_profiles` table
3. Owner lists property → `properties` table
4. Owner receives inquiry → `inquiries` table
5. Owner responds → `inquiry_responses` table
6. Views tracked → `property_views` table

### **Admin Flow**:
1. Admin can view all tables
2. Analytics from `property_views`, `inquiries`, `saved_properties`
3. User management via `users` table
4. Property moderation via `properties` table

---

## 📈 **Indexes for Performance**

All tables have strategic indexes on:
- Foreign keys (for fast joins)
- Frequently queried fields (email, user_type, status, city, etc.)
- Search fields (full-text search on properties)

---

## 🔐 **Security Notes**

- Passwords are hashed (never stored in plain text)
- Foreign keys ensure data integrity (cascade deletes)
- Unique constraints prevent duplicates
- Enums ensure valid data types

---

## 💡 **Future Enhancements**

Potential additions:
- `notifications` table - For user notifications
- `reviews` table - Property reviews/ratings
- `payments` table - Payment transactions
- `subscriptions` table - User subscription tiers
- `search_history` table - Track user searches for AI learning

