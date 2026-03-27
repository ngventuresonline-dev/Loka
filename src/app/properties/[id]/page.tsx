import { redirect } from 'next/navigation'

/**
 * Public links often use /properties/{encodedId} but the listing UI lives at …/match.
 * Without this route, Link prefetch + navigation 404. Canonical URLs already point to /match.
 */
export default async function PropertySlugRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/properties/${id}/match`)
}
