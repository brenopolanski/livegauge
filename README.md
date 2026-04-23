# Livegauge

Real-time animated gauge chart for React. Canvas-rendered, 60fps, zero CSS imports.

> _Inspired by the [Liveline](https://github.com/benjitaylor/liveline) project by [@benjitaylor](https://github.com/benjitaylor)._

## Install

```bash
pnpm add livegauge
```

Peer dependency: `react >=18`.

## Quick Start

```tsx
import { Gauge } from 'livegauge';

function Dashboard() {
  const [speed, setSpeed] = useState(42);

  return (
    <div style={{ width: 300, height: 200 }}>
      <Gauge value={speed} min={0} max={100} color="#3b82f6" theme="dark" />
    </div>
  );
}
```

The component fills its parent container. Set a width and height on the parent.

## Props

**Data**

| Prop    | Type     | Default  | Description         |
| ------- | -------- | -------- | ------------------- |
| `value` | `number` | required | Current gauge value |
| `min`   | `number` | `0`      | Minimum value       |
| `max`   | `number` | `100`    | Maximum value       |

**Appearance**

| Prop         | Type                   | Default     | Description                                             |
| ------------ | ---------------------- | ----------- | ------------------------------------------------------- |
| `theme`      | `'light' \| 'dark'`    | `'dark'`    | Color scheme                                            |
| `color`      | `string`               | `'#3b82f6'` | Accent color — arc fill, dot, glow derived from this    |
| `pointer`    | `'needle' \| 'circle'` | `'needle'`  | Pointer style                                           |
| `zones`      | `GaugeZone[]`          | —           | Color segments `{ from, to, color }` on the arc         |
| `ticks`      | `boolean \| number`    | `true`      | Tick marks. `true` = auto count, `number` = exact count |
| `tickLabels` | `boolean`              | `false`     | Value labels next to tick marks                         |
| `arcWidth`   | `number`               | `12`        | Stroke width of the arc in pixels                       |
| `showValue`  | `boolean`              | `true`      | Large centered value display                            |
| `label`      | `string`               | —           | Text below the value (e.g. "km/h", "RPM")               |

**Animation**

| Prop        | Type                      | Default | Description                                                         |
| ----------- | ------------------------- | ------- | ------------------------------------------------------------------- |
| `momentum`  | `boolean \| Momentum`     | `true`  | Dot/glow by direction. `true` = auto, or `'up' \| 'down' \| 'flat'` |
| `degen`     | `boolean \| DegenOptions` | `false` | Burst particles + shake on momentum swings                          |
| `loading`   | `boolean`                 | `false` | Sweeping arc animation while waiting for data                       |
| `lerpSpeed` | `number`                  | `0.08`  | Interpolation speed (0–1)                                           |
| `dot`       | `boolean`                 | `false` | Show dot at needle tip                                              |
| `pulse`     | `boolean`                 | `false` | Pulsing ring on needle tip dot                                      |
| `tooltip`   | `boolean`                 | `false` | Show value tooltip on hover                                         |

**Formatting**

| Prop          | Type                    | Default        | Description           |
| ------------- | ----------------------- | -------------- | --------------------- |
| `formatValue` | `(v: number) => string` | `v.toFixed(0)` | Value label formatter |

**Advanced**

| Prop         | Type            | Default       | Description                       |
| ------------ | --------------- | ------------- | --------------------------------- |
| `startAngle` | `number`        | `Math.PI`     | Arc start angle in radians (left) |
| `endAngle`   | `number`        | `Math.PI * 2` | Arc end angle in radians (right)  |
| `className`  | `string`        | —             | Container class                   |
| `style`      | `CSSProperties` | —             | Container styles                  |

## Examples

### Basic gauge

```tsx
<Gauge value={72} color="#3b82f6" theme="dark" />
```

### With color zones

```tsx
<Gauge
  value={speed}
  min={0}
  max={200}
  color="#22c55e"
  zones={[
    { from: 0, to: 80, color: '#22c55e' },
    { from: 80, to: 140, color: '#f59e0b' },
    { from: 140, to: 200, color: '#ef4444' },
  ]}
  label="km/h"
  formatValue={(v) => v.toFixed(0)}
/>
```

### Degen mode (particles + shake)

```tsx
<Gauge
  value={price}
  min={0}
  max={1000}
  color="#f7931a"
  formatValue={(v) => `$${v.toFixed(2)}`}
  degen
/>
```

### Tick labels

```tsx
<Gauge
  value={temperature}
  min={-20}
  max={50}
  color="#ef4444"
  ticks={8}
  label="°C"
  theme="light"
  tickLabels
/>
```

### Loading state

```tsx
<Gauge value={0} loading={isConnecting} color="#8b5cf6" />
```

## How It Works

- **Canvas rendering** — single `<canvas>` element, no DOM nodes per data point
- **requestAnimationFrame** loop pauses when the tab is hidden
- **Frame-rate-independent lerp** on value, range, and glow animations
- **ResizeObserver** tracks container size — no per-frame layout reads
- **Theme derivation** — full palette from one accent color + light/dark mode

No CSS imports. No external dependencies beyond React.

## License

© 2026 Breno Polanski

Licensed under MIT
