import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Bangalore ward data — 99acres real estate rates + demographic estimates
// medianIncome = monthly household income (₹)
// catchmentPopulation → population2026
// avgApptSqft / avgLandSqft / combinedAvgSqft in ₹/sqft
const wardData = [
  // ULTRA PREMIUM
  { locality: 'Rajajinagar',          lat: 12.9892, lng: 77.5533, avgApptSqft: 23600, avgLandSqft: 22300, combinedAvgSqft: 23060, medianIncome: 210000, spendingPowerIndex: 99,  catchment: 185000, itProfessionals: 20,  populationDensity: 22000, diningOut: 3.8 },
  { locality: 'Indiranagar',          lat: 12.9716, lng: 77.6412, avgApptSqft: 19500, avgLandSqft: 42000, combinedAvgSqft: 28500, medianIncome: 195000, spendingPowerIndex: 97,  catchment: 140000, itProfessionals: 65,  populationDensity: 18000, diningOut: 5.2 },
  { locality: 'Jayanagar',            lat: 12.9252, lng: 77.5838, avgApptSqft: 15800, avgLandSqft: 39000, combinedAvgSqft: 25080, medianIncome: 175000, spendingPowerIndex: 93,  catchment: 175000, itProfessionals: 25,  populationDensity: 20000, diningOut: 3.5 },
  { locality: 'Basavanagudi',         lat: 12.9418, lng: 77.5746, avgApptSqft: 14500, avgLandSqft: 35000, combinedAvgSqft: 22700, medianIncome: 168000, spendingPowerIndex: 91,  catchment: 155000, itProfessionals: 18,  populationDensity: 19000, diningOut: 3.2 },
  { locality: 'Malleshwaram',         lat: 12.9989, lng: 77.5668, avgApptSqft: 15000, avgLandSqft: 28000, combinedAvgSqft: 20200, medianIncome: 160000, spendingPowerIndex: 89,  catchment: 170000, itProfessionals: 20,  populationDensity: 21000, diningOut: 3.4 },
  { locality: 'Koramangala',          lat: 12.9352, lng: 77.6245, avgApptSqft: 15200, avgLandSqft: 25000, combinedAvgSqft: 19120, medianIncome: 155000, spendingPowerIndex: 88,  catchment: 145000, itProfessionals: 60,  populationDensity: 17000, diningOut: 5.4 },
  { locality: 'Richmond Town',        lat: 12.9636, lng: 77.6002, avgApptSqft: 14000, avgLandSqft: 28000, combinedAvgSqft: 19600, medianIncome: 158000, spendingPowerIndex: 88,  catchment:  95000, itProfessionals: 25,  populationDensity: 14000, diningOut: 4.2 },
  { locality: 'Cunningham Road',      lat: 12.9847, lng: 77.5983, avgApptSqft: 14000, avgLandSqft: 26000, combinedAvgSqft: 18800, medianIncome: 155000, spendingPowerIndex: 87,  catchment:  80000, itProfessionals: 22,  populationDensity: 11000, diningOut: 4.0 },
  { locality: 'MG Road',              lat: 12.9758, lng: 77.6055, avgApptSqft: 13000, avgLandSqft: 25000, combinedAvgSqft: 17800, medianIncome: 145000, spendingPowerIndex: 85,  catchment:  85000, itProfessionals: 30,  populationDensity: 12000, diningOut: 4.5 },
  { locality: 'Ulsoor',               lat: 12.9789, lng: 77.6155, avgApptSqft: 14000, avgLandSqft: 20000, combinedAvgSqft: 16400, medianIncome: 140000, spendingPowerIndex: 84,  catchment: 110000, itProfessionals: 30,  populationDensity: 16000, diningOut: 4.0 },
  { locality: 'Frazer Town',          lat: 12.9778, lng: 77.6126, avgApptSqft: 13000, avgLandSqft: 18000, combinedAvgSqft: 15000, medianIncome: 132000, spendingPowerIndex: 82,  catchment: 130000, itProfessionals: 20,  populationDensity: 18000, diningOut: 3.8 },
  { locality: 'Domlur',               lat: 12.9600, lng: 77.6400, avgApptSqft: 13000, avgLandSqft: 18000, combinedAvgSqft: 15000, medianIncome: 128000, spendingPowerIndex: 80,  catchment:  90000, itProfessionals: 55,  populationDensity: 15000, diningOut: 4.6 },
  { locality: 'Bellandur',            lat: 12.9256, lng: 77.6762, avgApptSqft: 15000, avgLandSqft: 14000, combinedAvgSqft: 14600, medianIncome: 130000, spendingPowerIndex: 83,  catchment: 125000, itProfessionals: 70,  populationDensity: 15000, diningOut: 4.8 },

  // TIER 1 HIGH
  { locality: 'HSR Layout',           lat: 12.9116, lng: 77.6389, avgApptSqft: 13000, avgLandSqft: 15000, combinedAvgSqft: 13800, medianIncome: 122000, spendingPowerIndex: 79,  catchment: 160000, itProfessionals: 68,  populationDensity: 19000, diningOut: 4.5 },
  { locality: 'Hebbal',               lat: 13.0350, lng: 77.5960, avgApptSqft: 12000, avgLandSqft: 14000, combinedAvgSqft: 12800, medianIncome: 112000, spendingPowerIndex: 76,  catchment: 135000, itProfessionals: 45,  populationDensity: 16000, diningOut: 3.8 },
  { locality: 'Sarjapur Road',        lat: 12.9027, lng: 77.6784, avgApptSqft: 12000, avgLandSqft: 13000, combinedAvgSqft: 12400, medianIncome: 108000, spendingPowerIndex: 74,  catchment: 148000, itProfessionals: 65,  populationDensity: 17000, diningOut: 4.2 },
  { locality: 'Manyata Tech Park',    lat: 13.0474, lng: 77.6213, avgApptSqft:  8500, avgLandSqft: 14000, combinedAvgSqft: 10700, medianIncome:  92000, spendingPowerIndex: 70,  catchment:  95000, itProfessionals: 75,  populationDensity: 15000, diningOut: 4.0 },
  { locality: 'Hennur Road',          lat: 13.0267, lng: 77.6354, avgApptSqft: 10300, avgLandSqft:  7000, combinedAvgSqft:  8980, medianIncome:  85000, spendingPowerIndex: 65,  catchment: 140000, itProfessionals: 42,  populationDensity: 18000, diningOut: 3.2 },
  { locality: 'Whitefield',           lat: 12.9698, lng: 77.7499, avgApptSqft: 10000, avgLandSqft:  7500, combinedAvgSqft:  9000, medianIncome:  86000, spendingPowerIndex: 66,  catchment: 210000, itProfessionals: 72,  populationDensity: 20000, diningOut: 3.5 },
  { locality: 'Yeshwanthpur',         lat: 13.0256, lng: 77.5435, avgApptSqft:  9500, avgLandSqft: 12000, combinedAvgSqft: 10500, medianIncome:  92000, spendingPowerIndex: 69,  catchment: 155000, itProfessionals: 25,  populationDensity: 19000, diningOut: 3.6 },
  { locality: 'BTM Layout',           lat: 12.9166, lng: 77.6101, avgApptSqft: 11000, avgLandSqft: 10000, combinedAvgSqft: 10600, medianIncome:  92000, spendingPowerIndex: 69,  catchment: 185000, itProfessionals: 50,  populationDensity: 22000, diningOut: 4.8 },
  { locality: 'Thanisandra',          lat: 13.0522, lng: 77.6197, avgApptSqft:  8000, avgLandSqft:  8000, combinedAvgSqft:  8000, medianIncome:  74000, spendingPowerIndex: 59,  catchment: 160000, itProfessionals: 40,  populationDensity: 20000, diningOut: 3.0 },
  { locality: 'Bannerghatta Road',    lat: 12.8780, lng: 77.5968, avgApptSqft:  9250, avgLandSqft:  7800, combinedAvgSqft:  8670, medianIncome:  82000, spendingPowerIndex: 63,  catchment: 155000, itProfessionals: 38,  populationDensity: 18000, diningOut: 3.4 },
  { locality: 'JP Nagar',             lat: 12.9081, lng: 77.5850, avgApptSqft:  9000, avgLandSqft:  9500, combinedAvgSqft:  9200, medianIncome:  86000, spendingPowerIndex: 66,  catchment: 178000, itProfessionals: 32,  populationDensity: 21000, diningOut: 3.5 },
  { locality: 'Banashankari',         lat: 12.9287, lng: 77.5558, avgApptSqft:  8500, avgLandSqft:  9000, combinedAvgSqft:  8700, medianIncome:  80000, spendingPowerIndex: 62,  catchment: 170000, itProfessionals: 22,  populationDensity: 20000, diningOut: 3.2 },

  // TIER 2 MID-HIGH
  { locality: 'Marathahalli',         lat: 12.9591, lng: 77.6974, avgApptSqft:  9050, avgLandSqft:  7000, combinedAvgSqft:  8230, medianIncome:  76000, spendingPowerIndex: 60,  catchment: 190000, itProfessionals: 58,  populationDensity: 23000, diningOut: 3.8 },
  { locality: 'Hoodi',                lat: 12.9924, lng: 77.7083, avgApptSqft:  8000, avgLandSqft:  6500, combinedAvgSqft:  7400, medianIncome:  70000, spendingPowerIndex: 56,  catchment: 145000, itProfessionals: 55,  populationDensity: 21000, diningOut: 3.2 },
  { locality: 'KR Puram',             lat: 13.0062, lng: 77.6941, avgApptSqft:  8600, avgLandSqft:  7500, combinedAvgSqft:  8160, medianIncome:  74000, spendingPowerIndex: 58,  catchment: 200000, itProfessionals: 48,  populationDensity: 26000, diningOut: 3.0 },
  { locality: 'Nagawara',             lat: 13.0432, lng: 77.6121, avgApptSqft:  8500, avgLandSqft:  7000, combinedAvgSqft:  7900, medianIncome:  72000, spendingPowerIndex: 57,  catchment: 155000, itProfessionals: 38,  populationDensity: 20000, diningOut: 2.8 },
  { locality: 'Varthur',              lat: 12.9360, lng: 77.7362, avgApptSqft:  7500, avgLandSqft:  6000, combinedAvgSqft:  6900, medianIncome:  65000, spendingPowerIndex: 52,  catchment: 165000, itProfessionals: 50,  populationDensity: 22000, diningOut: 2.8 },
  { locality: 'Banaswadi',            lat: 13.0106, lng: 77.6506, avgApptSqft:  7500, avgLandSqft:  7000, combinedAvgSqft:  7300, medianIncome:  68000, spendingPowerIndex: 54,  catchment: 165000, itProfessionals: 32,  populationDensity: 21000, diningOut: 2.9 },
  { locality: 'HBR Layout',           lat: 13.0317, lng: 77.6416, avgApptSqft:  7400, avgLandSqft:  6500, combinedAvgSqft:  7040, medianIncome:  66000, spendingPowerIndex: 53,  catchment: 150000, itProfessionals: 35,  populationDensity: 19000, diningOut: 2.8 },
  { locality: 'Old Madras Road',      lat: 13.0010, lng: 77.6750, avgApptSqft:  7500, avgLandSqft:  6000, combinedAvgSqft:  6900, medianIncome:  65000, spendingPowerIndex: 52,  catchment: 145000, itProfessionals: 28,  populationDensity: 20000, diningOut: 2.6 },
  { locality: 'Begur Road',           lat: 12.8834, lng: 77.6050, avgApptSqft:  7000, avgLandSqft:  5500, combinedAvgSqft:  6400, medianIncome:  62000, spendingPowerIndex: 49,  catchment: 145000, itProfessionals: 28,  populationDensity: 19000, diningOut: 2.4 },
  { locality: 'Bommanahalli',         lat: 12.8926, lng: 77.6334, avgApptSqft:  6500, avgLandSqft:  5500, combinedAvgSqft:  6100, medianIncome:  58000, spendingPowerIndex: 46,  catchment: 145000, itProfessionals: 30,  populationDensity: 20000, diningOut: 2.5 },
  { locality: 'Hosa Road',            lat: 12.8783, lng: 77.6673, avgApptSqft:  7000, avgLandSqft:  5500, combinedAvgSqft:  6400, medianIncome:  62000, spendingPowerIndex: 49,  catchment: 138000, itProfessionals: 32,  populationDensity: 18000, diningOut: 2.5 },
  { locality: 'Hulimavu',             lat: 12.8760, lng: 77.5988, avgApptSqft:  6500, avgLandSqft:  5500, combinedAvgSqft:  6100, medianIncome:  58000, spendingPowerIndex: 46,  catchment: 140000, itProfessionals: 24,  populationDensity: 19000, diningOut: 2.3 },
  { locality: 'Sarjapur',             lat: 12.8628, lng: 77.7000, avgApptSqft:  6500, avgLandSqft:  5500, combinedAvgSqft:  6100, medianIncome:  58000, spendingPowerIndex: 46,  catchment: 130000, itProfessionals: 35,  populationDensity: 17000, diningOut: 2.4 },
  { locality: 'Jalahalli',            lat: 13.0432, lng: 77.5398, avgApptSqft:  7000, avgLandSqft:  6000, combinedAvgSqft:  6600, medianIncome:  62000, spendingPowerIndex: 50,  catchment: 145000, itProfessionals: 20,  populationDensity: 20000, diningOut: 2.6 },

  // TIER 3 MID
  { locality: 'Mysore Road',          lat: 12.9438, lng: 77.5128, avgApptSqft:  7000, avgLandSqft:  5500, combinedAvgSqft:  6400, medianIncome:  60000, spendingPowerIndex: 48,  catchment: 165000, itProfessionals: 18,  populationDensity: 22000, diningOut: 2.4 },
  { locality: 'RT Nagar',             lat: 13.0208, lng: 77.5912, avgApptSqft:  7000, avgLandSqft:  6000, combinedAvgSqft:  6600, medianIncome:  62000, spendingPowerIndex: 50,  catchment: 175000, itProfessionals: 20,  populationDensity: 24000, diningOut: 2.6 },
  { locality: 'Kanakapura Road',      lat: 12.8904, lng: 77.5662, avgApptSqft:  7000, avgLandSqft:  5200, combinedAvgSqft:  6280, medianIncome:  60000, spendingPowerIndex: 48,  catchment: 148000, itProfessionals: 22,  populationDensity: 19000, diningOut: 2.4 },
  { locality: 'Rajarajeshwari Nagar', lat: 12.9180, lng: 77.5188, avgApptSqft:  6500, avgLandSqft:  5000, combinedAvgSqft:  5900, medianIncome:  56000, spendingPowerIndex: 44,  catchment: 160000, itProfessionals: 22,  populationDensity: 22000, diningOut: 2.2 },
  { locality: 'Yelahanka',            lat: 13.1007, lng: 77.5942, avgApptSqft:  7500, avgLandSqft:  6000, combinedAvgSqft:  6900, medianIncome:  64000, spendingPowerIndex: 51,  catchment: 140000, itProfessionals: 28,  populationDensity: 18000, diningOut: 2.6 },
  { locality: 'Horamavu',             lat: 13.0267, lng: 77.6572, avgApptSqft:  6200, avgLandSqft:  8550, combinedAvgSqft:  7140, medianIncome:  66000, spendingPowerIndex: 52,  catchment: 180000, itProfessionals: 30,  populationDensity: 24000, diningOut: 2.7 },
  { locality: 'Hennur',               lat: 13.0200, lng: 77.6300, avgApptSqft:  6500, avgLandSqft:  5500, combinedAvgSqft:  6100, medianIncome:  58000, spendingPowerIndex: 46,  catchment: 165000, itProfessionals: 32,  populationDensity: 22000, diningOut: 2.5 },
  { locality: 'Kothanur',             lat: 13.0780, lng: 77.5900, avgApptSqft:  6500, avgLandSqft:  5000, combinedAvgSqft:  5900, medianIncome:  56000, spendingPowerIndex: 44,  catchment: 130000, itProfessionals: 25,  populationDensity: 18000, diningOut: 2.2 },
  { locality: 'Vidyaranyapura',       lat: 13.0669, lng: 77.5632, avgApptSqft:  6500, avgLandSqft:  5000, combinedAvgSqft:  5900, medianIncome:  56000, spendingPowerIndex: 44,  catchment: 145000, itProfessionals: 18,  populationDensity: 20000, diningOut: 2.2 },
  { locality: 'Bagalur',              lat: 13.1500, lng: 77.6400, avgApptSqft:  6200, avgLandSqft:  4500, combinedAvgSqft:  5520, medianIncome:  52000, spendingPowerIndex: 41,  catchment: 120000, itProfessionals: 20,  populationDensity: 16000, diningOut: 2.0 },
  { locality: 'Tumkur Road',          lat: 13.0800, lng: 77.5332, avgApptSqft:  6000, avgLandSqft:  4500, combinedAvgSqft:  5400, medianIncome:  50000, spendingPowerIndex: 40,  catchment: 165000, itProfessionals: 15,  populationDensity: 22000, diningOut: 2.0 },
  { locality: 'Kengeri',              lat: 12.9102, lng: 77.4855, avgApptSqft:  5800, avgLandSqft:  4500, combinedAvgSqft:  5280, medianIncome:  48000, spendingPowerIndex: 38,  catchment: 155000, itProfessionals: 16,  populationDensity: 21000, diningOut: 1.9 },
  { locality: 'Uttarahalli',          lat: 12.8901, lng: 77.5377, avgApptSqft:  6000, avgLandSqft:  4500, combinedAvgSqft:  5400, medianIncome:  50000, spendingPowerIndex: 40,  catchment: 148000, itProfessionals: 18,  populationDensity: 20000, diningOut: 2.0 },
  { locality: 'Gottigere',            lat: 12.8697, lng: 77.5971, avgApptSqft:  6000, avgLandSqft:  4500, combinedAvgSqft:  5400, medianIncome:  50000, spendingPowerIndex: 40,  catchment: 130000, itProfessionals: 20,  populationDensity: 18000, diningOut: 2.0 },
  { locality: 'Bikasipura',           lat: 12.9124, lng: 77.5248, avgApptSqft:  5800, avgLandSqft:  4000, combinedAvgSqft:  5080, medianIncome:  47000, spendingPowerIndex: 37,  catchment: 145000, itProfessionals: 14,  populationDensity: 21000, diningOut: 1.8 },

  // TIER 4 AFFORDABLE
  { locality: 'Electronic City',      lat: 12.8399, lng: 77.6770, avgApptSqft:  6500, avgLandSqft:  4500, combinedAvgSqft:  5700, medianIncome:  54000, spendingPowerIndex: 43,  catchment: 280000, itProfessionals: 75,  populationDensity: 28000, diningOut: 3.2 },
  { locality: 'Airport Road',         lat: 13.0150, lng: 77.6510, avgApptSqft:  6500, avgLandSqft:  5000, combinedAvgSqft:  5900, medianIncome:  56000, spendingPowerIndex: 44,  catchment: 125000, itProfessionals: 35,  populationDensity: 16000, diningOut: 2.6 },
  { locality: 'Hosur Road',           lat: 12.8697, lng: 77.6510, avgApptSqft:  5500, avgLandSqft:  4500, combinedAvgSqft:  5100, medianIncome:  48000, spendingPowerIndex: 37,  catchment: 155000, itProfessionals: 30,  populationDensity: 20000, diningOut: 2.2 },
  { locality: 'Devanahalli',          lat: 13.2431, lng: 77.7120, avgApptSqft:  5800, avgLandSqft:  4000, combinedAvgSqft:  5080, medianIncome:  46000, spendingPowerIndex: 36,  catchment:  85000, itProfessionals: 20,  populationDensity: 12000, diningOut: 1.6 },
  { locality: 'Ramamurthy Nagar',     lat: 13.0067, lng: 77.6643, avgApptSqft:  5200, avgLandSqft:  4000, combinedAvgSqft:  4720, medianIncome:  44000, spendingPowerIndex: 33,  catchment: 195000, itProfessionals: 25,  populationDensity: 26000, diningOut: 1.8 },
  { locality: 'Nelamangala',          lat: 13.0959, lng: 77.3930, avgApptSqft:  5000, avgLandSqft:  3500, combinedAvgSqft:  4400, medianIncome:  40000, spendingPowerIndex: 30,  catchment:  95000, itProfessionals: 10,  populationDensity: 13000, diningOut: 1.4 },
  { locality: 'Hoskote',              lat: 13.0700, lng: 77.7987, avgApptSqft:  4500, avgLandSqft:  3000, combinedAvgSqft:  3900, medianIncome:  36000, spendingPowerIndex: 27,  catchment:  80000, itProfessionals: 12,  populationDensity: 11000, diningOut: 1.2 },
  { locality: 'Attibele',             lat: 12.7800, lng: 77.7150, avgApptSqft:  4500, avgLandSqft:  3000, combinedAvgSqft:  3900, medianIncome:  36000, spendingPowerIndex: 27,  catchment: 105000, itProfessionals: 15,  populationDensity: 15000, diningOut: 1.2 },
  { locality: 'Chandapura',           lat: 12.8167, lng: 77.6860, avgApptSqft:  4500, avgLandSqft:  3000, combinedAvgSqft:  3900, medianIncome:  36000, spendingPowerIndex: 27,  catchment: 110000, itProfessionals: 15,  populationDensity: 15000, diningOut: 1.2 },
  { locality: 'Jigani',               lat: 12.7950, lng: 77.6344, avgApptSqft:  4800, avgLandSqft:  3200, combinedAvgSqft:  4160, medianIncome:  38000, spendingPowerIndex: 29,  catchment: 105000, itProfessionals: 12,  populationDensity: 14000, diningOut: 1.3 },
  { locality: 'Anekal',               lat: 12.7100, lng: 77.6950, avgApptSqft:  4500, avgLandSqft:  3000, combinedAvgSqft:  3900, medianIncome:  36000, spendingPowerIndex: 27,  catchment:  88000, itProfessionals: 10,  populationDensity: 12000, diningOut: 1.2 },
  { locality: 'Doddaballapur',        lat: 13.2973, lng: 77.5361, avgApptSqft:  4000, avgLandSqft:  2500, combinedAvgSqft:  3400, medianIncome:  32000, spendingPowerIndex: 23,  catchment:  72000, itProfessionals:  8,  populationDensity: 10000, diningOut: 1.0 },
  { locality: 'TC Palaya',            lat: 13.0150, lng: 77.7300, avgApptSqft:  4200, avgLandSqft:  3000, combinedAvgSqft:  3720, medianIncome:  34000, spendingPowerIndex: 25,  catchment: 130000, itProfessionals: 12,  populationDensity: 18000, diningOut: 1.4 },
  { locality: 'NRI Layout',           lat: 12.9600, lng: 77.7300, avgApptSqft:  4500, avgLandSqft:  3200, combinedAvgSqft:  3980, medianIncome:  36000, spendingPowerIndex: 27,  catchment: 120000, itProfessionals: 14,  populationDensity: 16000, diningOut: 1.5 },
]

function wardCode(locality: string): string {
  return `KA_BLR_${locality.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').substring(0, 30)}`
}

async function main() {
  console.log(`🌱 Seeding ${wardData.length} Bangalore wards...`)
  let seeded = 0

  for (const w of wardData) {
    const code = wardCode(w.locality)
    const pop2021 = Math.round(w.catchment * 0.95)
    const pop2026 = w.catchment

    const row = {
      wardCode:          code,
      wardName:          w.locality,
      locality:          w.locality,
      city:              'Bangalore',
      latitude:          w.lat,
      longitude:         w.lng,
      population2021:    pop2021,
      population2026:    pop2026,
      populationDensity: w.populationDensity,
      populationGrowth:  1.1,
      age18_24:          16,
      age25_34:          34,
      age35_44:          28,
      age45_54:          14,
      age55Plus:          8,
      medianAge:         33,
      income6to10L:      20,
      income10to15L:     30,
      incomeAbove15L:    Math.min(50, Math.round(w.spendingPowerIndex * 0.45)),
      medianIncome:      w.medianIncome,
      workingPopulation: Math.min(85, w.itProfessionals + 32),
      itProfessionals:   w.itProfessionals,
      businessOwners:    12,
      apartments:        65,
      carOwnership:      40,
      diningOutPerWeek:  w.diningOut,
    }

    await prisma.wardDemographics.upsert({
      where:  { wardCode: code },
      update: row,
      create: row,
    })
    seeded++
  }

  console.log(`✅ Seeded ${seeded} wards`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
