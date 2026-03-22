import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAdminAuth } from '@/lib/admin-security'

export async function POST(request: NextRequest) {
  const security = await requireAdminAuth(request)
  if (!security.authorized) {
    return NextResponse.json(
      { error: security.error || 'Unauthorized' },
      { status: security.statusCode || 401 }
    )
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI (Claude) is not configured. Set ANTHROPIC_API_KEY.' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { subject = '', body: bodyText = '' } = body as { subject?: string; body?: string }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are helping refine a B2B email sent by GVS Ventures (commercial real estate) to brands about matched properties in Bangalore. Improve the subject line and body to be professional, concise, and engaging. Keep these as literal placeholders: {{brandName}} (company name), {{contactName}} (contact person). Do not replace them.

Current subject: ${subject || '(empty)'}
Current body: ${bodyText || '(empty)'}

Return a JSON object only, no markdown, no explanation:
{"subject": "improved subject line", "body": "improved body text (use \\n\\n for paragraph breaks)"}`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text =
      message.content?.[0]?.type === 'text'
        ? (message.content[0] as { text: string }).text
        : ''
    const trimmed = text.trim().replace(/^```json\s*|\s*```$/g, '')
    const parsed = JSON.parse(trimmed) as { subject?: string; body?: string }

    return NextResponse.json({
      subject: parsed.subject ?? subject,
      body: parsed.body ?? bodyText,
    })
  } catch (error: any) {
    console.error('[Admin Matches Email Edit AI] Error:', error)
    return NextResponse.json(
      { error: error.message || 'AI edit failed' },
      { status: 500 }
    )
  }
}
