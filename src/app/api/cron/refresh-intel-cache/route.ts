import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'https://www.lokazen.in'

  const res = await fetch(`${baseUrl}/api/admin/warm-intel-cache`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${process.env.ADMIN_SECRET || 'lokazen-admin-secret'}`,
    },
    body: JSON.stringify({ forceRefresh: false }),
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json({ triggered: true, result: data })
}
