import { getPrisma } from './get-prisma'

/**
 * Generate a sequential brand ID in the format BP-XXX
 * Finds the highest existing BP-XXX ID and increments it
 */
export async function generateBrandId(): Promise<string> {
  const prisma = await getPrisma()
  if (!prisma) {
    throw new Error('Prisma client not available')
  }

  try {
    // Find the highest BP-XXX ID in users table
    const brands = await prisma.user.findMany({
      where: {
        userType: 'brand',
        id: {
          startsWith: 'BP-'
        }
      },
      orderBy: {
        id: 'desc'
      },
      take: 1,
      select: {
        id: true
      }
    })

    if (brands.length === 0) {
      // No brands with BP-XXX format yet, start from BP-001
      return 'BP-001'
    }

    // Extract the number from the last ID (e.g., "BP-015" -> 15)
    const lastId = brands[0].id
    const match = lastId.match(/BP-(\d+)/)
    
    if (match) {
      const lastNumber = parseInt(match[1], 10)
      const nextNumber = lastNumber + 1
      // Format with leading zeros (e.g., BP-002, BP-015, BP-123)
      return `BP-${nextNumber.toString().padStart(3, '0')}`
    }

    // If format doesn't match, start from BP-001
    return 'BP-001'
  } catch (error) {
    console.error('Error generating brand ID:', error)
    // Fallback: use timestamp-based ID
    return `BP-${Date.now().toString().slice(-6)}`
  }
}

