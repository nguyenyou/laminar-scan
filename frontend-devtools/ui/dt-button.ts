import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

/**
 * A button component styled for devtools.
 *
 * @slot - Button content
 * @fires click - Fired when the button is clicked
 */
@customElement('dt-button')
export class DtButton extends LitElement {
  /**
   * The button variant.
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'primary' | 'ghost' = 'default'

  /**
   * The button size.
   */
  @property({ type: String, reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md'

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
        class="devtools-btn"
        ?disabled=${this.disabled}
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
      border: 1px solid transparent;
      border-radius: 6px;
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      white-space: nowrap;
    }

    /* Sizes */
    :host([size='sm']) .devtools-btn {
      padding: 4px 10px;
      font-size: 12px;
      height: 26px;
    }

    :host([size='md']) .devtools-btn,
    .devtools-btn {
      padding: 6px 14px;
      font-size: 13px;
      height: 32px;
    }

    :host([size='lg']) .devtools-btn {
      padding: 8px 18px;
      font-size: 14px;
      height: 38px;
    }

    /* Default variant */
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

    /* Primary variant */
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

    /* Ghost variant */
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

    .devtools-btn:focus {
      outline: none;
    }

    .devtools-btn:focus-visible {
      outline: 2px solid #7361e6;
      outline-offset: 2px;
    }

    /* Icon sizing within button */
    ::slotted(svg),
    ::slotted(dt-icon) {
      flex-shrink: 0;
    }

    :host([size='sm']) ::slotted(svg),
    :host([size='sm']) ::slotted(dt-icon) {
      width: 14px;
      height: 14px;
    }

    :host([size='md']) ::slotted(svg),
    :host([size='md']) ::slotted(dt-icon) {
      width: 16px;
      height: 16px;
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
    'dt-button': DtButton
  }
}

