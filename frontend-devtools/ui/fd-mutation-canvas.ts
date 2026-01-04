import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('fd-mutation-canvas')
export class FdMutationCanvas extends LitElement {
  @property({ type: Boolean, reflect: true })
  active = false

  render() {
    return html`
      <div>hello</div>
    `
  }

  static styles = css`
    :host {
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-mutation-canvas': FdMutationCanvas
  }
}

