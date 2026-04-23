import { useCallback, useEffect, useRef } from 'react'

interface TooltipConfig {
  enabled: boolean
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  tooltipRef: React.RefObject<HTMLDivElement | null>
  theme: 'dark' | 'light'
  formatValue: (v: number) => string
  posToValue: (x: number, y: number) => number | null
}

export function useTooltip(config: TooltipConfig) {
  const configRef = useRef(config)
  configRef.current = config

  const onMouseMove = useCallback((e: MouseEvent) => {
    const cfg = configRef.current
    const canvas = cfg.canvasRef.current
    if (!cfg.enabled) {
      if (canvas) {
        canvas.style.cursor = ''
      }
      return
    }
    const tooltip = cfg.tooltipRef.current
    if (!canvas || !tooltip) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const val = cfg.posToValue(x, y)
    if (val === null) {
      canvas.style.cursor = ''
      tooltip.style.opacity = '0'
      tooltip.style.pointerEvents = 'none'
      return
    }

    canvas.style.cursor = 'crosshair'

    tooltip.textContent = cfg.formatValue(val)
    tooltip.style.opacity = '1'

    const tw = tooltip.offsetWidth
    const th = tooltip.offsetHeight

    let tx = e.clientX - rect.left - tw / 2
    let ty = e.clientY - rect.top - th - 10

    if (tx < 2) {
      tx = 2
    }
    if (tx + tw > rect.width - 2) {
      tx = rect.width - tw - 2
    }
    if (ty < 2) {
      ty = e.clientY - rect.top + 14
    }

    tooltip.style.left = `${tx}px`
    tooltip.style.top = `${ty}px`
  }, [])

  const onMouseLeave = useCallback(() => {
    const c = configRef.current.canvasRef.current
    if (c) {
      c.style.cursor = ''
    }
    const tooltip = configRef.current.tooltipRef.current
    if (tooltip) {
      tooltip.style.opacity = '0'
      tooltip.style.pointerEvents = 'none'
    }
  }, [])

  useEffect(() => {
    if (!config.enabled) {
      const c = config.canvasRef.current
      if (c) {
        c.style.cursor = ''
      }
    }
  }, [config.enabled, config.canvasRef])

  useEffect(() => {
    const canvas = config.canvasRef.current
    if (!canvas) {
      return
    }
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [config.canvasRef, onMouseMove, onMouseLeave])
}
