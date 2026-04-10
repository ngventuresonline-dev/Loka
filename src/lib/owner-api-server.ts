import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import type { ApiUser } from '@/lib/api-auth'
import type { Prisma } from '@prisma/client'

export async function requireOwnerApiUser(
  request: NextRequest
): Promise<{ user: ApiUser } | { response: NextResponse }> {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (user.userType !== 'owner') {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user }
}

export function ownerInquiryFilter(ownerId: string): Prisma.InquiryWhereInput {
  return {
    OR: [{ ownerId }, { ownerId: null, property: { ownerId } }],
  }
}
