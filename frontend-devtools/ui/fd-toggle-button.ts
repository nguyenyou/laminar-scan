import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('fd-toggle-button')
export class FdToggleButton extends LitElement {
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
    const ariaLabel = this.label || this.tooltip || undefined

    return html`
      <button
        class="toggle-button"
        aria-label=${ariaLabel ?? ''}
        title=${this.tooltip}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `
  }

  static styles = css`
    :host([active]) .toggle-button {
      color: var(--fd-primary);
    }

    :host([active]) .toggle-button:hover {
      color: var(--fd-primary-hover);
    }

    .toggle-button {
      padding: 0;
      width: 28px;
      height: 28px;
      background: transparent;
      border: none;
      box-shadow: none;
      cursor: pointer;
      color: var(--fd-text-muted);
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-button:hover {
      color: var(--fd-text-primary);
      background: var(--fd-bg-hover);
    }

    /* ===== Focus states ===== */
    .toggle-button:focus {
      outline: none;
    }

    .toggle-button:focus-visible {
      outline: var(--fd-focus-ring);
      outline-offset: 2px;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-toggle-button': FdToggleButton
  }
}