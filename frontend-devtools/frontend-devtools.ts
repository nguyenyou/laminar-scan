import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import './ui/fd-inspect'
import './ui/fd-dom-mutation'
import './ui/fd-dom-stats'
import './ui/fd-toolbar'
import './ui/fd-panel'
import './ui/fd-fps'
import './ui/fd-mem'
import './ui/fd-lag-radar'
import './ui/fd-toggle-button'
import { designTokens } from './design-tokens'
import { persistenceStorage } from './core/persistence-storage'


const DevtoolsAPI = {
  enable() {
    persistenceStorage.setBoolean("FRONTEND_DEVTOOLS_ENABLED", true)
    console.log('Devtools enabled. Refresh the page for changes to take effect.')
  },
  disable() {
    persistenceStorage.remove("FRONTEND_DEVTOOLS_ENABLED")
    console.log('Devtools disabled. Refresh the page for changes to take effect.')
  },
}

;(window as any).Devtools = DevtoolsAPI

type PanelWidget = 'LagRadar' | 'DomStats'

@customElement('frontend-devtools')
export class FrontendDevtools extends LitElement {
  private _enabled: boolean

  @state()
  private _domMutationScan = false

  @state()
  private _inspectActive = false

  @state()
  private _activeWidgets: PanelWidget[] = ['DomStats']

  constructor() {
    super()
    this._enabled = persistenceStorage.getBoolean("FRONTEND_DEVTOOLS_ENABLED")
  }

  private _toggleDomMutationScan(e: CustomEvent<{ checked: boolean }>) {
    this._domMutationScan = e.detail.checked
  }

  private _handleInspectChange(e: CustomEvent<{ active: boolean }>) {
    this._inspectActive = e.detail.active
  }

  private _toggleWidget(widget: PanelWidget, active: boolean) {
    if (active && !this._activeWidgets.includes(widget)) {
      this._activeWidgets = [...this._activeWidgets, widget]
    } else if (!active) {
      this._activeWidgets = this._activeWidgets.filter(w => w !== widget)
    }
  }

  private _handleFpsChange(e: CustomEvent<{ active: boolean }>) {
    this._toggleWidget('LagRadar', e.detail.active)
  }

  private _handleDomStatsChange(e: CustomEvent<{ active: boolean }>) {
    this._toggleWidget('DomStats', e.detail.active)
  }

  private _renderWidget(widget: PanelWidget) {
    switch (widget) {
      case 'LagRadar':
        return html`<fd-lag-radar></fd-lag-radar>`
      case 'DomStats':
        return html`<fd-dom-stats></fd-dom-stats>`
    }
  }

  render() {
    if (!this._enabled) {
      return null
    }

    return html`
      <fd-panel position="top-right">
        <fd-toolbar>
          <fd-inspect
            .active=${this._inspectActive}
            @change=${this._handleInspectChange}
          ></fd-inspect>
          <fd-dom-mutation
            .checked=${this._domMutationScan}
            @change=${this._toggleDomMutationScan}
          ></fd-dom-mutation>
          <fd-fps
            .active=${this._activeWidgets.includes('LagRadar')}
            @change=${this._handleFpsChange}
          ></fd-fps>
          <fd-mem></fd-mem>
          <fd-toggle-button
            .active=${this._activeWidgets.includes('DomStats')}
            @change=${this._handleDomStatsChange}
          >
            <fd-icon name="domTree"></fd-icon>
          </fd-toggle-button>
        </fd-toolbar>
        ${this._activeWidgets.map(widget => this._renderWidget(widget))}
      </fd-panel>
    `
  }

  static styles = [
    designTokens,
    css`
      :host {
        opacity: 0.95;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'frontend-devtools': FrontendDevtools
  }
}