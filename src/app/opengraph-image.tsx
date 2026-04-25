import { readFileSync } from 'fs'
import { join } from 'path'
import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'Lokazen - AI-Powered Commercial Real Estate Matching'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const L_ORANGE = '#E8500A'
const DARK = '#1a1a1a'
const MUTED = '#4B5563'

function loadDataUrl(relative: string) {
  const p = join(process.cwd(), 'public', relative)
  const buf = readFileSync(p, 'utf-8')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buf)}`
}

/**
 * Social preview aligned with shared comp: two overlapping triangles above the name,
 * “L” in orange, “o” as a simple dot, “kazen” dark, light peach→white background.
 */
export default function OpengraphImage() {
  const hero = loadDataUrl('brand/lokazen-og-hero.svg')

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          background: 'linear-gradient(105deg, #FFF1E6 0%, #FFFFFF 42%, #FFFFFF 100%)',
          fontFamily:
            'ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 280,
            height: 200,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <img width={200} height={200} src={hero} alt="" style={{ objectFit: 'contain' }} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 8,
            marginBottom: 20,
          }}
        >
          <span style={{ color: L_ORANGE, fontSize: 72, fontWeight: 900, lineHeight: 1, letterSpacing: -1 }}>
            L
          </span>
          <div
            style={{
              display: 'flex',
              width: 22,
              height: 22,
              borderRadius: 11,
              background: `linear-gradient(135deg, #FF5200, #E4002B)`,
              margin: '0 2px 0 4px',
            }}
          />
          <span
            style={{
              color: DARK,
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1,
              marginLeft: 0,
            }}
          >
            kazen
          </span>
        </div>

        <p
          style={{
            color: MUTED,
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1.4,
            margin: 0,
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          AI-Powered commercial real estate matching in Bangalore
        </p>
        <p
          style={{
            color: '#6B7280',
            fontSize: 20,
            fontWeight: 600,
            margin: '20px 0 0 0',
            letterSpacing: '0.1em',
          }}
        >
          LOKAZEN.IN
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
