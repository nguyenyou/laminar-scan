export const DRAG_CONFIG = {
  thresholds: {
    dragStart: 5, // Pixels to move before drag initiates
    snapDistance: 60, // If moved less than this, return to original corner
    directionThreshold: 40, // Threshold for determining drag direction
  },
  animation: {
    snapTransitionMs: 300,
  },
  dimensions: {
    safeArea: 16, // Padding from viewport edges
  },
} as const
