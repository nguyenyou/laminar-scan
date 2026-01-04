import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import './fd-button'
import './fd-icon'

@customElement('fd-dom-stats')
export class FdDomStats extends LitElement {
  render() {
    return html`
      <div>Dom stats</div>
    `
  }

  connectedCallback() {
    super.connectedCallback()
    document.querySelectorAll('*').forEach((el) => {
      console.log(el.tagName)
    })
  }

  static styles = css`
    
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-dom-stats': FdDomStats
  }
}

