import type { GaugePalette, GaugeLayout, GaugeZone } from '../types'

/** Draw the background arc track (the grey ring). */
export function drawArcTrack(
  ctx: CanvasRenderingContext2D,
  layout: GaugeLayout,
  palette: GaugePalette,
): void {
  ctx.beginPath()
  ctx.arc(layout.cx, layout.cy, layout.radius, layout.startAngle, layout.endAngle, false)
  ctx.strokeStyle = palette.arcTrack
  ctx.lineWidth = layout.arcWidth
  ctx.lineCap = 'round'
  ctx.stroke()
}

/** Draw color zone segments on the arc. */
export function drawArcZones(
  ctx: CanvasRenderingContext2D,
  layout: GaugeLayout,
  zones: GaugeZone[],
  arcWidth: number,
): void {
  const { cx, cy, radius } = layout
  const outerR = radius + arcWidth
  const innerR = Math.max(0, radius - arcWidth)
  const capAngle = (arcWidth / 2) / radius + 0.02

  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i]
    const startA = layout.valueToAngle(zone.from)
    const endA = layout.valueToAngle(zone.to)
    if (Math.abs(endA - startA) < 0.001) continue

    const isFirst = i === 0
    const isLast = i === zones.length - 1

    if (isFirst || isLast) {
      ctx.save()
      ctx.beginPath()
      const clipStart = isFirst ? startA - capAngle : startA
      const clipEnd = isLast ? endA + capAngle : endA
      ctx.arc(cx, cy, outerR, clipStart, clipEnd, false)
      ctx.arc(cx, cy, innerR, clipEnd, clipStart, true)
      ctx.closePath()
      ctx.clip()

      ctx.beginPath()
      ctx.arc(cx, cy, radius, startA, endA, false)
      ctx.strokeStyle = zone.color
      ctx.lineWidth = arcWidth
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.restore()
    } else {
      ctx.beginPath()
      ctx.arc(cx, cy, radius, startA, endA, false)
      ctx.strokeStyle = zone.color
      ctx.lineWidth = arcWidth
      ctx.lineCap = 'butt'
      ctx.stroke()
    }
  }
}

/** Draw the filled portion of the arc up to the current value. */
export function drawArcFill(
  ctx: CanvasRenderingContext2D,
  layout: GaugeLayout,
  palette: GaugePalette,
  valueAngle: number,
): void {
  const span = Math.abs(valueAngle - layout.startAngle)
  if (span < 0.002) return

  ctx.beginPath()
  ctx.arc(layout.cx, layout.cy, layout.radius, layout.startAngle, valueAngle, false)
  ctx.strokeStyle = palette.arcFill
  ctx.lineWidth = layout.arcWidth
  ctx.lineCap = 'round'
  ctx.stroke()
}

/** Draw min/max labels at the arc endpoints (below the left/right edges). */
export function drawMinMaxLabels(
  ctx: CanvasRenderingContext2D,
  layout: GaugeLayout,
  palette: GaugePalette,
  min: number,
  max: number,
  formatValue: (v: number) => string,
): void {
  ctx.font = palette.tickFont
  ctx.fillStyle = palette.tickLabelColor
  ctx.textBaseline = 'top'

  const yOffset = layout.arcWidth / 2 + 6

  // Min label (left endpoint — at startAngle which is PI, pointing left)
  const minX = layout.cx + Math.cos(layout.startAngle) * layout.radius
  const minY = layout.cy + Math.sin(layout.startAngle) * layout.radius
  ctx.textAlign = 'left'
  ctx.fillText(formatValue(min), minX - 4, minY + yOffset)

  // Max label (right endpoint — at endAngle which is 2*PI, pointing right)
  const maxX = layout.cx + Math.cos(layout.endAngle) * layout.radius
  const maxY = layout.cy + Math.sin(layout.endAngle) * layout.radius
  ctx.textAlign = 'right'
  ctx.fillText(formatValue(max), maxX + 4, maxY + yOffset)
}
