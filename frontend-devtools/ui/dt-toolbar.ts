import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

export type ToolbarOrientation = 'horizontal' | 'vertical'

/**
 * dt-toolbar: Visual container for devtools tools
 *
 * Responsibility: Visual styling (background, shadows, border-radius),
 * layout (flexbox), and collapsed/expanded states.
 */
@customElement('dt-toolbar')
export class DtToolbar extends LitElement {
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
      gap: var(--dt-spacing-lg);
      padding: var(--dt-spacing-lg) var(--dt-spacing-xl);
      background: var(--dt-color-black);
      border-radius: var(--dt-radius-xl);
      box-shadow: var(--dt-shadow-md);
    }

    :host([orientation='vertical']) {
      flex-direction: column;
    }

    :host([collapsed]) {
      padding: var(--dt-spacing-sm);
      gap: var(--dt-spacing-sm);
      opacity: var(--dt-opacity-semitransparent);
      transition: opacity var(--dt-transition-fast);
    }

    :host([collapsed]:hover) {
      opacity: 1;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'dt-toolbar': DtToolbar
  }
}

