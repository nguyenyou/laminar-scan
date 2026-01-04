// ============================================================================
// UTILITIES
// ============================================================================
// Pure helper functions with no side effects or dependencies.
// ============================================================================

export const CONFIG = {
  colors: {
    primary: { r: 115, g: 97, b: 230 },
    inspectStroke: 'rgba(142, 97, 227, 0.5)',
    inspectFill: 'rgba(173, 97, 230, 0.10)',
    inspectPillBg: 'rgba(37, 37, 38, 0.75)',
    inspectPillText: 'white',
    inspectMarkedStroke: 'rgba(79, 192, 255, 0.6)',
    inspectMarkedFill: 'rgba(79, 192, 255, 0.10)',
    inspectMarkedPillBg: 'rgba(20, 60, 80, 0.85)',
    inspectMarkedPillText: '#79c0ff',
    inspectReactStroke: 'rgba(97, 218, 251, 0.6)',
    inspectReactFill: 'rgba(97, 218, 251, 0.10)',
    inspectReactPillBg: 'rgba(20, 44, 52, 0.90)',
    inspectReactPillText: '#61dafb',
  },

  animation: {
    totalFrames: 45,
    highlightDurationMs: 750,
    interpolationSpeed: 0.51,
    snapTransitionMs: 300,
    tooltipFadeMs: 200,
    tooltipSlideMs: 120,
  },

  dimensions: {
    toolbarWidth: 284,
    tooltipMinHeight: 92,
    safeArea: 16,
    collapsedHorizontal: { width: 20, height: 48 },
    collapsedVertical: { width: 48, height: 20 },
    radarSize: 220,
  },

  thresholds: {
    dragStart: 5,
    snapDistance: 60,
    collapseRatio: 0.5,
    expandDragDistance: 50,
    fpsWarning: 50,
    fpsCritical: 30,
    memoryWarning: 60,
    memoryCritical: 80,
  },

  intervals: {
    fpsDisplay: 200,
    memoryDisplay: 1000,
    resizeDebounce: 100,
    tooltipShowDelay: 400,
    tooltipHideDelay: 200,
  },

  attributes: {
    scalaComponent: 'data-scala',
    devtools: 'data-frontend-devtools',
  },

  properties: {
    sourcePath: '__scalasourcepath',
    sourceLine: '__scalasourceline',
    filename: '__scalafilename',
    name: '__scalaname',
    markAsComponent: '__markascomponent',
  },

  storageKeys: {
    position: 'FRONTEND_DEVTOOLS_POSITION',
    collapsed: 'FRONTEND_DEVTOOLS_COLLAPSED',
    enabled: 'FRONTEND_DEVTOOLS_ENABLED',
    scanning: 'FRONTEND_DEVTOOLS_SCANNING',
    domStatsPinned: 'FRONTEND_DEVTOOLS_DOM_STATS_PINNED',
    lagRadarPinned: 'FRONTEND_DEVTOOLS_LAG_RADAR_PINNED',
  },

  fonts: {
    mono: '11px Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace',
    ui: 'system-ui, -apple-system, sans-serif',
  },
} as const

export function lerp(start: number, end: number, speed: number = CONFIG.animation.interpolationSpeed): number {
  return start + (end - start) * speed
}

/**
 * Clamp a value between min and max bounds.
 * @param value - Value to clamp
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  cancel(): void
}

/**
 * Create a debounced version of a function.
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with cancel() method
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debounced
}

/**
 * Get device pixel ratio, minimum 1.
 * @returns Device pixel ratio
 */
export function getDevicePixelRatio(): number {
  return Math.max(window.devicePixelRatio, 1)
}

/**
 * Check if an element is part of the devtools UI.
 * @param element - Element to check
 * @returns True if element is a devtools element
 */
export function isDevtoolsElement(element: Element | null): boolean {
  if (!element) return false
  const attr = CONFIG.attributes.devtools
  return element.hasAttribute(attr) || element.closest(`[${attr}]`) !== null
}

interface ScalaComponentInfo {
  element: Element
  name: string | null
}

/**
 * Get Scala component info from an element or its ancestors.
 * @param element - Starting element
 * @returns Component info or null
 */
export function getScalaComponent(element: Element | null): ScalaComponentInfo | null {
  if (!element) return null
  const attr = CONFIG.attributes.scalaComponent
  const closest = element.closest(`[${attr}]`)
  if (!closest) return null
  return {
    element: closest as Element,
    name: closest.getAttribute(attr),
  }
}

/**
 * Get the Scala source attribute value from an element or its ancestors.
 * @param node - Starting node
 * @returns Scala source identifier or null
 */
export function getScalaSource(node: Node | null): string | null {
  const element = node && node.nodeType === Node.ELEMENT_NODE ? (node as Element) : (node as Node)?.parentElement
  if (!element) return null

  const attr = CONFIG.attributes.scalaComponent
  const value = element.getAttribute(attr)
  if (value) return value

  const closest = element.closest(`[${attr}]`)
  return closest ? closest.getAttribute(attr) : null
}

interface ComponentSourceInfo {
  sourcePath: string | null
  sourceLine: string | null
  filename: string | null
  scalaName: string | null
  isMarked: boolean
  displayName: string | null
}

/**
 * Extract all source information from a Scala component element.
 * @param element - Component element
 * @returns Source information object
 */
export function getComponentSourceInfo(element: Element | null): ComponentSourceInfo | null {
  if (!element) return null

  const props = CONFIG.properties
  const el = element as any
  return {
    sourcePath: el[props.sourcePath] || null,
    sourceLine: el[props.sourceLine] !== undefined ? String(el[props.sourceLine]) : null,
    filename: el[props.filename] || null,
    scalaName: el[props.name] || null,
    isMarked: el[props.markAsComponent] === 'true',
    displayName: element.getAttribute(CONFIG.attributes.scalaComponent),
  }
}

/**
 * Open a file in the IDE using the IDEA protocol.
 * @param sourcePath - File path to open
 * @param sourceLine - Optional line number
 */
export function openInIDE(sourcePath: string | null, sourceLine: string | null = null): void {
  if (!sourcePath) {
    console.warn('Devtools: No source path provided')
    return
  }

  let uri = `idea://open?file=${sourcePath}`
  if (sourceLine) {
    uri += `&line=${sourceLine}`
  }

  console.log('Devtools: Opening file in IDE:', uri)
  window.open(uri, '_blank')
}