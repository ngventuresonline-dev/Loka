import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[Lokazen Intel] ANTHROPIC_API_KEY is not set. Location synthesis will be unavailable.')
}

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
})

export const CLAUDE_MODEL = 'claude-sonnet-4-5'

/**
 * Brand dashboard location synthesis: structured JSON from pre-modelled intel.
 * Defaults to Haiku 4.5 (fast). `claude-3-5-haiku-20241022` was retired from the API.
 * Override with ANTHROPIC_INTEL_MODEL if needed.
 */
export const INTEL_SYNTHESIS_MODEL =
  process.env.ANTHROPIC_INTEL_MODEL?.trim() || 'claude-haiku-4-5'

export const MAX_TOKENS = {
  scoring: 2000,
  reports: 4000,
  /** Synthesis JSON incl. catchment residents / apartments / workplaces */
  insights: 2800,
} as const

export default claude
