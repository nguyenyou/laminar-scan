import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { FdMemObserver } from '../core/fd-mem-observer'

@customElement('fd-mem')
export class FdMem extends LitElement {
  @property({ type: Boolean, reflect: true })
  active = false

  @state()
  private _memoryMB = 0

  private _unsubscribe: (() => void) | null = null

  connectedCallback(): void {
    super.connectedCallback()
    this._unsubscribe = FdMemObserver.subscribe((info) => {
      this._memoryMB = info.usedMB
    })
  }

  disconnectedCallback(): void {
    this._unsubscribe?.()
    this._unsubscribe = null
    super.disconnectedCallback()
  }

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

  render() {
    return html`
      <button class="devtools-meter" title="Show memory chart" @click=${this._handleClick}>
        <span class="devtools-meter-value memory">${this._memoryMB}</span>
        <span class="devtools-meter-label">MB</span>
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
      color: rgb(214, 132, 245);
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
    'fd-mem': FdMem
  }
}