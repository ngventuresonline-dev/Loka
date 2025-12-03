# 🚀 N&G Ventures - AI-Powered Real Estate Platform Setup Guide

## 📋 What We've Built

A complete commercial real estate platform with:
- ✅ **PostgreSQL Database** with Prisma ORM
- ✅ **AI Agent Search** powered by OpenAI GPT-4
- ✅ **RESTful API** for property management
- ✅ **Type-safe** end-to-end with TypeScript
- ✅ **Sample Data** with 6 properties in Bangalore

---

## 🗄️ Database Setup

### Option 1: Local PostgreSQL with Docker (Recommended for Development)

1. **Install Docker Desktop** (if not installed):
   - Download from https://www.docker.com/products/docker-desktop

2. **Start PostgreSQL container**:
   ```powershell
   docker run --name ngventures-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ngventures -p 5432:5432 -d postgres:15
   ```

3. **Your DATABASE_URL is already set** in `.env.local`:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/ngventures?schema=public"
   ```

### Option 2: Vercel Postgres (Free Tier - Production Ready)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Create a new Postgres database**
3. **Copy the connection string** (starts with `postgres://...`)
4. **Update `.env.local`**:
   ```env
   DATABASE_URL="your-vercel-postgres-url"
   ```

### Option 3: Supabase (Free Tier)

1. **Sign up at**: https://supabase.com
2. **Create a new project**
3. **Get connection string** from Settings > Database
4. **Update `.env.local`**

### Option 4: Neon (Free Tier with Generous Limits)

1. **Sign up at**: https://neon.tech
2. **Create a new project**
3. **Copy connection string**
4. **Update `.env.local`**

---

## 🔑 OpenAI API Key Setup

1. **Get your API key**:
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-...`)

2. **Update `.env.local`**:
   ```env
   OPENAI_API_KEY="sk-your-actual-api-key-here"
   ```

3. **Add credits** (if needed):
   - Go to https://platform.openai.com/account/billing
   - Add $5-10 to start (very affordable - ~$0.01 per search)

---

## 🎬 Getting Started

### Step 1: Generate Prisma Client
```powershell
npm run db:generate
```

### Step 2: Push Database Schema
```powershell
npm run db:push
```
This creates all tables in your database.

### Step 3: Seed Sample Data
```powershell
npm run db:seed
```
This adds 6 sample properties in Bangalore.

### Step 4: Start Development Server
```powershell
npm run dev
```

---

## 🧪 Testing the AI Search

### Example Queries to Try:

**For Brands (looking for space):**
- "Looking for QSR space in Indiranagar"
- "I need a restaurant space around 1000 sqft in Koramangala"
- "Small cafe space in HSR Layout under 50k per month"
- "Retail shop in Brigade Road with parking"
- "Office space in Whitefield for 20 people"

**For Property Owners (listing space):**
- "I have a commercial space for rent in Indiranagar"
- "I want to list my kiosk space near MG Road metro"

---

## 📡 API Endpoints

### 1. AI Search Agent
**POST** `/api/ai-search`
```json
{
  "query": "Looking for QSR space in Indiranagar",
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI-generated conversational response",
  "properties": [...],
  "searchParams": {...},
  "count": 2
}
```

### 2. Get All Properties
**GET** `/api/properties`

**With filters:**
`/api/properties?city=Bangalore&propertyType=qsr&minPrice=40000&maxPrice=80000`

### 3. Create Property
**POST** `/api/properties`
```json
{
  "title": "Prime Retail Space",
  "description": "...",
  "address": "100ft Road",
  "city": "Bangalore",
  "state": "Karnataka",
  "zipCode": "560038",
  "size": 500,
  "propertyType": "retail",
  "condition": "excellent",
  "price": 75000,
  "priceType": "monthly",
  "amenities": ["Parking", "WiFi", "AC"],
  "ownerId": "user-id"
}
```

---

## 🎨 Frontend Integration

The AI search bar on your homepage is ready! Just wire it up:

```typescript
const handleSearch = async (query: string) => {
  setLoading(true)
  try {
    const response = await fetch('/api/ai-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    const data = await response.json()
    
    // Display AI response
    setAiMessage(data.message)
    
    // Display matched properties
    setProperties(data.properties)
  } catch (error) {
    console.error('Search failed:', error)
  } finally {
    setLoading(false)
  }
}
```

---

## 🛠️ Useful Commands

```powershell
# View database in browser
npm run db:studio

# Reset database (careful!)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npm run db:generate

# Create a migration
npm run db:migrate

# Reseed data
npm run db:seed
```

---

## 📊 Database Schema Overview

### Tables Created:
1. **User** - Brands, Owners, Admins
2. **Property** - Commercial real estate listings
3. **SavedProperty** - Brands save properties they like
4. **Inquiry** - Communication between brands and owners
5. **SearchHistory** - Track AI searches for analytics

### Sample Data Included:
- 3 Users (2 owners, 1 brand)
- 6 Properties in Bangalore:
  - QSR space in Indiranagar (500 sqft, ₹75k/month)
  - Restaurant in Koramangala (1200 sqft, ₹150k/month)
  - Kiosk in MG Road Metro (150 sqft, ₹40k/month)
  - Retail shop in Brigade Road (800 sqft, ₹120k/month)
  - Office in Whitefield (2000 sqft, ₹180k/month)
  - Small QSR in HSR Layout (350 sqft, ₹45k/month)

---

## 🎯 Next Steps

1. ✅ Set up database (choose one option above)
2. ✅ Add OpenAI API key
3. ✅ Run `npm run db:push` and `npm run db:seed`
4. ✅ Test AI search in browser
5. 🔄 Wire up the search bar in your frontend
6. 🔄 Add authentication integration
7. 🔄 Create property details page
8. 🔄 Build user dashboards
9. 🔄 Add image upload functionality
10. 🔄 Implement inquiry system

---

## 💡 Tips

- **Cost**: GPT-4 Turbo costs ~$0.01 per search (very affordable)
- **Speed**: Responses take 2-5 seconds (AI processing time)
- **Scaling**: PostgreSQL handles millions of records easily
- **Free Tiers**: Use Vercel Postgres or Neon for free hosting

---

## 🆘 Troubleshooting

### "Can't reach database server"
- Make sure PostgreSQL is running
- Check your DATABASE_URL in `.env.local`

### "OpenAI API error"
- Verify your OPENAI_API_KEY is correct
- Check you have credits at platform.openai.com

### "Prisma Client not generated"
- Run: `npm run db:generate`

### "Table doesn't exist"
- Run: `npm run db:push`

---

## 📞 Ready to Test!

Your platform is now AI-powered and database-backed! 🚀

Try searching:
**"Looking for QSR space in Indiranagar"**

The AI will:
1. Understand your query
2. Search the database
3. Return matched properties
4. Provide a conversational response
5. Save the search history

Enjoy building! 💪
