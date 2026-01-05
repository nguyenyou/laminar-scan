# Laminar Scan

## Lag Radar

The Lag Radar is a real-time visual performance monitor that detects frame drops and jank in your application. It displays a rotating radar sweep where each arc segment represents a single animation frame, colored by how long that frame took to render.

### How It Works

#### Core Animation Loop

The radar uses `requestAnimationFrame` to drive its animation. Each frame:

1. **Measure Time Delta**: Calculates the time elapsed since the last frame using `Date.now()`
2. **Calculate Rotation Delta**: `rdelta = speed × (now - lastFrameTime)`, capped at nearly a full rotation
3. **Draw Arc Segment**: Creates an SVG arc path from the previous position to the new position
4. **Color by Frame Time**: Uses the `_calcHue()` function to map frame duration to a color
5. **Apply Fade Trail**: Updates opacity of all arc segments, with recent frames being more opaque

```
┌─────────────────────────────────────────────────────────┐
│                    ANIMATION FRAME                      │
│                                                         │
│   now = Date.now()                                      │
│   timeDelta = now - last.now                            │
│   rdelta = speed × timeDelta  (radians to rotate)       │
│   rotation = (last.rotation + rdelta) % 2π              │
│                                                         │
│   Draw arc from last position to new position           │
│   Color = calcHue(timeDelta)                            │
└─────────────────────────────────────────────────────────┘
```

#### Color Calculation Algorithm

The hue is calculated using a **logarithmic scale** that maps frame times to colors:

```javascript
_calcHue(msDelta: number): number {
  const maxHue = 120      // Green (HSL hue for green)
  const maxMs = 1000      // Maximum frame time considered (1 second)
  const logF = 10         // Logarithmic factor for sensitivity
  const mult = maxHue / Math.log(maxMs / logF)  // ≈ 26.06

  return maxHue - Math.max(0, Math.min(mult * Math.log(msDelta / logF), maxHue))
}
```

**Color Mapping:**

| Frame Time | Hue | Color | Interpretation |
|------------|-----|-------|----------------|
| ~10ms | 120 | 🟢 Green | Excellent - smooth animation |
| ~16.7ms | ~107 | 🟢 Green | Good - 60 FPS target |
| ~33ms | ~80 | 🟡 Yellow | Warning - frame drops |
| ~50ms | ~62 | 🟠 Orange | Poor - noticeable jank |
| ~100ms | ~36 | 🔴 Red-Orange | Bad - visible stutters |
| ≥1000ms | 0 | 🔴 Red | Critical - severe lag |

The logarithmic scale provides **higher sensitivity at lower frame times** where differences are more perceptible to users (e.g., the difference between 16ms and 33ms is more noticeable than between 500ms and 517ms).

### Behavior on 60Hz vs 120Hz Displays

The lag radar's appearance differs significantly based on display refresh rate because `requestAnimationFrame` is synchronized to the display's V-Sync.

#### 60Hz Display (16.67ms frame budget)

```
Expected Frame Time: 1000ms / 60 = 16.67ms
calcHue(16.67) ≈ 107 (green)

Visual Appearance:
┌─────────────────────┐
│     ╭──────╮        │  Each arc segment covers ~0.0283 radians
│   ╭─╯      ╰─╮      │  (speed × 16.67ms = 0.0017 × 16.67)
│  │   ●───▶   │      │
│   ╰─╮      ╭─╯      │  Uniform GREEN segments when running smoothly
│     ╰──────╯        │  One full rotation ≈ 3.7 seconds
└─────────────────────┘    (2π / 0.0017 / 1000)
```

**Characteristics:**
- **Arc segment size**: Each frame creates an arc of ~1.62° (0.0283 radians)
- **Rotation speed**: Full rotation takes approximately 3.7 seconds
- **Normal color**: Solid green trail when running at 60 FPS
- **Frame drops visible as**: Larger arc segments with yellow/orange/red coloring
- **50 frames buffer**: Shows approximately 0.83 seconds of history

#### 120Hz Display (8.33ms frame budget)

```
Expected Frame Time: 1000ms / 120 = 8.33ms
calcHue(8.33) ≈ 116 (bright green)

Visual Appearance:
┌─────────────────────┐
│     ╭──────╮        │  Each arc segment covers ~0.0142 radians
│   ╭─╯      ╰─╮      │  (speed × 8.33ms = 0.0017 × 8.33)
│  │   ●───▶   │      │
│   ╰─╮      ╭─╯      │  HALF the arc size compared to 60Hz
│     ╰──────╯        │  Same rotation time: ~3.7 seconds
└─────────────────────┘
```

**Characteristics:**
- **Arc segment size**: Each frame creates an arc of ~0.81° (0.0142 radians)
- **Rotation speed**: Same as 60Hz (~3.7 seconds for full rotation)
- **Normal color**: Slightly brighter green (lower frame time = higher hue)
- **Visual density**: Twice as many segments per rotation (smoother appearance)
- **50 frames buffer**: Shows approximately 0.42 seconds of history
- **More sensitive**: Frame drops are more visible because normal segments are smaller

#### Comparison Table

| Aspect | 60Hz Display | 120Hz Display |
|--------|--------------|---------------|
| Frame budget | 16.67ms | 8.33ms |
| Arc per frame | ~1.62° | ~0.81° |
| Rotation time | ~3.7 sec | ~3.7 sec |
| Normal hue | ~107 (green) | ~116 (brighter green) |
| Segments per rotation | ~222 | ~444 |
| History visible | ~0.83 sec (50 frames) | ~0.42 sec (50 frames) |
| Sensitivity | Standard | Higher (smaller normal arcs) |

#### Why Frame Drops Look Different

**On 60Hz:**
```
Normal:     [▓][▓][▓][▓][▓]  ← 16.67ms each, green
With drop:  [▓][▓][█████][▓] ← 50ms frame = larger arc, orange
```

**On 120Hz:**
```
Normal:     [▒][▒][▒][▒][▒][▒][▒][▒]  ← 8.33ms each, bright green
With drop:  [▒][▒][████████][▒][▒]   ← 50ms frame = 6x larger arc, more obvious
```

Frame drops are **more visually prominent on 120Hz displays** because:
1. Normal arcs are smaller, making dropped frames (larger arcs) stand out more
2. The contrast between normal (bright green) and lagging (yellow/orange) is sharper
3. Users on 120Hz displays are often more sensitive to jank

### Configuration Options

The `FdLagRadar` component accepts these properties:

| Property | Default | Description |
|----------|---------|-------------|
| `size` | 220 | Radar diameter in pixels |
| `frames` | 50 | Number of arc segments in the trail |
| `speed` | 0.0017 | Rotation speed (radians per millisecond) |
| `inset` | 3 | Padding from edge for the circle |
| `show-legend` | true | Whether to display the FPS legend |

### Legend

The radar displays a legend with FPS thresholds:

- 🟢 **50+ FPS**: Good performance (green)
- 🟡 **30-50 FPS**: Warning zone (yellow)
- 🔴 **<30 FPS**: Critical performance issues (red)

### Technical Implementation Details

1. **Uses `requestAnimationFrame`**: Ensures the radar itself doesn't cause performance issues and syncs with display refresh
2. **SVG-based rendering**: Efficient vector graphics that scale without pixelation
3. **Circular buffer of 50 arcs**: Reuses SVG path elements to avoid DOM churn
4. **Opacity fade trail**: Recent frames are opaque, older frames fade out
5. **Time-based rotation**: Speed is constant regardless of frame rate (distance = speed × time)
