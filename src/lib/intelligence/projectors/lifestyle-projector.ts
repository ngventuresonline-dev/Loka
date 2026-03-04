/**
 * 2026 lifestyle & behavior projections
 */

import { getPrisma } from '@/lib/get-prisma'
import { getGrowthPattern } from './growth-lookup'

interface Base2021 {
  diningOutPerWeek?: number
  deliveryUsage?: number
  gymMembership?: number
  organicPreference?: number
  experientialDining?: number
}

export async function project2026Lifestyle(
  wardId: string,
  base2021: Base2021 = {},
  wardName?: string
): Promise<Record<string, number | string>> {
  const prisma = await getPrisma()
  const years = 5

  const defaults = {
    diningOutFrequency2026: Math.round(((base2021.diningOutPerWeek ?? 2.5) * 1.3) * 10) / 10,
    deliveryPenetration2026: Math.min(75, (base2021.deliveryUsage ?? 45) + 20),
    gymMembership2026: Math.min(35, (base2021.gymMembership ?? 15) + 10),
    organicFoodPreference2026: Math.min(40, (base2021.organicPreference ?? 20) + 12),
    premiumDiningGrowth: 'Moderate',
    experientialDining2026: (base2021.experientialDining ?? 30) + 15,
  }

  const growth = await getGrowthPattern(prisma, wardId, wardName)
  if (!growth) return defaults

  const diningRate = (growth.diningOutGrowth ?? 6) / 100
  const digRate = growth.digitalAdoption ?? 12
  const healthRate = growth.healthConsciousness ?? 4
  const highInc = growth.highIncomeGrowth ?? 6

  return {
    diningOutFrequency2026: Math.round(
      (base2021.diningOutPerWeek ?? 2.5) * Math.pow(1 + diningRate, years) * 10
    ) / 10,
    deliveryPenetration2026: Math.min(75, (base2021.deliveryUsage ?? 45) + digRate * years * 0.8),
    gymMembership2026: Math.min(35, (base2021.gymMembership ?? 15) + healthRate * years),
    organicFoodPreference2026: Math.min(
      40,
      (base2021.organicPreference ?? 20) + healthRate * years * 0.6
    ),
    premiumDiningGrowth: highInc > 7 ? 'High' : 'Moderate',
    experientialDining2026: (base2021.experientialDining ?? 30) + highInc * years * 0.4,
  }
}
