import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'


@customElement('frontend-devtools')
export class FrontendDevtools extends LitElement {
  render() {
    return html`
      <div class="panel">
      </div>
    `
  }

  static styles = css`
    .panel {
      position: fixed;
      top: 16px;
      right: 16px;
      width: 284px;
      height: 44px;
      background: black;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'frontend-devtools': FrontendDevtools
  }
}
