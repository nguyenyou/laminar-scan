// ============================================================================
// CORE FEATURES
// ============================================================================
// Main devtools functionality: mutation scanning and component inspection.
// ============================================================================

import { CONFIG } from "./00-config";
import { getScalaComponent, getComponentSourceInfo, openInIDE } from "./01-utilities";
import { HighlightCanvas, InspectOverlay } from "./04-canvas";
import { getReactComponentFromNode } from "./01-react-inspector";

/**
 * Observes DOM mutations and visualizes them with animated highlights.
 * Helps identify unexpected re-renders and DOM changes.
 */
export class MutationScanner {
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

    // Try Scala source first, then React component, then fall back to tag name
    let name = getScalaSource(element);
    let isReact = false;
    
    if (!name) {
      const reactComponent = getReactComponentFromNode(element);
      if (reactComponent) {
        name = reactComponent.name;
        isReact = true;
      }
    }
    name = name || element.tagName.toLowerCase();
    
    this.#canvas.highlight(element, name, { isReact });
  }
}

/**
 * Manages the component inspection mode.
 * Allows users to hover over components and click to open source in IDE.
 */
export class ComponentInspector {
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
    // Safety check: prevent duplicate event catchers in DOM
    const existing = document.querySelector(`[${CONFIG.attributes.devtools}="event-catcher"]`);
    if (existing) {
      console.warn("Devtools: Event catcher already exists in DOM, reusing");
      return existing;
    }

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

    // Try Scala component first, then fall back to React
    let component = getScalaComponent(element);
    let info = null;
    
    if (component) {
      info = getComponentSourceInfo(component.element);
    } else {
      // Try React component
      component = getReactComponent(element);
      if (component) {
        info = getReactComponentSourceInfo(component.element);
      }
    }
    
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

    // Try Scala component first
    const scalaComponent = getScalaComponent(element);
    if (scalaComponent) {
      const info = getComponentSourceInfo(scalaComponent.element);
      if (info?.sourcePath) {
        openInIDE(info.sourcePath, info.sourceLine);
        // Exit inspect mode after jumping to source
        this.stop();
        return;
      }
    }
    
    // Try React component
    const reactComponent = getReactComponent(element);
    if (reactComponent) {
      const info = getReactComponentSourceInfo(reactComponent.element);
      
      // If source path available (component name looks like a file path), jump to source
      if (info?.sourcePath) {
        openInIDE(info.sourcePath, info.sourceLine);
        this.stop();
        return;
      }
      
      // Otherwise log React component info to console
      console.group(`%c⚛ React Component: ${reactComponent.name}`, 'color: #61dafb; font-weight: bold;');
      console.log('Element:', reactComponent.element);
      if (info?.props) {
        console.log('Props:', info.props);
      }
      if (info?.fiber) {
        console.log('Fiber:', info.fiber);
      }
      // Also log the full component hierarchy
      const hierarchy = getAllReactComponentsFromNode(reactComponent.element);
      if (hierarchy.length > 1) {
        console.log('Component hierarchy:', hierarchy.map(c => c.name).join(' → '));
      }
      console.groupEnd();
      
      // Exit inspect mode after logging
      this.stop();
      return;
    }
    
    console.warn("Devtools: No component found for element");
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

