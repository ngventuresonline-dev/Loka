import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[Lokazen Intel] ANTHROPIC_API_KEY is not set. Location synthesis will be unavailable.')
}

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
})

export const CLAUDE_MODEL = 'claude-sonnet-4-5'

export const MAX_TOKENS = {
  scoring: 2000,
  reports: 4000,
  /** Brand dashboard: full-tab location synthesis JSON (single pass) */
  insights: 4000,
} as const

export default claude
