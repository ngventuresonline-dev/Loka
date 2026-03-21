# Performance at scale (portal-style listings)

Large property portals (e.g. 99acres-scale traffic) combine **several** techniques; you rarely get “1M listings fast” from a single trick.

## What typically matters

1. **Search / listing index** — Elasticsearch, OpenSearch, Algolia, Meilisearch, or Postgres full-text + tight filters. OLTP Postgres alone is not ideal for heavy faceted search across millions of rows.
2. **Read path separation** — Read replicas, connection pooling (PgBouncer), optional CQRS so writes don’t block read-heavy routes.
3. **Caching** — CDN for static assets and HTML where possible; short-TTL cache for semi-static API responses; `stale-while-revalidate` at the edge.
4. **Lean payloads** — List endpoints return **ids + minimal fields**; no huge JSON blobs or `SELECT *` on list views.
5. **Pagination & keyset pagination** — Cursor-based pagination for deep pages; avoid `OFFSET` in the millions.
6. **Indexes** — Composite indexes aligned to real filters (`city`, `availability`, `propertyType`, `price`, etc.).
7. **Media** — Images through a CDN (e.g. CloudFront, Cloudflare Images, Imgix); responsive sizes; lazy load below the fold.
8. **Async work** — Scoring, enrichment, emails, and heavy joins off the request path (queues / background jobs).

## Lokazen-specific next steps

- Raise limits on `/api/admin/matches` (currently capped `take: 50` on brands/properties) before relying on CRM email at full data scale; add pagination or precomputed match tables if needed.
- Add DB indexes for fields used in filters (see Prisma migrations).
- Wire **Resend** (`RESEND_API_KEY`, `EMAIL_FROM`) for real CRM emails; batch large sends via a queue if volume grows.

This doc is a living checklist—not a guarantee of 99acres parity without dedicated infra and search investment.
