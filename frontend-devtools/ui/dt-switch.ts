import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('dt-switch')
export class DtSwitch extends LitElement {
  @property({ type: Boolean, reflect: true })
  checked = false

  @property({ type: Boolean, reflect: true })
  disabled = false

  @property({ type: String })
  label = ''

  private _handleChange(e: Event) {
    const input = e.target as HTMLInputElement
    this.checked = input.checked
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { checked: this.checked },
        bubbles: true,
        composed: true,
      })
    )
  }

  render() {
    return html`
      <label class="devtools-toggle" part="container">
        <input
          type="checkbox"
          .checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this._handleChange}
          part="input"
        />
        <span class="devtools-toggle-track" part="track">
          <span class="devtools-toggle-thumb" part="thumb"></span>
        </span>
        ${this.label ? html`<span class="label" part="label">${this.label}</span>` : ''}
      </label>
    `
  }

  static styles = css`
    :host {
      display: inline-flex;
    }

    :host([disabled]) {
      opacity: var(--dt-opacity-disabled);
      pointer-events: none;
    }

    .devtools-toggle {
      position: relative;
      width: var(--dt-size-switch-width);
      height: var(--dt-size-switch-height);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--dt-spacing-lg);
    }

    .devtools-toggle input {
      position: absolute;
      left: 0;
      top: 0;
      opacity: 0;
      cursor: pointer;
      width: var(--dt-size-switch-width);
      height: var(--dt-size-switch-height);
      z-index: 1;
      margin: 0;
    }

    .devtools-toggle-track {
      position: relative;
      width: var(--dt-size-switch-width);
      height: var(--dt-size-switch-height);
      background: var(--dt-color-gray-600);
      border-radius: var(--dt-radius-full);
      transition: background-color var(--dt-transition-base);
      flex-shrink: 0;
    }

    .devtools-toggle input:checked + .devtools-toggle-track {
      background: var(--dt-color-primary);
    }

    .devtools-toggle-thumb {
      position: absolute;
      top: 50%;
      left: 2px;
      transform: translateY(-50%);
      width: var(--dt-size-switch-thumb);
      height: var(--dt-size-switch-thumb);
      background: var(--dt-color-white);
      border-radius: var(--dt-radius-full);
      box-shadow: var(--dt-shadow-sm);
      transition: left var(--dt-transition-base) ease;
    }

    .devtools-toggle input:checked + .devtools-toggle-track .devtools-toggle-thumb {
      left: calc(100% - 18px);
    }

    .label {
      font-family: var(--dt-font-ui);
      font-size: var(--dt-font-size-md);
      color: var(--dt-color-white);
      white-space: nowrap;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'dt-switch': DtSwitch
  }
}

