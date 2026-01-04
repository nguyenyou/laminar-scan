import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('dt-lag-radar')
export class DtLagRadar extends LitElement {
  render() {
    return html`
      <div>lag</div>
    `
  }

  static styles = css`
    
  `
}


declare global {
  interface HTMLElementTagNameMap {
    'dt-lag-radar': DtLagRadar
  }
}