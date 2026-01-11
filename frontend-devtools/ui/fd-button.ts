import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('fd-button')
export class FdButton extends LitElement {
  @property({ type: String, reflect: true })
  size: 'default' | 'sm' | 'icon' = 'default'

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
      opacity: 0.5;
      pointer-events: none;
    }

    .devtools-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: none;
      border-radius: 6px;
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      white-space: nowrap;
      padding: 4px 10px;
      font-size: 12px;
      height: 26px;
    }

    /* ===== Base styles ===== */
    .devtools-btn {
      background: transparent;
      color: var(--fd-text-muted);
      box-shadow: none;
    }

    .devtools-btn:hover {
      background: var(--fd-bg-hover);
      color: var(--fd-text-primary);
    }

    :host([active]) .devtools-btn {
      color: var(--fd-primary);
    }

    :host([active]) .devtools-btn:hover {
      color: var(--fd-primary-hover);
    }

    /* ===== Small size ===== */
    :host([size='sm']) .devtools-btn {
      padding: 2px 6px;
      font-size: 11px;
      height: 22px;
      gap: 4px;
    }

    /* ===== Icon size ===== */
    :host([size='icon']) .devtools-btn {
      padding: 0;
      border-radius: 4px;
      width: 26px;
      height: 26px;
    }

    /* ===== Focus states ===== */
    .devtools-btn:focus {
      outline: none;
    }

    .devtools-btn:focus-visible {
      outline: var(--fd-focus-ring);
      outline-offset: 2px;
    }

    /* ===== Icon sizing ===== */
    ::slotted(svg),
    ::slotted(fd-icon) {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-button': FdButton
  }
}