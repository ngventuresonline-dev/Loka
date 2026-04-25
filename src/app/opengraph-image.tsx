import { readFileSync } from 'fs'
import { join } from 'path'
import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'Lokazen - AI-Powered Commercial Real Estate Matching'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const OR = '#E8500A'
const O2 = '#FF6B2B'
const MUTED = '#1F2937'
const TINT = 'rgba(255, 90, 30, 0.06)'

function getMarkDataUrl(): string {
  const path = join(process.cwd(), 'public/brand/loka-nodes-og.svg')
  const buf = readFileSync(path, 'utf-8')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buf)}`
}

export default function OpengraphImage() {
  const mark = getMarkDataUrl()

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
          padding: 56,
          background: `linear-gradient(130deg, ${TINT} 0%, #FFFFFF 45%, #FFFFFF 100%)`,
          fontFamily:
            'ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 32,
            gap: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 160,
              height: 160,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              width={200}
              height={200}
              src={mark}
              alt=""
              style={{ objectFit: 'contain', display: 'flex' }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: OR,
              fontSize: 80,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            L
          </span>
          <div
            style={{
              display: 'flex',
              width: 72,
              height: 72,
              margin: '0 1px 0 4px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img width={200} height={200} src={mark} alt="" style={{ objectFit: 'contain' }} />
          </div>
          <span
            style={{
              color: O2,
              fontSize: 80,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            ka
          </span>
          <span
            style={{
              color: MUTED,
              fontSize: 80,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            zen
          </span>
        </div>

        <p
          style={{
            color: MUTED,
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1.4,
            margin: '32px 0 0 0',
            textAlign: 'center',
            maxWidth: 920,
            opacity: 0.9,
          }}
        >
          AI-Powered commercial real estate matching in Bangalore
        </p>
        <p
          style={{
            color: '#6B7280',
            fontSize: 20,
            fontWeight: 500,
            margin: '20px 0 0 0',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          lokazen.in
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
