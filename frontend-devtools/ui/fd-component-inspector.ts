import { LitElement, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import {
  CONFIG,
  lerp,
  getDevicePixelRatio,
  isDevtoolsElement,
  getScalaComponent,
  getComponentSourceInfo,
  openInIDE,
} from '../core/utilities'
import {
  getReactComponent,
  getReactComponentSourceInfo,
  getAllReactComponentsFromNode,
} from '../core/react-inspector'

// ============================================================================
// Types
// ============================================================================

interface RectType {
  left: number
  top: number
  width: number
  height: number
}

interface OverlayInfo {
  isMarked?: boolean
  isReact?: boolean
}


// ============================================================================
// FdComponentInspector Component
// ============================================================================

/**
 * Component inspector overlay for inspecting Scala and React components.
 * When active, shows an overlay highlighting the component under the cursor.
 * Click to open source in IDE (for Scala) or log component info (for React).
 */
@customElement('fd-component-inspector')
export class FdComponentInspector extends LitElement {
  @property({ type: Boolean, reflect: true })
  active = false

  // Canvas state
  private _canvas: HTMLCanvasElement | null = null
  private _ctx: CanvasRenderingContext2D | null = null
  private _currentRect: RectType | null = null
  private _animationId: number | null = null
  private _removeTimeoutId: ReturnType<typeof setTimeout> | null = null

  // Event catcher state
  private _eventCatcher: HTMLDivElement | null = null
  private _lastHovered: Element | null = null

  // Bound event handlers
  private _boundHandlePointerMove = this._handlePointerMove.bind(this)
  private _boundHandleClick = this._handleClick.bind(this)
  private _boundHandleKeydown = this._handleKeydown.bind(this)

  // ============================================================================
  // Lifecycle
  // ============================================================================

  protected override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('active')) {
      if (this.active) {
        this._start()
      } else {
        this._stop()
      }
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this._stop()
  }

  // ============================================================================
  // Private Methods - Lifecycle
  // ============================================================================

  private _start(): void {
    this._createCanvas()
    this._createEventCatcher()
    this._addEventListeners()

    // Show with animation
    requestAnimationFrame(() => {
      this._showCanvas()
      if (this._eventCatcher) {
        this._eventCatcher.style.pointerEvents = 'auto'
      }
    })

    this._dispatchChange(true)
  }

  private _stop(): void {
    this._removeEventListeners()
    this._lastHovered = null
    this._destroyCanvas()
    this._destroyEventCatcher()
    this._dispatchChange(false)
  }

  private _dispatchChange(active: boolean): void {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { active },
        bubbles: true,
        composed: true,
      }),
    )
  }

  // ============================================================================
  // Private Methods - Canvas Management
  // ============================================================================

  private _createCanvas(): void {
    if (this._canvas) return

    // Safety check: prevent duplicate canvases
    const existing = document.querySelector(
      `[${CONFIG.attributes.devtools}="inspect-canvas"]`,
    ) as HTMLCanvasElement | null
    if (existing) {
      console.warn('FdComponentInspector: Canvas already exists in DOM, reusing')
      this._canvas = existing
      this._ctx = existing.getContext('2d')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.setAttribute(CONFIG.attributes.devtools, 'inspect-canvas')

    const dpr = getDevicePixelRatio()
    Object.assign(canvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: `${window.innerWidth}px`,
      height: `${window.innerHeight}px`,
      pointerEvents: 'none',
      zIndex: '2147483646',
      opacity: '0',
      transition: 'opacity 0.15s ease-in-out',
    })

    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr

    document.body.appendChild(canvas)

    this._canvas = canvas
    this._ctx = canvas.getContext('2d')
    this._ctx?.scale(dpr, dpr)
  }

  private _showCanvas(): void {
    if (this._canvas) {
      this._canvas.style.opacity = '1'
    }
  }

  private _destroyCanvas(): void {
    this._cancelAnimation()
    this._currentRect = null

    if (this._removeTimeoutId) {
      clearTimeout(this._removeTimeoutId)
      this._removeTimeoutId = null
    }

    if (this._canvas) {
      const canvasToRemove = this._canvas
      this._canvas = null
      this._ctx = null

      canvasToRemove.style.opacity = '0'
      this._removeTimeoutId = setTimeout(() => {
        if (canvasToRemove.parentNode) {
          canvasToRemove.parentNode.removeChild(canvasToRemove)
        }
        this._removeTimeoutId = null
      }, 150)
    }
  }

  private _clearCanvas(): void {
    if (!this._ctx || !this._canvas) return
    const dpr = getDevicePixelRatio()
    this._ctx.clearRect(0, 0, this._canvas.width / dpr, this._canvas.height / dpr)
  }

  private _cancelAnimation(): void {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId)
      this._animationId = null
    }
  }

  // ============================================================================
  // Private Methods - Event Catcher
  // ============================================================================

  private _createEventCatcher(): void {
    if (this._eventCatcher) return

    // Safety check: prevent duplicate event catchers
    const existing = document.querySelector(
      `[${CONFIG.attributes.devtools}="event-catcher"]`,
    ) as HTMLDivElement | null
    if (existing) {
      console.warn('FdComponentInspector: Event catcher already exists in DOM, reusing')
      this._eventCatcher = existing
      return
    }

    const div = document.createElement('div')
    div.setAttribute(CONFIG.attributes.devtools, 'event-catcher')
    Object.assign(div.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '2147483645',
      cursor: 'crosshair',
    })

    document.body.appendChild(div)
    this._eventCatcher = div
  }

  private _destroyEventCatcher(): void {
    if (this._eventCatcher?.parentNode) {
      this._eventCatcher.parentNode.removeChild(this._eventCatcher)
    }
    this._eventCatcher = null
  }

  // ============================================================================
  // Private Methods - Event Listeners
  // ============================================================================

  private _addEventListeners(): void {
    document.addEventListener('pointermove', this._boundHandlePointerMove, {
      passive: true,
      capture: true,
    })
    document.addEventListener('click', this._boundHandleClick, { capture: true })
    document.addEventListener('keydown', this._boundHandleKeydown)
  }

  private _removeEventListeners(): void {
    document.removeEventListener('pointermove', this._boundHandlePointerMove, { capture: true })
    document.removeEventListener('click', this._boundHandleClick, { capture: true })
    document.removeEventListener('keydown', this._boundHandleKeydown)
  }

  // ============================================================================
  // Private Methods - Overlay Drawing
  // ============================================================================

  private _clearOverlay(): void {
    this._currentRect = null
    this._clearCanvas()
  }

  private _animateTo(targetRect: RectType, componentName: string, info: OverlayInfo = {}): void {
    if (!this._currentRect) {
      this._currentRect = { ...targetRect }
      this._drawOverlay(this._currentRect, componentName, info)
      return
    }

    this._cancelAnimation()

    const animate = () => {
      if (!this._currentRect) return
      this._currentRect.left = lerp(this._currentRect.left, targetRect.left)
      this._currentRect.top = lerp(this._currentRect.top, targetRect.top)
      this._currentRect.width = lerp(this._currentRect.width, targetRect.width)
      this._currentRect.height = lerp(this._currentRect.height, targetRect.height)

      this._drawOverlay(this._currentRect, componentName, info)

      const stillMoving =
        Math.abs(this._currentRect.left - targetRect.left) > 0.5 ||
        Math.abs(this._currentRect.top - targetRect.top) > 0.5 ||
        Math.abs(this._currentRect.width - targetRect.width) > 0.5 ||
        Math.abs(this._currentRect.height - targetRect.height) > 0.5

      if (stillMoving) {
        this._animationId = requestAnimationFrame(animate)
      } else {
        this._currentRect = { ...targetRect }
        this._drawOverlay(this._currentRect, componentName, info)
      }
    }

    this._animationId = requestAnimationFrame(animate)
  }

  private _drawOverlay(rect: RectType, componentName: string, info: OverlayInfo): void {
    if (!this._ctx) return

    this._clearCanvas()
    if (!rect) return

    const isMarked = info?.isMarked || false
    const isReact = info?.isReact || false
    const colors = CONFIG.colors

    // Select colors based on component type
    let strokeColor: string, fillColor: string, pillBg: string, pillText: string

    if (isReact) {
      strokeColor = colors.inspectReactStroke
      fillColor = colors.inspectReactFill
      pillBg = colors.inspectReactPillBg
      pillText = colors.inspectReactPillText
    } else if (isMarked) {
      strokeColor = colors.inspectMarkedStroke
      fillColor = colors.inspectMarkedFill
      pillBg = colors.inspectMarkedPillBg
      pillText = colors.inspectMarkedPillText
    } else {
      strokeColor = colors.inspectStroke
      fillColor = colors.inspectFill
      pillBg = colors.inspectPillBg
      pillText = colors.inspectPillText
    }

    // Draw rectangle
    this._ctx.strokeStyle = strokeColor
    this._ctx.fillStyle = fillColor
    this._ctx.lineWidth = 1
    this._ctx.setLineDash([4])
    this._ctx.fillRect(rect.left, rect.top, rect.width, rect.height)
    this._ctx.strokeRect(rect.left, rect.top, rect.width, rect.height)

    // Draw label pill
    if (componentName) {
      this._drawPill(rect, componentName, isReact, pillBg, pillText)
    }
  }

  private _drawPill(
    rect: RectType,
    componentName: string,
    isReact: boolean,
    pillBg: string,
    pillText: string,
  ): void {
    if (!this._ctx) return

    const pillHeight = 24
    const pillPadding = 8
    const pillGap = 4

    this._ctx.font = '12px system-ui, -apple-system, sans-serif'

    const displayName = isReact ? `⚛ ${componentName}` : componentName
    const textWidth = this._ctx.measureText(displayName).width
    const pillWidth = textWidth + pillPadding * 2

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const spaceAbove = rect.top
    const spaceBelow = viewportHeight - (rect.top + rect.height)
    const spaceInside = rect.height

    let pillY: number
    const requiredHeight = pillHeight + pillGap

    if (spaceAbove >= requiredHeight) {
      pillY = rect.top - pillHeight - pillGap
    } else if (spaceBelow >= requiredHeight) {
      pillY = rect.top + rect.height + pillGap
    } else if (spaceInside >= pillHeight + pillGap * 2) {
      pillY = rect.top + pillGap
    } else {
      pillY = Math.max(pillGap, Math.min(rect.top + pillGap, viewportHeight - pillHeight - pillGap))
    }

    let pillX = rect.left
    if (pillX + pillWidth > viewportWidth - pillGap) {
      pillX = viewportWidth - pillWidth - pillGap
    }
    if (pillX < pillGap) {
      pillX = pillGap
    }

    // Pill background
    this._ctx.fillStyle = pillBg
    this._ctx.beginPath()
    this._ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3)
    this._ctx.fill()

    // Text
    this._ctx.fillStyle = pillText
    this._ctx.textBaseline = 'middle'
    this._ctx.fillText(displayName, pillX + pillPadding, pillY + pillHeight / 2)
  }

  // ============================================================================
  // Private Methods - Event Handlers
  // ============================================================================

  private _handlePointerMove(e: PointerEvent): void {
    if (!this.active) return

    // Clear stale reference if previously hovered element is disconnected
    if (this._lastHovered && !this._lastHovered.isConnected) {
      this._lastHovered = null
      this._clearOverlay()
    }

    if (!this._eventCatcher) return

    // Temporarily disable event catcher to find element underneath
    this._eventCatcher.style.pointerEvents = 'none'
    const element = document.elementFromPoint(e.clientX, e.clientY)
    this._eventCatcher.style.pointerEvents = 'auto'

    if (!element) return

    // Try Scala component first, then fall back to React
    let component = getScalaComponent(element)
    let info: OverlayInfo | null = null

    if (component) {
      const sourceInfo = getComponentSourceInfo(component.element)
      info = { isMarked: sourceInfo?.isMarked ?? false }
    } else {
      // Try React component
      component = getReactComponent(element)
      if (component) {
        info = { isReact: true }
      }
    }

    if (!component) {
      if (this._lastHovered) {
        this._lastHovered = null
        this._clearOverlay()
      }
      return
    }

    if (component.element === this._lastHovered) return
    this._lastHovered = component.element

    const rect = component.element.getBoundingClientRect()

    this._animateTo(
      { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      component.name ?? 'Unknown',
      info ?? {},
    )
  }

  private _handleClick(e: MouseEvent): void {
    if (!this.active) return

    // Allow clicks on devtools elements to pass through
    if (isDevtoolsElement(e.target as Element) && e.target !== this._eventCatcher) return

    e.preventDefault()
    e.stopPropagation()

    if (!this._eventCatcher) return

    // Find element under click
    this._eventCatcher.style.pointerEvents = 'none'
    const element = document.elementFromPoint(e.clientX, e.clientY)
    this._eventCatcher.style.pointerEvents = 'auto'

    if (!element) return

    // Try Scala component first
    const scalaComponent = getScalaComponent(element)
    if (scalaComponent) {
      const info = getComponentSourceInfo(scalaComponent.element)
      if (info?.sourcePath) {
        openInIDE(info.sourcePath, info.sourceLine)
        // Exit inspect mode after jumping to source
        this.active = false
        return
      }
    }

    // Try React component
    const reactComponent = getReactComponent(element)
    if (reactComponent) {
      const info = getReactComponentSourceInfo(reactComponent.element)

      // If source path available, jump to source
      if (info?.sourcePath) {
        openInIDE(info.sourcePath, info.sourceLine)
        this.active = false
        return
      }

      // Otherwise log React component info to console
      console.group(`%c⚛ React Component: ${reactComponent.name}`, 'color: #61dafb; font-weight: bold;')
      console.log('Element:', reactComponent.element)
      if (info?.props) {
        console.log('Props:', info.props)
      }
      if (info?.fiber) {
        console.log('Fiber:', info.fiber)
      }
      // Also log the full component hierarchy
      const hierarchy = getAllReactComponentsFromNode(reactComponent.element)
      if (hierarchy.length > 1) {
        console.log('Component hierarchy:', hierarchy.map((c) => c.name).join(' → '))
      }
      console.groupEnd()

      // Exit inspect mode after logging
      this.active = false
      return
    }

    console.warn('FdComponentInspector: No component found for element')
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.active) {
      this.active = false
    }
  }

  // ============================================================================
  // Styles - None needed as canvas is appended to body
  // ============================================================================

  static styles = css`
    :host {
      display: none;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-component-inspector': FdComponentInspector
  }
}
