import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('dt-fps')
export class DtFps extends LitElement {
  render() {
    return html`
      <button>
        60 FPS
      </button>
    `
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'dt-fps': DtFps
  }
}