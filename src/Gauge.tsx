import { useRef, useMemo, useCallback } from 'react'
import type { GaugeProps, Momentum, DegenOptions } from './types'
import { resolveTheme } from './theme'
import { useGaugeEngine } from './useGaugeEngine'
import { useTooltip } from './useTooltip'

const defaultFormatValue = (v: number) => v.toFixed(0)

export function Gauge({
  value,
  min = 0,
  max = 100,
  theme = 'dark',
  color = '#3b82f6',
  zones,
  ticks = true,
  tickLabels = false,
  arcWidth,
  showValue = true,
  label,
  momentum = true,
  degen: degenProp,
  loading = false,
  lerpSpeed = 0.08,
  pointer = 'needle',
  dot = false,
  pulse = false,
  tooltip = false,
  formatValue = defaultFormatValue,
  startAngle = Math.PI,
  endAngle = Math.PI * 2,
  className,
  style,
}: GaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const valueDisplayRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const palette = useMemo(() => {
    const p = resolveTheme(color, theme)
    if (arcWidth != null) {
      // Override is handled by the engine layout, palette carries the font/color config
    }
    return p
  }, [color, theme, arcWidth])

  const isDark = theme === 'dark'

  // Resolve momentum prop: boolean enables auto-detect, string overrides
  const showMomentum = momentum !== false
  const momentumOverride: Momentum | undefined =
    typeof momentum === 'string' ? momentum : undefined

  // Degen mode: explicit prop wins
  const degenEnabled = degenProp != null && degenProp !== false
  const degenOptions: DegenOptions | undefined = degenEnabled
    ? (typeof degenProp === 'object' ? degenProp : {})
    : undefined

  const tickCount = typeof ticks === 'number' ? ticks : 0
  const showTicks = ticks !== false

  const safeValue = (value != null && Number.isFinite(value)) ? value : 0

  const layoutRef = useGaugeEngine(canvasRef, containerRef, {
    value: safeValue,
    min,
    max,
    palette,
    lerpSpeed,
    zones,
    showTicks,
    tickCount,
    showTickLabels: tickLabels,
    showDot: dot,
    showPulse: pulse,
    pointer,
    showMomentum,
    momentumOverride,
    degenOptions,
    loading,
    formatValue,
    valueDisplayRef: showValue ? valueDisplayRef : undefined,
    startAngle,
    endAngle,
    label,
  })

  const posToValue = useCallback((cssX: number, cssY: number): number | null => {
    const lay = layoutRef.current
    if (!lay) return null
    const dx = cssX - lay.cx
    const dy = cssY - lay.cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const halfArc = lay.arcWidth / 2
    if (dist < lay.radius - halfArc - 14 || dist > lay.radius + halfArc + 14) return null
    let angle = Math.atan2(dy, dx)
    if (angle < 0) angle += Math.PI * 2
    const totalAngle = lay.endAngle - lay.startAngle
    let normStart = lay.startAngle % (Math.PI * 2)
    if (normStart < 0) normStart += Math.PI * 2
    let rel = angle - normStart
    if (rel < -0.1) rel += Math.PI * 2
    if (rel < -0.05 || rel > totalAngle + 0.05) return null
    const t = Math.max(0, Math.min(1, rel / totalAngle))
    return min + t * (max - min)
  }, [layoutRef, min, max])

  useTooltip({
    enabled: tooltip,
    canvasRef,
    tooltipRef,
    theme,
    formatValue,
    posToValue,
  })

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: tooltip ? 'crosshair' : undefined }}
      />
      {tooltip && (
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.12s',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: '"SF Mono", Menlo, monospace',
            whiteSpace: 'nowrap',
            background: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)',
            color: isDark ? '#111' : '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}
        />
      )}
      {showValue && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 4,
          pointerEvents: 'none',
          transition: 'opacity 0.3s',
        }}>
          <span
            ref={valueDisplayRef}
            style={{
              fontSize: 28,
              fontWeight: 600,
              fontFamily: '"SF Mono", Menlo, monospace',
              color: isDark ? 'rgba(255,255,255,0.85)' : '#111',
              transition: 'color 0.3s',
              letterSpacing: '-0.02em',
            }}
          />
          {label && (
            <span style={{
              fontSize: 11,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
              marginTop: 2,
            }}>
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
