'use client'

import clsx from 'clsx'
import { useId } from 'react'

export type LokaNodesMarkProps = {
  className?: string
  size?: number
  variant?: 'light' | 'dark'
  staticPosition?: boolean
  'aria-hidden'?: boolean
}

/**
 * Brand mark from reference: one outer ring, three nodes (largest top, mid left,
 * smallest bottom-right magenta) joined by warm brown lines; inner cluster
 * is animated. Equilateral / symmetric layout is intentionally not used.
 */
export default function LokaNodesMark({
  className,
  size = 64,
  variant = 'light',
  staticPosition = false,
  'aria-hidden': ariaHidden = true,
}: LokaNodesMarkProps) {
  const uid = useId().replace(/:/g, '')
  const gO = `loka-go-${uid}`
  const gM = `loka-gm-${uid}`
  const fS = `loka-fs-${uid}`
  const fM = `loka-fm-${uid}`
  const fT = `loka-ft-${uid}`

  const c =
    variant === 'dark'
      ? {
          ring: 'rgba(255, 200, 170, 0.5)',
          line: 'rgba(200, 160, 120, 0.65)',
        }
      : {
          ring: 'rgba(255, 130, 70, 0.45)',
          line: 'rgba(110, 55, 30, 0.55)',
        }

  const movingClass = !staticPosition ? 'loka-nodes-drift' : undefined

  // Reference layout: top (largest) · left (mid) · bottom-right (smallest, magenta)
  const tx = 50
  const ty = 23.5
  const lx = 30.5
  const ly = 64.5
  const bx = 69.5
  const by = 60

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={ariaHidden}
    >
      <defs>
        <linearGradient id={gO} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B2A" />
          <stop offset="100%" stopColor="#E12D0E" />
        </linearGradient>
        <linearGradient id={gM} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4D7D" />
          <stop offset="100%" stopColor="#B0155C" />
        </linearGradient>
        <filter id={fS} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={fM} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={fT} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Single outer ring, static — matches reference (one circle) */}
      <circle cx="50" cy="50" r="36.5" stroke={c.ring} strokeWidth="1" />

      <g
        className={clsx('origin-center will-change-transform', movingClass)}
        style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}
      >
        <line x1={tx} y1={ty} x2={lx} y2={ly} stroke={c.line} strokeWidth="1" strokeLinecap="round" />
        <line x1={tx} y1={ty} x2={bx} y2={by} stroke={c.line} strokeWidth="1" strokeLinecap="round" />
        <line x1={lx} y1={ly} x2={bx} y2={by} stroke={c.line} strokeWidth="1" strokeLinecap="round" />

        <circle cx={tx} cy={ty} r="5.5" fill={`url(#${gO})`} filter={`url(#${fT})`} />
        <circle cx={45.2} cy={20.1} r="1.1" fill="white" fillOpacity="0.42" />
        <circle cx={lx} cy={ly} r="4.1" fill={`url(#${gO})`} filter={`url(#${fS})`} />
        <circle cx={27.1} cy={60.2} r="0.8" fill="white" fillOpacity="0.32" />
        <circle cx={bx} cy={by} r="3" fill={`url(#${gM})`} filter={`url(#${fM})`} />
        <circle cx={66.8} cy={56.6} r="0.7" fill="white" fillOpacity="0.34" />
      </g>
    </svg>
  )
}
