# Laminar Scan

## Lag Radar

The Lag Radar is an SVG-based visualization that displays frame timing performance in real-time. It works like a radar sweep, with each frame rendered as an arc segment.

### How It Works

1. **Radar Sweep Animation**: The radar hand rotates continuously using `requestAnimationFrame`. Each frame, it calculates the rotation delta based on elapsed time since the last frame.

2. **Arc Segments**: Each animation frame draws an arc segment from the previous hand position to the current position. The arc is stored in a circular buffer of configurable size (default: 50 frames).

3. **Color-Coded Performance**: Arc color is determined by frame duration using a logarithmic hue calculation:
   - **Green (hue ~120)**: Fast frames (~16ms, 60fps)
   - **Yellow (hue ~60)**: Moderate lag (~100ms)
   - **Red (hue ~0)**: Severe lag (approaching 1000ms)

4. **Fade Trail**: Older arc segments progressively fade out, creating a trailing effect that shows performance history over the last N frames.

### Visual Interpretation

- **Uniform green segments**: Smooth 60fps performance
- **Mixed colors with occasional yellow/red**: Intermittent frame drops or jank
- **Large red arcs**: Significant main thread blocking (long tasks, heavy computation)
- **Arc size**: Larger arcs indicate longer frame times; small uniform arcs indicate consistent frame pacing
