/**
 * Google AI (Gemini) Service
 * Primary AI engine for Loka - powers search, descriptions, and insights
 * Supports both Gemini Developer API (API key) and Vertex AI (GCP credentials)
 */

import {
  GoogleGenAI,
  createUserContent,
  createModelContent,
} from '@google/genai'

const API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY

/** Default model: Gemini 2.0 Flash - fast, capable, cost-effective */
const DEFAULT_MODEL = 'gemini-2.0-flash'

let ai: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (!ai) {
    if (!API_KEY && !process.env.GOOGLE_GENAI_USE_VERTEXAI) {
      throw new Error(
        'Google AI not configured. Set GOOGLE_AI_API_KEY or GEMINI_API_KEY, or use Vertex AI (GOOGLE_GENAI_USE_VERTEXAI=true).'
      )
    }
    ai = new GoogleGenAI(
      API_KEY
        ? { apiKey: API_KEY }
        : {
            vertexai: true,
            project: process.env.GOOGLE_CLOUD_PROJECT!,
            location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
          }
    )
  }
  return ai
}

/** Check if Google AI is configured */
export function isGoogleAIConfigured(): boolean {
  return !!(API_KEY || process.env.GOOGLE_GENAI_USE_VERTEXAI)
}

export type ChatMessage = { role: 'user' | 'model'; content: string }

export interface GenerateTextOptions {
  systemInstruction?: string
  maxTokens?: number
  temperature?: number
  model?: string
  /** Multi-turn conversation history (user/model alternation) */
  history?: ChatMessage[]
}

/**
 * Generate text from a prompt using Gemini
 * Supports system instructions, chat history, and configurable model
 */
export async function generateText(
  prompt: string,
  options: GenerateTextOptions = {}
): Promise<string> {
  const {
    systemInstruction,
    maxTokens = 1024,
    temperature = 0.7,
    model = DEFAULT_MODEL,
    history = [],
  } = options

  const client = getClient()

  // Build contents: history + current prompt (Content[] or string)
  const contents =
    history.length > 0
      ? [
          ...history.map((msg) =>
            msg.role === 'user'
              ? createUserContent(msg.content)
              : createModelContent(msg.content)
          ),
          createUserContent(prompt),
        ]
      : prompt

  const response = await client.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: systemInstruction || undefined,
      maxOutputTokens: maxTokens,
      temperature,
    },
  })

  const text = response.text
  if (text === undefined || text === null) {
    throw new Error('Empty or invalid response from Gemini API')
  }
  return String(text).trim()
}

/**
 * Lightweight test call for health checks
 */
export async function testConnection(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now()
  try {
    if (!isGoogleAIConfigured()) {
      return { ok: false, error: 'API key not configured', latencyMs: Date.now() - start }
    }
    const client = getClient()
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: 'test',
      config: { maxOutputTokens: 5 },
    })
    const ok = !!(response.text && String(response.text).trim().length > 0)
    return {
      ok: ok ? true : false,
      latencyMs: Date.now() - start,
      error: ok ? undefined : 'Empty response',
    }
  } catch (e: unknown) {
    const err = e as Error
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err?.message || 'Unknown error',
    }
  }
}
