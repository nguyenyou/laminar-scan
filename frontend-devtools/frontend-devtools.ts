import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import './ui/dt-switch'
import './ui/dt-button'
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
        <dt-button
          size="icon"
          tooltip="Inspect component"
          ?active=${this._inspectActive}
          @click=${this._handleInspectClick}
        >
          <dt-icon name="inspect"></dt-icon>
        </dt-button>
        <dt-switch
          .checked=${this._enabled}
          @change=${this._handleToggle}
        ></dt-switch>
        <dt-button size="icon" tooltip="Settings">
          <dt-icon name="settings"></dt-icon>
        </dt-button>
      </div>
    `
  }

  static styles = css`
    :host {
      /* Primary color palette - override these to customize the theme */
      --dt-color-primary: #7361e6;
      --dt-color-primary-hover: #8571f0;
      --dt-color-primary-active: #6351d6;
      --dt-color-primary-muted: #8e61e3;
      --dt-color-primary-muted-hover: #9f7af0;
    }

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
