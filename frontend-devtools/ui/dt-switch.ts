import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('dt-switch')
export class DtSwitch extends LitElement {
  @property({ type: Boolean, reflect: true })
  checked = false

  private _handleChange(e: Event) {
    const input = e.target as HTMLInputElement
    this.checked = input.checked
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { checked: this.checked },
        bubbles: true,
        composed: true,
      }),
    )
  }

  render() {
    return html`
      <label class="devtools-toggle" part="container">
        <input
          type="checkbox"
          .checked=${this.checked}
          @change=${this._handleChange}
          part="input"
        />
        <span class="devtools-toggle-track" part="track">
          <span class="devtools-toggle-thumb" part="thumb"></span>
        </span>
      </label>
    `
  }

  static styles = css`
    :host {
      display: inline-flex;
    }

    .devtools-toggle {
      position: relative;
      width: 36px;
      height: 20px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .devtools-toggle input {
      position: absolute;
      left: 0;
      top: 0;
      opacity: 0;
      cursor: pointer;
      width: 36px;
      height: 20px;
      z-index: 1;
      margin: 0;
    }

    .devtools-toggle-track {
      position: relative;
      width: 36px;
      height: 20px;
      background: #525252;
      border-radius: 9999px;
      transition: background-color 0.2s;
      flex-shrink: 0;
    }

    .devtools-toggle input:checked + .devtools-toggle-track {
      background: #7361e6;
    }

    .devtools-toggle-thumb {
      position: absolute;
      top: 50%;
      left: 2px;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      background: #fff;
      border-radius: 9999px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      transition: left 0.2s ease;
    }

    .devtools-toggle input:checked + .devtools-toggle-track .devtools-toggle-thumb {
      left: calc(100% - 18px);
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'dt-switch': DtSwitch
  }
}