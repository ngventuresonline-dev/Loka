import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[Claude] ANTHROPIC_API_KEY is not set. Claude features will not work.')
}

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
})

export const CLAUDE_MODEL = 'claude-sonnet-4-5'

export const MAX_TOKENS = {
  scoring: 2000,
  reports: 4000,
  /** Brand dashboard: narrative + liveEconomics JSON */
  insights: 3500,
} as const

export default claude
