import { LitElement, css, html, svg } from 'lit'
import { customElement, property } from 'lit/decorators.js'

const CLOSE_ICON = svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    style="width: 16px; height: 16px;"
  >
    <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
  </svg>
`

@customElement('fd-toggle-icon-button')
export class FdToggleIconButton extends LitElement {
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

    // Dispatch the desired state, but don't internally toggle.
    // Let the parent control the actual `active` state.
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { active: !this.active },
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
        ${this.active ? CLOSE_ICON : html`<slot></slot>`}
      </button>
    `
  }

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
    }

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
    'fd-toggle-icon-button': FdToggleIconButton
  }
}