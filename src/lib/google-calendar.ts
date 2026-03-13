import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { getPrisma } from './get-prisma'

const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events']

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set in environment`)
  }
  return value
}

export function getGoogleOAuthClient(): OAuth2Client {
  const clientId = getRequiredEnv('GOOGLE_CLIENT_ID')
  const clientSecret = getRequiredEnv('GOOGLE_CLIENT_SECRET')
  const redirectUri = getRequiredEnv('GOOGLE_REDIRECT_URI')

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function getGoogleAuthUrl(): string {
  const oauth2Client = getGoogleOAuthClient()

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: CALENDAR_SCOPES,
  })
}

export async function saveGoogleCalendarTokens(tokens: {
  access_token?: string | null
  refresh_token?: string | null
  scope?: string | null
  token_type?: string | null
  expiry_date?: number | null
}): Promise<void> {
  const prisma = await getPrisma()
  if (!prisma) {
    throw new Error('Prisma client not available')
  }

  if (!tokens.refresh_token) {
    throw new Error('No refresh_token received from Google OAuth')
  }

  const now = new Date()

  await (prisma as any).googleCalendarToken.upsert({
    where: { id: 'primary' },
    create: {
      id: 'primary',
      email: 'ngventuresonline@gmail.com',
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token ?? null,
      scope: tokens.scope ?? null,
      tokenType: tokens.token_type ?? null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token ?? null,
      scope: tokens.scope ?? null,
      tokenType: tokens.token_type ?? null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      updatedAt: now,
    },
  })
}

async function getGoogleCalendarAuthClient(): Promise<OAuth2Client> {
  const prisma = await getPrisma()
  if (!prisma) {
    throw new Error('Prisma client not available')
  }

  const tokenRecord = await (prisma as any).googleCalendarToken.findUnique({
    where: { id: 'primary' },
  })

  if (!tokenRecord || !tokenRecord.refreshToken) {
    throw new Error('Google Calendar is not connected. Visit /api/auth/google to connect it.')
  }

  const oauth2Client = getGoogleOAuthClient()

  oauth2Client.setCredentials({
    refresh_token: tokenRecord.refreshToken,
    access_token: tokenRecord.accessToken ?? undefined,
    scope: tokenRecord.scope ?? undefined,
    token_type: tokenRecord.tokenType ?? undefined,
    expiry_date: tokenRecord.expiryDate ? tokenRecord.expiryDate.getTime() : undefined,
  })

  return oauth2Client
}

interface CreateVisitEventParams {
  propertyId: string
  dateTime: string
  name: string
  email: string
  phone: string
  company?: string
  note?: string
}

export async function createVisitCalendarEvent(params: CreateVisitEventParams): Promise<void> {
  const { propertyId, dateTime, name, email, phone, company, note } = params

  const start = new Date(dateTime)
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid visit dateTime: ${dateTime}`)
  }

  // Default to 1 hour duration
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  const auth = await getGoogleCalendarAuthClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const descriptionLines = [
    `Brand / Contact: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    company ? `Company: ${company}` : null,
    `Property ID: ${propertyId}`,
    note ? `Notes: ${note}` : null,
  ].filter(Boolean)

  await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'all',
    requestBody: {
      summary: `Site Visit - ${name}`,
      description: descriptionLines.join('\n'),
      start: {
        dateTime: start.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: [
        { email },
        { email: 'ngventuresonline@gmail.com' },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    },
  })
}

