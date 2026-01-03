// ============================================================================
// TOOLBAR
// ============================================================================
// Main toolbar UI that composes all other components.
// ============================================================================

import { CONFIG, STYLES } from "./config";
import { StorageManager } from "./storage";
import { FPSMonitor, MemoryMonitor } from "./monitors";
import { TooltipManager, DragController } from "./ui";
import { DomStatsPanel } from "./toolbar/dom-stats-panel";
import { LagRadarPanel } from "./toolbar/lag-radar-panel";
import { PositionManager } from "./toolbar/position-manager";
import * as Elements from "./toolbar/elements";

interface ToolbarOptions {
  onScanningToggle?: (enabled: boolean) => void;
  onInspectToggle?: () => void;
}

/**
 * Main devtools toolbar component.
 * Composes FPSMonitor, MemoryMonitor, TooltipManager, and DragController.
 */
export class Toolbar {
  /** Root container element */
  #root: HTMLDivElement | null = null;

  /** Shadow DOM root */
  #shadowRoot: ShadowRoot | null = null;

  /** Toolbar element */
  #toolbar: HTMLDivElement | null = null;

  /** Content container (hidden when collapsed) */
  #content: HTMLDivElement | null = null;

  /** Expand button (shown when collapsed) */
  #expandButton: HTMLButtonElement | null = null;

  /** Inspect button */
  #inspectButton: HTMLButtonElement | null = null;

  /** FPS value display */
  #fpsValueElement: HTMLSpanElement | null = null;

  /** Memory value display */
  #memoryValueElement: HTMLSpanElement | null = null;

  // Composed components
  #fpsMonitor = new FPSMonitor();
  #memoryMonitor = new MemoryMonitor();
  #tooltipManager = new TooltipManager();

  /** Dedicated tooltip manager for lag radar */
  #lagRadarTooltipManager = new TooltipManager();

  /** Dedicated tooltip manager for DOM stats */
  #domStatsTooltipManager = new TooltipManager();

  #dragController: DragController | null = null;
  #positionManager: PositionManager | null = null;
  #lagRadarPanel: LagRadarPanel | null = null;
  #domStatsPanel: DomStatsPanel | null = null;

  // Interval IDs for display updates
  #fpsIntervalId: ReturnType<typeof setInterval> | null = null;
  #memoryIntervalId: ReturnType<typeof setInterval> | null = null;

  /** FPS meter container element */
  #fpsMeterElement: HTMLDivElement | null = null;

  /** Order of pinned tooltips (first = closest to toolbar) */
  #pinnedOrder: Array<"lagRadar" | "domStats"> = [];

  /** Resize event handler */
  #resizeHandler: (() => void) | null = null;

  // Callbacks
  #onScanningToggle: ((enabled: boolean) => void) | null = null;
  #onInspectToggle: (() => void) | null = null;

  /**
   * Create a new Toolbar.
   * @param {Object} options - Configuration options
   * @param {(enabled: boolean) => void} [options.onScanningToggle] - Called when scanning toggle changes
   * @param {() => void} [options.onInspectToggle] - Called when inspect button clicked
   */
  constructor(options: ToolbarOptions = {}) {
    this.#onScanningToggle = options.onScanningToggle ?? null;
    this.#onInspectToggle = options.onInspectToggle ?? null;

    // Initialize drag controller with callbacks
    this.#dragController = new DragController({
      onDragStart: () => {
        this.#tooltipManager.suspend();
        this.#lagRadarTooltipManager.suspend();
        this.#domStatsTooltipManager.suspend();
        this.#fpsMonitor.pause();
        this.#stopDisplayUpdates();
      },
      onDragEnd: () => {
        this.#fpsMonitor.resume();
        this.#startDisplayUpdates();
      },
      onPositionChange: (position, corner) => {
        StorageManager.setToolbarPosition(corner, position);
        this.#updateTooltipStacking();
        setTimeout(() => {
          this.#tooltipManager.resume();
          this.#lagRadarTooltipManager.resume();
          this.#domStatsTooltipManager.resume();
        }, 50);
      },
      onCollapse: (corner, orientation) => {
        StorageManager.setCollapsedState({ corner, orientation });
      },
      onExpand: (corner) => {
        this.#expandFromCollapsed(corner);
      },
    });

    // Initialize panel managers
    this.#lagRadarPanel = new LagRadarPanel(this.#lagRadarTooltipManager, this.#fpsMonitor);
    this.#domStatsPanel = new DomStatsPanel(this.#domStatsTooltipManager);
  }

  /**
   * Mount the toolbar to the DOM.
   */
  mount() {
    if (this.#root) return;

    // Safety check: prevent duplicate toolbars in DOM
    const existing = document.getElementById("devtools-root");
    if (existing) {
      console.warn("Devtools: Toolbar already exists in DOM, skipping mount");
      return;
    }

    // Create root container
    this.#root = document.createElement("div");
    this.#root.id = "devtools-root";
    this.#root.setAttribute(CONFIG.attributes.devtools, "toolbar");

    // Create shadow DOM
    this.#shadowRoot = this.#root.attachShadow({ mode: "open" });

    // Add styles
    const style = document.createElement("style");
    style.textContent = STYLES;
    this.#shadowRoot.appendChild(style);

    // Create toolbar
    this.#toolbar = this.#createToolbar();
    this.#shadowRoot.appendChild(this.#toolbar);

    // Mount to document
    document.documentElement.appendChild(this.#root);

    // Initialize position after in DOM
    requestAnimationFrame(() => {
      this.#initPosition();

      // Update tooltip stacking after corner classes are set
      // This ensures pinned tooltips from storage are positioned correctly
      this.#updateTooltipStacking();
    });

    // Setup resize handler
    this.#resizeHandler = () => this.#handleResize();
    window.addEventListener("resize", this.#resizeHandler);

    // Start display updates
    this.#startDisplayUpdates();
  }

  /**
   * Unmount the toolbar from the DOM.
   */
  unmount() {
    this.#stopDisplayUpdates();
    this.#fpsMonitor.stop();
    this.#tooltipManager.destroy();
    this.#lagRadarTooltipManager.destroy();
    this.#domStatsTooltipManager.destroy();
    this.#dragController?.destroy();
    this.#positionManager?.destroy();
    this.#lagRadarPanel?.destroy();
    this.#domStatsPanel?.destroy();

    if (this.#root?.parentNode) {
      this.#root.parentNode.removeChild(this.#root);
    }

    this.#root = null;
    this.#shadowRoot = null;
    this.#toolbar = null;
    this.#content = null;
    this.#expandButton = null;
    this.#inspectButton = null;
    this.#fpsValueElement = null;
    this.#memoryValueElement = null;
    this.#fpsMeterElement = null;
    this.#positionManager = null;
    this.#lagRadarPanel = null;
    this.#domStatsPanel = null;
  }

  /**
   * Update the inspect button state.
   * @param {boolean} isInspecting - Whether currently inspecting
   */
  updateInspectButton(isInspecting: boolean): void {
    if (!this.#inspectButton) return;
    Elements.updateInspectButton(this.#inspectButton, isInspecting);
  }

  /**
   * Create the toolbar element structure.
   * @private
   * @returns {HTMLDivElement}
   */
  #createToolbar(): HTMLDivElement {
    const toolbar = document.createElement("div");
    toolbar.className = "devtools-toolbar";

    // Initialize drag controller
    this.#dragController?.init(toolbar);

    // Create expand button (for collapsed state)
    this.#expandButton = this.#createExpandButton();
    this.#expandButton.style.display = "none";
    toolbar.appendChild(this.#expandButton);

    // Create content container
    this.#content = document.createElement("div");
    this.#content.style.cssText = "display: flex; align-items: center; gap: 8px;";

    // Add inspect button
    this.#inspectButton = this.#createInspectButton();
    this.#content.appendChild(this.#inspectButton);

    // Add scanning toggle
    const toggle = this.#createScanningToggle();
    this.#content.appendChild(toggle);

    // Add FPS meter
    const fpsMeter = this.#createFPSMeter();
    this.#content.appendChild(fpsMeter);

    // Add memory meter (if supported)
    if (MemoryMonitor.isSupported()) {
      const memoryMeter = this.#createMemoryMeter();
      this.#content.appendChild(memoryMeter);
    }

    // Add dom stats button
    const domStatsBtn = this.#createDomStatsButton();
    this.#content.appendChild(domStatsBtn);

    toolbar.appendChild(this.#content);

    // Create and add hover tooltip (for general tooltips)
    const { container: tooltip } = this.#tooltipManager.create();
    toolbar.appendChild(tooltip);

    // Create dedicated tooltip for lag radar (can be pinned independently)
    const { container: lagRadarTooltip } = this.#lagRadarTooltipManager.create();
    toolbar.appendChild(lagRadarTooltip);

    // Create dedicated tooltip for DOM stats (can be pinned independently)
    const { container: domStatsTooltip } = this.#domStatsTooltipManager.create();
    toolbar.appendChild(domStatsTooltip);

    // Setup tooltip events for hover behavior
    this.#tooltipManager.setupEvents(toolbar);

    return toolbar;
  }

  /**
   * Create the expand button.
   * @private
   */
  #createExpandButton(): HTMLButtonElement {
    return Elements.createExpandButton(() => {
      this.#dragController?.expand();
    });
  }

  /**
   * Create the inspect button.
   * @private
   */
  #createInspectButton(): HTMLButtonElement {
    return Elements.createInspectButton(() => {
      this.#onInspectToggle?.();
    });
  }

  /**
   * Create the scanning toggle.
   * @private
   */
  #createScanningToggle() {
    return Elements.createScanningToggle((enabled) => {
      this.#onScanningToggle?.(enabled);
    });
  }

  /**
   * Create the FPS meter.
   * @private
   */
  #createFPSMeter() {
    const { container, valueElement } = Elements.createFPSMeter(() => {
      this.#toggleLagRadarPin();
    });

    this.#fpsValueElement = valueElement;
    this.#fpsMeterElement = container;

    // Restore pinned state from storage
    if (StorageManager.isLagRadarPinned()) {
      requestAnimationFrame(() => {
        this.#pinLagRadar();
      });
    }

    return container;
  }



  /**
   * Update stacking classes and positions for pinned tooltips.
   * First pinned = stacked-1 (closest to toolbar), second = stacked-2 (on top of first).
   * @private
   */
  #updateTooltipStacking() {
    // Get tooltip elements from their managers
    const lagRadarTooltip = this.#lagRadarTooltipManager.getElement();
    const domStatsTooltip = this.#domStatsTooltipManager.getElement();

    // Only reset stacking for tooltips that are still pinned
    // Don't touch unpinned tooltips - they may be fading out and we don't want to
    // change their position during the fade animation
    if (lagRadarTooltip && this.#pinnedOrder.includes("lagRadar")) {
      lagRadarTooltip.classList.remove("stacked-1", "stacked-2");
      lagRadarTooltip.style.removeProperty("bottom");
      lagRadarTooltip.style.removeProperty("top");
    }
    if (domStatsTooltip && this.#pinnedOrder.includes("domStats")) {
      domStatsTooltip.classList.remove("stacked-1", "stacked-2");
      domStatsTooltip.style.removeProperty("bottom");
      domStatsTooltip.style.removeProperty("top");
    }

    // Check if toolbar is at top (affects positioning direction)
    const isTop = this.#toolbar?.classList.contains("corner-top") ?? false;

    // Apply stacking classes and dynamic positioning
    // Base gap from toolbar is 8px, gap between tooltips is also 8px
    const baseGap = 8;
    const tooltipGap = 8;
    let accumulatedOffset = baseGap; // Start with the base gap from toolbar

    this.#pinnedOrder.forEach((id, index) => {
      const stackClass = `stacked-${index + 1}`;
      let tooltip = null;

      if (id === "lagRadar" && lagRadarTooltip) {
        tooltip = lagRadarTooltip;
      } else if (id === "domStats" && domStatsTooltip) {
        tooltip = domStatsTooltip;
      }

      if (tooltip) {
        tooltip.classList.add(stackClass);

        // Set position for all tooltips (first uses base gap, subsequent stack on top)
        if (isTop) {
          tooltip.style.top = `calc(100% + ${accumulatedOffset}px)`;
        } else {
          tooltip.style.bottom = `calc(100% + ${accumulatedOffset}px)`;
        }

        // Accumulate height for next tooltip
        const tooltipHeight = tooltip.offsetHeight || CONFIG.dimensions.tooltipMinHeight;
        accumulatedOffset += tooltipHeight + tooltipGap;
      }
    });
  }

  /**
   * Pin lag radar tooltip.
   * @private
   */
  #pinLagRadar() {
    if (!this.#fpsMeterElement || !this.#lagRadarPanel) return;

    this.#lagRadarPanel.pin();
    this.#fpsMeterElement.classList.add("active");

    // Add to pinned order
    if (!this.#pinnedOrder.includes("lagRadar")) {
      this.#pinnedOrder.push("lagRadar");
    }

    // Update stacking
    this.#updateTooltipStacking();
  }

  /**
   * Unpin lag radar tooltip.
   * @private
   */
  #unpinLagRadar() {
    if (!this.#fpsMeterElement || !this.#lagRadarPanel) return;

    this.#lagRadarPanel.unpin();
    this.#fpsMeterElement.classList.remove("active");

    // Remove from pinned order
    this.#pinnedOrder = this.#pinnedOrder.filter((id) => id !== "lagRadar");

    // Update stacking for remaining pinned tooltips
    this.#updateTooltipStacking();
  }

  /**
   * Toggle lag radar pin state.
   * @private
   */
  #toggleLagRadarPin() {
    if (this.#lagRadarPanel?.isPinned) {
      this.#unpinLagRadar();
    } else {
      this.#pinLagRadar();
    }
  }

  /**
   * Create the memory meter.
   * @private
   */
  #createMemoryMeter() {
    const container = document.createElement("div");
    container.className = "devtools-meter";
    container.setAttribute("data-tooltip", "JS heap memory usage \n Detect memory leaks and excessive allocations");

    const value = document.createElement("span");
    value.className = "devtools-meter-value memory";
    value.textContent = "--";
    this.#memoryValueElement = value;

    const label = document.createElement("span");
    label.className = "devtools-meter-label";
    label.textContent = "MB";

    container.appendChild(value);
    container.appendChild(label);

    return container;
  }

  /**
   * Create the DOM tree button.
   * @private
   */
  #createDomStatsButton(): HTMLButtonElement {
    const btn = Elements.createDomStatsButton(() => {
      this.#toggleDomStatsPin(btn);
    });

    // Restore pinned state from storage
    if (StorageManager.isDomStatsPinned()) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.#pinDomStats(btn);
        });
      });
    }

    return btn;
  }

  /**
   * Pin DOM stats tooltip.
   * @private
   * @param {HTMLButtonElement} btn - The DOM stats button
   */
  #pinDomStats(btn: HTMLButtonElement): void {
    if (!this.#domStatsPanel) return;

    this.#domStatsPanel.pin();
    btn.classList.add("active");

    // Add to pinned order
    if (!this.#pinnedOrder.includes("domStats")) {
      this.#pinnedOrder.push("domStats");
    }

    // Update stacking
    this.#updateTooltipStacking();
  }

  /**
   * Unpin DOM stats tooltip.
   * @private
   * @param {HTMLButtonElement} btn - The DOM stats button
   */
  #unpinDomStats(btn: HTMLButtonElement): void {
    if (!this.#domStatsPanel) return;

    this.#domStatsPanel.unpin();
    btn.classList.remove("active");

    // Remove from pinned order
    this.#pinnedOrder = this.#pinnedOrder.filter((id) => id !== "domStats");

    // Update stacking for remaining pinned tooltips
    this.#updateTooltipStacking();
  }

  /**
   * Toggle DOM stats pin state.
   * @private
   * @param {HTMLButtonElement} btn - The DOM stats button
   */
  #toggleDomStatsPin(btn: HTMLButtonElement): void {
    if (this.#domStatsPanel?.isPinned) {
      this.#unpinDomStats(btn);
    } else {
      this.#pinDomStats(btn);
    }
  }



  /**
   * Initialize toolbar position.
   * @private
   */
  #initPosition(): void {
    if (!this.#toolbar || !this.#dragController) return;

    // Load collapsed state first
    const collapsedState = StorageManager.getCollapsedState();
    if (collapsedState) {
      this.#dragController.setCollapsed(collapsedState);
      this.#applyCollapsedState(collapsedState.corner, collapsedState.orientation);
      return;
    }

    // Load or calculate position
    const saved = StorageManager.getToolbarPosition();
    const rect = this.#toolbar.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    let corner = "bottom-right";
    if (saved?.corner) {
      corner = saved.corner;
    }

    // Calculate position for corner
    const safeArea = CONFIG.dimensions.safeArea;
    const rightX = window.innerWidth - width - safeArea;
    const bottomY = window.innerHeight - height - safeArea;

    let position;
    switch (corner) {
      case "top-left":
        position = { x: safeArea, y: safeArea };
        break;
      case "top-right":
        position = { x: rightX, y: safeArea };
        break;
      case "bottom-left":
        position = { x: safeArea, y: bottomY };
        break;
      case "bottom-right":
      default:
        position = { x: rightX, y: bottomY };
        break;
    }

    this.#dragController.setPosition(position, corner);
    this.#updateCornerClasses();
  }

  /**
   * Apply collapsed state to toolbar.
   * @private
   */
  #applyCollapsedState(corner: string, orientation: string): void {
    if (!this.#toolbar) return;

    // Hide content, show expand button
    if (this.#content) this.#content.style.display = "none";
    if (this.#expandButton) this.#expandButton.style.display = "flex";

    // Add collapsed classes
    this.#toolbar.classList.add("collapsed", `collapsed-${orientation}`);
    this.#toolbar.classList.remove("edge-left", "edge-right", "edge-top", "edge-bottom");

    // Add edge class
    if (orientation === "horizontal") {
      this.#toolbar.classList.add(corner.endsWith("left") ? "edge-left" : "edge-right");
    } else {
      this.#toolbar.classList.add(corner.startsWith("top") ? "edge-top" : "edge-bottom");
    }

    // Calculate collapsed position
    const collapsedSize = orientation === "horizontal"
      ? CONFIG.dimensions.collapsedHorizontal
      : CONFIG.dimensions.collapsedVertical;
    const safeArea = CONFIG.dimensions.safeArea;

    let position;
    switch (corner) {
      case "top-left":
        position = orientation === "horizontal"
          ? { x: -1, y: safeArea }
          : { x: safeArea, y: -1 };
        break;
      case "bottom-left":
        position = orientation === "horizontal"
          ? { x: -1, y: window.innerHeight - collapsedSize.height - safeArea }
          : { x: safeArea, y: window.innerHeight - collapsedSize.height + 1 };
        break;
      case "top-right":
        position = orientation === "horizontal"
          ? { x: window.innerWidth - collapsedSize.width + 1, y: safeArea }
          : { x: window.innerWidth - collapsedSize.width - safeArea, y: -1 };
        break;
      case "bottom-right":
      default:
        position = orientation === "horizontal"
          ? { x: window.innerWidth - collapsedSize.width + 1, y: window.innerHeight - collapsedSize.height - safeArea }
          : { x: window.innerWidth - collapsedSize.width - safeArea, y: window.innerHeight - collapsedSize.height + 1 };
        break;
    }

    this.#dragController?.setPosition(position, corner);
  }

  /**
   * Expand from collapsed state.
   * @private
   */
  #expandFromCollapsed(savedCorner: string): void {
    if (!this.#toolbar) return;

    this.#tooltipManager.suspend();
    this.#lagRadarTooltipManager.suspend();
    this.#domStatsTooltipManager.suspend();

    // Remove collapsed classes
    this.#toolbar.classList.remove("collapsed", "collapsed-horizontal", "collapsed-vertical");
    this.#toolbar.classList.remove("edge-left", "edge-right", "edge-top", "edge-bottom");

    // Show content, hide expand button
    if (this.#content) this.#content.style.display = "flex";
    if (this.#expandButton) this.#expandButton.style.display = "none";

    // Animate to corner position
    requestAnimationFrame(() => {
      if (!this.#toolbar || !this.#dragController) return;
      const rect = this.#toolbar.getBoundingClientRect();
      this.#dragController.snapToCorner(savedCorner, CONFIG.dimensions.toolbarWidth, rect.height || 40);
      StorageManager.setToolbarPosition(savedCorner, this.#dragController.position);
      StorageManager.setCollapsedState(null);
      this.#updateCornerClasses();

      // Resume tooltips after animation
      setTimeout(() => {
        this.#tooltipManager.resume();
        this.#lagRadarTooltipManager.resume();
        this.#domStatsTooltipManager.resume();
      }, 400);
    });
  }

  /**
   * Update corner-based CSS classes.
   * @private
   */
  #updateCornerClasses(): void {
    if (!this.#toolbar || !this.#dragController) return;

    const corner = this.#dragController.corner;
    const isTop = corner.startsWith("top");
    const isLeft = corner.endsWith("left");

    this.#toolbar.classList.toggle("corner-top", isTop);
    this.#toolbar.classList.toggle("corner-left", isLeft);
  }

  /**
   * Handle window resize.
   * @private
   */
  #handleResize(): void {
    if (!this.#toolbar || !this.#dragController) return;

    const collapsed = this.#dragController.collapsed;
    if (collapsed) {
      this.#applyCollapsedState(collapsed.corner, collapsed.orientation);
    } else {
      const rect = this.#toolbar.getBoundingClientRect();
      const corner = this.#dragController.corner;

      // Recalculate position for current corner
      const safeArea = CONFIG.dimensions.safeArea;
      const rightX = window.innerWidth - rect.width - safeArea;
      const bottomY = window.innerHeight - rect.height - safeArea;

      let position;
      switch (corner) {
        case "top-left":
          position = { x: safeArea, y: safeArea };
          break;
        case "top-right":
          position = { x: rightX, y: safeArea };
          break;
        case "bottom-left":
          position = { x: safeArea, y: bottomY };
          break;
        case "bottom-right":
        default:
          position = { x: rightX, y: bottomY };
          break;
      }

      this.#dragController.setPosition(position, corner);
    }
  }

  /**
   * Start FPS and memory display updates.
   * @private
   */
  #startDisplayUpdates(): void {
    this.#fpsMonitor.start();

    // FPS updates
    this.#fpsIntervalId = setInterval(() => {
      if (this.#fpsValueElement) {
        const fps = this.#fpsMonitor.getFPS();
        this.#fpsValueElement.textContent = String(fps);
        this.#fpsValueElement.style.color = this.#fpsMonitor.getColor();
      }
    }, CONFIG.intervals.fpsDisplay);

    // Memory updates
    this.#memoryIntervalId = setInterval(() => {
      if (this.#memoryValueElement) {
        const info = this.#memoryMonitor.getInfo();
        if (info) {
          this.#memoryValueElement.textContent = String(info.usedMB);
          this.#memoryValueElement.style.color = this.#memoryMonitor.getColor(info.percent);
        }
      }
    }, CONFIG.intervals.memoryDisplay);
  }

  /**
   * Stop display updates.
   * @private
   */
  #stopDisplayUpdates(): void {
    if (this.#fpsIntervalId) {
      clearInterval(this.#fpsIntervalId);
      this.#fpsIntervalId = null;
    }
    if (this.#memoryIntervalId) {
      clearInterval(this.#memoryIntervalId);
      this.#memoryIntervalId = null;
    }
  }
}

