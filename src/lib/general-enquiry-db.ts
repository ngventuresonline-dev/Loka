/**
 * Raw-SQL helpers for the `general_enquiries` table.
 *
 * This table stores contact-team, landing-page (Natura Walk, Palace Road), and
 * any other enquiry forms that are NOT tied to a specific property record.
 *
 * The table is created lazily on first use (CREATE TABLE IF NOT EXISTS), so no
 * Prisma migration is required. The Prisma client's $executeRaw / $queryRaw
 * are used throughout to remain decoupled from the Prisma schema.
 */

import { getPrisma } from '@/lib/get-prisma'

// Module-level guard so we only attempt to create the table once per cold-start
let tableEnsured = false

export async function ensureGeneralEnquiriesTable(): Promise<void> {
  if (tableEnsured) return
  const prisma = await getPrisma()
  if (!prisma) return
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS general_enquiries (
        id          VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
        source      VARCHAR(100) NOT NULL DEFAULT 'unknown',
        brand_name  VARCHAR(255),
        contact_name VARCHAR(255),
        email       VARCHAR(255),
        phone       VARCHAR(20),
        category    VARCHAR(100),
        unit_size   VARCHAR(100),
        enquiry_type VARCHAR(50),
        notes       TEXT,
        status      VARCHAR(50)  NOT NULL DEFAULT 'pending',
        created_at  TIMESTAMPTZ  DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `)
    tableEnsured = true
  } catch (err) {
    console.error('[general-enquiry-db] Failed to ensure table:', err)
  }
}

export interface GeneralEnquiryInsert {
  source: string          // 'contact-team' | 'natura-walk' | 'palace-road' | ...
  brandName?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
  category?: string | null
  unitSize?: string | null
  enquiryType?: string | null
  notes?: string | null
}

/** Insert a new general enquiry. Non-blocking — call with .catch() at the call-site. */
export async function insertGeneralEnquiry(data: GeneralEnquiryInsert): Promise<void> {
  await ensureGeneralEnquiriesTable()
  const prisma = await getPrisma()
  if (!prisma) {
    console.error('[general-enquiry-db] Prisma not available — enquiry not saved')
    return
  }
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO general_enquiries
         (source, brand_name, contact_name, email, phone, category, unit_size, enquiry_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      data.source,
      data.brandName ?? null,
      data.contactName ?? null,
      data.email ?? null,
      data.phone ?? null,
      data.category ?? null,
      data.unitSize ?? null,
      data.enquiryType ?? null,
      data.notes ?? null,
    )
  } catch (err) {
    console.error('[general-enquiry-db] Insert failed:', err)
    throw err
  }
}

export interface GeneralEnquiryRow {
  id: string
  source: string
  brand_name: string | null
  contact_name: string | null
  email: string | null
  phone: string | null
  category: string | null
  unit_size: string | null
  enquiry_type: string | null
  notes: string | null
  status: string
  created_at: Date | null
  updated_at: Date | null
}

/** Fetch general enquiries with optional status filter. */
export async function fetchGeneralEnquiries(opts: {
  search?: string
  status?: string
  limit?: number
  offset?: number
  sortOrder?: 'asc' | 'desc'
}): Promise<{ rows: GeneralEnquiryRow[]; total: number }> {
  await ensureGeneralEnquiriesTable()
  const prisma = await getPrisma()
  if (!prisma) return { rows: [], total: 0 }

  const { search = '', status = '', limit = 200, offset = 0, sortOrder = 'desc' } = opts
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC'

  try {
    let where = 'WHERE 1=1'
    const params: unknown[] = []
    let idx = 1

    if (status) {
      where += ` AND status = $${idx++}`
      params.push(status)
    }
    if (search) {
      where += ` AND (brand_name ILIKE $${idx} OR contact_name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx} OR source ILIKE $${idx})`
      params.push(`%${search}%`)
      idx++
    }

    const rows = await prisma.$queryRawUnsafe<GeneralEnquiryRow[]>(
      `SELECT * FROM general_enquiries ${where} ORDER BY created_at ${order} LIMIT $${idx} OFFSET $${idx + 1}`,
      ...params,
      limit,
      offset,
    )

    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) as count FROM general_enquiries ${where}`,
      ...params,
    )
    const total = Number(countResult[0]?.count ?? 0)

    return { rows, total }
  } catch (err) {
    // Table might not exist yet or query error — return empty gracefully
    console.error('[general-enquiry-db] Fetch failed:', err)
    return { rows: [], total: 0 }
  }
}

/** Update a general enquiry's status. */
export async function updateGeneralEnquiryStatus(id: string, status: string): Promise<boolean> {
  await ensureGeneralEnquiriesTable()
  const prisma = await getPrisma()
  if (!prisma) return false
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE general_enquiries SET status = $1, updated_at = NOW() WHERE id = $2`,
      status,
      id,
    )
    return true
  } catch (err) {
    console.error('[general-enquiry-db] Status update failed:', err)
    return false
  }
}
