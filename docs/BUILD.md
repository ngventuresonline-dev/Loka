# BUILD TRUTH - Lokazen Commercial Real Estate Platform

**Version:** 0.1.1  
**Last Updated:** 2025-02-23  
**Platform:** Next.js 16 AI‑Matched Commercial Real Estate Platform

---

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [Architecture](#architecture)
6. [Database Schema](#database-schema)
7. [AI Search System](#ai-search-system)
8. [Component Library](#component-library)
9. [Styling & Design System](#styling--design-system)
10. [Build & Deployment](#build--deployment)
11. [Environment Configuration](#environment-configuration)
12. [Development Workflow](#development-workflow)
13. [Key Design Decisions](#key-design-decisions)
14. [Key Integrations (for Clause / Prompts)](#-key-integrations-for-clause--prompts)

---

## 🎯 Platform Overview

**Lokazen** is an AI-powered commercial real estate platform that connects brands seeking commercial spaces with property owners. The platform uses intelligent matching algorithms, location intelligence, and conversational AI to streamline the property discovery and listing process.

### Core Value Proposition
- **For Brands**: Find ideal commercial spaces with AI-powered matching in 48 hours
- **For Property Owners**: List properties and connect with qualified tenants quickly

### Key Differentiators
- Button-based conversation flow (eliminates ambiguity)
- Dual-entity support (Brands & Owners)
- AI-powered matching with BFI/PFI scoring
- Location intelligence integration
- Minimal, elegant UI/UX

---

## 🛠 Technology Stack

### Frontend Framework
- **Next.js 16.0.8** - React framework with App Router (Turbopack)
- **React 19.2.1** - UI library
- **TypeScript 5** - Type safety

### Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Custom Animations** - Keyframe animations for futuristic effects
- **Glassmorphism** - Modern UI design patterns

### AI & Machine Learning
- **Anthropic Claude 3.5 Sonnet** (`@anthropic-ai/sdk: ^0.27.3`) - Primary AI engine
- **Google Gemini** (`@google/genai: ^1.42.0`) - Alternative AI provider
- **LangChain** (`^1.1.2`) - AI orchestration
- **OpenAI SDK** (`@langchain/openai: ^1.1.3`) - Alternative AI provider

### Database & ORM
- **Prisma 6.19.0** - Next-generation ORM
- **PostgreSQL** - Primary database (via Supabase or standalone)
- **Prisma Client** - Type-safe database access
- **Supabase** (`@supabase/supabase-js: ^2.86.0`) - Backend-as-a-Service

### Authentication
- **Supabase Auth** - Primary authentication system
- **NextAuth.js 4.24.13** - Alternative authentication framework
- **Prisma Adapter** (`@auth/prisma-adapter: ^2.11.1`) - Database adapter

### 3D Graphics (Optional)
- **Three.js 0.181.2** - 3D graphics library
- **React Three Fiber 9.4.2** - React renderer for Three.js
- **React Three Drei 10.7.7** - Useful helpers for R3F

### Animation
- **Framer Motion 12.23.25** - Animation library

### Utilities
- **Zod 4.1.13** - Schema validation
- **AI SDK 5.0.106** - Vercel AI SDK
- **@vercel/analytics 1.6.1** - Vercel Analytics integration
- **@vercel/speed-insights 1.3.1** - Performance monitoring
- **date-fns 4.1.0** - Date utilities
- **date-fns-tz 3.2.0** - Timezone handling
- **lucide-react 0.562.0** - Icon library
- **recharts 3.5.1** - Charts and analytics
- **sharp 0.34.5** - Image optimization
- **clsx 2.1.1** - Conditional class names
- **tailwind-merge 3.4.0** - Tailwind class merging

### Maps & Location
- **@react-google-maps/api 2.20.8** - Google Maps React integration
- **Mappls (MapMyIndia)** - India mapping (REST API keys)

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **TSX 4.21.0** - TypeScript execution
- **PostCSS** - CSS processing
- **Autoprefixer 10.4.21** - CSS vendor prefixing

---

## 📁 Project Structure

```
Loka/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── ai-search/            # AI search endpoint
│   │   │   ├── admin/                # Admin API routes
│   │   │   │   ├── analytics/        # Analytics endpoint
│   │   │   │   ├── brands/           # Brand management (+ [id], bulk, bulk-upload)
│   │   │   │   │   ├── [id]/         # Single brand CRUD
│   │   │   │   │   └── bulk/         # Bulk operations
│   │   │   │   ├── inquiries/        # Inquiry management (+ [id])
│   │   │   │   ├── expert-requests/  # Expert visit requests (+ [id])
│   │   │   │   ├── owners/           # Owner management
│   │   │   │   ├── properties/       # Property management
│   │   │   │   │   ├── [id]/         # approve, reject, bulk-delete
│   │   │   │   │   ├── approve/      # Bulk approve
│   │   │   │   │   ├── bulk/         # Bulk operations
│   │   │   │   │   ├── bulk-delete/  # Bulk delete
│   │   │   │   │   ├── describe/     # AI property description
│   │   │   │   │   ├── migrate-titles/
│   │   │   │   │   └── migrate-property-titles/
│   │   │   │   ├── stats/            # Statistics
│   │   │   │   ├── test-auth/        # Auth testing
│   │   │   │   └── users/            # User management
│   │   │   ├── brand/                # Brand match (singular)
│   │   │   ├── brands/               # Brand endpoints
│   │   │   │   ├── match/            # Brand matching
│   │   │   │   └── matches/          # Match results
│   │   │   ├── bulk/enrich/          # Bulk enrichment
│   │   │   ├── contact-team/         # Contact form
│   │   │   ├── expert/connect/       # Expert connect
│   │   │   ├── health/               # Health check
│   │   │   ├── intelligence/[propertyId]/ # Property intelligence
│   │   │   ├── leads/                # Lead management
│   │   │   │   ├── create/
│   │   │   │   ├── owner/
│   │   │   │   └── requirements/
│   │   │   ├── location/             # Location intel by ID
│   │   │   │   └── [id]/             # scores, commercial, demographics
│   │   │   ├── location-intelligence/ # Location intel + compare
│   │   │   ├── owner/                # Owner endpoints
│   │   │   │   ├── property/         # Create property
│   │   │   │   ├── property/[id]/    # Update property
│   │   │   │   └── properties/       # List owner properties
│   │   │   ├── platform-status/      # Platform status
│   │   │   ├── profile/              # Profile lookup, brand, owner, session-type
│   │   │   ├── property/description/ # AI property description
│   │   │   ├── properties/           # Property endpoints
│   │   │   │   ├── [id]/             # Get, save
│   │   │   │   └── match/            # Property matching
│   │   │   ├── revenue/predict/      # Revenue prediction
│   │   │   ├── sessions/              # Session log, create, update, [id]
│   │   │   ├── status/               # Status endpoint
│   │   │   ├── visits/schedule/      # Visit scheduling
│   │   │   └── webhook/test-pabbly/  # Pabbly webhook test
│   │   ├── about/                    # About page
│   │   ├── admin/                    # Admin dashboard
│   │   │   ├── analytics/            # Analytics page
│   │   │   ├── brands/               # Brand management (+ [id], new, bulk-upload)
│   │   │   ├── inquiries/             # Inquiries
│   │   │   ├── matches/              # Matches
│   │   │   ├── owners/               # Owners (+ new)
│   │   │   ├── properties/           # Properties (+ [id], new, pending, bulk-upload)
│   │   │   ├── settings/             # Settings
│   │   │   ├── media/                # Media
│   │   │   ├── activity/             # Activity log
│   │   │   └── submissions/          # Submissions (inquiries, responses)
│   │   ├── auth/                     # Authentication (login, register)
│   │   ├── bangalore-map/            # Bangalore map page
│   │   ├── blog/                     # Blog ([id])
│   │   ├── brands/pricing/           # Brand pricing
│   │   ├── cookies/                  # Cookie policy
│   │   ├── dashboard/owner/          # Owner dashboard
│   │   ├── demo/                     # Demo page
│   │   ├── explainer-video/          # Explainer video
│   │   ├── filter/                   # Filter flows (brand, owner)
│   │   ├── for-brands/               # For brands landing
│   │   ├── investor-deck/             # Investor deck
│   │   ├── location-intelligence/    # Location intel page
│   │   ├── onboarding/               # Onboarding flows
│   │   │   ├── brand/                # (+ thanks)
│   │   │   └── owner/                # (+ success)
│   │   ├── payment/                  # Payment (success, failure, result)
│   │   ├── privacy/                  # Privacy policy
│   │   ├── profile/                  # Profile (brand, owner)
│   │   ├── properties/               # Properties listing
│   │   │   ├── [id]/match/           # Property match page
│   │   │   └── results/              # Search results
│   │   ├── status/                   # Status page (internal / admin only)
│   │   ├── terms/                    # Terms of service
│   │   ├── globals.css               # Global styles
│   │   ├── global-error.tsx          # Error boundary
│   │   ├── layout.tsx                # Root layout (SEO, viewport, analytics)
│   │   ├── page.tsx                  # Homepage
│   │   ├── robots.ts                 # Dynamic robots.txt
│   │   └── sitemap.ts                # Dynamic sitemap.xml
│   │
│   ├── components/                   # React Components
│   │   ├── admin/                    # Admin components
│   │   │   ├── AdminLayout.tsx, AdminSidebar.tsx
│   │   │   ├── PropertyManagementTable.tsx, InquiryManagementTable.tsx
│   │   │   ├── UserManagementTable.tsx, RecentActivity.tsx
│   │   │   └── FileUpload.tsx
│   │   ├── ExplainerVideo/           # Explainer video variants
│   │   ├── for-brands/               # HeroIllustration
│   │   ├── onboarding/               # BrandOnboardingForm
│   │   ├── ui/                       # 3d-folder, 3d-orbit-gallery, Button, marketing-badges
│   │   ├── AiSearchModal.tsx         # AI search modal
│   │   ├── BangaloreMapIllustration.tsx
│   │   ├── BrandPlacementPin.tsx, BrandRequirementsModal.tsx
│   │   ├── ButtonFlowModal.tsx       # Button-based flow
│   │   ├── CityMapBackground.tsx      # City map background
│   │   ├── Dashboard.tsx             # User dashboard
│   │   ├── DynamicBackground.tsx     # Dynamic backgrounds
│   │   ├── Footer.tsx, Navbar.tsx
│   │   ├── FuturisticBackground.tsx  # Futuristic bg effects
│   │   ├── HeroSearch.tsx, HeroSection.tsx
│   │   ├── Intelligence2026View.tsx
│   │   ├── LocationIntelligence.tsx, LocationIntelligenceSection.tsx
│   │   ├── LocationIntelligenceDashboard.tsx
│   │   ├── Logo.tsx, LogoImage.tsx
│   │   ├── MatchBreakdownChart.tsx
│   │   ├── OnboardingBrandCard.tsx
│   │   ├── OwnerOnboardingMap.tsx
│   │   ├── PhonePeCheckout.tsx
│   │   ├── PrivateInternalLayout.tsx
│   │   ├── ProfileModal.tsx, ProfileTypeModal.tsx
│   │   ├── PropertyCard.tsx, PropertyDetailsModal.tsx
│   │   ├── SchedulePicker.tsx
│   │   ├── SupabaseInitializer.tsx
│   │   ├── TrustedByLeadingBrands.tsx, TrustedBrandsRow.tsx
│   │   ├── WhatsAppButton.tsx
│   │   └── GoogleMapsErrorHandler.tsx
│   │
│   ├── contexts/                     # AuthContext.tsx
│   ├── hooks/                        # useScrollAnimation.ts
│   ├── lib/                          # ai-search/, auth.ts, matching-engine.ts, prisma.ts, theme.ts
│   └── types/                        # index.ts, workflow.ts
│
├── prisma/                           # schema.prisma, seed.ts
├── scripts/                          # Build & DB scripts
│   ├── run-prisma-with-env.js       # Prisma with env loading (db:push, db:migrate)
│   ├── import-featured-properties.ts
│   ├── import-featured-brands.ts
│   ├── seed-gvs-properties.ts, seed-growth-patterns.ts, seed-census-data.ts
│   ├── update-property-ids.ts, update-brand-ids.ts
│   ├── convert-favicon-to-png.ts, check-timezone.ts
│   ├── performance-test.js, load-test.js, click-test.js
│   └── remove-debug-logs.js
│
├── public/                           # logos/, lokazen-favicon.svg, robots.txt
├── database/                         # schema.sql
├── next.config.js, tailwind.config.js, tsconfig.json, postcss.config.js
├── package.json, vercel.json
│
└── docs/                             # Documentation (not Documentation/)
    ├── BUILD.md                      # This file
    ├── loka.md                       # Complete build truth
    ├── AI_SEARCH_CONFIG.md
    ├── BRAND_QUERY_TRAINING_DATASET.md
    ├── OWNER_QUERY_TRAINING_DATASET.md
    ├── PHONEPE_INTEGRATION.md
    ├── LOCATION_INTELLIGENCE_1000.md
    ├── GOOGLE_MAPS_SETUP.md
    ├── PABBLY_INTEGRATION_GUIDE.md
    └── (40+ other docs)
```

---

## 🎨 Core Features

### 1. **Dual-Entity Support**
- **Brand Flow**: For businesses seeking commercial spaces
- **Owner Flow**: For property owners listing properties
- Separate conversation flows with entity-specific questions

### 2. **Button-Based Conversation Flow**
- Eliminates ambiguity in user input
- Pre-defined options for categorical choices
- Multi-select support for locations
- Auto-scrolling chat interface
- SVG icons instead of emojis

### 3. **AI-Powered Search**
- Anthropic Claude 3.5 Sonnet integration
- Context-aware conversation management
- Entity type detection (Brand vs Owner)
- Detail extraction from natural language
- Fallback responses for reliability

### 4. **Data Normalization**
- Budget/rent normalization
- Area/size normalization
- Location normalization
- Number disambiguation

### 5. **Onboarding Forms**
- Brand onboarding form
- Property owner onboarding form
- Pre-filling from AI conversation data
- Local storage integration

### 6. **Property Matching**
- BFI (Brand Fit Index) scoring
- PFI (Property Fit Index) scoring
- Location intelligence
- Demographics matching

### 7. **User Dashboard**
- Property listings
- Saved properties
- Search history
- Inquiries management

### 8. **Location Intelligence**
- City-specific data (Bangalore focus)
- Zone-based filtering, micro-market, ward-level
- Area recommendations, demographics (Census 2021 + 2026 projections)
- Footfall analysis, LocationScores (cafeFitScore, qsrFitScore, etc.)
- PropertyIntelligence (2026-focused scores, revenue projections)
- Competitor POIs from Google Places

### 9. **Payments (PhonePe)**
- Brand plans, location reports, visit scheduling
- Payment model with flow, reference_id, status

### 10. **Expert Requests**
- Schedule expert visits for properties
- ExpertRequest model with status (pending, contacted, scheduled, completed, cancelled)

### 11. **Admin Dashboard**
- Properties (approve/reject workflow, bulk ops)
- Brands, Owners, Inquiries, Expert Requests
- Analytics, Stats, Matches
- Submissions, Activity, Settings, Media

---

## 🏗 Architecture

### Frontend Architecture

**Pattern**: Component-based React with Next.js App Router

```
User Request
    ↓
Next.js App Router (page.tsx)
    ↓
Layout Component (layout.tsx)
    ↓
Page Component
    ↓
Feature Components
    ├── Navbar
    ├── Hero Section
    ├── AI Search Modal
    ├── Button Flow Modal
    └── Footer
```

### AI Search Flow

```
User Input (Button/Text)
    ↓
ButtonFlowModal / AiSearchModal
    ↓
API Route (/api/ai-search)
    ↓
AI Search Logic (simple-search.ts)
    ├── Entity Detection
    ├── Detail Extraction
    ├── Normalization
    └── Response Generation
    ↓
Claude API Call
    ↓
Response Processing
    ↓
UI Update
```

### Data Flow

```
User Action
    ↓
Component State
    ↓
API Route
    ↓
Prisma Client
    ↓
PostgreSQL Database
    ↓
Response
    ↓
Component Update
```

---

## 🗄 Database Schema

### Models

#### **User**
- Single user table backing Brands, Property Owners, and Admins (`users`)
- Fields: email, name, phone, `userType` (`brand | owner | admin`), createdAt, isActive, etc.
- Relations: `brand_profiles`, `owner_profiles`, `properties`, `saved_properties`, `inquiries`, `location_reports`, `property_views`

#### **BrandProfile** (`brand_profiles`)
- One‑to‑one with a `User` of type `brand`
- Fields: `company_name`, `industry`, `preferred_locations` (JSON array), `budget_min/max`, `min_size/max_size`, `preferred_property_types`, `must_have_amenities`

#### **OwnerProfile** (`owner_profiles`)
- One‑to‑one with a `User` of type `owner`
- Fields: `company_name`, `license_number`, `total_properties`

#### **Property**
- Commercial real estate listings (`properties`)
- Location: address, city, state, zipCode, optional lat/lng
- Details: `size`, `propertyType` (`office | retail | warehouse | restaurant | other`), power/utility flags, amenities (JSON)
- Pricing: `price`, `priceType` (`monthly | yearly | sqft`), `securityDeposit`, `rentEscalation`
- Flags: `availability`, `isFeatured`, `displayOrder`, `views_count`
- **Status**: `property_status_enum` (`pending | approved | rejected`) – approval workflow
- Relations: `owner` (`users`), `inquiries`, `saved_properties`, `property_views`, `PropertyIntelligence`, `Competitor`, `ExpertRequest`

#### **SavedProperty**
- Join table for users saving properties of interest (`saved_properties`)
- Fields: `user_id`, `property_id`, optional `notes`, `created_at`
- Relations: `user`, `property`

#### **Inquiry**
- Represents an interest / conversation between a brand and an owner (`inquiries`)
- Fields: `property_id`, `brand_id`, optional `owner_id`, `message`, `status` (`pending | responded | closed`), timestamps
- Relations: `property`, `brand` (`users`), `owner` (`users`), `inquiry_responses`

#### **InquiryResponse** (`inquiry_responses`)
- Threaded messages inside an inquiry
- Fields: `inquiry_id`, `sender_id`, `message`, `created_at`

#### **LocationReport** (`location_reports`)
- Stores location intelligence / report requests
- Fields: `user_id`, `location`, `category`, `report_data` (JSON), `is_free`, `payment_id`, `amount`, `status`, `expires_at`

#### **PropertyView** (`property_views`)
- Event‑level tracking of property views
- Fields: `property_id`, optional `user_id`, `ip_address`, `user_agent`, `viewed_at`

#### **Location Intelligence (1000+ attributes)**
- **`Location`** – Core location data (lat/lng, ward, micro-market, pinCode, bbmpZone, zoning, etc.)
- **`LocationDemographics`** – Population at 100m/250m/500m/1km/3km, density, household count
- **`LocationCommercial`** – Competitor presence, saturation indices
- **`LocationMobility`** – Footfall (daily, weekday, weekend, peak hour), dwell time
- **`LocationRealEstate`** – Rent per sqft, frontage, ceiling height, power capacity
- **`LocationScores`** – cafeFitScore, qsrFitScore, luxuryFitScore, revenueProjectionMid, roi3yr, whitespaceScore

#### **Property Intelligence (2026-focused)**
- **`PropertyIntelligence`** – Per-property scores (overall, footfall, revenue, competition, access, demographic, risk), footfall data, revenue projections, competitors, demographics, accessibility
- **`AreaDemographics`** – 2026 locality projections (population, income, lifestyle)
- **`WardDemographics`** – Ward-level Census 2021 + 2026 for Bangalore
- **`CensusData`** – Census-level ward data (25 Bangalore wards)
- **`AreaGrowthPatterns`** – 2026 growth projections for localities
- **`Competitor`** – Per-property competitor POIs from Google Places

#### **Payment & Expert**
- **`Payment`** – PhonePe payments (brand plans, location reports, visit scheduling)
- **`ExpertRequest`** – Expert visit scheduling (propertyId, brandName, scheduleDateTime, status)

#### **Sessions (DB‑level, used via raw SQL)**
- **`brand_onboarding_sessions`** – snapshots of brand filter / quick sign‑in / onboarding form
- **`property_onboarding_sessions`** – snapshots of owner filter / property listing onboarding
- **Logging endpoint:** `POST /api/sessions/log` (raw SQL via Prisma `$executeRawUnsafe`)

### Indexes
- User: `email`, `user_type`
- Property: `city`, `property_type`, `owner_id`, `is_available`, `price`, `size`
- BrandProfile / OwnerProfile: `user_id`
- Inquiry: `brand_id`, `owner_id`, `property_id`, `status`
- SavedProperty: composite unique (`user_id`, `property_id`)
- LocationReport: `user_id`, `status`
- PropertyView: `property_id`, `viewed_at`
- Session tables (if created): `user_id`, `status`

---

## 🤖 AI Search System

### Architecture

**Location**: `src/lib/ai-search/`

#### Core Files

1. **`simple-search.ts`**
   - Main AI search logic
   - Entity type detection
   - Detail extraction
   - Response generation
   - Claude API integration

2. **`button-flow.ts`**
   - Button-based conversation flow
   - Step definitions
   - Navigation logic
   - State management
   - Brand and Owner flows

3. **`normalization.ts`**
   - Budget normalization
   - Area normalization
   - Location normalization
   - Number disambiguation

### Flow Steps

#### Brand Flow
1. Welcome
2. Entity Type (Brand/Owner)
3. Business Type
4. Size Range
5. All Locations (multi-select)
6. Budget Range
7. Timeline
8. Confirmation

#### Owner Flow
1. Property Type
2. Location
3. Size
4. Rent
5. Features
6. Availability
7. Confirmation

### API Endpoints

#### Core Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai-search` | POST | AI-powered search (Claude 3.5 Sonnet) |
| `/api/properties` | GET, POST | List and create properties with filtering |
| `/api/properties/[id]` | GET | Get property details |
| `/api/properties/[id]/save` | POST | Save property for user |
| `/api/properties/match` | POST | Property matching algorithm |
| `/api/brands` | GET, POST | Brand management |
| `/api/brand/match` | POST | Brand match (singular) |
| `/api/brands/match` | POST | Brand matching |
| `/api/brands/matches` | GET | Match results |
| `/api/owner/properties` | GET, POST | Owner property list |
| `/api/owner/property` | POST | Create owner property |
| `/api/owner/property/[id]` | GET, PATCH | Get/update owner property |
| `/api/platform-status` | GET | Platform health and status |
| `/api/status` | GET | System status |
| `/api/health` | GET | Health check |

#### Location & Intelligence

| Route | Method | Description |
|-------|--------|-------------|
| `/api/location-intelligence` | GET, POST | Location intelligence |
| `/api/location-intelligence/compare` | POST | Compare locations |
| `/api/location/[id]` | GET | Location by ID |
| `/api/location/[id]/scores` | GET | Location scores |
| `/api/location/[id]/demographics` | GET | Location demographics |
| `/api/location/[id]/commercial` | GET | Location commercial data |
| `/api/intelligence/[propertyId]` | GET | Property intelligence |
| `/api/property/description` | POST | AI property description |
| `/api/revenue/predict` | POST | Revenue prediction |
| `/api/bulk/enrich` | POST | Bulk enrichment |

#### Profile, Sessions & Leads

| Route | Method | Description |
|-------|--------|-------------|
| `/api/profile/lookup` | POST | Profile lookup by phone/email |
| `/api/profile/brand` | GET, POST | Brand profile |
| `/api/profile/brand/[id]` | GET | Brand profile by ID |
| `/api/profile/owner` | GET, POST | Owner profile |
| `/api/profile/owner/[id]` | GET | Owner profile by ID |
| `/api/profile/session-type` | GET | Session type |
| `/api/sessions/log` | POST | Session logging |
| `/api/sessions/create` | POST | Create session |
| `/api/sessions/update` | POST | Update session |
| `/api/sessions/[id]` | GET | Get session |
| `/api/leads/create` | POST | Create lead |
| `/api/leads/owner` | POST | Owner lead |
| `/api/leads/requirements` | GET | Lead requirements |
| `/api/contact-team` | POST | Contact form |
| `/api/expert/connect` | POST | Expert connect |
| `/api/visits/schedule` | POST | Schedule visit |
| `/api/webhook/test-pabbly` | POST | Pabbly webhook test |

#### Admin Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/properties` | GET, POST, PATCH, DELETE | Property management + approval |
| `/api/admin/properties/[id]/approve` | POST | Approve property |
| `/api/admin/properties/[id]/reject` | POST | Reject property |
| `/api/admin/properties/bulk` | POST | Bulk property ops |
| `/api/admin/properties/bulk-delete` | POST | Bulk delete |
| `/api/admin/properties/describe` | POST | AI describe |
| `/api/admin/properties/approve` | POST | Bulk approve |
| `/api/admin/brands` | GET, POST, PATCH | Brand management |
| `/api/admin/brands/[id]` | GET, PATCH | Single brand |
| `/api/admin/brands/bulk` | POST | Bulk brands |
| `/api/admin/users` | GET, PATCH | User management |
| `/api/admin/owners` | GET | Owner management |
| `/api/admin/inquiries` | GET | Inquiries |
| `/api/admin/inquiries/[id]` | GET, PATCH | Single inquiry |
| `/api/admin/expert-requests` | GET | Expert requests |
| `/api/admin/expert-requests/[id]` | GET, PATCH | Single expert request |
| `/api/admin/analytics` | GET | Platform analytics |
| `/api/admin/stats` | GET | Platform statistics |
| `/api/admin/matches` | GET | Matches |

---

## 🧩 Component Library

### Core Components

#### **AiSearchModal**
- AI chat interface
- Text-based search
- Message history
- Streaming responses
- Property results display

#### **ButtonFlowModal**
- Button-based conversation
- Step-by-step flow
- Multi-select support
- Auto-scrolling
- Summary section
- SVG icons

#### **Navbar**
- Navigation links
- User authentication
- Responsive design

#### **Dashboard**
- User dashboard
- Property listings
- Saved properties
- Search history

#### **PropertyCard**
- Property display
- Image gallery
- Key details
- Action buttons

#### **Onboarding Forms**
- **BrandOnboardingForm**: Brand registration
- **PropertyOwnerOnboardingForm**: Owner registration

### UI Components

#### **Icons**
- Centralized SVG icon components
- Dynamic icon retrieval
- Consistent styling

#### **Button**
- Reusable button component
- Variants and sizes

#### **3D Orbit Gallery**
- 3D property gallery
- Three.js integration

### Background Components

#### **DynamicBackground**
- Animated backgrounds
- Gradient effects

#### **FuturisticBackground**
- Futuristic effects
- Particle animations

#### **CityMapBackground**
- City map visualization

#### **ScrollingMapBackground**
- Scrolling map effect

### Additional Components (recent)
- **PhonePeCheckout** – PhonePe payment flow
- **LocationIntelligence**, **LocationIntelligenceSection**, **LocationIntelligenceDashboard**
- **Intelligence2026View** – 2026 projections view
- **ProfileModal**, **ProfileTypeModal** – Profile selection
- **BrandRequirementsModal** – Brand requirements
- **PropertyDetailsModal** – Property detail view
- **MatchBreakdownChart** – Recharts match breakdown
- **SchedulePicker** – Visit scheduling
- **WhatsAppButton** – WhatsApp contact
- **TrustedByLeadingBrands**, **TrustedBrandsRow**
- **ExplainerVideo** – Full platform explainers

---

## 🎨 Styling & Design System

### Design Philosophy
- **Minimal & Clean**: Elegant, uncluttered interface
- **Futuristic**: Modern animations and effects
- **Brand Colors**: Orange (#FF5200), Red (#E4002B), Orange-Red (#FF6B35)
- **Mobile-First**: Responsive design with mobile zoom prevention (16px minimum input font size)

### Color Palette

```css
Primary Orange: #FF5200
Primary Red: #E4002B
Accent Orange: #FF6B35
Background: #FFFFFF
Text: #171717 (gray-900)
Secondary Text: #6B7280 (gray-500)
```

### Typography

**Font Stack**:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica', Arial, sans-serif
```

**Scale**:
- Hero: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl`
- Headings: `text-2xl md:text-3xl lg:text-4xl`
- Body: `text-base sm:text-lg`
- Small: `text-sm`

### Animations

**Keyframe Animations** (in `globals.css`):
- `fadeInUp`: Entry animations
- `gradientShift`: Gradient movement
- `scan`: Scanning line effects
- `float`: Floating elements
- `shimmer`: Shimmer effects
- `borderPulse`: Pulsing borders
- `radiate`: Radiating glow effects

### Custom Utilities

**Tailwind Extensions**:
- Custom animations
- Gradient utilities
- Glassmorphism classes
- Scrollbar hiding

### Responsive Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

### Mobile Optimization

**Viewport Configuration**:
- `width: device-width`
- `initialScale: 1`
- `maximumScale: 1`
- `userScalable: false`

**Input Font Size**:
- All inputs, textareas, and selects have minimum 16px font size to prevent mobile zoom
- Mobile: 16px (prevents zoom on iOS & Android)
- Tablet: 18px
- Desktop: 18px+

---

## 🚀 Build & Deployment

### Build Commands

```bash
# Development
npm run dev              # Start dev server (port 3000, --webpack, NODE_TLS_REJECT_UNAUTHORIZED=0)

# Production Build
npm run build            # Build for production (next build --webpack)
npm run start            # Start production server

# Database (uses scripts/run-prisma-with-env.js for env loading)
npm run db:generate      # Generate Prisma Client
npm run db:push         # Push schema to database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:import-featured        # Import featured properties
npm run db:import-featured-brands  # Import featured brands
npm run db:seed-gvs               # Seed GVS properties
npm run db:seed-growth            # Seed growth patterns
npm run db:seed-census            # Seed census data
npm run db:setup-census           # Push + seed census
npm run db:update-property-ids    # Update property IDs
npm run db:update-brand-ids       # Update brand IDs

# Testing
npm run test:performance         # Performance test
npm run test:load                # Load test
npm run test:click               # Click test
npm run test:all                 # All tests

# Utilities
npm run favicon:convert          # Convert favicon to PNG
npm run check-timezone           # Check timezone config
npm run debug:clear              # Remove debug logs

# Code Quality
npm run lint                     # Run ESLint
```

### Build Process

1. **TypeScript Compilation**
   - Type checking
   - Path aliases resolution (`@/*`)

2. **Next.js Build**
   - Page optimization
   - Static generation
   - Image optimization (AVIF/WebP, sharp, responsive sizes)
   - Webpack bundle splitting for optimal performance
   - `optimizePackageImports` for framer-motion, recharts, @react-google-maps/api
   - CSS optimization with experimental `optimizeCss` (critters)

3. **CSS Processing**
   - Tailwind compilation
   - PostCSS processing
   - Autoprefixing

4. **Output**
   - Optimized bundles with code splitting
   - Asset optimization
   - Security headers configured
   - TZ: Asia/Kolkata (env)
   - NEXT_PUBLIC_APP_URL (env)

### Deployment

**Platform**: Vercel (configured via `vercel.json`)

**Build Settings**:
- Framework: Next.js
- Build Command: `npm run build`
- Install Command: `npm install --legacy-peer-deps`
- Post-install: `prisma generate` (via package.json postinstall)

---

## ⚙️ Environment Configuration

### Required Environment Variables

```env
# AI
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Supabase (Required for auth and storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App URL (optional, for links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional Environment Variables

```env
# Development (bypass SSL for corporate firewalls - DO NOT use in production)
NODE_TLS_REJECT_UNAUTHORIZED=0

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
GOOGLE_AI_API_KEY=your_google_ai_key

# Mappls (MapMyIndia) - India mapping
MAPPLS_REST_API_KEY=your_mappls_rest_key
NEXT_PUBLIC_MAPPLS_REST_API_KEY=your_mappls_rest_key
MAPPLS_CLIENT_ID=your_client_id
MAPPLS_CLIENT_SECRET=your_client_secret

# PhonePe Payment Gateway
PHONEPE_CLIENT_ID=your_phonepe_client_id
PHONEPE_CLIENT_VERSION=1
PHONEPE_CLIENT_SECRET=your_phonepe_secret
PHONEPE_SANDBOX=false
PHONEPE_WEBHOOK_USERNAME=
PHONEPE_WEBHOOK_PASSWORD=
NEXT_PUBLIC_PHONEPE_SANDBOX=false

# Optional: OpenAI (if using)
OPENAI_API_KEY=your_openai_key
```

### Development Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd Loka
   ```

2. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   Note: Prisma Client is automatically generated via `postinstall` script

3. **Setup Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```
   Required variables:
   - `ANTHROPIC_API_KEY` - For AI search
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

4. **Setup Database**
   ```bash
   npm run db:generate  # Generate Prisma Client
   npm run db:push      # Push schema (uses run-prisma-with-env.js)
   npm run db:seed      # Seed database with initial data
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Note: Dev server uses `--webpack`, `cross-env NODE_TLS_REJECT_UNAUTHORIZED=0` for local development

6. **Open Browser**
   ```
   http://localhost:3000
   ```

---

## 🔄 Development Workflow

### Feature Development

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Develop Feature**
   - Write components in `src/components/`
   - Add pages in `src/app/`
   - Update types in `src/types/`

3. **Test Locally**
   ```bash
   npm run dev
   ```

4. **Type Check**
   ```bash
   npx tsc --noEmit
   ```

5. **Lint**
   ```bash
   npm run lint
   ```

6. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: add feature"
   git push origin feature/feature-name
   ```

### Database Changes

1. **Update Schema**
   - Edit `prisma/schema.prisma`

2. **Generate Migration**
   ```bash
   npm run db:migrate
   ```

3. **Update Prisma Client**
   ```bash
   npm run db:generate
   ```

### Styling Changes

1. **Update Tailwind Config**
   - Edit `tailwind.config.js`

2. **Add Custom Styles**
   - Edit `src/app/globals.css`

3. **Test Responsive**
   - Check mobile, tablet, desktop views

---

## 🎯 Key Design Decisions

### 1. **Button-Based Flow Over Free-Form Text**
**Decision**: Use button-based conversation flow instead of free-form text input.

**Rationale**:
- Eliminates ambiguity (no "500" confusion)
- Faster input (click vs type)
- Better data quality
- Mobile-friendly
- Professional UX

**Implementation**: `ButtonFlowModal.tsx` with step-by-step flow

### 2. **Separate Brand and Owner Flows**
**Decision**: Completely separate conversation flows for brands and owners.

**Rationale**:
- Different questions for different entities
- Clearer user experience
- Better data collection
- Easier to maintain

**Implementation**: Separate step definitions in `button-flow.ts`

### 3. **Minimal, Clean Hero Design**
**Decision**: Keep hero section minimal and elegant, not over-designed.

**Rationale**:
- Professional appearance
- Focus on content
- Better conversion
- Modern aesthetic

**Implementation**: Clean white cards with subtle borders

### 4. **Normalization Module**
**Decision**: Separate normalization logic from search logic.

**Rationale**:
- Reusability
- Testability
- Maintainability
- Single responsibility

**Implementation**: `src/lib/ai-search/normalization.ts`

### 5. **SVG Icons Over Emojis**
**Decision**: Use SVG icons instead of emojis.

**Rationale**:
- Professional appearance
- Consistent styling
- Better accessibility
- Scalable

**Implementation**: `src/components/Icons.tsx`

### 6. **Local Storage for Pre-filling**
**Decision**: Store collected data in localStorage for form pre-filling.

**Rationale**:
- Better UX (no re-entry)
- Seamless transition
- Data persistence

**Implementation**: localStorage in `ButtonFlowModal.tsx`

### 7. **Auto-Scrolling Chat**
**Decision**: Auto-scroll chat to bottom on new messages.

**Rationale**:
- Better UX
- Always see latest message
- No manual scrolling needed

**Implementation**: `useEffect` with scrollIntoView

### 8. **Dual Value Proposition**
**Decision**: Show value props for both brands and owners in hero.

**Rationale**:
- Clear messaging
- Address both audiences
- Better conversion

**Implementation**: Two compact cards in hero section

---

## 📊 Performance Considerations

### Optimizations

1. **Image Optimization**
   - Next.js Image component (currently disabled)
   - Lazy loading
   - Responsive images

2. **Code Splitting**
   - Next.js automatic code splitting
   - Dynamic imports for heavy components

3. **CSS Optimization**
   - Tailwind purging unused styles
   - Critical CSS extraction

4. **API Optimization**
   - Response caching
   - Request debouncing
   - Streaming responses

### Bundle Size

- **Framework**: Next.js handles optimization
- **Dependencies**: Minimal external dependencies
- **3D Graphics**: Optional, lazy-loaded

---

## 🔒 Security

### Authentication
- NextAuth.js with secure sessions
- Password hashing
- CSRF protection

### API Security
- Rate limiting (recommended)
- Input validation (Zod)
- SQL injection prevention (Prisma)

### Data Privacy
- User data encryption
- Secure API keys
- Environment variable protection

---

## 🧪 Testing Strategy

### Manual Testing
- User flows (Brand & Owner)
- AI search functionality
- Form submissions
- Responsive design

### Recommended Testing
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright)
- AI response validation

---

## 📈 Analytics & Monitoring

### Current Integrations
- **Vercel Analytics** - Integrated via `@vercel/analytics` package
- **Vercel Speed Insights** - Performance monitoring via `@vercel/speed-insights`
- **SEO Optimization** - Meta tags, Open Graph, Twitter Cards, JSON-LD structured data
- **Sitemap & Robots** - Dynamic sitemap.ts and robots.ts for search engine optimization

### Recommended Integrations
- Error tracking (Sentry)
- Performance monitoring
- Google Analytics (optional)

### Metrics to Track
- User conversions
- AI search success rate
- Property match quality
- User engagement

---

## 🐛 Known Issues & Limitations

1. **No Rate Limiting**
   - API endpoints lack rate limiting
   - Recommended for production deployment

2. **3D Graphics Optional**
   - Three.js components may not be used
   - Can be removed if not needed

3. **Development Dependencies**
   - Some debug endpoints exist (`/api/admin/debug`)
   - Should be disabled in production

---

## 🚧 Future Enhancements

### Planned Features
- [ ] Advanced property filtering
- [ ] Real-time chat between brands and owners
- [ ] Property comparison tool
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Payment integration
- [ ] Document management
- [ ] Video property tours

### Technical Improvements
- [ ] Full test coverage
- [ ] Performance optimization
- [ ] SEO improvements
- [ ] Accessibility enhancements
- [ ] Internationalization (i18n)

---

## 📝 License

**Private** - Lokazen Proprietary

---

## 👥 Contributors

- Development Team
- Design Team
- Product Team

---

## 📞 Support

For issues, questions, or contributions, contact the development team.

---

**Document Version**: 1.3  
**Last Updated**: 2025-02-23  
**Maintained By**: Lokazen Development Team

---

## 🔗 Key Integrations (for Clause / Prompts)

- **PhonePe** – Payment gateway for brand plans, location reports, visit scheduling (`docs/PHONEPE_INTEGRATION.md`)
- **Pabbly** – Webhook automation (`docs/PABBLY_INTEGRATION_GUIDE.md`, `/api/webhook/test-pabbly`)
- **Google Maps** – Maps, Places, geocoding (`docs/GOOGLE_MAPS_SETUP.md`, `@react-google-maps/api`)
- **Mappls (MapMyIndia)** – India mapping, REST API
- **Supabase** – Auth, storage, PostgreSQL
- **Anthropic Claude** – AI search, property description
- **Google Gemini** – Alternative AI (`GOOGLE_AI_API_KEY`)

---

*This document represents the complete build truth of the Lokazen Commercial Real Estate Platform. Use it for Clause prompts and AI context. Keep it updated as the platform evolves.*

