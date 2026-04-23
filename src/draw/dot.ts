import type { GaugePalette, Momentum } from '@/types'

const PULSE_INTERVAL = 1500
const PULSE_DURATION = 900

/** Draw the needle tip dot with optional pulse ring and momentum coloring. */
export function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  palette: GaugePalette,
  momentum: Momentum,
  pulse: boolean = true,
  now_ms: number = performance.now(),
): void {
  const baseAlpha = ctx.globalAlpha

  const dotColor =
    momentum === 'up' ? palette.dotUp : momentum === 'down' ? palette.dotDown : palette.dotFlat
  const glowColor =
    momentum === 'up' ? palette.glowUp : momentum === 'down' ? palette.glowDown : palette.glowFlat

  // Expanding ring pulse
  if (pulse) {
    const t = (now_ms % PULSE_INTERVAL) / PULSE_DURATION
    if (t < 1) {
      const radius = 6 + t * 10
      const pulseAlpha = 0.35 * (1 - t)
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.strokeStyle = dotColor
      ctx.lineWidth = 1.5
      ctx.globalAlpha = baseAlpha * pulseAlpha
      ctx.stroke()
    }
  }

  // Glow
  ctx.save()
  ctx.globalAlpha = baseAlpha * 0.4
  ctx.shadowColor = glowColor
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, Math.PI * 2)
  ctx.fillStyle = glowColor
  ctx.fill()
  ctx.restore()

  // Outer ring
  ctx.globalAlpha = baseAlpha
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fillStyle = dotColor
  ctx.fill()

  // Inner bright dot
  ctx.beginPath()
  ctx.arc(x, y, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  ctx.globalAlpha = baseAlpha
}
