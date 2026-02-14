/**
 * Zod validation schemas for AI Search API
 */

import { z } from 'zod'

export const AISearchRequestSchema = z.object({
  query: z
    .string()
    .min(1, 'Query cannot be empty')
    .max(500, 'Query must be less than 500 characters')
    .trim(),
  conversationHistory: z
    .string()
    .max(10000, 'Conversation history too long')
    .optional(),
  context: z
    .record(z.string(), z.any())
    .optional(),
})

export type AISearchRequest = z.infer<typeof AISearchRequestSchema>
