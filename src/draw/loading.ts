import type { GaugeLayout, GaugePalette } from '@/types'

const SWEEP_SPEED = 0.0012
const SWEEP_ARC_LEN = Math.PI * 0.4
const BREATH_SPEED = 0.002

/** Breathing alpha oscillation. */
export function loadingBreath(now_ms: number): number {
  return 0.3 + 0.15 * Math.sin(now_ms * BREATH_SPEED)
}

/** Draw the loading sweep animation: a short arc segment sweeping around the track. */
export function drawLoading(
  ctx: CanvasRenderingContext2D,
  layout: GaugeLayout,
  palette: GaugePalette,
  now_ms: number,
): void {
  const totalAngle = layout.endAngle - layout.startAngle
  const breath = loadingBreath(now_ms)

  // Background track (dimmer)
  ctx.save()
  ctx.globalAlpha = breath * 0.5
  ctx.beginPath()
  ctx.arc(layout.cx, layout.cy, layout.radius, layout.startAngle, layout.endAngle, false)
  ctx.strokeStyle = palette.arcTrack
  ctx.lineWidth = layout.arcWidth
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()

  // Sweep arc
  const sweepT = (now_ms * SWEEP_SPEED) % 1
  const eased = sweepT < 0.5 ? 2 * sweepT * sweepT : 1 - (-2 * sweepT + 2) ** 2 / 2

  const sweepCenter = layout.startAngle + eased * totalAngle
  const halfLen = SWEEP_ARC_LEN / 2
  const sweepStart = Math.max(layout.startAngle, sweepCenter - halfLen)
  const sweepEnd = Math.min(layout.endAngle, sweepCenter + halfLen)

  ctx.save()
  ctx.globalAlpha = breath
  ctx.beginPath()
  ctx.arc(layout.cx, layout.cy, layout.radius, sweepStart, sweepEnd, false)
  ctx.strokeStyle = palette.accent
  ctx.lineWidth = layout.arcWidth
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()
}
