import claude, { CLAUDE_MODEL, MAX_TOKENS } from '@/lib/claude'

export interface AdminInsightsContext {
  totalProperties?: number
  totalBrands?: number
  recentEnquiries?: Array<{
    id?: string
    brandName?: string
    propertyTitle?: string
    locality?: string
    status?: string
    createdAt?: string
    category?: string
  }>
  topLocalities?: Array<{
    locality?: string
    city?: string
    propertyCount?: number
    enquiryCount?: number
  }>
  matchStats?: Array<{
    label?: string
    value?: number | string
  }>
}

function buildInsightsPrompt(question: string, context: AdminInsightsContext): string {
  const lines: string[] = [
    'You are Lokazen\'s AI admin assistant. You have access to the following platform data and must answer the admin\'s question concisely and accurately.',
    '',
    'PLATFORM CONTEXT:',
  ]

  if (context.totalProperties !== undefined) {
    lines.push(`Total active properties: ${context.totalProperties}`)
  }
  if (context.totalBrands !== undefined) {
    lines.push(`Total registered brands: ${context.totalBrands}`)
  }

  if (context.topLocalities && context.topLocalities.length > 0) {
    lines.push('\nTop localities by activity:')
    context.topLocalities.forEach(loc => {
      lines.push(
        `  - ${loc.locality ?? 'Unknown'}, ${loc.city ?? ''}` +
          (loc.propertyCount !== undefined ? ` | Properties: ${loc.propertyCount}` : '') +
          (loc.enquiryCount !== undefined ? ` | Enquiries: ${loc.enquiryCount}` : '')
      )
    })
  }

  if (context.recentEnquiries && context.recentEnquiries.length > 0) {
    lines.push('\nRecent enquiries:')
    context.recentEnquiries.forEach((enq, i) => {
      lines.push(
        `  ${i + 1}. Brand: ${enq.brandName ?? 'N/A'} | Property: ${enq.propertyTitle ?? 'N/A'} | Locality: ${enq.locality ?? 'N/A'} | Category: ${enq.category ?? 'N/A'} | Status: ${enq.status ?? 'N/A'} | Date: ${enq.createdAt ?? 'N/A'}`
      )
    })
  }

  if (context.matchStats && context.matchStats.length > 0) {
    lines.push('\nMatch statistics:')
    context.matchStats.forEach(stat => {
      lines.push(`  - ${stat.label}: ${stat.value}`)
    })
  }

  lines.push('')
  lines.push(`ADMIN QUESTION: ${question}`)
  lines.push('')
  lines.push('Answer the question directly and helpfully. Be specific with numbers and names where the data supports it. If the data is insufficient to fully answer the question, say what you can determine and what additional data would help.')

  return lines.join('\n')
}

export async function generateAdminInsights(
  question: string,
  context: AdminInsightsContext
): Promise<string> {
  const prompt = buildInsightsPrompt(question, context)

  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS.insights,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = message.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('')
    .trim()

  return responseText
}
