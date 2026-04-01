import type { GaugePalette, GaugeLayout, Momentum } from '../types'

/** Draw the gauge needle pointing at the given angle. */
export function drawNeedle(
  ctx: CanvasRenderingContext2D,
  layout: GaugeLayout,
  palette: GaugePalette,
  angle: number,
  momentum: Momentum,
  momentumGlowAlpha: number = 0,
  showDot: boolean = true,
): void {
  const { cx, cy, radius } = layout

  const needleLen = radius - layout.arcWidth / 2 - 6
  const tipX = cx + Math.cos(angle) * needleLen
  const tipY = cy + Math.sin(angle) * needleLen

  // Momentum glow behind the needle (only when dot is visible)
  if (showDot && momentumGlowAlpha > 0.01) {
    const glowColor = momentum === 'up' ? palette.glowUp
      : momentum === 'down' ? palette.glowDown
      : palette.glowFlat
    ctx.save()
    ctx.globalAlpha = momentumGlowAlpha * 0.6
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 18
    ctx.beginPath()
    ctx.arc(tipX, tipY, 6, 0, Math.PI * 2)
    ctx.fillStyle = glowColor
    ctx.fill()
    ctx.restore()
  }

  ctx.save()

  ctx.shadowColor = palette.needleShadow
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2

  const perpAngle = angle + Math.PI / 2
  const baseW = 3.5
  const bx1 = cx + Math.cos(perpAngle) * baseW
  const by1 = cy + Math.sin(perpAngle) * baseW
  const bx2 = cx - Math.cos(perpAngle) * baseW
  const by2 = cy - Math.sin(perpAngle) * baseW

  ctx.beginPath()
  ctx.moveTo(bx1, by1)
  ctx.lineTo(tipX, tipY)
  ctx.lineTo(bx2, by2)
  ctx.closePath()
  ctx.fillStyle = palette.needleColor
  ctx.fill()

  ctx.restore()

  // Center cap
  ctx.beginPath()
  ctx.arc(cx, cy, 5, 0, Math.PI * 2)
  ctx.fillStyle = palette.needleColor
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = palette.accent
  ctx.fill()
}

const CIRCLE_PULSE_INTERVAL = 1500
const CIRCLE_PULSE_DURATION = 900

/** Draw a circle pointer sitting on the arc at the given angle. */
export function drawCirclePointer(
  ctx: CanvasRenderingContext2D,
  layout: GaugeLayout,
  palette: GaugePalette,
  angle: number,
  momentum: Momentum,
  momentumGlowAlpha: number = 0,
  pulse: boolean = false,
  now_ms: number = performance.now(),
): void {
  const { cx, cy, radius, arcWidth } = layout
  const pointerRadius = arcWidth / 2 + 2

  const px = cx + Math.cos(angle) * radius
  const py = cy + Math.sin(angle) * radius

  const baseAlpha = ctx.globalAlpha

  // Expanding ring pulse
  if (pulse) {
    const t = (now_ms % CIRCLE_PULSE_INTERVAL) / CIRCLE_PULSE_DURATION
    if (t < 1) {
      const ringRadius = pointerRadius + t * 12
      const pulseAlpha = 0.35 * (1 - t)
      ctx.beginPath()
      ctx.arc(px, py, ringRadius, 0, Math.PI * 2)
      ctx.strokeStyle = palette.dotFlat
      ctx.lineWidth = 1.5
      ctx.globalAlpha = baseAlpha * pulseAlpha
      ctx.stroke()
      ctx.globalAlpha = baseAlpha
    }
  }

  if (momentumGlowAlpha > 0.01) {
    const glowColor = momentum === 'up' ? palette.glowUp
      : momentum === 'down' ? palette.glowDown
      : palette.glowFlat
    ctx.save()
    ctx.globalAlpha = momentumGlowAlpha * 0.5
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 16
    ctx.beginPath()
    ctx.arc(px, py, pointerRadius + 2, 0, Math.PI * 2)
    ctx.fillStyle = glowColor
    ctx.fill()
    ctx.restore()
  }

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.3)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 1
  ctx.beginPath()
  ctx.arc(px, py, pointerRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()
}
