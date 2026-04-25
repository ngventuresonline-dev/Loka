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
 * Triangular 3-node mark: two warm orange nodes, one accent magenta, edge links,
 * and twin guide rings. The inner cluster is the “moving” layer in the header.
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
          ring1: 'rgba(255, 200, 170, 0.4)',
          ring2: 'rgba(255, 200, 170, 0.25)',
          line: 'rgba(255, 200, 180, 0.5)',
        }
      : {
          ring1: 'rgba(255, 82, 0, 0.22)',
          ring2: 'rgba(255, 82, 0, 0.14)',
          line: 'rgba(200, 100, 70, 0.4)',
        }

  const movingClass = !staticPosition ? 'loka-nodes-drift' : undefined

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
          <stop offset="0%" stopColor="#FF5A1F" />
          <stop offset="100%" stopColor="#E4002B" />
        </linearGradient>
        <linearGradient id={gM} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F15BB5" />
          <stop offset="100%" stopColor="#C11B6E" />
        </linearGradient>
        <filter id={fS} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.25" result="b" />
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
          <feGaussianBlur stdDeviation="0.35" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="50" cy="50" r="32" stroke={c.ring1} strokeWidth="1" />
      <circle cx="50" cy="50" r="40" stroke={c.ring2} strokeWidth="0.85" />

      <g
        className={clsx('origin-center will-change-transform', movingClass)}
        style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}
      >
        <line x1="50" y1="22" x2="25.75" y2="64" stroke={c.line} strokeWidth="0.9" strokeLinecap="round" />
        <line x1="50" y1="22" x2="74.25" y2="64" stroke={c.line} strokeWidth="0.9" strokeLinecap="round" />
        <line x1="25.75" y1="64" x2="74.25" y2="64" stroke={c.line} strokeWidth="0.9" strokeLinecap="round" />

        <circle cx="50" cy="22" r="5.2" fill={`url(#${gO})`} filter={`url(#${fT})`} />
        <circle cx="47.2" cy="19.1" r="1.1" fill="white" fillOpacity="0.38" />

        <circle cx="25.75" cy="64" r="4" fill={`url(#${gO})`} filter={`url(#${fS})`} />
        <circle cx="22.8" cy="61" r="0.85" fill="white" fillOpacity="0.3" />

        <circle cx="74.25" cy="64" r="3.1" fill={`url(#${gM})`} filter={`url(#${fM})`} />
        <circle cx="72" cy="61" r="0.7" fill="white" fillOpacity="0.35" />
      </g>
    </svg>
  )
}
