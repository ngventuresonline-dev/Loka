import { getPrisma } from './get-prisma'

/**
 * Generate a sequential property ID in the format prop-XXX
 * Finds the highest existing prop-XXX ID and increments it
 */
export async function generatePropertyId(): Promise<string> {
  const prisma = await getPrisma()
  if (!prisma) {
    throw new Error('Prisma client not available')
  }

  try {
    // Find the highest prop-XXX ID
    const properties = await prisma.property.findMany({
      where: {
        id: {
          startsWith: 'prop-'
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

    if (properties.length === 0) {
      // No properties with prop-XXX format yet, start from prop-001
      return 'prop-001'
    }

    // Extract the number from the last ID (e.g., "prop-015" -> 15)
    const lastId = properties[0].id
    const match = lastId.match(/prop-(\d+)/)
    
    if (match) {
      const lastNumber = parseInt(match[1], 10)
      const nextNumber = lastNumber + 1
      // Format with leading zeros (e.g., prop-002, prop-015, prop-123)
      return `prop-${nextNumber.toString().padStart(3, '0')}`
    }

    // If format doesn't match, start from prop-001
    return 'prop-001'
  } catch (error) {
    console.error('Error generating property ID:', error)
    // Fallback: use timestamp-based ID
    return `prop-${Date.now().toString().slice(-6)}`
  }
}

