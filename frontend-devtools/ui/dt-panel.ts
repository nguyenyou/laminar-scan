import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

export type PanelPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface Position {
  x: number
  y: number
}

// Drag configuration (ported from DragController)
const DRAG_CONFIG = {
  thresholds: {
    dragStart: 5,      // Pixels to move before drag initiates
    snapDistance: 60,  // If moved less than this, return to original corner
    directionThreshold: 40  // Threshold for determining drag direction
  },
  animation: {
    snapTransitionMs: 300
  },
  dimensions: {
    safeArea: 16  // Padding from viewport edges
  }
}

/**
 * dt-panel: Positioning container for devtools UI
 *
 * Responsibility: Fixed positioning, z-index layering, drag and snap behavior.
 * Does NOT handle visual styling (background, shadows) - that's the toolbar's job.
 *
 * Features ported from DragController:
 * - PointerEvent support (mouse, touch, pen)
 * - Pointer capture for reliable tracking
 * - RAF-optimized movement updates
 * - GPU-accelerated transforms (translate3d)
 * - Movement threshold before drag starts
 * - Snap threshold - small movements return to original corner
 * - Direction-aware corner snapping
 * - Ignores interactive elements (buttons, inputs)
 */
@customElement('dt-panel')
export class DtPanel extends LitElement {
  @property({ type: String, reflect: true })
  position: PanelPosition = 'top-right'

  @property({ type: Boolean, reflect: true })
  draggable = false

  @state()
  private _isDragging = false

  // Transform-based position (GPU accelerated)
  private _transformPos: Position = { x: 0, y: 0 }
  private _transitionTimeoutId: ReturnType<typeof setTimeout> | null = null

  connectedCallback() {
    super.connectedCallback()
    // Initialize position based on corner
    this._updateTransformFromCorner()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this._transitionTimeoutId) {
      clearTimeout(this._transitionTimeoutId)
      this._transitionTimeoutId = null
    }
  }

  private _updateTransformFromCorner() {
    const rect = this.getBoundingClientRect()
    this._transformPos = this._calculatePositionForCorner(
      this.position,
      rect.width || 0,
      rect.height || 0
    )
    this._applyTransform(false)
  }

  private _calculatePositionForCorner(corner: PanelPosition, width: number, height: number): Position {
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

  private _handlePointerDown(e: PointerEvent) {
    if (!this.draggable) return

    // Ignore clicks on interactive elements
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('label') || target.closest('.clickable')) {
      return
    }

    e.preventDefault()

    const initialMouseX = e.clientX
    const initialMouseY = e.clientY
    const initialX = this._transformPos.x
    const initialY = this._transformPos.y

    let currentX = initialX
    let currentY = initialY
    let lastMouseX = initialMouseX
    let lastMouseY = initialMouseY
    let hasMoved = false
    let rafId: number | null = null

    // Capture pointer for reliable tracking
    this.setPointerCapture(e.pointerId)
    const pointerId = e.pointerId

    const handlePointerMove = (moveEvent: PointerEvent) => {
      lastMouseX = moveEvent.clientX
      lastMouseY = moveEvent.clientY

      // Throttle with RAF
      if (rafId) return

      rafId = requestAnimationFrame(() => {
        const deltaX = lastMouseX - initialMouseX
        const deltaY = lastMouseY - initialMouseY

        // Check if we've moved enough to start dragging
        if (!hasMoved && (Math.abs(deltaX) > DRAG_CONFIG.thresholds.dragStart || Math.abs(deltaY) > DRAG_CONFIG.thresholds.dragStart)) {
          hasMoved = true
          this._isDragging = true
          this.dispatchEvent(new CustomEvent('drag-start', { bubbles: true, composed: true }))
        }

        if (hasMoved) {
          currentX = initialX + deltaX
          currentY = initialY + deltaY
          this.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
        }

        rafId = null
      })
    }

    const handlePointerEnd = () => {
      if (this.hasPointerCapture(pointerId)) {
        this.releasePointerCapture(pointerId)
      }

      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerEnd)
      document.removeEventListener('pointercancel', handlePointerEnd)

      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }

      this._isDragging = false
      this.dispatchEvent(new CustomEvent('drag-end', { bubbles: true, composed: true }))

      if (!hasMoved) return

      // Calculate total movement
      const totalDeltaX = Math.abs(lastMouseX - initialMouseX)
      const totalDeltaY = Math.abs(lastMouseY - initialMouseY)
      const totalMovement = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY)

      // If moved less than snap threshold, return to original corner
      if (totalMovement < DRAG_CONFIG.thresholds.snapDistance) {
        this._transformPos = this._calculatePositionForCorner(
          this.position,
          this.offsetWidth,
          this.offsetHeight
        )
        this._applyTransform(true)
        return
      }

      // Determine best corner based on drag direction and position
      const newCorner = this._getBestCorner(lastMouseX, lastMouseY, initialMouseX, initialMouseY)
      const oldPosition = this.position
      this.position = newCorner
      this._transformPos = this._calculatePositionForCorner(newCorner, this.offsetWidth, this.offsetHeight)
      this._applyTransform(true)

      if (oldPosition !== newCorner) {
        this.dispatchEvent(new CustomEvent('position-change', {
          detail: { position: newCorner, previousPosition: oldPosition },
          bubbles: true,
          composed: true
        }))
      }
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerEnd)
    document.addEventListener('pointercancel', handlePointerEnd)
  }

  private _getBestCorner(mouseX: number, mouseY: number, initialMouseX: number, initialMouseY: number): PanelPosition {
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
      return movingRight
        ? (isBottom ? 'bottom-right' : 'top-right')
        : (isBottom ? 'bottom-left' : 'top-left')
    }

    // Then vertical movement
    if (movingDown || movingUp) {
      const isRight = mouseX > centerX
      return movingDown
        ? (isRight ? 'bottom-right' : 'bottom-left')
        : (isRight ? 'top-right' : 'top-left')
    }

    // Fallback to quadrant-based
    return mouseX > centerX
      ? (mouseY > centerY ? 'bottom-right' : 'top-right')
      : (mouseY > centerY ? 'bottom-left' : 'top-left')
  }

  private _applyTransform(animate: boolean) {
    if (animate) {
      if (this._transitionTimeoutId) {
        clearTimeout(this._transitionTimeoutId)
      }

      this.style.transition = `transform ${DRAG_CONFIG.animation.snapTransitionMs}ms cubic-bezier(0.4, 0, 0.2, 1)`

      requestAnimationFrame(() => {
        this.style.transform = `translate3d(${this._transformPos.x}px, ${this._transformPos.y}px, 0)`
      })

      this._transitionTimeoutId = setTimeout(() => {
        this.style.transition = 'none'
        this._transitionTimeoutId = null
      }, DRAG_CONFIG.animation.snapTransitionMs + 50)
    } else {
      this.style.transition = 'none'
      this.style.transform = `translate3d(${this._transformPos.x}px, ${this._transformPos.y}px, 0)`
    }
  }

  render() {
    return html`<slot></slot>`
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties)
    // Sync dragging state with attribute for CSS styling
    if (changedProperties.has('_isDragging')) {
      if (this._isDragging) {
        this.setAttribute('dragging', '')
      } else {
        this.removeAttribute('dragging')
      }
    }
  }

  static styles = css`
    :host {
      display: block;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 9999;
      will-change: transform;
      transform: translate3d(0, 0, 0);
      backface-visibility: hidden;
    }

    :host([dragging]) {
      cursor: grabbing;
    }

    :host([draggable]) {
      cursor: grab;
      user-select: none;
      touch-action: none;
    }
  `

  firstUpdated() {
    if (this.draggable) {
      this.addEventListener('pointerdown', this._handlePointerDown.bind(this))
      // Initialize position after first render
      requestAnimationFrame(() => this._updateTransformFromCorner())
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dt-panel': DtPanel
  }
}

