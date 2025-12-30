// ============================================================================
// CORE FEATURES
// ============================================================================
// Main devtools functionality: mutation scanning and component inspection.
// ============================================================================

/**
 * Observes DOM mutations and visualizes them with animated highlights.
 * Helps identify unexpected re-renders and DOM changes.
 */
class MutationScanner {
  /** @type {MutationObserver | null} */
  #observer = null;

  /** @type {HighlightCanvas | null} */
  #canvas = null;

  /** @type {boolean} */
  #running = false;

  /** @type {boolean} Whether scanning is paused (e.g., during drag) */
  #paused = false;

  /** @type {Function | null} Callback when scanning state changes */
  #onStateChange = null;

  /**
   * Create a new MutationScanner.
   * @param {{ onStateChange?: (running: boolean) => void }} [options] - Options
   */
  constructor(options = {}) {
    this.#onStateChange = options.onStateChange || null;
  }

  /**
   * Check if the scanner is currently running.
   * @returns {boolean} True if running
   */
  get isRunning() {
    return this.#running;
  }

  /**
   * Start observing DOM mutations.
   */
  start() {
    if (this.#running) return;
    this.#running = true;

    this.#canvas = new HighlightCanvas();
    this.#canvas.create();

    this.#observer = new MutationObserver((mutations) => this.#handleMutations(mutations));
    this.#observer.observe(document.body, {
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    });

    this.#onStateChange?.(true);
  }

  /**
   * Stop observing DOM mutations.
   */
  stop() {
    if (!this.#running) return;
    this.#running = false;

    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }

    if (this.#canvas) {
      this.#canvas.destroy();
      this.#canvas = null;
    }

    this.#onStateChange?.(false);
  }

  /**
   * Toggle scanning on/off.
   */
  toggle() {
    if (this.#running) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Pause scanning temporarily (useful during drag operations).
   */
  pause() {
    this.#paused = true;
    this.#canvas?.pause();
  }

  /**
   * Resume scanning after a pause.
   */
  resume() {
    this.#paused = false;
    this.#canvas?.resume();
  }

  /**
   * Handle mutation records.
   * @private
   * @param {MutationRecord[]} mutations - Mutation records
   */
  #handleMutations(mutations) {
    if (!this.#running || this.#paused) return;

    for (const record of mutations) {
      const target =
        record.target.nodeType === Node.ELEMENT_NODE
          ? record.target
          : record.target.parentElement;

      // Skip devtools elements
      if (!target || isDevtoolsElement(target)) continue;

      this.#highlightElement(target);

      // Highlight added nodes
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && !isDevtoolsElement(node)) {
          this.#highlightElement(node);
        }
      }
    }
  }

  /**
   * Highlight an element with the canvas.
   * @private
   * @param {Element} element - Element to highlight
   */
  #highlightElement(element) {
    if (!this.#canvas) return;
    if (!element.isConnected) return;

    const name = getScalaSource(element) || element.tagName.toLowerCase();
    this.#canvas.highlight(element, name);
  }
}

/**
 * Manages the component inspection mode.
 * Allows users to hover over components and click to open source in IDE.
 */
class ComponentInspector {
  /** @type {'off' | 'inspecting'} */
  #state = "off";

  /** @type {InspectOverlay | null} */
  #overlay = null;

  /** @type {HTMLDivElement | null} Event catcher element */
  #eventCatcher = null;

  /** @type {Element | null} Last hovered element */
  #lastHovered = null;

  /** @type {Function | null} Callback when state changes */
  #onStateChange = null;

  // Bound event handlers for proper removal
  #boundHandlePointerMove = null;
  #boundHandleClick = null;
  #boundHandleKeydown = null;

  /**
   * Create a new ComponentInspector.
   * @param {{ onStateChange?: (inspecting: boolean) => void }} [options] - Options
   */
  constructor(options = {}) {
    this.#onStateChange = options.onStateChange || null;
    this.#boundHandlePointerMove = this.#handlePointerMove.bind(this);
    this.#boundHandleClick = this.#handleClick.bind(this);
    this.#boundHandleKeydown = this.#handleKeydown.bind(this);
  }

  /**
   * Check if currently inspecting.
   * @returns {boolean} True if inspecting
   */
  get isInspecting() {
    return this.#state === "inspecting";
  }

  /**
   * Start inspection mode.
   */
  start() {
    if (this.#state !== "off") return;
    this.#state = "inspecting";

    // Create overlay
    this.#overlay = new InspectOverlay();
    const canvas = this.#overlay.create();
    document.body.appendChild(canvas);

    // Create event catcher
    this.#eventCatcher = this.#createEventCatcher();
    document.body.appendChild(this.#eventCatcher);

    // Show with animation
    requestAnimationFrame(() => {
      this.#overlay?.show();
      if (this.#eventCatcher) {
        this.#eventCatcher.style.pointerEvents = "auto";
      }
    });

    // Add event listeners
    document.addEventListener("pointermove", this.#boundHandlePointerMove, {
      passive: true,
      capture: true,
    });
    document.addEventListener("click", this.#boundHandleClick, { capture: true });
    document.addEventListener("keydown", this.#boundHandleKeydown);

    this.#onStateChange?.(true);
  }

  /**
   * Stop inspection mode.
   */
  stop() {
    if (this.#state === "off") return;
    this.#state = "off";

    // Remove event listeners
    document.removeEventListener("pointermove", this.#boundHandlePointerMove, { capture: true });
    document.removeEventListener("click", this.#boundHandleClick, { capture: true });
    document.removeEventListener("keydown", this.#boundHandleKeydown);

    // Cleanup
    this.#lastHovered = null;

    if (this.#overlay) {
      this.#overlay.destroy();
      this.#overlay = null;
    }

    if (this.#eventCatcher?.parentNode) {
      this.#eventCatcher.parentNode.removeChild(this.#eventCatcher);
    }
    this.#eventCatcher = null;

    this.#onStateChange?.(false);
  }

  /**
   * Toggle inspection mode.
   */
  toggle() {
    if (this.#state === "off") {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * Create the event catcher element.
   * @private
   * @returns {HTMLDivElement} Event catcher element
   */
  #createEventCatcher() {
    const div = document.createElement("div");
    div.setAttribute(CONFIG.attributes.devtools, "event-catcher");
    Object.assign(div.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      pointerEvents: "none",
      zIndex: "2147483645",
      cursor: "crosshair",
    });
    return div;
  }

  /**
   * Handle pointer move during inspection.
   * @private
   * @param {PointerEvent} e - Pointer event
   */
  #handlePointerMove(e) {
    if (this.#state !== "inspecting") return;

    // Clear stale reference if previously hovered element is disconnected
    if (this.#lastHovered && !this.#lastHovered.isConnected) {
      this.#lastHovered = null;
      this.#overlay?.clear();
    }

    // Temporarily disable event catcher to find element underneath
    this.#eventCatcher.style.pointerEvents = "none";
    const element = document.elementFromPoint(e.clientX, e.clientY);
    this.#eventCatcher.style.pointerEvents = "auto";

    if (!element) return;

    const component = getScalaComponent(element);
    if (!component) {
      if (this.#lastHovered) {
        this.#lastHovered = null;
        this.#overlay?.clear();
      }
      return;
    }

    if (component.element === this.#lastHovered) return;
    this.#lastHovered = component.element;

    const rect = component.element.getBoundingClientRect();
    const info = getComponentSourceInfo(component.element);

    this.#overlay?.animateTo(
      { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      component.name,
      info
    );
  }

  /**
   * Handle click during inspection.
   * @private
   * @param {MouseEvent} e - Click event
   */
  #handleClick(e) {
    if (this.#state !== "inspecting") return;

    // Allow clicks on devtools elements to pass through
    if (isDevtoolsElement(e.target) && e.target !== this.#eventCatcher) return;

    e.preventDefault();
    e.stopPropagation();

    // Find element under click
    this.#eventCatcher.style.pointerEvents = "none";
    const element = document.elementFromPoint(e.clientX, e.clientY);
    this.#eventCatcher.style.pointerEvents = "auto";

    if (!element) return;

    const component = getScalaComponent(element);
    if (!component) return;

    // Open file in IDE
    const info = getComponentSourceInfo(component.element);
    if (info?.sourcePath) {
      openInIDE(info.sourcePath, info.sourceLine);
      // Exit inspect mode after jumping to source
      this.stop();
    } else {
      console.warn("FrontendDevtools: No source path found for element");
    }
  }

  /**
   * Handle keydown during inspection.
   * @private
   * @param {KeyboardEvent} e - Keyboard event
   */
  #handleKeydown(e) {
    if (e.key === "Escape" && this.#state === "inspecting") {
      this.stop();
    }
  }
}

