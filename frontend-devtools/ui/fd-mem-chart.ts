import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('fd-mem-chart')
export class FdMemChart extends LitElement {
  @property({ type: Boolean, reflect: true })
  active = false

  render() {
    return html`
      <div>Hello</div>
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
    'fd-mem-chart': FdMemChart
  }
}

