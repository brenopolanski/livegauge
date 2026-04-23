import type { GaugePalette, ThemeMode } from './types'

/** Parse any CSS color string to [r, g, b]. Handles hex (#rgb, #rrggbb), rgb(), rgba(). */
export function parseColorRgb(color: string): [number, number, number] {
  const hex = color.match(/^#([0-9a-f]{3,8})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const rgb = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgb) {
    return [+rgb[1], +rgb[2], +rgb[3]]
  }
  return [128, 128, 128]
}

function rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/** Derive a gauge palette from a single accent color + theme mode. */
export function resolveTheme(color: string, mode: ThemeMode): GaugePalette {
  const [r, g, b] = parseColorRgb(color)
  const isDark = mode === 'dark'

  return {
    accent: color,
    accentRgb: [r, g, b],
    arcTrack: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)',
    arcFill: color,
    needleColor: isDark ? '#e5e5e5' : '#1a1a1a',
    needleShadow: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)',
    dotUp: '#22c55e',
    dotDown: '#ef4444',
    dotFlat: color,
    glowUp: 'rgba(34, 197, 94, 0.25)',
    glowDown: 'rgba(239, 68, 68, 0.25)',
    glowFlat: rgba(r, g, b, 0.2),
    tickColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
    tickLabelColor: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)',
    valueColor: isDark ? '#e5e5e5' : '#1a1a1a',
    labelColor: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)',
    bgRgb: isDark ? [10, 10, 10] : [255, 255, 255],
    labelFont: '11px "SF Mono", Menlo, Monaco, "Cascadia Code", monospace',
    valueFont: '600 28px "SF Mono", Menlo, monospace',
    tickFont: '10px "SF Mono", Menlo, Monaco, "Cascadia Code", monospace',
  }
}
