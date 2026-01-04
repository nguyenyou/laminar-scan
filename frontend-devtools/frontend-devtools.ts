import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import './ui/dt-switch'
import './ui/dt-button'
import './ui/dt-icon'
import './ui/dt-toolbar'
import './ui/dt-panel'
import { designTokens } from './design-tokens'

@customElement('frontend-devtools')
export class FrontendDevtools extends LitElement {
  @state()
  private _domMutationScan = false

  @state()
  private _inspectActive = false

  private _toggleDomMutationScan(e: CustomEvent<{ checked: boolean }>) {
    this._domMutationScan = e.detail.checked
  }

  private _handleInspectClick() {
    this._inspectActive = !this._inspectActive
  }

  render() {
    return html`
      <dt-panel position="top-right">
        <dt-toolbar>
          <dt-button
            tooltip="Inspect component"
            ?active=${this._inspectActive}
            @click=${this._handleInspectClick}
          >
            <dt-icon name="inspect"></dt-icon>
          </dt-button>
          <dt-switch
            .checked=${this._domMutationScan}
            @change=${this._toggleDomMutationScan}
          ></dt-switch>
          <dt-button size="icon" tooltip="Settings">
            <dt-icon name="settings"></dt-icon>
          </dt-button>
        </dt-toolbar>
      </dt-panel>
    `
  }

  static styles = [designTokens]
}

declare global {
  interface HTMLElementTagNameMap {
    'frontend-devtools': FrontendDevtools
  }
}