/**
 * Display label for a brand profile when UI/API need a single string.
 * Prefer stored company name; otherwise account name, email handle, industry, then a neutral fallback.
 */
export function brandProfileDisplayName(
  profile: { company_name?: string | null; industry?: string | null },
  user?: { name?: string | null; email?: string | null } | null
): string {
  const company = profile.company_name?.trim()
  if (company) return company

  const accountName = user?.name?.trim()
  if (accountName) return accountName

  const email = user?.email?.trim()
  if (email) {
    const at = email.indexOf('@')
    const local = (at > 0 ? email.slice(0, at) : email).trim()
    if (local) return humanizeEmailLocalPart(local)
  }

  const industry = profile.industry?.trim()
  if (industry) return industry

  return 'Unnamed brand'
}

function humanizeEmailLocalPart(local: string): string {
  const spaced = local.replace(/[.+_]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!spaced) return local
  return spaced.replace(/\b\w/g, (ch) => ch.toUpperCase())
}
