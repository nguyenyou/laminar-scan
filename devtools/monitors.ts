// ============================================================================
// PERFORMANCE MONITORS
// ============================================================================
// FPS and Memory monitoring with encapsulated state.
// ============================================================================

import { CONFIG } from './config'

// ----------------------------------------------------------------------------
// Extended Performance API types (non-standard / newer APIs)
// ----------------------------------------------------------------------------

/** Chrome-specific memory info from performance.memory */
interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

/** Extended Performance interface with non-standard APIs */
interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory
}

/** Number of FPS samples to keep for radar history (one full rotation) */
const FPS_HISTORY_SIZE = 360

interface HistoryData {
  history: number[]
  index: number
  totalSamples: number
}

interface MemoryInfo {
  usedMB: number
  totalMB: number
  limitMB: number
  percent: number
}

interface RadarLastState {
  rotation: number
  now: number
  tx: number
  ty: number
}

/**
 * Monitors frame rate using requestAnimationFrame.
 * Provides real-time FPS tracking with pause/resume capability.
 */
export class FPSMonitor {
  #fps: number = 0
  #frameCount: number = 0
  #lastTime: number = 0
  #animationId: number | null = null
  #paused: boolean = false
  #initialized: boolean = false
  #history: number[] = Array.from({ length: FPS_HISTORY_SIZE }, () => -1)
  #historyIndex: number = 0
  #lastHistorySample: number = 0
  #totalSamples: number = 0

  start(): void {
    if (this.#initialized && !this.#paused) return
    this.#initialized = true
    this.#paused = false
    this.#lastTime = performance.now()
    this.#frameCount = 0
    if (!this.#animationId) {
      this.#animationId = requestAnimationFrame(() => this.#tick())
    }
  }

  stop(): void {
    this.#cancelAnimation()
    this.#fps = 0
    this.#frameCount = 0
    this.#lastTime = 0
    this.#initialized = false
    this.#paused = false
  }

  pause(): void {
    this.#paused = true
    this.#cancelAnimation()
  }

  resume(): void {
    if (!this.#paused || !this.#initialized) return
    this.#paused = false
    this.#lastTime = performance.now()
    this.#frameCount = 0
    if (!this.#animationId) {
      this.#animationId = requestAnimationFrame(() => this.#tick())
    }
  }

  getFPS(): number {
    if (!this.#initialized) {
      this.start()
      return 60
    }
    return this.#fps
  }

  getColor(): string {
    return this.#getColorForFPS(this.#fps)
  }

  #getColorForFPS(fps: number): string {
    const { fpsCritical, fpsWarning } = CONFIG.thresholds
    const { fpsCritical: criticalColor, fpsWarning: warningColor, fpsGood: goodColor } = CONFIG.colors
    if (fps < fpsCritical) return criticalColor
    if (fps < fpsWarning) return warningColor
    return goodColor
  }

  getHistory(): HistoryData {
    return {
      history: this.#history,
      index: this.#historyIndex,
      totalSamples: this.#totalSamples,
    }
  }

  #tick(): void {
    if (this.#paused) {
      this.#animationId = null
      return
    }
    this.#frameCount++
    const now = performance.now()
    if (now - this.#lastTime >= 1000) {
      this.#fps = this.#frameCount
      this.#frameCount = 0
      this.#lastTime = now
    }
    if (now - this.#lastHistorySample >= 16.67) {
      this.#history[this.#historyIndex] = this.#fps
      this.#historyIndex = (this.#historyIndex + 1) % FPS_HISTORY_SIZE
      this.#lastHistorySample = now
      this.#totalSamples++
    }
    this.#animationId = requestAnimationFrame(() => this.#tick())
  }

  #cancelAnimation(): void {
    if (this.#animationId) {
      cancelAnimationFrame(this.#animationId)
      this.#animationId = null
    }
  }
}

/**
 * Renders an animated lag radar visualization using SVG.
 */
export class LagRadar {
  #root: SVGSVGElement | null = null
  #hand: SVGPathElement | null = null
  #arcs: SVGPathElement[] = []
  #animationId: number | null = null
  #size: number = 200
  #running: boolean = false
  #frames: number = 50
  #speed: number = 0.0017
  #inset: number = 3
  #last: RadarLastState | null = null
  #framePtr: number = 0
  #middle: number = 0
  #radius: number = 0

  constructor(
    _fpsMonitor?: FPSMonitor,
    options: { size?: number; frames?: number; speed?: number; inset?: number } = {},
  ) {
    this.#size = options.size || 200
    this.#frames = options.frames || 50
    this.#speed = options.speed || 0.0017
    this.#inset = options.inset || 3
    this.#middle = this.#size / 2
    this.#radius = this.#middle - this.#inset
  }

  #svg(tag: string, props: Record<string, string> = {}, children: Element[] = []): SVGElement {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
    Object.entries(props).forEach(([prop, value]) => el.setAttribute(prop, value))
    children.forEach((child) => el.appendChild(child))
    return el
  }

  create(): SVGSVGElement {
    if (this.#root) return this.#root
    const styles = document.createTextNode(`
      .lagRadar-sweep > * { shape-rendering: crispEdges; }
      .lagRadar-face { fill: transparent; stroke: rgba(255, 255, 255, 0.85); stroke-width: 4px; }
      .lagRadar-hand { stroke: rgba(255, 255, 255, 0.85); stroke-width: 4px; stroke-linecap: round; }
    `)
    this.#hand = this.#svg('path', { class: 'lagRadar-hand' }) as SVGPathElement
    this.#arcs = Array.from({ length: this.#frames }, () => this.#svg('path') as SVGPathElement)
    this.#root = this.#svg(
      'svg',
      {
        class: 'lagRadar',
        height: String(this.#size),
        width: String(this.#size),
        style: 'display: block; margin: 0 auto;',
      },
      [
        this.#svg('style', { type: 'text/css' }, [styles as any]),
        this.#svg('g', { class: 'lagRadar-sweep' }, this.#arcs as any),
        this.#hand,
        this.#svg('circle', {
          class: 'lagRadar-face',
          cx: String(this.#middle),
          cy: String(this.#middle),
          r: String(this.#radius),
        }),
      ],
    ) as SVGSVGElement
    return this.#root
  }

  start(): void {
    if (this.#running) return
    this.#running = true
    this.#last = {
      rotation: 0,
      now: Date.now(),
      tx: this.#middle + this.#radius,
      ty: this.#middle,
    }
    this.#framePtr = 0
    this.#animate()
  }

  stop(): void {
    this.#running = false
    if (this.#animationId) {
      cancelAnimationFrame(this.#animationId)
      this.#animationId = null
    }
  }

  destroy(): void {
    this.stop()
    if (this.#root) this.#root.remove()
    this.#root = null
    this.#hand = null
    this.#arcs = []
  }

  #calcHue(msDelta: number): number {
    const maxHue = 120,
      maxMs = 1000,
      logF = 10
    const mult = maxHue / Math.log(maxMs / logF)
    return maxHue - Math.max(0, Math.min(mult * Math.log(msDelta / logF), maxHue))
  }

  #animate(): void {
    if (!this.#running || !this.#last) return
    const PI2 = Math.PI * 2,
      middle = this.#middle,
      radius = this.#radius,
      frames = this.#frames
    const now = Date.now()
    const rdelta = Math.min(PI2 - this.#speed, this.#speed * (now - this.#last.now))
    const rotation = (this.#last.rotation + rdelta) % PI2
    const tx = middle + radius * Math.cos(rotation)
    const ty = middle + radius * Math.sin(rotation)
    const bigArc = rdelta < Math.PI ? '0' : '1'
    const path = `M${tx} ${ty}A${radius} ${radius} 0 ${bigArc} 0 ${this.#last.tx} ${this.#last.ty}L${middle} ${middle}`
    const hue = this.#calcHue(rdelta / this.#speed)
    this.#arcs[this.#framePtr % frames]?.setAttribute('d', path)
    this.#arcs[this.#framePtr % frames]?.setAttribute('fill', `hsl(${hue}, 80%, 40%)`)
    if (this.#hand) this.#hand.setAttribute('d', `M${middle} ${middle}L${tx} ${ty}`)
    for (let i = 0; i < frames; i++) {
      const arc = this.#arcs[(frames + this.#framePtr - i) % frames]
      if (arc) arc.style.fillOpacity = String(1 - i / frames)
    }
    this.#framePtr++
    this.#last = { now, rotation, tx, ty }
    this.#animationId = requestAnimationFrame(() => this.#animate())
  }
}

/**
 * Monitors JavaScript heap memory usage using the performance.memory API.
 */
export class MemoryMonitor {
  /** Get typed reference to performance with extended APIs */
  private static get perf(): ExtendedPerformance {
    return performance as ExtendedPerformance
  }

  static isSupported(): boolean {
    const p = MemoryMonitor.perf
    return !!(p.memory && typeof p.memory.usedJSHeapSize === 'number')
  }

  private static canUseLegacyMemory(): boolean {
    const memory = MemoryMonitor.perf.memory
    return !!(memory && typeof memory.usedJSHeapSize === 'number')
  }

  getInfo(): MemoryInfo | null {
    // Use legacy performance.memory API
    if (MemoryMonitor.canUseLegacyMemory()) {
      const memory = MemoryMonitor.perf.memory!
      const bytesToMB = (bytes: number) => Math.round(bytes / (1024 * 1024))
      const usedMB = bytesToMB(memory.usedJSHeapSize)
      const totalMB = bytesToMB(memory.totalJSHeapSize)
      const limitMB = bytesToMB(memory.jsHeapSizeLimit)
      const percent = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      return { usedMB, totalMB, limitMB, percent }
    }

    return null
  }

  getColor(percent: number): string {
    const { memoryCritical, memoryWarning } = CONFIG.thresholds
    const { memoryCritical: criticalColor, memoryWarning: warningColor, memoryHealthy: healthyColor } = CONFIG.colors
    if (percent > memoryCritical) return criticalColor
    if (percent > memoryWarning) return warningColor
    return healthyColor
  }
}