import { LitElement, css, html, svg, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'

/**
 * Icon definitions - SVG path data for each icon.
 */
const ICONS = {
  inspect: svg`
    <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/>
    <path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/>
    <path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h2"/>
    <path d="M14 3h1"/><path d="M3 9v1"/><path d="M21 9v2"/><path d="M3 14v1"/>
  `,
  close: svg`
    <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
  `,
  chevronRight: svg`
    <path d="M9 18l6-6-6-6"/>
  `,
  chevronLeft: svg`
    <path d="M15 18l-6-6 6-6"/>
  `,
  chevronDown: svg`
    <path d="M6 9l6 6 6-6"/>
  `,
  chevronUp: svg`
    <path d="M18 15l-6-6-6 6"/>
  `,
  domTree: svg`
    <rect x="16" y="16" width="6" height="6" rx="1"/>
    <rect x="2" y="16" width="6" height="6" rx="1"/>
    <rect x="9" y="2" width="6" height="6" rx="1"/>
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>
  `,
  settings: svg`
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  `,
  search: svg`
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  `,
  plus: svg`
    <path d="M12 5v14"/><path d="M5 12h14"/>
  `,
  minus: svg`
    <path d="M5 12h14"/>
  `,
  check: svg`
    <path d="M20 6L9 17l-5-5"/>
  `,
  info: svg`
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
  `,
  warning: svg`
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <path d="M12 9v4"/><path d="M12 17h.01"/>
  `,
  error: svg`
    <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/>
  `,
  refresh: svg`
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M3 21v-5h5"/>
  `,
  menu: svg`
    <path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/>
  `,
  eye: svg`
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
  `,
  eyeOff: svg`
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  `,
} as const

export type IconName = keyof typeof ICONS

/**
 * A reusable icon component for devtools.
 * Use with dt-button or dt-icon-button.
 *
 * @example
 * <dt-icon name="inspect"></dt-icon>
 * <dt-icon-button><dt-icon name="settings"></dt-icon></dt-icon-button>
 * <dt-button><dt-icon name="plus"></dt-icon> Add Item</dt-button>
 */
@customElement('dt-icon')
export class DtIcon extends LitElement {
  /**
   * The name of the icon to display.
   */
  @property({type: String, reflect: true })
  name: IconName = 'inspect'

  /**
   * The size of the icon in pixels.
   */
  @property({ type: Number })
  size: number = 16

  render() {
    const iconContent = ICONS[this.name]
    if (!iconContent) {
      return nothing
    }

    return html`
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        style="width: ${this.size}px; height: ${this.size}px;"
        part="svg"
      >
        ${iconContent}
      </svg>
    `
  }

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: inherit;
      line-height: 0;
    }

    svg {
      display: block;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'dt-icon': DtIcon
  }
}

