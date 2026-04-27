import sanitizeHtml from 'sanitize-html'

/**
 * Server-safe HTML for blog posts (no JSDOM / no default-stylesheet path).
 * Strips scripts and dangerous URLs; allows typical article markup.
 */
export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'img',
      'span',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'hr',
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'name', 'target', 'rel', 'class'],
      img: ['src', 'alt', 'width', 'height', 'class', 'loading', 'decoding'],
      th: ['colspan', 'rowspan', 'scope', 'class'],
      td: ['colspan', 'rowspan', 'class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowVulnerableTags: false,
  })
}
