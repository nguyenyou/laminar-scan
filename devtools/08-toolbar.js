// ============================================================================
// TOOLBAR
// ============================================================================
// Main toolbar UI that composes all other components.
// ============================================================================

/**
 * Main devtools toolbar component.
 * Composes FPSMonitor, MemoryMonitor, TooltipManager, and DragController.
 */
class Toolbar {
  /** @type {HTMLDivElement | null} Root container element */
  #root = null;

  /** @type {ShadowRoot | null} Shadow DOM root */
  #shadowRoot = null;

  /** @type {HTMLDivElement | null} Toolbar element */
  #toolbar = null;

  /** @type {HTMLDivElement | null} Content container (hidden when collapsed) */
  #content = null;

  /** @type {HTMLButtonElement | null} Expand button (shown when collapsed) */
  #expandButton = null;

  /** @type {HTMLButtonElement | null} Inspect button */
  #inspectButton = null;

  /** @type {HTMLInputElement | null} Scanning toggle checkbox */
  #scanningToggle = null;

  /** @type {HTMLSpanElement | null} FPS value display */
  #fpsValueElement = null;

  /** @type {HTMLSpanElement | null} Memory value display */
  #memoryValueElement = null;

  // Composed components
  /** @type {FPSMonitor} */
  #fpsMonitor = new FPSMonitor();

  /** @type {MemoryMonitor} */
  #memoryMonitor = new MemoryMonitor();

  /** @type {TooltipManager} */
  #tooltipManager = new TooltipManager();

  /** @type {DragController} */
  #dragController = null;

  // Interval IDs for display updates
  /** @type {number | null} */
  #fpsIntervalId = null;

  /** @type {number | null} */
  #memoryIntervalId = null;

  /** @type {number | null} */
  #domStatsIntervalId = null;

  // Callbacks
  /** @type {((enabled: boolean) => void) | null} */
  #onScanningToggle = null;

  /** @type {(() => void) | null} */
  #onInspectToggle = null;

  // State flags
  /** @type {boolean} */
  #isExpanding = false;

  /** @type {boolean} */
  #isSnapping = false;

  /**
   * Create a new Toolbar.
   * @param {Object} options - Configuration options
   * @param {(enabled: boolean) => void} [options.onScanningToggle] - Called when scanning toggle changes
   * @param {() => void} [options.onInspectToggle] - Called when inspect button clicked
   */
  constructor(options = {}) {
    this.#onScanningToggle = options.onScanningToggle || null;
    this.#onInspectToggle = options.onInspectToggle || null;

    // Initialize drag controller with callbacks
    this.#dragController = new DragController({
      onDragStart: () => {
        this.#tooltipManager.disable();
        this.#fpsMonitor.pause();
        this.#stopDisplayUpdates();
      },
      onDragEnd: () => {
        this.#fpsMonitor.resume();
        this.#startDisplayUpdates();
        // Don't re-enable tooltips yet - wait for snap animation
      },
      onPositionChange: (position, corner) => {
        StorageManager.setToolbarPosition(corner, position);
        this.#updateCornerClasses();
        // Re-enable tooltips after position change
        setTimeout(() => this.#tooltipManager.enable(), 50);
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
    this.#dragController?.destroy();

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
  }

  /**
   * Update the inspect button state.
   * @param {boolean} isInspecting - Whether currently inspecting
   */
  updateInspectButton(isInspecting) {
    if (!this.#inspectButton) return;

    this.#inspectButton.classList.toggle("active", isInspecting);
    this.#inspectButton.innerHTML = isInspecting ? ICONS.close : ICONS.inspect;
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
  #createToolbar() {
    const toolbar = document.createElement("div");
    toolbar.className = "devtools-toolbar";

    // Initialize drag controller
    this.#dragController.init(toolbar);

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

    // Add help button
    const helpBtn = this.#createHelpButton();
    this.#content.appendChild(helpBtn);

    toolbar.appendChild(this.#content);

    // Create and add tooltip
    const { container: tooltip } = this.#tooltipManager.create();
    toolbar.appendChild(tooltip);

    // Setup tooltip events
    this.#tooltipManager.setupEvents(toolbar);

    return toolbar;
  }

  /**
   * Create the expand button.
   * @private
   */
  #createExpandButton() {
    const btn = document.createElement("button");
    btn.className = "devtools-expand-btn";
    btn.title = "Expand toolbar";
    btn.innerHTML = ICONS.chevronRight;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#dragController.expand();
    });
    return btn;
  }

  /**
   * Create the inspect button.
   * @private
   */
  #createInspectButton() {
    const btn = document.createElement("button");
    btn.className = "devtools-icon-btn";
    btn.setAttribute("data-tooltip", "Inspect component (Ctrl+Shift+C) \n Click to jump to source code in your IDE");
    btn.innerHTML = ICONS.inspect;
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
    container.className = "devtools-meter";
    container.setAttribute("data-tooltip", "Frames per second \n Detect long-running scripts blocking the main thread");

    const value = document.createElement("span");
    value.className = "devtools-meter-value";
    value.textContent = "60";
    this.#fpsValueElement = value;

    const label = document.createElement("span");
    label.className = "devtools-meter-label";
    label.textContent = "FPS";

    container.appendChild(value);
    container.appendChild(label);

    return container;
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
  #createHelpButton() {
    const btn = document.createElement("button");
    btn.className = "devtools-icon-btn";
    btn.innerHTML = ICONS.domTree;

    // Update tooltip with DOM stats on mouseenter
    btn.addEventListener("mouseenter", () => {
      const stats = this.#getDOMStats();
      btn.setAttribute("data-tooltip", stats);
    });

    // Toggle pin on click
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.#tooltipManager.isPinned()) {
        // Unpin and stop interval
        this.#tooltipManager.unpin();
        btn.classList.remove("active");
        if (this.#domStatsIntervalId) {
          clearInterval(this.#domStatsIntervalId);
          this.#domStatsIntervalId = null;
        }
      } else {
        // Pin and start interval update
        const stats = this.#getDOMStats();
        btn.setAttribute("data-tooltip", stats);
        this.#tooltipManager.pin(stats);
        btn.classList.add("active");

        // Update DOM stats every 500ms while pinned
        this.#domStatsIntervalId = setInterval(() => {
          const updatedStats = this.#getDOMStats();
          btn.setAttribute("data-tooltip", updatedStats);
          this.#tooltipManager.updatePinnedContent(updatedStats);
        }, 500);
      }
    });

    // Set initial tooltip
    btn.setAttribute("data-tooltip", "Click to pin DOM statistics");
    return btn;
  }

  /**
   * Get DOM node statistics.
   * @private
   * @returns {string} Formatted DOM statistics string
   */
  #getDOMStats() {
    const body = document.body;
    if (!body) return "DOM not ready";

    // Count all nodes
    const allNodes = body.querySelectorAll("*");
    const totalNodes = allNodes.length;

    // Count specific element types
    const counts = {};

    for (const el of allNodes) {
      const tag = el.tagName.toLowerCase();
      counts[tag] = (counts[tag] || 0) + 1;
    }

    // Build tooltip string
    let tooltip = `DOM Nodes: ${totalNodes}\n`;

    // Sort by count descending and show top elements
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    if (sorted.length > 0) {
      tooltip += sorted.map(([tag, count]) => `${tag}: ${count}`).join(" | ");
    }

    return tooltip;
  }

  /**
   * Initialize toolbar position.
   * @private
   */
  #initPosition() {
    if (!this.#toolbar) return;

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
  #applyCollapsedState(corner, orientation) {
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

    this.#dragController.setPosition(position, corner);
  }

  /**
   * Expand from collapsed state.
   * @private
   */
  #expandFromCollapsed(savedCorner) {
    if (!this.#toolbar) return;

    this.#isExpanding = true;
    this.#tooltipManager.disable();

    // Remove collapsed classes
    this.#toolbar.classList.remove("collapsed", "collapsed-horizontal", "collapsed-vertical");
    this.#toolbar.classList.remove("edge-left", "edge-right", "edge-top", "edge-bottom");

    // Show content, hide expand button
    if (this.#content) this.#content.style.display = "flex";
    if (this.#expandButton) this.#expandButton.style.display = "none";

    // Animate to corner position
    requestAnimationFrame(() => {
      const rect = this.#toolbar.getBoundingClientRect();
      this.#dragController.snapToCorner(savedCorner, CONFIG.dimensions.toolbarWidth, rect.height || 40);
      StorageManager.setToolbarPosition(savedCorner, this.#dragController.position);
      StorageManager.setCollapsedState(null);
      this.#updateCornerClasses();

      // Re-enable tooltips after animation
      setTimeout(() => {
        this.#isExpanding = false;
        this.#tooltipManager.enable();
      }, 400);
    });
  }

  /**
   * Update corner-based CSS classes.
   * @private
   */
  #updateCornerClasses() {
    if (!this.#toolbar) return;

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
  #handleResize() {
    if (!this.#toolbar) return;

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
  #startDisplayUpdates() {
    this.#fpsMonitor.start();

    // FPS updates
    this.#fpsIntervalId = setInterval(() => {
      if (this.#fpsValueElement) {
        const fps = this.#fpsMonitor.getFPS();
        this.#fpsValueElement.textContent = fps;
        this.#fpsValueElement.style.color = this.#fpsMonitor.getColor();
      }
    }, CONFIG.intervals.fpsDisplay);

    // Memory updates
    this.#memoryIntervalId = setInterval(() => {
      if (this.#memoryValueElement) {
        const info = this.#memoryMonitor.getInfo();
        if (info) {
          this.#memoryValueElement.textContent = info.usedMB;
          this.#memoryValueElement.style.color = this.#memoryMonitor.getColor(info.percent);
        }
      }
    }, CONFIG.intervals.memoryDisplay);
  }

  /**
   * Stop display updates.
   * @private
   */
  #stopDisplayUpdates() {
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

