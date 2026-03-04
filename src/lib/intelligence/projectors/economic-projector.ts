// @ts-nocheck
/**
 * 2026 economic indicators projection
 */

import { getPrisma } from '@/lib/get-prisma'
import { getGrowthPattern } from './growth-lookup'

interface Base2021 {
  incomeAbove15L?: number
  income10to15L?: number
  income6to10L?: number
  vehicleOwnership?: number
  avgRent?: number
  propertyPrice?: number
  businessCount?: number
  chainPercent?: number
  digitalPayment?: number
  onlineOrdering?: number
}

export async function project2026Economics(
  wardId: string,
  area: string,
  base2021: Base2021,
  wardName?: string
): Promise<Record<string, number>> {
  const prisma = await getPrisma()
  const years = 5

  const defaults = {
    incomeAbove15L: Math.min(80, (base2021.incomeAbove15L ?? 25) + 15),
    income10to15L: (base2021.income10to15L ?? 15) + 5,
    income6to10L: (base2021.income6to10L ?? 25) + 8,
    vehicleOwnership2026: Math.round((base2021.vehicleOwnership ?? 0.4) * 1.25 * 100) / 100,
    avgRent2026: Math.round((base2021.avgRent ?? 50000) * 1.35),
    propertyPrice2026: Math.round((base2021.propertyPrice ?? 8000) * 1.4),
    newBusinessDensity2026: Math.round((base2021.businessCount ?? 50) * 1.4),
    chainPenetration2026: Math.min(70, (base2021.chainPercent ?? 30) + 15),
    digitalPayment2026: Math.min(95, (base2021.digitalPayment ?? 60) + 25),
    onlineOrdering2026: Math.min(85, (base2021.onlineOrdering ?? 40) + 30),
    businessCount: base2021.businessCount ?? 50,
  }

  const growth = await getGrowthPattern(prisma, wardId, wardName ?? area)
  if (!growth) return defaults

  const inc15 = (growth.highIncomeGrowth ?? 8) * years
  const midClass = (growth.middleClassGrowth ?? 5) * years
  const vehRate = (growth.vehicleOwnership ?? 4) / 100
  const rentRate = (growth.rentAppreciation ?? 5.5) / 100
  const priceRate = (growth.propertyPriceGrowth ?? 6) / 100
  const bizRate = (growth.newBusinessGrowth ?? 6) / 100
  const chainRate = growth.chainExpansion ?? 2
  const digRate = growth.digitalAdoption ?? 3 // pp per year

  return {
    incomeAbove15L: Math.min(80, (base2021.incomeAbove15L ?? 25) + inc15),
    income10to15L: (base2021.income10to15L ?? 15) + midClass * 0.5,
    income6to10L: (base2021.income6to10L ?? 25) + midClass,
    vehicleOwnership2026: Math.round((base2021.vehicleOwnership ?? 0.4) * Math.pow(1 + vehRate, years) * 100) / 100,
    avgRent2026: Math.round((base2021.avgRent ?? 50000) * Math.pow(1 + rentRate, years)),
    propertyPrice2026: Math.round((base2021.propertyPrice ?? 8000) * Math.pow(1 + priceRate, years)),
    newBusinessDensity2026: Math.round((base2021.businessCount ?? 50) * Math.pow(1 + bizRate, years)),
    chainPenetration2026: Math.min(70, (base2021.chainPercent ?? 30) + chainRate * years),
    digitalPayment2026: Math.min(95, (base2021.digitalPayment ?? 60) + digRate * years),
    onlineOrdering2026: Math.min(85, (base2021.onlineOrdering ?? 40) + digRate * years * 1.2),
    businessCount: base2021.businessCount ?? 50,
  }
}
