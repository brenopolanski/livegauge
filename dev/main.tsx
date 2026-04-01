import React, { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Gauge } from 'livegauge'
import type { GaugeZone } from 'livegauge'

// --- Data generators ---

function randomWalk(prev: number, min: number, max: number, volatility: number): number {
  const delta = (Math.random() - 0.48) * volatility
  return Math.max(min, Math.min(max, prev + delta))
}

// --- Constants ---

const PRESETS = {
  default: {
    label: 'Default',
    min: 0, max: 100, color: '#3b82f6',
    zones: undefined as GaugeZone[] | undefined,
    unit: '',
    format: (v: number) => v.toFixed(0),
    startValue: 65,
    volatility: 1.5,
  },
  speedometer: {
    label: 'Speedometer',
    min: 0, max: 220, color: '#3b82f6',
    zones: [
      { from: 0, to: 80, color: '#22c55e' },
      { from: 80, to: 160, color: '#f59e0b' },
      { from: 160, to: 220, color: '#ef4444' },
    ] as GaugeZone[],
    unit: 'km/h',
    format: (v: number) => v.toFixed(0),
    startValue: 40,
    volatility: 3,
  },
  temperature: {
    label: 'Temperature',
    min: -20, max: 50, color: '#ef4444',
    zones: [
      { from: -20, to: 0, color: '#3b82f6' },
      { from: 0, to: 25, color: '#22c55e' },
      { from: 25, to: 35, color: '#f59e0b' },
      { from: 35, to: 50, color: '#ef4444' },
    ] as GaugeZone[],
    unit: '°C',
    format: (v: number) => v.toFixed(1),
    startValue: 22,
    volatility: 0.8,
  },
  battery: {
    label: 'Battery',
    min: 0, max: 100, color: '#22c55e',
    zones: [
      { from: 0, to: 20, color: '#ef4444' },
      { from: 20, to: 50, color: '#f59e0b' },
      { from: 50, to: 100, color: '#22c55e' },
    ] as GaugeZone[],
    unit: '%',
    format: (v: number) => v.toFixed(0),
    startValue: 72,
    volatility: 0.5,
  },
  crypto: {
    label: 'Fear & Greed',
    min: 0, max: 100, color: '#f7931a',
    zones: [
      { from: 0, to: 25, color: '#ef4444' },
      { from: 25, to: 45, color: '#f59e0b' },
      { from: 45, to: 55, color: '#a3a3a3' },
      { from: 55, to: 75, color: '#22c55e' },
      { from: 75, to: 100, color: '#16a34a' },
    ] as GaugeZone[],
    unit: '',
    format: (v: number) => v.toFixed(0),
    startValue: 62,
    volatility: 2,
  },
} as const

type PresetKey = keyof typeof PRESETS

// --- Demo ---

function Demo() {
  const [preset, setPreset] = useState<PresetKey>('speedometer')
  const [value, setValue] = useState<number>(PRESETS.speedometer.startValue)
  const [loading, setLoading] = useState(false)
  const [scenario, setScenario] = useState<'live' | 'loading' | 'loading-hold' | 'empty'>('live')

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [ticks, setTicks] = useState(true)
  const [tickLabels, setTickLabels] = useState(false)
  const [showZones, setShowZones] = useState(true)
  const [showValue, setShowValue] = useState(true)
  const [pointer, setPointer] = useState<'needle' | 'circle'>('needle')
  const [dot, setDot] = useState(false)
  const [pulse, setPulse] = useState(false)
  const [momentum, setMomentum] = useState(true)
  const [degen, setDegen] = useState(false)
  const [tooltipOn, setTooltipOn] = useState(false)

  const intervalRef = useRef<number>(0)
  const presetRef = useRef(preset)
  presetRef.current = preset

  const cfg = PRESETS[preset]

  // Start live data
  const startLive = () => {
    clearInterval(intervalRef.current)
    setLoading(false)
    const c = PRESETS[presetRef.current]
    setValue(c.startValue)

    intervalRef.current = window.setInterval(() => {
      const c = PRESETS[presetRef.current]
      setValue(prev => randomWalk(prev, c.min, c.max, c.volatility))
    }, 200)
  }

  useEffect(() => {
    if (scenario === 'loading') {
      setLoading(true)
      clearInterval(intervalRef.current)
      const timer = setTimeout(() => setScenario('live'), 2500)
      return () => clearTimeout(timer)
    }
    if (scenario === 'loading-hold') {
      setLoading(true)
      clearInterval(intervalRef.current)
      return
    }
    if (scenario === 'empty') {
      setLoading(false)
      setValue(0)
      clearInterval(intervalRef.current)
      return
    }
    startLive()
    return () => clearInterval(intervalRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario])

  // Reset value on preset change
  useEffect(() => {
    if (scenario === 'empty') {
      setValue(0)
      return
    }
    const c = PRESETS[preset]
    setValue(c.startValue)
    if (scenario === 'live') {
      clearInterval(intervalRef.current)
      startLive()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset])

  const isDark = theme === 'dark'
  const fgBase = isDark ? '255,255,255' : '0,0,0'
  const pageBg = isDark ? '#111' : '#f5f5f5'

  return (
    <div style={{
      padding: 32, maxWidth: 960, margin: '0 auto',
      color: isDark ? '#fff' : '#111',
      background: pageBg,
      minHeight: '100vh',
      transition: 'background 0.3s, color 0.3s',
      '--fg-02': `rgba(${fgBase},0.02)`,
      '--fg-06': `rgba(${fgBase},0.06)`,
      '--fg-08': `rgba(${fgBase},0.08)`,
      '--fg-20': `rgba(${fgBase},0.2)`,
      '--fg-25': `rgba(${fgBase},0.25)`,
      '--fg-30': `rgba(${fgBase},0.3)`,
      '--fg-35': `rgba(${fgBase},0.35)`,
      '--fg-45': `rgba(${fgBase},0.45)`,
    } as React.CSSProperties}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
        Livegauge Dev
      </h1>
      <p style={{ fontSize: 12, color: 'var(--fg-30)', marginBottom: 20 }}>Stress-test playground</p>

      {/* Preset */}
      <Section label="Preset">
        {(Object.keys(PRESETS) as PresetKey[]).map(k => (
          <Btn key={k} active={preset === k} onClick={() => setPreset(k)}>{PRESETS[k].label}</Btn>
        ))}
      </Section>

      {/* State */}
      <Section label="State">
        <Btn active={scenario === 'loading'} onClick={() => setScenario('loading')}>Loading &rarr; Live</Btn>
        <Btn active={scenario === 'loading-hold'} onClick={() => setScenario('loading-hold')}>Loading</Btn>
        <Btn active={scenario === 'live'} onClick={() => setScenario('live')}>Live</Btn>
        <Btn active={scenario === 'empty'} onClick={() => setScenario('empty')}>Empty</Btn>
      </Section>

      {/* Features */}
      <Section label="Features">
        <Btn active={theme === 'dark'} onClick={() => setTheme('dark')}>Dark</Btn>
        <Btn active={theme === 'light'} onClick={() => setTheme('light')}>Light</Btn>
        <Sep />
        <Btn active={pointer === 'needle'} onClick={() => setPointer('needle')}>Needle</Btn>
        <Btn active={pointer === 'circle'} onClick={() => setPointer('circle')}>Circle</Btn>
        <Sep />
        <Toggle on={ticks} onToggle={setTicks}>Ticks</Toggle>
        <Toggle on={tickLabels} onToggle={setTickLabels}>Tick Labels</Toggle>
        <Toggle on={showZones} onToggle={setShowZones}>Zones</Toggle>
        <Toggle on={showValue} onToggle={setShowValue}>Value</Toggle>
        <Toggle on={dot} onToggle={setDot}>Dot</Toggle>
        <Toggle on={pulse} onToggle={setPulse}>Pulse</Toggle>
        <Toggle on={momentum} onToggle={setMomentum}>Momentum</Toggle>
        <Toggle on={degen} onToggle={setDegen}>Degen</Toggle>
        <Toggle on={tooltipOn} onToggle={setTooltipOn}>Tooltip</Toggle>
      </Section>

      {/* Manual value control */}
      <Section label="Value">
        <input
          type="range"
          min={cfg.min}
          max={cfg.max}
          step={(cfg.max - cfg.min) / 200}
          value={value}
          onChange={e => {
            clearInterval(intervalRef.current)
            setValue(Number(e.target.value))
          }}
          style={{ width: 200, accentColor: cfg.color }}
        />
        <span style={{ fontSize: 11, fontFamily: '"SF Mono", Menlo, monospace', color: 'var(--fg-35)', marginLeft: 8 }}>
          {cfg.format(value)}{cfg.unit ? ` ${cfg.unit}` : ''}
        </span>
      </Section>

      {/* Main gauge */}
      <div style={{
        height: 280,
        background: 'var(--fg-02)',
        borderRadius: 12,
        border: '1px solid var(--fg-06)',
        padding: 16,
        overflow: 'hidden',
        marginTop: 16,
      }}>
        <Gauge
          value={value}
          min={cfg.min}
          max={cfg.max}
          color={cfg.color}
          theme={theme}
          zones={showZones ? cfg.zones : undefined}
          ticks={ticks}
          tickLabels={tickLabels}
          showValue={showValue}
          label={cfg.unit}
          pointer={pointer}
          dot={dot}
          pulse={pulse}
          momentum={momentum}
          degen={degen}
          tooltip={tooltipOn}
          loading={loading}
          formatValue={cfg.format}
        />
      </div>

      {/* Size variants */}
      <p style={{ fontSize: 12, color: 'var(--fg-30)', marginTop: 24, marginBottom: 8 }}>Size variants</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { w: 300, h: 200, label: '300x200' },
          { w: 220, h: 160, label: '220x160' },
          { w: 160, h: 120, label: '160x120' },
          { w: 120, h: 100, label: '120x100' },
        ].map(size => (
          <div key={size.label}>
            <span style={{ fontSize: 10, color: 'var(--fg-25)', display: 'block', marginBottom: 4 }}>
              {size.label}
            </span>
            <div style={{
              width: size.w,
              height: size.h,
              background: 'var(--fg-02)',
              borderRadius: 8,
              border: '1px solid var(--fg-06)',
              overflow: 'hidden',
            }}>
              <Gauge
                value={value}
                min={cfg.min}
                max={cfg.max}
                color={cfg.color}
                theme={theme}
                zones={showZones ? cfg.zones : undefined}
                ticks={ticks && size.w >= 180}
                tickLabels={false}
                showValue={showValue && size.w >= 180}
                label={size.w >= 180 ? cfg.unit : undefined}
                pointer={pointer}
                dot={dot}
                pulse={pulse}
                momentum={momentum}
                loading={loading}
                formatValue={cfg.format}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Gallery: all presets side by side */}
      <p style={{ fontSize: 12, color: 'var(--fg-30)', marginTop: 24, marginBottom: 8 }}>All presets</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {(Object.keys(PRESETS) as PresetKey[]).map(k => {
          const p = PRESETS[k]
          return (
            <div key={k}>
              <span style={{ fontSize: 10, color: 'var(--fg-25)', display: 'block', marginBottom: 4 }}>
                {p.label}
              </span>
              <div style={{
                width: 220,
                height: 160,
                background: 'var(--fg-02)',
                borderRadius: 8,
                border: '1px solid var(--fg-06)',
                overflow: 'hidden',
              }}>
                <Gauge
                  value={k === preset ? value : p.startValue}
                  min={p.min}
                  max={p.max}
                  color={p.color}
                  theme={theme}
                  zones={p.zones}
                  ticks
                  showValue
                  label={p.unit}
                  dot={false}
                  pulse={false}
                  momentum
                  formatValue={p.format}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Status bar */}
      <div style={{
        marginTop: 16,
        fontSize: 11,
        fontFamily: '"SF Mono", Menlo, monospace',
        color: 'var(--fg-25)',
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <span>preset: {preset}</span>
        <span>value: {cfg.format(value)}{cfg.unit}</span>
        <span>range: {cfg.min}–{cfg.max}</span>
        <span>pointer: {pointer}</span>
        <span>loading: {String(loading)}</span>
        <span>theme: {theme}</span>
      </div>
    </div>
  )
}

// --- UI components ---

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10, color: 'var(--fg-30)', width: 56, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

function Sep() {
  return <div style={{ width: 1, height: 16, background: 'var(--fg-08)', margin: '0 2px' }} />
}

function Toggle({ on, onToggle, children }: { on: boolean; onToggle: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      onClick={() => onToggle(!on)}
      style={{
        fontSize: 11,
        padding: '4px 10px',
        borderRadius: 5,
        border: '1px solid',
        borderColor: on ? 'rgba(59,130,246,0.4)' : 'var(--fg-06)',
        background: on ? 'rgba(59,130,246,0.1)' : 'transparent',
        color: on ? '#3b82f6' : 'var(--fg-35)',
        cursor: 'pointer',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function Btn({ children, active, onClick }: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: '4px 10px',
        borderRadius: 5,
        border: '1px solid',
        borderColor: active ? 'rgba(59,130,246,0.5)' : 'var(--fg-08)',
        background: active ? 'rgba(59,130,246,0.12)' : 'var(--fg-02)',
        color: active ? '#3b82f6' : 'var(--fg-45)',
        cursor: 'pointer',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

createRoot(document.getElementById('root')!).render(<Demo />)
