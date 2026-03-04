/**
 * Resolve AreaGrowthPatterns by wardId or area name (for CensusData compatibility)
 */

export async function getGrowthPattern(
  prisma: { areaGrowthPatterns?: { findUnique: (args: unknown) => Promise<unknown>; findFirst: (args: unknown) => Promise<unknown> } } | null,
  wardId: string,
  wardName?: string
) {
  if (!prisma?.areaGrowthPatterns) return null

  const byWard = await prisma.areaGrowthPatterns.findUnique({ where: { wardId } })
  if (byWard) return byWard

  if (wardName?.trim()) {
    const byArea = await prisma.areaGrowthPatterns.findFirst({
      where: { area: { equals: wardName.trim(), mode: 'insensitive' } },
    })
    if (byArea) return byArea
  }

  return null
}
