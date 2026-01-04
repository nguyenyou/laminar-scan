// ============================================================================
// TOOLTIP STACK MANAGER
// ============================================================================
// Manages stacking order and positioning of pinned tooltips.
// ============================================================================

import { CONFIG } from '../config'
import { TooltipManager } from '../ui'

export type PinnedTooltipId = 'lagRadar' | 'domStats'

interface TooltipManagerMap {
  lagRadar: TooltipManager
  domStats: TooltipManager
}

/**
 * Manages the stacking order and positioning of pinned tooltips.
 * Tooltips are stacked vertically, with the first pinned closest to the toolbar.
 */
export class TooltipStackManager {
  /** Order of pinned tooltips (first = closest to toolbar) */
  #pinnedOrder: PinnedTooltipId[] = []

  /** Toolbar element reference for corner detection */
  #toolbar: HTMLDivElement | null = null

  /** Tooltip managers by ID */
  #tooltipManagers: TooltipManagerMap

  constructor(tooltipManagers: TooltipManagerMap) {
    this.#tooltipManagers = tooltipManagers
  }

  /**
   * Set the toolbar element reference.
   */
  setToolbar(toolbar: HTMLDivElement): void {
    this.#toolbar = toolbar
  }

  /**
   * Get the current pinned order.
   */
  get pinnedOrder(): readonly PinnedTooltipId[] {
    return this.#pinnedOrder
  }

  /**
   * Add a tooltip to the pinned stack.
   */
  addToPinnedOrder(id: PinnedTooltipId): void {
    if (!this.#pinnedOrder.includes(id)) {
      this.#pinnedOrder.push(id)
    }
  }

  /**
   * Remove a tooltip from the pinned stack.
   */
  removeFromPinnedOrder(id: PinnedTooltipId): void {
    this.#pinnedOrder = this.#pinnedOrder.filter((pinnedId) => pinnedId !== id)
  }

  /**
   * Check if a tooltip is in the pinned stack.
   */
  isPinned(id: PinnedTooltipId): boolean {
    return this.#pinnedOrder.includes(id)
  }

  /**
   * Update stacking classes and positions for all pinned tooltips.
   * First pinned = stacked-1 (closest to toolbar), second = stacked-2 (on top of first).
   */
  updateStacking(): void {
    const lagRadarTooltip = this.#tooltipManagers.lagRadar.getElement()
    const domStatsTooltip = this.#tooltipManagers.domStats.getElement()

    // Only reset stacking for tooltips that are still pinned
    // Don't touch unpinned tooltips - they may be fading out
    if (lagRadarTooltip && this.#pinnedOrder.includes('lagRadar')) {
      lagRadarTooltip.classList.remove('stacked-1', 'stacked-2')
      lagRadarTooltip.style.removeProperty('bottom')
      lagRadarTooltip.style.removeProperty('top')
    }
    if (domStatsTooltip && this.#pinnedOrder.includes('domStats')) {
      domStatsTooltip.classList.remove('stacked-1', 'stacked-2')
      domStatsTooltip.style.removeProperty('bottom')
      domStatsTooltip.style.removeProperty('top')
    }

    // Check if toolbar is at top (affects positioning direction)
    const isTop = this.#toolbar?.classList.contains('corner-top') ?? false

    // Apply stacking classes and dynamic positioning
    const baseGap = 8
    const tooltipGap = 8
    let accumulatedOffset = baseGap

    this.#pinnedOrder.forEach((id, index) => {
      const stackClass = `stacked-${index + 1}`
      let tooltip: HTMLElement | null = null

      if (id === 'lagRadar' && lagRadarTooltip) {
        tooltip = lagRadarTooltip
      } else if (id === 'domStats' && domStatsTooltip) {
        tooltip = domStatsTooltip
      }

      if (tooltip) {
        tooltip.classList.add(stackClass)

        // Set position for all tooltips
        if (isTop) {
          tooltip.style.top = `calc(100% + ${accumulatedOffset}px)`
        } else {
          tooltip.style.bottom = `calc(100% + ${accumulatedOffset}px)`
        }

        // Accumulate height for next tooltip
        const tooltipHeight = tooltip.offsetHeight || CONFIG.dimensions.tooltipMinHeight
        accumulatedOffset += tooltipHeight + tooltipGap
      }
    })
  }
}