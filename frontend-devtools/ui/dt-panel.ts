import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

export type PanelPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/**
 * dt-panel: Positioning container for devtools UI
 *
 * Responsibility: Fixed positioning, z-index layering, and optional drag behavior.
 * Does NOT handle visual styling (background, shadows) - that's the toolbar's job.
 */
@customElement('dt-panel')
export class DtPanel extends LitElement {
  @property({ type: String, reflect: true })
  position: PanelPosition = 'top-right'

  @property({ type: Boolean, reflect: true })
  draggable = false

  render() {
    return html`<slot></slot>`
  }

  static styles = css`
    :host {
      display: block;
      position: fixed;
      z-index: 9999;
    }

    /* Position variants */
    :host([position='top-right']) {
      top: var(--dt-spacing-2xl);
      right: var(--dt-spacing-2xl);
    }

    :host([position='top-left']) {
      top: var(--dt-spacing-2xl);
      left: var(--dt-spacing-2xl);
    }

    :host([position='bottom-right']) {
      bottom: var(--dt-spacing-2xl);
      right: var(--dt-spacing-2xl);
    }

    :host([position='bottom-left']) {
      bottom: var(--dt-spacing-2xl);
      left: var(--dt-spacing-2xl);
    }

    :host([draggable]) {
      cursor: move;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'dt-panel': DtPanel
  }
}

