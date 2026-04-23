import type { GaugeLayout, GaugePalette } from '@/types'

/** Compute a nice tick count based on the arc radius. */
export function autoTickCount(radius: number): number {
  if (radius < 60) {
    return 5
  }
  if (radius < 100) {
    return 7
  }
  if (radius < 160) {
    return 9
  }
  return 11
}

/** Draw tick marks and optional labels around the semi-circle. */
export function drawTicks(
  ctx: CanvasRenderingContext2D,
  layout: GaugeLayout,
  palette: GaugePalette,
  min: number,
  max: number,
  tickCount: number,
  showLabels: boolean,
  formatValue: (v: number) => string,
): void {
  const { cx, cy, radius, arcWidth } = layout

  const outerR = radius + arcWidth / 2 + 2
  const majorLen = 8
  const minorLen = 4

  const totalAngle = layout.endAngle - layout.startAngle
  const majorSteps = tickCount - 1

  for (let i = 0; i <= majorSteps; i++) {
    const t = i / majorSteps
    const angle = layout.startAngle + t * totalAngle
    const isMajor = true

    const len = isMajor ? majorLen : minorLen
    const innerR = outerR
    const outerTick = outerR + len

    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)

    ctx.beginPath()
    ctx.moveTo(cx + cosA * innerR, cy + sinA * innerR)
    ctx.lineTo(cx + cosA * outerTick, cy + sinA * outerTick)
    ctx.strokeStyle = palette.tickColor
    ctx.lineWidth = isMajor ? 1.5 : 1
    ctx.lineCap = 'round'
    ctx.stroke()

    // Minor ticks between major ones
    if (i < majorSteps) {
      const nextT = (i + 1) / majorSteps
      const midT = (t + nextT) / 2
      const midAngle = layout.startAngle + midT * totalAngle
      const cosM = Math.cos(midAngle)
      const sinM = Math.sin(midAngle)

      ctx.beginPath()
      ctx.moveTo(cx + cosM * innerR, cy + sinM * innerR)
      ctx.lineTo(cx + cosM * (outerR + minorLen), cy + sinM * (outerR + minorLen))
      ctx.strokeStyle = palette.tickColor
      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    if (showLabels && isMajor) {
      const value = min + t * (max - min)
      const labelR = outerTick + 10
      const lx = cx + cosA * labelR
      const ly = cy + sinA * labelR

      ctx.font = palette.tickFont
      ctx.fillStyle = palette.tickLabelColor
      ctx.textBaseline = 'middle'

      if (t < 0.1) {
        ctx.textAlign = 'right'
      } else if (t > 0.9) {
        ctx.textAlign = 'left'
      } else if (t < 0.4) {
        ctx.textAlign = 'right'
      } else if (t > 0.6) {
        ctx.textAlign = 'left'
      } else {
        ctx.textAlign = 'center'
      }

      ctx.fillText(formatValue(value), lx, ly)
    }
  }
}
