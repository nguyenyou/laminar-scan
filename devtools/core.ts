// ============================================================================
// CORE FEATURES
// ============================================================================
// Main devtools functionality: mutation scanning and component inspection.
// ============================================================================

import { CONFIG } from "./config";
import { getScalaComponent, getComponentSourceInfo, openInIDE, isDevtoolsElement, getScalaSource } from "./utilities";
import { HighlightCanvas, InspectOverlay } from "./canvas";
import { getReactComponentFromNode, getReactComponent, getReactComponentSourceInfo, getAllReactComponentsFromNode } from "./react-inspector";

interface ScannerOptions {
  onStateChange?: (running: boolean) => void;
}

/**
 * Observes DOM mutations and visualizes them with animated highlights.
 * Helps identify unexpected re-renders and DOM changes.
 */
export class MutationScanner {
  #observer: MutationObserver | null = null;
  #canvas: HighlightCanvas | null = null;
  #running = false;
  #paused = false;
  #onStateChange: ((running: boolean) => void) | null = null;

  /**
   * Create a new MutationScanner.
   */
  constructor(options: ScannerOptions = {}) {
    this.#onStateChange = options.onStateChange ?? null;
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
   */
  #handleMutations(mutations: MutationRecord[]): void {
    if (!this.#running || this.#paused) return;

    for (const record of mutations) {
      const target =
        record.target.nodeType === Node.ELEMENT_NODE
          ? (record.target as Element)
          : record.target.parentElement;

      // Skip devtools elements
      if (!target || isDevtoolsElement(target)) continue;

      this.#highlightElement(target);

      // Highlight added nodes
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && !isDevtoolsElement(node as Element)) {
          this.#highlightElement(node as Element);
        }
      }
    }
  }

  /**
   * Highlight an element with the canvas.
   */
  #highlightElement(element: Element): void {
    if (!this.#canvas) return;
    if (!element.isConnected) return;

    // Try Scala source first, then React component, then fall back to tag name
    let name: string | null = getScalaSource(element);
    let isReact = false;

    if (!name) {
      const reactComponent = getReactComponentFromNode(element);
      if (reactComponent) {
        name = reactComponent.name;
        isReact = true;
      }
    }
    const displayName = name ?? element.tagName.toLowerCase();

    this.#canvas.highlight(element, displayName, { isReact });
  }
}

interface InspectorOptions {
  onStateChange?: (inspecting: boolean) => void;
}

/**
 * Manages the component inspection mode.
 * Allows users to hover over components and click to open source in IDE.
 */
export class ComponentInspector {
  #state: "off" | "inspecting" = "off";
  #overlay: InspectOverlay | null = null;
  #eventCatcher: HTMLDivElement | null = null;
  #lastHovered: Element | null = null;
  #onStateChange: ((inspecting: boolean) => void) | null = null;

  // Bound event handlers for proper removal
  #boundHandlePointerMove: (e: PointerEvent) => void;
  #boundHandleClick: (e: MouseEvent) => void;
  #boundHandleKeydown: (e: KeyboardEvent) => void;

  /**
   * Create a new ComponentInspector.
   */
  constructor(options: InspectorOptions = {}) {
    this.#onStateChange = options.onStateChange ?? null;
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
   */
  #createEventCatcher(): HTMLDivElement {
    // Safety check: prevent duplicate event catchers in DOM
    const existing = document.querySelector(`[${CONFIG.attributes.devtools}="event-catcher"]`) as HTMLDivElement | null;
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
   */
  #handlePointerMove(e: PointerEvent): void {
    if (this.#state !== "inspecting") return;

    // Clear stale reference if previously hovered element is disconnected
    if (this.#lastHovered && !this.#lastHovered.isConnected) {
      this.#lastHovered = null;
      this.#overlay?.clear();
    }

    if (!this.#eventCatcher) return;

    // Temporarily disable event catcher to find element underneath
    this.#eventCatcher.style.pointerEvents = "none";
    const element = document.elementFromPoint(e.clientX, e.clientY);
    this.#eventCatcher.style.pointerEvents = "auto";

    if (!element) return;

    // Try Scala component first, then fall back to React
    let component = getScalaComponent(element);
    let info: { isMarked?: boolean; isReact?: boolean } | null = null;

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
      component.name ?? "Unknown",
      info ?? {}
    );
  }

  /**
   * Handle click during inspection.
   */
  #handleClick(e: MouseEvent): void {
    if (this.#state !== "inspecting") return;

    // Allow clicks on devtools elements to pass through
    if (isDevtoolsElement(e.target as Element) && e.target !== this.#eventCatcher) return;

    e.preventDefault();
    e.stopPropagation();

    if (!this.#eventCatcher) return;

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
   */
  #handleKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape" && this.#state === "inspecting") {
      this.stop();
    }
  }
}

