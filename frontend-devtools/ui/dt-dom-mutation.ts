import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import './dt-switch'

@customElement('dt-dom-mutation')
export class DtDomMutation extends LitElement {
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
      <dt-switch
        .checked=${this.checked}
        @change=${this._handleChange}
      ></dt-switch>
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
    'dt-dom-mutation': DtDomMutation
  }
}