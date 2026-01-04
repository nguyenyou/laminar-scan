import { DRAG_CONFIG } from './config'
import type { PanelPosition, Position } from '../ui/fd-panel'

export function calculatePositionForCorner(corner: PanelPosition, width: number, height: number): Position {
  const safeArea = DRAG_CONFIG.dimensions.safeArea
  const rightX = window.innerWidth - width - safeArea
  const bottomY = window.innerHeight - height - safeArea

  switch (corner) {
    case 'top-left':
      return { x: safeArea, y: safeArea }
    case 'top-right':
      return { x: rightX, y: safeArea }
    case 'bottom-left':
      return { x: safeArea, y: bottomY }
    case 'bottom-right':
    default:
      return { x: rightX, y: bottomY }
  }
}

export function getBestCorner(
  mouseX: number,
  mouseY: number,
  initialMouseX: number,
  initialMouseY: number,
): PanelPosition {
  const deltaX = mouseX - initialMouseX
  const deltaY = mouseY - initialMouseY
  const threshold = DRAG_CONFIG.thresholds.directionThreshold

  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2

  const movingRight = deltaX > threshold
  const movingLeft = deltaX < -threshold
  const movingDown = deltaY > threshold
  const movingUp = deltaY < -threshold

  // Prioritize horizontal movement
  if (movingRight || movingLeft) {
    const isBottom = mouseY > centerY
    return movingRight ? (isBottom ? 'bottom-right' : 'top-right') : isBottom ? 'bottom-left' : 'top-left'
  }

  // Then vertical movement
  if (movingDown || movingUp) {
    const isRight = mouseX > centerX
    return movingDown ? (isRight ? 'bottom-right' : 'bottom-left') : isRight ? 'top-right' : 'top-left'
  }

  // Fallback to quadrant-based
  return mouseX > centerX
    ? mouseY > centerY
      ? 'bottom-right'
      : 'top-right'
    : mouseY > centerY
      ? 'bottom-left'
      : 'top-left'
}