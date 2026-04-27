import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma } from '@/lib/get-prisma'
import {
  ADMIN_SESSION_COOKIE,
  isAdminSessionSigningAvailable,
  signAdminSessionCookie,
} from '@/lib/admin-session-cookie'

/**
 * Database-backed admin login.
 * Sets an HttpOnly signed cookie so /api/admin/* routes can authenticate
 * the request without a Supabase JWT.
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 })
    }

    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 })
    }

    if (!isAdminSessionSigningAvailable()) {
      console.error('[admin/login] Set ADMIN_SESSION_SECRET or NEXTAUTH_SECRET (≥16 chars) in Vercel env vars')
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true, userType: true },
    })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
    }

    if (user.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Not an admin account', code: 'NOT_ADMIN' },
        { status: 403 }
      )
    }

    const signed = signAdminSessionCookie(user.id)
    if (!signed) {
      return NextResponse.json({ success: false, error: 'Could not create session' }, { status: 500 })
    }

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, userType: user.userType },
    })

    res.cookies.set(ADMIN_SESSION_COOKIE, signed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return res
  } catch (e: unknown) {
    console.error('[admin/login]', e)
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 })
  }
}
