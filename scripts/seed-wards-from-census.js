/**
 * Populate ward_demographics for all 24 wards using census_data as the source.
 * Maps census fields → ward_demographics fields so the enrichment engine
 * can find the nearest ward for ANY Bangalore property.
 */
const { config } = require('dotenv');
config({ path: require('path').resolve(__dirname, '../.env.local') });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const censusRows = await p.censusData.findMany();
  console.log(`Found ${censusRows.length} census wards to sync into ward_demographics\n`);

  let created = 0, updated = 0;

  for (const c of censusRows) {
    // Map wardId → wardCode (e.g. WARD_INDIRANAGAR → KA_BLR_WARD_INDIRANAGAR)
    const wardCode = `KA_BLR_${c.wardId}`;
    const locality = c.wardName;

    // Estimate 2021 and 2026 population (census is ~2025 baseline)
    const population2021 = Math.round(c.totalPopulation * 0.94); // ~6% growth over 4 years
    const population2026 = Math.round(c.totalPopulation * 1.02); // ~2% growth over 1 year

    // Map age brackets: census has age0_17, age55_64, age65Plus → combine for ward schema
    const age55Plus = (c.age55_64 || 0) + (c.age65Plus || 0);

    // Estimate lifestyle fields from census data
    const itProfessionals = Math.round(c.graduatePercent * 0.7); // proxy: 70% of graduates in IT
    const businessOwners = Math.round(100 - c.workingPopPercent) * 0.3; // proxy
    const apartments = Math.round(c.fourWheelerPercent * 1.5); // proxy: car owners tend to be in apts
    const carOwnership = c.fourWheelerPercent;

    const wardData = {
      wardName: c.wardName,
      locality,
      city: c.city || 'Bangalore',
      latitude: c.latitude,
      longitude: c.longitude,
      population2021,
      population2026,
      populationDensity: c.populationDensity,
      populationGrowth: ((population2026 - population2021) / population2021) * 100 / 5, // annual %
      age18_24: c.age18_24,
      age25_34: c.age25_34,
      age35_44: c.age35_44,
      age45_54: c.age45_54,
      age55Plus,
      medianAge: c.medianAge,
      income6to10L: c.income6to10L,
      income10to15L: c.income10to15L,
      incomeAbove15L: c.incomeAbove15L,
      medianIncome: c.medianIncome,
      workingPopulation: c.workingPopPercent,
      itProfessionals,
      businessOwners,
      apartments,
      carOwnership,
      diningOutPerWeek: c.diningOutFreq,
    };

    // Upsert: update existing 3 wards, create the other 21
    await p.wardDemographics.upsert({
      where: { wardCode },
      update: wardData,
      create: { wardCode, ...wardData },
    });

    console.log(`  ✓ ${wardCode} | ${c.wardName} | pop: ${c.totalPopulation.toLocaleString('en-IN')} | income: ₹${c.medianIncome.toLocaleString('en-IN')}`);
    created++;
  }

  console.log(`\nDone: ${created} wards synced into ward_demographics`);
  await p.$disconnect();
})();
