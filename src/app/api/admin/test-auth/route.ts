import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    console.log('[Test Auth] Starting authentication test...')
    console.log('[Test Auth] URL:', request.url)
    console.log('[Test Auth] Query params:', Object.fromEntries(request.nextUrl.searchParams))
    
    const user = await getAuthenticatedUser(request)
    
    if (user) {
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType,
        },
        message: 'Authentication successful'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed - no user found',
        details: {
          url: request.url,
          queryParams: Object.fromEntries(request.nextUrl.searchParams),
          headers: {
            authorization: request.headers.get('authorization') ? 'present' : 'missing',
            cookie: request.headers.get('cookie') ? 'present' : 'missing',
          }
        }
      }, { status: 401 })
    }
  } catch (error: any) {
    console.error('[Test Auth] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

