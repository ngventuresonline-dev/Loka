import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAuthUrl, getGoogleOAuthClient, saveGoogleCalendarTokens } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  // Step 1: No code -> redirect user to Google consent screen
  if (!code) {
    try {
      const authUrl = getGoogleAuthUrl()
      return NextResponse.redirect(authUrl)
    } catch (error: any) {
      console.error('[Google OAuth] Failed to generate auth URL:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to start Google OAuth' },
        { status: 500 }
      )
    }
  }

  // Step 2: We have a code -> exchange for tokens and store refresh token
  try {
    const oauth2Client = getGoogleOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)

    await saveGoogleCalendarTokens({
      access_token: tokens.access_token ?? null,
      refresh_token: tokens.refresh_token ?? null,
      scope: tokens.scope ?? null,
      token_type: tokens.token_type ?? null,
      expiry_date: tokens.expiry_date ?? null,
    })

    const redirectTarget = new URL('/', url.origin)
    redirectTarget.searchParams.set('googleCalendar', 'connected')

    return NextResponse.redirect(redirectTarget.toString())
  } catch (error: any) {
    console.error('[Google OAuth] Failed to handle callback:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete Google OAuth' },
      { status: 500 }
    )
  }
}

