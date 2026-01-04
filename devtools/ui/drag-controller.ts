// ============================================================================
// DRAG CONTROLLER
// ============================================================================
// Handles drag-to-move and snap-to-corner behavior for the toolbar.
// ============================================================================

import { CONFIG } from '../config'

export interface CollapsedState {
  corner: string
  orientation: string
}

export interface Position {
  x: number
  y: number
}

export interface DragControllerOptions {
  onDragStart?: (isDragging: boolean) => void
  onDragEnd?: () => void
  onPositionChange?: (position: Position, corner: string) => void
  onCollapse?: (corner: string, orientation: string) => void
  onExpand?: (corner: string) => void
}

/**
 * Handles drag-to-move and snap-to-corner behavior for the toolbar.
 */
export class DragController {
  #element: HTMLElement | null = null
  #isDragging = false
  #position: Position = { x: 0, y: 0 }
  #corner = 'bottom-right'
  #collapsed: CollapsedState | null = null
  #transitionTimeoutId: ReturnType<typeof setTimeout> | null = null

  // Callbacks
  #onDragStart: ((isDragging: boolean) => void) | null = null
  #onDragEnd: (() => void) | null = null
  #onPositionChange: ((position: Position, corner: string) => void) | null = null
  #onCollapse: ((corner: string, orientation: string) => void) | null = null
  #onExpand: ((corner: string) => void) | null = null

  /**
   * Create a new DragController.
   */
  constructor(options: DragControllerOptions = {}) {
    this.#onDragStart = options.onDragStart ?? null
    this.#onDragEnd = options.onDragEnd ?? null
    this.#onPositionChange = options.onPositionChange ?? null
    this.#onCollapse = options.onCollapse ?? null
    this.#onExpand = options.onExpand ?? null
  }

  /**
   * Check if currently dragging.
   */
  get isDragging() {
    return this.#isDragging
  }

  /**
   * Get current position.
   */
  get position() {
    return { ...this.#position }
  }

  /**
   * Get current corner.
   */
  get corner() {
    return this.#corner
  }

  /**
   * Get collapsed state.
   */
  get collapsed() {
    return this.#collapsed ? { ...this.#collapsed } : null
  }

  /**
   * Initialize the drag controller with an element.
   */
  init(element: HTMLElement): void {
    this.#element = element
    element.addEventListener('pointerdown', (e: PointerEvent) => this.#handlePointerDown(e))
  }

  /**
   * Attach to an element (alias for init).
   */
  attach(element: HTMLElement): void {
    this.init(element)
  }

  /**
   * Set the current position without animation.
   */
  setPosition(position: Position, corner?: string): void {
    this.#position = { ...position }
    if (corner) this.#corner = corner
    this.#applyPosition(false)
  }

  /**
   * Set collapsed state.
   */
  setCollapsed(state: CollapsedState | null): void {
    this.#collapsed = state ? { ...state } : null
    if (state) {
      this.#corner = state.corner
    }
  }

  /**
   * Animate to a corner position.
   */
  snapToCorner(corner: string, width: number, height: number): void {
    this.#corner = corner
    this.#position = this.#calculatePosition(corner, width, height)
    this.#applyPosition(true)
  }

  /**
   * Expand from collapsed state.
   */
  expand() {
    if (!this.#collapsed) return
    const savedCorner = this.#collapsed.corner
    this.#collapsed = null
    this.#onExpand?.(savedCorner)
  }

  /**
   * Cleanup resources.
   */
  destroy() {
    if (this.#transitionTimeoutId) {
      clearTimeout(this.#transitionTimeoutId)
      this.#transitionTimeoutId = null
    }
    this.#element = null
  }

  /**
   * Handle pointer down event.
   * @private
   */
  #handlePointerDown(e: PointerEvent): void {
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('label') ||
      target.closest('.clickable')
    ) {
      return
    }

    e.preventDefault()
    if (!this.#element) return

    if (this.#collapsed) {
      this.#handleCollapsedDrag(e)
      return
    }

    const toolbar = this.#element
    const toolbarStyle = toolbar.style
    const initialMouseX = e.clientX
    const initialMouseY = e.clientY
    const initialX = this.#position.x
    const initialY = this.#position.y

    let currentX = initialX
    let currentY = initialY
    let lastMouseX = initialMouseX
    let lastMouseY = initialMouseY
    let hasMoved = false
    let rafId: number | null = null

    toolbar.setPointerCapture(e.pointerId)
    const pointerId = e.pointerId

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      lastMouseX = moveEvent.clientX
      lastMouseY = moveEvent.clientY

      if (rafId) return

      rafId = requestAnimationFrame(() => {
        const deltaX = lastMouseX - initialMouseX
        const deltaY = lastMouseY - initialMouseY

        if (
          !hasMoved &&
          (Math.abs(deltaX) > CONFIG.thresholds.dragStart || Math.abs(deltaY) > CONFIG.thresholds.dragStart)
        ) {
          hasMoved = true
          this.#isDragging = true
          toolbar.classList.add('dragging')
          this.#onDragStart?.(true)
        }

        if (hasMoved) {
          currentX = initialX + deltaX
          currentY = initialY + deltaY
          toolbarStyle.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
        }

        rafId = null
      })
    }

    const handlePointerEnd = (): void => {
      if (toolbar.hasPointerCapture(pointerId)) {
        toolbar.releasePointerCapture(pointerId)
      }

      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerEnd)
      document.removeEventListener('pointercancel', handlePointerEnd)

      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }

      toolbar.classList.remove('dragging')
      this.#isDragging = false
      this.#onDragEnd?.()

      if (!hasMoved) return

      const totalDeltaX = Math.abs(lastMouseX - initialMouseX)
      const totalDeltaY = Math.abs(lastMouseY - initialMouseY)
      const totalMovement = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY)

      if (totalMovement < CONFIG.thresholds.snapDistance) {
        this.#position = this.#calculatePosition(this.#corner, toolbar.offsetWidth, toolbar.offsetHeight)
        this.#applyPosition(true)
        return
      }

      const toolbarWidth = CONFIG.dimensions.toolbarWidth
      const toolbarHeight = toolbar.offsetHeight || 40

      if (this.#shouldCollapse(currentX, currentY, toolbarWidth, toolbarHeight)) {
        const target = this.#getCollapseTarget(currentX, currentY, toolbarWidth, toolbarHeight)
        if (target) {
          this.#collapsed = target
          this.#corner = target.corner
          this.#onCollapse?.(target.corner, target.orientation)
          return
        }
      }

      const newCorner = this.#getBestCorner(lastMouseX, lastMouseY, initialMouseX, initialMouseY)
      this.#corner = newCorner
      this.#position = this.#calculatePosition(newCorner, toolbar.offsetWidth, toolbar.offsetHeight)
      this.#applyPosition(true)

      this.#onPositionChange?.(this.#position, this.#corner)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerEnd)
    document.addEventListener('pointercancel', handlePointerEnd)
  }

  /**
   * Handle drag on collapsed toolbar.
   * @private
   */
  #handleCollapsedDrag(e: PointerEvent): void {
    if (!this.#collapsed) return

    const { corner, orientation } = this.#collapsed
    const initialMouseX = e.clientX
    const initialMouseY = e.clientY
    let hasExpanded = false

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      if (hasExpanded) return

      const deltaX = moveEvent.clientX - initialMouseX
      const deltaY = moveEvent.clientY - initialMouseY
      const threshold = CONFIG.thresholds.expandDragDistance

      let shouldExpand = false

      if (orientation === 'horizontal') {
        if (corner.endsWith('left') && deltaX > threshold) shouldExpand = true
        else if (corner.endsWith('right') && deltaX < -threshold) shouldExpand = true
      } else {
        if (corner.startsWith('top') && deltaY > threshold) shouldExpand = true
        else if (corner.startsWith('bottom') && deltaY < -threshold) shouldExpand = true
      }

      if (shouldExpand) {
        hasExpanded = true
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerEnd)
        this.expand()
      }
    }

    const handlePointerEnd = (): void => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerEnd)
    }

    document.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('pointerup', handlePointerEnd)
  }

  /**
   * Apply current position to element.
   * @private
   */
  #applyPosition(animate: boolean): void {
    if (!this.#element) return

    const style = this.#element.style
    style.left = '0'
    style.top = '0'

    if (animate) {
      if (this.#transitionTimeoutId) {
        clearTimeout(this.#transitionTimeoutId)
      }

      style.transition = `transform ${CONFIG.animation.snapTransitionMs}ms cubic-bezier(0.4, 0, 0.2, 1)`

      requestAnimationFrame(() => {
        style.transform = `translate3d(${this.#position.x}px, ${this.#position.y}px, 0)`
      })

      this.#transitionTimeoutId = setTimeout(() => {
        style.transition = 'none'
        this.#transitionTimeoutId = null
      }, CONFIG.animation.snapTransitionMs + 50)
    } else {
      style.transition = 'none'
      style.transform = `translate3d(${this.#position.x}px, ${this.#position.y}px, 0)`
    }
  }

  /**
   * Calculate position for a corner.
   * @private
   */
  #calculatePosition(corner: string, width: number, height: number): Position {
    const safeArea = CONFIG.dimensions.safeArea
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

  /**
   * Determine best corner based on drag direction.
   * @private
   */
  #getBestCorner(mouseX: number, mouseY: number, initialMouseX: number, initialMouseY: number): string {
    const deltaX = mouseX - initialMouseX
    const deltaY = mouseY - initialMouseY
    const threshold = 40

    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    const movingRight = deltaX > threshold
    const movingLeft = deltaX < -threshold
    const movingDown = deltaY > threshold
    const movingUp = deltaY < -threshold

    if (movingRight || movingLeft) {
      const isBottom = mouseY > centerY
      return movingRight ? (isBottom ? 'bottom-right' : 'top-right') : isBottom ? 'bottom-left' : 'top-left'
    }

    if (movingDown || movingUp) {
      const isRight = mouseX > centerX
      return movingDown ? (isRight ? 'bottom-right' : 'bottom-left') : isRight ? 'top-right' : 'top-left'
    }

    return mouseX > centerX
      ? mouseY > centerY
        ? 'bottom-right'
        : 'top-right'
      : mouseY > centerY
        ? 'bottom-left'
        : 'top-left'
  }

  /**
   * Check if toolbar should collapse.
   * @private
   */
  #shouldCollapse(x: number, y: number, width: number, height: number): boolean {
    const right = x + width
    const bottom = y + height

    const outsideLeft = Math.max(0, -x)
    const outsideRight = Math.max(0, right - window.innerWidth)
    const outsideTop = Math.max(0, -y)
    const outsideBottom = Math.max(0, bottom - window.innerHeight)

    const horizontalOutside = Math.min(width, outsideLeft + outsideRight)
    const verticalOutside = Math.min(height, outsideTop + outsideBottom)
    const areaOutside = horizontalOutside * height + verticalOutside * width - horizontalOutside * verticalOutside
    const totalArea = width * height

    return areaOutside > totalArea * CONFIG.thresholds.collapseRatio
  }

  /**
   * Get collapse target corner and orientation.
   * @private
   */
  #getCollapseTarget(x: number, y: number, width: number, height: number): CollapsedState | null {
    const outsideLeft = -x
    const outsideRight = x + width - window.innerWidth
    const outsideTop = -y
    const outsideBottom = y + height - window.innerHeight

    const maxOutside = Math.max(outsideLeft, outsideRight, outsideTop, outsideBottom)
    if (maxOutside < 0) return null

    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    if (outsideLeft === maxOutside) {
      return { orientation: 'horizontal', corner: y < centerY ? 'top-left' : 'bottom-left' }
    } else if (outsideRight === maxOutside) {
      return { orientation: 'horizontal', corner: y < centerY ? 'top-right' : 'bottom-right' }
    } else if (outsideTop === maxOutside) {
      return { orientation: 'vertical', corner: x < centerX ? 'top-left' : 'top-right' }
    } else {
      return { orientation: 'vertical', corner: x < centerX ? 'bottom-left' : 'bottom-right' }
    }
  }
}