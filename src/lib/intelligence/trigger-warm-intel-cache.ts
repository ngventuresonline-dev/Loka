import type { IndustryKey } from '@/lib/intelligence/industry-key'

/**
 * Schedules full location + Claude synthesis pipeline for one property (non-blocking).
 * Used when a listing is approved so narratives are ready before brands open the dashboard.
 * Omit `industry` to warm all canonical industry keys; pass one key for a faster targeted warm.
 */
export function scheduleWarmIntelCacheForProperty(
  propertyId: string,
  options?: { forceRefresh?: boolean; industry?: IndustryKey }
): void {
  const forceRefresh = options?.forceRefresh === true
  const industry = options?.industry
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
  const secret = process.env.ADMIN_SECRET || 'lokazen-admin-secret'

  queueMicrotask(() => {
    fetch(`${baseUrl}/api/admin/warm-intel-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        propertyId,
        forceRefresh,
        ...(industry ? { industry } : {}),
      }),
    }).catch((err) => console.error('[scheduleWarmIntelCacheForProperty]', propertyId, err))
  })
}
