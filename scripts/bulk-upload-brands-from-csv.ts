/**
 * Bulk upload brands from CSV file.
 * Usage: npx tsx scripts/bulk-upload-brands-from-csv.ts "path/to/brands.csv"
 *
 * Cleans data, parses min&Max Size, skips duplicates (by email). Outputs cleaned CSV.
 * If DATABASE_URL is set, inserts via Prisma. Otherwise writes brands-cleaned.csv only.
 */

import { config } from 'dotenv'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config()
import { getPrisma } from '../src/lib/get-prisma'
import { generateBrandId } from '../src/lib/brand-id-generator'
import bcrypt from 'bcryptjs'

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') inQuotes = !inQuotes
    else if (c === ',' && !inQuotes) {
      out.push(cur.trim().replace(/^"|"$/g, ''))
      cur = ''
    } else cur += c
  }
  out.push(cur.trim().replace(/^"|"$/g, ''))
  return out
}

// Parse CSV with proper handling of multiline quoted fields
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  text = text.replace(/^\uFEFF/, '')
  const lines: string[] = []
  let i = 0
  while (i < text.length) {
    let line = ''
    let inQuotes = false
    while (i < text.length) {
      const c = text[i]
      if (c === '"') {
        inQuotes = !inQuotes
        line += c
        i++
      } else if ((c === '\n' || c === '\r') && !inQuotes) {
        i++
        if (c === '\r' && text[i] === '\n') i++
        break
      } else {
        line += c
        i++
      }
    }
    if (line.trim()) lines.push(line)
  }

  if (lines.length < 2) return { headers: [], rows: [] }

  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map((line) => {
    const cells = parseCSVLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h.trim()] = (cells[idx] ?? '').trim()
    })
    return row
  })
  return { headers, rows }
}

// Parse "150–500_sqft" or "500-1000_sqft" -> { minSize: 150, maxSize: 500 }
function parseMinMaxSize(val: string): { minSize: number | null; maxSize: number | null } {
  if (!val || !val.trim()) return { minSize: null, maxSize: null }
  const nums = val.match(/\d+/g)
  if (nums && nums.length >= 2) {
    const a = parseInt(nums[0], 10)
    const b = parseInt(nums[1], 10)
    return { minSize: Math.min(a, b), maxSize: Math.max(a, b) }
  }
  if (nums && nums.length === 1) {
    const n = parseInt(nums[0], 10)
    return { minSize: n, maxSize: n }
  }
  return { minSize: null, maxSize: null }
}

function parseNum(val: string): number | null {
  if (!val) return null
  const n = Number(val)
  return Number.isFinite(n) ? n : null
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function cleanText(s: string): string {
  return s
    .replace(/\uFFFD/g, '') // replacement char
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
    .trim()
}

const COL_ALIASES: Record<string, string> = {
  'min&max size': 'minMaxSize',
  'min&Max Size': 'minMaxSize',
  minMaxSize: 'minMaxSize',
}

async function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error('Usage: npx tsx scripts/bulk-upload-brands-from-csv.ts <path-to-csv>')
    process.exit(1)
  }

  const resolved = resolve(process.cwd(), csvPath)
  let text: string
  try {
    text = readFileSync(resolved, 'utf-8')
  } catch (e: any) {
    console.error('Failed to read file:', e.message)
    process.exit(1)
  }

  const { headers: rawHeaders, rows } = parseCSV(text)
  const headers = rawHeaders.map((h) => COL_ALIASES[h.toLowerCase()] || h)
  const get = (row: Record<string, string>, key: string): string => {
    const k = Object.keys(row).find((x) => x.toLowerCase() === key.toLowerCase())
    return (k ? row[k] : row[key] ?? '') || ''
  }

  const cleaned: Array<{
    name: string
    email: string
    industry: string
    companyName: string
    preferredLocations: string[]
    budgetMin: number | null
    budgetMax: number | null
    minSize: number | null
    maxSize: number | null
    preferredPropertyTypes: string[]
    mustHaveAmenities: string[]
  }> = []

  for (const row of rows) {
    let name = cleanText(get(row, 'name'))
    let email = cleanText(get(row, 'email')).toLowerCase()

    if (!name || !email) continue

    // Swap if name looks like email and email looks like name
    if (name.includes('@') && !email.includes('@')) {
      ;[name, email] = [email, name]
    }

    if (!isValidEmail(email)) continue

    const companyName = cleanText(get(row, 'companyName')) || name
    const industry = cleanText(get(row, 'industry')) || ''

    const prefloc = cleanText(get(row, 'preferredLocations'))
    const preferredLocations = prefloc
      ? prefloc.split(/[,;|]+/).map((x) => x.trim()).filter(Boolean)
      : []

    const budgetMin = parseNum(get(row, 'budgetMin'))
    const budgetMax = parseNum(get(row, 'budgetMax'))

    const minMaxRaw = get(row, 'minMaxSize') || get(row, 'min&Max Size') || get(row, 'min&max size')
    const { minSize, maxSize } = parseMinMaxSize(minMaxRaw)

    const preftype = cleanText(get(row, 'preferredPropertyTypes'))
    const preferredPropertyTypes = preftype
      ? preftype.split(/[,;|]+/).map((x) => x.trim()).filter(Boolean)
      : []

    const mustHave = cleanText(get(row, 'mustHaveAmenities'))
    const mustHaveAmenities = mustHave ? mustHave.split(/[,;|]+/).map((x) => x.trim()).filter(Boolean) : []

    cleaned.push({
      name: name.slice(0, 255),
      email: email.slice(0, 255),
      industry: industry.slice(0, 100),
      companyName: companyName.slice(0, 255),
      preferredLocations,
      budgetMin,
      budgetMax,
      minSize,
      maxSize,
      preferredPropertyTypes,
      mustHaveAmenities,
    })
  }

  console.log(`Parsed ${rows.length} rows → ${cleaned.length} valid brands`)

  // Write cleaned CSV for admin UI upload (batches of 300)
  const outDir = resolve(process.cwd(), 'scripts', 'output')
  try {
    mkdirSync(outDir, { recursive: true })
  } catch (_) {}
  const outPath = resolve(outDir, 'brands-cleaned.csv')
  const csvHeader = 'name,email,industry,companyName,preferredLocations,budgetMin,budgetMax,minSize,maxSize,preferredPropertyTypes,mustHaveAmenities'
  const csvRows = cleaned.map((r) => {
    const escape = (s: string) => (s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s)
    return [
      escape(r.name),
      escape(r.email),
      escape(r.industry),
      escape(r.companyName),
      escape(r.preferredLocations.join(', ')),
      r.budgetMin ?? '',
      r.budgetMax ?? '',
      r.minSize ?? '',
      r.maxSize ?? '',
      escape(r.preferredPropertyTypes.join(', ')),
      escape(r.mustHaveAmenities.join(', ')),
    ].join(',')
  })
  writeFileSync(outPath, [csvHeader, ...csvRows].join('\n'), 'utf-8')
  console.log(`Cleaned CSV written to: ${outPath}`)

  const prisma = await getPrisma()
  if (!prisma) {
    console.log('Database not available (no DATABASE_URL or unreachable). Use the cleaned CSV above via Admin > Brands > Bulk Upload in batches of 300.')
    process.exit(0)
  }

  let inserted = 0
  let skipped = 0
  const seenEmails = new Set<string>()

  for (let i = 0; i < cleaned.length; i++) {
    const r = cleaned[i]
    if (seenEmails.has(r.email)) {
      skipped++
      continue
    }
    seenEmails.add(r.email)

    try {
      const existing = await prisma.user.findUnique({ where: { email: r.email } })
      if (existing) {
        skipped++
        if ((i + 1) % 100 === 0) console.log(`  Progress: ${i + 1}/${cleaned.length}`)
        continue
      }

      const brandId = await generateBrandId()
      const hashedPassword = await bcrypt.hash('Brand@123', 10)

      await prisma.user.create({
        data: {
          id: brandId,
          email: r.email,
          password: hashedPassword,
          name: r.name,
          phone: null,
          userType: 'brand',
          isActive: true,
          displayOrder: null, // Never featured; admin must set in UI to feature
          brandProfiles: {
            create: {
              company_name: r.companyName,
              industry: r.industry,
              budget_min: r.budgetMin,
              budget_max: r.budgetMax,
              min_size: r.minSize,
              max_size: r.maxSize,
              preferred_locations: r.preferredLocations,
              preferred_property_types: r.preferredPropertyTypes,
              must_have_amenities: r.mustHaveAmenities,
            },
          },
        },
      })
      inserted++
      if ((i + 1) % 50 === 0) console.log(`  Progress: ${i + 1}/${cleaned.length} (inserted: ${inserted})`)
    } catch (e: any) {
      console.error(`Row ${i + 2} (${r.email}):`, e.message)
      skipped++
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
