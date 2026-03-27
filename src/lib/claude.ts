import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[Lokazen Intel] ANTHROPIC_API_KEY is not set. Location synthesis will be unavailable.')
}

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
})

export const CLAUDE_MODEL = 'claude-sonnet-4-5'

/**
 * Brand dashboard location synthesis: gap-filling analysis on structured intel.
 * Default Sonnet for reasoning about named places, DB enrichment, and category trade-offs.
 * Override with ANTHROPIC_INTEL_MODEL (e.g. Haiku) if needed.
 */
export const INTEL_SYNTHESIS_MODEL =
  process.env.ANTHROPIC_INTEL_MODEL?.trim() || 'claude-sonnet-4-5'

export const MAX_TOKENS = {
  scoring: 2000,
  reports: 4000,
  /** Synthesis JSON incl. catchment residents / apartments / workplaces */
  insights: 3500,
} as const

export default claude
