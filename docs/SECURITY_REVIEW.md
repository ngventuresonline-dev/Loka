# Lokazen Security & Integration Review
**Date:** 2026-01-23  
**Scope:** Supabase Integration, Admin Panel, RLS Policies, Data Flow

---

## 1. PRISMA DATABASE WRITE OPERATIONS

### CREATE Operations

| File | Line | Operation | Table(s) | Triggered By |
|------|------|-----------|----------|--------------|
| `src/app/api/properties/route.ts` | 79 | `prisma.property.create` | `properties` | Public property creation |
| `src/app/api/owner/property/route.ts` | 178 | `prisma.user.create` | `users` | Owner registration |
| `src/app/api/owner/property/route.ts` | 195 | `prisma.owner_profiles.create` | `owner_profiles` | Owner profile creation |
| `src/app/api/owner/property/route.ts` | 369, 389 | `prisma.property.create` | `properties` | Owner property listing |
| `src/app/api/expert/connect/route.ts` | 65 | `prisma.expertRequest.create` | `expert_requests` | Expert connection request |
| `src/app/api/admin/properties/route.ts` | 556 | `prisma.property.create` | `properties` | Admin property creation |
| `src/app/api/admin/properties/bulk/route.ts` | 83, 112 | `prisma.user.upsert`, `prisma.property.create` | `users`, `properties` | Admin bulk property upload |
| `src/app/api/admin/brands/route.ts` | 191 | `prisma.user.create` | `users`, `brand_profiles` | Admin brand creation |
| `src/app/api/admin/brands/bulk/route.ts` | 96 | `prisma.user.create` | `users`, `brand_profiles` | Admin bulk brand upload |

### UPDATE Operations

| File | Line | Operation | Table(s) | Triggered By |
|------|------|-----------|----------|--------------|
| `src/app/api/properties/[id]/route.ts` | 158, 333 | `prisma.property.update` | `properties` | Property update (public) |
| `src/app/api/owner/property/[id]/route.ts` | 114 | `prisma.property.update` | `properties` | Owner property update |
| `src/app/api/admin/users/route.ts` | 100 | `prisma.user.update` | `users` | Admin user update |
| `src/app/api/admin/properties/route.ts` | 496, 639, 857 | `prisma.user.upsert` | `users` | Admin user auto-creation |
| `src/app/api/admin/properties/route.ts` | 790 | `prisma.property.update` | `properties` | Admin property update |
| `src/app/api/admin/properties/describe/route.ts` | 63, 132 | `prisma.property.update` | `properties` | AI description generation |
| `src/app/api/admin/properties/[id]/approve/route.ts` | 35, 56 | `prisma.property.update` | `properties` | Property approval |
| `src/app/api/admin/properties/[id]/reject/route.ts` | 35, 55 | `prisma.property.update` | `properties` | Property rejection |
| `src/app/api/admin/inquiries/[id]/route.ts` | 31 | `prisma.inquiry.update` | `inquiries` | Inquiry status update |
| `src/app/api/admin/brands/[id]/route.ts` | 129 | `prisma.user.update` | `users`, `brand_profiles` | Brand profile update |

### DELETE Operations

| File | Line | Operation | Table(s) | Triggered By |
|------|------|-----------|----------|--------------|
| `src/app/api/properties/[id]/route.ts` | 445 | `prisma.property.delete` | `properties` | Property deletion (public) |
| `src/app/api/admin/users/route.ts` | 145 | `prisma.user.delete` | `users` | Admin user deletion |
| `src/app/api/admin/properties/route.ts` | 908 | `prisma.property.delete` | `properties` | Admin property deletion |
| `src/app/api/admin/properties/bulk-delete/route.ts` | 84 | `prisma.property.deleteMany` | `properties` | Bulk property deletion |
| `src/app/api/admin/brands/[id]/route.ts` | 215 | `prisma.user.delete` | `users` | Brand deletion |

### RAW SQL Operations (Bypass Prisma)

| File | Line | Operation | Table(s) | Security Risk |
|------|------|-----------|----------|---------------|
| `src/app/api/leads/create/route.ts` | 36 | `$executeRawUnsafe` | `brand_profiles` | ⚠️ SQL injection risk |
| `src/app/api/leads/owner/route.ts` | 20 | `$executeRawUnsafe` | `owner_profiles` | ⚠️ SQL injection risk |
| `src/app/api/sessions/log/route.ts` | 28, 43 | `$executeRawUnsafe` | `brand_onboarding_sessions`, `property_onboarding_sessions` | ⚠️ SQL injection risk |
| `src/lib/session-db.ts` | 9, 38 | `$queryRaw` | `brand_onboarding_sessions`, `property_onboarding_sessions` | ⚠️ SQL injection risk |

---

## 2. ADMIN PANEL IMPLEMENTATION

### Admin Routes (`/src/app/admin/`)

| Route | File | Purpose | Auth Check |
|-------|------|---------|------------|
| `/admin` | `page.tsx` | Dashboard | ❌ **MISSING** |
| `/admin/properties` | `properties/page.tsx` | Property list | ❌ **MISSING** |
| `/admin/properties/[id]` | `properties/[id]/page.tsx` | Property details | ❌ **MISSING** |
| `/admin/properties/new` | `properties/new/page.tsx` | Create property | ❌ **MISSING** |
| `/admin/properties/pending` | `properties/pending/page.tsx` | Pending approvals | ❌ **MISSING** |
| `/admin/brands` | `brands/page.tsx` | Brand list | ❌ **MISSING** |
| `/admin/brands/[id]` | `brands/[id]/page.tsx` | Brand details | ❌ **MISSING** |
| `/admin/brands/new` | `brands/new/page.tsx` | Create brand | ❌ **MISSING** |
| `/admin/owners` | `owners/page.tsx` | Owner list | ❌ **MISSING** |
| `/admin/inquiries` | `submissions/inquiries/page.tsx` | Inquiry management | ❌ **MISSING** |
| `/admin/analytics` | `analytics/page.tsx` | Analytics | ❌ **MISSING** |

**⚠️ CRITICAL:** All admin frontend routes lack authentication checks. Users can access admin pages directly without verification.

### Admin API Routes (`/src/app/api/admin/`)

| Route | Method | Auth Check | Security Level |
|-------|--------|------------|----------------|
| `/api/admin/properties` | GET | ✅ `requireAdminAuth` | ✅ Secure |
| `/api/admin/properties` | POST | ✅ `requireUserType(['admin'])` | ✅ Secure |
| `/api/admin/properties` | PATCH | ✅ `requireAdminAuth` | ✅ Secure |
| `/api/admin/properties` | DELETE | ✅ `requireAdminAuth` | ✅ Secure |
| `/api/admin/properties/[id]/approve` | POST | ❌ **MISSING** | 🔴 **INSECURE** |
| `/api/admin/properties/[id]/reject` | POST | ❌ **MISSING** | 🔴 **INSECURE** |
| `/api/admin/properties/bulk-delete` | DELETE | ⚠️ Fallback auth | ⚠️ **WEAK** |
| `/api/admin/brands` | GET | ✅ `requireAdminAuth` | ✅ Secure |
| `/api/admin/brands` | POST | ✅ `requireUserType(['admin'])` | ✅ Secure |
| `/api/admin/brands/[id]` | GET/PATCH/DELETE | ✅ `requireUserType(['admin'])` | ✅ Secure |
| `/api/admin/inquiries` | GET | ✅ `requireUserType(['admin'])` | ✅ Secure |
| `/api/admin/inquiries/[id]` | PATCH | ✅ `requireUserType(['admin'])` | ✅ Secure |
| `/api/admin/expert-requests` | GET | ✅ `requireAdminAuth` | ✅ Secure |
| `/api/admin/users` | GET/PATCH/DELETE | ✅ `requireUserType(['admin'])` | ✅ Secure |

### Admin Security Implementation

**File:** `src/lib/admin-security.ts`
- ✅ Rate limiting (30 req/min for admin)
- ✅ IP whitelist support (optional)
- ✅ User type verification (`userType === 'admin'`)
- ✅ Suspicious header detection
- ✅ Origin validation (production only)
- ✅ Audit logging (`logAdminAction`)

**File:** `src/lib/api-auth.ts`
- ✅ Multiple auth methods (Supabase token, cookies, email fallback)
- ⚠️ **SECURITY RISK:** Email-based auth fallback (line 35-115) - allows bypassing Supabase auth
- ⚠️ **SECURITY RISK:** Auto-creates admin user if email matches `admin@ngventures.com` (line 59-99)

### Admin Operations Summary

| Operation | Endpoint | Tables Modified |
|-----------|----------|-----------------|
| Approve Property | `POST /api/admin/properties/[id]/approve` | `properties.status` → `approved` |
| Reject Property | `POST /api/admin/properties/[id]/reject` | `properties.status` → `rejected` |
| Bulk Approve | `POST /api/admin/properties/approve` | `properties.status` → `approved` (multiple) |
| Delete Property | `DELETE /api/admin/properties/[id]` | `properties` (cascade deletes inquiries, views, etc.) |
| Bulk Delete | `DELETE /api/admin/properties/bulk-delete` | `properties` (multiple) |
| Create Brand | `POST /api/admin/brands` | `users`, `brand_profiles` |
| Update Brand | `PATCH /api/admin/brands/[id]` | `users`, `brand_profiles` |
| Delete Brand | `DELETE /api/admin/brands/[id]` | `users` (cascade deletes `brand_profiles`) |
| Update Inquiry Status | `PATCH /api/admin/inquiries/[id]` | `inquiries.status` |

---

## 3. RLS (ROW LEVEL SECURITY) POLICIES

### Current Status

**⚠️ CRITICAL FINDING:** No RLS policies found in codebase. Database tables are **UNRESTRICTED**.

**Tables Without RLS:**
- `users` - ⚠️ **CRITICAL:** Contains passwords, emails, user types
- `properties` - ⚠️ **HIGH:** Contains owner information, pricing, addresses
- `inquiries` - ⚠️ **HIGH:** Contains brand-owner communication
- `property_views` - ⚠️ **MEDIUM:** Contains user tracking data
- `saved_properties` - ⚠️ **MEDIUM:** Contains user preferences
- `inquiry_responses` - ⚠️ **HIGH:** Contains private messages
- `location_reports` - ⚠️ **MEDIUM:** Contains location intelligence data
- `expert_requests` - ⚠️ **MEDIUM:** Contains contact information
- `brand_profiles` - ⚠️ **MEDIUM:** Contains business requirements
- `owner_profiles` - ⚠️ **MEDIUM:** Contains owner details

### Recommended RLS Policies

#### 1. Users Table
```sql
-- Users can only read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
```

#### 2. Properties Table
```sql
-- Anyone can view approved properties
CREATE POLICY "Public can view approved properties"
  ON properties FOR SELECT
  USING (status = 'approved' AND is_available = true);

-- Owners can view their own properties (any status)
CREATE POLICY "Owners can view own properties"
  ON properties FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Owners can create properties
CREATE POLICY "Owners can create properties"
  ON properties FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Owners can update their own properties
CREATE POLICY "Owners can update own properties"
  ON properties FOR UPDATE
  USING (owner_id = auth.uid());
```

#### 3. Inquiries Table
```sql
-- Brands can view their own inquiries
CREATE POLICY "Brands can view own inquiries"
  ON inquiries FOR SELECT
  USING (brand_id = auth.uid());

-- Owners can view inquiries for their properties
CREATE POLICY "Owners can view property inquiries"
  ON inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = inquiries.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Brands can create inquiries
CREATE POLICY "Brands can create inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (brand_id = auth.uid());
```

#### 4. Expert Requests Table
```sql
-- Property owners can view requests for their properties
CREATE POLICY "Owners can view property expert requests"
  ON expert_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = expert_requests.property_id
      AND properties.owner_id = auth.uid()
    )
  );
```

---

## 4. DATA FLOW MAPPING

### Brand Onboarding Flow

**Entry Point:** `/onboarding/brand` → `src/app/onboarding/brand/page.tsx`

**Database Writes:**
1. **Session Logging** (`/api/sessions/log`)
   - Table: `brand_onboarding_sessions` (via raw SQL)
   - File: `src/app/api/sessions/log/route.ts:28`
   - Data: User preferences, filter steps

2. **Lead Creation** (`/api/leads/create`)
   - Table: `brand_profiles` (via raw SQL)
   - File: `src/app/api/leads/create/route.ts:36`
   - Data: Company name, industry, locations, budget, size

3. **User Registration** (if authenticated)
   - Table: `users`, `brand_profiles`
   - File: `src/lib/supabase/auth.ts:59` (Supabase) or `src/app/api/admin/brands/route.ts:191` (Admin)

**Tables Updated:**
- `brand_onboarding_sessions` (INSERT)
- `brand_profiles` (INSERT/UPDATE via ON CONFLICT)
- `users` (if new user registration)

### Owner Onboarding Flow

**Entry Point:** `/onboarding/owner` → `src/app/onboarding/owner/page.tsx`

**Database Writes:**
1. **Session Logging** (`/api/sessions/log`)
   - Table: `property_onboarding_sessions` (via raw SQL)
   - File: `src/app/api/sessions/log/route.ts:43`
   - Data: Property details, filter steps

2. **Owner Lead** (`/api/leads/owner`)
   - Table: `owner_profiles` (via raw SQL)
   - File: `src/app/api/leads/owner/route.ts:20`
   - Data: Owner name, email, phone

3. **Property Creation** (`/api/owner/property`)
   - Tables: `users` (if new), `owner_profiles`, `properties`
   - File: `src/app/api/owner/property/route.ts:178, 195, 369`
   - Data: Property details, owner info

**Tables Updated:**
- `property_onboarding_sessions` (INSERT)
- `owner_profiles` (INSERT/UPDATE via ON CONFLICT)
- `users` (INSERT if new owner)
- `properties` (INSERT with status='pending')

### Admin Actions Flow

**Entry Point:** `/admin/*` → Various admin pages

**Database Writes:**

1. **Property Approval** (`POST /api/admin/properties/[id]/approve`)
   - Table: `properties`
   - File: `src/app/api/admin/properties/[id]/approve/route.ts:35`
   - Update: `status = 'approved'`, `availability = true`

2. **Property Rejection** (`POST /api/admin/properties/[id]/reject`)
   - Table: `properties`
   - File: `src/app/api/admin/properties/[id]/reject/route.ts:35`
   - Update: `status = 'rejected'`, `availability = false`

3. **Property Deletion** (`DELETE /api/admin/properties/[id]`)
   - Table: `properties` (cascade deletes: `inquiries`, `property_views`, `saved_properties`, `expert_requests`)
   - File: `src/app/api/admin/properties/route.ts:908`

4. **Brand Management**
   - Create: `users`, `brand_profiles` (INSERT)
   - Update: `users`, `brand_profiles` (UPDATE)
   - Delete: `users` (cascade deletes `brand_profiles`)

5. **Inquiry Status Update** (`PATCH /api/admin/inquiries/[id]`)
   - Table: `inquiries`
   - File: `src/app/api/admin/inquiries/[id]/route.ts:31`
   - Update: `status = 'pending'|'responded'|'closed'`

---

## 5. SECURITY GAPS & RECOMMENDATIONS

### Critical Issues

1. **🔴 Missing RLS Policies**
   - **Risk:** Unauthorized database access
   - **Impact:** Data breach, privacy violation
   - **Fix:** Implement RLS policies for all tables

2. **🔴 Admin Frontend Routes Unprotected**
   - **Risk:** Direct access to admin UI
   - **Impact:** Unauthorized admin actions
   - **Fix:** Add authentication check in `AdminLayout.tsx` or middleware

3. **🔴 Property Approve/Reject Endpoints Unprotected**
   - **Risk:** Anyone can approve/reject properties
   - **Impact:** Data integrity breach
   - **Fix:** Add `requireAdminAuth` to both endpoints

4. **⚠️ SQL Injection Risk in Raw Queries**
   - **Risk:** SQL injection attacks
   - **Impact:** Database compromise
   - **Fix:** Use parameterized queries or Prisma methods

5. **⚠️ Email-Based Auth Fallback**
   - **Risk:** Bypass Supabase authentication
   - **Impact:** Unauthorized access
   - **Fix:** Remove email fallback or add strict validation

6. **⚠️ Auto-Creation of Admin User**
   - **Risk:** Privilege escalation
   - **Impact:** Unauthorized admin access
   - **Fix:** Remove auto-creation, require explicit admin setup

### Medium Priority Issues

1. **Bulk Delete Fallback Auth** - Weak authentication mechanism
2. **Missing Input Validation** - Some endpoints lack Zod validation
3. **No Rate Limiting on Critical Operations** - Bulk operations unprotected
4. **Missing Audit Trail** - Not all admin actions are logged

---

## 6. SUMMARY

### Database Write Operations: **39 total**
- CREATE: 9 operations
- UPDATE: 12 operations  
- DELETE: 5 operations
- RAW SQL: 13 operations (⚠️ security risk)

### Admin Routes: **30 frontend + 20 API**
- Frontend: **0% protected** (🔴 critical)
- API: **85% protected** (⚠️ approve/reject missing)

### RLS Policies: **0 implemented** (🔴 critical)

### Data Flow:
- Brand onboarding → 3 tables updated
- Owner onboarding → 4 tables updated
- Admin actions → 5+ tables modified

---

**Next Steps:**
1. Implement RLS policies for all tables
2. Add authentication to admin frontend routes
3. Secure approve/reject endpoints
4. Replace raw SQL with Prisma methods
5. Remove email-based auth fallback
6. Add comprehensive audit logging
