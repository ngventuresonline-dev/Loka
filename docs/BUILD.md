# BUILD TRUTH - Lokazen Commercial Real Estate Platform

**Version:** 0.1.1  
**Last Updated:** 2025-01-23  
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
│   │   │   │   ├── brands/           # Brand management
│   │   │   │   ├── inquiries/        # Inquiry management
│   │   │   │   ├── properties/       # Property management
│   │   │   │   ├── stats/            # Statistics
│   │   │   │   └── users/            # User management
│   │   │   ├── brands/               # Brand endpoints
│   │   │   │   ├── match/            # Brand matching
│   │   │   │   └── matches/          # Match results
│   │   │   ├── health/               # Health check
│   │   │   ├── leads/                # Lead management
│   │   │   ├── location-intelligence/ # Location intel
│   │   │   ├── owner/                # Owner endpoints
│   │   │   ├── platform-status/      # Platform status
│   │   │   ├── properties/           # Property endpoints
│   │   │   ├── sessions/             # Session logging
│   │   │   └── status/               # Status endpoint
│   │   ├── about/                    # About page
│   │   │   └── page.tsx
│   │   ├── admin/                    # Admin dashboard
│   │   │   └── page.tsx
│   │   ├── auth/                     # Authentication
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── demo/                     # Demo page
│   │   │   └── page.tsx
│   │   ├── location-intelligence/    # Location intel page
│   │   │   └── page.tsx
│   │   ├── onboarding/               # Onboarding flows
│   │   │   ├── brand/
│   │   │   │   └── page.tsx
│   │   │   └── owner/
│   │   │       └── page.tsx
│   │   ├── properties/               # Properties listing
│   │   │   └── page.tsx
│   │   ├── status/                   # Status page (internal / admin only)
│   │   │   └── page.tsx
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout (with SEO, viewport, analytics)
│   │   ├── page.tsx                   # Homepage
│   │   ├── robots.ts                 # Dynamic robots.txt
│   │   └── sitemap.ts                # Dynamic sitemap.xml
│   │
│   ├── components/                   # React Components
│   │   ├── onboarding/               # Onboarding forms
│   │   │   ├── BrandOnboardingForm.tsx
│   │   │   └── PropertyOwnerOnboardingForm.tsx
│   │   ├── ui/                       # UI components
│   │   │   ├── 3d-orbit-gallery.tsx
│   │   │   └── Button.tsx
│   │   ├── AiSearchModal.tsx         # AI search modal
│   │   ├── ButtonFlowModal.tsx       # Button-based flow
│   │   ├── CityMapBackground.tsx     # City map background
│   │   ├── Dashboard.tsx             # User dashboard
│   │   ├── DynamicBackground.tsx     # Dynamic backgrounds
│   │   ├── Footer.tsx                # Site footer
│   │   ├── FuturisticBackground.tsx  # Futuristic bg effects
│   │   ├── Icons.tsx                 # Icon components
│   │   ├── IndustriesGallery.tsx     # Industries showcase
│   │   ├── Navbar.tsx                # Navigation bar
│   │   ├── PropertyCard.tsx         # Property card component
│   │   └── ScrollingMapBackground.tsx # Scrolling map
│   │
│   ├── contexts/                     # React Contexts
│   │   └── AuthContext.tsx           # Auth context
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   └── useScrollAnimation.ts    # Scroll animation hook
│   │
│   ├── lib/                          # Library & Utilities
│   │   ├── ai-search/                # AI Search System
│   │   │   ├── button-flow.ts       # Button flow logic
│   │   │   ├── normalization.ts     # Data normalization
│   │   │   └── simple-search.ts     # Core AI search
│   │   ├── auth.ts                  # Auth utilities
│   │   ├── matching-engine.ts       # Matching algorithms
│   │   ├── mockDatabase.ts          # Mock data
│   │   ├── prisma.ts                # Prisma client
│   │   └── theme.ts                 # Theme utilities
│   │
│   └── types/                        # TypeScript Types
│       ├── index.ts                 # Common types
│       └── workflow.ts              # Workflow types
│
├── prisma/                           # Prisma Configuration
│   ├── schema.prisma                # Database schema
│   └── seed.ts                      # Database seeding
│
├── public/                           # Static Assets
│   ├── logos/                       # Brand logos
│   ├── lokazen-favicon.svg          # Animated favicon
│   └── robots.txt                   # Static robots.txt fallback
│
├── database/                         # Database Scripts
│   └── schema.sql                   # SQL schema
│
├── next.config.js                    # Next.js config
├── tailwind.config.js                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── postcss.config.js                 # PostCSS config
├── package.json                      # Dependencies
├── vercel.json                       # Vercel deployment config
│
└── Documentation/
    ├── BUILD.md                      # This file
    ├── README.md                     # Project README
    ├── AI_SEARCH_CONFIG.md           # AI search docs
    ├── BRAND_QUERY_TRAINING_DATASET.md
    └── OWNER_QUERY_TRAINING_DATASET.md
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
- City-specific data
- Zone-based filtering
- Area recommendations
- Footfall analysis

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
- Relations: `owner` (`users`), `inquiries`, `saved_properties`, `property_views`

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

#### **Sessions (DB‑level, used via raw SQL)**
- **`brand_onboarding_sessions`** – snapshots of brand filter / quick sign‑in / onboarding form
  - Columns (recommended): `id`, `user_id`, `flow_type`, `status`, `filter_step` (JSONB), `contact_step` (JSONB), `onboarding_form` (JSONB), `created_at`, `updated_at`
- **`property_onboarding_sessions`** – snapshots of owner filter / property listing onboarding
  - Columns (recommended): `id`, `user_id`, `flow_type`, `status`, `filter_step` (JSONB), `onboarding_form` (JSONB), `created_at`, `updated_at`
- **Logging endpoint:** `POST /api/sessions/log` (raw SQL via Prisma `$executeRawUnsafe`)
  - Payload: `{ sessionType: 'brand' | 'owner', userId: string, data: any }`
  - Current behavior: simple `INSERT` per call (no `ON CONFLICT`); if `userId` is missing the request is skipped; DB errors are logged but a success response is still returned to avoid UX breaks.
  - If de‑duplication is needed, add a unique constraint on `user_id` or implement an upsert; as of now duplicates are possible by design.

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

**Route**: `/api/ai-search`  
**Method**: POST  
**Description**: AI-powered search endpoint using Claude 3.5 Sonnet

**Route**: `/api/properties`  
**Method**: GET, POST  
**Description**: List and create properties with filtering and pagination

**Route**: `/api/properties/[id]`  
**Method**: GET  
**Description**: Get individual property details

**Route**: `/api/brands`  
**Method**: GET, POST  
**Description**: Brand management endpoints

**Route**: `/api/brands/match`  
**Method**: POST  
**Description**: Brand matching algorithm

**Route**: `/api/owner/properties`  
**Method**: GET, POST  
**Description**: Owner property management

**Route**: `/api/inquiries`  
**Method**: POST  
**Description**: Create property inquiries

**Route**: `/api/platform-status`  
**Method**: GET  
**Description**: Comprehensive platform health and status

**Route**: `/api/status`  
**Method**: GET  
**Description**: System status check

**Route**: `/api/health`  
**Method**: GET  
**Description**: Health check endpoint

#### Admin Endpoints

**Route**: `/api/admin/properties`  
**Method**: GET, POST, PATCH, DELETE  
**Description**: Admin property management with approval workflow

**Route**: `/api/admin/brands`  
**Method**: GET, POST, PATCH  
**Description**: Admin brand management

**Route**: `/api/admin/users`  
**Method**: GET, PATCH  
**Description**: User management

**Route**: `/api/admin/analytics`  
**Method**: GET  
**Description**: Platform analytics

**Route**: `/api/admin/stats`  
**Method**: GET  
**Description**: Platform statistics

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
npm run dev              # Start dev server (port 3000)

# Production Build
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push         # Push schema to database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio

# Code Quality
npm run lint            # Run ESLint
```

### Build Process

1. **TypeScript Compilation**
   - Type checking
   - Path aliases resolution (`@/*`)

2. **Next.js Build**
   - Page optimization
   - Static generation
   - Image optimization (enabled: AVIF/WebP formats, responsive sizes)
   - Webpack bundle splitting for optimal performance
   - CSS optimization with experimental `optimizeCss`

3. **CSS Processing**
   - Tailwind compilation
   - PostCSS processing
   - Autoprefixing

4. **Output**
   - Optimized bundles with code splitting
   - Asset optimization
   - Security headers configured

### Deployment

**Platform**: Vercel (configured via `vercel.json`)

**Build Settings**:
- Framework: Next.js
- Build Command: `npm run build`
- Install Command: `npm install --legacy-peer-deps`
- Post-install: `prisma generate` (automatic)

**Environment Variables Required**:
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `NEXTAUTH_URL` - Application URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side)

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

# Optional: OpenAI (if using)
OPENAI_API_KEY=your_openai_key

# Supabase (Required for auth and storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
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
   npm run db:push      # Push schema to database
   npm run db:seed      # Seed database with initial data
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Note: Development server runs with `--webpack` flag and TLS rejection disabled for local development

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

**Document Version**: 1.2  
**Last Updated**: 2025-01-23  
**Maintained By**: Lokazen Development Team

---

*This document represents the complete build truth of the N&G Ventures Commercial Real Estate Platform. Keep it updated as the platform evolves.*

