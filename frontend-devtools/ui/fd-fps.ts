import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'

@customElement('fd-fps')
export class FdFps extends LitElement {
  #fps: number = 0
  #frameCount: number = 0
  #lastTime: number = 0
  #animationId: number | null = null

  @state() private _displayFps: number = 0

  connectedCallback(): void {
    super.connectedCallback()
    this.#start()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#stop()
  }

  #start(): void {
    this.#lastTime = performance.now()
    this.#frameCount = 0
    this.#tick()
  }

  #stop(): void {
    if (this.#animationId) {
      cancelAnimationFrame(this.#animationId)
      this.#animationId = null
    }
  }

  #tick(): void {
    this.#frameCount++
    const now = performance.now()

    if (now - this.#lastTime >= 1000) {
      this.#fps = this.#frameCount
      this.#frameCount = 0
      this.#lastTime = now
      this._displayFps = this.#fps
    }

    this.#animationId = requestAnimationFrame(() => this.#tick())
  }

  /** Calculate hue based on FPS (consistent with LagRadar) */
  #calcHue(fps: number): number {
    const maxHue = 120
    const maxFps = 60
    // Linear mapping: 0 FPS → hue 0 (red), 60 FPS → hue 120 (green)
    return Math.max(0, Math.min((fps / maxFps) * maxHue, maxHue))
  }

  #getColor(): string {
    const hue = this.#calcHue(this._displayFps)
    return `hsl(${hue}, 80%, 40%)`
  }

  render() {
    return html`
      <div class="devtools-meter">
        <span class="devtools-meter-value" style="color: ${this.#getColor()}">${this._displayFps}</span>
        <span class="devtools-meter-label">FPS</span>
      </div>
    `
  }

  static styles = css`
    .devtools-meter {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      height: 24px;
      border-radius: 6px;
      font-family: ui-monospace, monospace;
      background: #141414;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    }

    .devtools-meter-value {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.025em;
      transition: color 0.15s ease-in-out;
      min-width: 24px;
      text-align: center;
      color: #fff;
    }

    .devtools-meter-value.memory {
      min-width: 38px;
      text-align: center;
    }

    .devtools-meter-label {
      color: rgba(255, 255, 255, 0.3);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.025em;
      white-space: nowrap;
    }
  `
}


declare global {
  interface HTMLElementTagNameMap {
    'fd-fps': FdFps
  }
}