# Commercial Real Estate Platform

AI-powered commercial real estate matching platform built with Next.js 15.

## Features

- **AI-Powered Search**: Intelligent property search using Anthropic Claude
- **Brand & Owner Flows**: Separate flows for brands looking for space and owners listing properties
- **Context-Aware Conversations**: Maintains conversation context across turns
- **Form Pre-filling**: Automatically pre-fills onboarding forms with collected details

## Tech Stack

- **Framework**: Next.js 15
- **AI**: Anthropic Claude 3.5 Sonnet
- **Styling**: Tailwind CSS
- **Database**: Prisma (PostgreSQL)
- **Authentication**: NextAuth.js

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   DATABASE_URL=your_database_url
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```
   
   **Google Maps API Key**: Get your API key from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis). Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

## AI Search System

The AI search system is documented in `docs/AI_SEARCH_CONFIG.md`. It uses a simple, robust approach with:
- Entity type detection (Brand vs Owner)
- Context-aware detail extraction
- Fallback responses for reliability
- Conversation memory management

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── ai-search/        # AI search API endpoint
│   ├── onboarding/           # Brand and owner onboarding forms
│   └── page.tsx              # Homepage with search
├── components/
│   ├── AiSearchModal.tsx     # AI chat interface
│   └── ...
└── lib/
    └── ai-search/
        └── simple-search.ts  # Core AI search logic
docs/                         # Documentation files
```

## Key Files

- `docs/AI_SEARCH_CONFIG.md`: Complete documentation of the AI search system
- `docs/BUILD.md`: Complete build and architecture documentation
- `docs/loka.md`: Complete platform documentation
- `src/lib/ai-search/simple-search.ts`: Main AI search implementation
- `src/components/AiSearchModal.tsx`: Frontend chat interface
- `src/app/api/ai-search/route.ts`: API endpoint

## Documentation

All documentation files have been organized in the `docs/` folder. Key documentation includes:
- `docs/BUILD.md` - Build and architecture documentation
- `docs/loka.md` - Complete platform documentation
- `docs/AI_SEARCH_CONFIG.md` - AI search system documentation
- `docs/SECURITY_REVIEW.md` - Security review and best practices
- And more...

## Development

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint

## License

Private
