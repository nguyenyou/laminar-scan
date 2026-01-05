/**
 * Performance Color Utility
 *
 * Provides consistent color calculation for performance metrics across all devtools components.
 * The color scale is designed to detect long-running tasks that block the main thread.
 *
 * Color mapping (based on frame time):
 * - Green (hue ~120): < 50ms - Normal operation, no blocking
 * - Yellow (hue ~60): 50-100ms - Noticeable jank, possible blocking
 * - Orange (hue ~40): 100-200ms - Definite main thread blocking
 * - Red (hue ~0): > 200ms - Severe blocking (long-running task)
 *
 * The logarithmic scale provides higher sensitivity at lower frame times where
 * differences are more perceptible to users.
 */

/** Configuration for the color calculation */
const COLOR_CONFIG = {
  /** Maximum hue value (green in HSL) */
  maxHue: 120,
  /** Maximum frame time considered (1 second = red) */
  maxMs: 1000,
  /** Logarithmic factor - baseline for "perfect" frame time (~10ms = 100 FPS) */
  logFactor: 10,
  /** Saturation for HSL color */
  saturation: 80,
  /** Lightness for HSL color */
  lightness: 40,
} as const

/** Multiplier for logarithmic conversion */
const LOG_MULTIPLIER = COLOR_CONFIG.maxHue / Math.log(COLOR_CONFIG.maxMs / COLOR_CONFIG.logFactor)

/**
 * Calculate hue based on frame time using a logarithmic scale.
 * Lower frame times (faster) result in higher hue values (greener).
 *
 * @param frameTimeMs - Frame time in milliseconds
 * @returns Hue value from 0 (red) to 120 (green)
 *
 * @example
 * calcHueFromFrameTime(16.7)  // ~107 (green) - 60 FPS
 * calcHueFromFrameTime(50)    // ~78 (yellow-green) - starting to block
 * calcHueFromFrameTime(100)   // ~60 (yellow) - blocking detected
 * calcHueFromFrameTime(500)   // ~15 (red-orange) - severe blocking
 */
export function calcHueFromFrameTime(frameTimeMs: number): number {
  if (frameTimeMs <= 0) return COLOR_CONFIG.maxHue

  const logValue = Math.log(frameTimeMs / COLOR_CONFIG.logFactor)
  const scaledValue = LOG_MULTIPLIER * logValue
  const clampedValue = Math.max(0, Math.min(scaledValue, COLOR_CONFIG.maxHue))

  return COLOR_CONFIG.maxHue - clampedValue
}

/**
 * Calculate hue based on FPS by converting to frame time.
 * Higher FPS values result in higher hue values (greener).
 *
 * @param fps - Frames per second
 * @returns Hue value from 0 (red) to 120 (green)
 *
 * @example
 * calcHueFromFps(60)   // ~107 (green) - normal
 * calcHueFromFps(20)   // ~78 (yellow-green) - starting to block
 * calcHueFromFps(10)   // ~60 (yellow) - blocking detected
 * calcHueFromFps(2)    // ~15 (red-orange) - severe blocking
 */
export function calcHueFromFps(fps: number): number {
  if (fps <= 0) return 0
  const frameTimeMs = 1000 / fps
  return calcHueFromFrameTime(frameTimeMs)
}

/**
 * Get HSL color string from frame time.
 *
 * @param frameTimeMs - Frame time in milliseconds
 * @returns HSL color string, e.g., "hsl(120, 80%, 40%)"
 */
export function getColorFromFrameTime(frameTimeMs: number): string {
  const hue = calcHueFromFrameTime(frameTimeMs)
  return `hsl(${hue}, ${COLOR_CONFIG.saturation}%, ${COLOR_CONFIG.lightness}%)`
}

/**
 * Get HSL color string from FPS.
 *
 * @param fps - Frames per second
 * @returns HSL color string, e.g., "hsl(120, 80%, 40%)"
 */
export function getColorFromFps(fps: number): string {
  const hue = calcHueFromFps(fps)
  return `hsl(${hue}, ${COLOR_CONFIG.saturation}%, ${COLOR_CONFIG.lightness}%)`
}

