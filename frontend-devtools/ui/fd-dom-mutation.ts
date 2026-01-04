import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import './fd-switch'

@customElement('fd-dom-mutation')
export class FdDomMutation extends LitElement {
  @property({ type: Boolean, reflect: true })
  checked = false

  private _handleChange(e: CustomEvent<{ checked: boolean }>) {
    this.checked = e.detail.checked
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { checked: this.checked },
        bubbles: true,
        composed: true,
      }),
    )
  }

  render() {
    return html`
      <fd-switch
        .checked=${this.checked}
        @change=${this._handleChange}
      ></fd-switch>
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
    'fd-dom-mutation': FdDomMutation
  }
}