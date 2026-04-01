# LOKA - Complete Build Truth & Architecture Documentation

**Platform:** Lokazen Commercial Real Estate Platform  
**Version:** 0.1.1  
**Framework:** Next.js 16.0.8 with App Router  
**Last Updated:** 2026-01-23  
**Build Status:** ✅ Updated with cross-platform dev script support

---

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [User Flows](#user-flows)
7. [Authentication & Authorization](#authentication--authorization)
8. [AI Search System](#ai-search-system)
9. [Component Architecture](#component-architecture)
10. [Environment Configuration](#environment-configuration)
11. [Build & Deployment](#build--deployment)
12. [Key Design Decisions](#key-design-decisions)

---

## 🎯 Platform Overview

**Lokazen** is an AI-powered commercial real estate platform that connects:
- **Brands** seeking commercial spaces (retail, office, warehouse, restaurant)
- **Property Owners** listing their commercial properties

### Core Value Propositions
- **For Brands**: AI-powered property matching in 48 hours
- **For Owners**: Quick property listing and tenant connection
- **For Platform**: Intelligent matching using BFI/PFI scoring algorithms

### Key Features
- AI-powered conversational search (Anthropic Claude 3.5 Sonnet)
- Button-based flow system (eliminates ambiguity)
- Dual-entity support (Brands & Owners)
- Location intelligence integration
- Property approval workflow
- Inquiry management system
- Expert request scheduling
- Admin dashboard with analytics

---

## 🛠 Technology Stack

### Core Framework
- **Next.js 16.0.8** (`next: ^16.0.8`) - React framework with App Router
- **React 19.2.1** (`react: ^19.2.1`, `react-dom: ^19.2.1`) - UI library
- **TypeScript 5** (`typescript: ^5`) - Type safety

### AI & Machine Learning
- **Anthropic Claude 3.5 Sonnet** (`@anthropic-ai/sdk: ^0.27.3`) - Primary AI engine
- **LangChain** (`^1.1.2`) - AI orchestration
- **OpenAI SDK** (`@langchain/openai: ^1.1.3`) - Alternative AI provider
- **Vercel AI SDK** (`ai: ^5.0.106`) - AI utilities

### Database & ORM
- **Prisma 6.19.0** (`prisma: ^6.19.0`, `@prisma/client: ^6.19.0`) - Next-generation ORM
- **PostgreSQL** - Primary database
- **Supabase** (`@supabase/supabase-js: ^2.86.0`) - Backend-as-a-Service

### Authentication
- **Supabase Auth** (`@supabase/supabase-js: ^2.86.0`) - Primary authentication system
- **NextAuth.js 4.24.13** (`next-auth: ^4.24.13`) - Alternative authentication framework
- **Prisma Adapter** (`@auth/prisma-adapter: ^2.11.1`) - Database adapter for NextAuth

### Styling & UI
- **Tailwind CSS 3.4.1** (`tailwindcss: ^3.4.1`) - Utility-first CSS framework
- **Framer Motion 12.23.25** (`framer-motion: ^12.23.25`) - Animation library
- **Lucide React 0.562.0** (`lucide-react: ^0.562.0`) - Icon library
- **Autoprefixer 10.4.21** (`autoprefixer: ^10.4.21`) - CSS vendor prefixing
- **PostCSS 8** (`postcss: ^8`) - CSS processing

### Maps & Location
- **Google Maps API** (`@react-google-maps/api: ^2.20.8`) - Maps integration
- **Geocoding API** - Address to coordinates conversion

### 3D Graphics (Optional)
- **Three.js 0.181.2** (`three: ^0.181.2`) - 3D graphics library
- **React Three Fiber 9.4.2** (`@react-three/fiber: ^9.4.2`) - React renderer for Three.js
- **React Three Drei 10.7.7** (`@react-three/drei: ^10.7.7`) - Helpers for R3F

### Utilities
- **Zod 4.1.13** (`zod: ^4.1.13`) - Schema validation
- **date-fns 4.1.0** (`date-fns: ^4.1.0`) - Date utilities
- **bcryptjs 3.0.3** (`bcryptjs: ^3.0.3`) - Password hashing
- **Recharts 3.5.1** (`recharts: ^3.5.1`) - Chart library
- **cross-env 7.0.3** (`cross-env: ^7.0.3`) - Cross-platform environment variables (Windows/PowerShell compatibility)
- **clsx 2.1.1** (`clsx: ^2.1.1`) - Conditional class names
- **tailwind-merge 3.4.0** (`tailwind-merge: ^3.4.0`) - Tailwind class merging
- **sharp 0.34.5** (`sharp: ^0.34.5`) - Image processing

### Analytics & Monitoring
- **Vercel Analytics** (`@vercel/analytics: ^1.6.1`)
- **Vercel Speed Insights** (`@vercel/speed-insights: ^1.3.1`)

### Development Dependencies
- **TypeScript 5** (`typescript: ^5`) - Type safety
- **ESLint 8** (`eslint: ^8`, `eslint-config-next: ^16.0.8`) - Code linting
- **PostCSS 8** (`postcss: ^8`) - CSS processing
- **Tailwind CSS 3.4.1** (`tailwindcss: ^3.4.1`) - CSS framework
- **@types/node 20** (`@types/node: ^20`) - Node.js type definitions
- **@types/react 19.2.7** (`@types/react: ^19.2.7`) - React type definitions
- **@types/react-dom 19.2.3** (`@types/react-dom: ^19.2.3`) - React DOM type definitions
- **@types/bcryptjs 2.4.6** (`@types/bcryptjs: ^2.4.6`) - bcryptjs type definitions
- **@types/three 0.181.0** (`@types/three: ^0.181.0`) - Three.js type definitions
- **tsx 4.21.0** (`tsx: ^4.21.0`) - TypeScript execution
- **dotenv 17.2.3** (`dotenv: ^17.2.3`) - Environment variable management
- **jsdom 24.0.0** (`jsdom: ^24.0.0`) - DOM implementation for testing
- **critters 0.0.23** (`critters: ^0.0.23`) - Critical CSS extraction

---

## 📁 Project Structure

```
Loka/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── ai-search/            # AI search endpoint
│   │   │   │   └── route.ts
│   │   │   ├── admin/                # Admin API routes
│   │   │   │   ├── analytics/        # Analytics endpoint
│   │   │   │   ├── brands/           # Brand management
│   │   │   │   │   ├── [id]/         # Single brand operations
│   │   │   │   │   └── bulk/         # Bulk operations
│   │   │   │   ├── debug/            # Debug utilities
│   │   │   │   ├── expert-requests/  # Expert request management
│   │   │   │   ├── inquiries/        # Inquiry management
│   │   │   │   │   └── [id]/         # Single inquiry operations
│   │   │   │   ├── matches/          # Match management
│   │   │   │   ├── owners/           # Owner management
│   │   │   │   ├── properties/       # Property management
│   │   │   │   │   ├── [id]/         # Single property operations
│   │   │   │   │   │   ├── approve/  # Approve property
│   │   │   │   │   │   └── reject/   # Reject property
│   │   │   │   │   ├── approve/      # Bulk approve
│   │   │   │   │   ├── bulk/         # Bulk operations
│   │   │   │   │   ├── bulk-delete/  # Bulk delete
│   │   │   │   │   └── describe/     # AI description
│   │   │   │   ├── stats/            # Statistics
│   │   │   │   ├── test-auth/        # Auth testing
│   │   │   │   └── users/            # User management
│   │   │   ├── brands/               # Brand endpoints
│   │   │   │   ├── match/            # Brand matching
│   │   │   │   ├── matches/          # Match results
│   │   │   │   └── route.ts          # Brand CRUD
│   │   │   ├── contact-team/         # Contact form
│   │   │   ├── expert/               # Expert connection
│   │   │   │   └── connect/
│   │   │   ├── health/               # Health check
│   │   │   ├── leads/                # Lead management
│   │   │   │   ├── create/           # Create brand lead
│   │   │   │   ├── owner/            # Owner lead
│   │   │   │   └── requirements/     # Requirements
│   │   │   ├── location-intelligence/ # Location intel
│   │   │   ├── owner/                # Owner endpoints
│   │   │   │   ├── properties/       # Owner properties
│   │   │   │   └── property/         # Single property ops
│   │   │   ├── platform-status/      # Platform status
│   │   │   ├── properties/           # Property endpoints
│   │   │   │   ├── [id]/             # Single property
│   │   │   │   └── match/            # Property matching
│   │   │   ├── property/             # Property utilities
│   │   │   │   └── description/      # AI description
│   │   │   ├── sessions/             # Session logging
│   │   │   │   └── log/
│   │   │   ├── status/               # Status endpoint
│   │   │   ├── visits/               # Visit scheduling
│   │   │   │   └── schedule/
│   │   │   ├── webhook/              # Webhook handlers
│   │   │   │   └── test-pabbly/
│   │   │   └── health/               # Health check
│   │   ├── about/                    # About page
│   │   ├── admin/                    # Admin dashboard
│   │   │   ├── activity/            # Activity log
│   │   │   ├── analytics/           # Analytics page
│   │   │   ├── brands/              # Brand management
│   │   │   │   ├── [id]/            # Brand details
│   │   │   │   ├── bulk-upload/     # Bulk upload
│   │   │   │   ├── new/             # New brand
│   │   │   │   └── page.tsx         # Brands list
│   │   │   ├── matches/             # Match management
│   │   │   ├── media/               # Media management
│   │   │   ├── owners/              # Owner management
│   │   │   │   ├── new/             # New owner
│   │   │   │   └── page.tsx         # Owners list
│   │   │   ├── page.tsx             # Admin dashboard
│   │   │   ├── properties/          # Property management
│   │   │   │   ├── [id]/            # Property details
│   │   │   │   ├── bulk-upload/     # Bulk upload
│   │   │   │   ├── new/             # New property
│   │   │   │   ├── pending/         # Pending approvals
│   │   │   │   └── page.tsx         # Properties list
│   │   │   ├── settings/            # Settings
│   │   │   └── submissions/         # Submissions
│   │   │       ├── inquiries/       # Inquiry management
│   │   │       ├── page.tsx         # Submissions list
│   │   │       └── responses/       # Response management
│   │   ├── auth/                     # Authentication
│   │   │   ├── login/               # Login page
│   │   │   └── register/            # Register page
│   │   ├── bangalore-map/           # Bangalore map view
│   │   ├── blog/                    # Blog pages
│   │   │   └── [id]/               # Blog post
│   │   ├── cookies/                 # Cookie policy
│   │   ├── dashboard/               # User dashboard
│   │   │   └── owner/              # Owner dashboard
│   │   ├── demo/                    # Demo page
│   │   ├── error.tsx                # Error boundary
│   │   ├── explainer-video/         # Explainer video
│   │   ├── filter/                  # Filter pages
│   │   │   ├── brand/              # Brand filters
│   │   │   └── owner/              # Owner filters
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   ├── location-intelligence/   # Location intel page
│   │   ├── onboarding/              # Onboarding flows
│   │   │   ├── brand/              # Brand onboarding
│   │   │   │   ├── page.tsx        # Onboarding form
│   │   │   │   └── thanks/         # Thank you page
│   │   │   └── owner/              # Owner onboarding
│   │   │       ├── page.tsx        # Onboarding form
│   │   │       └── success/        # Success page
│   │   ├── page.tsx                 # Homepage
│   │   ├── privacy/                 # Privacy policy
│   │   ├── properties/              # Property pages
│   │   │   ├── [id]/               # Property details
│   │   │   │   └── match/          # Match page
│   │   │   └── results/            # Search results
│   │   ├── robots.ts                # Dynamic robots.txt
│   │   ├── sitemap.ts               # Dynamic sitemap.xml
│   │   ├── status/                  # Status page (internal)
│   │   ├── terms/                   # Terms of service
│   │
│   ├── components/                   # React Components
│   │   ├── admin/                   # Admin components
│   │   │   ├── AdminLayout.tsx      # Admin layout
│   │   │   ├── AdminSidebar.tsx     # Admin sidebar
│   │   │   ├── AnalyticsCharts.tsx  # Analytics charts
│   │   │   ├── FileUpload.tsx       # File upload
│   │   │   ├── InquiryManagementTable.tsx
│   │   │   ├── PlatformMetrics.tsx  # Platform metrics
│   │   │   ├── PropertyCMS.tsx       # Property CMS
│   │   │   ├── PropertyManagementTable.tsx
│   │   │   ├── RecentActivity.tsx  # Recent activity
│   │   │   ├── StatCard.tsx         # Stat card
│   │   │   └── UserManagementTable.tsx
│   │   ├── onboarding/              # Onboarding components
│   │   │   ├── BrandOnboardingForm.tsx
│   │   │   └── PropertyOwnerOnboardingForm.tsx
│   │   ├── ExplainerVideo/          # Explainer video components
│   │   │   ├── BrandRequirementsAd.tsx
│   │   │   ├── CompleteFlow.tsx
│   │   │   ├── OnboardingExplainers.tsx
│   │   │   └── index.tsx
│   │   ├── ui/                      # UI components
│   │   │   ├── 3d-orbit-gallery.tsx
│   │   │   └── Button.tsx
│   │   ├── AiSearchModal.tsx         # AI search modal
│   │   ├── AnimatedLogoLoader.tsx   # Logo loader
│   │   ├── AnimatedLogoPlaceholder.tsx
│   │   ├── BangaloreMapIllustration.tsx
│   │   ├── BrandPlacementPin.tsx     # Brand pin on map
│   │   ├── BrandRequirementsModal.tsx
│   │   ├── ButtonFlowModal.tsx       # Button-based flow
│   │   ├── CityMapBackground.tsx     # City map background
│   │   ├── Dashboard.tsx             # User dashboard
│   │   ├── DynamicBackground.tsx     # Dynamic backgrounds
│   │   ├── Footer.tsx                # Site footer
│   │   ├── FuturisticBackground.tsx  # Futuristic bg
│   │   ├── GoogleMapsErrorHandler.tsx
│   │   ├── HeroSearch.tsx            # Hero search
│   │   ├── HeroSection.tsx           # Hero section
│   │   ├── Icons.tsx                 # Icon components
│   │   ├── IndustriesGallery.tsx    # Industries showcase
│   │   ├── LocationIntelligence.tsx  # Location intel
│   │   ├── Logo.tsx                  # Logo component
│   │   ├── LogoImage.tsx             # Logo image
│   │   ├── LokazenNodesLoader.tsx    # Nodes loader
│   │   ├── LokazenNodesPlaceholder.tsx
│   │   ├── MatchBreakdownChart.tsx   # Match chart
│   │   ├── Navbar.tsx                # Navigation bar
│   │   ├── NetworkMapBackground.tsx  # Network map bg
│   │   ├── PropertyCard.tsx          # Property card
│   │   ├── PropertyDetailsModal.tsx  # Property modal
│   │   ├── SchedulePicker.tsx        # Schedule picker
│   │   ├── ScrollingMapBackground.tsx # Scrolling map
│   │   ├── SupabaseInitializer.tsx   # Supabase init
│   │   └── TrustedBrandsRow.tsx      # Trusted brands
│   │
│   ├── contexts/                     # React Contexts
│   │   └── AuthContext.tsx           # Auth context
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   └── useScrollAnimation.ts     # Scroll animation
│   │
│   ├── lib/                          # Library & Utilities
│   │   ├── ai-search/                # AI Search System
│   │   │   ├── button-flow.ts       # Button flow logic
│   │   │   ├── normalization.ts     # Data normalization
│   │   │   └── simple-search.ts     # Core AI search
│   │   ├── repositories/             # Data repositories
│   │   │   └── property-matching-repository.ts
│   │   ├── supabase/                 # Supabase utilities
│   │   │   ├── auth.ts               # Supabase auth
│   │   │   ├── client.ts             # Client setup
│   │   │   ├── index.ts              # Exports
│   │   │   ├── server.ts             # Server setup
│   │   │   └── storage.ts            # Storage utilities
│   │   ├── validations/              # Validation schemas
│   │   │   └── property.ts           # Property validation
│   │   ├── admin-security.ts         # Admin security
│   │   ├── api-auth.ts               # API authentication
│   │   ├── api-cache.ts              # API caching
│   │   ├── auth.ts                   # Auth utilities
│   │   ├── brand-id-generator.ts     # Brand ID gen
│   │   ├── brand-logos.ts            # Brand logos
│   │   ├── brand-placements.ts       # Brand placements
│   │   ├── brand-utils.ts            # Brand utilities
│   │   ├── email-service.ts          # Email service
│   │   ├── get-prisma.ts             # Prisma client getter
│   │   ├── google-maps-config.ts     # Google Maps config
│   │   ├── load-scaling.ts           # Load scaling
│   │   ├── loading-insights.ts       # Loading insights
│   │   ├── logger.ts                 # Logging utility
│   │   ├── matching-engine.ts        # Matching algorithms
│   │   ├── mockDatabase.ts           # Mock data
│   │   ├── pabbly-webhook.ts         # Pabbly webhook
│   │   ├── prisma.ts                 # Prisma client
│   │   ├── property-description.ts   # Property description
│   │   ├── property-id-generator.ts  # Property ID gen
│   │   ├── property-type-mapper.ts   # Property type mapper
│   │   ├── query-parser.ts           # Query parser
│   │   ├── rate-limit.ts             # Rate limiting
│   │   ├── session-db.ts             # Session database
│   │   ├── session-logger.ts         # Session logger
│   │   ├── theme.ts                  # Theme utilities
│   │   ├── tracking.ts                # Tracking utilities
│   │   └── utils.ts                  # General utilities
│   │
│   ├── types/                        # TypeScript Types
│   │   ├── index.ts                 # Common types
│   │   └── workflow.ts               # Workflow types
│   │
│   └── middleware.ts                 # Next.js middleware
│
├── prisma/                           # Prisma Configuration
│   ├── schema.prisma                # Database schema
│   └── seed.ts                      # Database seeding
│
├── database/                         # Database Scripts
│   ├── migrations/                  # SQL migrations
│   │   ├── 20251223_add_map_link_to_properties.sql
│   │   ├── add_map_link_column.sql
│   │   └── add_map_link_simple.sql
│   └── schema.sql                   # Database schema
│
├── public/                           # Static Assets
│   ├── logos/                       # Brand logos (24 files)
│   ├── social-media-creatives/     # Social media assets (v1, v2, v3 versions)
│   ├── lokazen-favicon.png
│   ├── lokazen-favicon.svg
│   ├── lokazen-fb-cover.svg
│   ├── lokazen-logo-text.svg
│   ├── lokazen-logo.svg
│   ├── lokazen-social.png
│   └── robots.txt                   # Static robots.txt
│
├── scripts/                          # Utility Scripts
│   ├── add-property-descriptions.ts  # Add property descriptions
│   ├── check-properties.ts          # Property checker
│   ├── click-test.js                # Click testing
│   ├── convert-favicon-to-png.ts   # Favicon converter
│   ├── create-admin-user.ts         # Create admin user
│   ├── create-expert-requests-table.ts
│   ├── import-featured-brands.ts   # Import brands
│   ├── import-featured-properties.ts # Import properties
│   ├── load-test.js                 # Load testing
│   ├── migrate-property-status.sql  # Property status migration
│   ├── performance-test.js           # Performance test
│   ├── regenerate-prisma.ps1        # Regenerate Prisma (PowerShell)
│   ├── test-db-connection.ts        # Test database connection
│   ├── test-matching.ts             # Test matching engine
│   ├── update-brand-ids.ts          # Update brand IDs
│   └── update-property-ids.ts       # Update property IDs
│
├── .eslintrc.json                    # ESLint config (legacy)
├── eslint.config.mjs                 # ESLint config (Next.js 16)
├── next.config.js                    # Next.js config
├── next-env.d.ts                     # Next.js types
├── package.json                      # Dependencies & scripts
├── package-lock.json                 # Dependency lock file
├── postcss.config.js                 # PostCSS config
├── tailwind.config.js                # Tailwind config
├── tsconfig.json                     # TypeScript config
└── vercel.json                       # Vercel deployment config
```

---

## 🗄️ Database Schema

### Models

#### **User** (`users`)
- `id` (UUID, Primary Key, Auto-generated)
- `email` (String, Unique, Max 255 chars)
- `password` (String, Mapped from `password_hash`, Max 255 chars)
- `name` (String, Max 255 chars)
- `phone` (String, Optional, Max 20 chars)
- `user_type` (Enum: `brand`, `owner`, `admin`)
- `display_order` (Int, Optional)
- `is_active` (Boolean, Default: true)
- `created_at` (Timestamp, Auto-generated)
- `updated_at` (Timestamp, Auto-generated)

**Relations:**
- One-to-one: `brand_profiles`, `owner_profiles`
- One-to-many: `properties`, `inquiries`, `saved_properties`

#### **Property** (`properties`)
- `id` (UUID, Primary Key, Auto-generated)
- `title` (String, Max 255 chars)
- `description` (Text, Optional)
- `address` (String, Max 500 chars)
- `city` (String, Max 100 chars)
- `state` (String, Max 100 chars)
- `zipCode` (String, Mapped from `zip_code`, Max 20 chars)
- `price` (Decimal, 15 digits, 2 decimal places)
- `priceType` (Enum: `monthly`, `yearly`, `sqft`, Mapped from `price_type`, Default: `monthly`)
- `securityDeposit` (Decimal, Optional, 15 digits, 2 decimal places, Mapped from `security_deposit`)
- `rentEscalation` (Decimal, Optional, 5 digits, 2 decimal places, Mapped from `rent_escalation`)
- `size` (Int) - Square feet
- `propertyType` (Enum: `office`, `retail`, `warehouse`, `restaurant`, `other`, Mapped from `property_type`)
- `mapLink` (String, Optional, Max 1000 chars, Mapped from `map_link`) - Google Maps link
- `storePowerCapacity` (String, Optional, Max 50 chars, Mapped from `store_power_capacity`)
- `powerBackup` (Boolean, Default: false, Mapped from `power_backup`)
- `waterFacility` (Boolean, Default: false, Mapped from `water_facility`)
- `amenities` (JSON, Optional)
- `images` (JSON, Optional)
- `ownerId` (UUID, Foreign Key → users.id, Mapped from `owner_id`)
- `status` (Enum: `pending`, `approved`, `rejected`, Default: `pending`)
- `availability` (Boolean, Optional, Default: true, Mapped from `is_available`)
- `isFeatured` (Boolean, Optional, Default: false, Mapped from `is_featured`)
- `views` (Int, Optional, Default: 0, Mapped from `views_count`)
- `displayOrder` (Int, Optional, Mapped from `display_order`)
- `createdAt` (Timestamp, Optional, Auto-generated, Mapped from `created_at`)
- `updatedAt` (Timestamp, Optional, Auto-generated, Mapped from `updated_at`)

**Relations:**
- Many-to-one: `owner` (User)
- One-to-many: `inquiries`, `property_views`, `saved_properties`, `expert_requests`

#### **Brand Profile** (`brand_profiles`)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Unique, Foreign Key → users.id)
- `company_name` (String)
- `industry` (String, Optional)
- `preferred_locations` (JSON, Optional)
- `budget_min` (Decimal, Optional)
- `budget_max` (Decimal, Optional)
- `min_size` (Int, Optional)
- `max_size` (Int, Optional)
- `preferred_property_types` (JSON, Optional)
- `must_have_amenities` (JSON, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### **Owner Profile** (`owner_profiles`)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Unique, Foreign Key → users.id)
- `company_name` (String, Optional)
- `license_number` (String, Optional)
- `total_properties` (Int, Default: 0)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### **Inquiry** (`inquiries`)
- `id` (UUID, Primary Key, Auto-generated)
- `propertyId` (UUID, Foreign Key → properties.id, Mapped from `property_id`)
- `brandId` (UUID, Foreign Key → users.id, Mapped from `brand_id`)
- `ownerId` (UUID, Optional, Foreign Key → users.id, Mapped from `owner_id`)
- `message` (String)
- `status` (Enum: `pending`, `responded`, `closed`, Default: `pending`)
- `createdAt` (Timestamp, Optional, Auto-generated, Mapped from `created_at`)
- `updatedAt` (Timestamp, Optional, Auto-generated, Mapped from `updated_at`)

**Relations:**
- Many-to-one: `property`, `brand` (User), `owner` (User)
- One-to-many: `inquiry_responses`

#### **Inquiry Response** (`inquiry_responses`)
- `id` (UUID, Primary Key)
- `inquiry_id` (UUID, Foreign Key → inquiries.id)
- `sender_id` (UUID, Foreign Key → users.id)
- `message` (Text)
- `created_at` (Timestamp)

#### **Saved Property** (`saved_properties`)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `property_id` (UUID, Foreign Key → properties.id)
- `notes` (Text, Optional)
- `created_at` (Timestamp)

**Unique Constraint:** `(user_id, property_id)`

#### **Property View** (`property_views`)
- `id` (UUID, Primary Key)
- `property_id` (UUID, Foreign Key → properties.id)
- `user_id` (UUID, Optional, Foreign Key → users.id)
- `ip_address` (String, Optional)
- `user_agent` (String, Optional)
- `viewed_at` (Timestamp)

#### **Location Report** (`location_reports`)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `location` (String)
- `category` (String, Optional)
- `report_data` (JSON, Optional)
- `is_free` (Boolean, Default: false)
- `payment_id` (String, Optional)
- `amount` (Decimal, Optional)
- `status` (Enum: `pending`, `completed`, `failed`, Default: `pending`)
- `created_at` (Timestamp)
- `expires_at` (Timestamp, Optional)

#### **Expert Request** (`expert_requests`)
- `id` (UUID, Primary Key, Auto-generated)
- `propertyId` (UUID, Foreign Key → properties.id, Mapped from `property_id`)
- `brandName` (String, Max 255 chars, Mapped from `brand_name`)
- `email` (String, Optional, Max 255 chars)
- `phone` (String, Max 20 chars)
- `scheduleDateTime` (Timestamp, Mapped from `schedule_date_time`)
- `notes` (Text)
- `status` (Enum: `pending`, `contacted`, `scheduled`, `completed`, `cancelled`, Default: `pending`)
- `createdAt` (Timestamp, Optional, Auto-generated, Mapped from `created_at`)
- `updatedAt` (Timestamp, Optional, Auto-generated, Mapped from `updated_at`)

### Enums

- `user_type_enum`: `brand`, `owner`, `admin`
- `property_type_enum`: `office`, `retail`, `warehouse`, `restaurant`, `other`
- `price_type_enum`: `monthly`, `yearly`, `sqft`
- `property_status_enum`: `pending`, `approved`, `rejected`
- `inquiry_status_enum`: `pending`, `responded`, `closed`
- `report_status_enum`: `pending`, `completed`, `failed`
- `expert_request_status_enum`: `pending`, `contacted`, `scheduled`, `completed`, `cancelled`

### Indexes

All foreign keys are indexed. Additional indexes on:
- `users.email`, `users.user_type`
- `properties.city`, `properties.price`, `properties.size`, `properties.property_type`, `properties.status`, `properties.is_available`
- `inquiries.status`, `inquiries.brand_id`, `inquiries.owner_id`, `inquiries.property_id`
- `property_views.property_id`, `property_views.viewed_at`
- `location_reports.user_id`, `location_reports.status`
- `expert_requests.property_id`, `expert_requests.status`, `expert_requests.created_at`

---

## 🔌 API Endpoints

### Public Endpoints

#### **AI Search**
- **POST** `/api/ai-search`
  - **Description**: AI-powered search using Claude 3.5 Sonnet
  - **Request Body**:
    ```json
    {
      "query": "string",
      "conversationHistory": "string (optional)",
      "context": "object (optional)"
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "message": "string",
      "properties": [],
      "searchParams": {},
      "entityType": "brand" | "owner",
      "collectedDetails": {},
      "readyToRedirect": false,
      "redirectTo": "string (optional)"
    }
    ```

#### **Properties**
- **GET** `/api/properties`
  - **Description**: List properties with filtering and pagination
  - **Query Parameters**: `city`, `propertyType`, `minPrice`, `maxPrice`, `minSize`, `maxSize`, `page`, `limit`
  - **Response**: Array of properties

- **POST** `/api/properties`
  - **Description**: Create new property (requires authentication)
  - **Request Body**: Property object
  - **Response**: Created property

- **GET** `/api/properties/[id]`
  - **Description**: Get individual property details
  - **Response**: Property object

- **POST** `/api/properties/match`
  - **Description**: Match properties based on criteria
  - **Request Body**: Matching criteria
  - **Response**: Matched properties with scores

#### **Brands**
- **GET** `/api/brands`
  - **Description**: List brands
  - **Response**: Array of brands

- **POST** `/api/brands`
  - **Description**: Create brand profile
  - **Request Body**: Brand profile object
  - **Response**: Created brand

- **POST** `/api/brands/match`
  - **Description**: Match brands to properties
  - **Request Body**: Brand requirements
  - **Response**: Matched properties

- **GET** `/api/brands/matches`
  - **Description**: Get brand matches
  - **Response**: Array of matches

#### **Owner**
- **GET** `/api/owner/properties`
  - **Description**: Get owner's properties (requires authentication)
  - **Response**: Array of properties

- **POST** `/api/owner/property`
  - **Description**: Create property (requires authentication)
  - **Request Body**: Property object
  - **Response**: Created property

- **PATCH** `/api/owner/property/[id]`
  - **Description**: Update property (requires authentication)
  - **Request Body**: Property updates
  - **Response**: Updated property

#### **Leads**
- **POST** `/api/leads/create`
  - **Description**: Create brand lead
  - **Request Body**: Lead data
  - **Response**: Created lead

- **POST** `/api/leads/owner`
  - **Description**: Create owner lead
  - **Request Body**: Lead data
  - **Response**: Created lead

- **POST** `/api/leads/requirements`
  - **Description**: Submit requirements
  - **Request Body**: Requirements data
  - **Response**: Confirmation

#### **Expert**
- **POST** `/api/expert/connect`
  - **Description**: Request expert connection
  - **Request Body**: Expert request data
  - **Response**: Confirmation

#### **Visits**
- **POST** `/api/visits/schedule`
  - **Description**: Schedule property visit
  - **Request Body**: Visit schedule data
  - **Response**: Confirmation

#### **Location Intelligence**
- **POST** `/api/location-intelligence`
  - **Description**: Get location intelligence report
  - **Request Body**: Location data
  - **Response**: Report data

#### **Property Description**
- **POST** `/api/property/description`
  - **Description**: Generate AI property description
  - **Request Body**: Property data
  - **Response**: Generated description

#### **Contact**
- **POST** `/api/contact-team`
  - **Description**: Contact team form
  - **Request Body**: Contact form data
  - **Response**: Confirmation

#### **Status & Health**
- **GET** `/api/status`
  - **Description**: System status check
  - **Response**: Status information

- **GET** `/api/platform-status`
  - **Description**: Comprehensive platform status
  - **Response**: Detailed status information

- **GET** `/api/health`
  - **Description**: Health check endpoint
  - **Response**: Health status

#### **Sessions**
- **POST** `/api/sessions/log`
  - **Description**: Log user session
  - **Request Body**: Session data
  - **Response**: Confirmation

#### **Webhooks**
- **POST** `/api/webhook/test-pabbly`
  - **Description**: Test Pabbly webhook
  - **Request Body**: Webhook data
  - **Response**: Confirmation

### Admin Endpoints

All admin endpoints require authentication and admin role.

#### **Properties**
- **GET** `/api/admin/properties`
  - **Description**: List all properties (admin)
  - **Query Parameters**: `status`, `page`, `limit`
  - **Response**: Array of properties

- **POST** `/api/admin/properties`
  - **Description**: Create property (admin)
  - **Request Body**: Property object
  - **Response**: Created property

- **GET** `/api/admin/properties/[id]`
  - **Description**: Get property details (admin)
  - **Response**: Property object

- **PATCH** `/api/admin/properties/[id]`
  - **Description**: Update property (admin)
  - **Request Body**: Property updates
  - **Response**: Updated property

- **DELETE** `/api/admin/properties/[id]`
  - **Description**: Delete property (admin)
  - **Response**: Confirmation

- **POST** `/api/admin/properties/[id]/approve`
  - **Description**: Approve property
  - **Response**: Updated property

- **POST** `/api/admin/properties/[id]/reject`
  - **Description**: Reject property
  - **Request Body**: `{ "reason": "string" }`
  - **Response**: Updated property

- **POST** `/api/admin/properties/bulk`
  - **Description**: Bulk upload properties
  - **Request Body**: Array of properties
  - **Response**: Upload results

- **POST** `/api/admin/properties/bulk-delete`
  - **Description**: Bulk delete properties
  - **Request Body**: Array of property IDs
  - **Response**: Deletion results

- **POST** `/api/admin/properties/approve`
  - **Description**: Bulk approve properties
  - **Request Body**: Array of property IDs
  - **Response**: Approval results

- **POST** `/api/admin/properties/[id]/approve`
  - **Description**: Approve single property
  - **Response**: Updated property

- **POST** `/api/admin/properties/[id]/reject`
  - **Description**: Reject property
  - **Request Body**: `{ "reason": "string" }`
  - **Response**: Updated property

- **POST** `/api/admin/properties/describe`
  - **Description**: Generate AI description for property
  - **Request Body**: Property data
  - **Response**: Generated description

#### **Brands**
- **GET** `/api/admin/brands`
  - **Description**: List all brands
  - **Response**: Array of brands

- **POST** `/api/admin/brands`
  - **Description**: Create brand
  - **Request Body**: Brand object
  - **Response**: Created brand

- **GET** `/api/admin/brands/[id]`
  - **Description**: Get brand details
  - **Response**: Brand object

- **PATCH** `/api/admin/brands/[id]`
  - **Description**: Update brand
  - **Request Body**: Brand updates
  - **Response**: Updated brand

- **POST** `/api/admin/brands/bulk`
  - **Description**: Bulk upload brands
  - **Request Body**: Array of brands
  - **Response**: Upload results

#### **Owners**
- **GET** `/api/admin/owners`
  - **Description**: List all owners
  - **Response**: Array of owners

- **POST** `/api/admin/owners`
  - **Description**: Create owner
  - **Request Body**: Owner object
  - **Response**: Created owner

#### **Users**
- **GET** `/api/admin/users`
  - **Description**: List all users
  - **Response**: Array of users

- **GET** `/api/admin/users/[id]`
  - **Description**: Get user details
  - **Response**: User object

- **PATCH** `/api/admin/users/[id]`
  - **Description**: Update user
  - **Request Body**: User updates
  - **Response**: Updated user

#### **Inquiries**
- **GET** `/api/admin/inquiries`
  - **Description**: List all inquiries
  - **Query Parameters**: `status`, `page`, `limit`
  - **Response**: Array of inquiries

- **GET** `/api/admin/inquiries/[id]`
  - **Description**: Get inquiry details
  - **Response**: Inquiry object

- **PATCH** `/api/admin/inquiries/[id]`
  - **Description**: Update inquiry status
  - **Request Body**: `{ "status": "string" }`
  - **Response**: Updated inquiry

#### **Expert Requests**
- **GET** `/api/admin/expert-requests`
  - **Description**: List all expert requests
  - **Query Parameters**: `status`, `page`, `limit`
  - **Response**: Array of expert requests

- **PATCH** `/api/admin/expert-requests/[id]`
  - **Description**: Update expert request status
  - **Request Body**: `{ "status": "string" }`
  - **Response**: Updated request

#### **Analytics**
- **GET** `/api/admin/analytics`
  - **Description**: Get platform analytics
  - **Query Parameters**: `startDate`, `endDate`, `groupBy`
  - **Response**: Analytics data

#### **Stats**
- **GET** `/api/admin/stats`
  - **Description**: Get platform statistics
  - **Response**: Statistics object

#### **Matches**
- **GET** `/api/admin/matches`
  - **Description**: List all matches
  - **Response**: Array of matches

#### **Debug**
- **GET** `/api/admin/debug`
  - **Description**: Debug information (development only)
  - **Response**: Debug data

#### **Test Auth**
- **GET** `/api/admin/test-auth`
  - **Description**: Test authentication
  - **Response**: Auth status

---

## 🔄 User Flows

### Brand Flow

1. **Homepage** (`/`)
   - User sees hero section with search
   - Can click "I'm a Brand" or use AI search

2. **AI Search** (`/` - Modal)
   - Opens `AiSearchModal` or `ButtonFlowModal`
   - User interacts with AI to specify requirements
   - AI collects: locations, budget, size, property type, amenities
   - Entity type detected: `brand`

3. **Onboarding** (`/onboarding/brand`)
   - Form pre-filled with AI-collected details
   - User completes: company name, industry, contact info
   - Submits form → Creates brand profile

4. **Property Matching** (`/properties/results`)
   - System matches properties based on brand profile
   - Shows matched properties with BFI scores
   - User can filter, sort, save properties

5. **Property Details** (`/properties/[id]`)
   - View property details
   - Can send inquiry, schedule visit, request expert

6. **Inquiry Management**
   - Brand sends inquiry to owner
   - Owner responds via inquiry system
   - Status tracked: `pending` → `responded` → `closed`

### Owner Flow

1. **Homepage** (`/`)
   - User sees hero section
   - Clicks "I'm an Owner" or uses AI search

2. **AI Search** (`/` - Modal)
   - Opens AI search modal
   - User indicates they want to list property
   - Entity type detected: `owner`
   - Redirects to onboarding

3. **Onboarding** (`/onboarding/owner`)
   - Form for owner profile
   - User completes: company name, license number, contact info
   - Submits form → Creates owner profile

4. **Property Listing** (`/dashboard/owner`)
   - Owner dashboard
   - Can create new property listing
   - Property status: `pending` → `approved` → `rejected`

5. **Property Management**
   - View all properties
   - Edit property details
   - View inquiries
   - Respond to inquiries

6. **Property Approval Workflow**
   - Owner submits property
   - Admin reviews property
   - Admin approves/rejects
   - Owner notified of status

### Admin Flow

1. **Admin Dashboard** (`/admin`)
   - Overview of platform metrics
   - Recent activity
   - Quick actions

2. **Property Management** (`/admin/properties`)
   - List all properties
   - Filter by status (`pending`, `approved`, `rejected`)
   - Approve/reject properties
   - Bulk upload properties

3. **Brand Management** (`/admin/brands`)
   - List all brands
   - Create/edit brands
   - Bulk upload brands

4. **Owner Management** (`/admin/owners`)
   - List all owners
   - Create/edit owners

5. **Inquiry Management** (`/admin/submissions/inquiries`)
   - View all inquiries
   - Track inquiry status
   - Manage responses

6. **Analytics** (`/admin/analytics`)
   - Platform analytics
   - User statistics
   - Property statistics
   - Match statistics

---

## 🔐 Authentication & Authorization

### Authentication Methods

1. **Supabase Auth** (Primary)
   - Email/password authentication
   - OAuth providers (Google, etc.)
   - Session management via Supabase

2. **NextAuth.js** (Alternative)
   - Email/password authentication
   - OAuth providers
   - Database sessions via Prisma adapter

3. **Custom Auth** (Fallback)
   - Local storage-based sessions
   - Password hashing with SHA-256
   - Session expiration (24 hours)

### User Types & Roles

- **Brand** (`user_type: 'brand'`)
  - Can create brand profile
  - Can search and match properties
  - Can send inquiries
  - Can save properties

- **Owner** (`user_type: 'owner'`)
  - Can create owner profile
  - Can list properties
  - Can manage properties
  - Can respond to inquiries

- **Admin** (`user_type: 'admin'`)
  - Full platform access
  - Can approve/reject properties
  - Can manage users
  - Can view analytics

### Protected Routes

- `/admin/*` - Requires admin role
- `/dashboard/*` - Requires authentication
- `/onboarding/*` - Requires authentication
- `/api/admin/*` - Requires admin role
- `/api/owner/*` - Requires owner role

### Middleware

**File**: `src/middleware.ts`

- Rate limiting (disabled in development)
  - API routes: 100 requests/minute
  - Admin routes: 30 requests/minute
  - Auth routes: 10 requests/minute
  - Public routes: 200 requests/minute
  - In-memory store with automatic cleanup every 5 minutes
  - Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

- Security headers
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()
  - Content-Security-Policy: Comprehensive CSP with support for:
    - Google Maps APIs
    - Vercel Analytics
    - Supabase
    - Facebook/Clarity analytics
    - Google Tag Manager

- Attack pattern blocking
  - Path traversal (`..`)
  - XSS attempts (`<script`)
  - SQL injection (`union.*select`)
  - Code execution (`exec(`)

- Matcher configuration
  - Excludes: `_next/static`, `_next/image`, `favicon.ico`, image files

---

## 🤖 AI Search System

### Architecture

**Core File**: `src/lib/ai-search/simple-search.ts`

### Flow

1. **Query Processing**
   - Receives user query
   - Parses conversation history
   - Maintains context across turns

2. **Entity Detection**
   - Determines if user is `brand` or `owner`
   - Uses Claude 3.5 Sonnet for classification

3. **Detail Extraction**
   - Extracts requirements from conversation
   - Normalizes data (locations, budget, size, etc.)
   - Maintains collected details in context

4. **Response Generation**
   - Generates contextual responses
   - Provides property matches (for brands)
   - Redirects to onboarding when ready

### Key Functions

- `simpleSearch(query, history, context)` - Main search function
- `normalizeLocation(location)` - Normalize location names
- `extractBudget(query)` - Extract budget from query
- `extractSize(query)` - Extract size requirements

### Button Flow System

**File**: `src/lib/ai-search/button-flow.ts`

- Button-based conversation flow
- Eliminates ambiguity
- Step-by-step requirement collection
- Auto-scrolling interface
- Summary section

### Normalization

**File**: `src/lib/ai-search/normalization.ts`

- Location name normalization
- Property type mapping
- Budget range normalization
- Size unit conversion

---

## 🧩 Component Architecture

### Core Components

#### **AiSearchModal** (`src/components/AiSearchModal.tsx`)
- AI chat interface
- Text-based search
- Message history
- Streaming responses
- Property results display

#### **ButtonFlowModal** (`src/components/ButtonFlowModal.tsx`)
- Button-based conversation
- Step-by-step flow
- Multi-select support
- Auto-scrolling
- Summary section

#### **Navbar** (`src/components/Navbar.tsx`)
- Navigation links
- User authentication status
- Responsive design
- Mobile menu

#### **HeroSection** (`src/components/HeroSection.tsx`)
- Homepage hero
- Search interface
- Call-to-action buttons

#### **PropertyCard** (`src/components/PropertyCard.tsx`)
- Property display card
- Key information
- Action buttons
- Responsive design

#### **PropertyDetailsModal** (`src/components/PropertyDetailsModal.tsx`)
- Property details modal
- Image gallery
- Inquiry form
- Schedule visit
- Request expert

#### **Dashboard** (`src/components/Dashboard.tsx`)
- User dashboard
- Property listings
- Saved properties
- Recent activity

### Admin Components

- **AdminLayout** - Admin page layout
- **AdminSidebar** - Admin navigation sidebar
- **PropertyManagementTable** - Property management table
- **UserManagementTable** - User management table
- **InquiryManagementTable** - Inquiry management table
- **AnalyticsCharts** - Analytics charts
- **PlatformMetrics** - Platform metrics display
- **RecentActivity** - Recent activity feed

### Background Components

- **CityMapBackground** - City map background
- **ScrollingMapBackground** - Scrolling map background
- **FuturisticBackground** - Futuristic background effects
- **NetworkMapBackground** - Network map background
- **DynamicBackground** - Dynamic background system

---

## ⚙️ Environment Configuration

### Required Environment Variables

```env
# AI
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication (NextAuth - Optional)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Webhooks (Optional)
PABBLY_WEBHOOK_URL=https://connect.pabbly.com/workflow/sendwebhookdata/...

# OpenAI (Optional - if using OpenAI)
OPENAI_API_KEY=your_openai_key
```

### Environment Variable Usage

- **Server-side only**: `ANTHROPIC_API_KEY`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`
- **Client-side accessible**: `NEXT_PUBLIC_*` variables
- **Required for AI search**: `ANTHROPIC_API_KEY`
- **Required for database**: `DATABASE_URL`
- **Required for auth**: Supabase or NextAuth variables

---

## 🚀 Build & Deployment

### Build Commands

```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma Client (automatic on install)
npm run db:generate

# Development (cross-platform compatible with cross-env)
npm run dev
# Uses: cross-env NODE_TLS_REJECT_UNAUTHORIZED=0 next dev --webpack
# Works on Windows PowerShell, macOS, and Linux
# Note: Uses --webpack flag for webpack bundler instead of Turbopack

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

**Note**: The `dev` script uses `cross-env` for cross-platform environment variable support, ensuring it works correctly on Windows PowerShell, macOS, and Linux systems. The `--webpack` flag is used to explicitly use webpack bundler instead of Turbopack.

**Troubleshooting**:
- **"Unable to acquire lock" error**: Remove the lock file at `.next/dev/lock` if you encounter this error
- **Multiple lockfile warning**: The `outputFileTracingRoot` is configured in `next.config.js` to prevent this warning
- **Port already in use**: Next.js will automatically use the next available port (e.g., 3001 instead of 3000)
- **Postinstall**: Prisma Client is automatically generated after `npm install` via the `postinstall` script

### Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Database Scripts

```bash
# Import featured properties
npm run db:import-featured

# Import featured brands
npm run db:import-featured-brands

# Update property IDs
npm run db:update-property-ids

# Update brand IDs
npm run db:update-brand-ids

# Convert favicon to PNG
npm run favicon:convert
```

### Additional Scripts

- `add-property-descriptions.ts` - Add AI-generated descriptions to properties
- `check-properties.ts` - Validate and check property data
- `create-admin-user.ts` - Create admin user account
- `test-db-connection.ts` - Test database connectivity
- `test-matching.ts` - Test matching engine functionality
- `migrate-property-status.sql` - SQL migration for property status
- `regenerate-prisma.ps1` - PowerShell script to regenerate Prisma client

### Testing Scripts

```bash
# Performance test
npm run test:performance

# Load test
npm run test:load

# Click test
npm run test:click

# All tests
npm run test:all
```

### Vercel Deployment

**Configuration**: `vercel.json`

```json
{
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "npm run build",
  "framework": "nextjs"
}
```

**Build Command**: Uses `npm run build` which runs `next build --webpack` (webpack bundler instead of Turbopack)

**Postinstall**: Automatically runs `prisma generate` after npm install

### Build Optimizations

**File**: `next.config.js`

- **Workspace Root Configuration**: `outputFileTracingRoot` set to prevent multiple lockfile warnings
- **Image Optimization**:
  - Formats: AVIF, WebP
  - Device sizes: 640, 750, 828, 1080, 1200, 1920, 2048, 3840
  - Image sizes: 16, 32, 48, 64, 96, 128, 256, 384
  - Cache TTL: 1 year (31536000 seconds)
  - SVG support with CSP sandbox
- **Bundle Splitting**:
  - Framework chunk (React, React-DOM)
  - Large library chunks (>160KB)
  - Commons chunk (shared code)
  - Shared chunks (reusable code)
  - Max initial requests: 25
  - Min chunk size: 20KB
- **Package Import Optimization**: `framer-motion`, `recharts`, `@react-google-maps/api`
- **Security Headers**:
  - X-DNS-Prefetch-Control: on
  - Strict-Transport-Security: max-age=63072000
  - X-Download-Options: noopen
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Referrer-Policy: strict-origin-when-cross-origin
  - Cache-Control headers for API and images
- **Performance**:
  - Compression enabled
  - React Strict Mode
  - Console removal in production (except error/warn)
  - CSS optimization (experimental)
- **Turbopack**: Configuration available (currently using webpack via --webpack flag)

**Note**: If you see a warning about multiple lockfiles, ensure `outputFileTracingRoot` is set in `next.config.js`. The lock file at `.next/dev/lock` can be safely removed if you encounter "Unable to acquire lock" errors.

---

## 🎨 Key Design Decisions

### 1. **Button-Based Flow System**
- **Decision**: Use button-based conversation instead of free-form text
- **Rationale**: Eliminates ambiguity, improves data quality, better UX
- **Implementation**: `ButtonFlowModal` component

### 2. **Dual Entity Support**
- **Decision**: Separate flows for Brands and Owners
- **Rationale**: Different needs, different workflows, better matching
- **Implementation**: Entity type detection in AI search

### 3. **Property Approval Workflow**
- **Decision**: Admin approval required for properties
- **Rationale**: Quality control, prevent spam, maintain platform quality
- **Implementation**: `property_status_enum` with `pending`, `approved`, `rejected`

### 4. **AI-Powered Matching**
- **Decision**: Use AI for intelligent property matching
- **Rationale**: Better matches, faster results, improved user experience
- **Implementation**: BFI/PFI scoring algorithms in `matching-engine.ts`

### 5. **Location Intelligence Integration**
- **Decision**: Integrate location intelligence reports
- **Rationale**: Provide valuable data to brands, differentiate platform
- **Implementation**: `location_reports` table and API endpoints

### 6. **Supabase as Primary Auth**
- **Decision**: Use Supabase Auth as primary authentication
- **Rationale**: Managed service, OAuth support, session management
- **Implementation**: Supabase client in `src/lib/supabase/`

### 7. **Prisma ORM**
- **Decision**: Use Prisma for database access
- **Rationale**: Type safety, migrations, developer experience
- **Implementation**: Prisma schema and client

### 8. **Next.js App Router**
- **Decision**: Use Next.js 16 App Router
- **Rationale**: Modern routing, server components, better performance
- **Implementation**: All routes in `src/app/`

### 9. **Rate Limiting in Middleware**
- **Decision**: Implement rate limiting in middleware
- **Rationale**: Prevent abuse, protect API endpoints
- **Implementation**: `src/middleware.ts` with in-memory store

### 10. **Comprehensive Security Headers**
- **Decision**: Set security headers in middleware and next.config.js
- **Rationale**: Protect against XSS, clickjacking, MIME sniffing
- **Implementation**: CSP, X-Frame-Options, etc.

---

## 📊 Matching Engine

### BFI/PFI Scoring

**File**: `src/lib/matching-engine.ts`

- **BFI (Brand Fit Index)**: How well a property fits a brand's requirements
- **PFI (Property Fit Index)**: How well a brand fits a property's requirements

### Matching Criteria

1. **Location Match** (Weight: 30%)
   - Exact city match
   - Area/neighborhood match
   - Proximity scoring

2. **Budget Match** (Weight: 25%)
   - Within budget range
   - Price per sqft match
   - Budget flexibility

3. **Size Match** (Weight: 20%)
   - Size within range
   - Size flexibility
   - Optimal size scoring

4. **Property Type Match** (Weight: 15%)
   - Exact type match
   - Compatible types
   - Type flexibility

5. **Amenities Match** (Weight: 10%)
   - Must-have amenities
   - Nice-to-have amenities
   - Amenity scoring

### Matching Algorithm

1. Calculate individual scores for each criterion
2. Apply weights to each score
3. Sum weighted scores
4. Normalize to 0-100 scale
5. Sort by score (descending)
6. Return top matches

---

## 🔗 Integrations

### Pabbly Webhook Integration

**File**: `src/lib/pabbly-webhook.ts`

- Webhook URL: Configured via `PABBLY_WEBHOOK_URL`
- Form types supported:
  - `brand_lead_creation`
  - `owner_lead_creation`
  - `property_listing`
  - `inquiry_creation`
  - `expert_request`

### Google Maps Integration

**File**: `src/lib/google-maps-config.ts`

- Maps JavaScript API
- Places API
- Geocoding API
- Components: `@react-google-maps/api`

### Supabase Integration

**Files**: `src/lib/supabase/*`

- Authentication
- Database (via Prisma)
- Storage (for images)
- Real-time subscriptions

---

## 📝 Additional Notes

### Performance Optimizations

- Image optimization (AVIF, WebP)
- Bundle splitting
- Code minification
- CSS optimization
- Lazy loading
- Route-based code splitting

### Security Measures

- Rate limiting
- Security headers
- Input validation (Zod)
- SQL injection prevention (Prisma)
- XSS protection (CSP)
- CSRF protection (NextAuth)

### Error Handling

- Global error boundary (`src/app/error.tsx`)
- API error responses
- Graceful degradation
- Fallback responses

### Logging

- Console logging (development)
- Session logging (`src/lib/session-logger.ts`)
- Error tracking
- Analytics integration

---

## 🎯 Future Enhancements

### Planned Features

1. **Mobile App** (React Native)
2. **Advanced Analytics** (Custom dashboards)
3. **Payment Integration** (Stripe/Razorpay)
4. **Document Management** (Lease agreements)
5. **Notification System** (Email, SMS, Push)
6. **Advanced Search Filters** (More criteria)
7. **Property Comparison** (Side-by-side)
8. **Virtual Tours** (3D property views)
9. **Chat System** (Real-time messaging)
10. **Review System** (Property reviews)

---

## 📚 Documentation Files

- `README.md` - Basic project overview
- `BUILD.md` - Detailed build documentation
- `loka.md` - Complete build truth & architecture documentation (this file)
- `AI_SEARCH_CONFIG.md` - AI search system documentation
- `FUNCTIONALITY_REQUIREMENTS.md` - Feature requirements
- `PABBLY_INTEGRATION_GUIDE.md` - Pabbly integration guide
- `PABBLY_FORM_TYPES.md` - Pabbly form types reference
- `PABBLY_TROUBLESHOOTING.md` - Pabbly troubleshooting guide
- `PROPERTY_APPROVAL_WORKFLOW.md` - Approval workflow
- `DATABASE_TABLES_EXPLANATION.md` - Database documentation
- `PERFORMANCE_OPTIMIZATIONS.md` - Performance guide
- `PERFORMANCE_TEST_GUIDE.md` - Performance testing guide
- `PRODUCTION_AUDIT_LOG.md` - Production audit
- `SUPABASE_MIGRATION_INSTRUCTIONS.md` - Supabase migration guide
- `WEBHOOK_SETUP_CHECKLIST.md` - Webhook setup checklist
- `BRAND_QUERY_TRAINING_DATASET.md` - Brand query training data
- `OWNER_QUERY_TRAINING_DATASET.md` - Owner query training data
- `CHANGELOG.md` - Project changelog
- `GOOGLE_MAPS_SETUP.md` - Google Maps API setup
- `GOOGLE_MAPS_TROUBLESHOOTING.md` - Google Maps troubleshooting
- `FIX_MAP_LINK_COLUMN.md` - Map link column fix documentation

---

**Last Updated**: 2026-04-02  
**Version**: 0.1.1  
**Maintained By**: Lokazen Development Team
