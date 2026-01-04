// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================
// All magic values, constants, and static assets centralized here.
// ============================================================================

interface ColorConfig {
  primary: { r: number; g: number; b: number }
  fpsGood: string
  fpsWarning: string
  fpsCritical: string
  memoryHealthy: string
  memoryWarning: string
  memoryCritical: string
  inspectStroke: string
  inspectFill: string
  inspectPillBg: string
  inspectPillText: string
  inspectMarkedStroke: string
  inspectMarkedFill: string
  inspectMarkedPillBg: string
  inspectMarkedPillText: string
  inspectReactStroke: string
  inspectReactFill: string
  inspectReactPillBg: string
  inspectReactPillText: string
}

interface AnimationConfig {
  totalFrames: number
  interpolationSpeed: number
  snapTransitionMs: number
  tooltipFadeMs: number
  tooltipSlideMs: number
}

interface DimensionsConfig {
  toolbarWidth: number
  tooltipMinHeight: number
  safeArea: number
  collapsedHorizontal: { width: number; height: number }
  collapsedVertical: { width: number; height: number }
  radarSize: number
}

interface ThresholdsConfig {
  dragStart: number
  snapDistance: number
  collapseRatio: number
  expandDragDistance: number
  fpsWarning: number
  fpsCritical: number
  memoryWarning: number
  memoryCritical: number
}

interface IntervalsConfig {
  fpsDisplay: number
  memoryDisplay: number
  resizeDebounce: number
  tooltipShowDelay: number
  tooltipHideDelay: number
}

interface AttributesConfig {
  scalaComponent: string
  devtools: string
}

interface PropertiesConfig {
  sourcePath: string
  sourceLine: string
  filename: string
  name: string
  markAsComponent: string
}

interface StorageKeysConfig {
  position: string
  collapsed: string
  enabled: string
  scanning: string
  domStatsPinned: string
  lagRadarPinned: string
}

interface FontsConfig {
  mono: string
  ui: string
}

interface ConfigType {
  colors: ColorConfig
  animation: AnimationConfig
  dimensions: DimensionsConfig
  thresholds: ThresholdsConfig
  intervals: IntervalsConfig
  attributes: AttributesConfig
  properties: PropertiesConfig
  storageKeys: StorageKeysConfig
  fonts: FontsConfig
}

/**
 * Central configuration object for all devtools settings.
 * Modify these values to customize behavior without hunting through code.
 */
export const CONFIG: ConfigType = {
  colors: {
    primary: { r: 115, g: 97, b: 230 },
    fpsGood: 'rgb(214,132,245)',
    fpsWarning: '#F59E0B',
    fpsCritical: '#EF4444',
    memoryHealthy: '#6EE7B7',
    memoryWarning: '#F59E0B',
    memoryCritical: '#EF4444',
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
}