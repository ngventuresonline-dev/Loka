/**
 * One-time: Clear displayOrder (featured) from bulk-uploaded brands (BP-* ids).
 * Run: npx tsx scripts/clear-bulk-brands-featured.ts
 *
 * Bulk-uploaded brands should NOT appear as featured. This sets displayOrder = null.
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

async function main() {
  const { getPrisma } = await import('../src/lib/get-prisma')
  const prisma = await getPrisma()
  if (!prisma) {
    console.error('Database not available')
    process.exit(1)
  }

  const result = await prisma.user.updateMany({
    where: {
      userType: 'brand',
      id: { startsWith: 'BP-' },
      displayOrder: { not: null },
    },
    data: { displayOrder: null },
  })
  console.log(`Cleared displayOrder (unfeatured) from ${result.count} bulk-uploaded brands`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
