/**
 * Seed CensusData with Bangalore ward-level demographics.
 *
 * Run: npm run db:seed-census
 * Or: npx tsx scripts/seed-census-data.ts
 *
 * Data: Proxy/estimated values based on Census 2011/2021 patterns, BBMP area
 * structure, and india-benchmarks.ts (Bangalore pop ~13.2M, median age ~29).
 * Aligns wardIds with AreaGrowthPatterns (WARD_INDIRANAGAR etc.) for 2026 projections.
 * See docs/LOCATION_INTELLIGENCE_1000.md
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'
import { TOP_INDIA_CITIES_POPULATION } from '../src/lib/location-intelligence/india-benchmarks'

config({ path: resolve(__dirname, '../.env.local') })

const prisma = new PrismaClient()

/** Bangalore total population (2025) from india-benchmarks */
const BANGALORE_POP = TOP_INDIA_CITIES_POPULATION['bangalore'] ?? 13_187_098

/** Ward-level seed: lat/lng centroid + demographics. Values align with FOOTFALL_GEOIQ.md and india-benchmarks. */
const BANGALORE_WARDS: Array<{
  wardId: string
  wardName: string
  lat: number
  lng: number
  totalPopulation: number
  populationDensity: number
  malePercent: number
  femalePercent: number
  age0_17: number
  age18_24: number
  age25_34: number
  age35_44: number
  age45_54: number
  age55_64: number
  age65Plus: number
  medianAge: number
  avgHouseholdSize: number
  literacyRate: number
  graduatePercent: number
  postGradPercent: number
  workingPopPercent: number
  medianIncome: number
  incomeUnder3L: number
  income3to6L: number
  income6to10L: number
  income10to15L: number
  incomeAbove15L: number
  vehicleOwnership: number
  twoWheelerPercent: number
  fourWheelerPercent: number
  vegetarianPercent: number
  gymMembershipRate: number
  diningOutFreq: number
}> = [
  { wardId: 'WARD_INDIRANAGAR', wardName: 'Indiranagar', lat: 12.9784, lng: 77.6408, totalPopulation: 185000, populationDensity: 18500, malePercent: 52, femalePercent: 48, age0_17: 18, age18_24: 24, age25_34: 44, age35_44: 22, age45_54: 8, age55_64: 3, age65Plus: 1, medianAge: 28, avgHouseholdSize: 3.2, literacyRate: 95, graduatePercent: 58, postGradPercent: 22, workingPopPercent: 68, medianIncome: 1250000, incomeUnder3L: 12, income3to6L: 18, income6to10L: 22, income10to15L: 18, incomeAbove15L: 30, vehicleOwnership: 0.72, twoWheelerPercent: 55, fourWheelerPercent: 35, vegetarianPercent: 42, gymMembershipRate: 22, diningOutFreq: 3.2 },
  { wardId: 'WARD_KORAMANGALA', wardName: 'Koramangala', lat: 12.9352, lng: 77.6245, totalPopulation: 220000, populationDensity: 19200, malePercent: 53, femalePercent: 47, age0_17: 16, age18_24: 26, age25_34: 40, age35_44: 24, age45_54: 10, age55_64: 3, age65Plus: 1, medianAge: 29, avgHouseholdSize: 3.0, literacyRate: 96, graduatePercent: 62, postGradPercent: 24, workingPopPercent: 70, medianIncome: 1180000, incomeUnder3L: 10, income3to6L: 16, income6to10L: 24, income10to15L: 22, incomeAbove15L: 28, vehicleOwnership: 0.75, twoWheelerPercent: 52, fourWheelerPercent: 38, vegetarianPercent: 45, gymMembershipRate: 24, diningOutFreq: 3.5 },
  { wardId: 'WARD_HSR_LAYOUT', wardName: 'HSR Layout', lat: 12.9121, lng: 77.6446, totalPopulation: 195000, populationDensity: 17800, malePercent: 54, femalePercent: 46, age0_17: 17, age18_24: 28, age25_34: 42, age35_44: 20, age45_54: 9, age55_64: 3, age65Plus: 1, medianAge: 27, avgHouseholdSize: 3.1, literacyRate: 94, graduatePercent: 56, postGradPercent: 20, workingPopPercent: 72, medianIncome: 980000, incomeUnder3L: 14, income3to6L: 22, income6to10L: 28, income10to15L: 18, incomeAbove15L: 18, vehicleOwnership: 0.68, twoWheelerPercent: 58, fourWheelerPercent: 28, vegetarianPercent: 48, gymMembershipRate: 26, diningOutFreq: 3.0 },
  { wardId: 'WARD_JAYANAGAR', wardName: 'Jayanagar', lat: 12.925, lng: 77.5936, totalPopulation: 240000, populationDensity: 16800, malePercent: 51, femalePercent: 49, age0_17: 22, age18_24: 20, age25_34: 32, age35_44: 28, age45_54: 12, age55_64: 4, age65Plus: 2, medianAge: 32, avgHouseholdSize: 3.6, literacyRate: 92, graduatePercent: 48, postGradPercent: 14, workingPopPercent: 58, medianIncome: 750000, incomeUnder3L: 22, income3to6L: 28, income6to10L: 24, income10to15L: 14, incomeAbove15L: 12, vehicleOwnership: 0.58, twoWheelerPercent: 62, fourWheelerPercent: 22, vegetarianPercent: 65, gymMembershipRate: 14, diningOutFreq: 2.2 },
  { wardId: 'WARD_JP_NAGAR', wardName: 'JP Nagar', lat: 12.9063, lng: 77.5857, totalPopulation: 260000, populationDensity: 16200, malePercent: 52, femalePercent: 48, age0_17: 21, age18_24: 22, age25_34: 36, age35_44: 26, age45_54: 11, age55_64: 3, age65Plus: 1, medianAge: 30, avgHouseholdSize: 3.5, literacyRate: 91, graduatePercent: 44, postGradPercent: 12, workingPopPercent: 62, medianIncome: 680000, incomeUnder3L: 24, income3to6L: 30, income6to10L: 24, income10to15L: 12, incomeAbove15L: 10, vehicleOwnership: 0.55, twoWheelerPercent: 64, fourWheelerPercent: 20, vegetarianPercent: 60, gymMembershipRate: 12, diningOutFreq: 2.4 },
  { wardId: 'WARD_BTM_LAYOUT', wardName: 'BTM Layout', lat: 12.9166, lng: 77.6101, totalPopulation: 280000, populationDensity: 22000, malePercent: 55, femalePercent: 45, age0_17: 19, age18_24: 30, age25_34: 38, age35_44: 20, age45_54: 8, age55_64: 3, age65Plus: 2, medianAge: 27, avgHouseholdSize: 3.0, literacyRate: 88, graduatePercent: 42, postGradPercent: 10, workingPopPercent: 66, medianIncome: 520000, incomeUnder3L: 28, income3to6L: 32, income6to10L: 24, income10to15L: 10, incomeAbove15L: 6, vehicleOwnership: 0.48, twoWheelerPercent: 68, fourWheelerPercent: 12, vegetarianPercent: 52, gymMembershipRate: 10, diningOutFreq: 2.8 },
  { wardId: 'WARD_MG_ROAD', wardName: 'MG Road', lat: 12.975, lng: 77.6063, totalPopulation: 62000, populationDensity: 15500, malePercent: 56, femalePercent: 44, age0_17: 12, age18_24: 22, age25_34: 38, age35_44: 26, age45_54: 14, age55_64: 6, age65Plus: 2, medianAge: 31, avgHouseholdSize: 2.6, literacyRate: 97, graduatePercent: 68, postGradPercent: 28, workingPopPercent: 78, medianIncome: 1350000, incomeUnder3L: 8, income3to6L: 12, income6to10L: 18, income10to15L: 22, incomeAbove15L: 40, vehicleOwnership: 0.78, twoWheelerPercent: 40, fourWheelerPercent: 48, vegetarianPercent: 38, gymMembershipRate: 28, diningOutFreq: 3.8 },
  { wardId: 'WARD_UB_CITY', wardName: 'UB City', lat: 12.9716, lng: 77.5946, totalPopulation: 28000, populationDensity: 12000, malePercent: 57, femalePercent: 43, age0_17: 8, age18_24: 18, age25_34: 40, age35_44: 28, age45_54: 14, age55_64: 8, age65Plus: 4, medianAge: 33, avgHouseholdSize: 2.4, literacyRate: 98, graduatePercent: 72, postGradPercent: 32, workingPopPercent: 82, medianIncome: 1650000, incomeUnder3L: 5, income3to6L: 8, income6to10L: 12, income10to15L: 20, incomeAbove15L: 55, vehicleOwnership: 0.85, twoWheelerPercent: 25, fourWheelerPercent: 62, vegetarianPercent: 32, gymMembershipRate: 32, diningOutFreq: 4.2 },
  { wardId: 'WARD_WHITEFIELD', wardName: 'Whitefield', lat: 12.9698, lng: 77.7499, totalPopulation: 380000, populationDensity: 14200, malePercent: 55, femalePercent: 45, age0_17: 18, age18_24: 24, age25_34: 44, age35_44: 24, age45_54: 8, age55_64: 2, age65Plus: 0, medianAge: 28, avgHouseholdSize: 3.2, literacyRate: 96, graduatePercent: 64, postGradPercent: 26, workingPopPercent: 74, medianIncome: 1150000, incomeUnder3L: 10, income3to6L: 14, income6to10L: 22, income10to15L: 24, incomeAbove15L: 30, vehicleOwnership: 0.76, twoWheelerPercent: 48, fourWheelerPercent: 40, vegetarianPercent: 44, gymMembershipRate: 26, diningOutFreq: 3.4 },
  { wardId: 'WARD_MARATHAHALLI', wardName: 'Marathahalli', lat: 12.9593, lng: 77.6974, totalPopulation: 320000, populationDensity: 19800, malePercent: 56, femalePercent: 44, age0_17: 17, age18_24: 26, age25_34: 42, age35_44: 22, age45_54: 9, age55_64: 3, age65Plus: 1, medianAge: 28, avgHouseholdSize: 3.0, literacyRate: 93, graduatePercent: 54, postGradPercent: 18, workingPopPercent: 70, medianIncome: 920000, incomeUnder3L: 16, income3to6L: 24, income6to10L: 28, income10to15L: 18, incomeAbove15L: 14, vehicleOwnership: 0.65, twoWheelerPercent: 58, fourWheelerPercent: 28, vegetarianPercent: 48, gymMembershipRate: 20, diningOutFreq: 2.9 },
  { wardId: 'WARD_BELLANDUR', wardName: 'Bellandur', lat: 12.926, lng: 77.6762, totalPopulation: 285000, populationDensity: 18500, malePercent: 55, femalePercent: 45, age0_17: 16, age18_24: 25, age25_34: 45, age35_44: 24, age45_54: 7, age55_64: 2, age65Plus: 1, medianAge: 28, avgHouseholdSize: 3.1, literacyRate: 95, graduatePercent: 60, postGradPercent: 22, workingPopPercent: 72, medianIncome: 1080000, incomeUnder3L: 12, income3to6L: 18, income6to10L: 24, income10to15L: 22, incomeAbove15L: 24, vehicleOwnership: 0.72, twoWheelerPercent: 52, fourWheelerPercent: 36, vegetarianPercent: 46, gymMembershipRate: 24, diningOutFreq: 3.2 },
  { wardId: 'WARD_ELECTRONIC_CITY', wardName: 'Electronic City', lat: 12.8456, lng: 77.6603, totalPopulation: 350000, populationDensity: 16500, malePercent: 58, femalePercent: 42, age0_17: 15, age18_24: 26, age25_34: 46, age35_44: 22, age45_54: 8, age55_64: 2, age65Plus: 1, medianAge: 27, avgHouseholdSize: 2.9, literacyRate: 94, graduatePercent: 62, postGradPercent: 20, workingPopPercent: 76, medianIncome: 1020000, incomeUnder3L: 12, income3to6L: 20, income6to10L: 28, income10to15L: 22, incomeAbove15L: 18, vehicleOwnership: 0.68, twoWheelerPercent: 56, fourWheelerPercent: 30, vegetarianPercent: 48, gymMembershipRate: 22, diningOutFreq: 2.8 },
  { wardId: 'WARD_BRIGADE_ROAD', wardName: 'Brigade Road', lat: 12.9714, lng: 77.6061, totalPopulation: 45000, populationDensity: 14000, malePercent: 54, femalePercent: 46, age0_17: 14, age18_24: 24, age25_34: 36, age35_44: 26, age45_54: 12, age55_64: 5, age65Plus: 3, medianAge: 30, avgHouseholdSize: 2.8, literacyRate: 96, graduatePercent: 58, postGradPercent: 20, workingPopPercent: 72, medianIncome: 1180000, incomeUnder3L: 10, income3to6L: 16, income6to10L: 22, income10to15L: 24, incomeAbove15L: 28, vehicleOwnership: 0.72, twoWheelerPercent: 48, fourWheelerPercent: 38, vegetarianPercent: 40, gymMembershipRate: 22, diningOutFreq: 3.6 },
  { wardId: 'WARD_CUNNINGHAM_ROAD', wardName: 'Cunningham Road', lat: 12.9882, lng: 77.6052, totalPopulation: 52000, populationDensity: 13200, malePercent: 53, femalePercent: 47, age0_17: 16, age18_24: 22, age25_34: 38, age35_44: 26, age45_54: 12, age55_64: 4, age65Plus: 2, medianAge: 30, avgHouseholdSize: 2.9, literacyRate: 95, graduatePercent: 60, postGradPercent: 22, workingPopPercent: 70, medianIncome: 1220000, incomeUnder3L: 10, income3to6L: 14, income6to10L: 20, income10to15L: 24, incomeAbove15L: 32, vehicleOwnership: 0.75, twoWheelerPercent: 42, fourWheelerPercent: 44, vegetarianPercent: 42, gymMembershipRate: 24, diningOutFreq: 3.4 },
  { wardId: 'WARD_SARJAPUR_ROAD', wardName: 'Sarjapur Road', lat: 12.9102, lng: 77.6878, totalPopulation: 210000, populationDensity: 15200, malePercent: 54, femalePercent: 46, age0_17: 18, age18_24: 26, age25_34: 42, age35_44: 22, age45_54: 8, age55_64: 3, age65Plus: 1, medianAge: 28, avgHouseholdSize: 3.2, literacyRate: 94, graduatePercent: 58, postGradPercent: 20, workingPopPercent: 70, medianIncome: 1050000, incomeUnder3L: 12, income3to6L: 18, income6to10L: 26, income10to15L: 22, incomeAbove15L: 22, vehicleOwnership: 0.72, twoWheelerPercent: 52, fourWheelerPercent: 34, vegetarianPercent: 46, gymMembershipRate: 24, diningOutFreq: 3.1 },
  { wardId: 'WARD_INDIRANAGAR_100FT', wardName: '100ft Road Indiranagar', lat: 12.9782, lng: 77.6392, totalPopulation: 95000, populationDensity: 19500, malePercent: 52, femalePercent: 48, age0_17: 16, age18_24: 25, age25_34: 44, age35_44: 24, age45_54: 8, age55_64: 2, age65Plus: 1, medianAge: 28, avgHouseholdSize: 3.0, literacyRate: 96, graduatePercent: 60, postGradPercent: 24, workingPopPercent: 72, medianIncome: 1280000, incomeUnder3L: 10, income3to6L: 14, income6to10L: 20, income10to15L: 22, incomeAbove15L: 34, vehicleOwnership: 0.76, twoWheelerPercent: 48, fourWheelerPercent: 40, vegetarianPercent: 40, gymMembershipRate: 26, diningOutFreq: 3.5 },
  { wardId: 'WARD_BANASHANKARI', wardName: 'Banashankari', lat: 12.9254, lng: 77.5468, totalPopulation: 310000, populationDensity: 17200, malePercent: 51, femalePercent: 49, age0_17: 22, age18_24: 20, age25_34: 34, age35_44: 26, age45_54: 12, age55_64: 4, age65Plus: 2, medianAge: 31, avgHouseholdSize: 3.5, literacyRate: 90, graduatePercent: 42, postGradPercent: 10, workingPopPercent: 58, medianIncome: 620000, incomeUnder3L: 26, income3to6L: 32, income6to10L: 24, income10to15L: 10, incomeAbove15L: 8, vehicleOwnership: 0.52, twoWheelerPercent: 66, fourWheelerPercent: 18, vegetarianPercent: 62, gymMembershipRate: 12, diningOutFreq: 2.2 },
  { wardId: 'WARD_MALLESHWARAM', wardName: 'Malleswaram', lat: 13.0035, lng: 77.5648, totalPopulation: 180000, populationDensity: 15800, malePercent: 52, femalePercent: 48, age0_17: 20, age18_24: 22, age25_34: 34, age35_44: 26, age45_54: 12, age55_64: 4, age65Plus: 2, medianAge: 31, avgHouseholdSize: 3.4, literacyRate: 93, graduatePercent: 50, postGradPercent: 14, workingPopPercent: 60, medianIncome: 720000, incomeUnder3L: 20, income3to6L: 28, income6to10L: 26, income10to15L: 14, incomeAbove15L: 12, vehicleOwnership: 0.58, twoWheelerPercent: 60, fourWheelerPercent: 24, vegetarianPercent: 68, gymMembershipRate: 14, diningOutFreq: 2.4 },
  { wardId: 'WARD_RAJAJINAGAR', wardName: 'Rajajinagar', lat: 13.0102, lng: 77.5534, totalPopulation: 195000, populationDensity: 16800, malePercent: 52, femalePercent: 48, age0_17: 21, age18_24: 22, age25_34: 34, age35_44: 26, age45_54: 11, age55_64: 4, age65Plus: 2, medianAge: 30, avgHouseholdSize: 3.4, literacyRate: 90, graduatePercent: 44, postGradPercent: 10, workingPopPercent: 58, medianIncome: 650000, incomeUnder3L: 24, income3to6L: 30, income6to10L: 26, income10to15L: 12, incomeAbove15L: 8, vehicleOwnership: 0.54, twoWheelerPercent: 64, fourWheelerPercent: 20, vegetarianPercent: 64, gymMembershipRate: 12, diningOutFreq: 2.3 },
  { wardId: 'WARD_BASVANAGUDI', wardName: 'Basavanagudi', lat: 12.9422, lng: 77.5736, totalPopulation: 145000, populationDensity: 15200, malePercent: 51, femalePercent: 49, age0_17: 23, age18_24: 20, age25_34: 30, age35_44: 28, age45_54: 12, age55_64: 5, age65Plus: 2, medianAge: 32, avgHouseholdSize: 3.6, literacyRate: 92, graduatePercent: 46, postGradPercent: 12, workingPopPercent: 55, medianIncome: 680000, incomeUnder3L: 24, income3to6L: 30, income6to10L: 24, income10to15L: 12, incomeAbove15L: 10, vehicleOwnership: 0.56, twoWheelerPercent: 62, fourWheelerPercent: 22, vegetarianPercent: 70, gymMembershipRate: 12, diningOutFreq: 2.2 },
  { wardId: 'WARD_YESHWANTPUR', wardName: 'Yeshwanthpur', lat: 13.0285, lng: 77.5342, totalPopulation: 220000, populationDensity: 18500, malePercent: 53, femalePercent: 47, age0_17: 19, age18_24: 24, age25_34: 38, age35_44: 24, age45_54: 10, age55_64: 3, age65Plus: 2, medianAge: 29, avgHouseholdSize: 3.2, literacyRate: 91, graduatePercent: 48, postGradPercent: 14, workingPopPercent: 64, medianIncome: 780000, incomeUnder3L: 20, income3to6L: 28, income6to10L: 26, income10to15L: 14, incomeAbove15L: 12, vehicleOwnership: 0.60, twoWheelerPercent: 58, fourWheelerPercent: 26, vegetarianPercent: 58, gymMembershipRate: 16, diningOutFreq: 2.6 },
  { wardId: 'WARD_HRBR_LAYOUT', wardName: 'HRBR Layout', lat: 13.0122, lng: 77.6422, totalPopulation: 115000, populationDensity: 16200, malePercent: 53, femalePercent: 47, age0_17: 18, age18_24: 24, age25_34: 40, age35_44: 24, age45_54: 10, age55_64: 3, age65Plus: 1, medianAge: 29, avgHouseholdSize: 3.2, literacyRate: 94, graduatePercent: 54, postGradPercent: 18, workingPopPercent: 68, medianIncome: 920000, incomeUnder3L: 14, income3to6L: 22, income6to10L: 28, income10to15L: 20, incomeAbove15L: 16, vehicleOwnership: 0.66, twoWheelerPercent: 56, fourWheelerPercent: 28, vegetarianPercent: 50, gymMembershipRate: 20, diningOutFreq: 2.9 },
  { wardId: 'WARD_KALYAN_NAGAR', wardName: 'Kalyan Nagar', lat: 13.0202, lng: 77.6412, totalPopulation: 125000, populationDensity: 17500, malePercent: 53, femalePercent: 47, age0_17: 19, age18_24: 25, age25_34: 40, age35_44: 24, age45_54: 8, age55_64: 3, age65Plus: 1, medianAge: 28, avgHouseholdSize: 3.1, literacyRate: 93, graduatePercent: 52, postGradPercent: 16, workingPopPercent: 66, medianIncome: 880000, incomeUnder3L: 16, income3to6L: 24, income6to10L: 28, income10to15L: 18, incomeAbove15L: 14, vehicleOwnership: 0.64, twoWheelerPercent: 58, fourWheelerPercent: 26, vegetarianPercent: 48, gymMembershipRate: 18, diningOutFreq: 2.8 },
  { wardId: 'WARD_DEVENAHALLI', wardName: 'Devenahalli', lat: 13.2476, lng: 77.7089, totalPopulation: 85000, populationDensity: 4200, malePercent: 52, femalePercent: 48, age0_17: 28, age18_24: 22, age25_34: 28, age35_44: 24, age45_54: 12, age55_64: 4, age65Plus: 2, medianAge: 30, avgHouseholdSize: 4.0, literacyRate: 82, graduatePercent: 32, postGradPercent: 6, workingPopPercent: 52, medianIncome: 420000, incomeUnder3L: 38, income3to6L: 34, income6to10L: 18, income10to15L: 6, incomeAbove15L: 4, vehicleOwnership: 0.35, twoWheelerPercent: 72, fourWheelerPercent: 10, vegetarianPercent: 72, gymMembershipRate: 6, diningOutFreq: 1.6 },
]

async function seedCensusData() {
  let count = 0
  for (const w of BANGALORE_WARDS) {
    await prisma.censusData.upsert({
      where: { wardId: w.wardId },
      update: {
        wardName: w.wardName,
        totalPopulation: w.totalPopulation,
        populationDensity: w.populationDensity,
        malePercent: w.malePercent,
        femalePercent: w.femalePercent,
        age0_17: w.age0_17,
        age18_24: w.age18_24,
        age25_34: w.age25_34,
        age35_44: w.age35_44,
        age45_54: w.age45_54,
        age55_64: w.age55_64,
        age65Plus: w.age65Plus,
        medianAge: w.medianAge,
        avgHouseholdSize: w.avgHouseholdSize,
        literacyRate: w.literacyRate,
        graduatePercent: w.graduatePercent,
        postGradPercent: w.postGradPercent,
        workingPopPercent: w.workingPopPercent,
        medianIncome: w.medianIncome,
        incomeUnder3L: w.incomeUnder3L,
        income3to6L: w.income3to6L,
        income6to10L: w.income6to10L,
        income10to15L: w.income10to15L,
        incomeAbove15L: w.incomeAbove15L,
        vehicleOwnership: w.vehicleOwnership,
        twoWheelerPercent: w.twoWheelerPercent,
        fourWheelerPercent: w.fourWheelerPercent,
        vegetarianPercent: w.vegetarianPercent,
        gymMembershipRate: w.gymMembershipRate,
        diningOutFreq: w.diningOutFreq,
        latitude: w.lat,
        longitude: w.lng,
      },
      create: {
        wardId: w.wardId,
        wardName: w.wardName,
        city: 'Bangalore',
        totalPopulation: w.totalPopulation,
        populationDensity: w.populationDensity,
        malePercent: w.malePercent,
        femalePercent: w.femalePercent,
        age0_17: w.age0_17,
        age18_24: w.age18_24,
        age25_34: w.age25_34,
        age35_44: w.age35_44,
        age45_54: w.age45_54,
        age55_64: w.age55_64,
        age65Plus: w.age65Plus,
        medianAge: w.medianAge,
        avgHouseholdSize: w.avgHouseholdSize,
        literacyRate: w.literacyRate,
        graduatePercent: w.graduatePercent,
        postGradPercent: w.postGradPercent,
        workingPopPercent: w.workingPopPercent,
        medianIncome: w.medianIncome,
        incomeUnder3L: w.incomeUnder3L,
        income3to6L: w.income3to6L,
        income6to10L: w.income6to10L,
        income10to15L: w.income10to15L,
        incomeAbove15L: w.incomeAbove15L,
        vehicleOwnership: w.vehicleOwnership,
        twoWheelerPercent: w.twoWheelerPercent,
        fourWheelerPercent: w.fourWheelerPercent,
        vegetarianPercent: w.vegetarianPercent,
        gymMembershipRate: w.gymMembershipRate,
        diningOutFreq: w.diningOutFreq,
        latitude: w.lat,
        longitude: w.lng,
      },
    })
    count++
  }
  console.log(`Census data seeded for ${count} Bangalore wards (Bangalore pop ~${(BANGALORE_POP / 1e6).toFixed(1)}M)`)
}

seedCensusData()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
