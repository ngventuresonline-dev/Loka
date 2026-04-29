/**
 * Targeted brand scraper using Google Places Text Search API.
 * Fills gaps left by Nearby Search for verticals that have no Google type:
 *   QSR chains, eyewear, apparel, footwear, and other brand categories.
 *
 * Uses Text Search (not Nearby Search) so we can find specific branded outlets
 * by name. Sets the `type` column correctly so competitor matching works.
 *
 * Usage:
 *   npx tsx scripts/scrape-places-brands-targeted.ts
 *   npx tsx scripts/scrape-places-brands-targeted.ts --dry-run
 *   npx tsx scripts/scrape-places-brands-targeted.ts --resume
 *
 * Env: GOOGLE_MAPS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { resolve } from 'path'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: resolve(process.cwd(), '.env.local') })
dotenvConfig({ path: resolve(process.cwd(), '.env') })

const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!MAPS_KEY) { console.error('❌  GOOGLE_MAPS_API_KEY not set'); process.exit(1) }
if (!SUPABASE_URL) { console.error('❌  SUPABASE_URL not set'); process.exit(1) }
if (!SUPABASE_KEY) { console.error('❌  SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const dryRun = process.argv.includes('--dry-run')
const resume = process.argv.includes('--resume')

const donePath = resolve(process.cwd(), 'scrape-brands-done.log')
const statsPath = resolve(process.cwd(), 'scrape-brands-stats.json')

// ── Bangalore bounding box (filter out-of-city results) ───────────────────────
const BLR_BOUNDS = { minLat: 12.82, maxLat: 13.18, minLng: 77.45, maxLng: 77.80 }
function inBangalore(lat: number, lng: number): boolean {
  return lat >= BLR_BOUNDS.minLat && lat <= BLR_BOUNDS.maxLat &&
         lng >= BLR_BOUNDS.minLng && lng <= BLR_BOUNDS.maxLng
}

// ── Zone anchors — one per Bangalore macro-zone, 3km radius each ──────────────
const ZONES = [
  { name: 'Koramangala',     lat: 12.9352, lng: 77.6245, zone: 'South'   },
  { name: 'Jayanagar',       lat: 12.9256, lng: 77.5934, zone: 'South'   },
  { name: 'JP Nagar',        lat: 12.9078, lng: 77.5812, zone: 'South'   },
  { name: 'Bannerghatta Rd', lat: 12.8934, lng: 77.5978, zone: 'South'   },
  { name: 'Electronic City', lat: 12.8452, lng: 77.6602, zone: 'South'   },
  { name: 'HSR Layout',      lat: 12.9116, lng: 77.6412, zone: 'South'   },
  { name: 'BTM Layout',      lat: 12.9178, lng: 77.6134, zone: 'South'   },
  { name: 'Bellandur',       lat: 12.9279, lng: 77.6878, zone: 'East'    },
  { name: 'Sarjapur Road',   lat: 12.9116, lng: 77.6745, zone: 'East'    },
  { name: 'Marathahalli',    lat: 12.9568, lng: 77.7011, zone: 'East'    },
  { name: 'Indiranagar',     lat: 12.9784, lng: 77.6408, zone: 'East'    },
  { name: 'Whitefield',      lat: 12.9847, lng: 77.7357, zone: 'East'    },
  { name: 'Brookefield',     lat: 12.9834, lng: 77.7034, zone: 'East'    },
  { name: 'MG Road',         lat: 12.9745, lng: 77.6089, zone: 'Central' },
  { name: 'UB City',         lat: 12.9712, lng: 77.5967, zone: 'Central' },
  { name: 'Cunningham Road', lat: 12.9845, lng: 77.5923, zone: 'Central' },
  { name: 'Malleshwaram',    lat: 13.0034, lng: 77.5634, zone: 'North'   },
  { name: 'Rajajinagar',     lat: 12.9923, lng: 77.5534, zone: 'North'   },
  { name: 'Hebbal',          lat: 13.0456, lng: 77.5978, zone: 'North'   },
  { name: 'Manyata',         lat: 13.0456, lng: 77.6112, zone: 'North'   },
  { name: 'Yelahanka',       lat: 13.1012, lng: 77.5934, zone: 'North'   },
  { name: 'Banaswadi',       lat: 13.0156, lng: 77.6534, zone: 'North'   },
]

// ── Brand definitions ─────────────────────────────────────────────────────────
// searchQuery  : what we send to Google Text Search
// industry     : top-level category for the outlet table
// category     : sub-category (what brand profiles use for competitor matching)
// type         : business type column — must match brand profile's `category` exactly
// namePattern  : RegExp to validate the result name actually matches the brand
type BrandSpec = {
  searchQuery: string
  industry: string
  category: string
  type: string
  namePattern: RegExp
}

const BRANDS: BrandSpec[] = [
  // ── QSR ───────────────────────────────────────────────────────────────────
  {
    searchQuery: "McDonald's",
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /mcdonald/i,
  },
  {
    searchQuery: 'KFC',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /\bkfc\b/i,
  },
  {
    searchQuery: "Domino's Pizza",
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /domino/i,
  },
  {
    searchQuery: 'Pizza Hut',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /pizza\s*hut/i,
  },
  {
    searchQuery: 'Burger King',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /burger\s*king/i,
  },
  {
    searchQuery: 'Subway restaurant',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /\bsubway\b/i,
  },
  {
    searchQuery: 'Wow Momo',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /wow\s*momo/i,
  },
  {
    searchQuery: 'Taco Bell',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /taco\s*bell/i,
  },
  {
    searchQuery: 'Burger Singh',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /burger\s*singh/i,
  },
  {
    searchQuery: "Dunkin' Donuts",
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /dunkin/i,
  },
  {
    searchQuery: 'Baskin Robbins ice cream',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /baskin/i,
  },
  {
    searchQuery: 'Fasos',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /faasos|fasos/i,
  },
  {
    searchQuery: 'Haldirams restaurant',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /haldiram/i,
  },
  {
    searchQuery: 'Biryani Blues',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /biryani\s*blues/i,
  },
  {
    searchQuery: 'Smoke House Deli',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /smoke\s*house/i,
  },
  {
    searchQuery: 'Chaayos tea cafe',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /chaayos/i,
  },
  {
    searchQuery: 'Third Wave Coffee',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /third\s*wave/i,
  },
  {
    searchQuery: 'Blue Tokai Coffee',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /blue\s*tokai/i,
  },
  {
    searchQuery: 'Starbucks Coffee',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /starbucks/i,
  },
  {
    searchQuery: 'Costa Coffee',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /costa\s*coffee/i,
  },
  {
    searchQuery: 'Cafe Coffee Day',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /coffee\s*day|ccd/i,
  },
  // ── Eyewear ───────────────────────────────────────────────────────────────
  {
    searchQuery: 'Lenskart',
    industry: 'Retail', category: 'Eyewear', type: 'Eyewear',
    namePattern: /lenskart/i,
  },
  {
    searchQuery: 'Specsmakers',
    industry: 'Retail', category: 'Eyewear', type: 'Eyewear',
    namePattern: /specsmaker/i,
  },
  {
    searchQuery: 'Titan Eye+',
    industry: 'Retail', category: 'Eyewear', type: 'Eyewear',
    namePattern: /titan\s*eye/i,
  },
  {
    searchQuery: 'GKB Opticals',
    industry: 'Retail', category: 'Eyewear', type: 'Eyewear',
    namePattern: /gkb/i,
  },
  {
    searchQuery: 'Vision Express optician',
    industry: 'Retail', category: 'Eyewear', type: 'Eyewear',
    namePattern: /vision\s*express/i,
  },
  {
    searchQuery: 'John Jacobs eyewear',
    industry: 'Retail', category: 'Eyewear', type: 'Eyewear',
    namePattern: /john\s*jacobs/i,
  },
  // ── Loka placed brands (clients) — must exist in outlets table ───────────
  {
    searchQuery: 'Mumbai Pav Co Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /mumbai\s*pav/i,
  },
  {
    searchQuery: 'Meltin Desires dessert Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /meltin\s*desires/i,
  },
  {
    searchQuery: 'Sandowitch restaurant Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /sandowitch/i,
  },
  {
    searchQuery: 'Eleven Bakehouse Bangalore',
    industry: 'F&B', category: 'Bakery', type: 'Bakery',
    namePattern: /eleven\s*bake/i,
  },
  {
    searchQuery: 'Wrapafella Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /wrapafella/i,
  },
  {
    searchQuery: 'Madam Chocolate dessert Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /madam\s*chocolate/i,
  },
  {
    searchQuery: 'Evil Onigiri Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /evil\s*onigiri/i,
  },
  {
    searchQuery: 'Tan Coffee Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /\btan\s*coffee\b/i,
  },
  {
    searchQuery: 'The Flour Girl Cafe Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /flour\s*girl/i,
  },
  {
    searchQuery: 'Holy Pav Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /holy\s*pav/i,
  },
  {
    searchQuery: 'GoRally sports Bangalore',
    industry: 'Entertainment', category: 'Sports & Entertainment', type: 'Sports & Entertainment',
    namePattern: /gorally|go\s*rally/i,
  },
  {
    searchQuery: 'Klutch Klub Bangalore',
    industry: 'Entertainment', category: 'Sports & Entertainment', type: 'Sports & Entertainment',
    namePattern: /klutch\s*klub/i,
  },
  {
    searchQuery: 'Minibe dessert Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /\bminibe\b/i,
  },
  {
    searchQuery: 'Namaste South Indian restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /namaste.*south\s*indian|namaste.*restaurant/i,
  },
  {
    searchQuery: 'Dolphins Bar Kitchen Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /dolphins\s*bar/i,
  },
  {
    searchQuery: 'Samosa Party Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /samosa\s*party/i,
  },
  {
    searchQuery: 'Bawri restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bbawri\b/i,
  },
  {
    searchQuery: 'Block Two Coffee Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /block\s*two\s*coffee/i,
  },
  {
    searchQuery: 'Burger Seigneur Bangalore',
    industry: 'F&B', category: 'Premium Dining', type: 'Premium Dining',
    namePattern: /burger\s*seigneur/i,
  },
  {
    searchQuery: 'Sun Kissed Smoothie Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /sun\s*kissed/i,
  },
  // ── Local / Regional Bangalore brands ────────────────────────────────────
  {
    searchQuery: 'Biggies Burger Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /biggies/i,
  },
  {
    searchQuery: 'Boba Bhai Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /boba\s*bhai/i,
  },
  {
    searchQuery: 'Original Burger Company Bangalore',
    industry: 'F&B', category: 'Premium Dining', type: 'Premium Dining',
    namePattern: /original\s*burger/i,
  },
  {
    searchQuery: 'Alien Kind restaurant Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /alien\s*kind|alienkind/i,
  },
  {
    searchQuery: 'Thulp burger Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /thulp/i,
  },
  {
    searchQuery: 'Onesta pizza Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /onesta/i,
  },
  {
    searchQuery: 'Truffles restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /truffles/i,
  },
  {
    searchQuery: 'Hatti Kaapi Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /hatti\s*kaapi/i,
  },
  {
    searchQuery: 'Social restaurant Impresario Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bsocial\b/i,
  },
  // ── Apparel ───────────────────────────────────────────────────────────────
  {
    searchQuery: 'Zara clothing store',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bzara\b/i,
  },
  {
    searchQuery: 'H&M fashion store',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bh\s*&\s*m\b|h\s*and\s*m\s*store/i,
  },
  {
    searchQuery: 'Mango fashion store',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bmango\b/i,
  },
  {
    searchQuery: 'Uniqlo store',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /uniqlo/i,
  },
  {
    searchQuery: 'Westside store',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /westside/i,
  },
  {
    searchQuery: 'Max Fashion clothing',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /max\s*fashion/i,
  },
  {
    searchQuery: 'Pantaloons fashion',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /pantaloon/i,
  },
  {
    searchQuery: 'Fabindia store',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /fabindia/i,
  },
  {
    searchQuery: 'Allen Solly store',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /allen\s*solly/i,
  },
  {
    searchQuery: 'Van Heusen store',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /van\s*heusen/i,
  },
  {
    searchQuery: 'Raymond clothing',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /raymond/i,
  },
  {
    searchQuery: 'W for Woman store',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bw\s+for\s+woman\b|\bw-?\s*store\b/i,
  },
  // ── Footwear ──────────────────────────────────────────────────────────────
  {
    searchQuery: 'Nike store',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /\bnike\b/i,
  },
  {
    searchQuery: 'Adidas store',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /\badidas\b/i,
  },
  {
    searchQuery: 'Puma store',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /\bpuma\b/i,
  },
  {
    searchQuery: 'Bata shoe store',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /\bbata\b/i,
  },
  {
    searchQuery: 'Woodland shoes',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /woodland/i,
  },
  {
    searchQuery: 'Metro shoes store',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /metro\s*shoes/i,
  },
  {
    searchQuery: 'Liberty shoes',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /liberty\s*shoe/i,
  },
  // ── Fitness & Wellness ─────────────────────────────────────────────────────
  {
    searchQuery: 'Cult.fit gym',
    industry: 'Wellness', category: 'Gym', type: 'Gym',
    namePattern: /cult\.?fit|cultfit/i,
  },
  {
    searchQuery: 'Gold\'s Gym',
    industry: 'Wellness', category: 'Gym', type: 'Gym',
    namePattern: /gold.?s\s*gym/i,
  },
  {
    searchQuery: 'Anytime Fitness gym',
    industry: 'Wellness', category: 'Gym', type: 'Gym',
    namePattern: /anytime\s*fitness/i,
  },
  {
    searchQuery: 'Enrich salon',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /enrich/i,
  },
  {
    searchQuery: 'Naturals salon',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /naturals/i,
  },
  {
    searchQuery: 'Lakmé salon',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /lakm[eé]/i,
  },
  // ── Electronics ───────────────────────────────────────────────────────────
  {
    searchQuery: 'Apple Store authorized reseller',
    industry: 'Retail', category: 'Electronics', type: 'Electronics',
    namePattern: /apple\s*(store|authorized|reseller|istore|premium)/i,
  },
  {
    searchQuery: 'Croma electronics store',
    industry: 'Retail', category: 'Electronics', type: 'Electronics',
    namePattern: /\bcroma\b/i,
  },
  {
    searchQuery: 'Reliance Digital store',
    industry: 'Retail', category: 'Electronics', type: 'Electronics',
    namePattern: /reliance\s*digital/i,
  },
  // ── Grocery / Supermarket ─────────────────────────────────────────────────
  {
    searchQuery: 'Dmart supermarket',
    industry: 'Retail', category: 'Grocery', type: 'Grocery',
    namePattern: /d\s*mart/i,
  },
  {
    searchQuery: 'More supermarket',
    industry: 'Retail', category: 'Grocery', type: 'Grocery',
    namePattern: /\bmore\s*(supermarket|megastore|retail)/i,
  },
  {
    searchQuery: 'Reliance Fresh grocery',
    industry: 'Retail', category: 'Grocery', type: 'Grocery',
    namePattern: /reliance\s*fresh|reliance\s*smart/i,
  },
  {
    searchQuery: 'Natures Basket grocery',
    industry: 'Retail', category: 'Grocery', type: 'Grocery',
    namePattern: /nature.?s\s*basket/i,
  },
  {
    searchQuery: 'Nilgiris supermarket Bangalore',
    industry: 'Retail', category: 'Grocery', type: 'Grocery',
    namePattern: /nilgiris/i,
  },
  {
    searchQuery: 'Foodhall premium grocery Bangalore',
    industry: 'Retail', category: 'Grocery', type: 'Grocery',
    namePattern: /foodhall/i,
  },
  // ── Premium / Casual Dining (Bangalore chains) ────────────────────────────
  {
    searchQuery: 'Barbeque Nation Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /barbeque\s*nation/i,
  },
  {
    searchQuery: 'Byg Brewski Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /byg\s*brewski/i,
  },
  {
    searchQuery: 'Toit brewpub Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /\btoit\b/i,
  },
  {
    searchQuery: 'The Permit Room Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /permit\s*room/i,
  },
  {
    searchQuery: 'Windmills Craftworks Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /windmill/i,
  },
  {
    searchQuery: 'Arbor Brewing Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /arbor\s*brew/i,
  },
  {
    searchQuery: 'Corner House ice cream Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /corner\s*house/i,
  },
  {
    searchQuery: 'Amadora gelato Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /amadora/i,
  },
  {
    searchQuery: 'Glen\'s Bakehouse Bangalore',
    industry: 'F&B', category: 'Bakery', type: 'Bakery',
    namePattern: /glen.?s\s*bake/i,
  },
  {
    searchQuery: 'The Flying Squirrel coffee Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /flying\s*squirrel/i,
  },
  {
    searchQuery: 'Araku coffee Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /\baraku\b/i,
  },
  // ── Footwear (additional) ─────────────────────────────────────────────────
  {
    searchQuery: 'Skechers store Bangalore',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /skechers/i,
  },
  {
    searchQuery: 'Reebok store Bangalore',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /\breebok\b/i,
  },
  {
    searchQuery: 'New Balance store Bangalore',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /new\s*balance/i,
  },
  {
    searchQuery: 'Hush Puppies store Bangalore',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /hush\s*puppies/i,
  },
  {
    searchQuery: 'Clarks shoes Bangalore',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /\bclarks\b/i,
  },
  // ── Apparel (additional) ──────────────────────────────────────────────────
  {
    searchQuery: 'Levi\'s store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /levi.?s/i,
  },
  {
    searchQuery: 'Peter England store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /peter\s*england/i,
  },
  {
    searchQuery: 'Louis Philippe store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /louis\s*philippe/i,
  },
  {
    searchQuery: 'US Polo store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /us\s*polo/i,
  },
  {
    searchQuery: 'Blackberrys clothing Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /blackberrys/i,
  },
  {
    searchQuery: 'Biba fashion store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bbiba\b/i,
  },
  {
    searchQuery: 'Global Desi fashion Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /global\s*desi/i,
  },
  // ── Beauty & Cosmetics ────────────────────────────────────────────────────
  {
    searchQuery: 'Nykaa store Bangalore',
    industry: 'Retail', category: 'Beauty', type: 'Beauty',
    namePattern: /\bnykaa\b/i,
  },
  {
    searchQuery: 'Sugar Cosmetics store Bangalore',
    industry: 'Retail', category: 'Beauty', type: 'Beauty',
    namePattern: /sugar\s*cosmetics/i,
  },
  {
    searchQuery: 'The Body Shop Bangalore',
    industry: 'Retail', category: 'Beauty', type: 'Beauty',
    namePattern: /body\s*shop/i,
  },
  {
    searchQuery: 'MAC Cosmetics store Bangalore',
    industry: 'Retail', category: 'Beauty', type: 'Beauty',
    namePattern: /\bmac\s*(cosmetics|studio|store)/i,
  },
  {
    searchQuery: 'Forest Essentials store Bangalore',
    industry: 'Retail', category: 'Beauty', type: 'Beauty',
    namePattern: /forest\s*essentials/i,
  },
  {
    searchQuery: 'Kama Ayurveda store Bangalore',
    industry: 'Retail', category: 'Beauty', type: 'Beauty',
    namePattern: /kama\s*ayurveda/i,
  },
  // ── Jewellery ─────────────────────────────────────────────────────────────
  {
    searchQuery: 'Tanishq jewellery Bangalore',
    industry: 'Retail', category: 'Jewellery', type: 'Jewellery',
    namePattern: /tanishq/i,
  },
  {
    searchQuery: 'Malabar Gold jewellery Bangalore',
    industry: 'Retail', category: 'Jewellery', type: 'Jewellery',
    namePattern: /malabar\s*gold/i,
  },
  {
    searchQuery: 'Kalyan Jewellers Bangalore',
    industry: 'Retail', category: 'Jewellery', type: 'Jewellery',
    namePattern: /kalyan\s*jewellers/i,
  },
  {
    searchQuery: 'CaratLane jewellery Bangalore',
    industry: 'Retail', category: 'Jewellery', type: 'Jewellery',
    namePattern: /caratlane/i,
  },
  {
    searchQuery: 'Senco Gold jewellery Bangalore',
    industry: 'Retail', category: 'Jewellery', type: 'Jewellery',
    namePattern: /senco/i,
  },
  // ── Electronics (additional) ──────────────────────────────────────────────
  {
    searchQuery: 'Samsung Experience Store Bangalore',
    industry: 'Retail', category: 'Electronics', type: 'Electronics',
    namePattern: /samsung\s*(experience|store|plaza)/i,
  },
  {
    searchQuery: 'OnePlus experience store Bangalore',
    industry: 'Retail', category: 'Electronics', type: 'Electronics',
    namePattern: /oneplus/i,
  },
  // ── Wellness (additional) ─────────────────────────────────────────────────
  {
    searchQuery: 'VLCC wellness Bangalore',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /\bvlcc\b/i,
  },
  {
    searchQuery: 'Jawed Habib salon Bangalore',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /jawed\s*habib/i,
  },
  {
    searchQuery: 'YLG salon Bangalore',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /\bylg\b/i,
  },
  {
    searchQuery: 'Cult.fit gym Bangalore',
    industry: 'Wellness', category: 'Gym', type: 'Gym',
    namePattern: /cult\.?fit|cultfit/i,
  },
  {
    searchQuery: 'Snap Fitness gym Bangalore',
    industry: 'Wellness', category: 'Gym', type: 'Gym',
    namePattern: /snap\s*fitness/i,
  },
  // ── Specialty / Ethnic cuisine (Yuki, Lucky Chan, Burma Burma tier) ──────
  {
    searchQuery: 'Yuki Japanese restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\byuki\b/i,
  },
  {
    searchQuery: 'Misu restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bmisu\b/i,
  },
  {
    searchQuery: 'Lucky Chan restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /lucky\s*chan/i,
  },
  {
    searchQuery: 'Burma Burma restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /burma\s*burma/i,
  },
  {
    searchQuery: 'Bharatiya Jalpan Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /bharatiya\s*jalpan/i,
  },
  {
    searchQuery: 'Polar Bear ice cream Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /polar\s*bear/i,
  },
  {
    searchQuery: 'SodaBottleOpenerWala Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /sodabottle/i,
  },
  {
    searchQuery: 'Empire Restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /empire\s*restaurant/i,
  },
  {
    searchQuery: 'Meghana Foods biryani Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /meghana\s*foods/i,
  },
  {
    searchQuery: 'Nasi and Mee restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /nasi\s*and\s*mee|nasi\s*&\s*mee/i,
  },
  {
    searchQuery: 'Koshy\'s restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /koshy.?s/i,
  },
  {
    searchQuery: 'Anand Sweets Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /anand\s*sweets/i,
  },
  {
    searchQuery: 'CTR Central Tiffin Room Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /central\s*tiffin|ctr\s*bangalore/i,
  },
  {
    searchQuery: 'Airlines Hotel restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /airlines\s*hotel/i,
  },
  {
    searchQuery: 'Vidyarthi Bhavan Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /vidyarthi\s*bhavan/i,
  },
  // ── Indie / Premium concepts (Neon Market, Nonas tier) ───────────────────
  {
    searchQuery: 'Neon Market Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /neon\s*market/i,
  },
  {
    searchQuery: 'Nonas restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bnonas?\b/i,
  },
  {
    searchQuery: 'The Only Place restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /the\s*only\s*place/i,
  },
  {
    searchQuery: 'Hard Rock Cafe Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /hard\s*rock\s*cafe/i,
  },
  {
    searchQuery: 'Toscano restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\btoscano\b/i,
  },
  {
    searchQuery: 'Sly Granny brewery Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /sly\s*granny/i,
  },
  {
    searchQuery: 'Vapour Bar Exchange Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /vapour\s*bar/i,
  },
  {
    searchQuery: 'The British Brewing Company Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /british\s*brewing/i,
  },
  {
    searchQuery: 'Harley\'s Fine Baking Bangalore',
    industry: 'F&B', category: 'Bakery', type: 'Bakery',
    namePattern: /harley.?s\s*fine\s*bak/i,
  },
  {
    searchQuery: 'The Kind Roastery Bangalore',
    industry: 'F&B', category: 'Specialty Coffee', type: 'Specialty Coffee',
    namePattern: /kind\s*roastery/i,
  },
  {
    searchQuery: 'Subko Coffee Roasters Bangalore',
    industry: 'F&B', category: 'Specialty Coffee', type: 'Specialty Coffee',
    namePattern: /\bsubko\b/i,
  },
  {
    searchQuery: 'Corridor Seven Coffee Bangalore',
    industry: 'F&B', category: 'Specialty Coffee', type: 'Specialty Coffee',
    namePattern: /corridor\s*seven/i,
  },
  {
    searchQuery: 'Curious Life Coffee Roasters Bangalore',
    industry: 'F&B', category: 'Specialty Coffee', type: 'Specialty Coffee',
    namePattern: /curious\s*life/i,
  },
  {
    searchQuery: 'Kaffa Cerrado coffee Bangalore',
    industry: 'F&B', category: 'Specialty Coffee', type: 'Specialty Coffee',
    namePattern: /kaffa\s*cerrado/i,
  },
  {
    searchQuery: 'Matteo Coffea Bangalore',
    industry: 'F&B', category: 'Specialty Coffee', type: 'Specialty Coffee',
    namePattern: /matteo\s*coffea/i,
  },
  {
    searchQuery: 'Double Skinny Macchiato Bangalore',
    industry: 'F&B', category: 'Specialty Coffee', type: 'Specialty Coffee',
    namePattern: /double\s*skinny/i,
  },
  {
    searchQuery: 'Roastery Coffee House Bangalore',
    industry: 'F&B', category: 'Specialty Coffee', type: 'Specialty Coffee',
    namePattern: /roastery\s*coffee\s*house/i,
  },
  {
    searchQuery: 'Slay Coffee Bangalore',
    industry: 'F&B', category: 'Specialty Coffee', type: 'Specialty Coffee',
    namePattern: /slay\s*coffee/i,
  },
  {
    searchQuery: 'Koinonia Coffee Roasters Bangalore',
    industry: 'F&B', category: 'Specialty Coffee', type: 'Specialty Coffee',
    namePattern: /koinonia/i,
  },
  {
    searchQuery: 'Dyu Art Cafe Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /dyu\s*art/i,
  },
  // ── Artisan / Premium F&B (Pizza 4P's, Paris Panini tier) ────────────────
  {
    searchQuery: 'Pizza 4Ps Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /pizza\s*4p|4p.?s\s*pizza/i,
  },
  {
    searchQuery: 'Paris Panini cafe Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /paris\s*panini/i,
  },
  {
    searchQuery: 'Theobroma bakery Bangalore',
    industry: 'F&B', category: 'Bakery', type: 'Bakery',
    namePattern: /theobroma/i,
  },
  {
    searchQuery: 'Lavonne pastry Bangalore',
    industry: 'F&B', category: 'Bakery', type: 'Bakery',
    namePattern: /lavonne/i,
  },
  {
    searchQuery: 'Bengaluru Oota Company restaurant',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /oota\s*company/i,
  },
  {
    searchQuery: 'Imly street food Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /\bimly\b/i,
  },
  {
    searchQuery: 'Biryani By Kilo Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /biryani\s*by\s*kilo/i,
  },
  {
    searchQuery: 'Behrouz Biryani Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /behrouz/i,
  },
  {
    searchQuery: 'Rolls Mania Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /rolls\s*mania/i,
  },
  {
    searchQuery: 'Momo Junction Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /momo\s*junction/i,
  },
  {
    searchQuery: 'Noodle Bar restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /noodle\s*bar/i,
  },
  {
    searchQuery: 'Pa Pa Ya restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /pa\s*pa\s*ya/i,
  },
  {
    searchQuery: 'Bombay Brasserie restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /bombay\s*brasserie/i,
  },
  {
    searchQuery: 'Monkey Bar restaurant Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /monkey\s*bar/i,
  },
  {
    searchQuery: 'Prost brewery Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /\bprost\b/i,
  },
  {
    searchQuery: 'Toast & Tonic restaurant Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /toast\s*&\s*tonic|toast\s*and\s*tonic/i,
  },
  {
    searchQuery: 'Shiro restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bshiro\b/i,
  },
  {
    searchQuery: 'The Fatty Bao Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /fatty\s*bao/i,
  },
  // ── Premium Burger (competitors for Burger Seigneur, Original Burger Co) ──
  {
    searchQuery: 'The Good Flippin Burger Bangalore',
    industry: 'F&B', category: 'Premium Dining', type: 'Premium Dining',
    namePattern: /good\s*flippin/i,
  },
  {
    searchQuery: 'Shake Shack Bangalore',
    industry: 'F&B', category: 'Premium Dining', type: 'Premium Dining',
    namePattern: /shake\s*shack/i,
  },
  {
    searchQuery: 'Smashburger Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /smashburger/i,
  },
  // ── South Indian (competitors for Namaste, Holy Pav) ─────────────────────
  {
    searchQuery: 'MTR Mavalli Tiffin Room Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bmtr\b|mavalli\s*tiffin/i,
  },
  {
    searchQuery: 'Brahmin\'s Coffee Bar Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /brahmin.?s\s*coffee/i,
  },
  {
    searchQuery: 'Adyar Ananda Bhavan A2B Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /adyar\s*ananda|a2b/i,
  },
  {
    searchQuery: 'Vasudev Adigas fast food Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /adigas/i,
  },
  {
    searchQuery: 'Udupi Palace restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /udupi\s*palace/i,
  },
  // ── Specialty Snacks (competitors for Samosa Party, 4700BC) ───────────────
  {
    searchQuery: 'Samosa Singh Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /samosa\s*singh/i,
  },
  {
    searchQuery: '4700BC popcorn Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /4700\s*bc/i,
  },
  // ── Japanese / Asian QSR (competitors for Evil Onigiri) ──────────────────
  {
    searchQuery: 'Sushi restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /sushi/i,
  },
  {
    searchQuery: 'Ramen restaurant Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /ramen/i,
  },
  {
    searchQuery: 'Poke bowl Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /poke\s*(bowl|bar|house)/i,
  },
  // ── Premium Casual Dining ────────────────────────────────────────────────
  {
    searchQuery: 'Farzi Cafe Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /farzi\s*cafe/i,
  },
  {
    searchQuery: 'Punjabi Grill restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /punjabi\s*grill/i,
  },
  {
    searchQuery: 'AB\'s Absolute Barbecues Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /absolute\s*barbecue|ab.?s\s*(bbq|barbecue)/i,
  },
  // ── Sports & Entertainment (competitors for GoRally, Klutch Klub) ─────────
  {
    searchQuery: 'Smaaash entertainment Bangalore',
    industry: 'Entertainment', category: 'Sports & Entertainment', type: 'Sports & Entertainment',
    namePattern: /smaaash/i,
  },
  {
    searchQuery: 'Amoeba gaming entertainment Bangalore',
    industry: 'Entertainment', category: 'Sports & Entertainment', type: 'Sports & Entertainment',
    namePattern: /\bamoeba\b/i,
  },
  {
    searchQuery: 'Pickleball court Bangalore',
    industry: 'Entertainment', category: 'Sports & Entertainment', type: 'Sports & Entertainment',
    namePattern: /pickleball/i,
  },
  {
    searchQuery: 'Fun World gaming Bangalore',
    industry: 'Entertainment', category: 'Sports & Entertainment', type: 'Sports & Entertainment',
    namePattern: /fun\s*world/i,
  },
  // ── Co-working (growing category) ────────────────────────────────────────
  {
    searchQuery: 'WeWork coworking Bangalore',
    industry: 'Services', category: 'Co-working', type: 'Co-working',
    namePattern: /wework/i,
  },
  {
    searchQuery: 'Awfis coworking space Bangalore',
    industry: 'Services', category: 'Co-working', type: 'Co-working',
    namePattern: /awfis/i,
  },
  {
    searchQuery: 'Cowrks coworking Bangalore',
    industry: 'Services', category: 'Co-working', type: 'Co-working',
    namePattern: /cowrks/i,
  },
  {
    searchQuery: '91springboard coworking Bangalore',
    industry: 'Services', category: 'Co-working', type: 'Co-working',
    namePattern: /91\s*springboard/i,
  },
  {
    searchQuery: 'IndiQube coworking Bangalore',
    industry: 'Services', category: 'Co-working', type: 'Co-working',
    namePattern: /indiqube/i,
  },
  // ── Kids Retail ───────────────────────────────────────────────────────────
  {
    searchQuery: 'FirstCry baby kids store Bangalore',
    industry: 'Retail', category: 'Kids', type: 'Kids',
    namePattern: /firstcry/i,
  },
  {
    searchQuery: 'Mothercare store Bangalore',
    industry: 'Retail', category: 'Kids', type: 'Kids',
    namePattern: /mothercare/i,
  },
  // ── Home Decor ────────────────────────────────────────────────────────────
  {
    searchQuery: 'Pepperfry store Bangalore',
    industry: 'Retail', category: 'Home Decor', type: 'Home Decor',
    namePattern: /pepperfry/i,
  },
  {
    searchQuery: 'Godrej Interio store Bangalore',
    industry: 'Retail', category: 'Home Decor', type: 'Home Decor',
    namePattern: /godrej\s*interio/i,
  },
  {
    searchQuery: 'IKEA Bangalore',
    industry: 'Retail', category: 'Home Decor', type: 'Home Decor',
    namePattern: /\bikea\b/i,
  },
  // ── Watches & Accessories ─────────────────────────────────────────────────
  {
    searchQuery: 'Titan watch store Bangalore',
    industry: 'Retail', category: 'Watches', type: 'Watches',
    namePattern: /\btitan\b(?!\s*eye)/i,
  },
  {
    searchQuery: 'Fastrack store Bangalore',
    industry: 'Retail', category: 'Watches', type: 'Watches',
    namePattern: /fastrack/i,
  },
  {
    searchQuery: 'Fossil watch store Bangalore',
    industry: 'Retail', category: 'Watches', type: 'Watches',
    namePattern: /\bfossil\b/i,
  },
  // ── Yoga ─────────────────────────────────────────────────────────────────
  {
    searchQuery: 'Yoga studio Bangalore',
    industry: 'Wellness', category: 'Yoga Studio', type: 'Yoga Studio',
    namePattern: /yoga\s*(studio|house|shala|center)/i,
  },
  {
    searchQuery: 'Aster Yoga Bangalore',
    industry: 'Wellness', category: 'Yoga Studio', type: 'Yoga Studio',
    namePattern: /aster\s*yoga/i,
  },
  {
    searchQuery: 'Sarva Yoga Bangalore',
    industry: 'Wellness', category: 'Yoga Studio', type: 'Yoga Studio',
    namePattern: /sarva\s*yoga/i,
  },
  // ── Dessert / Ice Cream ───────────────────────────────────────────────────
  {
    searchQuery: 'Milano ice cream Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /\bmilano\b/i,
  },
  {
    searchQuery: 'Hokey Pokey ice cream Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /hokey\s*pokey/i,
  },
  {
    searchQuery: 'Haagen Dazs ice cream Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /haagen.?dazs/i,
  },
  {
    searchQuery: 'Natural Ice Cream Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /natural\s*ice\s*cream/i,
  },
  {
    searchQuery: 'Swirls frozen yogurt Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /\bswirls\b/i,
  },
  // ── Bubble Tea ────────────────────────────────────────────────────────────
  {
    searchQuery: 'Gong Cha bubble tea Bangalore',
    industry: 'F&B', category: 'Bubble Tea', type: 'Bubble Tea',
    namePattern: /gong\s*cha/i,
  },
  {
    searchQuery: 'Chatime bubble tea Bangalore',
    industry: 'F&B', category: 'Bubble Tea', type: 'Bubble Tea',
    namePattern: /chatime/i,
  },
  {
    searchQuery: 'Tealogy bubble tea Bangalore',
    industry: 'F&B', category: 'Bubble Tea', type: 'Bubble Tea',
    namePattern: /tealogy/i,
  },
  // ── Health Food / Salads ──────────────────────────────────────────────────
  {
    searchQuery: 'Salad Days Bangalore',
    industry: 'F&B', category: 'Health Food', type: 'Health Food',
    namePattern: /salad\s*days/i,
  },
  {
    searchQuery: 'EatFit restaurant Bangalore',
    industry: 'F&B', category: 'Health Food', type: 'Health Food',
    namePattern: /\beatfit\b/i,
  },
  {
    searchQuery: 'Yumlane pizza Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /yumlane/i,
  },
  {
    searchQuery: 'La Pinoz pizza Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /la\s*pino.?z/i,
  },
  // ── Bars & Breweries (additional) ─────────────────────────────────────────
  {
    searchQuery: 'Ironhill brewery Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /ironhill/i,
  },
  {
    searchQuery: 'Brahma Brews Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /brahma\s*brew/i,
  },
  {
    searchQuery: 'Hoot brewery Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /\bhoot\b/i,
  },
  {
    searchQuery: 'Bier Library Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /bier\s*library/i,
  },
  {
    searchQuery: 'TGI Fridays Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /tgi\s*friday/i,
  },
  {
    searchQuery: 'Fenny\'s Lounge Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /fenny.?s/i,
  },
  {
    searchQuery: 'The Humming Tree Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /humming\s*tree/i,
  },
  {
    searchQuery: 'Kitty Ko bar Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /kitty\s*ko/i,
  },
  // ── Retail — Fashion (additional) ────────────────────────────────────────
  {
    searchQuery: 'Marks & Spencer store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /marks\s*(&|and)\s*spencer/i,
  },
  {
    searchQuery: 'Tommy Hilfiger store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /tommy\s*hilfiger/i,
  },
  {
    searchQuery: 'Calvin Klein store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /calvin\s*klein/i,
  },
  {
    searchQuery: 'Forever New store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /forever\s*new/i,
  },
  {
    searchQuery: 'Gap store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bgap\b/i,
  },
  {
    searchQuery: 'Guess store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bguess\b/i,
  },
  {
    searchQuery: 'Lacoste store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /lacoste/i,
  },
  {
    searchQuery: 'Hugo Boss store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /hugo\s*boss/i,
  },
  {
    searchQuery: 'FabAlley fashion Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /faballey/i,
  },
  {
    searchQuery: 'AND women apparel Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\band\s*(store|apparel|fashion)\b/i,
  },
  // ── Retail — Footwear (accessories tier) ─────────────────────────────────
  {
    searchQuery: 'Charles & Keith store Bangalore',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /charles\s*(&|and)\s*keith/i,
  },
  {
    searchQuery: 'Steve Madden store Bangalore',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /steve\s*madden/i,
  },
  {
    searchQuery: 'Aldo shoes Bangalore',
    industry: 'Retail', category: 'Footwear', type: 'Footwear',
    namePattern: /\baldo\b/i,
  },
  {
    searchQuery: 'Decathlon sports store Bangalore',
    industry: 'Retail', category: 'Sports Retail', type: 'Sports Retail',
    namePattern: /decathlon/i,
  },
  // ── Retail — Beauty (additional) ─────────────────────────────────────────
  {
    searchQuery: 'Colorbar cosmetics Bangalore',
    industry: 'Retail', category: 'Beauty', type: 'Beauty',
    namePattern: /colorbar/i,
  },
  {
    searchQuery: 'Faces Canada cosmetics Bangalore',
    industry: 'Retail', category: 'Beauty', type: 'Beauty',
    namePattern: /faces\s*canada/i,
  },
  {
    searchQuery: 'Kiehl\'s store Bangalore',
    industry: 'Retail', category: 'Beauty', type: 'Beauty',
    namePattern: /kiehl.?s/i,
  },
  {
    searchQuery: 'Lush cosmetics Bangalore',
    industry: 'Retail', category: 'Beauty', type: 'Beauty',
    namePattern: /\blush\b/i,
  },
  // ── Retail — Accessories ──────────────────────────────────────────────────
  {
    searchQuery: 'Accessorize store Bangalore',
    industry: 'Retail', category: 'Accessories', type: 'Accessories',
    namePattern: /\baccessorize\b/i,
  },
  {
    searchQuery: 'American Tourister store Bangalore',
    industry: 'Retail', category: 'Accessories', type: 'Accessories',
    namePattern: /american\s*tourister/i,
  },
  {
    searchQuery: 'Samsonite store Bangalore',
    industry: 'Retail', category: 'Accessories', type: 'Accessories',
    namePattern: /samsonite/i,
  },
  // ── Retail — Electronics (additional) ────────────────────────────────────
  {
    searchQuery: 'Xiaomi Mi store Bangalore',
    industry: 'Retail', category: 'Electronics', type: 'Electronics',
    namePattern: /xiaomi|mi\s*store/i,
  },
  {
    searchQuery: 'Bose store Bangalore',
    industry: 'Retail', category: 'Electronics', type: 'Electronics',
    namePattern: /\bbose\b/i,
  },
  {
    searchQuery: 'Sony Center store Bangalore',
    industry: 'Retail', category: 'Electronics', type: 'Electronics',
    namePattern: /sony\s*(center|centre|store|world)/i,
  },
  // ── Retail — Books ────────────────────────────────────────────────────────
  {
    searchQuery: 'Blossom Book House Bangalore',
    industry: 'Retail', category: 'Books', type: 'Books',
    namePattern: /blossom\s*book/i,
  },
  {
    searchQuery: 'Crossword bookstore Bangalore',
    industry: 'Retail', category: 'Books', type: 'Books',
    namePattern: /crossword/i,
  },
  {
    searchQuery: 'Landmark bookstore Bangalore',
    industry: 'Retail', category: 'Books', type: 'Books',
    namePattern: /\blandmark\b/i,
  },
  {
    searchQuery: 'Atta Galatta bookstore Bangalore',
    industry: 'Retail', category: 'Books', type: 'Books',
    namePattern: /atta\s*galatta/i,
  },
  // ── Jewellery (additional) ────────────────────────────────────────────────
  {
    searchQuery: 'Joyalukkas jewellery Bangalore',
    industry: 'Retail', category: 'Jewellery', type: 'Jewellery',
    namePattern: /joyalukkas/i,
  },
  {
    searchQuery: 'PC Jeweller Bangalore',
    industry: 'Retail', category: 'Jewellery', type: 'Jewellery',
    namePattern: /pc\s*jeweller/i,
  },
  {
    searchQuery: 'Orra jewellery Bangalore',
    industry: 'Retail', category: 'Jewellery', type: 'Jewellery',
    namePattern: /\borra\b/i,
  },
  {
    searchQuery: 'PNG Jewellers Bangalore',
    industry: 'Retail', category: 'Jewellery', type: 'Jewellery',
    namePattern: /\bpng\s*jewel/i,
  },
  // ── Entertainment — Cinema ────────────────────────────────────────────────
  {
    searchQuery: 'PVR Cinemas Bangalore',
    industry: 'Entertainment', category: 'Cinema', type: 'Cinema',
    namePattern: /\bpvr\b/i,
  },
  {
    searchQuery: 'INOX multiplex Bangalore',
    industry: 'Entertainment', category: 'Cinema', type: 'Cinema',
    namePattern: /\binox\b/i,
  },
  {
    searchQuery: 'Cinepolis multiplex Bangalore',
    industry: 'Entertainment', category: 'Cinema', type: 'Cinema',
    namePattern: /cinepolis/i,
  },
  {
    searchQuery: 'Miraj Cinemas Bangalore',
    industry: 'Entertainment', category: 'Cinema', type: 'Cinema',
    namePattern: /miraj\s*cinema/i,
  },
  // ── Entertainment — Gaming / FEC ──────────────────────────────────────────
  {
    searchQuery: 'Timezone entertainment Bangalore',
    industry: 'Entertainment', category: 'Sports & Entertainment', type: 'Sports & Entertainment',
    namePattern: /timezone/i,
  },
  {
    searchQuery: 'Fun City entertainment Bangalore',
    industry: 'Entertainment', category: 'Sports & Entertainment', type: 'Sports & Entertainment',
    namePattern: /fun\s*city/i,
  },
  // ── Wellness — Spa ────────────────────────────────────────────────────────
  {
    searchQuery: 'O2 Spa Bangalore',
    industry: 'Wellness', category: 'Spa', type: 'Spa',
    namePattern: /o2\s*spa/i,
  },
  {
    searchQuery: 'Tattva Spa Bangalore',
    industry: 'Wellness', category: 'Spa', type: 'Spa',
    namePattern: /tattva\s*spa/i,
  },
  {
    searchQuery: 'Four Fountains Spa Bangalore',
    industry: 'Wellness', category: 'Spa', type: 'Spa',
    namePattern: /four\s*fountains/i,
  },
  // ── Wellness — Fitness (additional) ──────────────────────────────────────
  {
    searchQuery: 'F45 Training Bangalore',
    industry: 'Wellness', category: 'Gym', type: 'Gym',
    namePattern: /f45\s*training/i,
  },
  {
    searchQuery: 'Fitness First gym Bangalore',
    industry: 'Wellness', category: 'Gym', type: 'Gym',
    namePattern: /fitness\s*first/i,
  },
  {
    searchQuery: 'Wellness Forever pharmacy Bangalore',
    industry: 'Wellness', category: 'Pharmacy', type: 'Pharmacy',
    namePattern: /wellness\s*forever/i,
  },
  // ── Co-working (additional) ───────────────────────────────────────────────
  {
    searchQuery: 'Bhive workspace Bangalore',
    industry: 'Services', category: 'Co-working', type: 'Co-working',
    namePattern: /\bbhive\b/i,
  },
  {
    searchQuery: 'Smartworks coworking Bangalore',
    industry: 'Services', category: 'Co-working', type: 'Co-working',
    namePattern: /smartworks/i,
  },
  {
    searchQuery: 'Regus coworking Bangalore',
    industry: 'Services', category: 'Co-working', type: 'Co-working',
    namePattern: /\bregus\b/i,
  },
  {
    searchQuery: '315 Work Avenue coworking Bangalore',
    industry: 'Services', category: 'Co-working', type: 'Co-working',
    namePattern: /315\s*work\s*avenue/i,
  },
  // ── Telecom Retail ────────────────────────────────────────────────────────
  {
    searchQuery: 'Airtel store Bangalore',
    industry: 'Services', category: 'Telecom', type: 'Telecom',
    namePattern: /airtel\s*(store|xpress|outlet)/i,
  },
  {
    searchQuery: 'Jio Point store Bangalore',
    industry: 'Services', category: 'Telecom', type: 'Telecom',
    namePattern: /jio\s*(point|store|mart)/i,
  },
  // ── Salon — additional ────────────────────────────────────────────────────
  {
    searchQuery: 'Jean Claude Biguine salon Bangalore',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /jean.?claude\s*biguine|jcb\s*salon/i,
  },
  {
    searchQuery: 'Looks Salon Bangalore',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /looks\s*salon/i,
  },
  {
    searchQuery: 'Studio 11 salon Bangalore',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /studio\s*11/i,
  },
  // ── F&B — Tea / Chai Cafes (missing tier) ────────────────────────────────
  {
    searchQuery: 'Infinitea tea cafe Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /infinitea/i,
  },
  {
    searchQuery: 'Chai Point Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /chai\s*point/i,
  },
  {
    searchQuery: 'Tea Villa Cafe Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /tea\s*villa/i,
  },
  {
    searchQuery: 'Brewbird cafe Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /brewbird/i,
  },
  // ── F&B — Artisan Bakeries (missing tier) ────────────────────────────────
  {
    searchQuery: 'Zed the Baker Bangalore',
    industry: 'F&B', category: 'Bakery', type: 'Bakery',
    namePattern: /zed\s*the\s*baker/i,
  },
  {
    searchQuery: 'Huckleberry cafe bakery Bangalore',
    industry: 'F&B', category: 'Bakery', type: 'Bakery',
    namePattern: /huckleberry/i,
  },
  {
    searchQuery: 'Baked by Messy Bangalore',
    industry: 'F&B', category: 'Bakery', type: 'Bakery',
    namePattern: /baked\s*by\s*messy|\bbaked\b.*koramangala/i,
  },
  {
    searchQuery: 'Brown Sugar bakery Bangalore',
    industry: 'F&B', category: 'Bakery', type: 'Bakery',
    namePattern: /brown\s*sugar\s*bakery/i,
  },
  {
    searchQuery: 'Butter bakery cafe Bangalore',
    industry: 'F&B', category: 'Bakery', type: 'Bakery',
    namePattern: /\bbutter\b.*bakery|\bbutter\b.*cafe/i,
  },
  {
    searchQuery: 'Chez Nous patisserie Bangalore',
    industry: 'F&B', category: 'Bakery', type: 'Bakery',
    namePattern: /chez\s*nous/i,
  },
  // ── F&B — South Indian dining chains (Nagarjuna, Nandini tier) ──────────
  {
    searchQuery: 'Nagarjuna restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /nagarjuna/i,
  },
  {
    searchQuery: 'Nandini Deluxe restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /nandini\s*deluxe/i,
  },
  {
    searchQuery: 'Nandana Palace restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /nandana\s*palace/i,
  },
  {
    searchQuery: 'Shivaji Military Hotel Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /shivaji\s*military/i,
  },
  {
    searchQuery: 'Janatha Hotel Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /janatha\s*hotel/i,
  },
  {
    searchQuery: 'Sukh Sagar restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /sukh\s*sagar/i,
  },
  {
    searchQuery: 'Kamat restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bkamat\b/i,
  },
  {
    searchQuery: 'Sagar Ratna restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /sagar\s*ratna/i,
  },
  // ── F&B — Biryani chains (Meghana tier) ──────────────────────────────────
  {
    searchQuery: 'Paradise Biryani Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /paradise\s*biryani/i,
  },
  {
    searchQuery: 'Bawarchi Biryani Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bbawarchi\b/i,
  },
  {
    searchQuery: 'Hyderabad Biryani House Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /hyderabad\s*biryani\s*house/i,
  },
  {
    searchQuery: 'Ammi\'s Biryani Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /ammi.?s\s*biryani/i,
  },
  {
    searchQuery: 'Zaiqa Biryani Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bzaiqa\b/i,
  },
  // ── F&B — Rebel Foods / Box8 cloud kitchen brands ────────────────────────
  // Box8 & Behrouz Biryani already in script
  {
    searchQuery: 'Ovenstory Pizza Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /ovenstory/i,
  },
  {
    searchQuery: 'Sweet Truth cake dessert Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /sweet\s*truth/i,
  },
  {
    searchQuery: 'Mandarin Oak restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /mandarin\s*oak/i,
  },
  {
    searchQuery: "Hong's Kitchen Bangalore",
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /hong.?s\s*kitchen/i,
  },
  {
    searchQuery: "Wendy's burger Bangalore",
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /wendy.?s/i,
  },
  // ── Wellness — Cult Sport activewear retail ───────────────────────────────
  {
    searchQuery: 'Cult Sport activewear store Bangalore',
    industry: 'Retail', category: 'Sports Retail', type: 'Sports Retail',
    namePattern: /cult\s*sport/i,
  },
  // ── Wellness — CureFit / Care.fit clinics ────────────────────────────────
  {
    searchQuery: 'Care.fit health clinic Bangalore',
    industry: 'Wellness', category: 'Healthcare', type: 'Healthcare',
    namePattern: /care\.?fit/i,
  },
  // ── F&B — Indian Cuisine Chains ──────────────────────────────────────────
  {
    searchQuery: 'London Curry House Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /london\s*curry\s*house/i,
  },
  {
    searchQuery: 'Copper Chimney restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /copper\s*chimney/i,
  },
  {
    searchQuery: 'Rajdhani thali restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /rajdhani/i,
  },
  {
    searchQuery: 'Chutneys restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bchutneys\b/i,
  },
  {
    searchQuery: 'Malgudi restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bmalgudi\b/i,
  },
  // ── F&B — Middle Eastern / Turkish / Kebab ────────────────────────────────
  {
    searchQuery: 'Kebabci Turkish restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /kebabci/i,
  },
  {
    searchQuery: 'Shawarma Bros Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /shawarma\s*bros/i,
  },
  {
    searchQuery: 'Al Khayam restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /al\s*khayam/i,
  },
  {
    searchQuery: 'Zaffran Indian restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bzaffran\b/i,
  },
  // ── F&B — Chinese / Asian chains ─────────────────────────────────────────
  {
    searchQuery: 'Mainland China restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /mainland\s*china/i,
  },
  {
    searchQuery: 'China Garden restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /china\s*garden/i,
  },
  // ── F&B — International QSR / Casual (missing chains) ────────────────────
  {
    searchQuery: 'Popeyes chicken Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /popeyes/i,
  },
  {
    searchQuery: 'Krispy Kreme Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /krispy\s*kreme/i,
  },
  {
    searchQuery: "Chili's restaurant Bangalore",
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /chili.?s\s*grill|chili.?s\s*restaurant/i,
  },
  {
    searchQuery: "Nando's restaurant Bangalore",
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /nando.?s/i,
  },
  {
    searchQuery: 'Habanero Mexican restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /habanero/i,
  },
  // ── F&B — Bars / Pubs (additional) ───────────────────────────────────────
  {
    searchQuery: 'The Irish House Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /irish\s*house/i,
  },
  {
    searchQuery: 'Hammered bar Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /\bhammered\b/i,
  },
  {
    searchQuery: 'Tao Terraces rooftop Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /tao\s*terraces/i,
  },
  {
    searchQuery: 'The Flying Elephant bar Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /flying\s*elephant/i,
  },
  {
    searchQuery: 'Sunny\'s restaurant bar Bangalore',
    industry: 'F&B', category: 'Bar', type: 'Bar',
    namePattern: /sunny.?s\s*(restaurant|bar)/i,
  },
  // ── F&B — Dessert (additional) ────────────────────────────────────────────
  {
    searchQuery: 'Pabrai ice cream Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /pabrai/i,
  },
  {
    searchQuery: "Giani's ice cream Bangalore",
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /giani.?s/i,
  },
  {
    searchQuery: 'Arun Ice Cream Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /arun\s*ice\s*cream/i,
  },
  {
    searchQuery: 'Apsara ice cream Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /apsara\s*ice\s*cream/i,
  },
  // ── Retail — Indian Ethnic / Occasion Wear ────────────────────────────────
  {
    searchQuery: 'Manyavar store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /manyavar/i,
  },
  {
    searchQuery: 'Mohey store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bmohey\b/i,
  },
  {
    searchQuery: 'Soch clothing store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bsoch\b/i,
  },
  {
    searchQuery: 'Aurelia fashion store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\baurelia\b/i,
  },
  {
    searchQuery: 'House of Masaba Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /house\s*of\s*masaba/i,
  },
  {
    searchQuery: 'Nalli silks sarees Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bnalli\b/i,
  },
  {
    searchQuery: 'Kanchipuram Kamakshi silks Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /kanchipuram.*silks|kamakshi\s*silks/i,
  },
  // ── Retail — Men's Contemporary (Snitch, Bear House tier) ─────────────────
  {
    searchQuery: 'Snitch clothing store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bsnitch\b/i,
  },
  {
    searchQuery: 'The Bear House store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /bear\s*house/i,
  },
  {
    searchQuery: 'Bombay Shirt Company Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /bombay\s*shirt\s*company/i,
  },
  {
    searchQuery: 'Rare Rabbit store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /rare\s*rabbit/i,
  },
  {
    searchQuery: 'WROGN store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bwrogn\b/i,
  },
  // ── Retail — Lifestyle / Premium ──────────────────────────────────────────
  {
    searchQuery: 'Good Earth store Bangalore',
    industry: 'Retail', category: 'Lifestyle', type: 'Lifestyle',
    namePattern: /good\s*earth/i,
  },
  {
    searchQuery: 'Nicobar store Bangalore',
    industry: 'Retail', category: 'Lifestyle', type: 'Lifestyle',
    namePattern: /\bnicobar\b/i,
  },
  {
    searchQuery: 'Chumbak store Bangalore',
    industry: 'Retail', category: 'Lifestyle', type: 'Lifestyle',
    namePattern: /\bchumbak\b/i,
  },
  // ── Retail — Leather Goods / Bags ─────────────────────────────────────────
  {
    searchQuery: 'Hidesign store Bangalore',
    industry: 'Retail', category: 'Accessories', type: 'Accessories',
    namePattern: /hidesign/i,
  },
  {
    searchQuery: 'Da Milano store Bangalore',
    industry: 'Retail', category: 'Accessories', type: 'Accessories',
    namePattern: /da\s*milano/i,
  },
  {
    searchQuery: 'Baggit store Bangalore',
    industry: 'Retail', category: 'Accessories', type: 'Accessories',
    namePattern: /\bbaggit\b/i,
  },
  // ── Wellness — Salon (premium tier) ──────────────────────────────────────
  {
    searchQuery: 'Toni and Guy salon Bangalore',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /toni\s*(&|and)\s*guy/i,
  },
  {
    searchQuery: 'Monsoon Salon Bangalore',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /monsoon\s*salon/i,
  },
  {
    searchQuery: 'Green Trends salon Bangalore',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /green\s*trends/i,
  },
  {
    searchQuery: 'Juice Salon Bangalore',
    industry: 'Wellness', category: 'Salon', type: 'Salon',
    namePattern: /juice\s*salon/i,
  },
  // ── Retail — Optical (additional) ────────────────────────────────────────
  {
    searchQuery: 'Lawrence and Mayo optician Bangalore',
    industry: 'Retail', category: 'Eyewear', type: 'Eyewear',
    namePattern: /lawrence\s*(&|and)\s*mayo/i,
  },
  // ── F&B — Indie Cafes & Delis ─────────────────────────────────────────────
  {
    searchQuery: 'Big Bean Cafe Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /big\s*bean\s*cafe/i,
  },
  {
    searchQuery: 'Roma Deli Bangalore',
    industry: 'F&B', category: 'Cafe', type: 'Cafe',
    namePattern: /roma\s*deli/i,
  },
  {
    searchQuery: 'Harvest restaurant Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bharvest\b/i,
  },
  // ── F&B — Mexican (Maiz tier) ─────────────────────────────────────────────
  {
    searchQuery: 'Maiz Mexican Kitchen Bangalore',
    industry: 'F&B', category: 'Casual Dining', type: 'Casual Dining',
    namePattern: /\bmaiz\b/i,
  },
  // ── Retail — Fan Merchandise / Pop Culture / Streetwear ──────────────────
  {
    searchQuery: 'The Souled Store Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /souled\s*store/i,
  },
  {
    searchQuery: 'OWND streetwear Bangalore',
    industry: 'Retail', category: 'Apparel', type: 'Apparel',
    namePattern: /\bownd\b/i,
  },
  // ── F&B — Dessert / Milkshakes (missing tier) ─────────────────────────────
  {
    searchQuery: 'Belgian Waffle Co Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /belgian\s*waffle/i,
  },
  {
    searchQuery: 'Keventers milkshake Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /keventers/i,
  },
  {
    searchQuery: 'LICK Lavonne ice cream kitchen Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /\blick\b.*lavonne|lavonne.*\blick\b|\blick\s*ice\s*cream/i,
  },
  {
    searchQuery: 'Frozen Bottle dessert Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /frozen\s*bottle/i,
  },
  {
    searchQuery: 'Smoor chocolates Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /\bsmoor\b/i,
  },
  {
    searchQuery: 'Cinnabon bakery Bangalore',
    industry: 'F&B', category: 'Bakery', type: 'Bakery',
    namePattern: /cinnabon/i,
  },
  {
    searchQuery: 'Yogurt Bay Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /yogurt\s*bay/i,
  },
  // ── F&B — Mexican / Global QSR (missing tier) ─────────────────────────────
  {
    searchQuery: 'California Burrito Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /california\s*burrito/i,
  },
  {
    searchQuery: 'Burrito Box Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /burrito\s*box/i,
  },
  {
    searchQuery: 'Wok to Walk Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /wok\s*to\s*walk/i,
  },
  {
    searchQuery: 'Box8 restaurant Bangalore',
    industry: 'F&B', category: 'QSR', type: 'QSR',
    namePattern: /\bbox8\b/i,
  },
  {
    searchQuery: 'Menchies frozen yogurt Bangalore',
    industry: 'F&B', category: 'Dessert', type: 'Dessert',
    namePattern: /menchies/i,
  },
]

// ── Google Places Text Search ─────────────────────────────────────────────────
type TextSearchResult = {
  place_id: string
  name: string
  formatted_address: string
  types: string[]
  geometry: { location: { lat: number; lng: number } }
  rating?: number
  user_ratings_total?: number
  price_level?: number
  business_status?: string
}

type TextSearchResponse = {
  status: string
  results: TextSearchResult[]
  next_page_token?: string
  error_message?: string
}

async function textSearch(
  query: string,
  lat: number,
  lng: number,
  pageToken?: string
): Promise<TextSearchResponse> {
  const url = pageToken
    ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${MAPS_KEY}`
    : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=3000&key=${MAPS_KEY}`

  const res = await fetch(url)
  return res.json() as Promise<TextSearchResponse>
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

function slugId(name: string, lat: number, lng: number): string {
  const s = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30)
  return `gpl-${s}-${Math.round(lat * 1000)}-${Math.round(lng * 1000)}`
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🎯  Targeted brand scraper  ${dryRun ? '(DRY RUN)' : ''}`)
  console.log(`   ${BRANDS.length} brands × ${ZONES.length} zones = ${BRANDS.length * ZONES.length} searches\n`)

  // Load ALL existing IDs (Supabase returns max 1000 per call — paginate)
  const existingIds = new Set<string>()
  let from = 0
  const PAGE_SIZE = 1000
  while (true) {
    const { data: batch, error: fetchErr } = await supabase
      .from('bangalore_brand_outlets')
      .select('id')
      .range(from, from + PAGE_SIZE - 1)

    if (fetchErr) {
      console.error('❌  Failed to load existing outlets:', fetchErr.message)
      process.exit(1)
    }
    if (!batch || batch.length === 0) break
    batch.forEach((r: { id: string }) => existingIds.add(r.id))
    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  console.log(`   Existing outlets in DB: ${existingIds.size}\n`)

  // Resume support
  const doneSet = new Set<string>()
  if (resume && existsSync(donePath)) {
    readFileSync(donePath, 'utf8').split('\n').filter(Boolean).forEach((l) => doneSet.add(l))
    console.log(`   Resuming — ${doneSet.size} combos already done\n`)
  }

  let totalInserted = 0, totalSkipped = 0, totalSearches = 0, totalFiltered = 0
  const insertedByBrand: Record<string, number> = {}

  for (const brand of BRANDS) {
    for (const zone of ZONES) {
      const key = `${brand.searchQuery}::${zone.name}`
      if (doneSet.has(key)) { totalSearches++; continue }

      const label = `${brand.searchQuery.padEnd(32)} @ ${zone.name.padEnd(18)}`
      process.stdout.write(`  🔍 ${label} `)

      let pageToken: string | undefined
      let pageCount = 0
      let zoneInserted = 0

      do {
        if (pageToken) await sleep(2100)

        let data: TextSearchResponse
        try {
          data = await textSearch(brand.searchQuery, zone.lat, zone.lng, pageToken)
        } catch (e) {
          console.log(`fetch error: ${e}`)
          break
        }

        if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT') {
          console.error(`\n❌  API blocked: ${data.status} — ${data.error_message}`)
          process.exit(1)
        }

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          console.log(`status: ${data.status}`)
          break
        }

        for (const place of data.results) {
          if (place.business_status === 'CLOSED_PERMANENTLY') continue

          const { lat: pLat, lng: pLng } = place.geometry.location

          // Must be within Bangalore
          if (!inBangalore(pLat, pLng)) { totalFiltered++; continue }

          // Must match the brand's name pattern (avoid false positives from text search)
          if (!brand.namePattern.test(place.name)) { totalFiltered++; continue }

          const id = slugId(place.name, pLat, pLng)
          if (existingIds.has(id)) { totalSkipped++; continue }

          // Parse locality from formatted_address
          const addrParts = place.formatted_address.split(',').map((s: string) => s.trim())
          const locality = addrParts.length >= 3
            ? addrParts[addrParts.length - 3]
            : addrParts[0]

          if (!dryRun) {
            const { error } = await supabase.from('bangalore_brand_outlets').insert({
              id,
              brand_name: place.name,
              industry: brand.industry,
              category: brand.category,
              type: brand.type,
              street_address: place.formatted_address,
              locality,
              zone: zone.zone,
              lat: pLat,
              lng: pLng,
              is_active: true,
              data_source: 'google_places_text',
              data_confidence: place.user_ratings_total && place.user_ratings_total > 50 ? 'high' : 'medium',
            })

            if (!error) {
              existingIds.add(id)
              zoneInserted++
              totalInserted++
              insertedByBrand[brand.searchQuery] = (insertedByBrand[brand.searchQuery] ?? 0) + 1
            } else if (error.code !== '23505') {
              // Ignore unique-constraint violations (same place found in overlapping zones)
              process.stdout.write(`\n    ⚠️  [${place.name}]: ${error.message}\n`)
            }
          } else {
            existingIds.add(id)
            zoneInserted++
            totalInserted++
            insertedByBrand[brand.searchQuery] = (insertedByBrand[brand.searchQuery] ?? 0) + 1
          }
        }

        pageToken = data.next_page_token
        pageCount++
        await sleep(150)
      } while (pageToken && pageCount < 3)

      console.log(`+${zoneInserted}`)
      totalSearches++

      if (!dryRun) appendFileSync(donePath, key + '\n')
      await sleep(120)
    }
  }

  // Save stats
  const stats = {
    totalInserted,
    totalSkipped,
    totalFiltered,
    totalSearches,
    byBrand: insertedByBrand,
    timestamp: new Date().toISOString(),
  }
  writeFileSync(statsPath, JSON.stringify(stats, null, 2))

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`🔍  Searches run : ${totalSearches}`)
  console.log(`➕  Inserted     : ${totalInserted} new outlets`)
  console.log(`⏭  Skipped      : ${totalSkipped} (already in DB by slug)`)
  console.log(`🚫  Filtered     : ${totalFiltered} (outside BLR / wrong brand)`)

  if (dryRun) console.log(`\n⚠️   Dry run — no DB writes`)

  if (Object.keys(insertedByBrand).length > 0) {
    console.log(`\n📊  Inserted by brand:`)
    Object.entries(insertedByBrand)
      .sort((a, b) => b[1] - a[1])
      .forEach(([brand, count]) => {
        console.log(`    ${brand.padEnd(40)} ${count}`)
      })
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
