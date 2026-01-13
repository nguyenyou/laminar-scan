import { LitElement, css, html } from 'lit'
import type { PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { getColorFromFrameTime } from '../core/performance-color'

interface RadarLastState {
  rotation: number
  now: number
  tx: number
  ty: number
}

@customElement('fd-lag-radar')
export class FdLagRadar extends LitElement {
  /** Size of the radar in pixels */
  @property({ type: Number }) size = 220

  /** Number of arc segments to display */
  @property({ type: Number }) frames = 50

  /** Speed of rotation (radians per millisecond) */
  @property({ type: Number }) speed = 0.0017

  /** Inset from edge for the radar circle */
  @property({ type: Number }) inset = 3

  // Not @state() since it's not used in render() - avoids "change in update" warning
  private _running = false

  private _animationId: number | null = null
  private _last: RadarLastState | null = null
  private _framePtr = 0
  private _arcs: SVGPathElement[] = []
  private _hand: SVGPathElement | null = null

  private get _middle(): number {
    return this.size / 2
  }

  private get _radius(): number {
    return this._middle - this.inset
  }

  connectedCallback(): void {
    super.connectedCallback()
  }

  disconnectedCallback(): void {
    this.stop()
    super.disconnectedCallback()
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties)
    this._initializeArcs()
    this.start()
  }

  private _initializeArcs(): void {
    const svg = this.shadowRoot?.querySelector('.radar-sweep')
    const hand = this.shadowRoot?.querySelector('.radar-hand') as SVGPathElement
    if (!svg || !hand) return

    this._hand = hand
    this._arcs = []

    // Create arc elements
    for (let i = 0; i < this.frames; i++) {
      const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      svg.appendChild(arc)
      this._arcs.push(arc)
    }
  }

  /** Start the radar animation */
  start(): void {
    if (this._running) return
    this._running = true
    this._last = {
      rotation: 0,
      now: Date.now(),
      tx: this._middle + this._radius,
      ty: this._middle,
    }
    this._framePtr = 0
    this._animate()
  }

  /** Stop the radar animation */
  stop(): void {
    this._running = false
    if (this._animationId) {
      cancelAnimationFrame(this._animationId)
      this._animationId = null
    }
  }

  private _animate(): void {
    if (!this._running || !this._last) return

    const PI2 = Math.PI * 2
    const middle = this._middle
    const radius = this._radius
    const frames = this.frames

    const now = Date.now()
    const frameTimeMs = now - this._last.now
    const rdelta = Math.min(PI2 - this.speed, this.speed * frameTimeMs)
    const rotation = (this._last.rotation + rdelta) % PI2
    const tx = middle + radius * Math.cos(rotation)
    const ty = middle + radius * Math.sin(rotation)

    const bigArc = rdelta < Math.PI ? '0' : '1'
    const path = `M${tx} ${ty}A${radius} ${radius} 0 ${bigArc} 0 ${this._last.tx} ${this._last.ty}L${middle} ${middle}`
    const color = getColorFromFrameTime(frameTimeMs)

    // Update current arc segment
    const currentArc = this._arcs[this._framePtr % frames]
    if (currentArc) {
      currentArc.setAttribute('d', path)
      currentArc.setAttribute('fill', color)
    }

    // Update hand position
    if (this._hand) {
      this._hand.setAttribute('d', `M${middle} ${middle}L${tx} ${ty}`)
    }

    // Update opacity for fade trail effect
    for (let i = 0; i < frames; i++) {
      const arc = this._arcs[(frames + this._framePtr - i) % frames]
      if (arc) {
        arc.style.fillOpacity = String(1 - i / frames)
      }
    }

    this._framePtr++
    this._last = { now, rotation, tx, ty }
    this._animationId = requestAnimationFrame(() => this._animate())
  }

  render() {
    return html`
      <div class="radar-container">
        <svg
          class="radar-svg"
          width="${this.size}"
          height="${this.size}"
          viewBox="0 0 ${this.size} ${this.size}"
        >
          <g class="radar-sweep"></g>
          <path class="radar-hand"></path>
          <circle
            class="radar-face"
            cx="${this._middle}"
            cy="${this._middle}"
            r="${this._radius}"
          ></circle>
        </svg>
      </div>
    `
  }

  static styles = css`
    :host {
      display: block;
      font-family: var(--fd-font);
    }

    .radar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 26px 12px;
      background: var(--fd-bg-panel);
      border-radius: 6px;
      box-shadow: var(--fd-inset-border-subtle);
    }

    .radar-svg {
      display: block;
    }

    .radar-sweep > * {
      shape-rendering: crispEdges;
    }

    .radar-face {
      fill: transparent;
      stroke: var(--fd-radar-stroke);
      stroke-width: 4px;
    }

    .radar-hand {
      stroke: var(--fd-radar-stroke);
      stroke-width: 4px;
      stroke-linecap: round;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-lag-radar': FdLagRadar
  }
}