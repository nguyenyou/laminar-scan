import { LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import {
  CONFIG,
  lerp,
  debounce,
  getDevicePixelRatio,
  isDevtoolsElement,
  getScalaSource,
  type DebouncedFunction,
} from '../core/utilities'
import { getReactComponentFromNode } from '../core/react-inspector'

// ============================================================================
// Local Constants
// ============================================================================

/** React color (cyan): rgb(97, 218, 251) */
const REACT_COLOR = { r: 97, g: 218, b: 251 }

// ============================================================================
// Types
// ============================================================================

interface HighlightData {
  name: string
  x: number
  y: number
  width: number
  height: number
  targetX: number
  targetY: number
  targetWidth: number
  targetHeight: number
  frame: number
  count: number
  isReact: boolean
}

// ============================================================================
// FdMutationCanvas Component
// ============================================================================

/**
 * Canvas overlay component for visualizing DOM mutations.
 * Observes DOM mutations and renders animated highlights on a canvas.
 */
@customElement('fd-mutation-canvas')
export class FdMutationCanvas extends LitElement {
  @property({ type: Boolean, reflect: true })
  active = false

  // Canvas state
  private _canvas: HTMLCanvasElement | null = null
  private _ctx: CanvasRenderingContext2D | null = null
  private _animationId: number | null = null
  private _highlights: Map<Element, HighlightData> = new Map()
  private _resizeHandler: DebouncedFunction<() => void> | null = null

  // MutationObserver state
  private _observer: MutationObserver | null = null

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
  // Public API
  // ============================================================================

  /**
   * Manually highlight an element (useful for external integrations).
   */
  highlight(element: Element, name: string, options: { isReact?: boolean } = {}): void {
    if (!this._canvas || !element.isConnected) return

    const rect = element.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const isReact = options.isReact ?? false

    const existing = this._highlights.get(element)
    if (existing) {
      existing.targetX = rect.left
      existing.targetY = rect.top
      existing.targetWidth = rect.width
      existing.targetHeight = rect.height
      existing.frame = 0
      existing.count++
      existing.isReact = isReact
    } else {
      this._highlights.set(element, {
        name,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        targetX: rect.left,
        targetY: rect.top,
        targetWidth: rect.width,
        targetHeight: rect.height,
        frame: 0,
        count: 1,
        isReact,
      })
    }

    this._startAnimation()
  }

  /**
   * Clear all highlights.
   */
  clear(): void {
    this._highlights.clear()
    this._clearCanvas()
  }

  // ============================================================================
  // Private Methods - Lifecycle
  // ============================================================================

  private _start(): void {
    this._createCanvas()
    this._startObserver()
  }

  private _stop(): void {
    this._stopObserver()
    this._destroyCanvas()
  }

  // ============================================================================
  // Private Methods - Canvas Management
  // ============================================================================

  private _createCanvas(): void {
    if (this._canvas) return

    // Safety check: prevent duplicate canvases
    const existing = document.querySelector(
      `[${CONFIG.attributes.devtools}="mutation-canvas"]`,
    ) as HTMLCanvasElement | null
    if (existing) {
      console.warn('FdMutationCanvas: Canvas already exists in DOM, reusing')
      this._canvas = existing
      this._ctx = existing.getContext('2d')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.setAttribute(CONFIG.attributes.devtools, 'mutation-canvas')

    const dpr = getDevicePixelRatio()
    Object.assign(canvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: `${window.innerWidth}px`,
      height: `${window.innerHeight}px`,
      pointerEvents: 'none',
      zIndex: '2147483647',
    })

    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr

    document.body.appendChild(canvas)

    this._canvas = canvas
    this._ctx = canvas.getContext('2d')
    this._ctx?.scale(dpr, dpr)

    // Setup resize handler
    this._resizeHandler = debounce(() => this._handleResize(), CONFIG.intervals.resizeDebounce)
    window.addEventListener('resize', this._resizeHandler)
  }

  private _destroyCanvas(): void {
    this._stopAnimation()
    this._highlights.clear()

    if (this._resizeHandler) {
      this._resizeHandler.cancel()
      window.removeEventListener('resize', this._resizeHandler)
      this._resizeHandler = null
    }

    if (this._canvas?.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas)
    }

    this._canvas = null
    this._ctx = null
  }

  private _handleResize(): void {
    if (!this._canvas || !this._ctx) return

    const dpr = getDevicePixelRatio()
    this._canvas.style.width = `${window.innerWidth}px`
    this._canvas.style.height = `${window.innerHeight}px`
    this._canvas.width = window.innerWidth * dpr
    this._canvas.height = window.innerHeight * dpr
    this._ctx.scale(dpr, dpr)
  }

  // ============================================================================
  // Private Methods - Animation
  // ============================================================================

  private _startAnimation(): void {
    if (this._animationId) return

    this._sweepStale()
    this._animationId = requestAnimationFrame(() => this._draw())
  }

  private _stopAnimation(): void {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId)
      this._animationId = null
    }
  }

  private _sweepStale(): void {
    for (const [element] of this._highlights) {
      if (!element.isConnected) {
        this._highlights.delete(element)
      }
    }
  }

  private _clearCanvas(): void {
    if (!this._ctx || !this._canvas) return
    const dpr = getDevicePixelRatio()
    this._ctx.clearRect(0, 0, this._canvas.width / dpr, this._canvas.height / dpr)
  }

  private _draw(): void {
    if (!this._ctx || !this._canvas) return

    this._clearCanvas()

    const toRemove: Element[] = []
    const labelMap = new Map<string, HighlightData & { alpha: number }>()
    const { r, g, b } = CONFIG.colors.primary
    const reactColor = REACT_COLOR
    const totalFrames = CONFIG.animation.totalFrames

    // Draw all highlights
    for (const [element, highlight] of this._highlights) {
      // Remove disconnected elements
      if (!element.isConnected) {
        toRemove.push(element)
        continue
      }

      // Interpolate position
      highlight.x = lerp(highlight.x, highlight.targetX)
      highlight.y = lerp(highlight.y, highlight.targetY)
      highlight.width = lerp(highlight.width, highlight.targetWidth)
      highlight.height = lerp(highlight.height, highlight.targetHeight)

      const alpha = 1.0 - highlight.frame / totalFrames
      highlight.frame++

      if (highlight.frame > totalFrames) {
        toRemove.push(element)
        continue
      }

      // Select color based on component type
      const color = highlight.isReact ? reactColor : { r, g, b }

      // Draw outline
      this._ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`
      this._ctx.lineWidth = 1
      this._ctx.beginPath()
      this._ctx.rect(highlight.x, highlight.y, highlight.width, highlight.height)
      this._ctx.stroke()

      // Draw fill
      this._ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.1})`
      this._ctx.fill()

      // Aggregate labels at same position
      const labelKey = `${highlight.x},${highlight.y}`
      const existing = labelMap.get(labelKey)
      if (!existing) {
        labelMap.set(labelKey, { ...highlight, alpha })
      } else {
        existing.count += highlight.count
        if (alpha > existing.alpha) existing.alpha = alpha
      }
    }

    // Draw labels
    this._ctx.font = CONFIG.fonts.mono
    for (const [, { x, y, name, count, alpha, isReact }] of labelMap) {
      const color = isReact ? reactColor : { r, g, b }
      const displayName = isReact ? `⚛ ${name}` : name
      const labelText = count > 1 ? `${displayName} ×${count}` : displayName
      const textWidth = this._ctx.measureText(labelText).width
      const textHeight = 11
      const padding = 2

      let labelY = y - textHeight - padding * 2
      if (labelY < 0) labelY = 0

      this._ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`
      this._ctx.fillRect(x, labelY, textWidth + padding * 2, textHeight + padding * 2)

      this._ctx.fillStyle = `rgba(255,255,255,${alpha})`
      this._ctx.fillText(labelText, x + padding, labelY + textHeight + padding - 2)
    }

    // Remove completed highlights
    for (const element of toRemove) {
      this._highlights.delete(element)
    }

    // Continue animation if there are active highlights
    if (this._highlights.size > 0) {
      this._animationId = requestAnimationFrame(() => this._draw())
    } else {
      this._animationId = null
    }
  }

  // ============================================================================
  // Private Methods - Mutation Observer
  // ============================================================================

  private _startObserver(): void {
    if (this._observer) return

    this._observer = new MutationObserver((mutations) => this._handleMutations(mutations))
    this._observer.observe(document.body, {
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    })
  }

  private _stopObserver(): void {
    if (this._observer) {
      this._observer.disconnect()
      this._observer = null
    }
  }

  private _handleMutations(mutations: MutationRecord[]): void {
    if (!this.active) return

    for (const record of mutations) {
      const target =
        record.target.nodeType === Node.ELEMENT_NODE ? (record.target as Element) : record.target.parentElement

      // Skip devtools elements
      if (!target || isDevtoolsElement(target)) continue

      this._highlightElement(target)

      // Highlight added nodes
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && !isDevtoolsElement(node as Element)) {
          this._highlightElement(node as Element)
        }
      }
    }
  }

  private _highlightElement(element: Element): void {
    if (!this._canvas) return
    if (!element.isConnected) return

    // Try Scala source first, then React component, then fall back to tag name
    let name: string | null = getScalaSource(element)
    let isReact = false

    if (!name) {
      const reactComponent = getReactComponentFromNode(element)
      if (reactComponent) {
        name = reactComponent.name
        isReact = true
      }
    }
    const displayName = name ?? element.tagName.toLowerCase()

    this.highlight(element, displayName, { isReact })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-mutation-canvas': FdMutationCanvas
  }
}

