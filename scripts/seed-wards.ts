import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const bangaloreWards = [
  {
    wardCode: 'KA_BLR_WARD_145',
    wardName: 'Indiranagar',
    locality: 'Indiranagar',
    latitude: 12.9716,
    longitude: 77.6412,
    population2021: 42000,
    population2026: 44500,
    populationDensity: 28000,
    populationGrowth: 1.2,
    age18_24: 15,
    age25_34: 38,
    age35_44: 28,
    age45_54: 12,
    age55Plus: 7,
    medianAge: 32,
    income6to10L: 22,
    income10to15L: 31,
    incomeAbove15L: 42,
    medianIncome: 1_650_000,
    workingPopulation: 78,
    itProfessionals: 45,
    businessOwners: 18,
    apartments: 75,
    carOwnership: 52,
    diningOutPerWeek: 4.8,
  },
  {
    wardCode: 'KA_BLR_WARD_178',
    wardName: 'Koramangala',
    locality: 'Koramangala',
    latitude: 12.9352,
    longitude: 77.6245,
    population2021: 58000,
    population2026: 62000,
    populationDensity: 32000,
    populationGrowth: 1.4,
    age18_24: 22,
    age25_34: 42,
    age35_44: 24,
    age45_54: 8,
    age55Plus: 4,
    medianAge: 29,
    income6to10L: 18,
    income10to15L: 28,
    incomeAbove15L: 48,
    medianIncome: 1_800_000,
    workingPopulation: 82,
    itProfessionals: 58,
    businessOwners: 22,
    apartments: 82,
    carOwnership: 48,
    diningOutPerWeek: 5.2,
  },
  {
    wardCode: 'KA_BLR_WARD_089',
    wardName: 'Jayanagar',
    locality: 'Jayanagar',
    latitude: 12.925,
    longitude: 77.5838,
    population2021: 65000,
    population2026: 67200,
    populationDensity: 24000,
    populationGrowth: 0.7,
    age18_24: 12,
    age25_34: 28,
    age35_44: 32,
    age45_54: 18,
    age55Plus: 10,
    medianAge: 38,
    income6to10L: 32,
    income10to15L: 28,
    incomeAbove15L: 24,
    medianIncome: 1_200_000,
    workingPopulation: 68,
    itProfessionals: 22,
    businessOwners: 28,
    apartments: 55,
    carOwnership: 38,
    diningOutPerWeek: 3.2,
  },
  // TODO: add ~22 more wards to complete Bangalore coverage
]

async function main() {
  for (const ward of bangaloreWards) {
    await prisma.wardDemographics.upsert({
      where: { wardCode: ward.wardCode },
      update: ward,
      create: ward,
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

