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
import { getReactComponent, getReactComponentSourceInfo } from '../core/react-inspector'

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
  private _startAnimationId: number | null = null

  // Crosshair state
  private _cursorX: number = 0
  private _cursorY: number = 0

  // Event catcher state
  private _eventCatcher: HTMLDivElement | null = null
  private _lastHovered: Element | null = null
  private _focusedElement: Element | null = null
  private _focusedIsReact: boolean = false
  private _focusHistory: Array<{ element: Element; name: string; isReact: boolean }> = []

  // Boundary feedback animation state
  private _boundaryAnimationId: number | null = null
  private _borderScale: number = 1
  private _pillShakeOffset: number = 0

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

  private _start(): void {
    this._createCanvas()
    this._createEventCatcher()
    this._addEventListeners()

    // Show with animation - track the RAF for cleanup
    this._startAnimationId = requestAnimationFrame(() => {
      this._startAnimationId = null
      this._showCanvas()
      if (this._eventCatcher) {
        this._eventCatcher.style.pointerEvents = 'auto'
      }
    })

    this._dispatchChange(true)
  }

  private _stop(): void {
    this._removeEventListeners()
    // Clear element references to prevent memory leaks
    this._lastHovered = null
    this._focusedElement = null
    this._focusedIsReact = false
    this._focusHistory = []
    // Cancel any pending start animation
    if (this._startAnimationId) {
      cancelAnimationFrame(this._startAnimationId)
      this._startAnimationId = null
    }
    this._cancelBoundaryAnimation()
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

  private _createCanvas(): void {
    if (this._canvas) return

    // Safety check: prevent duplicate canvases
    const existing = document.querySelector(
      `[${CONFIG.attributes.devtools}="inspect-canvas"]`,
    ) as HTMLCanvasElement | null
    if (existing) {
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

  private _cancelBoundaryAnimation(): void {
    if (this._boundaryAnimationId) {
      cancelAnimationFrame(this._boundaryAnimationId)
      this._boundaryAnimationId = null
    }
    this._borderScale = 1
    this._pillShakeOffset = 0
  }

  private _animateBoundaryPulse(): void {
    // Arrow Down at end of history - pulse border bigger then back to normal
    this._cancelBoundaryAnimation()

    const duration = 200 // ms
    const startTime = performance.now()
    const maxScale = 1.5

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Sine wave: scale up then back down
      this._borderScale = 1 + Math.sin(progress * Math.PI) * (maxScale - 1)

      if (this._currentRect && this._focusedElement) {
        const name = this._getCurrentComponentName()
        const info: OverlayInfo = this._focusedIsReact
          ? { isReact: true }
          : { isMarked: getComponentSourceInfo(this._focusedElement)?.isMarked ?? false }
        this._drawOverlay(this._currentRect, name, info)
      }

      if (progress < 1) {
        this._boundaryAnimationId = requestAnimationFrame(animate)
      } else {
        this._borderScale = 1
        this._boundaryAnimationId = null
        // Redraw with normal scale
        if (this._currentRect && this._focusedElement) {
          const name = this._getCurrentComponentName()
          const info: OverlayInfo = this._focusedIsReact
            ? { isReact: true }
            : { isMarked: getComponentSourceInfo(this._focusedElement)?.isMarked ?? false }
          this._drawOverlay(this._currentRect, name, info)
        }
      }
    }

    this._boundaryAnimationId = requestAnimationFrame(animate)
  }

  private _animatePillShake(): void {
    // Arrow Up at root - shake the label pill left/right
    this._cancelBoundaryAnimation()

    const duration = 300 // ms
    const startTime = performance.now()
    const shakeAmount = 6 // pixels
    const shakeFrequency = 3 // number of oscillations

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Damped sine wave for shake effect
      const decay = 1 - progress
      this._pillShakeOffset = Math.sin(progress * Math.PI * 2 * shakeFrequency) * shakeAmount * decay

      if (this._currentRect && this._focusedElement) {
        const name = this._getCurrentComponentName()
        const info: OverlayInfo = this._focusedIsReact
          ? { isReact: true }
          : { isMarked: getComponentSourceInfo(this._focusedElement)?.isMarked ?? false }
        this._drawOverlay(this._currentRect, name, info)
      }

      if (progress < 1) {
        this._boundaryAnimationId = requestAnimationFrame(animate)
      } else {
        this._pillShakeOffset = 0
        this._boundaryAnimationId = null
        // Redraw without shake
        if (this._currentRect && this._focusedElement) {
          const name = this._getCurrentComponentName()
          const info: OverlayInfo = this._focusedIsReact
            ? { isReact: true }
            : { isMarked: getComponentSourceInfo(this._focusedElement)?.isMarked ?? false }
          this._drawOverlay(this._currentRect, name, info)
        }
      }
    }

    this._boundaryAnimationId = requestAnimationFrame(animate)
  }

  private _createEventCatcher(): void {
    if (this._eventCatcher) return

    // Safety check: prevent duplicate event catchers
    const existing = document.querySelector(`[${CONFIG.attributes.devtools}="event-catcher"]`) as HTMLDivElement | null
    if (existing) {
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

  private _addEventListeners(): void {
    document.addEventListener('pointermove', this._handlePointerMove, {
      passive: true,
      capture: true,
    })
    document.addEventListener('click', this._handleClick, { capture: true })
    document.addEventListener('keydown', this._handleKeydown)
  }

  private _removeEventListeners(): void {
    document.removeEventListener('pointermove', this._handlePointerMove, { capture: true })
    document.removeEventListener('click', this._handleClick, { capture: true })
    document.removeEventListener('keydown', this._handleKeydown)
  }

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

    const isReact = info?.isReact || false
    const colors = CONFIG.colors

    // Select colors based on component type
    let strokeColor: string, fillColor: string, pillBg: string, pillText: string

    if (isReact) {
      strokeColor = colors.inspectReactStroke
      fillColor = colors.inspectReactFill
      pillBg = colors.inspectReactPillBg
      pillText = colors.inspectReactPillText
    } else {
      strokeColor = colors.inspectStroke
      fillColor = colors.inspectFill
      pillBg = colors.inspectPillBg
      pillText = colors.inspectPillText
    }

    // Draw rectangle with boundary animation effects
    const scale = this._borderScale
    const expandAmount = (scale - 1) * 8 // Expand by up to 8px when scale is 2
    const adjustedRect = {
      left: rect.left - expandAmount,
      top: rect.top - expandAmount,
      width: rect.width + expandAmount * 2,
      height: rect.height + expandAmount * 2,
    }

    this._ctx.strokeStyle = strokeColor
    this._ctx.fillStyle = fillColor
    this._ctx.lineWidth = 1 + (scale - 1) * 2 // Thicker line when scaled
    this._ctx.setLineDash([4])
    this._ctx.fillRect(adjustedRect.left, adjustedRect.top, adjustedRect.width, adjustedRect.height)
    this._ctx.strokeRect(adjustedRect.left, adjustedRect.top, adjustedRect.width, adjustedRect.height)

    // Draw label pill
    if (componentName) {
      this._drawPill(rect, componentName, isReact, pillBg, pillText)
    }

    // Draw crosshair at cursor position
    this._drawCrosshair()
  }

  private _drawPill(rect: RectType, componentName: string, isReact: boolean, pillBg: string, pillText: string): void {
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

    let pillX = rect.left + this._pillShakeOffset
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

  private _drawCrosshair(): void {
    if (!this._ctx) return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const colors = CONFIG.colors

    // Use a semi-transparent color for crosshair lines
    const crosshairColor = colors.inspectCrosshair ?? 'rgba(99, 102, 241, 0.5)'

    this._ctx.save()
    this._ctx.strokeStyle = crosshairColor
    this._ctx.lineWidth = 1
    this._ctx.setLineDash([4, 4])

    // Draw vertical line
    this._ctx.beginPath()
    this._ctx.moveTo(this._cursorX, 0)
    this._ctx.lineTo(this._cursorX, viewportHeight)
    this._ctx.stroke()

    // Draw horizontal line
    this._ctx.beginPath()
    this._ctx.moveTo(0, this._cursorY)
    this._ctx.lineTo(viewportWidth, this._cursorY)
    this._ctx.stroke()

    this._ctx.restore()
  }

  private _handlePointerMove = (e: PointerEvent) => {
    if (!this.active) return

    // Update cursor position for crosshair
    this._cursorX = e.clientX
    this._cursorY = e.clientY

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

    if (!element) {
      // Still draw crosshair even if no element found
      this._clearCanvas()
      this._drawCrosshair()
      return
    }

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
      // Draw crosshair even when no component is hovered
      this._clearCanvas()
      this._drawCrosshair()
      return
    }

    if (component.element === this._lastHovered) {
      // Same element but cursor moved, redraw with updated crosshair
      if (this._currentRect) {
        this._drawOverlay(this._currentRect, component.name ?? 'Unknown', info ?? {})
      }
      return
    }
    this._lastHovered = component.element
    this._focusedElement = component.element
    this._focusedIsReact = info?.isReact ?? false
    this._focusHistory = [] // Reset history when mouse moves to a new component

    const rect = component.element.getBoundingClientRect()

    this._animateTo(
      { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      component.name ?? 'Unknown',
      info ?? {},
    )

    // Dispatch hover-change event for other components to react (e.g., laminar tree)
    this.dispatchEvent(
      new CustomEvent('hover-change', {
        detail: {
          element: component.element,
          name: component.name ?? 'Unknown',
          isReact: info?.isReact ?? false,
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private _handleClick = (e: MouseEvent) => {
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

      this.active = false
      return
    }
  }

  private _getParentScalaComponent(element: Element): { element: Element; name: string } | null {
    const attr = CONFIG.attributes.scalaComponent
    const parent = element.parentElement?.closest(`[${attr}]`)
    if (!parent) return null
    return {
      element: parent,
      name: parent.getAttribute(attr) ?? 'Unknown',
    }
  }

  private _getParentReactComponent(
    element: Element,
  ): { element: Element; name: string; isReact: true } | null {
    // For React, we need to traverse the fiber tree
    const fiber = (element as any).__reactFiber$ || Object.keys(element).find((k) => k.startsWith('__reactFiber$'))
      ? (element as any)[Object.keys(element).find((k) => k.startsWith('__reactFiber$'))!]
      : null

    if (!fiber) return null

    // Start from the current fiber's parent
    let current = fiber.return
    let iterations = 0
    const maxIterations = 500

    while (current && iterations < maxIterations) {
      iterations++

      // Check if this is an actual React component (not a host component)
      if (current.type && typeof current.type !== 'string') {
        const name =
          current.type.displayName ||
          current.type.name ||
          (current.type.render?.displayName || current.type.render?.name) ||
          'Unknown'

        // Find the corresponding DOM element
        let stateNode = current.stateNode
        if (!stateNode || !(stateNode instanceof Element)) {
          // For function components, traverse to find a child with DOM node
          let child = current.child
          while (child && !(child.stateNode instanceof Element)) {
            child = child.child
          }
          stateNode = child?.stateNode
        }

        if (stateNode instanceof Element) {
          return { element: stateNode, name, isReact: true }
        }
      }

      current = current.return
    }

    return null
  }

  private _focusComponent(
    element: Element,
    name: string,
    info: OverlayInfo,
  ): void {
    this._focusedElement = element
    this._focusedIsReact = info.isReact ?? false
    this._lastHovered = element

    const rect = element.getBoundingClientRect()
    this._animateTo(
      { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      name,
      info,
    )
  }

  /**
   * Public method to highlight an element from external code (e.g., laminar tree).
   * Requires the inspector to be active.
   */
  public highlightElement(element: Element, name: string): void {
    if (!this.active) return

    const sourceInfo = getComponentSourceInfo(element)
    this._focusComponent(element, name, {
      isMarked: sourceInfo?.isMarked ?? false,
    })
  }

  private _selectCurrentComponent(): void {
    if (!this._focusedElement) return

    if (this._focusedIsReact) {
      const info = getReactComponentSourceInfo(this._focusedElement)
      if (info?.sourcePath) {
        openInIDE(info.sourcePath, info.sourceLine)
        this.active = false
      } else {
        this.active = false
      }
    } else {
      const info = getComponentSourceInfo(this._focusedElement)
      if (info?.sourcePath) {
        openInIDE(info.sourcePath, info.sourceLine)
        this.active = false
      }
    }
  }

  private _getCurrentComponentName(): string {
    if (!this._focusedElement) return 'Unknown'

    if (this._focusedIsReact) {
      const component = getReactComponent(this._focusedElement)
      return component?.name ?? 'Unknown'
    } else {
      const component = getScalaComponent(this._focusedElement)
      return component?.name ?? 'Unknown'
    }
  }

  private _handleKeydown = (e: KeyboardEvent) => {
    if (!this.active) return

    if (e.key === 'Escape') {
      this.active = false
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      this._selectCurrentComponent()
      return
    }

    if (e.key === 'ArrowUp' && this._focusedElement) {
      e.preventDefault()

      if (this._focusedIsReact) {
        const parent = this._getParentReactComponent(this._focusedElement)
        if (parent) {
          // Save current to history before navigating up
          const currentName = this._getCurrentComponentName()
          this._focusHistory.push({
            element: this._focusedElement,
            name: currentName,
            isReact: true,
          })
          this._focusComponent(parent.element, parent.name, { isReact: true })
        } else {
          // At root - shake the label
          this._animatePillShake()
        }
      } else {
        const parent = this._getParentScalaComponent(this._focusedElement)
        if (parent) {
          // Save current to history before navigating up
          const currentName = this._getCurrentComponentName()
          this._focusHistory.push({
            element: this._focusedElement,
            name: currentName,
            isReact: false,
          })
          const sourceInfo = getComponentSourceInfo(parent.element)
          this._focusComponent(parent.element, parent.name, {
            isMarked: sourceInfo?.isMarked ?? false,
          })
        } else {
          // At root - shake the label
          this._animatePillShake()
        }
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()

      if (this._focusHistory.length > 0) {
        const previous = this._focusHistory.pop()!
        if (previous.isReact) {
          this._focusComponent(previous.element, previous.name, { isReact: true })
        } else {
          const sourceInfo = getComponentSourceInfo(previous.element)
          this._focusComponent(previous.element, previous.name, {
            isMarked: sourceInfo?.isMarked ?? false,
          })
        }
      } else {
        // At end of history - pulse border bigger
        this._animateBoundaryPulse()
      }
    }
  }

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