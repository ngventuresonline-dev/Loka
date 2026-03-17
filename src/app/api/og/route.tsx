/**
 * Dynamic OG image generation for Lokazen property pages.
 * Edge-compatible — no DB calls. All data is passed as URL params by
 * generateMetadata() in src/app/properties/[id]/layout.tsx
 *
 * Usage:
 *   /api/og?title=...&city=...&price=...&size=...&type=...&address=...
 *
 * Returns a 1200×630 PNG branded property card.
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const ORANGE = '#E8500A'
const ORANGE_2 = '#FF6B2B'
const DARK = '#1A0800'
const DARK_2 = '#2D1200'
const WHITE = '#FFFFFF'
const MUTED = '#C4956A'

const TYPE_LABELS: Record<string, string> = {
  office: 'Office Space',
  retail: 'Retail Space',
  warehouse: 'Warehouse',
  restaurant: 'Restaurant / F&B',
  other: 'Commercial Space',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const title   = (searchParams.get('title')   || 'Commercial Property').slice(0, 80)
  const city    = (searchParams.get('city')    || 'Bangalore').slice(0, 40)
  const price   = (searchParams.get('price')   || '').slice(0, 30)
  const size    = (searchParams.get('size')    || '').slice(0, 20)
  const type    = (searchParams.get('type')    || 'other').toLowerCase()
  const address = (searchParams.get('address') || '').slice(0, 60)

  const typeLabel = TYPE_LABELS[type] || 'Commercial Space'

  // Truncate title at 2 lines (~55 chars per line)
  const titleShort = title.length > 55
    ? title.slice(0, 52) + '…'
    : title

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: DARK,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Background decorative circles ───────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: '-160px',
            right: '-160px',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${ORANGE}22 0%, transparent 70%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${ORANGE_2}18 0%, transparent 70%)`,
            display: 'flex',
          }}
        />

        {/* ── Orange top accent bar ────────────────────────────────────── */}
        <div
          style={{
            width: '100%',
            height: '6px',
            background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_2})`,
            display: 'flex',
            flexShrink: 0,
          }}
        />

        {/* ── Main content area ────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '52px 64px 0 64px',
          }}
        >
          {/* Badges row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: `${ORANGE}28`,
                border: `1px solid ${ORANGE}50`,
                borderRadius: '8px',
                padding: '6px 16px',
              }}
            >
              <span style={{ color: ORANGE, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {typeLabel}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '6px 16px',
              }}
            >
              <span style={{ color: '#E0C8B0', fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em' }}>
                📍 {city}
              </span>
            </div>
          </div>

          {/* Property Title */}
          <div
            style={{
              fontSize: title.length > 40 ? '38px' : '46px',
              fontWeight: 800,
              color: WHITE,
              lineHeight: 1.18,
              marginBottom: '28px',
              letterSpacing: '-0.01em',
              maxWidth: '900px',
              display: 'flex',
            }}
          >
            {titleShort}
          </div>

          {/* Address */}
          {address && (
            <div
              style={{
                fontSize: '17px',
                color: MUTED,
                marginBottom: '36px',
                display: 'flex',
                letterSpacing: '0.01em',
              }}
            >
              {address}{city && !address.includes(city) ? `, ${city}` : ''}
            </div>
          )}

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'nowrap' }}>
            {price && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: `linear-gradient(135deg, ${ORANGE}22, ${ORANGE_2}18)`,
                  border: `1px solid ${ORANGE}40`,
                  borderRadius: '12px',
                  padding: '14px 24px',
                }}
              >
                <span style={{ fontSize: '22px' }}>💰</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Rent</span>
                  <span style={{ color: WHITE, fontSize: '18px', fontWeight: 700 }}>{price}</span>
                </div>
              </div>
            )}
            {size && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '14px 24px',
                }}
              >
                <span style={{ fontSize: '22px' }}>📐</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Size</span>
                  <span style={{ color: WHITE, fontSize: '18px', fontWeight: 700 }}>{size} sqft</span>
                </div>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '14px 24px',
              }}
            >
              <span style={{ fontSize: '22px' }}>✅</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Status</span>
                <span style={{ color: '#6EE7B7', fontSize: '18px', fontWeight: 700 }}>Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer bar ───────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 64px',
            borderTop: `1px solid rgba(255,255,255,0.08)`,
            marginTop: '40px',
          }}
        >
          {/* Lokazen wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_2})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: WHITE, fontSize: '18px', fontWeight: 900 }}>L</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: WHITE, fontSize: '18px', fontWeight: 800, lineHeight: 1 }}>
                <span style={{ color: ORANGE }}>L</span>
                <span style={{ color: ORANGE_2 }}>●</span>
                kazen
              </span>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', letterSpacing: '0.08em', marginTop: '2px' }}>
                AI Powered Commercial Real Estate
              </span>
            </div>
          </div>

          {/* Right: site + Lokazen score badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', letterSpacing: '0.06em' }}>
              lokazen.in
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_2})`,
                borderRadius: '8px',
                padding: '8px 16px',
              }}
            >
              <span style={{ color: WHITE, fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
                Find Your Space
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
