import type { CSSProperties } from 'react'

export type Momentum = 'up' | 'down' | 'flat'
export type ThemeMode = 'light' | 'dark'

export interface DegenOptions {
  /** Multiplier for particle count and size (default 1) */
  scale?: number
  /** Show particles on down-momentum swings (default false) */
  downMomentum?: boolean
}

export interface HoverPoint {
  value: number
  angle: number
}

export interface GaugeZone {
  from: number
  to: number
  color: string
}

export interface GaugeProps {
  value: number
  min?: number
  max?: number
  theme?: ThemeMode
  color?: string
  zones?: GaugeZone[]
  ticks?: boolean | number
  tickLabels?: boolean
  arcWidth?: number
  showValue?: boolean
  label?: string
  momentum?: boolean | Momentum
  degen?: boolean | DegenOptions
  loading?: boolean
  lerpSpeed?: number
  dot?: boolean
  pointer?: 'needle' | 'circle'
  pulse?: boolean
  tooltip?: boolean
  formatValue?: (v: number) => string
  startAngle?: number
  endAngle?: number
  className?: string
  style?: CSSProperties
  onHover?: (point: HoverPoint | null) => void
}

export interface GaugePalette {
  accent: string
  accentRgb: [number, number, number]
  arcTrack: string
  arcFill: string
  needleColor: string
  needleShadow: string
  dotUp: string
  dotDown: string
  dotFlat: string
  glowUp: string
  glowDown: string
  glowFlat: string
  tickColor: string
  tickLabelColor: string
  valueColor: string
  labelColor: string
  bgRgb: [number, number, number]
  labelFont: string
  valueFont: string
  tickFont: string
}

export interface GaugeLayout {
  w: number
  h: number
  cx: number
  cy: number
  radius: number
  arcWidth: number
  startAngle: number
  endAngle: number
  valueToAngle: (v: number) => number
}
