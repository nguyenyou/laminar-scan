(function () {
  "use strict";

// ============================================================================
// CONFIGURATION
// ============================================================================
// All magic values, constants, and static assets centralized here.
// ============================================================================

/**
 * Central configuration object for all devtools settings.
 * Modify these values to customize behavior without hunting through code.
 */
const CONFIG = {
  /** Primary brand color used for highlights and UI accents */
  colors: {
    primary: { r: 115, g: 97, b: 230 },
    // FPS meter colors
    fpsGood: "rgb(214,132,245)",
    fpsWarning: "#F59E0B",
    fpsCritical: "#EF4444",
    // Memory meter colors
    memoryHealthy: "#6EE7B7",
    memoryWarning: "#F59E0B",
    memoryCritical: "#EF4444",
    // Inspector colors (normal components)
    inspectStroke: "rgba(142, 97, 227, 0.5)",
    inspectFill: "rgba(173, 97, 230, 0.10)",
    inspectPillBg: "rgba(37, 37, 38, 0.75)",
    inspectPillText: "white",
    // Inspector colors (marked components)
    inspectMarkedStroke: "rgba(79, 192, 255, 0.6)",
    inspectMarkedFill: "rgba(79, 192, 255, 0.10)",
    inspectMarkedPillBg: "rgba(20, 60, 80, 0.85)",
    inspectMarkedPillText: "#79c0ff",
    // Inspector colors (React components)
    inspectReactStroke: "rgba(97, 218, 251, 0.6)",
    inspectReactFill: "rgba(97, 218, 251, 0.10)",
    inspectReactPillBg: "rgba(20, 44, 52, 0.90)",
    inspectReactPillText: "#61dafb",
  },

  /** Animation timing and behavior */
  animation: {
    totalFrames: 45,
    interpolationSpeed: 0.51,
    snapTransitionMs: 300,
    tooltipFadeMs: 200,
    tooltipSlideMs: 120,
  },

  /** UI dimensions in pixels */
  dimensions: {
    toolbarWidth: 284,
    tooltipMinHeight: 92,
    safeArea: 16,
    collapsedHorizontal: { width: 20, height: 48 },
    collapsedVertical: { width: 48, height: 20 },
  },

  /** Threshold values for various interactions */
  thresholds: {
    dragStart: 5,
    snapDistance: 60,
    collapseRatio: 0.5,
    expandDragDistance: 50,
    fpsWarning: 50,
    fpsCritical: 30,
    memoryWarning: 60,
    memoryCritical: 80,
  },

  /** Update intervals in milliseconds */
  intervals: {
    fpsDisplay: 200,
    memoryDisplay: 1000,
    resizeDebounce: 100,
  },

  /** Data attribute names for DOM elements */
  attributes: {
    scalaComponent: "data-scala",
    devtools: "data-frontend-devtools",
  },

  /** Element property names for Scala source info */
  properties: {
    sourcePath: "__scalasourcepath",
    sourceLine: "__scalasourceline",
    filename: "__scalafilename",
    name: "__scalaname",
    markAsComponent: "__markascomponent",
  },

  /** localStorage keys for persistence */
  storageKeys: {
    position: "FRONTEND_DEVTOOLS_POSITION",
    collapsed: "FRONTEND_DEVTOOLS_COLLAPSED",
    enabled: "FRONTEND_DEVTOOLS_ENABLED",
    scanning: "FRONTEND_DEVTOOLS_SCANNING",
  },

  /** Font settings */
  fonts: {
    mono: "11px Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace",
    ui: "system-ui, -apple-system, sans-serif",
  },
};

/**
 * SVG icon definitions used throughout the UI.
 */
const ICONS = {
  /** Inspect mode cursor icon */
  inspect: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/>
    <path d="M5 3a2 2 0 0 0-2 2"/>
    <path d="M19 3a2 2 0 0 1 2 2"/>
    <path d="M5 21a2 2 0 0 1-2-2"/>
    <path d="M9 3h1"/>
    <path d="M9 21h2"/>
    <path d="M14 3h1"/>
    <path d="M3 9v1"/>
    <path d="M21 9v2"/>
    <path d="M3 14v1"/>
  </svg>`,

  /** Close/exit icon */
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 6L6 18"/>
    <path d="M6 6l12 12"/>
  </svg>`,

  /** Chevron for expand/collapse */
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>`,

  /** Help/question mark icon */
  help: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <path d="M12 17h.01"/>
  </svg>`,
};

/**
 * CSS styles for the toolbar and its components.
 * Injected into Shadow DOM for style isolation.
 */
const STYLES = `
  /* ===== Toolbar Container ===== */
  .devtools-toolbar {
    position: fixed;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #000;
    border-radius: 8px;
    font-family: ${CONFIG.fonts.ui};
    font-size: 13px;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 2147483646;
    user-select: none;
    cursor: grab;
    touch-action: none;
    width: ${CONFIG.dimensions.toolbarWidth}px;
    box-sizing: border-box;
    will-change: transform;
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
  }

  .devtools-toolbar.dragging {
    cursor: grabbing;
    transition: none !important;
  }

  /* ===== Toggle Switch ===== */
  .devtools-toggle {
    position: relative;
    width: 36px;
    height: 20px;
    cursor: pointer;
    display: inline-flex;
  }

  .devtools-toggle input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
    z-index: 1;
    margin: 0;
  }

  .devtools-toggle-track {
    position: absolute;
    inset: 0;
    background: #525252;
    border-radius: 9999px;
    transition: background-color 0.2s;
  }

  .devtools-toggle input:checked + .devtools-toggle-track {
    background: #7361e6;
  }

  .devtools-toggle-thumb {
    position: absolute;
    top: 50%;
    left: 2px;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 9999px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    transition: left 0.2s ease;
  }

  .devtools-toggle input:checked + .devtools-toggle-track .devtools-toggle-thumb {
    left: calc(100% - 18px);
  }

  /* ===== Meter Displays (FPS/Memory) ===== */
  .devtools-meter {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    height: 24px;
    border-radius: 6px;
    font-family: ui-monospace, monospace;
    background: #141414;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
  }

  .devtools-meter-value {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.025em;
    transition: color 0.15s ease-in-out;
    min-width: 24px;
    text-align: center;
  }

  .devtools-meter-value.memory {
    min-width: 38px;
    text-align: right;
  }

  .devtools-meter-label {
    color: rgba(255,255,255,0.3);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.025em;
  }

  /* ===== Icon Buttons ===== */
  .devtools-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: #999;
    transition: color 0.15s, background 0.15s;
  }

  .devtools-icon-btn:hover {
    background: rgba(255,255,255,0.1);
  }

  .devtools-icon-btn:focus {
    outline: none;
  }

  .devtools-icon-btn.active {
    color: #8e61e3;
  }

  .devtools-icon-btn svg {
    width: 16px;
    height: 16px;
  }

  /* ===== Tooltip ===== */
  .devtools-tooltip {
    position: absolute;
    left: 0;
    bottom: calc(100% + 8px);
    width: ${CONFIG.dimensions.toolbarWidth}px;
    min-height: ${CONFIG.dimensions.tooltipMinHeight}px;
    padding: 12px;
    background: rgba(35, 35, 38, 0.98);
    color: #f0f0f0;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.4;
    text-align: left;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08);
    box-sizing: border-box;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.2s ease-out, visibility 0.2s ease-out;
    z-index: 10;
    overflow: hidden;
  }

  .devtools-tooltip.visible {
    opacity: 1;
    visibility: visible;
  }

  .devtools-tooltip-content {
    white-space: pre-line;
    will-change: transform, opacity;
  }

  .devtools-toolbar.corner-top .devtools-tooltip {
    bottom: auto;
    top: calc(100% + 8px);
  }

  /* ===== Collapsed State ===== */
  .devtools-toolbar.collapsed {
    width: auto;
    height: auto;
    padding: 0;
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .devtools-toolbar.collapsed.collapsed-horizontal {
    width: ${CONFIG.dimensions.collapsedHorizontal.width}px;
    height: ${CONFIG.dimensions.collapsedHorizontal.height}px;
  }

  .devtools-toolbar.collapsed.collapsed-vertical {
    width: ${CONFIG.dimensions.collapsedVertical.width}px;
    height: ${CONFIG.dimensions.collapsedVertical.height}px;
  }

  .devtools-toolbar.collapsed.edge-left {
    border-radius: 0 8px 8px 0;
  }

  .devtools-toolbar.collapsed.edge-right {
    border-radius: 8px 0 0 8px;
  }

  .devtools-toolbar.collapsed.edge-top {
    border-radius: 0 0 8px 8px;
  }

  .devtools-toolbar.collapsed.edge-bottom {
    border-radius: 8px 8px 0 0;
  }

  .devtools-expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #fff;
    padding: 0;
  }

  .devtools-expand-btn svg {
    width: 16px;
    height: 16px;
    transition: transform 0.15s ease;
  }

  .devtools-toolbar.collapsed.edge-right .devtools-expand-btn svg {
    transform: rotate(180deg);
  }

  .devtools-toolbar.collapsed.edge-top .devtools-expand-btn svg {
    transform: rotate(90deg);
  }

  .devtools-toolbar.collapsed.edge-bottom .devtools-expand-btn svg {
    transform: rotate(-90deg);
  }

  .devtools-toolbar.collapsed .devtools-tooltip {
    display: none;
  }
`;


// ============================================================================
// REACT INSPECTOR UTILITIES
// ============================================================================
// Utilities for inspecting React components from DOM nodes.
// Based on React's internal implementation.
// @see packages/react-dom-bindings/src/client/ReactDOMComponentTree.js
// @see packages/shared/getComponentNameFromType.js
// @see packages/react-reconciler/src/getComponentNameFromFiber.js
// ============================================================================

/**
 * Get the React fiber attached to a DOM node.
 * React attaches fibers using '__reactFiber$' + randomKey
 * 
 * @param {Element} domNode - DOM node to inspect
 * @returns {object | null} React fiber or null
 */
function getReactFiber(domNode) {
  if (!domNode) return null;
  
  // React attaches fiber with: '__reactFiber$' + randomKey
  // Container roots use: '__reactContainer$' + randomKey
  const key = Object.keys(domNode).find(
    k => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$')
  );
  
  return key ? domNode[key] : null;
}

/**
 * Get the React props attached to a DOM node.
 * React attaches props using '__reactProps$' + randomKey
 * 
 * @param {Element} domNode - DOM node to inspect
 * @returns {object | null} React props or null
 */
function getReactProps(domNode) {
  if (!domNode) return null;
  
  const key = Object.keys(domNode).find(k => k.startsWith('__reactProps$'));
  return key ? domNode[key] : null;
}

/**
 * Get component name from a React type.
 * Mirrors: packages/shared/getComponentNameFromType.js
 * 
 * @param {*} type - React component type
 * @returns {string | null} Component name or null
 */
function getComponentNameFromType(type) {
  if (type == null) return null;
  
  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }
  
  if (typeof type === 'string') {
    return type; // Host component like 'div'
  }
  
  if (typeof type === 'object') {
    const $$typeof = type.$$typeof;
    if (!$$typeof) return null;
    
    const typeStr = $$typeof.toString();
    
    // ForwardRef
    if (typeStr === 'Symbol(react.forward_ref)') {
      const displayName = type.displayName;
      if (displayName) return displayName;
      const innerName = type.render?.displayName || type.render?.name || '';
      return innerName ? `ForwardRef(${innerName})` : 'ForwardRef';
    }
    
    // Memo
    if (typeStr === 'Symbol(react.memo)') {
      return type.displayName || getComponentNameFromType(type.type) || 'Memo';
    }
    
    // Lazy
    if (typeStr === 'Symbol(react.lazy)') {
      try {
        return getComponentNameFromType(type._init(type._payload));
      } catch {
        return null;
      }
    }
    
    // Context
    if (typeStr === 'Symbol(react.context)') {
      return (type.displayName || 'Context') + '.Provider';
    }
    
    if (typeStr === 'Symbol(react.consumer)') {
      return (type._context?.displayName || 'Context') + '.Consumer';
    }
  }
  
  return null;
}

/**
 * Get component name from a React fiber.
 * Mirrors: packages/react-reconciler/src/getComponentNameFromFiber.js
 * 
 * @param {object} fiber - React fiber
 * @returns {string | null} Component name or null
 */
function getComponentNameFromFiber(fiber) {
  if (!fiber) return null;
  
  const { type } = fiber;
  
  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }
  
  if (typeof type === 'string') {
    return type; // DOM element like 'div'
  }
  
  if (typeof type === 'object' && type !== null) {
    return getComponentNameFromType(type);
  }
  
  return null;
}

/**
 * Get the nearest React component info for a DOM node.
 * Traverses up the fiber tree to find actual React components (skipping host components).
 * 
 * @param {Element} domNode - DOM node to inspect
 * @returns {{ name: string, fiber: object, props: object, element: Element } | null} Component info or null
 */
function getReactComponentFromNode(domNode) {
  const fiber = getReactFiber(domNode);
  if (!fiber) return null;
  
  let current = fiber;
  while (current) {
    const name = getComponentNameFromFiber(current);
    
    // Skip host components (DOM elements like 'div', 'span')
    if (name && typeof current.type !== 'string') {
      return {
        name,
        fiber: current,
        props: current.memoizedProps,
        element: domNode, // The DOM node we started from
      };
    }
    
    current = current.return;
  }
  
  return null;
}

/**
 * Get all React components in the fiber tree for a DOM node.
 * Useful for getting the full component hierarchy.
 * 
 * @param {Element} domNode - DOM node to inspect
 * @returns {Array<{ name: string, fiber: object, props: object }>} Array of component info
 */
function getAllReactComponentsFromNode(domNode) {
  const fiber = getReactFiber(domNode);
  if (!fiber) return [];
  
  const components = [];
  let current = fiber;
  
  while (current) {
    const name = getComponentNameFromFiber(current);
    
    if (name && typeof current.type !== 'string') {
      components.push({
        name,
        fiber: current,
        props: current.memoizedProps,
      });
    }
    
    current = current.return;
  }
  
  return components;
}

/**
 * Get React component info in a format compatible with the inspector.
 * @param {Element} element - DOM element to inspect
 * @returns {{ element: Element, name: string, isReact: true } | null} Component info or null
 */
function getReactComponent(element) {
  if (!element) return null;
  
  const reactInfo = getReactComponentFromNode(element);
  if (!reactInfo) return null;
  
  return {
    element: reactInfo.element,
    name: reactInfo.name,
    isReact: true,
  };
}

/**
 * Get source info for a React component (limited compared to Scala).
 * React components don't have built-in source mapping in production.
 * 
 * @param {Element} element - DOM element
 * @returns {Object} Source information object
 */
function getReactComponentSourceInfo(element) {
  const reactInfo = getReactComponentFromNode(element);
  if (!reactInfo) return null;
  
  return {
    sourcePath: null, // React doesn't expose source paths in production
    sourceLine: null,
    filename: null,
    scalaName: null,
    isMarked: false,
    isReact: true,
    displayName: reactInfo.name,
    props: reactInfo.props,
    fiber: reactInfo.fiber,
  };
}



// ============================================================================
// UTILITIES
// ============================================================================
// Pure helper functions with no side effects or dependencies.
// ============================================================================

/**
 * Linear interpolation between two values.
 * @param {number} start - Starting value
 * @param {number} end - Target value
 * @param {number} [speed] - Interpolation factor (0-1), defaults to CONFIG.animation.interpolationSpeed
 * @returns {number} Interpolated value
 */
function lerp(start, end, speed = CONFIG.animation.interpolationSpeed) {
  return start + (end - start) * speed;
}

/**
 * Clamp a value between min and max bounds.
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Create a debounced version of a function.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function with cancel() method
 */
function debounce(fn, delay) {
  let timeoutId = null;

  const debounced = (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Get device pixel ratio, minimum 1.
 * @returns {number} Device pixel ratio
 */
function getDevicePixelRatio() {
  return Math.max(window.devicePixelRatio, 1);
}

/**
 * Check if an element is part of the devtools UI.
 * @param {Element} element - Element to check
 * @returns {boolean} True if element is a devtools element
 */
function isDevtoolsElement(element) {
  if (!element) return false;
  const attr = CONFIG.attributes.devtools;
  return element.hasAttribute(attr) || element.closest(`[${attr}]`) !== null;
}

/**
 * Get Scala component info from an element or its ancestors.
 * @param {Element} element - Starting element
 * @returns {{ element: Element, name: string } | null} Component info or null
 */
function getScalaComponent(element) {
  if (!element) return null;
  const attr = CONFIG.attributes.scalaComponent;
  const closest = element.closest(`[${attr}]`);
  if (!closest) return null;
  return {
    element: closest,
    name: closest.getAttribute(attr),
  };
}

/**
 * Get the Scala source attribute value from an element or its ancestors.
 * @param {Node} node - Starting node
 * @returns {string | null} Scala source identifier or null
 */
function getScalaSource(node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (!element) return null;

  const attr = CONFIG.attributes.scalaComponent;
  const value = element.getAttribute(attr);
  if (value) return value;

  const closest = element.closest(`[${attr}]`);
  return closest ? closest.getAttribute(attr) : null;
}

/**
 * Extract all source information from a Scala component element.
 * @param {Element} element - Component element
 * @returns {Object} Source information object
 */
function getComponentSourceInfo(element) {
  if (!element) return null;

  const props = CONFIG.properties;
  return {
    sourcePath: element[props.sourcePath] || null,
    sourceLine: element[props.sourceLine] !== undefined
      ? String(element[props.sourceLine])
      : null,
    filename: element[props.filename] || null,
    scalaName: element[props.name] || null,
    isMarked: element[props.markAsComponent] === "true",
    displayName: element.getAttribute(CONFIG.attributes.scalaComponent),
  };
}

/**
 * Open a file in the IDE using the IDEA protocol.
 * @param {string} sourcePath - File path to open
 * @param {string | null} [sourceLine] - Optional line number
 */
function openInIDE(sourcePath, sourceLine = null) {
  if (!sourcePath) {
    console.warn("Devtools: No source path provided");
    return;
  }

  let uri = `idea://open?file=${sourcePath}`;
  if (sourceLine) {
    uri += `&line=${sourceLine}`;
  }

  console.log("Devtools: Opening file in IDE:", uri);
  window.open(uri, "_blank");
}


// ============================================================================
// STORAGE MANAGER
// ============================================================================
// Centralized localStorage operations with error handling.
// ============================================================================

/**
 * Manages persistent storage operations with graceful error handling.
 * All localStorage access goes through this class.
 */
class StorageManager {
  /**
   * Get a value from localStorage.
   * @param {string} key - Storage key
   * @param {*} [defaultValue=null] - Default value if key doesn't exist or on error
   * @returns {*} Parsed value or default
   */
  static get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Get a raw string value from localStorage.
   * @param {string} key - Storage key
   * @param {string} [defaultValue=''] - Default value if key doesn't exist
   * @returns {string} Raw string value
   */
  static getString(key, defaultValue = "") {
    try {
      return localStorage.getItem(key) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Set a value in localStorage.
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be JSON serialized)
   * @returns {boolean} True if successful
   */
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set a raw string value in localStorage.
   * @param {string} key - Storage key
   * @param {string} value - String value to store
   * @returns {boolean} True if successful
   */
  static setString(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove a key from localStorage.
   * @param {string} key - Storage key to remove
   * @returns {boolean} True if successful
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if devtools is enabled.
   * @returns {boolean} True if enabled
   */
  static isDevtoolsEnabled() {
    return this.getString(CONFIG.storageKeys.enabled) === "true";
  }

  /**
   * Check if mutation scanning is enabled.
   * @returns {boolean} True if scanning is enabled
   */
  static isScanningEnabled() {
    return this.getString(CONFIG.storageKeys.scanning) === "true";
  }

  /**
   * Save scanning enabled state.
   * @param {boolean} enabled - Whether scanning is enabled
   */
  static setScanningEnabled(enabled) {
    this.setString(CONFIG.storageKeys.scanning, enabled ? "true" : "false");
  }

  /**
   * Get saved toolbar position.
   * @returns {{ corner: string, position: { x: number, y: number } } | null}
   */
  static getToolbarPosition() {
    return this.get(CONFIG.storageKeys.position, null);
  }

  /**
   * Save toolbar position.
   * @param {string} corner - Corner identifier
   * @param {{ x: number, y: number }} position - Position coordinates
   */
  static setToolbarPosition(corner, position) {
    this.set(CONFIG.storageKeys.position, { corner, position });
  }

  /**
   * Get saved collapsed state.
   * @returns {{ corner: string, orientation: string } | null}
   */
  static getCollapsedState() {
    return this.get(CONFIG.storageKeys.collapsed, null);
  }

  /**
   * Save collapsed state.
   * @param {{ corner: string, orientation: string } | null} state - Collapsed state or null
   */
  static setCollapsedState(state) {
    this.set(CONFIG.storageKeys.collapsed, state);
  }
}


// ============================================================================
// PERFORMANCE MONITORS
// ============================================================================
// FPS and Memory monitoring with encapsulated state.
// ============================================================================

/**
 * Monitors frame rate using requestAnimationFrame.
 * Provides real-time FPS tracking with pause/resume capability.
 */
class FPSMonitor {
  /** @type {number} Current FPS value */
  #fps = 0;

  /** @type {number} Frame count since last measurement */
  #frameCount = 0;

  /** @type {number} Timestamp of last FPS calculation */
  #lastTime = 0;

  /** @type {number | null} RAF ID for the monitoring loop */
  #animationId = null;

  /** @type {boolean} Whether monitoring is paused */
  #paused = false;

  /** @type {boolean} Whether monitor has been initialized */
  #initialized = false;

  /**
   * Start or resume FPS monitoring.
   * Automatically starts the RAF loop if not paused.
   */
  start() {
    if (this.#initialized && !this.#paused) return;

    this.#initialized = true;
    this.#paused = false;
    this.#lastTime = performance.now();
    this.#frameCount = 0;

    if (!this.#animationId) {
      this.#animationId = requestAnimationFrame(() => this.#tick());
    }
  }

  /**
   * Stop FPS monitoring completely.
   * Resets all state.
   */
  stop() {
    this.#cancelAnimation();
    this.#fps = 0;
    this.#frameCount = 0;
    this.#lastTime = 0;
    this.#initialized = false;
    this.#paused = false;
  }

  /**
   * Pause FPS monitoring temporarily.
   * Use resume() to continue. Useful during drag operations.
   */
  pause() {
    this.#paused = true;
    this.#cancelAnimation();
  }

  /**
   * Resume FPS monitoring after a pause.
   */
  resume() {
    if (!this.#paused || !this.#initialized) return;

    this.#paused = false;
    this.#lastTime = performance.now();
    this.#frameCount = 0;

    if (!this.#animationId) {
      this.#animationId = requestAnimationFrame(() => this.#tick());
    }
  }

  /**
   * Get the current FPS value.
   * Automatically starts monitoring if not already running.
   * @returns {number} Current frames per second
   */
  getFPS() {
    if (!this.#initialized) {
      this.start();
      return 60; // Default until first measurement
    }
    return this.#fps;
  }

  /**
   * Get the appropriate color for the current FPS value.
   * @returns {string} CSS color string
   */
  getColor() {
    return this.#getColorForFPS(this.#fps);
  }

  /**
   * Get color for a specific FPS value.
   * @param {number} fps - FPS value to get color for
   * @returns {string} CSS color string
   */
  #getColorForFPS(fps) {
    const { fpsCritical, fpsWarning } = CONFIG.thresholds;
    const { fpsCritical: criticalColor, fpsWarning: warningColor, fpsGood: goodColor } = CONFIG.colors;

    if (fps < fpsCritical) return criticalColor;
    if (fps < fpsWarning) return warningColor;
    return goodColor;
  }

  /**
   * Internal RAF tick function.
   * @private
   */
  #tick() {
    if (this.#paused) {
      this.#animationId = null;
      return;
    }

    this.#frameCount++;
    const now = performance.now();

    if (now - this.#lastTime >= 1000) {
      this.#fps = this.#frameCount;
      this.#frameCount = 0;
      this.#lastTime = now;
    }

    this.#animationId = requestAnimationFrame(() => this.#tick());
  }

  /**
   * Cancel the animation frame.
   * @private
   */
  #cancelAnimation() {
    if (this.#animationId) {
      cancelAnimationFrame(this.#animationId);
      this.#animationId = null;
    }
  }
}

/**
 * Monitors JavaScript heap memory usage.
 * Only available in Chromium-based browsers via performance.memory API.
 */
class MemoryMonitor {
  /**
   * Check if memory monitoring is supported in this browser.
   * @returns {boolean} True if performance.memory API is available
   */
  static isSupported() {
    return !!(
      performance.memory &&
      typeof performance.memory.usedJSHeapSize === "number"
    );
  }

  /**
   * Get current memory usage information.
   * @returns {{ usedMB: number, totalMB: number, limitMB: number, percent: number } | null}
   */
  getInfo() {
    const memory = performance.memory;
    if (!memory || typeof memory.usedJSHeapSize !== "number") {
      return null;
    }

    const bytesToMB = (bytes) => Math.round(bytes / (1024 * 1024));

    const usedMB = bytesToMB(memory.usedJSHeapSize);
    const totalMB = bytesToMB(memory.totalJSHeapSize);
    const limitMB = bytesToMB(memory.jsHeapSizeLimit);
    const percent = Math.round(
      (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    );

    return { usedMB, totalMB, limitMB, percent };
  }

  /**
   * Get the appropriate color for a memory usage percentage.
   * @param {number} percent - Memory usage percentage
   * @returns {string} CSS color string
   */
  getColor(percent) {
    const { memoryCritical, memoryWarning } = CONFIG.thresholds;
    const {
      memoryCritical: criticalColor,
      memoryWarning: warningColor,
      memoryHealthy: healthyColor,
    } = CONFIG.colors;

    if (percent > memoryCritical) return criticalColor;
    if (percent > memoryWarning) return warningColor;
    return healthyColor;
  }
}


// ============================================================================
// CANVAS RENDERING
// ============================================================================
// Canvas management for mutation highlights and component inspection overlays.
// ============================================================================

/**
 * Manages the canvas used for rendering mutation highlights.
 * Handles creation, resizing, and drawing of highlight rectangles.
 */
class HighlightCanvas {
  /** @type {HTMLCanvasElement | null} */
  #canvas = null;

  /** @type {CanvasRenderingContext2D | null} */
  #ctx = null;

  /** @type {number | null} RAF ID for animation loop */
  #animationId = null;

  /** @type {Map<Element, HighlightData>} Active highlight animations */
  #highlights = new Map();

  /** @type {Function | null} Debounced resize handler */
  #resizeHandler = null;

  /**
   * Create and mount the highlight canvas.
   * @returns {HTMLCanvasElement} The created canvas element
   */
  create() {
    if (this.#canvas) return this.#canvas;

    // Safety check: prevent duplicate highlight canvases in DOM
    const existing = document.querySelector(`[${CONFIG.attributes.devtools}="highlight-canvas"]`);
    if (existing) {
      console.warn("Devtools: Highlight canvas already exists in DOM, reusing");
      this.#canvas = existing;
      this.#ctx = existing.getContext("2d");
      return existing;
    }

    const canvas = document.createElement("canvas");
    canvas.setAttribute(CONFIG.attributes.devtools, "highlight-canvas");

    const dpr = getDevicePixelRatio();
    Object.assign(canvas.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: `${window.innerWidth}px`,
      height: `${window.innerHeight}px`,
      pointerEvents: "none",
      zIndex: "2147483647",
    });

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    document.body.appendChild(canvas);

    this.#canvas = canvas;
    this.#ctx = canvas.getContext("2d");
    this.#ctx.scale(dpr, dpr);

    // Setup resize handler
    this.#resizeHandler = debounce(() => this.#handleResize(), CONFIG.intervals.resizeDebounce);
    window.addEventListener("resize", this.#resizeHandler);

    return canvas;
  }

  /**
   * Destroy the canvas and cleanup resources.
   */
  destroy() {
    this.#stopAnimation();
    this.#highlights.clear();

    if (this.#resizeHandler) {
      this.#resizeHandler.cancel();
      window.removeEventListener("resize", this.#resizeHandler);
      this.#resizeHandler = null;
    }

    if (this.#canvas?.parentNode) {
      this.#canvas.parentNode.removeChild(this.#canvas);
    }

    this.#canvas = null;
    this.#ctx = null;
  }

  /**
   * Add or update a highlight for an element.
   * @param {Element} element - Element to highlight
   * @param {string} name - Display name for the highlight
   * @param {{ isReact?: boolean }} [options] - Additional options
   */
  highlight(element, name, options = {}) {
    if (!this.#canvas || !element.isConnected) return;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const isReact = options.isReact || false;

    const existing = this.#highlights.get(element);
    if (existing) {
      // Update existing highlight
      existing.targetX = rect.left;
      existing.targetY = rect.top;
      existing.targetWidth = rect.width;
      existing.targetHeight = rect.height;
      existing.frame = 0;
      existing.count++;
      existing.isReact = isReact;
    } else {
      // Create new highlight
      this.#highlights.set(element, {
        name,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        targetX: rect.left,
        targetY: rect.top,
        targetWidth: rect.width,
        targetHeight: rect.height,
        frame: 0,
        count: 1,
        isReact,
      });
    }

    this.#startAnimation();
  }

  /**
   * Clear all highlights.
   */
  clear() {
    this.#highlights.clear();
    this.#clearCanvas();
  }

  /**
   * Pause the animation loop (useful during drag).
   */
  pause() {
    this.#stopAnimation();
  }

  /**
   * Resume the animation loop.
   */
  resume() {
    if (this.#highlights.size > 0) {
      this.#startAnimation();
    }
  }

  /**
   * Start the animation loop if not already running.
   * @private
   */
  #startAnimation() {
    if (this.#animationId) return;

    // Sweep stale entries before starting
    this.#sweepStale();
    this.#animationId = requestAnimationFrame(() => this.#draw());
  }

  /**
   * Stop the animation loop.
   * @private
   */
  #stopAnimation() {
    if (this.#animationId) {
      cancelAnimationFrame(this.#animationId);
      this.#animationId = null;
    }
  }

  /**
   * Remove highlights for disconnected elements.
   * @private
   */
  #sweepStale() {
    for (const [element] of this.#highlights) {
      if (!element.isConnected) {
        this.#highlights.delete(element);
      }
    }
  }

  /**
   * Clear the canvas.
   * @private
   */
  #clearCanvas() {
    if (!this.#ctx || !this.#canvas) return;
    const dpr = getDevicePixelRatio();
    this.#ctx.clearRect(0, 0, this.#canvas.width / dpr, this.#canvas.height / dpr);
  }

  /**
   * Main draw loop.
   * @private
   */
  #draw() {
    if (!this.#ctx || !this.#canvas) return;

    this.#clearCanvas();

    const toRemove = [];
    const labelMap = new Map();
    const { r, g, b } = CONFIG.colors.primary;
    // React color (cyan): rgb(97, 218, 251)
    const reactColor = { r: 97, g: 218, b: 251 };
    const totalFrames = CONFIG.animation.totalFrames;

    // Draw all highlights
    for (const [element, highlight] of this.#highlights) {
      // Remove disconnected elements
      if (!element.isConnected) {
        toRemove.push(element);
        continue;
      }

      // Interpolate position
      highlight.x = lerp(highlight.x, highlight.targetX);
      highlight.y = lerp(highlight.y, highlight.targetY);
      highlight.width = lerp(highlight.width, highlight.targetWidth);
      highlight.height = lerp(highlight.height, highlight.targetHeight);

      const alpha = 1.0 - highlight.frame / totalFrames;
      highlight.frame++;

      if (highlight.frame > totalFrames) {
        toRemove.push(element);
        continue;
      }

      // Select color based on component type
      const color = highlight.isReact ? reactColor : { r, g, b };

      // Draw outline
      this.#ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
      this.#ctx.lineWidth = 1;
      this.#ctx.beginPath();
      this.#ctx.rect(highlight.x, highlight.y, highlight.width, highlight.height);
      this.#ctx.stroke();

      // Draw fill
      this.#ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.1})`;
      this.#ctx.fill();

      // Aggregate labels at same position (keep isReact flag)
      const labelKey = `${highlight.x},${highlight.y}`;
      const existing = labelMap.get(labelKey);
      if (!existing) {
        labelMap.set(labelKey, { ...highlight, alpha });
      } else {
        existing.count += highlight.count;
        if (alpha > existing.alpha) existing.alpha = alpha;
      }
    }

    // Draw labels
    this.#ctx.font = CONFIG.fonts.mono;
    for (const [, { x, y, name, count, alpha, isReact }] of labelMap) {
      // Select color based on component type
      const color = isReact ? reactColor : { r, g, b };
      
      // Add React icon prefix for React components
      const displayName = isReact ? `⚛ ${name}` : name;
      const labelText = count > 1 ? `${displayName} ×${count}` : displayName;
      const textWidth = this.#ctx.measureText(labelText).width;
      const textHeight = 11;
      const padding = 2;

      let labelY = y - textHeight - padding * 2;
      if (labelY < 0) labelY = 0;

      this.#ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
      this.#ctx.fillRect(x, labelY, textWidth + padding * 2, textHeight + padding * 2);

      this.#ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      this.#ctx.fillText(labelText, x + padding, labelY + textHeight + padding - 2);
    }

    // Remove completed highlights
    for (const element of toRemove) {
      this.#highlights.delete(element);
    }

    // Continue animation if there are active highlights
    if (this.#highlights.size > 0) {
      this.#animationId = requestAnimationFrame(() => this.#draw());
    } else {
      this.#animationId = null;
    }
  }

  /**
   * Handle window resize.
   * @private
   */
  #handleResize() {
    if (!this.#canvas || !this.#ctx) return;

    const dpr = getDevicePixelRatio();
    this.#canvas.style.width = `${window.innerWidth}px`;
    this.#canvas.style.height = `${window.innerHeight}px`;
    this.#canvas.width = window.innerWidth * dpr;
    this.#canvas.height = window.innerHeight * dpr;
    this.#ctx.scale(dpr, dpr);
  }
}

/**
 * Manages the overlay canvas used during component inspection.
 * Draws animated highlight rectangles and component name labels.
 */
class InspectOverlay {
  /** @type {HTMLCanvasElement | null} */
  #canvas = null;

  /** @type {CanvasRenderingContext2D | null} */
  #ctx = null;

  /** @type {{ left: number, top: number, width: number, height: number } | null} */
  #currentRect = null;

  /** @type {number | null} RAF ID for animation */
  #animationId = null;

  /** @type {number | null} Timeout ID for canvas removal */
  #removeTimeoutId = null;

  /**
   * Create and mount the inspect overlay canvas.
   * @returns {HTMLCanvasElement} The created canvas
   */
  create() {
    if (this.#canvas) return this.#canvas;

    // Safety check: prevent duplicate inspect canvases in DOM
    const existing = document.querySelector(`[${CONFIG.attributes.devtools}="inspect-canvas"]`);
    if (existing) {
      console.warn("Devtools: Inspect canvas already exists in DOM, reusing");
      this.#canvas = existing;
      this.#ctx = existing.getContext("2d");
      return existing;
    }

    const canvas = document.createElement("canvas");
    canvas.setAttribute(CONFIG.attributes.devtools, "inspect-canvas");

    const dpr = getDevicePixelRatio();
    Object.assign(canvas.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: `${window.innerWidth}px`,
      height: `${window.innerHeight}px`,
      pointerEvents: "none",
      zIndex: "2147483646",
      opacity: "0",
      transition: "opacity 0.15s ease-in-out",
    });

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    this.#canvas = canvas;
    this.#ctx = canvas.getContext("2d");
    this.#ctx.scale(dpr, dpr);

    return canvas;
  }

  /**
   * Show the overlay with a fade-in animation.
   */
  show() {
    if (this.#canvas) {
      this.#canvas.style.opacity = "1";
    }
  }

  /**
   * Destroy the overlay with a fade-out animation.
   */
  destroy() {
    this.#cancelAnimation();
    this.#currentRect = null;

    if (this.#removeTimeoutId) {
      clearTimeout(this.#removeTimeoutId);
      this.#removeTimeoutId = null;
    }

    if (this.#canvas) {
      const canvasToRemove = this.#canvas;
      this.#canvas = null;
      this.#ctx = null;

      canvasToRemove.style.opacity = "0";
      this.#removeTimeoutId = setTimeout(() => {
        if (canvasToRemove.parentNode) {
          canvasToRemove.parentNode.removeChild(canvasToRemove);
        }
        this.#removeTimeoutId = null;
      }, 150);
    }
  }

  /**
   * Clear the overlay.
   */
  clear() {
    this.#currentRect = null;
    this.#clearCanvas();
  }

  /**
   * Animate to a new target rectangle.
   * @param {{ left: number, top: number, width: number, height: number }} targetRect - Target rectangle
   * @param {string} componentName - Component name to display
   * @param {{ isMarked?: boolean }} [info] - Component info
   */
  animateTo(targetRect, componentName, info = {}) {
    if (!this.#currentRect) {
      this.#currentRect = { ...targetRect };
      this.#drawOverlay(this.#currentRect, componentName, info);
      return;
    }

    this.#cancelAnimation();

    const animate = () => {
      this.#currentRect.left = lerp(this.#currentRect.left, targetRect.left);
      this.#currentRect.top = lerp(this.#currentRect.top, targetRect.top);
      this.#currentRect.width = lerp(this.#currentRect.width, targetRect.width);
      this.#currentRect.height = lerp(this.#currentRect.height, targetRect.height);

      this.#drawOverlay(this.#currentRect, componentName, info);

      const stillMoving =
        Math.abs(this.#currentRect.left - targetRect.left) > 0.5 ||
        Math.abs(this.#currentRect.top - targetRect.top) > 0.5 ||
        Math.abs(this.#currentRect.width - targetRect.width) > 0.5 ||
        Math.abs(this.#currentRect.height - targetRect.height) > 0.5;

      if (stillMoving) {
        this.#animationId = requestAnimationFrame(animate);
      } else {
        this.#currentRect = { ...targetRect };
        this.#drawOverlay(this.#currentRect, componentName, info);
      }
    };

    this.#animationId = requestAnimationFrame(animate);
  }

  /**
   * Clear the canvas.
   * @private
   */
  #clearCanvas() {
    if (!this.#ctx || !this.#canvas) return;
    const dpr = getDevicePixelRatio();
    this.#ctx.clearRect(0, 0, this.#canvas.width / dpr, this.#canvas.height / dpr);
  }

  /**
   * Cancel the current animation.
   * @private
   */
  #cancelAnimation() {
    if (this.#animationId) {
      cancelAnimationFrame(this.#animationId);
      this.#animationId = null;
    }
  }

  /**
   * Draw the overlay rectangle and label.
   * @private
   * @param {{ left: number, top: number, width: number, height: number }} rect - Rectangle to draw
   * @param {string} componentName - Component name
   * @param {{ isMarked?: boolean, isReact?: boolean }} info - Component info
   */
  #drawOverlay(rect, componentName, info) {
    if (!this.#ctx) return;

    this.#clearCanvas();
    if (!rect) return;

    const isMarked = info?.isMarked || false;
    const isReact = info?.isReact || false;
    const colors = CONFIG.colors;

    // Select colors based on component type
    let strokeColor, fillColor, pillBg, pillText;
    
    if (isReact) {
      strokeColor = colors.inspectReactStroke;
      fillColor = colors.inspectReactFill;
      pillBg = colors.inspectReactPillBg;
      pillText = colors.inspectReactPillText;
    } else if (isMarked) {
      strokeColor = colors.inspectMarkedStroke;
      fillColor = colors.inspectMarkedFill;
      pillBg = colors.inspectMarkedPillBg;
      pillText = colors.inspectMarkedPillText;
    } else {
      strokeColor = colors.inspectStroke;
      fillColor = colors.inspectFill;
      pillBg = colors.inspectPillBg;
      pillText = colors.inspectPillText;
    }

    // Draw rectangle
    this.#ctx.strokeStyle = strokeColor;
    this.#ctx.fillStyle = fillColor;
    this.#ctx.lineWidth = 1;
    this.#ctx.setLineDash([4]);
    this.#ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    this.#ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

    // Draw label pill
    if (componentName) {
      const pillHeight = 24;
      const pillPadding = 8;
      const pillGap = 4; // Gap between pill and rectangle

      this.#ctx.font = "12px system-ui, -apple-system, sans-serif";
      
      // Add React icon prefix for React components
      const displayName = isReact ? `⚛ ${componentName}` : componentName;
      const textWidth = this.#ctx.measureText(displayName).width;
      const pillWidth = textWidth + pillPadding * 2;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate available space in each direction
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - (rect.top + rect.height);
      const spaceInside = rect.height;

      // Determine best vertical position
      let pillY;
      const requiredHeight = pillHeight + pillGap;

      if (spaceAbove >= requiredHeight) {
        // Prefer above the rectangle
        pillY = rect.top - pillHeight - pillGap;
      } else if (spaceBelow >= requiredHeight) {
        // Fall back to below the rectangle
        pillY = rect.top + rect.height + pillGap;
      } else if (spaceInside >= pillHeight + pillGap * 2) {
        // Place inside at top with padding
        pillY = rect.top + pillGap;
      } else {
        // Last resort: place at top of viewport or inside whichever fits better
        pillY = Math.max(pillGap, Math.min(rect.top + pillGap, viewportHeight - pillHeight - pillGap));
      }

      // Determine horizontal position (keep within viewport)
      let pillX = rect.left;
      
      // Ensure pill doesn't go off the right edge
      if (pillX + pillWidth > viewportWidth - pillGap) {
        pillX = viewportWidth - pillWidth - pillGap;
      }
      
      // Ensure pill doesn't go off the left edge
      if (pillX < pillGap) {
        pillX = pillGap;
      }

      // Pill background
      this.#ctx.fillStyle = pillBg;
      this.#ctx.beginPath();
      this.#ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3);
      this.#ctx.fill();

      // Text
      this.#ctx.fillStyle = pillText;
      this.#ctx.textBaseline = "middle";
      this.#ctx.fillText(displayName, pillX + pillPadding, pillY + pillHeight / 2);
    }
  }
}


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
      // Log React component info to console (no source path available)
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


// ============================================================================
// HOTKEY MANAGER
// ============================================================================
// Global keyboard shortcut handling.
// ============================================================================

/**
 * Manages global keyboard shortcuts for devtools.
 * 
 * Default hotkeys:
 * - Ctrl+Shift+C: Toggle inspect mode
 */
class HotkeyManager {
  /** @type {Map<string, Function>} Registered hotkey handlers */
  #handlers = new Map();

  /** @type {boolean} Whether the manager is active */
  #active = false;

  /** @type {Function} Bound keydown handler */
  #boundKeydown = null;

  constructor() {
    this.#boundKeydown = this.#handleKeydown.bind(this);
  }

  /**
   * Start listening for hotkeys.
   */
  start() {
    if (this.#active) return;
    this.#active = true;
    document.addEventListener("keydown", this.#boundKeydown, { capture: true });
  }

  /**
   * Stop listening for hotkeys.
   */
  stop() {
    if (!this.#active) return;
    this.#active = false;
    document.removeEventListener("keydown", this.#boundKeydown, { capture: true });
  }

  /**
   * Register a hotkey handler.
   * @param {string} combo - Key combination (e.g., "ctrl+shift+c")
   * @param {Function} handler - Handler function
   */
  register(combo, handler) {
    this.#handlers.set(combo.toLowerCase(), handler);
  }

  /**
   * Unregister a hotkey handler.
   * @param {string} combo - Key combination to remove
   */
  unregister(combo) {
    this.#handlers.delete(combo.toLowerCase());
  }

  /**
   * Handle keydown events.
   * @private
   * @param {KeyboardEvent} e
   */
  #handleKeydown(e) {
    // Build the key combo string
    const parts = [];
    if (e.ctrlKey) parts.push("ctrl");
    if (e.metaKey) parts.push("meta");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");

    // Add the key itself (lowercase)
    const key = e.key.toLowerCase();
    if (!["control", "shift", "alt", "meta"].includes(key)) {
      parts.push(key);
    }

    const combo = parts.join("+");

    // Check if we have a handler for this combo
    const handler = this.#handlers.get(combo);
    if (handler) {
      e.preventDefault();
      e.stopPropagation();
      handler();
    }
  }

  /**
   * Cleanup all handlers.
   */
  destroy() {
    this.stop();
    this.#handlers.clear();
  }
}


// ============================================================================
// UI COMPONENTS
// ============================================================================
// Reusable UI components for the toolbar: tooltips and drag handling.
// ============================================================================

/**
 * Manages tooltip display with animated content transitions.
 */
class TooltipManager {
  /** @type {HTMLDivElement | null} Tooltip container element */
  #element = null;

  /** @type {HTMLDivElement | null} Inner content element */
  #contentElement = null;

  /** @type {number | null} Timeout for hiding tooltip */
  #hideTimeout = null;

  /** @type {number | null} Last hovered element's X position */
  #lastElementX = null;

  /** @type {Array<Function>} Cleanup functions for event listeners */
  #cleanupFns = [];

  /** @type {boolean} Whether tooltips are disabled */
  #disabled = false;

  /**
   * Create the tooltip DOM elements.
   * @returns {{ container: HTMLDivElement, content: HTMLDivElement }} Tooltip elements
   */
  create() {
    const container = document.createElement("div");
    container.className = "devtools-tooltip";

    const content = document.createElement("div");
    content.className = "devtools-tooltip-content";
    container.appendChild(content);

    this.#element = container;
    this.#contentElement = content;

    return { container, content };
  }

  /**
   * Setup tooltip event handlers for elements with data-tooltip attribute.
   * @param {HTMLElement} container - Container to search for tooltip elements
   */
  setupEvents(container) {
    const tooltipElements = container.querySelectorAll("[data-tooltip]");

    for (const el of tooltipElements) {
      const handleMouseEnter = () => {
        if (this.#disabled) return;

        // Cancel any pending hide
        this.#cancelHideTimeout();

        const tooltipText = el.getAttribute("data-tooltip");
        const rect = el.getBoundingClientRect();
        const currentX = rect.left + rect.width / 2;

        // Determine slide direction based on movement
        let direction = "left";
        if (this.#lastElementX !== null) {
          direction = currentX > this.#lastElementX ? "left" : "right";
        }
        this.#lastElementX = currentX;

        this.show(tooltipText, direction);
      };

      const handleMouseLeave = () => {
        // Delay hiding to allow moving between buttons
        this.#hideTimeout = setTimeout(() => {
          this.hide();
          this.#hideTimeout = null;
        }, CONFIG.intervals.tooltipHideDelay || 200);
      };

      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);

      this.#cleanupFns.push(() => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    }
  }

  /**
   * Show the tooltip with the given text.
   * @param {string} text - Tooltip text
   * @param {'left' | 'right'} [direction='left'] - Animation direction
   */
  show(text, direction = "left") {
    if (!this.#element || !this.#contentElement) return;

    const content = this.#contentElement;
    const tooltip = this.#element;

    // If not visible, just set content and show
    if (!tooltip.classList.contains("visible")) {
      content.textContent = text;
      content.style.transform = "translateX(0)";
      content.style.opacity = "1";
      tooltip.classList.add("visible");
      return;
    }

    // Animate content change with slide effect
    const slideOutX = direction === "left" ? "15px" : "-15px";
    const slideInX = direction === "left" ? "-15px" : "15px";
    const slideMs = CONFIG.animation.tooltipSlideMs;

    // Slide out current content
    content.style.transition = `transform ${slideMs}ms ease-out, opacity ${slideMs}ms ease-out`;
    content.style.transform = `translateX(${slideOutX})`;
    content.style.opacity = "0";

    // After slide out, update content and slide in
    setTimeout(() => {
      content.textContent = text;
      content.style.transition = "none";
      content.style.transform = `translateX(${slideInX})`;

      // Force reflow
      void content.offsetWidth;

      content.style.transition = `transform ${slideMs + 30}ms ease-out, opacity ${slideMs + 30}ms ease-out`;
      content.style.transform = "translateX(0)";
      content.style.opacity = "1";
    }, slideMs);
  }

  /**
   * Hide the tooltip.
   */
  hide() {
    if (!this.#element) return;
    this.#element.classList.remove("visible");
    this.#lastElementX = null;
  }

  /**
   * Temporarily disable tooltips.
   */
  disable() {
    this.#disabled = true;
    this.hide();
  }

  /**
   * Re-enable tooltips.
   */
  enable() {
    this.#disabled = false;
  }

  /**
   * Cleanup all event handlers.
   */
  destroy() {
    this.#cancelHideTimeout();
    for (const cleanup of this.#cleanupFns) {
      cleanup();
    }
    this.#cleanupFns = [];
    this.#element = null;
    this.#contentElement = null;
    this.#lastElementX = null;
  }

  /**
   * Cancel the hide timeout.
   * @private
   */
  #cancelHideTimeout() {
    if (this.#hideTimeout) {
      clearTimeout(this.#hideTimeout);
      this.#hideTimeout = null;
    }
  }
}

/**
 * Handles drag-to-move and snap-to-corner behavior for the toolbar.
 */
class DragController {
  /** @type {HTMLElement | null} Element being dragged */
  #element = null;

  /** @type {boolean} Whether currently dragging */
  #isDragging = false;

  /** @type {{ x: number, y: number }} Current position */
  #position = { x: 0, y: 0 };

  /** @type {string} Current corner */
  #corner = "bottom-right";

  /** @type {{ corner: string, orientation: string } | null} Collapsed state */
  #collapsed = null;

  /** @type {number | null} Transition timeout ID */
  #transitionTimeoutId = null;

  // Callbacks
  #onDragStart = null;
  #onDragEnd = null;
  #onPositionChange = null;
  #onCollapse = null;
  #onExpand = null;

  /**
   * Create a new DragController.
   * @param {Object} options - Configuration options
   * @param {(isDragging: boolean) => void} [options.onDragStart] - Called when drag starts
   * @param {() => void} [options.onDragEnd] - Called when drag ends
   * @param {(position: { x: number, y: number }, corner: string) => void} [options.onPositionChange] - Called when position changes
   * @param {(corner: string, orientation: string) => void} [options.onCollapse] - Called when collapsing
   * @param {(corner: string) => void} [options.onExpand] - Called when expanding
   */
  constructor(options = {}) {
    this.#onDragStart = options.onDragStart || null;
    this.#onDragEnd = options.onDragEnd || null;
    this.#onPositionChange = options.onPositionChange || null;
    this.#onCollapse = options.onCollapse || null;
    this.#onExpand = options.onExpand || null;
  }

  /**
   * Check if currently dragging.
   * @returns {boolean}
   */
  get isDragging() {
    return this.#isDragging;
  }

  /**
   * Get current position.
   * @returns {{ x: number, y: number }}
   */
  get position() {
    return { ...this.#position };
  }

  /**
   * Get current corner.
   * @returns {string}
   */
  get corner() {
    return this.#corner;
  }

  /**
   * Get collapsed state.
   * @returns {{ corner: string, orientation: string } | null}
   */
  get collapsed() {
    return this.#collapsed ? { ...this.#collapsed } : null;
  }

  /**
   * Initialize the drag controller with an element.
   * @param {HTMLElement} element - Element to make draggable
   */
  init(element) {
    this.#element = element;
    element.addEventListener("pointerdown", (e) => this.#handlePointerDown(e));
  }

  /**
   * Set the current position without animation.
   * @param {{ x: number, y: number }} position - New position
   * @param {string} [corner] - Corner identifier
   */
  setPosition(position, corner) {
    this.#position = { ...position };
    if (corner) this.#corner = corner;
    this.#applyPosition(false);
  }

  /**
   * Set collapsed state.
   * @param {{ corner: string, orientation: string } | null} state - Collapsed state
   */
  setCollapsed(state) {
    this.#collapsed = state ? { ...state } : null;
    if (state) {
      this.#corner = state.corner;
    }
  }

  /**
   * Animate to a corner position.
   * @param {string} corner - Target corner
   * @param {number} width - Element width
   * @param {number} height - Element height
   */
  snapToCorner(corner, width, height) {
    this.#corner = corner;
    this.#position = this.#calculatePosition(corner, width, height);
    this.#applyPosition(true);
  }

  /**
   * Expand from collapsed state.
   */
  expand() {
    if (!this.#collapsed) return;

    const savedCorner = this.#collapsed.corner;
    this.#collapsed = null;

    this.#onExpand?.(savedCorner);
  }

  /**
   * Handle pointer down event.
   * @private
   * @param {PointerEvent} e - Pointer event
   */
  #handlePointerDown(e) {
    // Don't drag if clicking on buttons or inputs
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest("label")) {
      return;
    }

    e.preventDefault();

    if (!this.#element) return;

    // If collapsed, handle expand drag
    if (this.#collapsed) {
      this.#handleCollapsedDrag(e);
      return;
    }

    const toolbar = this.#element;
    const toolbarStyle = toolbar.style;

    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialX = this.#position.x;
    const initialY = this.#position.y;

    let currentX = initialX;
    let currentY = initialY;
    let lastMouseX = initialMouseX;
    let lastMouseY = initialMouseY;
    let hasMoved = false;
    let rafId = null;

    // Capture pointer for smooth tracking
    toolbar.setPointerCapture(e.pointerId);
    const pointerId = e.pointerId;

    const handlePointerMove = (moveEvent) => {
      lastMouseX = moveEvent.clientX;
      lastMouseY = moveEvent.clientY;

      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const deltaX = lastMouseX - initialMouseX;
        const deltaY = lastMouseY - initialMouseY;

        // Check if moved enough to start drag
        if (!hasMoved && (Math.abs(deltaX) > CONFIG.thresholds.dragStart || Math.abs(deltaY) > CONFIG.thresholds.dragStart)) {
          hasMoved = true;
          this.#isDragging = true;
          toolbar.classList.add("dragging");
          this.#onDragStart?.(true);
        }

        if (hasMoved) {
          currentX = initialX + deltaX;
          currentY = initialY + deltaY;
          toolbarStyle.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }

        rafId = null;
      });
    };

    const handlePointerEnd = () => {
      if (toolbar.hasPointerCapture(pointerId)) {
        toolbar.releasePointerCapture(pointerId);
      }

      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerEnd);
      document.removeEventListener("pointercancel", handlePointerEnd);

      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      toolbar.classList.remove("dragging");
      this.#isDragging = false;
      this.#onDragEnd?.();

      if (!hasMoved) return;

      // Calculate movement
      const totalDeltaX = Math.abs(lastMouseX - initialMouseX);
      const totalDeltaY = Math.abs(lastMouseY - initialMouseY);
      const totalMovement = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);

      // Snap back if didn't move enough
      if (totalMovement < CONFIG.thresholds.snapDistance) {
        this.#position = this.#calculatePosition(this.#corner, toolbar.offsetWidth, toolbar.offsetHeight);
        this.#applyPosition(true);
        return;
      }

      // Check for collapse
      const toolbarWidth = CONFIG.dimensions.toolbarWidth;
      const toolbarHeight = toolbar.offsetHeight || 40;

      if (this.#shouldCollapse(currentX, currentY, toolbarWidth, toolbarHeight)) {
        const target = this.#getCollapseTarget(currentX, currentY, toolbarWidth, toolbarHeight);
        if (target) {
          this.#collapsed = target;
          this.#corner = target.corner;
          this.#onCollapse?.(target.corner, target.orientation);
          return;
        }
      }

      // Determine new corner and snap
      const newCorner = this.#getBestCorner(lastMouseX, lastMouseY, initialMouseX, initialMouseY);
      this.#corner = newCorner;
      this.#position = this.#calculatePosition(newCorner, toolbar.offsetWidth, toolbar.offsetHeight);
      this.#applyPosition(true);

      this.#onPositionChange?.(this.#position, this.#corner);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerEnd);
    document.addEventListener("pointercancel", handlePointerEnd);
  }

  /**
   * Handle drag on collapsed toolbar.
   * @private
   * @param {PointerEvent} e - Pointer event
   */
  #handleCollapsedDrag(e) {
    if (!this.#collapsed) return;

    const { corner, orientation } = this.#collapsed;
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    let hasExpanded = false;

    const handlePointerMove = (moveEvent) => {
      if (hasExpanded) return;

      const deltaX = moveEvent.clientX - initialMouseX;
      const deltaY = moveEvent.clientY - initialMouseY;
      const threshold = CONFIG.thresholds.expandDragDistance;

      let shouldExpand = false;

      if (orientation === "horizontal") {
        if (corner.endsWith("left") && deltaX > threshold) shouldExpand = true;
        else if (corner.endsWith("right") && deltaX < -threshold) shouldExpand = true;
      } else {
        if (corner.startsWith("top") && deltaY > threshold) shouldExpand = true;
        else if (corner.startsWith("bottom") && deltaY < -threshold) shouldExpand = true;
      }

      if (shouldExpand) {
        hasExpanded = true;
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerEnd);
        this.expand();
      }
    };

    const handlePointerEnd = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerEnd);
    };

    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerup", handlePointerEnd);
  }

  /**
   * Apply current position to element.
   * @private
   * @param {boolean} animate - Whether to animate
   */
  #applyPosition(animate) {
    if (!this.#element) return;

    const style = this.#element.style;
    style.left = "0";
    style.top = "0";

    if (animate) {
      // Clear any existing timeout
      if (this.#transitionTimeoutId) {
        clearTimeout(this.#transitionTimeoutId);
      }

      style.transition = `transform ${CONFIG.animation.snapTransitionMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;

      requestAnimationFrame(() => {
        style.transform = `translate3d(${this.#position.x}px, ${this.#position.y}px, 0)`;
      });

      this.#transitionTimeoutId = setTimeout(() => {
        style.transition = "none";
        this.#transitionTimeoutId = null;
      }, CONFIG.animation.snapTransitionMs + 50);
    } else {
      style.transition = "none";
      style.transform = `translate3d(${this.#position.x}px, ${this.#position.y}px, 0)`;
    }
  }

  /**
   * Calculate position for a corner.
   * @private
   * @param {string} corner - Corner identifier
   * @param {number} width - Element width
   * @param {number} height - Element height
   * @returns {{ x: number, y: number }}
   */
  #calculatePosition(corner, width, height) {
    const safeArea = CONFIG.dimensions.safeArea;
    const rightX = window.innerWidth - width - safeArea;
    const bottomY = window.innerHeight - height - safeArea;

    switch (corner) {
      case "top-left":
        return { x: safeArea, y: safeArea };
      case "top-right":
        return { x: rightX, y: safeArea };
      case "bottom-left":
        return { x: safeArea, y: bottomY };
      case "bottom-right":
      default:
        return { x: rightX, y: bottomY };
    }
  }

  /**
   * Determine best corner based on drag direction.
   * @private
   */
  #getBestCorner(mouseX, mouseY, initialMouseX, initialMouseY) {
    const deltaX = mouseX - initialMouseX;
    const deltaY = mouseY - initialMouseY;
    const threshold = 40;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const movingRight = deltaX > threshold;
    const movingLeft = deltaX < -threshold;
    const movingDown = deltaY > threshold;
    const movingUp = deltaY < -threshold;

    if (movingRight || movingLeft) {
      const isBottom = mouseY > centerY;
      return movingRight
        ? (isBottom ? "bottom-right" : "top-right")
        : (isBottom ? "bottom-left" : "top-left");
    }

    if (movingDown || movingUp) {
      const isRight = mouseX > centerX;
      return movingDown
        ? (isRight ? "bottom-right" : "bottom-left")
        : (isRight ? "top-right" : "top-left");
    }

    return mouseX > centerX
      ? (mouseY > centerY ? "bottom-right" : "top-right")
      : (mouseY > centerY ? "bottom-left" : "top-left");
  }

  /**
   * Check if toolbar should collapse.
   * @private
   */
  #shouldCollapse(x, y, width, height) {
    const right = x + width;
    const bottom = y + height;

    const outsideLeft = Math.max(0, -x);
    const outsideRight = Math.max(0, right - window.innerWidth);
    const outsideTop = Math.max(0, -y);
    const outsideBottom = Math.max(0, bottom - window.innerHeight);

    const horizontalOutside = Math.min(width, outsideLeft + outsideRight);
    const verticalOutside = Math.min(height, outsideTop + outsideBottom);
    const areaOutside = horizontalOutside * height + verticalOutside * width - horizontalOutside * verticalOutside;
    const totalArea = width * height;

    return areaOutside > totalArea * CONFIG.thresholds.collapseRatio;
  }

  /**
   * Get collapse target corner and orientation.
   * @private
   */
  #getCollapseTarget(x, y, width, height) {
    const outsideLeft = -x;
    const outsideRight = (x + width) - window.innerWidth;
    const outsideTop = -y;
    const outsideBottom = (y + height) - window.innerHeight;

    const maxOutside = Math.max(outsideLeft, outsideRight, outsideTop, outsideBottom);
    if (maxOutside < 0) return null;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    if (outsideLeft === maxOutside) {
      return { orientation: "horizontal", corner: y < centerY ? "top-left" : "bottom-left" };
    } else if (outsideRight === maxOutside) {
      return { orientation: "horizontal", corner: y < centerY ? "top-right" : "bottom-right" };
    } else if (outsideTop === maxOutside) {
      return { orientation: "vertical", corner: x < centerX ? "top-left" : "top-right" };
    } else {
      return { orientation: "vertical", corner: x < centerX ? "bottom-left" : "bottom-right" };
    }
  }

  /**
   * Cleanup resources.
   */
  destroy() {
    if (this.#transitionTimeoutId) {
      clearTimeout(this.#transitionTimeoutId);
      this.#transitionTimeoutId = null;
    }
    this.#element = null;
  }
}


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
   * Create the help button.
   * @private
   */
  #createHelpButton() {
    const btn = document.createElement("button");
    btn.className = "devtools-icon-btn";
    btn.setAttribute("data-tooltip", "Console API:\n• Devtools.enable() / disable()\n\n Drag toolbar to edge to minimize");
    btn.innerHTML = ICONS.help;
    return btn;
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


// ============================================================================
// PUBLIC API
// ============================================================================
// Clean facade exposing the public devtools API.
// ============================================================================

/**
 * Devtools - Public API facade.
 * Coordinates the scanner, inspector, and toolbar components.
 * 
 * @example
 * // Enable devtools (shows toolbar on next page load)
 * Devtools.enable();
 * 
 * // Disable devtools (hides toolbar on next page load)
 * Devtools.disable();
 * 
 * // Toggle devtools visibility immediately
 * Devtools.show();
 * Devtools.hide();
 */
const Devtools = {
  /** @type {MutationScanner | null} */
  _scanner: null,

  /** @type {ComponentInspector | null} */
  _inspector: null,

  /** @type {Toolbar | null} */
  _toolbar: null,

  /** @type {HotkeyManager | null} */
  _hotkeys: null,

  // ===== Enable/Disable API =====

  /**
   * Enable devtools. Sets localStorage and initializes immediately.
   * The toolbar will appear and persist across page reloads.
   */
  enable() {
    StorageManager.setString(CONFIG.storageKeys.enabled, "true");
    if (!this._toolbar) {
      this.init();
    }
    console.log("Devtools: Enabled. Toolbar is now visible.");
  },

  /**
   * Disable devtools. Clears localStorage and destroys immediately.
   * The toolbar will not appear on page reload.
   */
  disable() {
    StorageManager.setString(CONFIG.storageKeys.enabled, "false");
    this.destroy();
    console.log("Devtools: Disabled. Toolbar hidden.");
  },

  /**
   * Check if devtools is enabled in localStorage.
   * @returns {boolean}
   */
  isEnabled() {
    return StorageManager.isDevtoolsEnabled();
  },

  /**
   * Show the toolbar immediately (without persisting to localStorage).
   */
  show() {
    if (!this._toolbar) {
      this.init();
    }
  },

  /**
   * Hide the toolbar immediately (without changing localStorage).
   */
  hide() {
    this.destroy();
  },

  /**
   * Initialize the devtools system.
   * Creates the toolbar and sets up component coordination.
   */
  init() {
    if (this._toolbar) return; // Already initialized

    // Create scanner
    this._scanner = new MutationScanner();

    // Create inspector with state change callback
    this._inspector = new ComponentInspector({
      onStateChange: (inspecting) => {
        this._toolbar?.updateInspectButton(inspecting);
      },
    });

    // Create toolbar with callbacks
    this._toolbar = new Toolbar({
      onScanningToggle: (enabled) => {
        if (enabled) {
          this._scanner.start();
        } else {
          this._scanner.stop();
        }
      },
      onInspectToggle: () => {
        this._inspector.toggle();
      },
    });

    // Mount toolbar
    this._toolbar.mount();

    // Setup hotkeys
    this._hotkeys = new HotkeyManager();
    this._hotkeys.register("ctrl+shift+c", () => {
      this._inspector?.toggle();
    });
    this._hotkeys.start();

    // Auto-start scanning if previously enabled
    if (StorageManager.isScanningEnabled()) {
      this._scanner.start();
    }
  },

  /**
   * Destroy the devtools system.
   */
  destroy() {
    this._hotkeys?.destroy();
    this._scanner?.stop();
    this._inspector?.stop();
    this._toolbar?.unmount();

    this._hotkeys = null;
    this._scanner = null;
    this._inspector = null;
    this._toolbar = null;
  },

  // ===== Scanner API =====

  /**
   * Check if the mutation scanner is running.
   * @returns {boolean}
   */
  isRunning() {
    return this._scanner?.isRunning ?? false;
  },

  /**
   * Start the mutation scanner.
   */
  start() {
    this._scanner?.start();
  },

  /**
   * Stop the mutation scanner.
   */
  stop() {
    this._scanner?.stop();
  },

  /**
   * Toggle the mutation scanner.
   */
  toggle() {
    this._scanner?.toggle();
  },

  // ===== Inspector API =====

  /**
   * Check if component inspection is active.
   * @returns {boolean}
   */
  isInspecting() {
    return this._inspector?.isInspecting ?? false;
  },

  /**
   * Start component inspection mode.
   */
  startInspect() {
    this._inspector?.start();
  },

  /**
   * Stop component inspection mode.
   */
  stopInspect() {
    this._inspector?.stop();
  },

  /**
   * Toggle component inspection mode.
   */
  toggleInspect() {
    this._inspector?.toggle();
  },
};

// Expose to global scope for console access
window.Devtools = Devtools;


// ============================================================================
// INITIALIZATION
// ============================================================================
// Auto-mount logic when DOM is ready.
// ============================================================================

/**
 * Initialize devtools when the DOM is ready (if enabled).
 */
function initDevtools() {
  if (StorageManager.isDevtoolsEnabled()) {
    Devtools.init();
  }
}

// Auto-mount when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDevtools);
} else {
  initDevtools();
}


})();
