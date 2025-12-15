import 'dotenv/config'
import { getPrisma } from '../src/lib/get-prisma'
import { findMatchingPropertiesForBrand } from '../src/lib/repositories/property-matching-repository'

async function testMatching() {
  console.log('🔍 Testing Property Matching System...\n')

  try {
    const prisma = await getPrisma()
    if (!prisma) {
      console.error('❌ Database connection failed')
      return
    }

    // 1. Check total properties
    const totalProperties = await prisma.property.count()
    console.log(`📊 Total Properties: ${totalProperties}`)

    const availableProperties = await prisma.property.count({
      where: { availability: true }
    })
    console.log(`✅ Available Properties: ${availableProperties}\n`)

    // 2. Check brands with profiles
    const brandsWithProfiles = await prisma.user.findMany({
      where: {
        userType: 'brand',
        brandProfiles: { isNot: null }
      },
      include: {
        brandProfiles: true
      },
      take: 5
    })
    console.log(`👥 Brands with Profiles: ${brandsWithProfiles.length}`)

    if (brandsWithProfiles.length === 0) {
      console.log('⚠️  No brands with profiles found. Creating a test brand...\n')
    } else {
      console.log('\n📋 Sample Brand Profiles:')
      brandsWithProfiles.forEach((brand, idx) => {
        const profile = brand.brandProfiles
        console.log(`\n  Brand ${idx + 1}: ${profile?.company_name || 'N/A'}`)
        console.log(`    Industry: ${profile?.industry || 'N/A'}`)
        console.log(`    Budget: ₹${profile?.budget_min || 0} - ₹${profile?.budget_max || 0}`)
        console.log(`    Size: ${profile?.min_size || 0} - ${profile?.max_size || 0} sqft`)
        console.log(`    Locations: ${JSON.stringify(profile?.preferred_locations || [])}`)
      })
    }

    // 3. Test matching for first brand
    if (brandsWithProfiles.length > 0) {
      const testBrand = brandsWithProfiles[0]
      console.log(`\n\n🧪 Testing Matching for Brand: ${testBrand.brandProfiles?.company_name}`)
      console.log('   Brand ID:', testBrand.id)
      
      try {
        const matches = await findMatchingPropertiesForBrand(testBrand.id, 60)
        console.log(`\n✅ Found ${matches.length} matches (>= 60% score)`)
        
        if (matches.length > 0) {
          console.log('\n📈 Top 3 Matches:')
          matches.slice(0, 3).forEach((match, idx) => {
            console.log(`\n   Match ${idx + 1}:`)
            console.log(`     Property: ${match.property.title}`)
            console.log(`     Location: ${match.property.city}`)
            console.log(`     BFI Score: ${match.bfiScore}%`)
            console.log(`     Breakdown:`, match.breakdown)
          })
        } else {
          console.log('\n⚠️  No matches found. Checking why...')
          
          // Check if properties exist
          const props = await prisma.property.findMany({
            where: { availability: true },
            take: 3
          })
          console.log(`\n   Available properties sample (${props.length}):`)
          props.forEach(p => {
            console.log(`     - ${p.title} (${p.city}) - ${p.size} sqft - ₹${p.price}/${p.priceType}`)
          })
        }
      } catch (error: any) {
        console.error('❌ Error testing matching:', error.message)
        console.error(error.stack)
      }
    }

    // 4. Sample properties in database
    console.log('\n\n📦 Sample Properties in Database:')
    const sampleProps = await prisma.property.findMany({
      where: { availability: true },
      take: 5,
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (sampleProps.length === 0) {
      console.log('   ⚠️  No properties found in database!')
    } else {
      sampleProps.forEach((prop, idx) => {
        console.log(`\n   Property ${idx + 1}:`)
        console.log(`     Title: ${prop.title}`)
        console.log(`     City: ${prop.city}`)
        console.log(`     Type: ${prop.propertyType}`)
        console.log(`     Size: ${prop.size} sqft`)
        console.log(`     Price: ₹${prop.price}/${prop.priceType}`)
        console.log(`     Available: ${prop.availability}`)
      })
    }

    await prisma.$disconnect()
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

testMatching()

