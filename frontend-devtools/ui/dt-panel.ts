import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { DRAG_CONFIG } from '../core/config'
import { calculatePositionForCorner, getBestCorner } from '../core/utils'

export type PanelPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface Position {
  x: number
  y: number
}

@customElement('dt-panel')
export class DtPanel extends LitElement {
  @property({ type: String, reflect: true })
  position: PanelPosition = 'top-right'

  private _panelSize: { width: number; height: number } = { width: 0, height: 0 }

  // Transform-based position (GPU accelerated)
  private _transformPos: Position = { x: 0, y: 0 }
  private _transitionTimeoutId: ReturnType<typeof setTimeout> | null = null
  private _panelResizeObserver: ResizeObserver | null = null

  connectedCallback() {
    super.connectedCallback()
    this.addEventListener('pointerdown', this._handlePointerDown)
    window.addEventListener('resize', this._handleWindowResize)

    this._panelResizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      this._handlePanelResize(entry)
    })
    this._panelResizeObserver.observe(this)
  }

  disconnectedCallback() {
    this.removeEventListener('pointerdown', this._handlePointerDown)
    window.removeEventListener('resize', this._handleWindowResize)
    if (this._transitionTimeoutId) {
      clearTimeout(this._transitionTimeoutId)
      this._transitionTimeoutId = null
    }
    if (this._panelResizeObserver) {
      this._panelResizeObserver.disconnect()
      this._panelResizeObserver = null
    }
    super.disconnectedCallback()
  }

  private _handleWindowResize = () => {
    this._updateTransformFromCorner()
  }

  private _handlePanelResize(entry: ResizeObserverEntry) {
    const borderBoxSize = entry.borderBoxSize[0]
    if (borderBoxSize) {
      this._panelSize = {
        width: borderBoxSize.inlineSize,
        height: borderBoxSize.blockSize,
      }
    }
    this._updateTransformFromCorner()
  }

  private _updateTransformFromCorner() {
    this._transformPos = calculatePositionForCorner(this.position, this._panelSize.width, this._panelSize.height)
    this._applyTransform(false)
  }

  private _handlePointerDown(e: PointerEvent) {
    // Ignore clicks on interactive elements
    const target = e.target as HTMLElement
    if(target.tagName === "DT-SWITCH") {
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
        if (
          !hasMoved &&
          (Math.abs(deltaX) > DRAG_CONFIG.thresholds.dragStart || Math.abs(deltaY) > DRAG_CONFIG.thresholds.dragStart)
        ) {
          hasMoved = true
          this.setAttribute('dragging', '')
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

      this.removeAttribute('dragging')
      this.dispatchEvent(new CustomEvent('drag-end', { bubbles: true, composed: true }))

      if (!hasMoved) return

      // Calculate total movement
      const totalDeltaX = Math.abs(lastMouseX - initialMouseX)
      const totalDeltaY = Math.abs(lastMouseY - initialMouseY)
      const totalMovement = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY)

      // If moved less than snap threshold, return to original corner
      if (totalMovement < DRAG_CONFIG.thresholds.snapDistance) {
        this._transformPos = calculatePositionForCorner(this.position, this.offsetWidth, this.offsetHeight)
        this._applyTransform(true)
        return
      }

      // Determine best corner based on drag direction and position
      const newCorner = getBestCorner(lastMouseX, lastMouseY, initialMouseX, initialMouseY)
      const oldPosition = this.position
      this.position = newCorner
      this._transformPos = calculatePositionForCorner(newCorner, this.offsetWidth, this.offsetHeight)
      this._applyTransform(true)

      if (oldPosition !== newCorner) {
        this.dispatchEvent(
          new CustomEvent('position-change', {
            detail: { position: newCorner, previousPosition: oldPosition },
            bubbles: true,
            composed: true,
          }),
        )
      }
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerEnd)
    document.addEventListener('pointercancel', handlePointerEnd)
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

    :host {
      cursor: grab;
      user-select: none;
      touch-action: none;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'dt-panel': DtPanel
  }
}