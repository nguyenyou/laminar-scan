import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('dt-mem')
export class DtMem extends LitElement {
  render() {
    return html`
      <div class="devtools-meter">
        <span class="devtools-meter-value memory">16</span>
        <span class="devtools-meter-label">MB</span>
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
    'dt-mem': DtMem
  }
}