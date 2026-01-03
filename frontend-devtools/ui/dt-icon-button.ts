import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

/**
 * An icon button component styled for devtools.
 *
 * @slot - Icon content (typically an SVG)
 * @fires click - Fired when the button is clicked
 */
@customElement('dt-icon-button')
export class DtIconButton extends LitElement {
  /**
   * Accessible label for the button.
   */
  @property({ type: String })
  label = ''

  /**
   * Tooltip text shown on hover.
   */
  @property({ type: String })
  tooltip = ''

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
   * The button size.
   */
  @property({ type: String, reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md'

  private _handleClick(e: MouseEvent) {
    if (this.disabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
  }

  render() {
    return html`
      <button
        class="devtools-icon-btn"
        ?disabled=${this.disabled}
        aria-label=${this.label || this.tooltip || 'Icon button'}
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

    .devtools-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #999;
      transition: color 0.15s, background 0.15s;
      padding: 0;
    }

    /* Sizes */
    :host([size='sm']) .devtools-icon-btn {
      width: 24px;
      height: 24px;
    }

    :host([size='md']) .devtools-icon-btn,
    .devtools-icon-btn {
      width: 28px;
      height: 28px;
    }

    :host([size='lg']) .devtools-icon-btn {
      width: 32px;
      height: 32px;
    }

    .devtools-icon-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    :host([active]) .devtools-icon-btn {
      color: #8e61e3;
    }

    :host([active]) .devtools-icon-btn:hover {
      color: #9f7af0;
    }

    .devtools-icon-btn:focus {
      outline: none;
    }

    .devtools-icon-btn:focus-visible {
      outline: 2px solid #7361e6;
      outline-offset: 2px;
    }

    /* SVG icon sizing */
    ::slotted(svg),
    ::slotted(dt-icon) {
      width: 16px;
      height: 16px;
    }

    :host([size='sm']) ::slotted(svg),
    :host([size='sm']) ::slotted(dt-icon) {
      width: 14px;
      height: 14px;
    }

    :host([size='lg']) ::slotted(svg),
    :host([size='lg']) ::slotted(dt-icon) {
      width: 18px;
      height: 18px;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'dt-icon-button': DtIconButton
  }
}

