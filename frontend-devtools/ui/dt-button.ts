import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('dt-button')
export class DtButton extends LitElement {
  @property({ type: String, reflect: true })
  size: 'default' | 'icon' = 'default'

  @property({ type: Boolean, reflect: true })
  disabled = false

  @property({ type: Boolean, reflect: true })
  active = false

  @property({ type: String })
  label = ''

  @property({ type: String })
  tooltip = ''

  private _handleClick(e: MouseEvent) {
    if (this.disabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
  }

  render() {
    const ariaLabel = this.label || this.tooltip || undefined

    return html`
      <button
        class="devtools-btn"
        ?disabled=${this.disabled}
        aria-label=${ariaLabel ?? ''}
        title=${this.tooltip}
        @click=${this._handleClick}
        part="button"
      >
        <slot></slot>
      </button>
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

    .devtools-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--dt-spacing-md);
      border: none;
      border-radius: var(--dt-radius-lg);
      font-family: var(--dt-font-ui);
      font-weight: var(--dt-font-weight-semibold);
      cursor: pointer;
      transition: background var(--dt-transition-fast), border-color var(--dt-transition-fast), color var(--dt-transition-fast);
      white-space: nowrap;
      padding: var(--dt-spacing-md) var(--dt-spacing-xl);
      font-size: var(--dt-font-size-md);
      height: var(--dt-size-button-height);
    }

    /* ===== Base styles ===== */
    .devtools-btn {
      background: transparent;
      color: var(--dt-color-gray-500);
      box-shadow: none;
    }

    .devtools-btn:hover {
      background: var(--dt-color-bg-hover);
      color: var(--dt-color-white);
    }

    :host([active]) .devtools-btn {
      color: var(--dt-color-primary-muted);
    }

    :host([active]) .devtools-btn:hover {
      color: var(--dt-color-primary-muted-hover);
    }

    /* ===== Icon size ===== */
    :host([size='icon']) .devtools-btn {
      padding: 0;
      border-radius: var(--dt-radius-md);
      width: var(--dt-size-button-height);
      height: var(--dt-size-button-height);
    }

    /* ===== Focus states ===== */
    .devtools-btn:focus {
      outline: none;
    }

    .devtools-btn:focus-visible {
      outline: 2px solid var(--dt-color-primary);
      outline-offset: 2px;
    }

    /* ===== Icon sizing ===== */
    ::slotted(svg),
    ::slotted(dt-icon) {
      flex-shrink: 0;
      width: var(--dt-size-button-icon);
      height: var(--dt-size-button-icon);
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'dt-button': DtButton
  }
}