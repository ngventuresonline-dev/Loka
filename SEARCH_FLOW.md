# 🔄 AI SEARCH FLOW - What Happens When You Search

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  USER TYPES: "Looking for QSR space in Indiranagar"            │
│  [Press Enter] or [Click Search Button]                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (page.tsx)                                            │
│  • Sets isSearching = true                                      │
│  • Shows spinner: "Searching..."                                │
│  • Disables input field                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ POST /api/ai-search
┌─────────────────────────────────────────────────────────────────┐
│  API ROUTE (/api/ai-search/route.ts)                           │
│  Receives: { query: "Looking for QSR...", userId: "guest" }    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Parse Query with OpenAI GPT-4                         │
│                                                                  │
│  Function: parseQuery()                                         │
│  • Sends query to OpenAI API                                    │
│  • Uses GPT-4 Turbo model                                       │
│  • System prompt: "You are a real estate assistant..."         │
│  • Extracts structured data                                     │
│                                                                  │
│  Example Output:                                                │
│  {                                                              │
│    "queryType": "search",                                       │
│    "location": {                                                │
│      "city": "Bangalore",                                       │
│      "area": "Indiranagar"                                      │
│    },                                                           │
│    "propertyType": "qsr",                                       │
│    "size": null,                                                │
│    "budget": null,                                              │
│    "amenities": [],                                             │
│    "summary": "User is looking for QSR space in Indiranagar"   │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Search Mock Database                                  │
│                                                                  │
│  Function: searchProperties()                                   │
│  File: src/lib/mockDatabase.ts                                  │
│                                                                  │
│  Filters Applied:                                               │
│  • city: "Bangalore" ✓                                          │
│  • propertyType: "qsr" ✓                                        │
│  • area: "Indiranagar" (searches in address) ✓                 │
│                                                                  │
│  Results Found:                                                 │
│  [                                                              │
│    {                                                            │
│      id: "prop-001",                                            │
│      title: "Prime QSR Space in Indiranagar",                  │
│      size: 500,                                                 │
│      price: 75000,                                              │
│      city: "Bangalore",                                         │
│      address: "100ft Road, Indiranagar",                       │
│      amenities: ["Parking", "WiFi", "AC", "Security"]          │
│    }                                                            │
│  ]                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Generate AI Response                                  │
│                                                                  │
│  Function: generateAIResponse()                                 │
│  • Sends query + properties to OpenAI                           │
│  • GPT-4 creates conversational response                        │
│                                                                  │
│  Example Response:                                              │
│  "Great! I found a perfect QSR space for you in Indiranagar.   │
│   It's 500 sqft with excellent amenities including parking,    │
│   WiFi, and AC. The rent is ₹75,000/month. This property is   │
│   located on 100ft Road with high foot traffic. Would you      │
│   like to schedule a visit?"                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Log Search History (Console)                          │
│                                                                  │
│  Console Output:                                                │
│  {                                                              │
│    userId: "guest",                                             │
│    query: "Looking for QSR space in Indiranagar",              │
│    resultsCount: 1,                                             │
│    timestamp: "2024-12-02T..."                                  │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ Returns JSON
┌─────────────────────────────────────────────────────────────────┐
│  API RESPONSE                                                   │
│  {                                                              │
│    "success": true,                                             │
│    "message": "Great! I found a perfect QSR space...",         │
│    "properties": [                                              │
│      {                                                          │
│        "id": "prop-001",                                        │
│        "title": "Prime QSR Space in Indiranagar",              │
│        "description": "Excellent location...",                  │
│        "price": 75000,                                          │
│        "size": 500,                                             │
│        ...                                                      │
│      }                                                          │
│    ],                                                           │
│    "searchParams": {...},                                       │
│    "count": 1                                                   │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND RENDERS RESULTS                                       │
│                                                                  │
│  1. Shows AI Response Message (purple box)                      │
│     ┌───────────────────────────────────────────┐              │
│     │ 🤖 AI Assistant                           │              │
│     │ Great! I found a perfect QSR space...     │              │
│     └───────────────────────────────────────────┘              │
│                                                                  │
│  2. Shows Results Count                                         │
│     "Found 1 Properties"                                        │
│                                                                  │
│  3. Displays Property Cards                                     │
│     ┌─────────────────────────────┐                            │
│     │ [Property Image]            │                            │
│     │                              │                            │
│     │ Prime QSR Space in          │                            │
│     │ Indiranagar                 │                            │
│     │                              │                            │
│     │ 📍 100ft Road, Indiranagar  │                            │
│     │ 📏 500 sqft  🏷️ qsr        │                            │
│     │                              │                            │
│     │ [Parking] [WiFi] [AC]       │                            │
│     │                              │                            │
│     │ ₹75k    [View Details]      │                            │
│     └─────────────────────────────┘                            │
│                                                                  │
│  4. Sets isSearching = false                                    │
│  5. Enables input field                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Components

### Frontend State Management
```typescript
const [searchQuery, setSearchQuery] = useState('')
const [isSearching, setIsSearching] = useState(false)
const [searchResults, setSearchResults] = useState([])
const [aiMessage, setAiMessage] = useState('')
const [showResults, setShowResults] = useState(false)
```

### API Call Function
```typescript
const handleSearch = async () => {
  setIsSearching(true)
  
  const response = await fetch('/api/ai-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      query: searchQuery, 
      userId: 'guest' 
    })
  })
  
  const data = await response.json()
  setSearchResults(data.properties)
  setAiMessage(data.message)
  setShowResults(true)
  setIsSearching(false)
}
```

---

## 📊 Data Structures

### Input (from frontend):
```json
{
  "query": "Looking for QSR space in Indiranagar",
  "userId": "guest"
}
```

### Parsed Parameters (from GPT-4):
```json
{
  "queryType": "search",
  "location": {
    "city": "Bangalore",
    "area": "Indiranagar"
  },
  "propertyType": "qsr",
  "size": null,
  "budget": null,
  "amenities": [],
  "summary": "User looking for QSR space in Indiranagar"
}
```

### Database Filters Applied:
```javascript
{
  city: "Bangalore",
  propertyType: "qsr",
  // Searches for "Indiranagar" in address field
}
```

### Output (to frontend):
```json
{
  "success": true,
  "message": "Great! I found a perfect QSR space for you...",
  "properties": [
    {
      "id": "prop-001",
      "title": "Prime QSR Space in Indiranagar",
      "description": "Excellent location for Quick Service Restaurant...",
      "address": "100ft Road, Indiranagar",
      "city": "Bangalore",
      "state": "Karnataka",
      "zipCode": "560038",
      "size": 500,
      "propertyType": "qsr",
      "price": 75000,
      "priceType": "monthly",
      "amenities": ["Parking", "WiFi", "AC", "Security", "Storage"],
      "isFeatured": true,
      "views": 125
    }
  ],
  "searchParams": {...},
  "count": 1
}
```

---

## ⚡ Performance Timeline

| Step | Time | Action |
|------|------|--------|
| 0ms | User clicks Search | Frontend triggered |
| 10ms | API call initiated | POST to /api/ai-search |
| 500-2000ms | OpenAI parseQuery | GPT-4 extracts intent |
| 2010ms | Database search | Filter mock data (instant) |
| 2500-4000ms | OpenAI generate response | GPT-4 creates message |
| 4010ms | Response sent | JSON returned to frontend |
| 4020ms | UI renders | Results displayed |

**Total: ~4 seconds** (most time is OpenAI API)

---

## 🎯 Search Variations Handled

### By Location:
- "QSR in Indiranagar" → Filters by area
- "Restaurant Koramangala" → Filters by area
- "Space in Bangalore" → Filters by city

### By Type:
- "QSR space" → propertyType: "qsr"
- "Restaurant" → propertyType: "restaurant"
- "Kiosk" → propertyType: "kiosk"
- "Retail shop" → propertyType: "retail"
- "Office space" → propertyType: "office"

### By Budget:
- "Under 50k" → maxPrice: 50000
- "Around 100k per month" → price range filter
- "Affordable cafe" → sorts by low price

### By Size:
- "500 sqft" → size: 500
- "Small space" → filters smaller properties
- "Large restaurant" → filters 1000+ sqft

### By Amenities:
- "With parking" → amenities includes "Parking"
- "WiFi available" → amenities includes "WiFi"

---

## 🔍 AI Intelligence Examples

### Example 1: Natural Language
**Input:** "I'm looking for a small cafe space under 50k in a busy area"

**AI Understands:**
- propertyType: "qsr" or "kiosk"
- maxPrice: 50000
- preference: high foot traffic

**Finds:** Kiosk in MG Road Metro (₹40k, 50k+ daily footfall)

---

### Example 2: Business Context
**Input:** "Need restaurant with kitchen, around 1000 sqft"

**AI Understands:**
- propertyType: "restaurant"
- minSize: 1000
- amenities: "Kitchen"

**Finds:** Restaurant in Koramangala (1,200 sqft, full kitchen)

---

### Example 3: Location Preference
**Input:** "Office space in tech hub area"

**AI Understands:**
- propertyType: "office"
- location: tech areas (Whitefield, etc.)

**Finds:** Office in Whitefield Tech Park

---

## 🎨 UI/UX Flow

### State 1: Idle
- Search bar ready
- Placeholder text visible
- Quick pills clickable

### State 2: Searching
- Button shows spinner
- Text: "Searching..."
- Input disabled
- Gradient glowing

### State 3: Results
- AI message box appears
- Property cards fade in
- "Clear Results" button visible
- Can search again

---

## 🐛 Error Handling

### Network Error:
```javascript
catch (error) {
  setAiMessage('Unable to perform search. Please check your connection.')
  setShowResults(true)
}
```

### No Results:
```javascript
if (data.properties.length === 0) {
  Shows: "No properties found"
  AI explains why no matches
}
```

### API Error:
```javascript
if (!data.success) {
  setAiMessage('Sorry, something went wrong. Please try again.')
}
```

---

## 🚀 Future Enhancements

1. **Real Database** - Swap mock for Prisma + Supabase
2. **User Authentication** - Replace 'guest' with real userId
3. **Saved Searches** - Store search history in database
4. **Favorites** - Save properties to user profile
5. **Property Details Page** - Click "View Details" → /property/[id]
6. **Contact Owner** - Direct messaging from property card
7. **Advanced Filters** - Sliders for price/size, checkboxes for amenities
8. **Map View** - Show properties on Google Maps
9. **Image Upload** - Real property photos instead of placeholders
10. **Analytics** - Track popular searches, property views

---

**Ready to test? Open http://localhost:3001 and start searching!** 🎉
