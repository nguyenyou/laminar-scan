import { LitElement, css, html, nothing } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'
import { CONFIG, getComponentSourceInfo, openInIDE } from '../core/utilities'

interface TreeNode {
  id: string
  element: Element
  name: string
  children: TreeNode[]
  expanded: boolean
  depth: number
}

const PANEL_WIDTH = 500
const PANEL_MAX_HEIGHT_RATIO = 0.7

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

  private _flattenedNodes: TreeNode[] = []
  private _nodeIdCounter = 0
  private _dragStartX = 0
  private _dragStartY = 0
  private _dragStartPosX = 0
  private _dragStartPosY = 0

  override connectedCallback(): void {
    super.connectedCallback()
    // Set popover attribute for Popover API
    this.setAttribute('popover', 'manual')
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
    })
  }

  private _hide(): void {
    try {
      this.hidePopover()
    } catch {
      // Popover might already be hidden
    }
    this._treeData = []
    this._flattenedNodes = []
  }

  private _centerPanel(): void {
    const panelHeight = Math.min(window.innerHeight * PANEL_MAX_HEIGHT_RATIO, 600)
    this._posX = Math.round((window.innerWidth - PANEL_WIDTH) / 2)
    this._posY = Math.round((window.innerHeight - panelHeight) / 2)
  }

  private _clampPosition(x: number, y: number): { x: number; y: number } {
    const panelHeight = this.offsetHeight || 400
    const panelWidth = this.offsetWidth || PANEL_WIDTH
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
    const flattened: TreeNode[] = []

    const traverse = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        flattened.push(node)
        if (node.expanded && node.children.length > 0) {
          traverse(node.children)
        }
      }
    }

    traverse(this._treeData)
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
        this._close()
        break

      case 'ArrowUp':
        e.preventDefault()
        this._focusedIndex = Math.max(0, this._focusedIndex - 1)
        this._scrollToFocused()
        break

      case 'ArrowDown':
        e.preventDefault()
        this._focusedIndex = Math.min(this._flattenedNodes.length - 1, this._focusedIndex + 1)
        this._scrollToFocused()
        break

      case 'ArrowLeft':
        e.preventDefault()
        this._collapseOrNavigateUp()
        break

      case 'ArrowRight':
        e.preventDefault()
        this._expandOrNavigateDown()
        break

      case 'Enter':
        e.preventDefault()
        this._openInIDE(this._focusedIndex)
        break
    }
  }

  private _scrollToFocused(): void {
    void this.updateComplete.then(() => {
      const focusedEl = this.shadowRoot?.querySelector(`[data-index="${this._focusedIndex}"]`)
      focusedEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  private _toggleNode(index: number): void {
    const node = this._flattenedNodes[index]
    if (!node || node.children.length === 0) return

    node.expanded = !node.expanded
    this._updateFlattenedNodes()
    this.requestUpdate()
  }

  private _collapseOrNavigateUp(): void {
    const node = this._flattenedNodes[this._focusedIndex]
    if (!node) return

    if (node.expanded && node.children.length > 0) {
      node.expanded = false
      this._updateFlattenedNodes()
      this.requestUpdate()
    } else if (node.depth > 0) {
      const parentIndex = this._findParentIndex(this._focusedIndex)
      if (parentIndex !== -1) {
        this._focusedIndex = parentIndex
        this._scrollToFocused()
      }
    }
  }

  private _expandOrNavigateDown(): void {
    const node = this._flattenedNodes[this._focusedIndex]
    if (!node) return

    if (node.children.length > 0) {
      if (!node.expanded) {
        node.expanded = true
        this._updateFlattenedNodes()
        this.requestUpdate()
      } else {
        this._focusedIndex = Math.min(this._flattenedNodes.length - 1, this._focusedIndex + 1)
        this._scrollToFocused()
      }
    }
  }

  private _findParentIndex(index: number): number {
    const node = this._flattenedNodes[index]
    if (!node || node.depth === 0) return -1

    for (let i = index - 1; i >= 0; i--) {
      if (this._flattenedNodes[i]!.depth === node.depth - 1) {
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
    const node = this._flattenedNodes[index]
    if (!node) return

    const info = getComponentSourceInfo(node.element)
    if (info?.sourcePath) {
      openInIDE(info.sourcePath, info.sourceLine)
    }

    this._highlightElement(node.element)
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
    this.open = false
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private _handleItemClick(index: number, e: MouseEvent): void {
    this._focusedIndex = index

    // Check if clicked on toggle
    const target = e.target as HTMLElement
    if (target.classList.contains('toggle')) {
      this._toggleNode(index)
    }
  }

  private _handleItemDblClick(index: number): void {
    this._openInIDE(index)
  }

  private _renderTreeItem(node: TreeNode, index: number) {
    const isFocused = index === this._focusedIndex
    const hasChildren = node.children.length > 0

    return html`
      <div
        class="tree-item ${isFocused ? 'focused' : ''}"
        data-index=${index}
        style="padding-left: ${16 + node.depth * 16}px"
        @click=${(e: MouseEvent) => this._handleItemClick(index, e)}
        @dblclick=${() => this._handleItemDblClick(index)}
      >
        <span class="toggle ${hasChildren ? 'has-children' : ''}">
          ${hasChildren ? (node.expanded ? '▼' : '▶') : '•'}
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
        (node) => node.id,
        (node, index) => this._renderTreeItem(node, index),
      )}
    `
  }

  render() {
    if (!this.open) {
      return nothing
    }

    return html`
      <div
        class="panel ${this._isDragging ? 'dragging' : ''}"
        style="left: ${this._posX}px; top: ${this._posY}px;"
      >
        <div
          class="header"
          @pointerdown=${this._handleHeaderPointerDown}
        >
          <span class="title">Laminar Component Tree</span>
          <div class="actions">
            <button class="action-btn" @click=${this._expandAll}>Expand All</button>
            <button class="action-btn" @click=${this._collapseAll}>Collapse All</button>
            <button class="close-btn" @click=${this._close}>✕</button>
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
        max-width: 80vw;
        max-height: 70vh;
        width: 500px;
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

      .panel.dragging {
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
        gap: 8px;
      }

      .action-btn {
        padding: 4px 8px;
        font-size: 11px;
        background: var(--fd-bg-hover, rgba(255, 255, 255, 0.1));
        border: none;
        border-radius: 4px;
        color: var(--fd-text-secondary, #e0e0e0);
        cursor: pointer;
        font-family: inherit;
      }

      .action-btn:hover {
        background: var(--fd-primary-20, rgba(142, 97, 227, 0.2));
        color: var(--fd-text-primary, #fff);
      }

      .close-btn {
        padding: 4px 8px;
        font-size: 11px;
        background: transparent;
        border: none;
        color: var(--fd-text-muted, #999);
        cursor: pointer;
        font-family: inherit;
      }

      .close-btn:hover {
        color: var(--fd-text-primary, #fff);
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
        padding: 4px 16px;
        cursor: pointer;
        border-left: 2px solid transparent;
      }

      .tree-item:hover {
        background: var(--fd-bg-hover, rgba(255, 255, 255, 0.1));
      }

      .tree-item.focused {
        background: var(--fd-primary-15, rgba(142, 97, 227, 0.15));
        border-left-color: var(--fd-primary, rgb(142, 97, 227));
      }

      .toggle {
        width: 16px;
        font-size: 10px;
        color: var(--fd-text-muted, #999);
        user-select: none;
        flex-shrink: 0;
      }

      .toggle.has-children {
        cursor: pointer;
      }

      .toggle.has-children:hover {
        color: var(--fd-text-primary, #fff);
      }

      .name {
        font-family: var(--fd-font-mono, monospace);
        font-size: 12px;
        color: var(--fd-text-secondary, #e0e0e0);
      }

      .tree-item.focused .name {
        color: var(--fd-primary, rgb(142, 97, 227));
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
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-laminar-component-tree': FdLaminarComponentTree
  }
}
