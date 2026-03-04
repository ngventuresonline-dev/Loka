// Seed AreaDemographics from CensusData + AreaGrowthPatterns
// This table is what the enrichment engine queries for infrastructure boost
const { config } = require('dotenv');
config({ path: require('path').resolve(__dirname, '../.env.local') });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const areas = [
  { locality: 'Indiranagar', population2026: 197000, medianIncome2026: 1340000, age25_44_2026: 68, workingPop2026: 70, highIncome2026: 34, diningOutPerWeek: 3.5, cafeVisitsPerWeek: 2.8, avgSpendPerMeal: 650, populationGrowth: 1.8, incomeGrowth: 7.2, newMetroStations: 0, newMalls: 0 },
  { locality: 'Koramangala', population2026: 235000, medianIncome2026: 1260000, age25_44_2026: 64, workingPop2026: 72, highIncome2026: 30, diningOutPerWeek: 3.8, cafeVisitsPerWeek: 3.0, avgSpendPerMeal: 550, populationGrowth: 2.2, incomeGrowth: 8.0, newMetroStations: 0, newMalls: 1 },
  { locality: 'Whitefield', population2026: 410000, medianIncome2026: 1230000, age25_44_2026: 68, workingPop2026: 76, highIncome2026: 32, diningOutPerWeek: 3.6, cafeVisitsPerWeek: 2.5, avgSpendPerMeal: 500, populationGrowth: 4.5, incomeGrowth: 7.5, newMetroStations: 2, newMalls: 3 },
  { locality: 'HSR Layout', population2026: 210000, medianIncome2026: 1050000, age25_44_2026: 62, workingPop2026: 74, highIncome2026: 20, diningOutPerWeek: 3.2, cafeVisitsPerWeek: 2.5, avgSpendPerMeal: 450, populationGrowth: 3.0, incomeGrowth: 7.8, newMetroStations: 1, newMalls: 2 },
  { locality: 'Jayanagar', population2026: 255000, medianIncome2026: 800000, age25_44_2026: 60, workingPop2026: 60, highIncome2026: 14, diningOutPerWeek: 2.4, cafeVisitsPerWeek: 1.8, avgSpendPerMeal: 400, populationGrowth: 2.0, incomeGrowth: 5.5, newMetroStations: 1, newMalls: 0 },
  { locality: 'JP Nagar', population2026: 278000, medianIncome2026: 730000, age25_44_2026: 62, workingPop2026: 64, highIncome2026: 12, diningOutPerWeek: 2.6, cafeVisitsPerWeek: 1.6, avgSpendPerMeal: 380, populationGrowth: 2.5, incomeGrowth: 6.0, newMetroStations: 1, newMalls: 1 },
  { locality: 'BTM Layout', population2026: 302000, medianIncome2026: 560000, age25_44_2026: 58, workingPop2026: 68, highIncome2026: 8, diningOutPerWeek: 3.0, cafeVisitsPerWeek: 2.0, avgSpendPerMeal: 350, populationGrowth: 3.2, incomeGrowth: 6.5, newMetroStations: 0, newMalls: 1 },
];

(async () => {
  for (const a of areas) {
    await p.areaDemographics.upsert({
      where: { locality: a.locality },
      update: a,
      create: a,
    });
  }
  console.log(`AreaDemographics seeded for ${areas.length} localities`);
  await p.$disconnect();
})();
