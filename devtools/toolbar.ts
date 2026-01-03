// ============================================================================
// TOOLBAR
// ============================================================================
// Main toolbar UI that composes all other components.
// ============================================================================

import { CONFIG, ICONS, STYLES } from "./config";
import { StorageManager } from "./storage";
import { FPSMonitor, MemoryMonitor, LagRadar } from "./monitors";
import { TooltipManager, DragController } from "./ui";

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

  /** Scanning toggle checkbox (stored for potential future use) */
  // @ts-expect-error - stored for potential future use
  #scanningToggle: HTMLInputElement | null = null;

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

  // Interval IDs for display updates
  #fpsIntervalId: ReturnType<typeof setInterval> | null = null;
  #memoryIntervalId: ReturnType<typeof setInterval> | null = null;
  #domStatsIntervalId: ReturnType<typeof setInterval> | null = null;

  /** Previous DOM node counts for comparison */
  #prevDomCounts: Record<string, number> | null = null;

  /** Previous total DOM node count (stored for potential future use) */
  // @ts-expect-error - stored for potential future use
  #prevTotalNodes: number | null = null;

  /** Lag radar visualization */
  #lagRadar: LagRadar | null = null;

  /** FPS meter container element */
  #fpsMeterElement: HTMLDivElement | null = null;

  /** Whether lag radar is pinned */
  #lagRadarPinned = false;

  /** Whether DOM stats is pinned */
  #domStatsPinned = false;

  /** Order of pinned tooltips (first = closest to toolbar) */
  #pinnedOrder: Array<"lagRadar" | "domStats"> = [];

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
        // Don't resume tooltips yet - wait for snap animation
      },
      onPositionChange: (position, corner) => {
        StorageManager.setToolbarPosition(corner, position);
        this.#updateCornerClasses();
        // Recalculate pinned tooltip positions for new corner
        this.#updateTooltipStacking();
        // Resume tooltips after position change
        setTimeout(() => {
          this.#tooltipManager.resume();
          this.#lagRadarTooltipManager.resume();
          this.#domStatsTooltipManager.resume();
        }, 50);
      },
      onCollapse: (corner, orientation) => {
        this.#applyCollapsedState(corner, orientation);
        StorageManager.setCollapsedState({ corner, orientation });
      },
      onExpand: (corner) => {
        this.#expandFromCollapsed(corner);
      },
    });
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
    window.addEventListener("resize", () => this.#handleResize());

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

    // Cleanup lag radar
    if (this.#lagRadar) {
      this.#lagRadar.destroy();
      this.#lagRadar = null;
    }

    // Clear DOM stats interval
    if (this.#domStatsIntervalId) {
      clearInterval(this.#domStatsIntervalId);
      this.#domStatsIntervalId = null;
    }

    window.removeEventListener("resize", () => this.#handleResize());

    if (this.#root?.parentNode) {
      this.#root.parentNode.removeChild(this.#root);
    }

    this.#root = null;
    this.#shadowRoot = null;
    this.#toolbar = null;
    this.#content = null;
    this.#expandButton = null;
    this.#inspectButton = null;
    this.#scanningToggle = null;
    this.#fpsValueElement = null;
    this.#memoryValueElement = null;
    this.#fpsMeterElement = null;
  }

  /**
   * Update the inspect button state.
   * @param {boolean} isInspecting - Whether currently inspecting
   */
  updateInspectButton(isInspecting: boolean): void {
    if (!this.#inspectButton) return;

    this.#inspectButton.classList.toggle("active", isInspecting);
    this.#inspectButton.innerHTML = isInspecting ? (ICONS["close"] ?? "") : (ICONS["inspect"] ?? "");
    this.#inspectButton.setAttribute(
      "data-tooltip",
      isInspecting
        ? "Exit inspect mode — or press Esc"
        : "Inspect component (Ctrl+Shift+C) — click to jump to source code in your IDE"
    );
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
    const btn = document.createElement("button");
    btn.className = "devtools-expand-btn";
    btn.title = "Expand toolbar";
    btn.innerHTML = ICONS["chevronRight"] ?? "";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#dragController?.expand();
    });
    return btn;
  }

  /**
   * Create the inspect button.
   * @private
   */
  #createInspectButton(): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = "devtools-icon-btn";
    btn.setAttribute("data-tooltip", "Inspect component (Ctrl+Shift+C) \n Click to jump to source code in your IDE");
    btn.innerHTML = ICONS["inspect"] ?? "";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#onInspectToggle?.();
    });
    return btn;
  }

  /**
   * Create the scanning toggle.
   * @private
   */
  #createScanningToggle() {
    const toggle = document.createElement("label");
    toggle.className = "devtools-toggle";
    toggle.setAttribute("data-tooltip", "Highlight DOM mutations \n Detect unexpected re-renders");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = StorageManager.isScanningEnabled();
    checkbox.addEventListener("change", () => {
      this.#onScanningToggle?.(checkbox.checked);
      StorageManager.setScanningEnabled(checkbox.checked);
    });
    this.#scanningToggle = checkbox;

    const track = document.createElement("div");
    track.className = "devtools-toggle-track";

    const thumb = document.createElement("div");
    thumb.className = "devtools-toggle-thumb";
    track.appendChild(thumb);

    toggle.appendChild(checkbox);
    toggle.appendChild(track);

    return toggle;
  }

  /**
   * Create the FPS meter.
   * @private
   */
  #createFPSMeter() {
    const container = document.createElement("div");
    container.className = "devtools-meter clickable";
    container.setAttribute("data-tooltip", "Frames per second \n Click to show lag radar");

    const value = document.createElement("span");
    value.className = "devtools-meter-value";
    value.textContent = "60";
    this.#fpsValueElement = value;

    const label = document.createElement("span");
    label.className = "devtools-meter-label";
    label.textContent = "FPS";

    container.appendChild(value);
    container.appendChild(label);

    // Store reference for later use
    this.#fpsMeterElement = container;

    // Toggle radar on click
    container.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#toggleLagRadarPin();
    });

    // Restore pinned state from storage
    if (StorageManager.isLagRadarPinned()) {
      requestAnimationFrame(() => {
        this.#pinLagRadar();
      });
    }

    return container;
  }

  /**
   * Create the lag radar tooltip content.
   * @private
   * @returns {HTMLElement} Radar container element
   */
  #createLagRadarContent() {
    const container = document.createElement("div");
    container.className = "devtools-radar-container";

    // Create radar instance
    this.#lagRadar = new LagRadar(this.#fpsMonitor, {
      size: CONFIG.dimensions.radarSize,
    });
    const canvas = this.#lagRadar.create();
    container.appendChild(canvas);

    // Add legend
    const legend = document.createElement("div");
    legend.className = "devtools-radar-legend";
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
    `;
    container.appendChild(legend);

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
    if (!this.#fpsMeterElement) return;

    this.#lagRadarPinned = true;
    this.#fpsMeterElement.classList.add("active");
    StorageManager.setLagRadarPinned(true);

    // Add to pinned order
    if (!this.#pinnedOrder.includes("lagRadar")) {
      this.#pinnedOrder.push("lagRadar");
    }

    // Create radar content
    const radarContent = this.#createLagRadarContent();

    // Pin with radar DOM element using dedicated tooltip manager
    this.#lagRadarTooltipManager.pinElement(radarContent);

    // Update stacking
    this.#updateTooltipStacking();

    // Start radar animation
    this.#lagRadar?.start();
  }

  /**
   * Unpin lag radar tooltip.
   * @private
   */
  #unpinLagRadar() {
    if (!this.#fpsMeterElement) return;

    this.#lagRadarPinned = false;
    this.#fpsMeterElement.classList.remove("active");
    StorageManager.setLagRadarPinned(false);

    // Remove from pinned order
    this.#pinnedOrder = this.#pinnedOrder.filter((id) => id !== "lagRadar");

    // Unpin first to start the fade-out animation
    this.#lagRadarTooltipManager.unpin();

    // Update stacking for remaining pinned tooltips
    this.#updateTooltipStacking();

    // Destroy radar after fade-out animation completes
    // so the canvas doesn't disappear before the container fades
    if (this.#lagRadar) {
      const radar = this.#lagRadar;
      this.#lagRadar = null;
      setTimeout(() => {
        radar.destroy();
      }, CONFIG.animation.tooltipFadeMs);
    }
  }

  /**
   * Toggle lag radar pin state.
   * @private
   */
  #toggleLagRadarPin() {
    if (this.#lagRadarPinned) {
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
    const btn = document.createElement("button");
    btn.className = "devtools-icon-btn";
    btn.innerHTML = ICONS["domTree"] ?? "";
    btn.setAttribute("data-tooltip", "DOM statistics \n Click to pin");

    // Toggle pin on click
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#toggleDomStatsPin(btn);
    });

    // Restore pinned state from storage
    if (StorageManager.isDomStatsPinned()) {
      // Delay to ensure tooltip is ready and DOM is fully rendered
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
    this.#domStatsPinned = true;
    btn.classList.add("active");
    StorageManager.setDomStatsPinned(true);

    // Add to pinned order
    if (!this.#pinnedOrder.includes("domStats")) {
      this.#pinnedOrder.push("domStats");
    }

    // Create initial DOM stats element
    const statsElement = this.#createDomStatsElement();
    this.#domStatsTooltipManager.pinElement(statsElement);

    // Update stacking
    this.#updateTooltipStacking();

    // Update DOM stats every 500ms while pinned
    this.#domStatsIntervalId = setInterval(() => {
      this.#updateDomStatsElement(statsElement);
    }, 500);
  }

  /**
   * Unpin DOM stats tooltip.
   * @private
   * @param {HTMLButtonElement} btn - The DOM stats button
   */
  #unpinDomStats(btn: HTMLButtonElement): void {
    this.#domStatsPinned = false;
    this.#domStatsTooltipManager.unpin();
    btn.classList.remove("active");
    StorageManager.setDomStatsPinned(false);

    // Remove from pinned order
    this.#pinnedOrder = this.#pinnedOrder.filter((id) => id !== "domStats");

    if (this.#domStatsIntervalId) {
      clearInterval(this.#domStatsIntervalId);
      this.#domStatsIntervalId = null;
    }

    // Update stacking for remaining pinned tooltips
    this.#updateTooltipStacking();
  }

  /**
   * Toggle DOM stats pin state.
   * @private
   * @param {HTMLButtonElement} btn - The DOM stats button
   */
  #toggleDomStatsPin(btn: HTMLButtonElement): void {
    if (this.#domStatsPinned) {
      this.#unpinDomStats(btn);
    } else {
      this.#pinDomStats(btn);
    }
  }

  /**
   * Get current DOM statistics data.
   * @private
   * @returns {{ total: number, counts: Record<string, number>, sorted: [string, number][] }}
   */
  #getDOMStatsData(): { total: number; counts: Record<string, number>; sorted: [string, number][] } {
    const body = document.body;
    if (!body) return { total: 0, counts: {}, sorted: [] };

    const allNodes = body.querySelectorAll("*");
    const totalNodes = allNodes.length;
    const counts: Record<string, number> = {};

    for (const el of allNodes) {
      const tag = el.tagName.toLowerCase();
      counts[tag] = (counts[tag] || 0) + 1;
    }

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6) as [string, number][];

    return { total: totalNodes, counts, sorted };
  }

  /**
   * Create odometer HTML for a number with digit-by-digit animation.
   * @private
   * @param {number} newVal - Current value
   * @param {number|null} oldVal - Previous value (null if first render)
   * @returns {string} HTML string for odometer display
   */
  #createOdometerHtml(newVal: number, oldVal: number | null): string {
    const newStr = String(newVal);
    const oldStr = oldVal !== null ? String(oldVal) : newStr;

    // Determine overall direction for color pulse
    let direction = "";
    if (oldVal !== null) {
      if (newVal > oldVal) direction = "increasing";
      else if (newVal < oldVal) direction = "decreasing";
    }

    // Pad shorter string with leading spaces to match lengths
    const maxLen = Math.max(newStr.length, oldStr.length);
    const paddedNew = newStr.padStart(maxLen, " ");
    const paddedOld = oldStr.padStart(maxLen, " ");

    let digits = "";
    for (let i = 0; i < maxLen; i++) {
      const oldDigit = paddedOld[i] ?? " ";
      const newDigit = paddedNew[i] ?? " ";

      // Determine if this digit changed and in which direction
      let digitAnim = "";
      if (oldDigit !== newDigit && oldVal !== null) {
        const oldNum = oldDigit === " " ? -1 : parseInt(oldDigit, 10);
        const newNum = newDigit === " " ? -1 : parseInt(newDigit, 10);

        if (newNum > oldNum || (oldDigit === " " && newDigit !== " ")) {
          digitAnim = "roll-up";
        } else {
          digitAnim = "roll-down";
        }
      }

      if (digitAnim) {
        const displayOld = oldDigit === " " ? "&nbsp;" : oldDigit;
        const displayNew = newDigit === " " ? "&nbsp;" : newDigit;

        if (digitAnim === "roll-up") {
          digits += `<span class="odometer-digit"><span class="odometer-digit-inner ${digitAnim}"><span class="odometer-digit-old">${displayOld}</span><span class="odometer-digit-new">${displayNew}</span></span></span>`;
        } else {
          digits += `<span class="odometer-digit"><span class="odometer-digit-inner ${digitAnim}"><span class="odometer-digit-new">${displayNew}</span><span class="odometer-digit-old">${displayOld}</span></span></span>`;
        }
      } else {
        const displayDigit = newDigit === " " ? "" : newDigit;
        digits += `<span class="odometer-digit"><span class="odometer-digit-inner"><span class="odometer-digit-new">${displayDigit}</span></span></span>`;
      }
    }

    return `<span class="odometer ${direction}">${digits}</span>`;
  }

  /**
   * Create the DOM stats visual element.
   * @private
   * @returns {HTMLElement}
   */
  #createDomStatsElement(): HTMLElement {
    const { total, sorted } = this.#getDOMStatsData();
    const maxCount = sorted.length > 0 ? (sorted[0]?.[1] ?? 1) : 1;

    const container = document.createElement("div");
    container.className = "devtools-dom-stats";

    // Header with total
    const header = document.createElement("div");
    header.className = "devtools-dom-stats-header";

    const totalEl = document.createElement("span");
    totalEl.className = "devtools-dom-stats-total";
    totalEl.innerHTML = this.#createOdometerHtml(total, null);
    totalEl.dataset["value"] = String(total);

    const labelEl = document.createElement("span");
    labelEl.className = "devtools-dom-stats-label";
    labelEl.textContent = "DOM Nodes";

    header.appendChild(totalEl);
    header.appendChild(labelEl);
    container.appendChild(header);

    // Bar chart
    const chart = document.createElement("div");
    chart.className = "devtools-dom-stats-chart";

    for (const [tag, count] of sorted) {
      const row = document.createElement("div");
      row.className = "devtools-dom-stats-row";
      row.dataset["tag"] = tag;

      const tagEl = document.createElement("span");
      tagEl.className = "devtools-dom-stats-tag";
      tagEl.textContent = tag;

      const barContainer = document.createElement("div");
      barContainer.className = "devtools-dom-stats-bar-container";

      const bar = document.createElement("div");
      bar.className = "devtools-dom-stats-bar";
      bar.style.width = `${(count / maxCount) * 100}%`;
      bar.dataset["count"] = String(count);

      const countEl = document.createElement("span");
      countEl.className = "devtools-dom-stats-count";
      countEl.textContent = count.toLocaleString();

      barContainer.appendChild(bar);
      barContainer.appendChild(countEl);
      row.appendChild(tagEl);
      row.appendChild(barContainer);
      chart.appendChild(row);
    }

    container.appendChild(chart);

    // Store previous values for animation
    this.#prevTotalNodes = total;
    this.#prevDomCounts = Object.fromEntries(sorted);

    return container;
  }

  /**
   * Update the DOM stats element with new data.
   * @private
   * @param {HTMLElement} container
   */
  #updateDomStatsElement(container: HTMLElement): void {
    const { total, sorted } = this.#getDOMStatsData();
    const maxCount = sorted.length > 0 ? (sorted[0]?.[1] ?? 1) : 1;

    // Update total with odometer animation
    const totalEl = container.querySelector(".devtools-dom-stats-total") as HTMLElement | null;
    if (totalEl) {
      const prevTotal = parseInt(totalEl.dataset["value"] ?? "0", 10) || 0;
      if (total !== prevTotal) {
        totalEl.innerHTML = this.#createOdometerHtml(total, prevTotal);
        totalEl.dataset["value"] = String(total);
      }
    }

    // Update bars
    const chart = container.querySelector(".devtools-dom-stats-chart");
    if (!chart) return;

    const rows = chart.querySelectorAll(".devtools-dom-stats-row");

    // Update each row in place
    sorted.forEach(([tag, count], index) => {
      const row = rows[index] as HTMLElement | undefined;
      if (!row) return;

      const prevCount = this.#prevDomCounts?.[tag] ?? count;
      const hasChanged = count !== prevCount;

      // Update tag name if different
      const tagEl = row.querySelector(".devtools-dom-stats-tag");
      if (tagEl && tagEl.textContent !== tag) {
        tagEl.textContent = tag;
      }
      row.dataset["tag"] = tag;

      // Update bar
      const bar = row.querySelector(".devtools-dom-stats-bar") as HTMLElement | null;
      if (bar) {
        bar.style.width = `${(count / maxCount) * 100}%`;

        // Only animate on actual count change
        if (hasChanged) {
          bar.classList.remove("increasing", "decreasing");
          void bar.offsetWidth; // Force reflow
          bar.classList.add(count > prevCount ? "increasing" : "decreasing");
        }
        bar.dataset["count"] = String(count);
      }

      // Update count text
      const countEl = row.querySelector(".devtools-dom-stats-count");
      if (countEl) {
        countEl.textContent = count.toLocaleString();
      }
    });

    // Store for next comparison
    this.#prevTotalNodes = total;
    this.#prevDomCounts = Object.fromEntries(sorted);
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

