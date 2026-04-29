import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export type ZoneCategory = { category: string; count: number }
export type ZoneData = {
  zone: string
  totalOutlets: number
  totalBrands: number
  categories: ZoneCategory[]
  topBrands: string[]
  brandsByCategory: Record<string, string[]>
}
export type ZonesResponse = {
  zones: ZoneData[]
  totalOutlets: number
  totalBrands: number
  totalZones: number
}

const EMPTY: ZonesResponse = { zones: [], totalOutlets: 0, totalBrands: 0, totalZones: 0 }

// ── Category normalization ────────────────────────────────────────────────────
// Folds the 200+ sub-categories from targeted scrapes into the 15 canonical
// display categories that match the UI filter chips.
function normalizeCategory(raw: string | null): string {
  if (!raw) return 'Other'
  const r = raw.toLowerCase()

  if (r.includes('qsr') || r === 'fast food') return 'QSR'
  if (r.includes('microbrewery') || r.includes('gastropub') || r.includes('pub') ||
      r.includes('brewery') || r === 'bar' || r.includes('cocktail bar') ||
      r.includes('lounge bar') || r.includes('rooftop bar') || r.includes('beer bar') ||
      r.includes('sports bar') || r.includes('music bar') || r.includes('rock bar') ||
      r.includes('pub & bar') || r.includes('bar/restaurant')) return 'Bar & Brewery'
  if (r.includes('specialty coffee') || r.includes('coffee chain') || r.includes('tea cafe') ||
      r.includes('tea chain') || r.includes('french cafe') || r.includes('art cafe') ||
      r.includes('all-day cafe') || r.includes('south indian cafe') ||
      r.includes('café-bar') || r.includes('bakery/cafe') || r.includes('cafe/casual') ||
      r.includes('cafe-restaurant') || r === 'cafe') return 'Cafe'
  if (r.includes('bakery') || r.includes('patisserie')) return 'Bakery'
  if (r.includes('ice cream') || r.includes('dessert') || r.includes('waffle') ||
      r.includes('milkshake') || r.includes('milkshake') || r.includes('donut') ||
      r.includes('traditional indian sweets') || r.includes('indian sweets') ||
      r.includes('chocolatier') || r.includes('smoothie')) return 'Dessert'
  if (r === 'restaurant' || r.includes('dining') || r.includes('biryani') ||
      r.includes('south indian') || r.includes('north indian') || r.includes('multi-cuisine') ||
      r.includes('burmese') || r.includes('italian') || r.includes('japanese') ||
      r.includes('asian') || r.includes('korean') || r.includes('mexican') ||
      r.includes('mediterranean') || r.includes('european') || r.includes('american diner') ||
      r.includes('mughlai') || r.includes('thali') || r.includes('canteen') ||
      r.includes('pan-asian') || r.includes('live grill') || r.includes('vietnamese') ||
      r.includes('andhra')) return 'Restaurant'
  if (r.includes('spa') && !r.includes('salon')) return 'Spa'
  // Beauty & cosmetics retail (Sephora, Nykaa, MAC etc.) — must come before Salon
  // because the DB tag 'Beauty' would otherwise fall through to 'Salon's beauty rule.
  if (r === 'beauty' || r.includes('cosmetics') || r.includes('home fragrance') ||
      r.includes('skin care')) return 'Beauty'
  if (r.includes('salon') || r.includes('beauty') || r.includes('nail') ||
      r.includes('slimming') || r.includes('grooming')) return 'Salon'
  if (r.includes('gym') || r.includes('fitness') || r.includes('crossfit') ||
      r.includes('yoga') || r.includes('pilates')) return 'Gym'
  // Sports retail — Decathlon, Wildcraft etc.
  if (r.includes('sports retail') || r.includes('sports multi-brand') ||
      r.includes('outdoor sports') || r === 'sports') return 'Sports'
  // Kids / baby / toys retail — FirstCry, Mothercare, Hamleys
  if (r === 'kids' || r.includes('baby & kids') || r.includes('kids retail') ||
      r.includes('toy ') || r === 'toys' || r.includes('kids store')) return 'Kids'
  // Home & furniture retail — IKEA, Pepperfry, HomeStop
  if (r.includes('furniture') || r.includes('home decor') || r.includes('homeware') ||
      r.includes('home retail') || r === 'home' || r.includes('home & living') ||
      r.includes('mattress')) return 'Home'
  if (r.includes('pharmacy') || r.includes('medical store') || r.includes('beauty & pharmacy')) return 'Pharmacy'
  if (r.includes('supermarket') || r.includes('hypermarket') || r.includes('grocery') ||
      r.includes('fresh') && r.includes('f&b') || r === 'grocery' ||
      r.includes('neighbourhood grocery') || r.includes('convenience grocery') ||
      r.includes('premium grocery') || r.includes('organic food retail')) return 'Supermarket'
  if (r.includes('cinema') || r.includes('multiplex')) return 'Cinema'
  if (r.includes('electronics') || r.includes('telecom retail') ||
      r.includes('mobile & smart') || r.includes('camera')) return 'Electronics'
  // Order matters: Eyewear and Footwear must be checked BEFORE Apparel because
  // 'eyewear' / 'footwear' / 'sportswear' / 'innerwear' all contain 'wear'.
  if (r.includes('eyewear') || r.includes('optical') || r.includes('sunglasses') ||
      r.includes('prescription eyewear')) return 'Eyewear'
  if (r.includes('footwear') || r.includes('shoe') || r.includes('sneaker') ||
      r.includes('sandal')) return 'Footwear'
  if (r.includes('jewel') || r.includes('diamond') || (r.includes('gold') && r.includes('jewel'))) return 'Jewellery'
  if (r.includes('apparel') || r.includes('fashion') || r.includes('clothing') ||
      r.includes('denim') || r.includes('ethnic') || r.includes('lingerie') ||
      r.includes('innerwear') || r.includes('sportswear') || r.includes('saree') ||
      r.includes('silk') || r.includes('formal') || r.includes('casual apparel') ||
      r.includes('youth casual') || r.includes('wear')) return 'Apparel'

  return raw
}

// ── Brand quality filter ──────────────────────────────────────────────────────
const BAD_BRAND_PATTERNS = [
  /\boutcall\b/i,
  /\bout[\s-]call\b/i,
  /\bhome\s*(massage|spa|beauty|service|visit|facial|wax)/i,
  /\bat[\s-]home\b/i,
  /\bmobile\s*(spa|salon|massage|beauty)/i,
  /\bdoorstep\b/i,
]
const BAD_BRAND_NAMES = new Set([
  'iyengar bakery', 'sri iyengar bakery', 'vinayaka hot chips',
  'arun kumar', 'home delivery',
])
function isBadBrand(name: string): boolean {
  const lower = name.toLowerCase().trim()
  if (BAD_BRAND_NAMES.has(lower)) return true
  if (BAD_BRAND_PATTERNS.some(re => re.test(name))) return true
  return false
}

// ── Anchor / premium brands ───────────────────────────────────────────────────
// National chains + strong Bangalore regional players.
// These are surfaced first in brand lists — a landlord / tenant would name-drop
// any of these as proof of a zone's commercial quality.
const ANCHOR_BRANDS_LOWER = new Set([
  // QSR & Fast Food
  "mcdonald's", "mcdonalds", "kfc", "domino's", "dominos", "pizza hut",
  "burger king", "subway", "taco bell", "wendy's", "carl's jr.", "chicking",
  "wow momo", "chaayos", "chai point", "la pino'z pizza", "gopizza",
  "haldiram's", "barbeque nation", "paradise biryani", "biryani blues",
  "behrouz biryani", "box8", "faasos", "oven story", "the good bowl",
  "freshmenu", "captain egg", "bento", "auntie anne's", "cinnabon",
  "chinese wok", "a2b (adyar ananda bhavan)", "a2b", "adyar ananda bhavan",
  "hotel saravana bhavan", "saravana bhavan",
  // Cafe & Coffee
  "starbucks", "cafe coffee day", "ccd", "barista", "third wave coffee",
  "blue tokai", "matteo coffea", "dyu art cafe", "hatti kaapi",
  "dunkin'", "dunkin", "krispy kreme", "mcafe", "mccafe",
  // Bangalore restaurants & regional
  "mtr", "vidyarthi bhavan", "brahmin's coffee bar", "nagarjuna",
  "nandhini", "meghana foods", "truffles", "hotel empire", "shree sagar",
  "udupi palace", "corner house", "maiyas", "koshy's", "the fatty bao",
  "five star chicken", "dindigul thalappakatti",
  "smoke house deli", "monkey bar",
  "bangalore oota company", "the only place",
  // Premium fine-dining / casual — local and international
  "karavalli", "olive beach", "caperberry", "punjab grill",
  "farzi cafe", "sanchez", "sriracha", "misu", "naru noodle bar",
  "1131 bar + kitchen", "loft 38",
  "toscano", "jamie's pizzeria",
  // Cafes — Bangalore local legends + premium local players
  "katte kulture", "kahale - filter kaapi bar", "kahale",
  "ground up coffee", "kinya coffee",
  "isobel coffee house", "isobel",
  "subko", "subko coffee", "ajji house by subko",
  "glen's bake house", "glen's bakehouse", "glens bakehouse",
  "maverick & farmer coffee", "maverick & farmer", "maverick farmer coffee",
  "lavonne", "lavonne café", "lavonne cafe", "lavonne cake studio",
  "bun maska", "bun maskaa cafe", "bun maska cafe",
  "cafe noir", "café noir",
  "cafe azzure",
  "dialogues cafe", "dialogues cafe koramangala",
  "tom's restaurant", "tom's bakery",
  "matteo coffea", "dyu art cafe",
  "the hole in the wall cafe", "hole in the wall cafe",
  "chutney chang", "sunny's restaurant", "cafe max",
  "savora", "the indian coffee house",
  // Bars & Breweries
  "toit", "byg brewski", "arbor brewing", "biere club", "windmills craftworks",
  "bengaluru brewing company", "sotally tober",
  "prost brewpub", "prost", "hammered", "plan b",
  // Bakery & Desserts
  "the sweet chariot", "theobroma", "l'opera", "daily bread",
  "belgian waffle", "belgian waffle factory", "frozen bottle", "keventers",
  "mad over donuts", "go nuts", "la folie",
  "amore gelato", "amore gelato cafe", "gelato italiano", "naturals ice cream",
  // Fitness
  "cult.fit", "cult fit", "gold's gym", "anytime fitness", "snap fitness",
  "talwalkars", "fitness first", "powerhouse gym",
  // Salon & Beauty
  "naturals", "lakme salon", "enrich salon", "enrich", "vlcc",
  "jean-claude biguine", "jcb", "green trends", "toni & guy",
  "wella", "o2 spa", "four fountains spa", "tattva spa",
  "bodycraft salon", "bodycraft", "looks salon",
  "essensuals by toni&guy", "essensuals",
  // Apparel — national
  "zara", "h&m", "mango", "westside", "lifestyle", "max fashion", "max",
  "fabindia", "nicobar", "nicobar design studio", "bombay shirt company",
  "manyavar", "allen solly", "van heusen", "peter england",
  "arrow", "raymond", "louis philippe", "w for woman", "w", "biba",
  "fabally", "shoppers stop", "marks & spencer", "uniqlo", "levi's", "levis",
  "lee", "wrangler", "pepe jeans", "tommy hilfiger", "calvin klein",
  "us polo", "us polo assn.", "flying machine", "pantaloons", "only",
  "vero moda", "jack & jones", "forever 21", "f21",
  // Footwear
  "bata", "nike", "adidas", "puma", "reebok", "skechers", "metro shoes",
  "woodland", "mochi", "new balance", "hush puppies", "clarks", "liberty",
  "red tape", "fila", "converse", "vans",
  // Electronics & Telecom
  "apple", "samsung", "reliance digital", "croma", "vijay sales",
  "oneplus", "mi store", "xiaomi", "lg", "sony", "bose", "jio",
  // Jewellery
  "tanishq", "malabar gold", "malabar gold & diamonds", "kalyan jewellers",
  "joyalukkas", "caratlane", "pc jeweller", "senco gold", "orra",
  "png jewellers", "grt jewellers",
  // Supermarket & Grocery
  "d-mart", "dmart", "reliance fresh", "more", "spar", "lulu hypermarket",
  "lulu", "nature's basket", "star market", "big bazaar", "hypercity",
  // Pharmacy
  "apollo pharmacy", "medplus", "wellness forever", "frank ross",
  "guardian pharmacy",
  // Cinema
  "pvr", "inox", "cinepolis", "miraj cinemas",
  // Books
  "crossword", "higginbothams", "blossom book house", "blossoms",
  // Eyewear
  "lenskart", "titan eyeplus", "specsmakers", "vision express",
])

function isAnchorBrand(name: string): boolean {
  return ANCHOR_BRANDS_LOWER.has(name.toLowerCase().trim())
}

// ── Category-specific blocklists ─────────────────────────────────────────────
// Safety net: even if bad data survives the DB cleanup, it won't reach the UI.
const CINEMA_BLOCK: RegExp[] = [
  /private\s*(theatre|theater|screen)/i,
  /home\s*(theatre|theater|cinema)/i,
  /hometheatre|home\s*automation/i,
  /production\s*(company|studio|house)/i,
  /acting\s*(class|institute|school)|film\s*institute/i,
  /av\s*solution|audio\s*visual/i,
  /party\s*hall/i,
  /ticket\s*counter|refreshment/i,
  /preview\s*theater|screening\s*room/i,
  /micro\s*theatre|miniplex/i,
]
const APPAREL_BLOCK: RegExp[] = [
  /\btailor(s|ing|ed)?\b/i,
  /\bstitching\b|\balteration/i,
  /\bdry\s*clean|\blaundry\b/i,
  /\buniform\b/i,
  /\btextiles\b|\bfabrics?\b/i,
  /\bcobbler\b|shoe\s*repair|chappal\s*repair/i,
  /\bwholesale\b|\bdistributor\b|\bmanufactur/i,
  /pvt\.?\s*(ltd|limited)/i,
]
const ELECTRONICS_BLOCK: RegExp[] = [
  /repair\s*(shop|service|center|centre)/i,
  /service\s*(center|centre)/i,
  /authoris[e]?d\s*service|authorized\s*service/i,
  /\bspare\s*parts?\b/i,
  /second\s*hand|used\s*(phone|laptop|camera|mobile)/i,
  /camera\s*rental|dslr\s*rental|lens\s*rental/i,
  /buy.*sell.*repair|sell\s*used/i,
  /\btrading\s*(co|corp)\b/i,
  /pvt\.?\s*(ltd|limited)/i,
]
const GYM_BLOCK: RegExp[] = [
  /nutrition\s*(club|cent(er|re))/i,
  /\bherbalife\b/i,
  /supplement\s*store/i,
  /\bphysiotherap/i,
  /physio\s*(clinic|center|centre|meet)/i,
  /ayurveda.*clinic|ayurveda.*hospital|nature\s*cure\s*hospital/i,
  /treadmill\s*repair|equipment\s*suppl/i,
]
const SALON_BLOCK: RegExp[] = [
  /hair\s*transplant/i,
  /multispecialit/i,
  /orthopaedic|general\s*medicine|\bxray\b|patholog/i,
]
const RESTAURANT_BLOCK: RegExp[] = [
  /\bmess\b/i,
  /tiffin\s*(cent(er|re)|adda|service)/i,
  /cloud\s*kitchen/i,
  /home\s*kitchen|home\s*food|home\s*cooked|ghar\s*ki\s*rasoi/i,
  /catering\s*(only|service|company)/i,
]
const BAKERY_BLOCK: RegExp[] = [
  /cloud\s*kitchen/i,
  /home\s*made|home-made|made\s*to\s*order/i,
  /\benterprises\b/i,
  /pvt\.?\s*(ltd|limited)/i,
]
const CAFE_BLOCK: RegExp[] = [
  /fresh\s*['n]*\s*ground/i,           // CCD vending machines
  /vending\s*machine|coffee\s*vending/i,
  /coffee\s*(machine|dispens|cart|kiosk|point|counter)/i,
  /tea\s*(stall|cart)/i,
  /\bkiosk\b/i,
  /corporate\s*vending|kaapi\s*solutions/i,
  /\bcatering\b/i,
  /\benterprises\b/i,
  /pvt\.?\s*(ltd|limited)/i,
]

// ── Brand-level category overrides ───────────────────────────────────────────
// Some brands get mis-tagged by Google Places (e.g., Domino's showing up as
// "cafe" or "restaurant" type). Override the DB category for known chains.
const QSR_FORCE_BRANDS_LOWER = new Set([
  "domino's", "dominos", "kfc", "mcdonald's", "mcdonalds", "pizza hut",
  "burger king", "subway", "taco bell", "wendy's", "carl's jr.", "chicking",
  "wow momo", "la pino'z pizza", "gopizza", "chinese wok", "captain egg",
  "auntie anne's", "cinnabon", "bento", "bento (japanese qsr)", "boba bhai",
  "khan saheb", "haldiram's", "haldirams", "dunkin'", "dunkin",
  "krispy kreme", "mad over donuts",
])

// ── Brand-name → category force rules ───────────────────────────────────────
// Google Places mis-tags brands routinely (e.g., 'Naturals Ice Cream' tagged
// as 'Salon'; 'Apollo Pharmacy' tagged as 'Apparel'; 'Bata Shoe Store' tagged
// as 'Apparel'). When a brand-name pattern matches one of these rules the
// category is forced regardless of the DB tag — this is a safety net that
// survives future scrapes too.
// Order matters: more specific rules first.
type ForceRule = { pattern: RegExp; category: string }
const BRAND_FORCE_RULES: ForceRule[] = [
  // ── Dessert (must come before Salon — 'Naturals Ice Cream' contains 'Naturals') ──
  { pattern: /naturals\s*ice\s*cream/i,                 category: 'Dessert' },
  { pattern: /thanco.?s.*ice\s*cream/i,                 category: 'Dessert' },
  { pattern: /amul\s*ice\s*cream/i,                     category: 'Dessert' },
  { pattern: /milano\s*ice\s*cream/i,                   category: 'Dessert' },
  { pattern: /ananda\s*ice\s*cream/i,                   category: 'Dessert' },
  { pattern: /apsara\s*ice\s*cream/i,                   category: 'Dessert' },
  { pattern: /pabrai.?s.*ice\s*cream/i,                 category: 'Dessert' },
  { pattern: /polar\s*bear.*ice\s*cream/i,              category: 'Dessert' },
  { pattern: /amadora.*ice\s*cream/i,                   category: 'Dessert' },
  { pattern: /baskin\s*robbins/i,                       category: 'Dessert' },
  { pattern: /amore\s*gelato/i,                         category: 'Dessert' },
  { pattern: /^gelato\s*italiano/i,                     category: 'Dessert' },
  { pattern: /frozen\s*bottle/i,                        category: 'Dessert' },
  { pattern: /belgian\s*waffle/i,                       category: 'Dessert' },
  { pattern: /^keventers\b/i,                           category: 'Dessert' },
  { pattern: /corner\s*house(?!\s*caf)/i,               category: 'Dessert' },
  { pattern: /sweet\s*truth/i,                          category: 'Dessert' },
  { pattern: /lavonne\s*ice\s*cream|^lick\s*\|/i,       category: 'Dessert' },
  // ── Salon (premium chains often tagged as Apparel by Google) ──
  { pattern: /naturals\s*(salon|signature|lounge|hair|unisex|kids|family|india|salon\s*&\s*spa)/i, category: 'Salon' },
  { pattern: /naturals.*hair.*beauty|naturals.*beauty.*salon/i, category: 'Salon' },
  { pattern: /green\s*trends/i,                         category: 'Salon' },
  { pattern: /enrich\s*salon|^enrich\b/i,               category: 'Salon' },
  { pattern: /lakme\s*salon/i,                          category: 'Salon' },
  { pattern: /jean.?claude\s*biguine/i,                 category: 'Salon' },
  { pattern: /bodycraft\s*salon/i,                      category: 'Salon' },
  { pattern: /^looks\s*salon/i,                         category: 'Salon' },
  { pattern: /toni\s*&?\s*guy|essensuals\s*by\s*toni/i, category: 'Salon' },
  { pattern: /^vlcc\b/i,                                category: 'Salon' },
  { pattern: /^bblunt|^b:?blunt|^b\.blunt/i,            category: 'Salon' },
  { pattern: /^bounce\s*(salon|spa|unisex|family|hair)/i, category: 'Salon' },
  { pattern: /hakim'?s?\s*aalim|^hakim\s*alim/i,        category: 'Salon' },
  { pattern: /jawed\s*habib|javed\s*habib/i,            category: 'Salon' },
  { pattern: /^toabh\b/i,                               category: 'Salon' },
  { pattern: /page\s*3\s*salon/i,                       category: 'Salon' },
  { pattern: /^geetanjali\s*(salon|lifestyle)/i,        category: 'Salon' },
  { pattern: /sasoon\s*salon/i,                         category: 'Salon' },
  // ── Footwear (often tagged as Apparel) ──
  { pattern: /^bata\b|bata\s*(shoe|store|showroom|outlet|india|shoe\s*store)/i, category: 'Footwear' },
  { pattern: /^nike\s*(store|outlet)|^nike\s*(india|sport)|^nike$/i, category: 'Footwear' },
  { pattern: /^adidas\s*(store|outlet|originals)|^adidas$/i, category: 'Footwear' },
  { pattern: /^puma\s*(store|outlet)|^puma$/i,          category: 'Footwear' },
  { pattern: /^reebok\s*(store|outlet)|^reebok$/i,      category: 'Footwear' },
  { pattern: /^skechers\b/i,                            category: 'Footwear' },
  { pattern: /^woodland\b/i,                            category: 'Footwear' },
  { pattern: /^crocs\b/i,                               category: 'Footwear' },
  { pattern: /metro\s*shoes/i,                          category: 'Footwear' },
  { pattern: /hush\s*puppies/i,                         category: 'Footwear' },
  { pattern: /^mochi\b/i,                               category: 'Footwear' },
  { pattern: /^converse\b/i,                            category: 'Footwear' },
  { pattern: /new\s*balance/i,                          category: 'Footwear' },
  // ── Eyewear (often tagged as Apparel) ──
  { pattern: /^lenskart/i,                              category: 'Eyewear' },
  { pattern: /titan\s*eye/i,                            category: 'Eyewear' },
  { pattern: /vision\s*express/i,                       category: 'Eyewear' },
  { pattern: /^specsmakers\b/i,                         category: 'Eyewear' },
  { pattern: /lawrence\s*&?\s*mayo/i,                   category: 'Eyewear' },
  { pattern: /^gkb\s*(optic|lens)/i,                    category: 'Eyewear' },
  { pattern: /sunglass\s*hut/i,                         category: 'Eyewear' },
  { pattern: /ben\s*franklin\s*(optician|eyewear)/i,    category: 'Eyewear' },
  { pattern: /^optorium\b/i,                            category: 'Eyewear' },
  { pattern: /^himalaya\s*optical|^himalaya\s*opticians/i, category: 'Eyewear' },
  // ── Pharmacy (often tagged as Apparel) ──
  { pattern: /^apollo\s*pharmacy/i,                     category: 'Pharmacy' },
  { pattern: /^medplus\b/i,                             category: 'Pharmacy' },
  { pattern: /wellness\s*forever/i,                     category: 'Pharmacy' },
  { pattern: /frank\s*ross/i,                           category: 'Pharmacy' },
  { pattern: /guardian\s*pharmacy/i,                    category: 'Pharmacy' },
  { pattern: /^netmeds\b/i,                             category: 'Pharmacy' },
  // ── Electronics (premium chains — fold telecom + electronics together) ──
  { pattern: /reliance\s*digital/i,                     category: 'Electronics' },
  { pattern: /^croma\b/i,                               category: 'Electronics' },
  { pattern: /vijay\s*sales/i,                          category: 'Electronics' },
  { pattern: /apple\s*premium\s*reseller|apple\s*authoris(ed|ed)\s*reseller|^iplanet\b|^invent\b.*apple/i, category: 'Electronics' },
  { pattern: /^samsung\s*(smartplaza|smartcafe|exclusive|experience|store)/i, category: 'Electronics' },
  { pattern: /^oneplus\s*(experience|store|exclusive)/i, category: 'Electronics' },
  { pattern: /^mi\s*(home|store|exclusive)|^xiaomi\b/i, category: 'Electronics' },
  { pattern: /^bose\s*store|the\s*bose\s*store/i,       category: 'Electronics' },
  { pattern: /^sony\s*(centre|center|store|exclusive)/i, category: 'Electronics' },
  { pattern: /^lg\s*(showroom|brand\s*shoppe|electronics)/i, category: 'Electronics' },
  { pattern: /^acer\s*(mall|exclusive|store)/i,         category: 'Electronics' },
  { pattern: /^asus\s*(exclusive|store)/i,              category: 'Electronics' },
  { pattern: /^lenovo\s*(exclusive|store|smart)/i,      category: 'Electronics' },
  { pattern: /^dell\s*(exclusive|store)/i,              category: 'Electronics' },
  { pattern: /^hp\s*(world|store|exclusive)/i,          category: 'Electronics' },
  // Telecom chains — folded into Electronics for the demo so they show together
  { pattern: /^airtel\s*(store|exclusive|experience)/i, category: 'Electronics' },
  { pattern: /^my\s*jio\s*store|^jio\s*store/i,         category: 'Electronics' },
  { pattern: /^vi\s*store|^vodafone\s*store/i,          category: 'Electronics' },
  // ── Cafe (premium chains) ──
  { pattern: /^starbucks\b/i,                           category: 'Cafe' },
  { pattern: /third\s*wave\s*coffee/i,                  category: 'Cafe' },
  { pattern: /blue\s*tokai/i,                           category: 'Cafe' },
  { pattern: /^subko\b|subko\s*coffee/i,                category: 'Cafe' },
  { pattern: /matteo\s*coffea/i,                        category: 'Cafe' },
  { pattern: /^cafe\s*coffee\s*day|^ccd\b/i,            category: 'Cafe' },
  { pattern: /chai\s*point|chaayos/i,                   category: 'Cafe' },
  { pattern: /^kahale\b/i,                              category: 'Cafe' },
  { pattern: /katte\s*kulture/i,                        category: 'Cafe' },
  { pattern: /ground\s*up\s*coffee/i,                   category: 'Cafe' },
  { pattern: /kinya\s*coffee/i,                         category: 'Cafe' },
  { pattern: /isobel\s*coffee/i,                        category: 'Cafe' },
  // ── Bakery ──
  { pattern: /^theobroma\b/i,                           category: 'Bakery' },
  { pattern: /glen.?s\s*bake/i,                         category: 'Bakery' },
  // ── Apparel premium ──
  { pattern: /^zara\b/i,                                category: 'Apparel' },
  { pattern: /^h\s*&\s*m\b|^h\s+and\s+m\b/i,            category: 'Apparel' },
  { pattern: /^uniqlo\b/i,                              category: 'Apparel' },
  // ── Jewellery (often tagged as Apparel) ──
  { pattern: /^tanishq\b/i,                             category: 'Jewellery' },
  { pattern: /malabar\s*gold/i,                         category: 'Jewellery' },
  { pattern: /kalyan\s*jewell/i,                        category: 'Jewellery' },
  { pattern: /joyalukkas/i,                             category: 'Jewellery' },
  { pattern: /^caratlane\b/i,                           category: 'Jewellery' },
  // ── Beauty / Cosmetics retail ──
  { pattern: /^sephora\b/i,                             category: 'Beauty' },
  { pattern: /^nykaa\b|nykd\s*by\s*nykaa/i,             category: 'Beauty' },
  { pattern: /^mac\s*cosmetics|^m\.?a\.?c\.?\s*$/i,     category: 'Beauty' },
  { pattern: /the\s*body\s*shop/i,                      category: 'Beauty' },
  { pattern: /sugar\s*cosmetics/i,                      category: 'Beauty' },
  { pattern: /forest\s*essentials/i,                    category: 'Beauty' },
  { pattern: /^l'?occitane\b/i,                         category: 'Beauty' },
  { pattern: /^innisfree\b/i,                           category: 'Beauty' },
  { pattern: /kiehl'?s/i,                               category: 'Beauty' },
  { pattern: /bath\s*&\s*body\s*works/i,                category: 'Beauty' },
  { pattern: /plum\s*goodness|plum\s*store/i,           category: 'Beauty' },
  { pattern: /^maybelline\b/i,                          category: 'Beauty' },
  // ── Sports retail + facilities (pickleball / badminton / arcade / clubs) ──
  { pattern: /^decathlon\b/i,                           category: 'Sports' },
  { pattern: /^wildcraft\b/i,                           category: 'Sports' },
  { pattern: /columbia\s*sportswear/i,                  category: 'Sports' },
  // Sports facilities — pickleball / badminton / multi-sport venues
  { pattern: /^game\s*theory\b/i,                       category: 'Sports' },
  { pattern: /^gorally\b|^go\s*rally\b/i,               category: 'Sports' },
  { pattern: /^klutch\s*(kulb|club)/i,                  category: 'Sports' },
  { pattern: /^amoeba\b/i,                              category: 'Sports' },
  { pattern: /^machaxi\b/i,                             category: 'Sports' },
  { pattern: /^coplay\b/i,                              category: 'Sports' },
  { pattern: /^smaaash\b/i,                             category: 'Sports' },
  { pattern: /^apex\s*arena/i,                          category: 'Sports' },
  { pattern: /backyard\s*pickleball/i,                  category: 'Sports' },
  { pattern: /beyond\s*boundaries\s*pickleball/i,       category: 'Sports' },
  { pattern: /centre\s*court\s*pickleball/i,            category: 'Sports' },
  { pattern: /easy\s*court\s*pickleball/i,              category: 'Sports' },
  { pattern: /ferrohub\s*sports/i,                      category: 'Sports' },
  // ── Kids / toys retail ──
  { pattern: /^firstcry/i,                              category: 'Kids' },
  { pattern: /^mothercare\b/i,                          category: 'Kids' },
  { pattern: /^hamleys\b/i,                             category: 'Kids' },
  { pattern: /^toys\s*r\s*us/i,                         category: 'Kids' },
  // ── Bar & Brewery (premium chains + Bangalore originals) ──
  { pattern: /^toit\b/i,                                category: 'Bar & Brewery' },
  { pattern: /byg\s*brewski/i,                          category: 'Bar & Brewery' },
  { pattern: /arbor\s*brewing/i,                        category: 'Bar & Brewery' },
  { pattern: /biere\s*club|^bi[èe]re\s*club/i,          category: 'Bar & Brewery' },
  { pattern: /windmills\s*craftworks/i,                 category: 'Bar & Brewery' },
  { pattern: /bengaluru\s*brewing/i,                    category: 'Bar & Brewery' },
  { pattern: /sotally\s*tober/i,                        category: 'Bar & Brewery' },
  { pattern: /^prost\s*brewpub|^prost\b/i,              category: 'Bar & Brewery' },
  { pattern: /^hammered\b/i,                            category: 'Bar & Brewery' },
  { pattern: /^plan\s*b\b/i,                            category: 'Bar & Brewery' },
  { pattern: /^brewklyn\b/i,                            category: 'Bar & Brewery' },
  { pattern: /^geist\s*brew/i,                          category: 'Bar & Brewery' },
  { pattern: /^hoppipola\b/i,                           category: 'Bar & Brewery' },
  { pattern: /the\s*beer\s*caf[ée]/i,                   category: 'Bar & Brewery' },
  { pattern: /^big\s*pitcher\b/i,                       category: 'Bar & Brewery' },
  { pattern: /tao\s*terraces/i,                         category: 'Bar & Brewery' },
  { pattern: /^loft\s*38/i,                             category: 'Bar & Brewery' },
  { pattern: /^hoot\b/i,                                category: 'Bar & Brewery' },
  { pattern: /the\s*black\s*pearl/i,                    category: 'Bar & Brewery' },
  { pattern: /^skyye\b/i,                               category: 'Bar & Brewery' },
  { pattern: /high\s*ultra\s*lounge/i,                  category: 'Bar & Brewery' },
  { pattern: /13th\s*floor/i,                           category: 'Bar & Brewery' },
  { pattern: /tgi\s*friday/i,                           category: 'Bar & Brewery' },
  { pattern: /hard\s*rock\s*caf[ée]/i,                  category: 'Bar & Brewery' },
  { pattern: /punjabi\s*by\s*nature/i,                  category: 'Bar & Brewery' },
  { pattern: /^1131\s*bar/i,                            category: 'Bar & Brewery' },
  { pattern: /the\s*bier\s*library/i,                   category: 'Bar & Brewery' },
  { pattern: /bangalore\s*brew\s*works/i,               category: 'Bar & Brewery' },
  { pattern: /the\s*irish\s*house/i,                    category: 'Bar & Brewery' },
  { pattern: /flying\s*elephant/i,                      category: 'Bar & Brewery' },
  { pattern: /monkey\s*bar/i,                           category: 'Bar & Brewery' },
  { pattern: /^1522\b/i,                                category: 'Bar & Brewery' },
  { pattern: /the\s*pump\s*house|^pump\s*house\b/i,     category: 'Bar & Brewery' },
  { pattern: /fenny'?s\s*lounge/i,                      category: 'Bar & Brewery' },
  { pattern: /amoeba\s*sports\s*bar/i,                  category: 'Bar & Brewery' },
  // ── Bakery (premium chains + Bangalore originals) ──
  { pattern: /^theobroma\b/i,                           category: 'Bakery' },
  { pattern: /glen.?s\s*bake/i,                         category: 'Bakery' },
  { pattern: /daily\s*bread/i,                          category: 'Bakery' },
  { pattern: /the\s*sweet\s*chariot/i,                  category: 'Bakery' },
  { pattern: /^french\s*loaf|the\s*french\s*loaf/i,     category: 'Bakery' },
  { pattern: /mustard\s*bakehouse/i,                    category: 'Bakery' },
  { pattern: /^truecakes\b/i,                           category: 'Bakery' },
  { pattern: /sugar\s*bloom/i,                          category: 'Bakery' },
  { pattern: /^l'?opera\b/i,                            category: 'Bakery' },
  { pattern: /karachi\s*bakery/i,                       category: 'Bakery' },
  { pattern: /britannia.*bakery|britannia.*store/i,     category: 'Bakery' },
  { pattern: /^lavonne\b/i,                             category: 'Bakery' },
  { pattern: /^cinnamon\s*(boutique|wholesome)/i,       category: 'Bakery' },
  // ── Home & furniture retail ──
  { pattern: /^ikea\b/i,                                category: 'Home' },
  { pattern: /^pepperfry\b/i,                           category: 'Home' },
  { pattern: /^urban\s*ladder\b/i,                      category: 'Home' },
  { pattern: /^home\s*stop\b|^homestop\b/i,             category: 'Home' },
  { pattern: /^home\s*centre\b|^homecentre\b/i,         category: 'Home' },
  { pattern: /^home\s*town\b|^hometown\b/i,             category: 'Home' },
  { pattern: /godrej\s*interio/i,                       category: 'Home' },
  { pattern: /^nilkamal\b/i,                            category: 'Home' },
  { pattern: /^wakefit\b/i,                             category: 'Home' },
  { pattern: /^sleepwell\b/i,                           category: 'Home' },
  { pattern: /fabindia\s*home/i,                        category: 'Home' },
]

function forceCategory(brandName: string): string | null {
  for (const rule of BRAND_FORCE_RULES) {
    if (rule.pattern.test(brandName)) return rule.category
  }
  return null
}

function resolveCategory(brandName: string, rawCategory: string | null): string {
  const bl = brandName.toLowerCase().trim()
  if (QSR_FORCE_BRANDS_LOWER.has(bl)) return 'QSR'
  // Force rules take priority over the DB-tagged category
  const forced = forceCategory(brandName)
  if (forced) return forced
  const cat = normalizeCategory(rawCategory)
  if (cat === 'Cinema'      && CINEMA_BLOCK.some(re => re.test(brandName)))     return 'Other'
  if (cat === 'Cafe'        && CAFE_BLOCK.some(re => re.test(brandName)))       return 'Other'
  if (cat === 'Apparel'     && APPAREL_BLOCK.some(re => re.test(brandName)))    return 'Other'
  if (cat === 'Footwear'    && APPAREL_BLOCK.some(re => re.test(brandName)))    return 'Other'
  if (cat === 'Electronics' && ELECTRONICS_BLOCK.some(re => re.test(brandName))) return 'Other'
  if (cat === 'Gym'         && GYM_BLOCK.some(re => re.test(brandName)))        return 'Other'
  if (cat === 'Salon'       && SALON_BLOCK.some(re => re.test(brandName)))      return 'Other'
  if (cat === 'Restaurant'  && RESTAURANT_BLOCK.some(re => re.test(brandName))) return 'Other'
  if (cat === 'Bakery'      && BAKERY_BLOCK.some(re => re.test(brandName)))     return 'Other'
  return cat
}

// ── Brand canonicalisation ───────────────────────────────────────────────────
// Google Places returns each store with a unique long descriptive name, so a
// single brand fragments into many strings (Bata Shoe Store / Bata / Bata
// Showroom / Bata Store, or each Lenskart with a unique address blob). We
// fold these to a canonical brand name before counting, so the UI shows one
// chip per real brand instead of one chip per outlet.
type CanonicalRule = { match: RegExp; canonical: string }
const CANONICAL_RULES: CanonicalRule[] = [
  // Eyewear
  { match: /lenskart/i,                       canonical: 'Lenskart' },
  { match: /titan\s*eye\s*\+|titan\s*eyeplus/i, canonical: 'Titan Eye+' },
  { match: /vision\s*express/i,               canonical: 'Vision Express' },
  { match: /^specsmakers/i,                   canonical: 'Specsmakers' },
  { match: /lawrence\s*&?\s*mayo/i,           canonical: 'Lawrence & Mayo' },
  { match: /^gkb\s*(optic|lens)/i,            canonical: 'GKB Optics' },
  { match: /sunglass\s*hut/i,                 canonical: 'Sunglass Hut' },
  { match: /ben\s*franklin\s*(optician|eyewear)/i, canonical: 'Ben Franklin Opticians' },
  { match: /^optorium\b/i,                    canonical: 'Optorium' },
  { match: /himalaya\s*optic/i,               canonical: 'Himalaya Optical' },
  // Footwear
  { match: /^bata\b|bata\s+(shoe|store|showroom|outlet)/i, canonical: 'Bata' },
  { match: /^nike\b|nike\s+(store|outlet)/i,  canonical: 'Nike' },
  { match: /^adidas\b/i,                      canonical: 'Adidas' },
  { match: /^puma\b/i,                        canonical: 'Puma' },
  { match: /^reebok\b/i,                      canonical: 'Reebok' },
  { match: /^skechers\b/i,                    canonical: 'Skechers' },
  { match: /^woodland\b/i,                    canonical: 'Woodland' },
  { match: /^mochi\b/i,                       canonical: 'Mochi' },
  { match: /metro\s*shoes/i,                  canonical: 'Metro Shoes' },
  { match: /hush\s*puppies/i,                 canonical: 'Hush Puppies' },
  { match: /^clarks\b/i,                      canonical: 'Clarks' },
  { match: /^liberty\b.*shoe|^liberty$/i,     canonical: 'Liberty' },
  { match: /^converse\b/i,                    canonical: 'Converse' },
  { match: /^vans\b/i,                        canonical: 'Vans' },
  { match: /new\s*balance/i,                  canonical: 'New Balance' },
  { match: /^crocs\b/i,                       canonical: 'Crocs' },
  { match: /^fila\b/i,                        canonical: 'Fila' },
  { match: /red\s*tape/i,                     canonical: 'Red Tape' },
  // Apparel — premium / mass-premium
  { match: /^zara\b/i,                        canonical: 'Zara' },
  { match: /^h\s*&\s*m\b|^h\s+and\s+m\b/i,    canonical: 'H&M' },
  { match: /^uniqlo\b/i,                      canonical: 'Uniqlo' },
  { match: /^mango\b/i,                       canonical: 'Mango' },
  { match: /^westside\b/i,                    canonical: 'Westside' },
  { match: /^lifestyle\b/i,                   canonical: 'Lifestyle' },
  { match: /^max(\s+fashion)?\b/i,            canonical: 'Max Fashion' },
  { match: /shoppers\s*stop/i,                canonical: 'Shoppers Stop' },
  { match: /marks\s*&\s*spencer|m\s*&\s*s\b/i, canonical: 'Marks & Spencer' },
  { match: /^fabindia\b/i,                    canonical: 'Fabindia' },
  { match: /^manyavar\b/i,                    canonical: 'Manyavar' },
  { match: /allen\s*solly/i,                  canonical: 'Allen Solly' },
  { match: /van\s*heusen/i,                   canonical: 'Van Heusen' },
  { match: /peter\s*england/i,                canonical: 'Peter England' },
  { match: /louis\s*philippe/i,               canonical: 'Louis Philippe' },
  { match: /^arrow\b/i,                       canonical: 'Arrow' },
  { match: /^raymond\b/i,                     canonical: 'Raymond' },
  { match: /^biba\b/i,                        canonical: 'BIBA' },
  { match: /^w\s+for\s+woman|^w\s*$/i,        canonical: 'W' },
  { match: /^aurelia\b/i,                     canonical: 'Aurelia' },
  { match: /^soch\b/i,                        canonical: 'Soch' },
  { match: /^mohey\b/i,                       canonical: 'Mohey' },
  { match: /^levi'?s\b|^levis\b/i,            canonical: "Levi's" },
  { match: /^lee\b.*store|^lee\s+jeans/i,     canonical: 'Lee' },
  { match: /^wrangler\b/i,                    canonical: 'Wrangler' },
  { match: /pepe\s*jeans/i,                   canonical: 'Pepe Jeans' },
  { match: /tommy\s*hilfiger/i,               canonical: 'Tommy Hilfiger' },
  { match: /calvin\s*klein/i,                 canonical: 'Calvin Klein' },
  { match: /^gap\b/i,                         canonical: 'GAP' },
  { match: /us\s*polo|u\.?s\.?\s*polo/i,      canonical: 'US Polo Assn.' },
  { match: /flying\s*machine/i,               canonical: 'Flying Machine' },
  { match: /jack\s*&\s*jones/i,               canonical: 'Jack & Jones' },
  { match: /vero\s*moda/i,                    canonical: 'Vero Moda' },
  { match: /^only\b.*store|^only$/i,          canonical: 'ONLY' },
  { match: /^pantaloons\b/i,                  canonical: 'Pantaloons' },
  { match: /forever\s*21/i,                   canonical: 'Forever 21' },
  { match: /^nicobar\b/i,                     canonical: 'Nicobar' },
  { match: /bombay\s*shirt/i,                 canonical: 'Bombay Shirt Company' },
  // Jewellery
  { match: /^tanishq\b/i,                     canonical: 'Tanishq' },
  { match: /malabar\s*gold/i,                 canonical: 'Malabar Gold & Diamonds' },
  { match: /kalyan\s*jewell/i,                canonical: 'Kalyan Jewellers' },
  { match: /joyalukkas/i,                     canonical: 'Joyalukkas' },
  { match: /^caratlane\b/i,                   canonical: 'CaratLane' },
  { match: /pc\s*jewell/i,                    canonical: 'PC Jeweller' },
  { match: /senco\s*gold/i,                   canonical: 'Senco Gold' },
  { match: /^orra\b/i,                        canonical: 'Orra' },
  { match: /grt\s*jewell/i,                   canonical: 'GRT Jewellers' },
  // Electronics
  { match: /reliance\s*digital/i,             canonical: 'Reliance Digital' },
  { match: /^croma\b/i,                       canonical: 'Croma' },
  { match: /vijay\s*sales/i,                  canonical: 'Vijay Sales' },
  { match: /apple\s*premium\s*reseller|apple\s*authoris(ed|ed)\s*reseller|^iplanet\b|invent.*apple/i, canonical: 'Apple' },
  { match: /^apple\b.*store|^apple$/i,        canonical: 'Apple' },
  { match: /^samsung\b.*(store|smartplaza|smartcafe|experience|exclusive)/i, canonical: 'Samsung' },
  { match: /^oneplus\b/i,                     canonical: 'OnePlus' },
  { match: /^mi\s*(home|store|exclusive)|^xiaomi\b/i,  canonical: 'Mi / Xiaomi' },
  { match: /^bose\s*store|the\s*bose\s*store/i, canonical: 'Bose' },
  { match: /^sony\b.*(centre|center|store|exclusive)/i, canonical: 'Sony' },
  { match: /^lg\b.*(showroom|electronics|brand\s*shoppe)/i, canonical: 'LG' },
  { match: /^acer\s*(mall|exclusive|store)/i, canonical: 'Acer' },
  { match: /^asus\s*(exclusive|store)/i,      canonical: 'Asus' },
  { match: /^lenovo\s*(exclusive|store|smart)/i, canonical: 'Lenovo' },
  { match: /^dell\s*(exclusive|store)/i,      canonical: 'Dell' },
  { match: /^hp\s*(world|store|exclusive)/i,  canonical: 'HP' },
  // Telecom chains
  { match: /^airtel\s*(store|exclusive|experience)/i, canonical: 'Airtel' },
  { match: /^my\s*jio\s*store|^jio\s*store/i, canonical: 'Jio' },
  { match: /^vi\s*store|^vodafone\s*store/i,  canonical: 'Vi (Vodafone Idea)' },
  // Pharmacy
  { match: /apollo\s*pharmacy/i,              canonical: 'Apollo Pharmacy' },
  { match: /^medplus\b/i,                     canonical: 'MedPlus' },
  { match: /wellness\s*forever/i,             canonical: 'Wellness Forever' },
  { match: /frank\s*ross/i,                   canonical: 'Frank Ross' },
  { match: /guardian\s*pharmacy/i,            canonical: 'Guardian Pharmacy' },
  // Supermarket
  { match: /^d.?mart\b/i,                     canonical: 'DMart' },
  { match: /reliance\s*fresh/i,               canonical: 'Reliance Fresh' },
  { match: /reliance\s*smart/i,               canonical: 'Reliance Smart' },
  { match: /^more\b.*supermarket|^more\s+megastore/i, canonical: 'More' },
  { match: /^spar\b.*(hyper|supermarket)/i,   canonical: 'SPAR' },
  { match: /lulu\s*hyper/i,                   canonical: 'Lulu Hypermarket' },
  { match: /nature'?s\s*basket/i,             canonical: "Nature's Basket" },
  { match: /star\s*market|star\s*bazaar/i,    canonical: 'Star Market' },
  // Cinema
  { match: /^pvr\b|^p\[xl\].*pvr/i,           canonical: 'PVR' },
  { match: /^inox\b/i,                        canonical: 'INOX' },
  { match: /^cinepolis\b/i,                   canonical: 'Cinepolis' },
  { match: /miraj\s*cinema/i,                 canonical: 'Miraj Cinemas' },
  // Bar & Brewery
  { match: /^toit\b/i,                        canonical: 'Toit' },
  { match: /byg\s*brewski/i,                  canonical: 'Byg Brewski' },
  { match: /arbor\s*brewing/i,                canonical: 'Arbor Brewing' },
  { match: /biere\s*club|^bi[èe]re\s*club/i,  canonical: 'Biere Club' },
  { match: /windmills\s*craftworks/i,         canonical: 'Windmills Craftworks' },
  { match: /bengaluru\s*brewing/i,            canonical: 'Bengaluru Brewing Co.' },
  { match: /sotally\s*tober/i,                canonical: 'Sotally Tober' },
  { match: /^prost\s*brewpub|^prost\b/i,      canonical: 'Prost Brewpub' },
  { match: /^hammered\b/i,                    canonical: 'Hammered' },
  { match: /^plan\s*b\b/i,                    canonical: 'Plan B' },
  { match: /^brewklyn\b/i,                    canonical: 'Brewklyn' },
  { match: /^geist\s*brew/i,                  canonical: 'Geist Brewing' },
  { match: /^hoppipola\b/i,                   canonical: 'Hoppipola' },
  { match: /the\s*beer\s*caf[ée]/i,           canonical: 'The Beer Cafe' },
  { match: /^big\s*pitcher\b/i,               canonical: 'Big Pitcher' },
  { match: /tao\s*terraces/i,                 canonical: 'Tao Terraces' },
  { match: /^loft\s*38/i,                     canonical: 'Loft 38' },
  { match: /the\s*black\s*pearl/i,            canonical: 'The Black Pearl' },
  { match: /tgi\s*friday/i,                   canonical: "TGI Fridays" },
  { match: /hard\s*rock\s*caf[ée]/i,          canonical: 'Hard Rock Cafe' },
  { match: /the\s*irish\s*house/i,            canonical: 'The Irish House' },
  { match: /flying\s*elephant/i,              canonical: 'The Flying Elephant' },
  { match: /monkey\s*bar/i,                   canonical: 'Monkey Bar' },
  { match: /^1131\s*bar/i,                    canonical: '1131 Bar + Kitchen' },
  { match: /^1522\b/i,                        canonical: '1522 The Pub' },
  { match: /the\s*pump\s*house|^pump\s*house\b/i, canonical: 'The Pump House' },
  { match: /fenny'?s\s*lounge/i,              canonical: "Fenny's Lounge" },
  { match: /amoeba\s*sports\s*bar/i,          canonical: 'Amoeba Sports Bar' },
  // Bakery
  { match: /^theobroma\b/i,                   canonical: 'Theobroma' },
  { match: /glen.?s\s*bake/i,                 canonical: "Glen's Bakehouse" },
  { match: /daily\s*bread/i,                  canonical: 'Daily Bread' },
  { match: /the\s*sweet\s*chariot/i,          canonical: 'The Sweet Chariot' },
  { match: /^french\s*loaf|the\s*french\s*loaf/i, canonical: 'French Loaf' },
  { match: /mustard\s*bakehouse/i,            canonical: 'Mustard Bakehouse' },
  { match: /^truecakes\b/i,                   canonical: 'TrueCakes' },
  { match: /sugar\s*bloom/i,                  canonical: 'Sugar Bloom' },
  { match: /^l'?opera\b/i,                    canonical: "L'Opera" },
  { match: /karachi\s*bakery/i,               canonical: 'Karachi Bakery' },
  // Beauty
  { match: /^sephora\b/i,                     canonical: 'Sephora' },
  { match: /^nykaa\b(\s*(luxe|on\s*trend|kiosk))?$|^nykaa\s*(luxe|on\s*trend|kiosk)\b/i, canonical: 'Nykaa' },
  { match: /nykd\s*by\s*nykaa/i,              canonical: 'Nykd by Nykaa' },
  { match: /^mac\s*cosmetics|^m\.?a\.?c\.?$/i, canonical: 'M·A·C' },
  { match: /the\s*body\s*shop/i,              canonical: 'The Body Shop' },
  { match: /sugar\s*cosmetics/i,              canonical: 'SUGAR Cosmetics' },
  { match: /forest\s*essentials/i,            canonical: 'Forest Essentials' },
  { match: /^l'?occitane\b/i,                 canonical: "L'Occitane" },
  { match: /^innisfree\b/i,                   canonical: 'Innisfree' },
  { match: /kiehl'?s/i,                       canonical: "Kiehl's" },
  { match: /bath\s*&\s*body\s*works/i,        canonical: 'Bath & Body Works' },
  { match: /plum\s*goodness|^plum\s*store/i,  canonical: 'Plum' },
  // Sports — retail
  { match: /^decathlon\b/i,                   canonical: 'Decathlon' },
  { match: /^wildcraft\b/i,                   canonical: 'Wildcraft' },
  { match: /columbia\s*sportswear/i,          canonical: 'Columbia Sportswear' },
  // Sports — facilities (pickleball, badminton, multi-sport)
  { match: /^game\s*theory\b/i,               canonical: 'Game Theory' },
  { match: /^gorally\b|^go\s*rally\b/i,       canonical: 'GoRally' },
  { match: /^klutch\s*(kulb|club)/i,          canonical: 'Klutch Kulb' },
  { match: /^amoeba(?!\s*sports\s*bar)/i,     canonical: 'Amoeba' },
  { match: /^machaxi\b/i,                     canonical: 'Machaxi' },
  { match: /^coplay\b/i,                      canonical: 'CoPlay' },
  { match: /^smaaash\b/i,                     canonical: 'Smaaash' },
  { match: /^apex\s*arena/i,                  canonical: 'Apex Arena' },
  // Kids
  { match: /^firstcry/i,                      canonical: 'FirstCry' },
  { match: /^mothercare\b/i,                  canonical: 'Mothercare' },
  { match: /^hamleys\b/i,                     canonical: 'Hamleys' },
  // Home
  { match: /^ikea\b/i,                        canonical: 'IKEA' },
  { match: /^pepperfry\b/i,                   canonical: 'Pepperfry' },
  { match: /urban\s*ladder/i,                 canonical: 'Urban Ladder' },
  { match: /home\s*stop|^homestop\b/i,        canonical: 'HomeStop' },
  { match: /home\s*centre|^homecentre\b/i,    canonical: 'Home Centre' },
  { match: /home\s*town|^hometown\b/i,        canonical: 'HomeTown' },
  { match: /godrej\s*interio/i,               canonical: 'Godrej Interio' },
  { match: /^nilkamal\b/i,                    canonical: 'Nilkamal' },
  { match: /^wakefit\b/i,                     canonical: 'Wakefit' },
  { match: /^sleepwell\b/i,                   canonical: 'Sleepwell' },
  { match: /fabindia\s*home/i,                canonical: 'Fabindia Home' },
]

function canonicalBrand(name: string): string {
  for (const rule of CANONICAL_RULES) {
    if (rule.match.test(name)) return rule.canonical
  }
  return name
}

// ── Premium-only filter for retail brand chips ───────────────────────────────
// Retail categories should ONLY surface recognizable brands. Anything not in
// this allowlist gets hidden from per-zone Apparel/Footwear/Eyewear/Jewellery
// chip lists (still counted in totals, just not shown as a featured brand).
const PREMIUM_RETAIL: Set<string> = new Set([
  // Apparel
  'Zara', 'H&M', 'Uniqlo', 'Mango', 'Westside', 'Lifestyle', 'Max Fashion',
  'Shoppers Stop', 'Marks & Spencer', 'Fabindia', 'Manyavar', 'Allen Solly',
  'Van Heusen', 'Peter England', 'Louis Philippe', 'Arrow', 'Raymond', 'BIBA',
  'W', 'Aurelia', 'Soch', 'Mohey', "Levi's", 'Lee', 'Wrangler', 'Pepe Jeans',
  'Tommy Hilfiger', 'Calvin Klein', 'GAP', 'US Polo Assn.', 'Flying Machine',
  'Jack & Jones', 'Vero Moda', 'ONLY', 'Pantaloons', 'Forever 21', 'Nicobar',
  'Bombay Shirt Company',
  // Footwear
  'Bata', 'Nike', 'Adidas', 'Puma', 'Reebok', 'Skechers', 'Woodland', 'Mochi',
  'Metro Shoes', 'Hush Puppies', 'Clarks', 'Liberty', 'Converse', 'Vans',
  'New Balance', 'Crocs', 'Fila', 'Red Tape',
  // Eyewear
  'Lenskart', 'Titan Eye+', 'Vision Express', 'Specsmakers',
  'Lawrence & Mayo', 'GKB Optics', 'Sunglass Hut',
  'Ben Franklin Opticians', 'Optorium', 'Himalaya Optical',
  // Jewellery
  'Tanishq', 'Malabar Gold & Diamonds', 'Kalyan Jewellers', 'Joyalukkas',
  'CaratLane', 'PC Jeweller', 'Senco Gold', 'Orra', 'GRT Jewellers',
  // Electronics + Telecom
  'Reliance Digital', 'Croma', 'Vijay Sales',
  'Apple', 'Samsung', 'OnePlus', 'Mi / Xiaomi',
  'Bose', 'Sony', 'LG',
  'Acer', 'Asus', 'Lenovo', 'Dell', 'HP',
  'Airtel', 'Jio', 'Vi (Vodafone Idea)',
  // Beauty / Cosmetics
  'Sephora', 'Nykaa', 'Nykd by Nykaa', 'M·A·C', 'The Body Shop',
  'SUGAR Cosmetics', 'Forest Essentials', "L'Occitane", 'Innisfree',
  "Kiehl's", 'Bath & Body Works', 'Plum',
  // Sports — retail + facilities
  'Decathlon', 'Wildcraft', 'Columbia Sportswear',
  'Game Theory', 'GoRally', 'Klutch Kulb',
  'Amoeba', 'Machaxi', 'CoPlay', 'Smaaash', 'Apex Arena',
  // Kids / Toys
  'FirstCry', 'Mothercare', 'Hamleys',
  // Home / Furniture
  'IKEA', 'Pepperfry', 'Urban Ladder', 'HomeStop', 'Home Centre',
  'HomeTown', 'Godrej Interio', 'Nilkamal', 'Wakefit', 'Sleepwell',
  'Fabindia Home',
  // Bakery
  'Theobroma', "Glen's Bakehouse", 'Daily Bread', 'The Sweet Chariot',
  'French Loaf', 'Mustard Bakehouse', 'TrueCakes', 'Sugar Bloom',
  "L'Opera", 'Karachi Bakery',
  // Bar & Brewery — premium chains + Bangalore originals
  'Toit', 'Byg Brewski', 'Arbor Brewing', 'Biere Club',
  'Windmills Craftworks', 'Bengaluru Brewing Co.', 'Sotally Tober',
  'Prost Brewpub', 'Hammered', 'Plan B', 'Brewklyn', 'Geist Brewing',
  'Hoppipola', 'The Beer Cafe', 'Big Pitcher', 'Tao Terraces',
  'Loft 38', 'The Black Pearl', 'TGI Fridays', 'Hard Rock Cafe',
  'The Irish House', 'The Flying Elephant', 'Monkey Bar',
  '1131 Bar + Kitchen', '1522 The Pub', 'The Pump House',
  "Fenny's Lounge", 'Amoeba Sports Bar',
])
const RETAIL_CATS_FILTERED: Set<string> = new Set([
  'Apparel', 'Footwear', 'Eyewear', 'Jewellery', 'Electronics',
  'Beauty', 'Sports', 'Home',
  'Bakery', 'Bar & Brewery',
])

function sortBrands(entries: [string, number][]): string[] {
  return entries
    .filter(([name]) => !isBadBrand(name))
    .sort((a, b) => {
      const aA = isAnchorBrand(a[0])
      const bA = isAnchorBrand(b[0])
      if (aA && !bA) return -1
      if (!aA && bA) return 1
      return b[1] - a[1]
    })
    .map(([name]) => name)
}

// Bounding boxes for 40 Bangalore neighborhoods.
// Ordering matters: classify() uses first-match, so prime commercial zones are
// listed first to win any border overlaps. Critical non-overlapping pairs:
//   HSR Layout (ends lng 77.638) / Bommanahalli (starts lng 77.638)
//   Arekere    (ends lng 77.618) / Hulimavu     (starts lng 77.618)
const NEIGHBORHOODS: { name: string; lat: [number, number]; lng: [number, number] }[] = [
  // ── Prime commercial hubs — highest overlap priority ──────────────────────────
  { name: 'Koramangala',      lat: [12.912, 12.958], lng: [77.598, 77.658] },
  { name: 'Indiranagar',      lat: [12.950, 13.000], lng: [77.615, 77.678] },
  { name: 'MG Road',          lat: [12.955, 12.998], lng: [77.572, 77.638] },
  { name: 'Whitefield',       lat: [12.952, 13.005], lng: [77.732, 77.802] },
  { name: 'Marathahalli',     lat: [12.932, 12.978], lng: [77.672, 77.732] },

  // ── South: Jayanagar belt (before BTM so Jayanagar gets its border cafes) ─────
  // Jayanagar tightened to its true 9-block footprint:
  //   north  = South End Rd / Lalbagh south gate (lat 12.948)
  //   south  = 9th Block / Tilak Nagar           (lat 12.910)
  //   west   = 3rd Block / Sarakki Lake border    (lng 77.572)
  //   east   = 5th & 8th Block / Wilson Garden     (lng 77.608)
  { name: 'Jayanagar',        lat: [12.910, 12.948], lng: [77.572, 77.608] },
  { name: 'Basavanagudi',     lat: [12.928, 12.972], lng: [77.540, 77.588] },
  { name: 'Langford Town',    lat: [12.938, 12.972], lng: [77.568, 77.622] },

  // ── South-East ────────────────────────────────────────────────────────────────
  { name: 'BTM Layout',       lat: [12.892, 12.938], lng: [77.568, 77.618] },
  // HSR Layout extends from Sector 1 (west, ~77.620) all the way to Sector 7
  // (east, ~77.660) along the Sarjapur Road border. Listed BEFORE Bommanahalli
  // so HSR claims its own sectors back from Bommanahalli's old bbox.
  { name: 'HSR Layout',       lat: [12.895, 12.940], lng: [77.605, 77.660] },
  // Bommanahalli proper sits SOUTH of HSR along Hosur Road / BG Road / Madivala —
  // lat strictly south of HSR's southern boundary, no overlap.
  { name: 'Bommanahalli',     lat: [12.860, 12.895], lng: [77.620, 77.660] },
  // Bellandur tightened to its true core (ORR junction / Bellandur Lake /
  // RMZ Ecoworld). Sarjapur Road covers the long stretch south of Bellandur
  // all the way to Sarjapur town — was previously losing 1000+ outlets to
  // Bellandur because Bellandur's bbox extended too far south.
  { name: 'Bellandur',        lat: [12.918, 12.952], lng: [77.660, 77.715] },
  { name: 'Sarjapur Road',    lat: [12.848, 12.918], lng: [77.660, 77.795] },

  // ── South: outer belt ─────────────────────────────────────────────────────────
  // Uttarahalli listed BEFORE Banashankari so its main-road commercial strip
  // (lat ~12.91, lng ~77.55 — Subramanyapura, Pantaloons, Forum South stores,
  // McDonald's, KFC, "Domino's Uttarahalli Hobli", Boba Bhai etc.) doesn't
  // get stolen by Banashankari's older too-wide bbox.
  { name: 'Uttarahalli',      lat: [12.880, 12.918], lng: [77.510, 77.560] },
  // Banashankari proper sits NORTH of Uttarahalli — BSK 1st–3rd Stage,
  // Banashankari Temple, Kathriguppe, Padmanabhanagar.
  { name: 'Banashankari',     lat: [12.918, 12.948], lng: [77.530, 77.578] },
  { name: 'JP Nagar',         lat: [12.872, 12.928], lng: [77.560, 77.605] },
  { name: 'Vijayanagar',      lat: [12.938, 12.988], lng: [77.488, 77.548] },
  { name: 'Kengeri',          lat: [12.868, 12.945], lng: [77.442, 77.502] },

  // ── Bannerghatta Road corridor — hard east/west split at lng 77.618 ───────────
  { name: 'Arekere',          lat: [12.838, 12.915], lng: [77.548, 77.618] },
  // Hulimavu starts exactly where Arekere ends — no containment, no gap
  { name: 'Hulimavu',         lat: [12.838, 12.915], lng: [77.618, 77.668] },
  { name: 'Electronic City',  lat: [12.790, 12.848], lng: [77.625, 77.718] },

  // ── Central ───────────────────────────────────────────────────────────────────
  { name: 'Shivajinagar',     lat: [12.962, 13.015], lng: [77.562, 77.618] },
  { name: 'Frazer Town',      lat: [12.965, 13.018], lng: [77.592, 77.658] },

  // ── West / North-West ─────────────────────────────────────────────────────────
  { name: 'Rajajinagar',      lat: [12.965, 13.020], lng: [77.508, 77.562] },
  { name: 'Malleshwaram',     lat: [12.972, 13.028], lng: [77.528, 77.595] },
  // New BEL Road covers the BEL Circle / Sanjay Nagar / RMV / Mathikere
  // commercial strip. Listed BEFORE Yeshwanthpur so its true belt is not
  // stolen by Yeshwanthpur's older too-wide bbox.
  { name: 'New BEL Road',     lat: [13.025, 13.060], lng: [77.555, 77.590] },
  // Yeshwanthpur tightened to lng 77.555 max — strictly west of New BEL Rd.
  { name: 'Yeshwanthpur',     lat: [13.005, 13.035], lng: [77.512, 77.555] },
  { name: 'Peenya',           lat: [13.005, 13.075], lng: [77.462, 77.528] },

  // ── North ─────────────────────────────────────────────────────────────────────
  { name: 'RT Nagar',         lat: [12.998, 13.048], lng: [77.555, 77.618] },
  { name: 'Hebbal',           lat: [13.022, 13.082], lng: [77.540, 77.628] },
  { name: 'Sahakar Nagar',    lat: [13.038, 13.095], lng: [77.545, 77.622] },
  { name: 'Manyata',          lat: [13.025, 13.082], lng: [77.598, 77.668] },
  { name: 'Thanisandra',      lat: [13.045, 13.098], lng: [77.598, 77.672] },
  { name: 'Yelahanka',        lat: [13.075, 13.158], lng: [77.538, 77.648] },

  // ── North-East ────────────────────────────────────────────────────────────────
  { name: 'Kalyan Nagar',     lat: [12.998, 13.055], lng: [77.618, 77.678] },
  { name: 'Ramamurthynagar',  lat: [12.992, 13.055], lng: [77.642, 77.715] },
  { name: 'KR Puram',         lat: [12.975, 13.042], lng: [77.665, 77.742] },

  // ── East ──────────────────────────────────────────────────────────────────────
  { name: 'Brookefield',      lat: [12.955, 13.005], lng: [77.695, 77.762] },
  { name: 'Mahadevapura',     lat: [12.962, 13.025], lng: [77.682, 77.742] },
  { name: 'Varthur',          lat: [12.908, 12.968], lng: [77.718, 77.798] },
]

function classify(lat: number, lng: number): string | null {
  for (const n of NEIGHBORHOODS) {
    if (lat >= n.lat[0] && lat <= n.lat[1] && lng >= n.lng[0] && lng <= n.lng[1]) return n.name
  }
  return null
}

export async function GET() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json(EMPTY)

  const supabase = createClient(url, key)

  try {
    type Row = { category: string | null; brand_name: string; lat: number; lng: number }
    const allRows: Row[] = []
    const pageSize = 1000
    let from = 0

    while (true) {
      const { data, error } = await supabase
        .from('bangalore_brand_outlets')
        .select('category, brand_name, lat, lng')
        .eq('is_active', true)
        .not('lat', 'is', null)
        .range(from, from + pageSize - 1)

      if (error) { console.error('[brand-intelligence/zones]', error); break }
      if (!data?.length) break
      allRows.push(...(data as Row[]))
      if (data.length < pageSize) break
      from += pageSize
    }

    type ZoneAgg = { cats: Map<string, number>; brands: Map<string, number>; catBrands: Map<string, Map<string, number>> }
    const byZone = new Map<string, ZoneAgg>()
    for (const r of allRows) {
      const zone = classify(r.lat, r.lng)
      if (!zone) continue
      let z = byZone.get(zone)
      if (!z) { z = { cats: new Map(), brands: new Map(), catBrands: new Map() }; byZone.set(zone, z) }

      // Canonicalise the brand name first so "Bata Shoe Store" / "Bata Store" /
      // "Bata Showroom" all collapse into a single 'Bata' chip in this zone.
      const brand = canonicalBrand(r.brand_name)
      const cat = resolveCategory(r.brand_name, r.category)
      z.cats.set(cat, (z.cats.get(cat) ?? 0) + 1)
      z.brands.set(brand, (z.brands.get(brand) ?? 0) + 1)
      let cb = z.catBrands.get(cat)
      if (!cb) { cb = new Map(); z.catBrands.set(cat, cb) }
      cb.set(brand, (cb.get(brand) ?? 0) + 1)
    }

    const zones: ZoneData[] = Array.from(byZone.entries()).map(([zone, d]) => ({
      zone,
      totalOutlets: Array.from(d.cats.values()).reduce((s, v) => s + v, 0),
      totalBrands: d.brands.size,
      categories: Array.from(d.cats.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      topBrands: sortBrands(Array.from(d.brands.entries())).slice(0, 10),
      brandsByCategory: Object.fromEntries(
        Array.from(d.catBrands.entries()).map(([cat, bm]) => {
          let brandList = sortBrands(Array.from(bm.entries()))
          // Retail categories (Apparel/Footwear/Eyewear/Jewellery) only show
          // recognised premium / mass-premium brands. Local one-off shops are
          // hidden so the chips stay credible.
          if (RETAIL_CATS_FILTERED.has(cat)) {
            brandList = brandList.filter(name => PREMIUM_RETAIL.has(name))
          }
          return [cat, brandList.slice(0, 8)]
        })
      ),
    })).sort((a, b) => b.totalOutlets - a.totalOutlets)

    const allBrands = new Set(
      allRows.filter(r => classify(r.lat, r.lng)).map(r => canonicalBrand(r.brand_name))
    )
    return NextResponse.json({
      zones,
      totalOutlets: zones.reduce((s, z) => s + z.totalOutlets, 0),
      totalBrands: allBrands.size,
      totalZones: zones.length,
    } satisfies ZonesResponse)
  } catch (err) {
    console.error('[brand-intelligence/zones]', err)
    return NextResponse.json(EMPTY)
  }
}
