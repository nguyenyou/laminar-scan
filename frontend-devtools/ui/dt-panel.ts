import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

export type PanelPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/**
 * dt-panel: Positioning container for devtools UI
 *
 * Responsibility: Fixed positioning, z-index layering, drag and snap behavior.
 * Does NOT handle visual styling (background, shadows) - that's the toolbar's job.
 */
@customElement('dt-panel')
export class DtPanel extends LitElement {
  @property({ type: String, reflect: true })
  position: PanelPosition = 'top-right'

  @property({ type: Boolean, reflect: true })
  draggable = false

  @state()
  private _isDragging = false

  @state()
  private _dragOffset = { x: 0, y: 0 }

  @state()
  private _currentPos = { x: 0, y: 0 }

  private _boundHandleMouseMove: (e: MouseEvent) => void
  private _boundHandleMouseUp: (e: MouseEvent) => void

  constructor() {
    super()
    this._boundHandleMouseMove = this._handleMouseMove.bind(this)
    this._boundHandleMouseUp = this._handleMouseUp.bind(this)
  }

  connectedCallback() {
    super.connectedCallback()
    this._updatePositionFromAttribute()
  }

  private _updatePositionFromAttribute() {
    // Reset to corner position based on attribute
    this._currentPos = { x: 0, y: 0 }
  }

  private _handleMouseDown(e: MouseEvent) {
    if (!this.draggable) return

    e.preventDefault()
    this._isDragging = true
    this.setAttribute('dragging', '')

    const rect = this.getBoundingClientRect()
    this._dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    // Store current position when starting drag
    this._currentPos = {
      x: rect.left,
      y: rect.top
    }

    document.addEventListener('mousemove', this._boundHandleMouseMove)
    document.addEventListener('mouseup', this._boundHandleMouseUp)
  }

  private _handleMouseMove(e: MouseEvent) {
    if (!this._isDragging) return

    this._currentPos = {
      x: e.clientX - this._dragOffset.x,
      y: e.clientY - this._dragOffset.y
    }

    this.requestUpdate()
  }

  private _handleMouseUp(_e: MouseEvent) {
    if (!this._isDragging) return

    document.removeEventListener('mousemove', this._boundHandleMouseMove)
    document.removeEventListener('mouseup', this._boundHandleMouseUp)

    this._isDragging = false
    this.removeAttribute('dragging')
    this._snapToCorner()
  }

  private _snapToCorner() {
    const rect = this.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const isLeft = centerX < viewportWidth / 2
    const isTop = centerY < viewportHeight / 2

    let newPosition: PanelPosition
    if (isTop && isLeft) {
      newPosition = 'top-left'
    } else if (isTop && !isLeft) {
      newPosition = 'top-right'
    } else if (!isTop && isLeft) {
      newPosition = 'bottom-left'
    } else {
      newPosition = 'bottom-right'
    }

    // Reset drag position and update corner
    this._currentPos = { x: 0, y: 0 }
    this.position = newPosition

    this.dispatchEvent(new CustomEvent('position-change', {
      detail: { position: newPosition },
      bubbles: true,
      composed: true
    }))
  }

  render() {
    return html`<slot></slot>`
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties)

    if (this._isDragging) {
      this.style.left = `${this._currentPos.x}px`
      this.style.top = `${this._currentPos.y}px`
      this.style.right = 'auto'
      this.style.bottom = 'auto'
    } else {
      // Clear inline styles when not dragging, let CSS handle positioning
      this.style.left = ''
      this.style.top = ''
      this.style.right = ''
      this.style.bottom = ''
    }
  }

  static styles = css`
    :host {
      display: block;
      position: fixed;
      z-index: 9999;
      transition: top var(--dt-transition-base) var(--dt-transition-ease-out),
                  right var(--dt-transition-base) var(--dt-transition-ease-out),
                  bottom var(--dt-transition-base) var(--dt-transition-ease-out),
                  left var(--dt-transition-base) var(--dt-transition-ease-out);
    }

    :host([dragging]) {
      transition: none;
    }

    /* Position variants */
    :host([position='top-right']) {
      top: var(--dt-spacing-2xl);
      right: var(--dt-spacing-2xl);
    }

    :host([position='top-left']) {
      top: var(--dt-spacing-2xl);
      left: var(--dt-spacing-2xl);
    }

    :host([position='bottom-right']) {
      bottom: var(--dt-spacing-2xl);
      right: var(--dt-spacing-2xl);
    }

    :host([position='bottom-left']) {
      bottom: var(--dt-spacing-2xl);
      left: var(--dt-spacing-2xl);
    }

    :host([draggable]) {
      cursor: move;
      user-select: none;
    }
  `

  firstUpdated() {
    if (this.draggable) {
      this.addEventListener('mousedown', this._handleMouseDown.bind(this))
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dt-panel': DtPanel
  }
}

