/**
 * Password validation utilities
 * Enforces strong password requirements
 */

import { z } from 'zod'

/**
 * Password strength validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

/**
 * Validate password strength
 * Returns validation result with helpful error messages
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get password strength score (0-4)
 * 0 = very weak, 4 = very strong
 */
export function getPasswordStrength(password: string): {
  score: number
  label: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong'
} {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  // Cap at 4
  score = Math.min(score, 4)

  const labels: Array<'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong'> = [
    'very-weak',
    'weak',
    'medium',
    'strong',
    'very-strong',
  ]

  return {
    score,
    label: labels[score],
  }
}
