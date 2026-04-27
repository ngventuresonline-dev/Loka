import { NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-cookie'

export async function POST() {
  const res = NextResponse.json({ success: true })
  const secure = process.env.NODE_ENV === 'production'
  res.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
