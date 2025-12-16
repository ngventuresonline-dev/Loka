import { PrismaClient, property_type_enum } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local so DATABASE_URL is available
config({ path: resolve(__dirname, '../.env.local') })

const prisma = new PrismaClient()

function buildDescription(p: {
  title: string
  city: string
  size: number
  propertyType: property_type_enum
}) {
  const sizePart = p.size ? `${p.size.toLocaleString()} sq ft` : 'well-sized'
  const cityPart = p.city || 'a prime micro-market'

  let typeSentence = ''

  switch (p.propertyType) {
    case 'retail':
      typeSentence =
        'Designed for high-visibility retail formats with strong walk-in potential.'
      break
    case 'restaurant':
      typeSentence =
        'Ideal for QSR, café or casual dining concepts looking for strong footfalls and delivery density.'
      break
    case 'office':
      typeSentence =
        'Suited for modern office or studio use with flexible layouts and branding potential.'
      break
    case 'warehouse':
      typeSentence =
        'Suitable for last‑mile warehousing, dark store or back‑of‑house operations with easy access to arterial roads.'
      break
    default:
      typeSentence =
        'Flexible commercial unit that can be adapted for multiple brand formats.'
  }

  return `Commercial space in ${cityPart} with ${sizePart} carpet area. ${typeSentence}`
}

async function main() {
  console.log('🔍 Adding descriptions to last 20 properties without description…')

  // Get latest 20 properties (by createdAt; fallback to id ordering)
  const properties = await prisma.property.findMany({
    orderBy: [
      { createdAt: 'desc' },
      { id: 'desc' },
    ],
    take: 20,
    select: {
      id: true,
      title: true,
      city: true,
      size: true,
      propertyType: true,
      description: true,
    },
  })

  if (properties.length === 0) {
    console.log('No properties found.')
    return
  }

  let updated = 0
  for (const p of properties) {
    const hasDescription = p.description && p.description.trim().length > 0
    if (hasDescription) {
      console.log(`⏭️  Skipping ${p.id} (${p.title}) — description already set.`)
      continue
    }

    const description = buildDescription({
      title: p.title,
      city: p.city,
      size: p.size,
      propertyType: p.propertyType,
    })

    await prisma.property.update({
      where: { id: p.id },
      data: { description },
    })

    console.log(`✅ Updated ${p.id} — "${p.title}"`)
    updated++
  }

  console.log(`\n🎉 Done. Updated descriptions for ${updated} properties.`)
}

main()
  .catch((err) => {
    console.error('❌ Error while adding descriptions:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


