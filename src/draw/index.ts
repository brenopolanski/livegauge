import type { GaugePalette, GaugeLayout, GaugeZone, Momentum, DegenOptions } from '../types'
import { drawArcTrack, drawArcZones, drawArcFill, drawMinMaxLabels } from './arc'
import { drawNeedle, drawCirclePointer } from './needle'
import { drawTicks, autoTickCount } from './ticks'
import { drawDot } from './dot'
import { drawLoading } from './loading'
import { drawParticles, spawnOnSwing, type ParticleState } from './particles'

const SHAKE_DECAY_RATE = 0.002
const SHAKE_MIN_AMPLITUDE = 0.2

export interface ShakeState {
  amplitude: number
}

export function createShakeState(): ShakeState {
  return { amplitude: 0 }
}

export interface DrawOptions {
  smoothValue: number
  valueAngle: number
  min: number
  max: number
  momentum: Momentum
  momentumGlowAlpha: number
  zones?: GaugeZone[]
  showTicks: boolean
  tickCount: number
  showTickLabels: boolean
  showDot: boolean
  showPulse: boolean
  formatValue: (v: number) => string
  dt: number
  now_ms: number
  chartReveal: number
  loading: boolean
  particleState?: ParticleState
  particleOptions?: DegenOptions
  swingMagnitude: number
  pointer: 'needle' | 'circle'
  shakeState?: ShakeState
}

/**
 * Master gauge draw function — calls each draw module in order.
 */
export function drawGaugeFrame(
  ctx: CanvasRenderingContext2D,
  layout: GaugeLayout,
  palette: GaugePalette,
  opts: DrawOptions,
): void {
  const reveal = opts.chartReveal

  // Loading/empty states
  if (opts.loading && reveal < 0.01) {
    drawLoading(ctx, layout, palette, opts.now_ms)
    return
  }

  // Shake
  const shake = opts.shakeState
  let shakeX = 0
  let shakeY = 0
  if (shake && shake.amplitude > SHAKE_MIN_AMPLITUDE) {
    shakeX = (Math.random() - 0.5) * 2 * shake.amplitude
    shakeY = (Math.random() - 0.5) * 2 * shake.amplitude
    ctx.save()
    ctx.translate(shakeX, shakeY)
  }
  if (shake) {
    const decayRate = Math.pow(SHAKE_DECAY_RATE, opts.dt / 1000)
    shake.amplitude *= decayRate
    if (shake.amplitude < SHAKE_MIN_AMPLITUDE) shake.amplitude = 0
  }

  // Smoothstep helper
  const revealRamp = (start: number, end: number) => {
    const t = Math.max(0, Math.min(1, (reveal - start) / (end - start)))
    return t * t * (3 - 2 * t)
  }

  // 1. Arc background track — fades in early
  const trackAlpha = revealRamp(0, 0.4)
  if (trackAlpha > 0.01) {
    ctx.save()
    ctx.globalAlpha = trackAlpha
    drawArcTrack(ctx, layout, palette)
    ctx.restore()
  }

  // 2. Color zones — fade in with track
  if (opts.zones && opts.zones.length > 0 && trackAlpha > 0.01) {
    ctx.save()
    ctx.globalAlpha = trackAlpha * 0.6
    drawArcZones(ctx, layout, opts.zones, layout.arcWidth)
    ctx.restore()
  }

  // 3. Filled arc — fades in (20%–70%)
  const fillAlpha = revealRamp(0.2, 0.7)
  if (fillAlpha > 0.01) {
    ctx.save()
    ctx.globalAlpha = fillAlpha
    drawArcFill(ctx, layout, palette, opts.valueAngle)
    ctx.restore()
  }

  // 4. Tick marks — fade in (15%–60%)
  if (opts.showTicks) {
    const tickAlpha = revealRamp(0.15, 0.6)
    if (tickAlpha > 0.01) {
      ctx.save()
      ctx.globalAlpha = tickAlpha
      drawTicks(
        ctx, layout, palette,
        opts.min, opts.max,
        opts.tickCount, opts.showTickLabels,
        opts.formatValue,
      )
      ctx.restore()
    }
  }

  // 5. Min/max labels — fade in with ticks
  {
    const labelAlpha = revealRamp(0.15, 0.6)
    if (labelAlpha > 0.01 && !opts.showTickLabels) {
      ctx.save()
      ctx.globalAlpha = labelAlpha
      drawMinMaxLabels(ctx, layout, palette, opts.min, opts.max, opts.formatValue)
      ctx.restore()
    }
  }

  // 6. Pointer — appears at 30%+ reveal
  const needleAlpha = revealRamp(0.3, 0.8)
  if (needleAlpha > 0.01) {
    ctx.save()
    ctx.globalAlpha = needleAlpha
    if (opts.pointer === 'circle') {
      drawCirclePointer(
        ctx, layout, palette,
        opts.valueAngle,
        opts.momentum,
        opts.momentumGlowAlpha,
        opts.showPulse,
        opts.now_ms,
      )
    } else {
      drawNeedle(
        ctx, layout, palette,
        opts.valueAngle,
        opts.momentum,
        opts.momentumGlowAlpha,
        opts.showDot,
      )
    }
    ctx.restore()
  }

  // 7. Needle tip dot + particles (skip dot for circle pointer)
  {
    const tipLen = layout.radius - layout.arcWidth / 2 - 6
    const tipX = layout.cx + Math.cos(opts.valueAngle) * tipLen
    const tipY = layout.cy + Math.sin(opts.valueAngle) * tipLen

    if (opts.showDot && opts.pointer !== 'circle') {
      const dotAlpha = revealRamp(0.4, 0.9)
      if (dotAlpha > 0.01) {
        ctx.save()
        ctx.globalAlpha = dotAlpha
        drawDot(ctx, tipX, tipY, palette, opts.momentum, opts.showPulse, opts.now_ms)
        ctx.restore()
      }
    }

    // 8. Particles (degen mode)
    if (opts.particleState && reveal > 0.9) {
      const burstIntensity = spawnOnSwing(
        opts.particleState, opts.momentum, tipX, tipY,
        opts.swingMagnitude, palette.accent, opts.dt, opts.particleOptions,
      )
      if (burstIntensity > 0 && shake) {
        shake.amplitude = (3 + opts.swingMagnitude * 4) * burstIntensity
      }
      drawParticles(ctx, opts.particleState, opts.dt)
    }
  }

  // Loading overlay (cross-fade)
  if (opts.loading && reveal < 1) {
    ctx.save()
    ctx.globalAlpha = 1 - reveal
    drawLoading(ctx, layout, palette, opts.now_ms)
    ctx.restore()
  }

  // Restore shake
  if (shake && (shakeX !== 0 || shakeY !== 0)) {
    ctx.restore()
  }
}

export { autoTickCount }
