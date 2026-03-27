import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-security'
import { generateAdminInsights, type AdminInsightsContext } from '@/lib/intelligence/admin-insights'

export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth(request)
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: authResult.statusCode || 401 }
    )
  }

  let body: { question?: string; context?: AdminInsightsContext }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { question, context = {} } = body
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 })
  }

  try {
    const answer = await generateAdminInsights(question.trim(), context)
    return NextResponse.json({ answer })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Admin Insights] Claude call failed:', message)
    return NextResponse.json(
      { error: 'Could not generate insights at this time' },
      { status: 500 }
    )
  }
}
