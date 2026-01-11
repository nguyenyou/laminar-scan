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
  laminarTree: svg`
    <path d="M8 5h13"/>
    <path d="M13 12h8"/>
    <path d="M13 19h8"/>
    <path d="M3 10a2 2 0 0 0 2 2h3"/>
    <path d="M3 5v12a2 2 0 0 0 2 2h3"/>
  `,
} as const

export type IconName = keyof typeof ICONS

@customElement('fd-icon')
export class FdIcon extends LitElement {
  @property({ type: String, reflect: true })
  name: IconName = 'inspect'

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
    'fd-icon': FdIcon
  }
}