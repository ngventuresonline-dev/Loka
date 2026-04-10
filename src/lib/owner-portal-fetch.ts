/**
 * Query string for owner API routes. `getAuthenticatedUser` accepts `userId`
 * alone (no email) so phone-lookup sessions from /profile/owner?userId= work.
 */
export type OwnerSession = {
  userId: string
  userEmail?: string | null
}

export function ownerApiQuery(session: OwnerSession): string {
  const q = new URLSearchParams()
  q.set('userId', session.userId)
  const em = typeof session.userEmail === 'string' ? session.userEmail.trim() : ''
  if (em) q.set('userEmail', em)
  return q.toString()
}
