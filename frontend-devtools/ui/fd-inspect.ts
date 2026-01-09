import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import './fd-toggle-icon-button'
import './fd-icon'

@customElement('fd-inspect')
export class FdInspect extends LitElement {
  @property({ type: Boolean, reflect: true })
  active = false

  private _handleChange(e: CustomEvent<{ active: boolean }>) {
    this.active = e.detail.active
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
      <fd-toggle-icon-button
        tooltip="Inspect Component (Ctrl+Shift+C)"
        ?active=${this.active}
        @change=${this._handleChange}
      >
        <fd-icon name="inspect"></fd-icon>
      </fd-toggle-icon-button>
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