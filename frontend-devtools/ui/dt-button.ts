import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

/**
 * A unified button component styled for devtools.
 * Supports regular buttons, icon-only buttons, and buttons with icons.
 *
 * @slot - Button content (text, icons, or both)
 * @fires click - Fired when the button is clicked
 *
 * @example
 * // Regular button
 * <dt-button>Click me</dt-button>
 *
 * // Icon-only button
 * <dt-button variant="icon" tooltip="Settings">
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
   * The button variant.
   * - default: Standard button with background
   * - primary: Highlighted action button
   * - ghost: Transparent button
   * - icon: Icon-only button (square, no padding)
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'primary' | 'ghost' | 'icon' = 'default'

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

    /* ===== Default variant ===== */
    :host([variant='default']) .devtools-btn,
    .devtools-btn {
      background: #1a1a1a;
      color: #fff;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    }

    :host([variant='default']) .devtools-btn:hover,
    .devtools-btn:hover {
      background: #252525;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
    }

    :host([variant='default'][active]) .devtools-btn,
    :host([variant='default']) .devtools-btn:active {
      background: #1f1f1f;
      box-shadow: inset 0 0 0 1px rgba(142, 97, 230, 0.4);
    }

    /* ===== Primary variant ===== */
    :host([variant='primary']) .devtools-btn {
      background: #7361e6;
      color: #fff;
      box-shadow: none;
    }

    :host([variant='primary']) .devtools-btn:hover {
      background: #8571f0;
    }

    :host([variant='primary']) .devtools-btn:active {
      background: #6351d6;
    }

    /* ===== Ghost variant ===== */
    :host([variant='ghost']) .devtools-btn {
      background: transparent;
      color: #999;
      box-shadow: none;
    }

    :host([variant='ghost']) .devtools-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    :host([variant='ghost'][active]) .devtools-btn {
      color: #8e61e3;
    }

    /* ===== Icon variant ===== */
    :host([variant='icon']) .devtools-btn {
      background: transparent;
      color: #999;
      box-shadow: none;
      padding: 0;
      border-radius: 4px;
      width: 28px;
      height: 28px;
    }

    :host([variant='icon']) .devtools-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    :host([variant='icon'][active]) .devtools-btn {
      color: #8e61e3;
    }

    :host([variant='icon'][active]) .devtools-btn:hover {
      color: #9f7af0;
    }

    /* ===== Focus states ===== */
    .devtools-btn:focus {
      outline: none;
    }

    .devtools-btn:focus-visible {
      outline: 2px solid #7361e6;
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

