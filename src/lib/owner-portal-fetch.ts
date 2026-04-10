import type { User } from '@/lib/auth'

export function ownerApiQuery(user: Pick<User, 'id' | 'email'>): string {
  const q = new URLSearchParams()
  q.set('userId', user.id)
  q.set('userEmail', user.email)
  return q.toString()
}
