import { LitElement, css, html } from 'lit'
import { customElement, property, state, query } from 'lit/decorators.js'
import type { PanelPosition } from './ui/fd-panel'
import type { FdComponentInspector } from './ui/fd-component-inspector'
import type { FdLaminarComponentTree } from './ui/fd-laminar-component-tree'
import './ui/fd-inspect'
import './ui/fd-dom-stats'
import './ui/fd-toolbar'
import './ui/fd-panel'
import './ui/fd-fps'
import './ui/fd-mem'
import './ui/fd-lag-radar'
import './ui/fd-toggle-icon-button'
import './ui/fd-mem-chart'
import './ui/fd-mutation-canvas'
import './ui/fd-switch'
import './ui/fd-component-inspector'
import './ui/fd-laminar-component-tree'
import { designTokens } from './design-tokens'
import { persistenceStorage, StorageKeys } from './core/persistence-storage'

type PanelWidget = 'LAG_RADAR' | 'DOM_STATS' | 'MEM_CHART'

const DEFAULT_PANEL_POSITION: PanelPosition = 'bottom-right'

@customElement('frontend-devtools')
export class FrontendDevtools extends LitElement {
  /**
   * Whether the devtools are enabled. Accepts "true" or "false" as string values.
   * Defaults to "true" when the attribute is present.
   */
  @property({ type: String, reflect: true })
  enable: 'true' | 'false' = 'true'

  @state()
  private _inspectActive = false

  @state()
  private _mutationScanActive = false

  @state()
  private _laminarTreeActive = false

  @state()
  private _activeWidgets: PanelWidget[] = []

  @state()
  private _panelPosition: PanelPosition = DEFAULT_PANEL_POSITION

  @query('fd-component-inspector')
  private _inspector!: FdComponentInspector

  @query('fd-laminar-component-tree')
  private _laminarTree!: FdLaminarComponentTree

  private _boundHandleKeydown: (e: KeyboardEvent) => void

  constructor() {
    super()
    this._mutationScanActive = persistenceStorage.getBoolean(StorageKeys.MUTATION_SCAN_ACTIVE)
    this._activeWidgets = persistenceStorage.getArray<PanelWidget>(StorageKeys.ACTIVE_WIDGETS)
    this._panelPosition =
      (persistenceStorage.get(StorageKeys.PANEL_POSITION) as PanelPosition) || DEFAULT_PANEL_POSITION
    this._boundHandleKeydown = this._handleKeydown.bind(this)
  }

  private get _isEnabled(): boolean {
    return this.enable === 'true'
  }

  override connectedCallback(): void {
    super.connectedCallback()
    // Mark this element as a devtools element so clicks pass through during inspect mode
    this.setAttribute('data-frontend-devtools', 'root')
    if (this._isEnabled) {
      document.addEventListener('keydown', this._boundHandleKeydown, { capture: true })
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    document.removeEventListener('keydown', this._boundHandleKeydown, { capture: true })
    // Reset inspect state (not persisted, so should be cleared)
    this._inspectActive = false
  }

  private _handleKeydown(e: KeyboardEvent): void {
    // Ctrl+Shift+C to toggle inspect mode
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault()
      e.stopPropagation()
      this._inspectActive = !this._inspectActive
    }
  }

  private _handleDomMutationChange(e: CustomEvent<{ checked: boolean }>) {
    this._mutationScanActive = e.detail.checked
    persistenceStorage.setBoolean(StorageKeys.MUTATION_SCAN_ACTIVE, e.detail.checked)
  }

  private _handleInspectChange(e: CustomEvent<{ active: boolean }>) {
    this._inspectActive = e.detail.active
  }

  private _handleInspectorChange(e: CustomEvent<{ active: boolean }>) {
    // Sync inspector state back to button when ESC is pressed or component is clicked
    this._inspectActive = e.detail.active
  }

  private _handleLaminarTreeChange(e: CustomEvent<{ active: boolean }>) {
    this._laminarTreeActive = e.detail.active
  }

  private _handleLaminarTreeClose() {
    this._laminarTreeActive = false
  }

  private _handleLaminarTreeFocusChange(e: CustomEvent<{ element: Element; name: string }>) {
    // When tree focus changes and inspector is active, highlight the element
    if (this._inspectActive && this._inspector) {
      this._inspector.highlightElement(e.detail.element, e.detail.name)
    }
  }

  private _handleInspectorHoverChange(e: CustomEvent<{ element: Element; name: string; isReact: boolean }>) {
    // When inspector hovers over a component and tree is open, focus on it in the tree
    // Only for Laminar/Scala components (not React)
    if (this._laminarTreeActive && this._laminarTree && !e.detail.isReact) {
      this._laminarTree.focusOnElement(e.detail.element)
    }
  }

  private _toggleWidget(widget: PanelWidget, active: boolean) {
    if (active && !this._activeWidgets.includes(widget)) {
      this._activeWidgets = [...this._activeWidgets, widget]
    } else if (!active) {
      this._activeWidgets = this._activeWidgets.filter((w) => w !== widget)
    }
    persistenceStorage.setArray(StorageKeys.ACTIVE_WIDGETS, this._activeWidgets)
  }

  private _handleFpsChange(e: CustomEvent<{ active: boolean }>) {
    this._toggleWidget('LAG_RADAR', e.detail.active)
  }

  private _handleDomStatsChange(e: CustomEvent<{ active: boolean }>) {
    this._toggleWidget('DOM_STATS', e.detail.active)
  }

  private _handleMemChange(e: CustomEvent<{ active: boolean }>) {
    this._toggleWidget('MEM_CHART', e.detail.active)
  }

  private _handlePositionChange(e: CustomEvent<{ position: PanelPosition }>) {
    this._panelPosition = e.detail.position
    persistenceStorage.set(StorageKeys.PANEL_POSITION, e.detail.position)
  }

  private _renderWidget(widget: PanelWidget) {
    switch (widget) {
      case 'LAG_RADAR':
        return html`<fd-lag-radar></fd-lag-radar>`
      case 'DOM_STATS':
        return html`<fd-dom-stats></fd-dom-stats>`
      case 'MEM_CHART':
        return html`<fd-mem-chart></fd-mem-chart>`
    }
  }

  render() {
    if (!this._isEnabled) {
      return null
    }

    return html`
      <fd-panel position=${this._panelPosition} @position-change=${this._handlePositionChange}>
        <fd-toolbar>
          <fd-inspect
            .active=${this._inspectActive}
            @change=${this._handleInspectChange}
          ></fd-inspect>
          <fd-switch
            title="Highlight DOM mutations"
            .checked=${this._mutationScanActive}
            @change=${this._handleDomMutationChange}
          ></fd-switch>
          <fd-fps
            .active=${this._activeWidgets.includes('LAG_RADAR')}
            @change=${this._handleFpsChange}
          ></fd-fps>
          <fd-mem
            .active=${this._activeWidgets.includes('MEM_CHART')}
            @change=${this._handleMemChange}
          ></fd-mem>
          <fd-toggle-icon-button
            tooltip="Show DOM Stats"
            .active=${this._activeWidgets.includes('DOM_STATS')}
            @change=${this._handleDomStatsChange}
          >
            <fd-icon name="domTree"></fd-icon>
          </fd-toggle-icon-button>
          <fd-toggle-icon-button
            tooltip="Laminar Component Tree"
            .active=${this._laminarTreeActive}
            @change=${this._handleLaminarTreeChange}
          >
            <fd-icon name="laminarTree"></fd-icon>
          </fd-toggle-icon-button>
        </fd-toolbar>
        ${this._activeWidgets.map((widget) => this._renderWidget(widget))}
      </fd-panel>
      ${this._mutationScanActive ? html`<fd-mutation-canvas .active=${true}></fd-mutation-canvas>` : null}
      <fd-component-inspector
        .active=${this._inspectActive}
        @change=${this._handleInspectorChange}
        @hover-change=${this._handleInspectorHoverChange}
      ></fd-component-inspector>
      <fd-laminar-component-tree
        .open=${this._laminarTreeActive}
        @close=${this._handleLaminarTreeClose}
        @focus-change=${this._handleLaminarTreeFocusChange}
      ></fd-laminar-component-tree>
    `
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
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'frontend-devtools': FrontendDevtools
  }
}