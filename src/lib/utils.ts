import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string to IST (Asia/Kolkata) timezone
 * @param dateString - ISO date string or Date object
 * @param options - Formatting options
 * @returns Formatted date string in IST
 */
export function formatISTTimestamp(
  dateString: string | Date,
  options?: {
    dateStyle?: 'full' | 'long' | 'medium' | 'short'
    timeStyle?: 'full' | 'long' | 'medium' | 'short'
    format?: string
  }
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const istTime = toZonedTime(date, 'Asia/Kolkata')
  
  if (options?.format) {
    return format(istTime, options.format)
  }
  
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: options?.dateStyle || 'medium',
    timeStyle: options?.timeStyle || 'short'
  })
}

/**
 * Gets current timestamp in IST format
 * @returns ISO string in IST timezone
 */
export function getISTTimestamp(): string {
  const now = new Date()
  const istTime = toZonedTime(now, 'Asia/Kolkata')
  return format(istTime, "yyyy-MM-dd'T'HH:mm:ss.SSS")
}

/**
 * Converts a date to IST formatted string (for database storage)
 * Format: yyyy-MM-dd HH:mm:ss
 */
export function toISTString(date: Date = new Date()): string {
  const istTime = toZonedTime(date, 'Asia/Kolkata')
  return format(istTime, 'yyyy-MM-dd HH:mm:ss')
}

