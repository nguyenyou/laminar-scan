import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

export type ToolbarOrientation = 'horizontal' | 'vertical'

/**
 * fd-toolbar: Visual container for devtools tools
 *
 * Responsibility: Visual styling (background, shadows, border-radius),
 * layout (flexbox), and collapsed/expanded states.
 */
@customElement('fd-toolbar')
export class FdToolbar extends LitElement {
  @property({ type: Boolean, reflect: true })
  collapsed = false

  @property({ type: String, reflect: true })
  orientation: ToolbarOrientation = 'horizontal'

  render() {
    return html`<slot></slot>`
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #000;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    :host([orientation='vertical']) {
      flex-direction: column;
    }

    :host([collapsed]) {
      padding: 4px;
      gap: 4px;
      opacity: 0.75;
      transition: opacity 0.15s;
    }

    :host([collapsed]:hover) {
      opacity: 1;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-toolbar': FdToolbar
  }
}