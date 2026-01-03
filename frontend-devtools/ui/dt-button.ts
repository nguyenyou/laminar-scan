import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

/**
 * A unified button component styled for devtools.
 * Supports regular buttons and icon-only buttons.
 *
 * @slot - Button content (text, icons, or both)
 * @fires click - Fired when the button is clicked
 *
 * @example
 * // Regular button
 * <dt-button>Click me</dt-button>
 *
 * // Icon-only button
 * <dt-button size="icon" tooltip="Settings">
 *   <dt-icon name="settings"></dt-icon>
 * </dt-button>
 *
 * // Button with icon and text
 * <dt-button>
 *   <dt-icon name="plus"></dt-icon>
 *   Add Item
 * </dt-button>
 */
@customElement('dt-button')
export class DtButton extends LitElement {
  /**
   * The button size.
   * - default: Standard button with padding for text
   * - icon: Square icon-only button (no padding)
   */
  @property({ type: String, reflect: true })
  size: 'default' | 'icon' = 'default'

  /**
   * Whether the button is disabled.
   */
  @property({ type: Boolean, reflect: true })
  disabled = false

  /**
   * Whether the button is in an active/pressed state.
   */
  @property({ type: Boolean, reflect: true })
  active = false

  /**
   * Accessible label (for icon-only buttons).
   */
  @property({ type: String })
  label = ''

  /**
   * Tooltip text shown on hover.
   */
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
      padding: 6px 12px;
      font-size: 13px;
      height: 28px;
    }

    /* ===== Base styles ===== */
    .devtools-btn {
      background: transparent;
      color: #999;
      box-shadow: none;
    }

    .devtools-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
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
      border-radius: 4px;
      width: 28px;
      height: 28px;
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
      width: 16px;
      height: 16px;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'dt-button': DtButton
  }
}

