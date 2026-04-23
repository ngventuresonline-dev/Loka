/** Encode path segments for next/image (e.g. filenames with spaces in /public). */
export function publicSrc(path: string): string {
  if (!path.startsWith('/')) return path
  const [base, ...rest] = path.split('?')
  const encoded =
    '/' +
    base
      .split('/')
      .filter(Boolean)
      .map((seg) => encodeURIComponent(seg))
      .join('/')
  return rest.length ? `${encoded}?${rest.join('?')}` : encoded
}
