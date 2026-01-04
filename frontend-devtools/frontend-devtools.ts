import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./ui/fd-inspect";
import "./ui/fd-dom-stats";
import "./ui/fd-toolbar";
import "./ui/fd-panel";
import "./ui/fd-fps";
import "./ui/fd-mem";
import "./ui/fd-lag-radar";
import "./ui/fd-toggle-button";
import "./ui/fd-mem-chart";
import "./ui/fd-mutation-canvas";
import "./ui/fd-switch";
import "./ui/fd-component-inspector";
import { designTokens } from "./design-tokens";
import { persistenceStorage } from "./core/persistence-storage";

const DevtoolsAPI = {
  enable() {
    persistenceStorage.setBoolean("FRONTEND_DEVTOOLS_ENABLED", true);
    console.log(
      "Devtools enabled. Refresh the page for changes to take effect."
    );
  },
  disable() {
    persistenceStorage.remove("FRONTEND_DEVTOOLS_ENABLED");
    console.log(
      "Devtools disabled. Refresh the page for changes to take effect."
    );
  },
};

(window as any).Devtools = DevtoolsAPI;

type PanelWidget = "LAG_RADAR" | "DOM_STATS" | "MEM_CHART";

@customElement("frontend-devtools")
export class FrontendDevtools extends LitElement {
  private _enabled: boolean;

  @state()
  private _inspectActive = false;

  @state()
  private _mutationScanActive = false;

  @state()
  private _activeWidgets: PanelWidget[] = [];

  @state()
  private _currentMemoryMB = 0;

  constructor() {
    super();
    this._enabled = persistenceStorage.getBoolean("FRONTEND_DEVTOOLS_ENABLED");
  }

  private _handleDomMutationChange(e: CustomEvent<{ checked: boolean }>) {
    this._mutationScanActive = e.detail.checked;
  }

  private _handleInspectChange(e: CustomEvent<{ active: boolean }>) {
    this._inspectActive = e.detail.active;
  }

  private _handleInspectorChange(e: CustomEvent<{ active: boolean }>) {
    // Sync inspector state back to button when ESC is pressed or component is clicked
    this._inspectActive = e.detail.active;
  }

  private _toggleWidget(widget: PanelWidget, active: boolean) {
    if (active && !this._activeWidgets.includes(widget)) {
      this._activeWidgets = [...this._activeWidgets, widget];
    } else if (!active) {
      this._activeWidgets = this._activeWidgets.filter((w) => w !== widget);
    }
  }

  private _handleFpsChange(e: CustomEvent<{ active: boolean }>) {
    this._toggleWidget("LAG_RADAR", e.detail.active);
  }

  private _handleDomStatsChange(e: CustomEvent<{ active: boolean }>) {
    this._toggleWidget("DOM_STATS", e.detail.active);
  }

  private _handleMemChange(e: CustomEvent<{ active: boolean }>) {
    this._toggleWidget("MEM_CHART", e.detail.active);
  }

  private _handleMemoryUpdate(e: CustomEvent<{ memoryMB: number }>) {
    this._currentMemoryMB = e.detail.memoryMB;
  }

  private _renderWidget(widget: PanelWidget) {
    switch (widget) {
      case "LAG_RADAR":
        return html`<fd-lag-radar></fd-lag-radar>`;
      case "DOM_STATS":
        return html`<fd-dom-stats></fd-dom-stats>`;
      case "MEM_CHART":
        return html`<fd-mem-chart
          @memory-update=${this._handleMemoryUpdate}
        ></fd-mem-chart>`;
    }
  }

  render() {
    if (!this._enabled) {
      return null;
    }

    return html`
      <fd-panel position="top-right">
        <fd-toolbar>
          <fd-inspect
            .active=${this._inspectActive}
            @change=${this._handleInspectChange}
          ></fd-inspect>
          <fd-switch
            .checked=${this._mutationScanActive}
            @change=${this._handleDomMutationChange}
          ></fd-switch>
          <fd-fps
            .active=${this._activeWidgets.includes("LAG_RADAR")}
            @change=${this._handleFpsChange}
          ></fd-fps>
          <fd-mem
            .active=${this._activeWidgets.includes("MEM_CHART")}
            .memoryMB=${this._currentMemoryMB}
            @change=${this._handleMemChange}
          ></fd-mem>
          <fd-toggle-button
            .active=${this._activeWidgets.includes("DOM_STATS")}
            @change=${this._handleDomStatsChange}
          >
            <fd-icon name="domTree"></fd-icon>
          </fd-toggle-button>
        </fd-toolbar>
        ${this._activeWidgets.map((widget) => this._renderWidget(widget))}
      </fd-panel>
      ${this._mutationScanActive
        ? html`<fd-mutation-canvas .active=${true}></fd-mutation-canvas>`
        : null}
      <fd-component-inspector
        .active=${this._inspectActive}
        @change=${this._handleInspectorChange}
      ></fd-component-inspector>
    `;
  }

  static styles = [
    designTokens,
    css`
      :host {
        /* Prevent interference with parent layout */
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        overflow: visible;
        pointer-events: none;
        z-index: 2147483647; /* Max z-index */

        /* CSS containment - isolates from parent */
        contain: layout style;

        opacity: 0.95;
      }

      :host * {
        pointer-events: auto;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "frontend-devtools": FrontendDevtools;
  }
}
