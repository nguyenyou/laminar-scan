import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./ui/dt-switch";
import "./ui/dt-button";
import "./ui/dt-icon";
import "./ui/dt-toolbar";
import "./ui/dt-panel";
import { designTokens } from "./design-tokens";

@customElement("frontend-devtools")
export class FrontendDevtools extends LitElement {
  @state()
  private _enabled = false;

  @state()
  private _inspectActive = false;

  private _handleToggle(e: CustomEvent<{ checked: boolean }>) {
    this._enabled = e.detail.checked;
  }

  private _handleInspectClick() {
    this._inspectActive = !this._inspectActive;
  }

  render() {
    return html`
      <dt-panel position="top-right" draggable>
        <dt-toolbar>
          <dt-button
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
        </dt-toolbar>
      </dt-panel>
    `;
  }

  static styles = [designTokens];
}

declare global {
  interface HTMLElementTagNameMap {
    "frontend-devtools": FrontendDevtools;
  }
}
