import { LitElement, css, html, nothing, svg } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'
import { persistenceStorage, StorageKeys } from '../core/persistence-storage'
import { CONFIG, getComponentSourceInfo, openInIDE } from '../core/utilities'
import './fd-button'
import './fd-icon'

const CHEVRON_DOWN = svg`<path d="m6 9 6 6 6-6"/>`
const CHEVRON_RIGHT = svg`<path d="m9 18 6-6-6-6"/>`

interface TreeNode {
  id: string
  element: Element
  name: string
  children: TreeNode[]
  expanded: boolean
  depth: number
}

interface FlattenedNode {
  node: TreeNode
  isLast: boolean
  // For each depth level, true means ancestor has more siblings (draw │), false means no line
  ancestorLines: boolean[]
}

const DEFAULT_PANEL_WIDTH = 500
const DEFAULT_PANEL_HEIGHT = 400
const MIN_PANEL_WIDTH = 300
const MIN_PANEL_HEIGHT = 200
const MAX_PANEL_WIDTH_RATIO = 0.9
const MAX_PANEL_HEIGHT_RATIO = 0.9

type ResizeDirection = 'e' | 's' | 'se' | null

@customElement('fd-laminar-component-tree')
export class FdLaminarComponentTree extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false

  @state()
  private _treeData: TreeNode[] = []

  @state()
  private _focusedIndex = 0

  @state()
  private _posX = 0

  @state()
  private _posY = 0

  @state()
  private _isDragging = false

  @state()
  private _autoRefresh = false

  @state()
  private _isRefreshing = false

  @state()
  private _panelWidth = DEFAULT_PANEL_WIDTH

  @state()
  private _panelHeight = DEFAULT_PANEL_HEIGHT

  @state()
  private _isResizing = false

  private _flattenedNodes: FlattenedNode[] = []
  private _resizeDirection: ResizeDirection = null
  private _resizeStartX = 0
  private _resizeStartY = 0
  private _resizeStartWidth = 0
  private _resizeStartHeight = 0
  private _autoRefreshInterval: ReturnType<typeof setInterval> | null = null
  private _nodeIdCounter = 0
  private _dragStartX = 0
  private _dragStartY = 0
  private _dragStartPosX = 0
  private _dragStartPosY = 0

  override connectedCallback(): void {
    super.connectedCallback()
    // Set popover attribute for Popover API
    this.setAttribute('popover', 'manual')
    this._loadPanelSize()
  }

  private _loadPanelSize(): void {
    const stored = persistenceStorage.get(StorageKeys.COMPONENT_TREE_SIZE)
    if (stored) {
      try {
        const { width, height } = JSON.parse(stored) as { width: number; height: number }
        this._panelWidth = Math.max(MIN_PANEL_WIDTH, Math.min(width, window.innerWidth * MAX_PANEL_WIDTH_RATIO))
        this._panelHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(height, window.innerHeight * MAX_PANEL_HEIGHT_RATIO))
      } catch {
        // Use defaults
      }
    }
  }

  private _savePanelSize(): void {
    persistenceStorage.set(
      StorageKeys.COMPONENT_TREE_SIZE,
      JSON.stringify({ width: this._panelWidth, height: this._panelHeight }),
    )
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this._stopAutoRefresh()
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('open')) {
      if (this.open) {
        this._show()
      } else {
        this._hide()
      }
    }
  }

  private _show(): void {
    this._buildTree()
    this._focusedIndex = 0
    // Center the panel initially
    this._centerPanel()
    try {
      this.showPopover()
    } catch {
      // Popover might already be shown
    }
    // Focus the tree container after render
    void this.updateComplete.then(() => {
      this._focusTreeContainer()
      this._dispatchFocusChange()
    })
  }

  private _hide(): void {
    try {
      this.hidePopover()
    } catch {
      // Popover might already be hidden
    }
    this._stopAutoRefresh()
    this._autoRefresh = false
    this._treeData = []
    this._flattenedNodes = []
  }

  private _toggleAutoRefresh(): void {
    this._autoRefresh = !this._autoRefresh
    if (this._autoRefresh) {
      this._refreshTree() // Refresh immediately
      this._startAutoRefresh() // Then every 5 seconds
    } else {
      this._stopAutoRefresh()
    }
  }

  private _startAutoRefresh(): void {
    this._stopAutoRefresh()
    this._autoRefreshInterval = setInterval(() => {
      this._refreshTree()
    }, 5000)
  }

  private _stopAutoRefresh(): void {
    if (this._autoRefreshInterval) {
      clearInterval(this._autoRefreshInterval)
      this._autoRefreshInterval = null
    }
  }

  private _refreshTree(): void {
    // Trigger spin animation
    this._isRefreshing = true

    // Store current focused node's element to try to re-focus after refresh
    const currentFocusedItem = this._flattenedNodes[this._focusedIndex]
    const currentFocusedElement = currentFocusedItem?.node.element

    this._buildTree()

    // Try to restore focus to the same element
    if (currentFocusedElement) {
      const newIndex = this._flattenedNodes.findIndex(
        (item) => item.node.element === currentFocusedElement,
      )
      if (newIndex !== -1) {
        this._focusedIndex = newIndex
      }
    }

    // Stop animation after spin completes
    setTimeout(() => {
      this._isRefreshing = false
    }, 500)
  }

  private _dispatchFocusChange(): void {
    const item = this._flattenedNodes[this._focusedIndex]
    if (!item) return

    this.dispatchEvent(
      new CustomEvent('focus-change', {
        detail: { element: item.node.element, name: item.node.name, index: this._focusedIndex },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private _centerPanel(): void {
    this._posX = Math.round((window.innerWidth - this._panelWidth) / 2)
    this._posY = Math.round((window.innerHeight - this._panelHeight) / 2)
  }

  private _clampPosition(x: number, y: number): { x: number; y: number } {
    const panelHeight = this.offsetHeight || this._panelHeight
    const panelWidth = this.offsetWidth || this._panelWidth
    const margin = 8

    const clampedX = Math.max(margin, Math.min(x, window.innerWidth - panelWidth - margin))
    const clampedY = Math.max(margin, Math.min(y, window.innerHeight - panelHeight - margin))

    return { x: clampedX, y: clampedY }
  }

  private _handleHeaderPointerDown = (e: PointerEvent): void => {
    // Only drag on primary button
    if (e.button !== 0) return
    // Don't drag if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) return

    e.preventDefault()
    this._isDragging = true
    this._dragStartX = e.clientX
    this._dragStartY = e.clientY
    this._dragStartPosX = this._posX
    this._dragStartPosY = this._posY

    document.addEventListener('pointermove', this._handlePointerMove)
    document.addEventListener('pointerup', this._handlePointerUp)
  }

  private _handlePointerMove = (e: PointerEvent): void => {
    if (!this._isDragging) return

    const deltaX = e.clientX - this._dragStartX
    const deltaY = e.clientY - this._dragStartY

    const newX = this._dragStartPosX + deltaX
    const newY = this._dragStartPosY + deltaY

    const clamped = this._clampPosition(newX, newY)
    this._posX = clamped.x
    this._posY = clamped.y
  }

  private _handlePointerUp = (): void => {
    this._isDragging = false
    document.removeEventListener('pointermove', this._handlePointerMove)
    document.removeEventListener('pointerup', this._handlePointerUp)
  }

  private _handleResizePointerDown = (direction: ResizeDirection) => (e: PointerEvent): void => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    this._isResizing = true
    this._resizeDirection = direction
    this._resizeStartX = e.clientX
    this._resizeStartY = e.clientY
    this._resizeStartWidth = this._panelWidth
    this._resizeStartHeight = this._panelHeight

    document.addEventListener('pointermove', this._handleResizePointerMove)
    document.addEventListener('pointerup', this._handleResizePointerUp)
  }

  private _handleResizePointerMove = (e: PointerEvent): void => {
    if (!this._isResizing || !this._resizeDirection) return

    const deltaX = e.clientX - this._resizeStartX
    const deltaY = e.clientY - this._resizeStartY

    const maxWidth = window.innerWidth * MAX_PANEL_WIDTH_RATIO
    const maxHeight = window.innerHeight * MAX_PANEL_HEIGHT_RATIO

    if (this._resizeDirection === 'e' || this._resizeDirection === 'se') {
      const newWidth = this._resizeStartWidth + deltaX
      this._panelWidth = Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, maxWidth))
    }

    if (this._resizeDirection === 's' || this._resizeDirection === 'se') {
      const newHeight = this._resizeStartHeight + deltaY
      this._panelHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(newHeight, maxHeight))
    }
  }

  private _handleResizePointerUp = (): void => {
    this._isResizing = false
    this._resizeDirection = null
    this._savePanelSize()
    document.removeEventListener('pointermove', this._handleResizePointerMove)
    document.removeEventListener('pointerup', this._handleResizePointerUp)
  }

  private _focusTreeContainer(): void {
    const container = this.shadowRoot?.querySelector('.tree-container') as HTMLElement
    container?.focus()
  }

  private _generateNodeId(): string {
    return `node-${this._nodeIdCounter++}`
  }

  private _buildTree(): void {
    this._nodeIdCounter = 0
    const attr = CONFIG.attributes.scalaComponent
    const allElements = Array.from(document.querySelectorAll(`[${attr}]`))

    // Filter out devtools elements
    const devtoolsAttr = CONFIG.attributes.devtools
    const scalaElements = allElements.filter(
      (el) => !el.hasAttribute(devtoolsAttr) && !el.closest(`[${devtoolsAttr}]`),
    )

    // Build hierarchical tree from flat list
    const rootNodes: TreeNode[] = []
    const nodeMap = new Map<Element, TreeNode>()

    // Create nodes for all elements
    for (const el of scalaElements) {
      const node: TreeNode = {
        id: this._generateNodeId(),
        element: el,
        name: el.getAttribute(attr) || 'Unknown',
        children: [],
        expanded: true,
        depth: 0,
      }
      nodeMap.set(el, node)
    }

    // Build parent-child relationships
    for (const el of scalaElements) {
      const node = nodeMap.get(el)!
      const parentScalaEl = el.parentElement?.closest(`[${attr}]`)

      if (parentScalaEl && nodeMap.has(parentScalaEl)) {
        const parentNode = nodeMap.get(parentScalaEl)!
        parentNode.children.push(node)
        node.depth = parentNode.depth + 1
      } else {
        rootNodes.push(node)
      }
    }

    this._treeData = rootNodes
    this._updateFlattenedNodes()
  }

  private _updateFlattenedNodes(): void {
    const flattened: FlattenedNode[] = []

    const traverse = (nodes: TreeNode[], ancestorLines: boolean[]) => {
      const lastIndex = nodes.length - 1
      nodes.forEach((node, idx) => {
        const isLast = idx === lastIndex
        flattened.push({
          node,
          isLast,
          ancestorLines: [...ancestorLines],
        })
        if (node.expanded && node.children.length > 0) {
          // Pass down ancestor line info: if not last, ancestors have more siblings
          traverse(node.children, [...ancestorLines, !isLast])
        }
      })
    }

    traverse(this._treeData, [])
    this._flattenedNodes = flattened

    // Clamp focus index
    if (this._focusedIndex >= this._flattenedNodes.length) {
      this._focusedIndex = Math.max(0, this._flattenedNodes.length - 1)
    }
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (this._flattenedNodes.length === 0) return

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        this._close()
        break

      case 'ArrowUp':
        e.preventDefault()
        e.stopPropagation()
        this._focusedIndex = Math.max(0, this._focusedIndex - 1)
        this._onFocusChange()
        break

      case 'ArrowDown':
        e.preventDefault()
        e.stopPropagation()
        this._focusedIndex = Math.min(this._flattenedNodes.length - 1, this._focusedIndex + 1)
        this._onFocusChange()
        break

      case 'ArrowLeft':
        e.preventDefault()
        e.stopPropagation()
        this._collapseOrNavigateUp()
        break

      case 'ArrowRight':
        e.preventDefault()
        e.stopPropagation()
        this._expandOrNavigateDown()
        break

      case 'Enter':
        e.preventDefault()
        e.stopPropagation()
        this._openInIDE(this._focusedIndex)
        break
    }
  }

  private _onFocusChange(): void {
    this._scrollToFocused()
    this._dispatchFocusChange()
  }

  private _scrollToFocused(): void {
    void this.updateComplete.then(() => {
      const focusedEl = this.shadowRoot?.querySelector(`[data-index="${this._focusedIndex}"]`)
      focusedEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  private _toggleNode(index: number): void {
    const item = this._flattenedNodes[index]
    if (!item || item.node.children.length === 0) return

    item.node.expanded = !item.node.expanded
    this._updateFlattenedNodes()
    this.requestUpdate()
  }

  private _collapseOrNavigateUp(): void {
    const item = this._flattenedNodes[this._focusedIndex]
    if (!item) return

    const node = item.node
    if (node.expanded && node.children.length > 0) {
      node.expanded = false
      this._updateFlattenedNodes()
      this.requestUpdate()
    } else if (node.depth > 0) {
      const parentIndex = this._findParentIndex(this._focusedIndex)
      if (parentIndex !== -1) {
        this._focusedIndex = parentIndex
        this._onFocusChange()
      }
    }
  }

  private _expandOrNavigateDown(): void {
    const item = this._flattenedNodes[this._focusedIndex]
    if (!item) return

    const node = item.node
    if (node.children.length > 0) {
      if (!node.expanded) {
        node.expanded = true
        this._updateFlattenedNodes()
        this.requestUpdate()
      } else {
        this._focusedIndex = Math.min(this._flattenedNodes.length - 1, this._focusedIndex + 1)
        this._onFocusChange()
      }
    }
  }

  private _findParentIndex(index: number): number {
    const item = this._flattenedNodes[index]
    if (!item || item.node.depth === 0) return -1

    for (let i = index - 1; i >= 0; i--) {
      if (this._flattenedNodes[i]!.node.depth === item.node.depth - 1) {
        return i
      }
    }
    return -1
  }

  private _expandAll(): void {
    const setExpanded = (nodes: TreeNode[], expanded: boolean) => {
      for (const node of nodes) {
        node.expanded = expanded
        if (node.children.length > 0) {
          setExpanded(node.children, expanded)
        }
      }
    }

    setExpanded(this._treeData, true)
    this._updateFlattenedNodes()
    this.requestUpdate()
  }

  private _collapseAll(): void {
    const setExpanded = (nodes: TreeNode[], expanded: boolean) => {
      for (const node of nodes) {
        node.expanded = expanded
        if (node.children.length > 0) {
          setExpanded(node.children, expanded)
        }
      }
    }

    setExpanded(this._treeData, false)
    this._updateFlattenedNodes()
    this.requestUpdate()
  }

  private _openInIDE(index: number): void {
    const item = this._flattenedNodes[index]
    if (!item) return

    const info = getComponentSourceInfo(item.node.element)
    if (info?.sourcePath) {
      openInIDE(info.sourcePath, info.sourceLine)
    }

    this._highlightElement(item.node.element)
  }

  private _highlightElement(element: Element): void {
    const rect = element.getBoundingClientRect()

    const highlight = document.createElement('div')
    highlight.setAttribute(CONFIG.attributes.devtools, 'tree-highlight')
    Object.assign(highlight.style, {
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      backgroundColor: 'rgba(142, 97, 227, 0.3)',
      border: '2px solid rgba(142, 97, 227, 0.8)',
      borderRadius: '4px',
      pointerEvents: 'none',
      zIndex: '2147483646',
      transition: 'opacity 0.3s ease-out',
    })

    document.body.appendChild(highlight)

    setTimeout(() => {
      highlight.style.opacity = '0'
      setTimeout(() => highlight.remove(), 300)
    }, 500)
  }

  private _close(): void {
    // Stop auto-refresh immediately when closing
    this._stopAutoRefresh()
    this._autoRefresh = false

    this.open = false
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private _handleItemClick(index: number, e: MouseEvent): void {
    const prevIndex = this._focusedIndex
    this._focusedIndex = index

    // Check if clicked on toggle
    const target = e.target as HTMLElement
    if (target.classList.contains('toggle')) {
      this._toggleNode(index)
    }

    // Dispatch focus change if focus changed
    if (prevIndex !== index) {
      this._dispatchFocusChange()
    }
  }

  private _handleItemDblClick(index: number): void {
    this._openInIDE(index)
  }

  private _renderGuideLines(item: FlattenedNode) {
    const { node, isLast, ancestorLines } = item

    // For root nodes (depth 0), no guide lines needed
    if (node.depth === 0) {
      return nothing
    }

    // Render ancestor continuation lines and the connector for this node
    const guides = []

    // Draw vertical lines for ancestors that have more siblings
    for (let i = 0; i < ancestorLines.length; i++) {
      const hasLine = ancestorLines[i]
      guides.push(html`<span class="guide-line">${hasLine ? '│' : ' '}</span>`)
    }

    // Draw the connector for this node
    const connector = isLast ? '└' : '├'
    guides.push(html`<span class="guide-line connector">${connector}</span>`)

    return guides
  }

  private _renderToggleIcon(hasChildren: boolean, expanded: boolean) {
    if (!hasChildren) {
      return html`<span class="toggle-placeholder">─</span>`
    }

    return html`
      <svg
        class="toggle-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        ${expanded ? CHEVRON_DOWN : CHEVRON_RIGHT}
      </svg>
    `
  }

  private _renderTreeItem(item: FlattenedNode, index: number) {
    const { node } = item
    const isFocused = index === this._focusedIndex
    const hasChildren = node.children.length > 0

    return html`
      <div
        class="tree-item ${isFocused ? 'focused' : ''}"
        data-index=${index}
        @click=${(e: MouseEvent) => this._handleItemClick(index, e)}
        @dblclick=${() => this._handleItemDblClick(index)}
      >
        <span class="guides">${this._renderGuideLines(item)}</span>
        <span
          class="toggle ${hasChildren ? 'has-children' : ''}"
          @click=${(e: MouseEvent) => {
            if (hasChildren) {
              e.stopPropagation()
              this._toggleNode(index)
            }
          }}
        >
          ${this._renderToggleIcon(hasChildren, node.expanded)}
        </span>
        <span class="name">${node.name}</span>
      </div>
    `
  }

  private _renderTree() {
    if (this._flattenedNodes.length === 0) {
      return html`
        <div class="empty-state">
          No Laminar components found.<br />
          <span class="hint">Elements need <code>data-scala</code> attribute.</span>
        </div>
      `
    }

    return html`
      ${repeat(
        this._flattenedNodes,
        (item) => item.node.id,
        (item, index) => this._renderTreeItem(item, index),
      )}
    `
  }

  render() {
    if (!this.open) {
      return nothing
    }

    return html`
      <div
        class="panel ${this._isDragging ? 'dragging' : ''} ${this._isResizing ? 'resizing' : ''}"
        style="left: ${this._posX}px; top: ${this._posY}px; width: ${this._panelWidth}px; height: ${this._panelHeight}px;"
      >
        <div
          class="header"
          @pointerdown=${this._handleHeaderPointerDown}
        >
          <span class="title">Laminar Component Tree</span>
          <div class="actions">
            <button
              class="auto-refresh-btn ${this._autoRefresh ? 'active' : ''}"
              title="Auto-refresh (5s)"
              @click=${this._toggleAutoRefresh}
            >
              <fd-icon
                name="refresh"
                class="${this._isRefreshing ? 'spinning' : ''}"
                size=${14}
              ></fd-icon>
            </button>
            <fd-button size="sm" @click=${this._expandAll}>Expand All</fd-button>
            <fd-button size="sm" @click=${this._collapseAll}>Collapse All</fd-button>
            <fd-button size="sm" @click=${this._close}>✕</fd-button>
          </div>
        </div>
        <div
          class="tree-container"
          tabindex="0"
          @keydown=${this._handleKeydown}
        >
          ${this._renderTree()}
        </div>
        <div class="footer">
          <span>↑↓ Navigate</span>
          <span>←→ Collapse/Expand</span>
          <span>Enter Open in IDE</span>
          <span>Esc Close</span>
        </div>
        <div class="resize-handle resize-e" @pointerdown=${this._handleResizePointerDown('e')}></div>
        <div class="resize-handle resize-s" @pointerdown=${this._handleResizePointerDown('s')}></div>
        <div class="resize-handle resize-se" @pointerdown=${this._handleResizePointerDown('se')}></div>
      </div>
    `
  }

  static styles = [
    css`
      :host {
        /* No backdrop - allows interaction with page */
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        overflow: visible;
      }

      :host::backdrop {
        /* Transparent backdrop */
        background: transparent;
      }

      .panel {
        position: fixed;
        background: var(--fd-bg-panel, #141414);
        border: 1px solid var(--fd-border-medium, rgba(255, 255, 255, 0.15));
        border-radius: 8px;
        box-shadow: var(--fd-shadow-panel, 0 4px 12px rgba(0, 0, 0, 0.3));
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-family: var(--fd-font, system-ui, -apple-system, sans-serif);
        font-size: 13px;
        color: var(--fd-text-primary, #fff);
        z-index: 2147483647;
      }

      .panel.dragging,
      .panel.resizing {
        user-select: none;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--fd-border-subtle, rgba(255, 255, 255, 0.08));
        background: var(--fd-bg-elevated, #1a1a1a);
        cursor: grab;
      }

      .header:active {
        cursor: grabbing;
      }

      .title {
        font-weight: 600;
        font-size: 14px;
        user-select: none;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .auto-refresh-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        padding: 0;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--fd-text-muted, #999);
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }

      .auto-refresh-btn:hover {
        background: var(--fd-bg-hover, rgba(255, 255, 255, 0.1));
        color: var(--fd-text-primary, #fff);
      }

      .auto-refresh-btn.active {
        color: var(--fd-primary, rgb(142, 97, 227));
      }

      .auto-refresh-btn.active:hover {
        color: var(--fd-primary-hover, rgb(162, 117, 247));
      }

      .auto-refresh-btn fd-icon.spinning {
        animation: spin 0.5s ease-in-out;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(-360deg);
        }
      }

      .tree-container {
        overflow-y: auto;
        flex: 1;
        padding: 8px 0;
        outline: none;
      }

      .tree-container:focus-visible {
        outline: none;
      }

      .tree-item {
        display: flex;
        align-items: center;
        padding: 2px 12px;
        cursor: pointer;
        border-left: 2px solid transparent;
        min-height: 24px;
      }

      .tree-item:hover {
        background: var(--fd-bg-hover, rgba(255, 255, 255, 0.1));
      }

      .tree-item.focused {
        background: var(--fd-primary-15, rgba(142, 97, 227, 0.15));
        border-left-color: var(--fd-primary, rgb(142, 97, 227));
      }

      .guides {
        display: flex;
        flex-shrink: 0;
      }

      .guide-line {
        display: inline-block;
        width: 16px;
        font-family: var(--fd-font-mono, monospace);
        font-size: 12px;
        color: var(--fd-text-faint, rgba(255, 255, 255, 0.3));
        text-align: center;
        user-select: none;
      }

      .guide-line.connector {
        color: var(--fd-text-muted, #999);
      }

      .toggle {
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        flex-shrink: 0;
        color: var(--fd-text-muted, #999);
      }

      .toggle.has-children {
        cursor: pointer;
        color: var(--fd-text-secondary, #e0e0e0);
      }

      .toggle.has-children:hover {
        color: var(--fd-primary, rgb(142, 97, 227));
      }

      .toggle-icon {
        width: 14px;
        height: 14px;
      }

      .toggle-placeholder {
        font-family: var(--fd-font-mono, monospace);
        font-size: 12px;
        color: var(--fd-text-faint, rgba(255, 255, 255, 0.3));
      }

      .name {
        font-family: var(--fd-font-mono, monospace);
        font-size: 12px;
        color: var(--fd-text-secondary, #e0e0e0);
        margin-left: 4px;
      }

      .tree-item.focused .name {
        color: var(--fd-primary, rgb(142, 97, 227));
      }

      .tree-item.focused .guide-line.connector {
        color: var(--fd-primary-50, rgba(142, 97, 227, 0.5));
      }

      .empty-state {
        padding: 32px 16px;
        text-align: center;
        color: var(--fd-text-muted, #999);
      }

      .empty-state .hint {
        font-size: 11px;
      }

      .empty-state code {
        background: var(--fd-bg-hover, rgba(255, 255, 255, 0.1));
        padding: 2px 4px;
        border-radius: 3px;
        font-family: var(--fd-font-mono, monospace);
        font-size: 11px;
      }

      .footer {
        padding: 8px 16px;
        border-top: 1px solid var(--fd-border-subtle, rgba(255, 255, 255, 0.08));
        font-size: 11px;
        color: var(--fd-text-muted, #999);
        display: flex;
        gap: 16px;
        user-select: none;
      }

      /* Resize handles */
      .resize-handle {
        position: absolute;
        z-index: 1;
      }

      .resize-e {
        top: 0;
        right: 0;
        width: 6px;
        height: 100%;
        cursor: ew-resize;
      }

      .resize-s {
        bottom: 0;
        left: 0;
        width: 100%;
        height: 6px;
        cursor: ns-resize;
      }

      .resize-se {
        bottom: 0;
        right: 0;
        width: 16px;
        height: 16px;
        cursor: nwse-resize;
      }

      .resize-e:hover,
      .resize-s:hover {
        background: var(--fd-primary-15, rgba(142, 97, 227, 0.15));
      }

      .resize-se::after {
        content: '';
        position: absolute;
        bottom: 3px;
        right: 3px;
        width: 10px;
        height: 10px;
        border: 2px solid var(--fd-text-muted, #999);
        border-top: none;
        border-left: none;
        border-bottom-right-radius: 4px;
        opacity: 0.5;
      }

      .resize-se:hover::after {
        border-color: var(--fd-primary, rgb(142, 97, 227));
        opacity: 1;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-laminar-component-tree': FdLaminarComponentTree
  }
}
