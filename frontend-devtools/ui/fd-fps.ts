import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { getColorFromFps } from '../core/performance-color'

@customElement('fd-fps')
export class FdFps extends LitElement {
  @property({ type: Boolean, reflect: true })
  active = false

  private _fps: number = 0
  private _frameCount: number = 0
  private _lastTime: number = 0
  private _animationId: number | null = null

  @state() private _displayFps: number = 0

  private _handleClick(): void {
    this.active = !this.active
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { active: this.active },
        bubbles: true,
        composed: true,
      }),
    )
  }

  connectedCallback(): void {
    super.connectedCallback()
    this._start()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._stop()
  }

  private _start(): void {
    this._lastTime = performance.now()
    this._frameCount = 0
    this._tick()
  }

  private _stop(): void {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId)
      this._animationId = null
    }
  }

  private _tick(): void {
    this._frameCount++
    const now = performance.now()

    if (now - this._lastTime >= 1000) {
      this._fps = this._frameCount
      this._frameCount = 0
      this._lastTime = now
      this._displayFps = this._fps
    }

    this._animationId = requestAnimationFrame(() => this._tick())
  }

  render() {
    const color = getColorFromFps(this._displayFps)
    return html`
      <button class="devtools-meter" title="Show Lag Radar" @click=${this._handleClick}>
        <span class="devtools-meter-value" style="color: ${color}">${this._displayFps}</span>
        <span class="devtools-meter-label">FPS</span>
      </button>
    `
  }

  static styles = css`
    .devtools-meter {
      appearance: none;
      border: none;
      outline: none;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      height: 24px;
      border-radius: 6px;
      white-space: nowrap;
      font-family: var(--fd-font-mono);
      background: #141414;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .devtools-meter:hover {
      background: #1a1a1a;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
    }

    .devtools-meter-value {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.025em;
      transition: color 0.15s ease-in-out;
      min-width: 24px;
      text-align: center;
      color: #fff;
      font-family: var(--fd-font-mono);
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
      transition: color 0.15s ease-in-out;
    }

    :host([active]) .devtools-meter {
      box-shadow: inset 0 0 0 1px rgba(142, 97, 230, 0.4);
    }

    /* ===== Focus states ===== */
    .devtools-meter:focus {
      outline: none;
    }

    .devtools-meter:focus-visible {
      outline: 2px solid #7361e6;
      outline-offset: 2px;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-fps': FdFps
  }
}