import { describe, expect, it } from 'vitest'
import { lerp } from '../lerp'

describe('lerp', () => {
  it('returns target when speed is 1', () => {
    expect(lerp(0, 100, 1, 16.67)).toBeCloseTo(100)
  })

  it('returns current when speed is 0', () => {
    expect(lerp(50, 100, 0, 16.67)).toBe(50)
  })

  it('moves toward target at default dt', () => {
    const result = lerp(0, 100, 0.1)
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(100)
    expect(result).toBeCloseTo(10, 0)
  })

  it('moves more at higher dt (lower framerate)', () => {
    const at60fps = lerp(0, 100, 0.1, 16.67)
    const at30fps = lerp(0, 100, 0.1, 33.33)
    expect(at30fps).toBeGreaterThan(at60fps)
  })

  it('converges after many frames', () => {
    let v = 0
    for (let i = 0; i < 200; i++) {
      v = lerp(v, 100, 0.08, 16.67)
    }
    expect(v).toBeCloseTo(100, 1)
  })
})
