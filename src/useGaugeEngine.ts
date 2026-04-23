import { useCallback, useEffect, useRef } from 'react'
import { applyDpr, getDpr } from './canvas/dpr'
import { autoTickCount, createShakeState, drawGaugeFrame } from './draw'
import { createParticleState } from './draw/particles'
import { lerp } from './math/lerp'
import type { DegenOptions, GaugeLayout, GaugePalette, GaugeZone, Momentum } from './types'

const MAX_DELTA_MS = 50
const CHART_REVEAL_SPEED = 0.14
const CHART_REVEAL_SPEED_FWD = 0.09
const MOMENTUM_GLOW_SPEED = 0.08
const VALUE_HISTORY_SIZE = 30
const SWING_MAGNITUDE_SPEED = 0.06

interface EngineConfig {
  value: number
  min: number
  max: number
  palette: GaugePalette
  lerpSpeed: number
  zones?: GaugeZone[]
  showTicks: boolean
  tickCount: number
  showTickLabels: boolean
  showDot: boolean
  showPulse: boolean
  pointer: 'needle' | 'circle'
  showMomentum: boolean
  momentumOverride?: Momentum
  degenOptions?: DegenOptions
  loading: boolean
  formatValue: (v: number) => string
  valueDisplayRef?: React.RefObject<HTMLSpanElement | null>
  startAngle: number
  endAngle: number
  label?: string
}

export function useGaugeEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  config: EngineConfig,
) {
  // Store config in refs to avoid re-creating the draw loop
  const configRef = useRef(config)
  configRef.current = config

  // Animation state
  const displayValueRef = useRef(config.value)
  const displayMinRef = useRef(config.min)
  const displayMaxRef = useRef(config.max)
  const rangeInitedRef = useRef(false)
  const sizeRef = useRef({ w: 0, h: 0 })
  const layoutRef = useRef<GaugeLayout | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const rafRef = useRef(0)
  const lastFrameRef = useRef(0)
  const reducedMotionRef = useRef(false)
  const chartRevealRef = useRef(0)
  const particleStateRef = useRef(createParticleState())
  const shakeStateRef = useRef(createShakeState())
  const momentumGlowRef = useRef(0)
  const swingMagnitudeRef = useRef(0)

  // Value history for momentum detection
  const valueHistoryRef = useRef<{ time: number; value: number }[]>([])
  const lastMomentumRef = useRef<Momentum>('flat')

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }
      const { width, height } = entry.contentRect
      sizeRef.current = { w: width, h: height }
    })

    ro.observe(container)
    const rect = container.getBoundingClientRect()
    sizeRef.current = { w: rect.width, h: rect.height }

    return () => ro.disconnect()
  }, [containerRef])

  // Reduced motion detection
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionRef.current = mql.matches
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Visibility change
  // biome-ignore lint/correctness/useExhaustiveDependencies: draw is a stable ref callback, intentional omission
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden && !rafRef.current) {
        rafRef.current = requestAnimationFrame(draw)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const draw = useCallback(() => {
    if (document.hidden) {
      rafRef.current = 0
      return
    }

    const canvas = canvasRef.current
    const { w, h } = sizeRef.current
    if (!canvas || w === 0 || h === 0) {
      rafRef.current = requestAnimationFrame(draw)
      return
    }

    const cfg = configRef.current
    const dpr = getDpr()

    const now_ms = performance.now()
    const dt = lastFrameRef.current ? Math.min(now_ms - lastFrameRef.current, MAX_DELTA_MS) : 16.67
    lastFrameRef.current = now_ms

    // Resize canvas
    const targetW = Math.round(w * dpr)
    const targetH = Math.round(h * dpr)
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW
      canvas.height = targetH
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
    }

    let ctx = ctxRef.current
    if (!ctx || ctx.canvas !== canvas) {
      ctx = canvas.getContext('2d')
      ctxRef.current = ctx
    }
    if (!ctx) {
      rafRef.current = requestAnimationFrame(draw)
      return
    }

    applyDpr(ctx, dpr, w, h)

    const noMotion = reducedMotionRef.current

    // Lerp display value
    const speed = noMotion ? 1 : cfg.lerpSpeed
    const smoothValue = lerp(displayValueRef.current, cfg.value, speed, dt)
    displayValueRef.current = smoothValue

    // Lerp min/max
    if (!rangeInitedRef.current) {
      displayMinRef.current = cfg.min
      displayMaxRef.current = cfg.max
      rangeInitedRef.current = true
    } else {
      displayMinRef.current = lerp(displayMinRef.current, cfg.min, 0.06, dt)
      displayMaxRef.current = lerp(displayMaxRef.current, cfg.max, 0.06, dt)
    }

    const displayMin = displayMinRef.current
    const displayMax = displayMaxRef.current
    const range = displayMax - displayMin || 1

    // Gauge geometry — semi-circle arcs upward from center at bottom
    const arcWidth = 12
    const paddingH = 20
    const hasValueDisplay = cfg.valueDisplayRef != null
    const paddingBottom = hasValueDisplay ? (cfg.label ? 58 : 44) : 24
    const tickSpace = cfg.showTicks && cfg.showTickLabels ? 30 : cfg.showTicks ? 14 : 0
    const availableW = w - paddingH * 2 - tickSpace * 2
    const availableH = h - paddingBottom - tickSpace - 8
    const radius = Math.max(20, Math.min(availableW / 2, availableH) - arcWidth / 2)
    const cx = w / 2
    const cy = h - paddingBottom

    const startAngle = cfg.startAngle
    const endAngle = cfg.endAngle
    const totalAngle = endAngle - startAngle

    const valueToAngle = (v: number): number => {
      const t = Math.max(0, Math.min(1, (v - displayMin) / range))
      return startAngle + t * totalAngle
    }

    const layout: GaugeLayout = {
      w,
      h,
      cx,
      cy,
      radius,
      arcWidth,
      startAngle,
      endAngle,
      valueToAngle,
    }
    layoutRef.current = layout

    // Value history for momentum — only record when value changes
    const history = valueHistoryRef.current
    const lastEntry = history[history.length - 1]
    if (!lastEntry || lastEntry.value !== cfg.value) {
      history.push({ time: now_ms / 1000, value: cfg.value })
      if (history.length > VALUE_HISTORY_SIZE) {
        history.splice(0, history.length - VALUE_HISTORY_SIZE)
      }
    }

    // Momentum detection
    let momentum: Momentum = 'flat'
    if (cfg.showMomentum && history.length >= 5) {
      if (cfg.momentumOverride) {
        momentum = cfg.momentumOverride
      } else {
        const points = history.map((h) => ({ time: h.time, value: h.value }))
        let min = Infinity,
          max = -Infinity
        for (const p of points) {
          if (p.value < min) {
            min = p.value
          }
          if (p.value > max) {
            max = p.value
          }
        }
        const pRange = max - min
        if (pRange > 0) {
          const tailStart = Math.max(0, points.length - 5)
          const first = points[tailStart].value
          const last = points[points.length - 1].value
          const delta = last - first
          const threshold = pRange * 0.12
          if (delta > threshold) {
            momentum = 'up'
          } else if (delta < -threshold) {
            momentum = 'down'
          }
        }
      }
    }
    lastMomentumRef.current = momentum

    // Swing magnitude for particles
    const targetSwing =
      momentum !== 'flat'
        ? Math.min(
            1,
            Math.abs(cfg.value - (history[Math.max(0, history.length - 5)]?.value ?? cfg.value)) /
              (range * 0.1 || 1),
          )
        : 0
    swingMagnitudeRef.current = lerp(
      swingMagnitudeRef.current,
      targetSwing,
      SWING_MAGNITUDE_SPEED,
      dt,
    )

    // Momentum glow
    const glowTarget = momentum !== 'flat' ? 1 : 0
    momentumGlowRef.current = lerp(momentumGlowRef.current, glowTarget, MOMENTUM_GLOW_SPEED, dt)

    // Chart reveal
    const hasData = !cfg.loading
    const revealTarget = hasData ? 1 : 0
    const revealSpeed = noMotion
      ? 1
      : revealTarget > chartRevealRef.current
        ? CHART_REVEAL_SPEED_FWD
        : CHART_REVEAL_SPEED
    chartRevealRef.current = lerp(chartRevealRef.current, revealTarget, revealSpeed, dt)
    if (chartRevealRef.current > 0.999) {
      chartRevealRef.current = 1
    }
    if (chartRevealRef.current < 0.001) {
      chartRevealRef.current = 0
    }
    const chartReveal = chartRevealRef.current

    const valueAngle = valueToAngle(smoothValue)

    // Tick count
    const tickCount = cfg.tickCount > 0 ? cfg.tickCount : autoTickCount(radius)

    // Draw
    drawGaugeFrame(ctx, layout, cfg.palette, {
      smoothValue,
      valueAngle,
      min: displayMin,
      max: displayMax,
      momentum,
      momentumGlowAlpha: momentumGlowRef.current,
      zones: cfg.zones,
      showTicks: cfg.showTicks,
      tickCount,
      showTickLabels: cfg.showTickLabels,
      showDot: cfg.showDot,
      showPulse: cfg.showPulse,
      pointer: cfg.pointer,
      formatValue: cfg.formatValue,
      dt,
      now_ms,
      chartReveal,
      loading: cfg.loading,
      particleState: cfg.degenOptions ? particleStateRef.current : undefined,
      particleOptions: cfg.degenOptions,
      swingMagnitude: swingMagnitudeRef.current,
      shakeState: cfg.degenOptions ? shakeStateRef.current : undefined,
    })

    // Value display (DOM, no re-renders)
    const valEl = cfg.valueDisplayRef?.current
    if (valEl) {
      const wrapper = valEl.parentElement
      if (cfg.loading) {
        if (wrapper) {
          wrapper.style.opacity = '0'
        }
      } else {
        if (wrapper) {
          wrapper.style.opacity = '1'
        }
        valEl.textContent = cfg.formatValue(smoothValue)
        if (cfg.showMomentum) {
          const mc = momentum === 'up' ? '#22c55e' : momentum === 'down' ? '#ef4444' : ''
          if (mc) {
            valEl.style.color = mc
          } else {
            valEl.style.removeProperty('color')
          }
        } else {
          valEl.style.removeProperty('color')
        }
      }
      if (wrapper) {
        if (cfg.pointer === 'circle') {
          wrapper.style.bottom = `${paddingBottom - 5}px`
        } else {
          wrapper.style.bottom = '4px'
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [canvasRef])

  // Start/stop loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  return layoutRef
}
