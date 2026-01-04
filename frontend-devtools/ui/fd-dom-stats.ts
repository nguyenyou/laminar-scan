import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import './fd-button'
import './fd-icon'

@customElement('fd-dom-stats')
export class FdDomStats extends LitElement {
  render() {
    return html`
      <fd-button
        size="icon"
        tooltip="DOM Statistics"
      >
        <fd-icon name="domTree"></fd-icon>
      </fd-button>
    `
  }

  static styles = css`
    :host {
      display: inline-flex;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-dom-stats': FdDomStats
  }
}

