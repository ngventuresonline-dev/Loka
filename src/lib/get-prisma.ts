/**
 * Shared utility for dynamic Prisma import
 * Used in API routes to avoid build-time issues
 */

export async function getPrisma() {
  try {
    const prismaModule = await import('./prisma')
    return prismaModule.prisma
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to import Prisma:', e)
    }
    return null
  }
}

