import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('fd-lag-radar')
export class FdLagRadar extends LitElement {
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
    'fd-lag-radar': FdLagRadar
  }
}