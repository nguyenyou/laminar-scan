import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('dt-mem')
export class DtMem extends LitElement {
  render() {
    return html`
      <button>
        16 MB
      </button>
    `
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'dt-mem': DtMem
  }
}