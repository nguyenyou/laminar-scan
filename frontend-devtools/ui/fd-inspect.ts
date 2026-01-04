import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import './fd-button'
import './fd-icon'

@customElement('fd-inspect')
export class FdInspect extends LitElement {
  @property({ type: Boolean, reflect: true })
  active = false

  private _handleClick() {
    this.active = !this.active
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { active: this.active },
        bubbles: true,
        composed: true,
      }),
    )
  }

  render() {
    return html`
      <fd-button
        tooltip="Inspect component"
        ?active=${this.active}
        @click=${this._handleClick}
      >
        <fd-icon name="inspect"></fd-icon>
      </fd-button>
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
    'fd-inspect': FdInspect
  }
}

