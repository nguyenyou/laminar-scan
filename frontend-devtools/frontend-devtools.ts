import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import './ui/dt-switch'
import './ui/dt-icon-button'
import './ui/dt-icon'

@customElement('frontend-devtools')
export class FrontendDevtools extends LitElement {
  @state()
  private _enabled = false

  @state()
  private _inspectActive = false

  private _handleToggle(e: CustomEvent<{ checked: boolean }>) {
    this._enabled = e.detail.checked
  }

  private _handleInspectClick() {
    this._inspectActive = !this._inspectActive
  }

  render() {
    return html`
      <div class="panel">
        <dt-switch
          .checked=${this._enabled}
          @change=${this._handleToggle}
        ></dt-switch>

        <dt-icon-button
          tooltip="Inspect component"
          ?active=${this._inspectActive}
          @click=${this._handleInspectClick}
        >
          <dt-icon name="inspect"></dt-icon>
        </dt-icon-button>

        <dt-icon-button tooltip="Settings">
          <dt-icon name="settings"></dt-icon>
        </dt-icon-button>
      </div>
    `
  }

  static styles = css`
    .panel {
      position: fixed;
      top: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #000;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'frontend-devtools': FrontendDevtools
  }
}
