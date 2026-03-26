import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

  if (!clientEmail || !privateKey || !spreadsheetId) {
    return NextResponse.json({
      ok: false,
      step: 'env-check',
      missing: {
        clientEmail: !clientEmail,
        privateKey: !privateKey,
        spreadsheetId: !spreadsheetId,
      },
    })
  }

  const resolvedKey = privateKey.replace(/\\n/g, '\n')

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: resolvedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Site Visits!A1',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [['TEST ROW — safe to delete', 'sheets connection verified']],
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Row appended to "Site Visits" tab successfully.',
      clientEmail,
      spreadsheetId,
    })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      step: 'api-call',
      error: err?.message || String(err),
      code: err?.code,
      status: err?.status,
      clientEmail,
      spreadsheetId,
      keyLength: resolvedKey.length,
      keyStart: resolvedKey.slice(0, 40),
    })
  }
}
