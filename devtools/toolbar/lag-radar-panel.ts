// ============================================================================
// LAG RADAR PANEL
// ============================================================================
// Lag radar visualization with pin/unpin lifecycle management.
// ============================================================================

import { CONFIG } from '../config'
import { FPSMonitor, LagRadar } from '../monitors'
import { TooltipManager } from '../ui'
import { StorageManager } from '../storage'

/**
 * Manages the lag radar tooltip with pin/unpin functionality.
 */
export class LagRadarPanel {
  #tooltipManager: TooltipManager
  #fpsMonitor: FPSMonitor
  #lagRadar: LagRadar | null = null
  #pinned = false

  constructor(tooltipManager: TooltipManager, fpsMonitor: FPSMonitor) {
    this.#tooltipManager = tooltipManager
    this.#fpsMonitor = fpsMonitor
  }

  /**
   * Check if lag radar is pinned.
   */
  get isPinned(): boolean {
    return this.#pinned
  }

  /**
   * Pin the lag radar.
   */
  pin(): void {
    this.#pinned = true
    StorageManager.setLagRadarPinned(true)

    const radarContent = this.#createLagRadarContent()
    this.#tooltipManager.pinElement(radarContent)

    // Start radar animation
    this.#lagRadar?.start()
  }

  /**
   * Unpin the lag radar.
   */
  unpin(): void {
    this.#pinned = false
    StorageManager.setLagRadarPinned(false)

    // Unpin first to start the fade-out animation
    this.#tooltipManager.unpin()

    // Destroy radar after fade-out animation completes
    if (this.#lagRadar) {
      const radar = this.#lagRadar
      this.#lagRadar = null
      setTimeout(() => {
        radar.destroy()
      }, CONFIG.animation.tooltipFadeMs)
    }
  }

  /**
   * Toggle lag radar pin state.
   */
  toggle(): void {
    if (this.#pinned) {
      this.unpin()
    } else {
      this.pin()
    }
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    if (this.#lagRadar) {
      this.#lagRadar.destroy()
      this.#lagRadar = null
    }
  }

  /**
   * Create the lag radar tooltip content.
   * @private
   */
  #createLagRadarContent(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'devtools-radar-container'

    // Create radar instance
    this.#lagRadar = new LagRadar(this.#fpsMonitor, {
      size: CONFIG.dimensions.radarSize,
    })
    const canvas = this.#lagRadar.create()
    container.appendChild(canvas)

    // Add legend
    const legend = document.createElement('div')
    legend.className = 'devtools-radar-legend'
    legend.innerHTML = `
      <div class="devtools-radar-legend-item">
        <span class="devtools-radar-legend-dot good"></span>
        <span>50+</span>
      </div>
      <div class="devtools-radar-legend-item">
        <span class="devtools-radar-legend-dot warning"></span>
        <span>30-50</span>
      </div>
      <div class="devtools-radar-legend-item">
        <span class="devtools-radar-legend-dot critical"></span>
        <span>&lt;30</span>
      </div>
    `
    container.appendChild(legend)

    return container
  }
}