import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[Lokazen Intel] ANTHROPIC_API_KEY is not set. Location synthesis will be unavailable.')
}

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
})

export const CLAUDE_MODEL = 'claude-sonnet-4-5'

/**
 * Brand dashboard synthesis — Sonnet only (faster models were retired for this path).
 * If ANTHROPIC_INTEL_MODEL is set, it must be a Sonnet id or we fall back to 4.5.
 */
const envIntel = process.env.ANTHROPIC_INTEL_MODEL?.trim()
export const INTEL_SYNTHESIS_MODEL =
  envIntel && /sonnet/i.test(envIntel) ? envIntel : 'claude-sonnet-4-5'

export const MAX_TOKENS = {
  scoring: 2000,
  reports: 4000,
  /** Full LocationSynthesis JSON — allow headroom; cost acceptable for this product surface */
  insights: 8192,
} as const

export default claude
