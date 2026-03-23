/**
 * Google Sheets sync helper — appends rows to a named sheet tab.
 *
 * Authentication uses a Service Account (JWT), not OAuth. Credentials are read
 * from environment variables so they never live in source control.
 *
 * Usage (fire-and-forget — never blocks the main request):
 *   appendToSheet("Site Visits", [col1, col2, ...]).catch(console.error)
 */

import { google } from 'googleapis'

/** Replace any null / undefined / empty string with an em-dash placeholder. */
function safe(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

/**
 * Append a single row to the named sheet tab in the configured spreadsheet.
 *
 * @param sheetName  Exact name of the tab (e.g. "Site Visits")
 * @param row        Array of cell values — first element should always be the IST timestamp
 */
export async function appendToSheet(sheetName: string, row: string[]): Promise<void> {
  try {
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.warn('[Sheets] Missing credentials — skipping sheet sync (GOOGLE_SHEETS_* env vars not set)')
      return
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row.map(safe)],
      },
    })

    console.log(`[Sheets] Appended row to "${sheetName}"`)
  } catch (err) {
    console.error(`[Sheets] Failed to append row to "${sheetName}":`, err)
  }
}

/** Convenience: IST timestamp string for the first column of every row. */
export function istTimestamp(): string {
  return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
}
