(() => {
  // devtools/config.ts
  var CONFIG = {
    colors: {
      primary: { r: 115, g: 97, b: 230 },
      fpsGood: "rgb(214,132,245)",
      fpsWarning: "#F59E0B",
      fpsCritical: "#EF4444",
      memoryHealthy: "#6EE7B7",
      memoryWarning: "#F59E0B",
      memoryCritical: "#EF4444",
      inspectStroke: "rgba(142, 97, 227, 0.5)",
      inspectFill: "rgba(173, 97, 230, 0.10)",
      inspectPillBg: "rgba(37, 37, 38, 0.75)",
      inspectPillText: "white",
      inspectMarkedStroke: "rgba(79, 192, 255, 0.6)",
      inspectMarkedFill: "rgba(79, 192, 255, 0.10)",
      inspectMarkedPillBg: "rgba(20, 60, 80, 0.85)",
      inspectMarkedPillText: "#79c0ff",
      inspectReactStroke: "rgba(97, 218, 251, 0.6)",
      inspectReactFill: "rgba(97, 218, 251, 0.10)",
      inspectReactPillBg: "rgba(20, 44, 52, 0.90)",
      inspectReactPillText: "#61dafb"
    },
    animation: {
      totalFrames: 45,
      interpolationSpeed: 0.51,
      snapTransitionMs: 300,
      tooltipFadeMs: 200,
      tooltipSlideMs: 120
    },
    dimensions: {
      toolbarWidth: 284,
      tooltipMinHeight: 92,
      safeArea: 16,
      collapsedHorizontal: { width: 20, height: 48 },
      collapsedVertical: { width: 48, height: 20 },
      radarSize: 220
    },
    thresholds: {
      dragStart: 5,
      snapDistance: 60,
      collapseRatio: 0.5,
      expandDragDistance: 50,
      fpsWarning: 50,
      fpsCritical: 30,
      memoryWarning: 60,
      memoryCritical: 80
    },
    intervals: {
      fpsDisplay: 200,
      memoryDisplay: 1000,
      resizeDebounce: 100,
      tooltipShowDelay: 400,
      tooltipHideDelay: 200
    },
    attributes: {
      scalaComponent: "data-scala",
      devtools: "data-frontend-devtools"
    },
    properties: {
      sourcePath: "__scalasourcepath",
      sourceLine: "__scalasourceline",
      filename: "__scalafilename",
      name: "__scalaname",
      markAsComponent: "__markascomponent"
    },
    storageKeys: {
      position: "FRONTEND_DEVTOOLS_POSITION",
      collapsed: "FRONTEND_DEVTOOLS_COLLAPSED",
      enabled: "FRONTEND_DEVTOOLS_ENABLED",
      scanning: "FRONTEND_DEVTOOLS_SCANNING",
      domStatsPinned: "FRONTEND_DEVTOOLS_DOM_STATS_PINNED",
      lagRadarPinned: "FRONTEND_DEVTOOLS_LAG_RADAR_PINNED"
    },
    fonts: {
      mono: "11px Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace",
      ui: "system-ui, -apple-system, sans-serif"
    }
  };
  var ICONS = {
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
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 6L6 18"/>
    <path d="M6 6l12 12"/>
  </svg>`,
    chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>`,
    domTree: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1"/>
    <rect x="2" y="16" width="6" height="6" rx="1"/>
    <rect x="9" y="2" width="6" height="6" rx="1"/>
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
    <path d="M12 12V8"/>
  </svg>`
  };
  var STYLES = `
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

  .devtools-meter.clickable {
    cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s;
  }

  .devtools-meter.clickable:hover {
    background: #1a1a1a;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
  }

  .devtools-meter.clickable.active {
    background: #1f1f1f;
    box-shadow: inset 0 0 0 1px rgba(142, 97, 230, 0.4);
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
    text-align: center;
  }

  .devtools-meter-label {
    color: rgba(255,255,255,0.3);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.025em;
    white-space: nowrap;
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

  /* Stacked tooltips - stacked-1 is base position, stacked-2 offset is set via JS */
  .devtools-tooltip.stacked-1 {
    bottom: calc(100% + 8px);
  }

  .devtools-tooltip.stacked-2 {
    /* Offset is set dynamically via inline style */
  }

  .devtools-toolbar.corner-top .devtools-tooltip.stacked-1 {
    bottom: auto;
    top: calc(100% + 8px);
  }

  .devtools-toolbar.corner-top .devtools-tooltip.stacked-2 {
    bottom: auto;
    /* Offset is set dynamically via inline style */
  }

  .devtools-tooltip .live-indicator {
    display: none;
    width: 6px;
    height: 6px;
    background: #22c55e;
    border-radius: 50%;
    position: absolute;
    top: 8px;
    right: 8px;
    animation: pulse-green 1.5s ease-in-out infinite;
  }

  .devtools-tooltip.pinned .live-indicator {
    display: block;
  }

  @keyframes pulse-green {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.85);
    }
  }

  .devtools-tooltip-content {
    white-space: pre-line;
    will-change: transform, opacity;
  }

  /* ===== FPS Radar ===== */
  .devtools-radar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
  }

  .devtools-radar-container canvas {
    display: block;
  }

  .devtools-radar-legend {
    display: flex;
    justify-content: center;
    gap: 16px;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
  }

  .devtools-radar-legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .devtools-radar-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .devtools-radar-legend-dot.good {
    background: hsl(120, 80%, 50%);
  }

  .devtools-radar-legend-dot.warning {
    background: hsl(60, 80%, 50%);
  }

  .devtools-radar-legend-dot.critical {
    background: hsl(0, 80%, 50%);
  }

  /* ===== DOM Stats Panel ===== */
  .devtools-dom-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .devtools-dom-stats-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .devtools-dom-stats-total {
    font-size: 28px;
    font-weight: 600;
    font-family: ui-monospace, monospace;
    color: #fff;
    letter-spacing: -0.02em;
  }

  .devtools-dom-stats-total .odometer {
    height: 1.1em;
    line-height: 1.1em;
  }

  .devtools-dom-stats-total .odometer-digit {
    height: 1.1em;
  }

  .devtools-dom-stats-total .odometer-digit-old,
  .devtools-dom-stats-total .odometer-digit-new {
    height: 1.1em;
    line-height: 1.1em;
  }

  .devtools-dom-stats-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .devtools-dom-stats-chart {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .devtools-dom-stats-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .devtools-dom-stats-tag {
    width: 48px;
    font-size: 11px;
    font-family: ui-monospace, monospace;
    color: rgba(255, 255, 255, 0.7);
    text-align: right;
    flex-shrink: 0;
  }

  .devtools-dom-stats-bar-container {
    flex: 1;
    height: 16px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }

  .devtools-dom-stats-bar {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, #8e61e6 0%, #6366f1 100%);
    transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    min-width: 2px;
  }

  .devtools-dom-stats-bar.increasing {
    animation: barPulseUp 0.4s ease-out;
  }

  .devtools-dom-stats-bar.decreasing {
    animation: barPulseDown 0.4s ease-out;
  }

  @keyframes barPulseUp {
    0% { filter: brightness(1); }
    30% { filter: brightness(1.5); background: linear-gradient(90deg, #f87171 0%, #ef4444 100%); }
    100% { filter: brightness(1); }
  }

  @keyframes barPulseDown {
    0% { filter: brightness(1); }
    30% { filter: brightness(1.5); background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%); }
    100% { filter: brightness(1); }
  }

  .devtools-dom-stats-count {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    font-family: ui-monospace, monospace;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  /* ===== Odometer Animation ===== */
  .odometer {
    display: inline-flex;
    position: relative;
    overflow: hidden;
    vertical-align: bottom;
    height: 1.3em;
    line-height: 1.3em;
  }

  /* Container for each digit */
  .odometer-digit {
    display: inline-block;
    position: relative;
    overflow: hidden;
    height: 1.3em;
  }

  /* Stack old and new values */
  .odometer-digit-inner {
    display: flex;
    flex-direction: column;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .odometer-digit-old,
  .odometer-digit-new {
    display: block;
    height: 1.3em;
    line-height: 1.3em;
    text-align: center;
  }

  /* Animation states */
  .odometer-digit-inner.roll-up {
    animation: odometerRollUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .odometer-digit-inner.roll-down {
    animation: odometerRollDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /* Color pulse for increases (more nodes = warning/red) */
  .odometer.increasing {
    animation: pulseRed 0.5s ease-out;
  }

  /* Color pulse for decreases (fewer nodes = good/green) */
  .odometer.decreasing {
    animation: pulseGreen 0.5s ease-out;
  }

  @keyframes odometerRollUp {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(-50%);
    }
  }

  @keyframes odometerRollDown {
    0% {
      transform: translateY(-50%);
    }
    100% {
      transform: translateY(0);
    }
  }

  @keyframes pulseGreen {
    0% {
      color: inherit;
      text-shadow: none;
    }
    30% {
      color: #4ade80;
      text-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
    }
    100% {
      color: inherit;
      text-shadow: none;
    }
  }

  @keyframes pulseRed {
    0% {
      color: inherit;
      text-shadow: none;
    }
    30% {
      color: #f87171;
      text-shadow: 0 0 8px rgba(248, 113, 113, 0.5);
    }
    100% {
      color: inherit;
      text-shadow: none;
    }
  }

  /* Stagger animation delay for digits */
  .odometer-digit:nth-child(1) .odometer-digit-inner { animation-delay: 0ms; }
  .odometer-digit:nth-child(2) .odometer-digit-inner { animation-delay: 30ms; }
  .odometer-digit:nth-child(3) .odometer-digit-inner { animation-delay: 60ms; }
  .odometer-digit:nth-child(4) .odometer-digit-inner { animation-delay: 90ms; }
  .odometer-digit:nth-child(5) .odometer-digit-inner { animation-delay: 120ms; }
  .odometer-digit:nth-child(6) .odometer-digit-inner { animation-delay: 150ms; }

  /* Legacy support for simple rolling (non-digit) */
  .num-roll {
    display: inline-block;
    overflow: hidden;
    vertical-align: bottom;
    height: 1.3em;
    line-height: 1.3em;
  }

  .num-roll-inner {
    display: inline-block;
  }

  .num-roll-inner.roll-up {
    animation: legacyRollUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .num-roll-inner.roll-down {
    animation: legacyRollDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes legacyRollUp {
    0% {
      transform: translateY(100%);
      opacity: 0;
    }
    60% {
      opacity: 1;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes legacyRollDown {
    0% {
      transform: translateY(-100%);
      opacity: 0;
    }
    60% {
      opacity: 1;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
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

  // devtools/storage.ts
  class StorageManager {
    static get(key, defaultValue = null) {
      try {
        const value = localStorage.getItem(key);
        if (value === null)
          return defaultValue;
        return JSON.parse(value);
      } catch {
        return defaultValue;
      }
    }
    static getString(key, defaultValue = "") {
      try {
        return localStorage.getItem(key) ?? defaultValue;
      } catch {
        return defaultValue;
      }
    }
    static set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
    static setString(key, value) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
    static remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
    static isDevtoolsEnabled() {
      return this.getString(CONFIG.storageKeys.enabled) !== "false";
    }
    static isScanningEnabled() {
      return this.getString(CONFIG.storageKeys.scanning) === "true";
    }
    static setScanningEnabled(enabled) {
      this.setString(CONFIG.storageKeys.scanning, enabled ? "true" : "false");
    }
    static getToolbarPosition() {
      return this.get(CONFIG.storageKeys.position, null);
    }
    static setToolbarPosition(corner, position) {
      this.set(CONFIG.storageKeys.position, { corner, position });
    }
    static getCollapsedState() {
      return this.get(CONFIG.storageKeys.collapsed, null);
    }
    static setCollapsedState(state) {
      this.set(CONFIG.storageKeys.collapsed, state);
    }
    static isDomStatsPinned() {
      return this.getString(CONFIG.storageKeys.domStatsPinned) === "true";
    }
    static setDomStatsPinned(pinned) {
      this.setString(CONFIG.storageKeys.domStatsPinned, pinned ? "true" : "false");
    }
    static isLagRadarPinned() {
      return this.getString(CONFIG.storageKeys.lagRadarPinned) === "true";
    }
    static setLagRadarPinned(pinned) {
      this.setString(CONFIG.storageKeys.lagRadarPinned, pinned ? "true" : "false");
    }
  }

  // devtools/utilities.ts
  function lerp(start, end, speed = CONFIG.animation.interpolationSpeed) {
    return start + (end - start) * speed;
  }
  function debounce(fn, delay) {
    let timeoutId = null;
    const debounced = (...args) => {
      if (timeoutId)
        clearTimeout(timeoutId);
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
  function getDevicePixelRatio() {
    return Math.max(window.devicePixelRatio, 1);
  }
  function isDevtoolsElement(element) {
    if (!element)
      return false;
    const attr = CONFIG.attributes.devtools;
    return element.hasAttribute(attr) || element.closest(`[${attr}]`) !== null;
  }
  function getScalaComponent(element) {
    if (!element)
      return null;
    const attr = CONFIG.attributes.scalaComponent;
    const closest = element.closest(`[${attr}]`);
    if (!closest)
      return null;
    return {
      element: closest,
      name: closest.getAttribute(attr)
    };
  }
  function getScalaSource(node) {
    const element = node && node.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    if (!element)
      return null;
    const attr = CONFIG.attributes.scalaComponent;
    const value = element.getAttribute(attr);
    if (value)
      return value;
    const closest = element.closest(`[${attr}]`);
    return closest ? closest.getAttribute(attr) : null;
  }
  function getComponentSourceInfo(element) {
    if (!element)
      return null;
    const props = CONFIG.properties;
    const el = element;
    return {
      sourcePath: el[props.sourcePath] || null,
      sourceLine: el[props.sourceLine] !== undefined ? String(el[props.sourceLine]) : null,
      filename: el[props.filename] || null,
      scalaName: el[props.name] || null,
      isMarked: el[props.markAsComponent] === "true",
      displayName: element.getAttribute(CONFIG.attributes.scalaComponent)
    };
  }
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

  // devtools/canvas.ts
  class HighlightCanvas {
    #canvas = null;
    #ctx = null;
    #animationId = null;
    #highlights = new Map;
    #resizeHandler = null;
    create() {
      if (this.#canvas)
        return this.#canvas;
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
        zIndex: "2147483647"
      });
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      document.body.appendChild(canvas);
      this.#canvas = canvas;
      this.#ctx = canvas.getContext("2d");
      this.#ctx?.scale(dpr, dpr);
      this.#resizeHandler = debounce(() => this.#handleResize(), CONFIG.intervals.resizeDebounce);
      window.addEventListener("resize", this.#resizeHandler);
      return canvas;
    }
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
    highlight(element, name, options = {}) {
      if (!this.#canvas || !element.isConnected)
        return;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0)
        return;
      const isReact = options.isReact ?? false;
      const existing = this.#highlights.get(element);
      if (existing) {
        existing.targetX = rect.left;
        existing.targetY = rect.top;
        existing.targetWidth = rect.width;
        existing.targetHeight = rect.height;
        existing.frame = 0;
        existing.count++;
        existing.isReact = isReact;
      } else {
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
          isReact
        });
      }
      this.#startAnimation();
    }
    clear() {
      this.#highlights.clear();
      this.#clearCanvas();
    }
    pause() {
      this.#stopAnimation();
    }
    resume() {
      if (this.#highlights.size > 0) {
        this.#startAnimation();
      }
    }
    #startAnimation() {
      if (this.#animationId)
        return;
      this.#sweepStale();
      this.#animationId = requestAnimationFrame(() => this.#draw());
    }
    #stopAnimation() {
      if (this.#animationId) {
        cancelAnimationFrame(this.#animationId);
        this.#animationId = null;
      }
    }
    #sweepStale() {
      for (const [element] of this.#highlights) {
        if (!element.isConnected) {
          this.#highlights.delete(element);
        }
      }
    }
    #clearCanvas() {
      if (!this.#ctx || !this.#canvas)
        return;
      const dpr = getDevicePixelRatio();
      this.#ctx.clearRect(0, 0, this.#canvas.width / dpr, this.#canvas.height / dpr);
    }
    #draw() {
      if (!this.#ctx || !this.#canvas)
        return;
      this.#clearCanvas();
      const toRemove = [];
      const labelMap = new Map;
      const { r, g, b } = CONFIG.colors.primary;
      const reactColor = { r: 97, g: 218, b: 251 };
      const totalFrames = CONFIG.animation.totalFrames;
      for (const [element, highlight] of this.#highlights) {
        if (!element.isConnected) {
          toRemove.push(element);
          continue;
        }
        highlight.x = lerp(highlight.x, highlight.targetX);
        highlight.y = lerp(highlight.y, highlight.targetY);
        highlight.width = lerp(highlight.width, highlight.targetWidth);
        highlight.height = lerp(highlight.height, highlight.targetHeight);
        const alpha = 1 - highlight.frame / totalFrames;
        highlight.frame++;
        if (highlight.frame > totalFrames) {
          toRemove.push(element);
          continue;
        }
        const color = highlight.isReact ? reactColor : { r, g, b };
        this.#ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
        this.#ctx.lineWidth = 1;
        this.#ctx.beginPath();
        this.#ctx.rect(highlight.x, highlight.y, highlight.width, highlight.height);
        this.#ctx.stroke();
        this.#ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.1})`;
        this.#ctx.fill();
        const labelKey = `${highlight.x},${highlight.y}`;
        const existing = labelMap.get(labelKey);
        if (!existing) {
          labelMap.set(labelKey, { ...highlight, alpha });
        } else {
          existing.count += highlight.count;
          if (alpha > existing.alpha)
            existing.alpha = alpha;
        }
      }
      this.#ctx.font = CONFIG.fonts.mono;
      for (const [, { x, y, name, count, alpha, isReact }] of labelMap) {
        const color = isReact ? reactColor : { r, g, b };
        const displayName = isReact ? `⚛ ${name}` : name;
        const labelText = count > 1 ? `${displayName} ×${count}` : displayName;
        const textWidth = this.#ctx.measureText(labelText).width;
        const textHeight = 11;
        const padding = 2;
        let labelY = y - textHeight - padding * 2;
        if (labelY < 0)
          labelY = 0;
        this.#ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
        this.#ctx.fillRect(x, labelY, textWidth + padding * 2, textHeight + padding * 2);
        this.#ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        this.#ctx.fillText(labelText, x + padding, labelY + textHeight + padding - 2);
      }
      for (const element of toRemove) {
        this.#highlights.delete(element);
      }
      if (this.#highlights.size > 0) {
        this.#animationId = requestAnimationFrame(() => this.#draw());
      } else {
        this.#animationId = null;
      }
    }
    #handleResize() {
      if (!this.#canvas || !this.#ctx)
        return;
      const dpr = getDevicePixelRatio();
      this.#canvas.style.width = `${window.innerWidth}px`;
      this.#canvas.style.height = `${window.innerHeight}px`;
      this.#canvas.width = window.innerWidth * dpr;
      this.#canvas.height = window.innerHeight * dpr;
      this.#ctx.scale(dpr, dpr);
    }
  }

  class InspectOverlay {
    #canvas = null;
    #ctx = null;
    #currentRect = null;
    #animationId = null;
    #removeTimeoutId = null;
    create() {
      if (this.#canvas)
        return this.#canvas;
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
        transition: "opacity 0.15s ease-in-out"
      });
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      this.#canvas = canvas;
      this.#ctx = canvas.getContext("2d");
      this.#ctx?.scale(dpr, dpr);
      return canvas;
    }
    show() {
      if (this.#canvas) {
        this.#canvas.style.opacity = "1";
      }
    }
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
    clear() {
      this.#currentRect = null;
      this.#clearCanvas();
    }
    animateTo(targetRect, componentName, info = {}) {
      if (!this.#currentRect) {
        this.#currentRect = { ...targetRect };
        this.#drawOverlay(this.#currentRect, componentName, info);
        return;
      }
      this.#cancelAnimation();
      const animate = () => {
        if (!this.#currentRect)
          return;
        this.#currentRect.left = lerp(this.#currentRect.left, targetRect.left);
        this.#currentRect.top = lerp(this.#currentRect.top, targetRect.top);
        this.#currentRect.width = lerp(this.#currentRect.width, targetRect.width);
        this.#currentRect.height = lerp(this.#currentRect.height, targetRect.height);
        this.#drawOverlay(this.#currentRect, componentName, info);
        const stillMoving = Math.abs(this.#currentRect.left - targetRect.left) > 0.5 || Math.abs(this.#currentRect.top - targetRect.top) > 0.5 || Math.abs(this.#currentRect.width - targetRect.width) > 0.5 || Math.abs(this.#currentRect.height - targetRect.height) > 0.5;
        if (stillMoving) {
          this.#animationId = requestAnimationFrame(animate);
        } else {
          this.#currentRect = { ...targetRect };
          this.#drawOverlay(this.#currentRect, componentName, info);
        }
      };
      this.#animationId = requestAnimationFrame(animate);
    }
    #clearCanvas() {
      if (!this.#ctx || !this.#canvas)
        return;
      const dpr = getDevicePixelRatio();
      this.#ctx.clearRect(0, 0, this.#canvas.width / dpr, this.#canvas.height / dpr);
    }
    #cancelAnimation() {
      if (this.#animationId) {
        cancelAnimationFrame(this.#animationId);
        this.#animationId = null;
      }
    }
    #drawOverlay(rect, componentName, info) {
      if (!this.#ctx)
        return;
      this.#clearCanvas();
      if (!rect)
        return;
      const isMarked = info?.isMarked || false;
      const isReact = info?.isReact || false;
      const colors = CONFIG.colors;
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
      this.#ctx.strokeStyle = strokeColor;
      this.#ctx.fillStyle = fillColor;
      this.#ctx.lineWidth = 1;
      this.#ctx.setLineDash([4]);
      this.#ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
      this.#ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
      if (componentName) {
        const pillHeight = 24;
        const pillPadding = 8;
        const pillGap = 4;
        this.#ctx.font = "12px system-ui, -apple-system, sans-serif";
        const displayName = isReact ? `⚛ ${componentName}` : componentName;
        const textWidth = this.#ctx.measureText(displayName).width;
        const pillWidth = textWidth + pillPadding * 2;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const spaceAbove = rect.top;
        const spaceBelow = viewportHeight - (rect.top + rect.height);
        const spaceInside = rect.height;
        let pillY;
        const requiredHeight = pillHeight + pillGap;
        if (spaceAbove >= requiredHeight) {
          pillY = rect.top - pillHeight - pillGap;
        } else if (spaceBelow >= requiredHeight) {
          pillY = rect.top + rect.height + pillGap;
        } else if (spaceInside >= pillHeight + pillGap * 2) {
          pillY = rect.top + pillGap;
        } else {
          pillY = Math.max(pillGap, Math.min(rect.top + pillGap, viewportHeight - pillHeight - pillGap));
        }
        let pillX = rect.left;
        if (pillX + pillWidth > viewportWidth - pillGap) {
          pillX = viewportWidth - pillWidth - pillGap;
        }
        if (pillX < pillGap) {
          pillX = pillGap;
        }
        this.#ctx.fillStyle = pillBg;
        this.#ctx.beginPath();
        this.#ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3);
        this.#ctx.fill();
        this.#ctx.fillStyle = pillText;
        this.#ctx.textBaseline = "middle";
        this.#ctx.fillText(displayName, pillX + pillPadding, pillY + pillHeight / 2);
      }
    }
  }

  // devtools/react-inspector.ts
  function getReactFiber(domNode) {
    try {
      if (!domNode)
        return null;
      const key = Object.keys(domNode).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactContainer$"));
      return key ? domNode[key] : null;
    } catch {
      return null;
    }
  }
  function getComponentNameFromType(type) {
    try {
      if (type == null)
        return null;
      if (typeof type === "function") {
        return type.displayName || type.name || null;
      }
      if (typeof type === "string") {
        return type;
      }
      if (typeof type === "object") {
        const $$typeof = type.$$typeof;
        if (!$$typeof)
          return null;
        const typeStr = $$typeof.toString();
        if (typeStr === "Symbol(react.forward_ref)") {
          const displayName = type.displayName;
          if (displayName)
            return displayName;
          const innerName = type.render?.displayName || type.render?.name || "";
          return innerName ? `ForwardRef(${innerName})` : "ForwardRef";
        }
        if (typeStr === "Symbol(react.memo)") {
          return type.displayName || getComponentNameFromType(type.type) || "Memo";
        }
        if (typeStr === "Symbol(react.lazy)") {
          try {
            return getComponentNameFromType(type._init(type._payload));
          } catch {
            return null;
          }
        }
        if (typeStr === "Symbol(react.context)") {
          return (type.displayName || "Context") + ".Provider";
        }
        if (typeStr === "Symbol(react.consumer)") {
          return (type._context?.displayName || "Context") + ".Consumer";
        }
      }
      return null;
    } catch {
      return null;
    }
  }
  function getComponentNameFromFiber(fiber) {
    try {
      if (!fiber)
        return null;
      const { type } = fiber;
      if (typeof type === "function") {
        return type.displayName || type.name || null;
      }
      if (typeof type === "string") {
        return type;
      }
      if (typeof type === "object" && type !== null) {
        return getComponentNameFromType(type);
      }
      return null;
    } catch {
      return null;
    }
  }
  function getReactComponentFromNode(domNode) {
    try {
      const fiber = getReactFiber(domNode);
      if (!fiber)
        return null;
      let current = fiber;
      let iterations = 0;
      const maxIterations = 500;
      while (current && iterations < maxIterations) {
        iterations++;
        const name = getComponentNameFromFiber(current);
        if (name && typeof current.type !== "string") {
          return {
            name,
            fiber: current,
            props: current.memoizedProps,
            element: domNode
          };
        }
        current = current.return;
      }
      return null;
    } catch {
      return null;
    }
  }
  function getAllReactComponentsFromNode(domNode) {
    try {
      const fiber = getReactFiber(domNode);
      if (!fiber)
        return [];
      const components = [];
      let current = fiber;
      let iterations = 0;
      const maxIterations = 500;
      while (current && iterations < maxIterations) {
        iterations++;
        const name = getComponentNameFromFiber(current);
        if (name && typeof current.type !== "string") {
          components.push({
            name,
            fiber: current,
            props: current.memoizedProps
          });
        }
        current = current.return;
      }
      return components;
    } catch {
      return [];
    }
  }
  function getReactComponent(element) {
    try {
      if (!element)
        return null;
      const reactInfo = getReactComponentFromNode(element);
      if (!reactInfo)
        return null;
      return {
        element: reactInfo.element,
        name: reactInfo.name,
        isReact: true
      };
    } catch {
      return null;
    }
  }
  function getReactComponentSourceInfo(element) {
    try {
      const reactInfo = getReactComponentFromNode(element);
      if (!reactInfo)
        return null;
      let sourcePath = null;
      let sourceLine = null;
      let filename = null;
      const name = reactInfo.name || "";
      if (name.includes("/")) {
        const lineMatch = name.match(/^(.+):(\d+)$/);
        if (lineMatch) {
          sourcePath = lineMatch[1] ?? null;
          sourceLine = lineMatch[2] ?? null;
        } else {
          sourcePath = name;
        }
        if (sourcePath) {
          const pathParts = sourcePath.split("/");
          filename = pathParts[pathParts.length - 1] ?? null;
        }
      }
      return {
        sourcePath,
        sourceLine,
        filename,
        scalaName: null,
        isMarked: false,
        isReact: true,
        displayName: reactInfo.name,
        props: reactInfo.props,
        fiber: reactInfo.fiber
      };
    } catch {
      return null;
    }
  }

  // devtools/core.ts
  class MutationScanner {
    #observer = null;
    #canvas = null;
    #running = false;
    #paused = false;
    #onStateChange = null;
    constructor(options = {}) {
      this.#onStateChange = options.onStateChange ?? null;
    }
    get isRunning() {
      return this.#running;
    }
    start() {
      if (this.#running)
        return;
      this.#running = true;
      this.#canvas = new HighlightCanvas;
      this.#canvas.create();
      this.#observer = new MutationObserver((mutations) => this.#handleMutations(mutations));
      this.#observer.observe(document.body, {
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true
      });
      this.#onStateChange?.(true);
    }
    stop() {
      if (!this.#running)
        return;
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
    toggle() {
      if (this.#running) {
        this.stop();
      } else {
        this.start();
      }
    }
    pause() {
      this.#paused = true;
      this.#canvas?.pause();
    }
    resume() {
      this.#paused = false;
      this.#canvas?.resume();
    }
    #handleMutations(mutations) {
      if (!this.#running || this.#paused)
        return;
      for (const record of mutations) {
        const target = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
        if (!target || isDevtoolsElement(target))
          continue;
        this.#highlightElement(target);
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && !isDevtoolsElement(node)) {
            this.#highlightElement(node);
          }
        }
      }
    }
    #highlightElement(element) {
      if (!this.#canvas)
        return;
      if (!element.isConnected)
        return;
      let name = getScalaSource(element);
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

  class ComponentInspector {
    #state = "off";
    #overlay = null;
    #eventCatcher = null;
    #lastHovered = null;
    #onStateChange = null;
    #boundHandlePointerMove;
    #boundHandleClick;
    #boundHandleKeydown;
    constructor(options = {}) {
      this.#onStateChange = options.onStateChange ?? null;
      this.#boundHandlePointerMove = this.#handlePointerMove.bind(this);
      this.#boundHandleClick = this.#handleClick.bind(this);
      this.#boundHandleKeydown = this.#handleKeydown.bind(this);
    }
    get isInspecting() {
      return this.#state === "inspecting";
    }
    start() {
      if (this.#state !== "off")
        return;
      this.#state = "inspecting";
      this.#overlay = new InspectOverlay;
      const canvas = this.#overlay.create();
      document.body.appendChild(canvas);
      this.#eventCatcher = this.#createEventCatcher();
      document.body.appendChild(this.#eventCatcher);
      requestAnimationFrame(() => {
        this.#overlay?.show();
        if (this.#eventCatcher) {
          this.#eventCatcher.style.pointerEvents = "auto";
        }
      });
      document.addEventListener("pointermove", this.#boundHandlePointerMove, {
        passive: true,
        capture: true
      });
      document.addEventListener("click", this.#boundHandleClick, { capture: true });
      document.addEventListener("keydown", this.#boundHandleKeydown);
      this.#onStateChange?.(true);
    }
    stop() {
      if (this.#state === "off")
        return;
      this.#state = "off";
      document.removeEventListener("pointermove", this.#boundHandlePointerMove, { capture: true });
      document.removeEventListener("click", this.#boundHandleClick, { capture: true });
      document.removeEventListener("keydown", this.#boundHandleKeydown);
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
    toggle() {
      if (this.#state === "off") {
        this.start();
      } else {
        this.stop();
      }
    }
    #createEventCatcher() {
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
        cursor: "crosshair"
      });
      return div;
    }
    #handlePointerMove(e) {
      if (this.#state !== "inspecting")
        return;
      if (this.#lastHovered && !this.#lastHovered.isConnected) {
        this.#lastHovered = null;
        this.#overlay?.clear();
      }
      if (!this.#eventCatcher)
        return;
      this.#eventCatcher.style.pointerEvents = "none";
      const element = document.elementFromPoint(e.clientX, e.clientY);
      this.#eventCatcher.style.pointerEvents = "auto";
      if (!element)
        return;
      let component = getScalaComponent(element);
      let info = null;
      if (component) {
        info = getComponentSourceInfo(component.element);
      } else {
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
      if (component.element === this.#lastHovered)
        return;
      this.#lastHovered = component.element;
      const rect = component.element.getBoundingClientRect();
      this.#overlay?.animateTo({ left: rect.left, top: rect.top, width: rect.width, height: rect.height }, component.name ?? "Unknown", info ?? {});
    }
    #handleClick(e) {
      if (this.#state !== "inspecting")
        return;
      if (isDevtoolsElement(e.target) && e.target !== this.#eventCatcher)
        return;
      e.preventDefault();
      e.stopPropagation();
      if (!this.#eventCatcher)
        return;
      this.#eventCatcher.style.pointerEvents = "none";
      const element = document.elementFromPoint(e.clientX, e.clientY);
      this.#eventCatcher.style.pointerEvents = "auto";
      if (!element)
        return;
      const scalaComponent = getScalaComponent(element);
      if (scalaComponent) {
        const info = getComponentSourceInfo(scalaComponent.element);
        if (info?.sourcePath) {
          openInIDE(info.sourcePath, info.sourceLine);
          this.stop();
          return;
        }
      }
      const reactComponent = getReactComponent(element);
      if (reactComponent) {
        const info = getReactComponentSourceInfo(reactComponent.element);
        if (info?.sourcePath) {
          openInIDE(info.sourcePath, info.sourceLine);
          this.stop();
          return;
        }
        console.group(`%c⚛ React Component: ${reactComponent.name}`, "color: #61dafb; font-weight: bold;");
        console.log("Element:", reactComponent.element);
        if (info?.props) {
          console.log("Props:", info.props);
        }
        if (info?.fiber) {
          console.log("Fiber:", info.fiber);
        }
        const hierarchy = getAllReactComponentsFromNode(reactComponent.element);
        if (hierarchy.length > 1) {
          console.log("Component hierarchy:", hierarchy.map((c) => c.name).join(" → "));
        }
        console.groupEnd();
        this.stop();
        return;
      }
      console.warn("Devtools: No component found for element");
    }
    #handleKeydown(e) {
      if (e.key === "Escape" && this.#state === "inspecting") {
        this.stop();
      }
    }
  }

  // devtools/monitors.ts
  var FPS_HISTORY_SIZE = 360;

  class FPSMonitor {
    #fps = 0;
    #frameCount = 0;
    #lastTime = 0;
    #animationId = null;
    #paused = false;
    #initialized = false;
    #history = new Array(FPS_HISTORY_SIZE).fill(-1);
    #historyIndex = 0;
    #lastHistorySample = 0;
    #totalSamples = 0;
    start() {
      if (this.#initialized && !this.#paused)
        return;
      this.#initialized = true;
      this.#paused = false;
      this.#lastTime = performance.now();
      this.#frameCount = 0;
      if (!this.#animationId) {
        this.#animationId = requestAnimationFrame(() => this.#tick());
      }
    }
    stop() {
      this.#cancelAnimation();
      this.#fps = 0;
      this.#frameCount = 0;
      this.#lastTime = 0;
      this.#initialized = false;
      this.#paused = false;
    }
    pause() {
      this.#paused = true;
      this.#cancelAnimation();
    }
    resume() {
      if (!this.#paused || !this.#initialized)
        return;
      this.#paused = false;
      this.#lastTime = performance.now();
      this.#frameCount = 0;
      if (!this.#animationId) {
        this.#animationId = requestAnimationFrame(() => this.#tick());
      }
    }
    getFPS() {
      if (!this.#initialized) {
        this.start();
        return 60;
      }
      return this.#fps;
    }
    getColor() {
      return this.#getColorForFPS(this.#fps);
    }
    #getColorForFPS(fps) {
      const { fpsCritical, fpsWarning } = CONFIG.thresholds;
      const { fpsCritical: criticalColor, fpsWarning: warningColor, fpsGood: goodColor } = CONFIG.colors;
      if (fps < fpsCritical)
        return criticalColor;
      if (fps < fpsWarning)
        return warningColor;
      return goodColor;
    }
    getHistory() {
      return {
        history: this.#history,
        index: this.#historyIndex,
        totalSamples: this.#totalSamples
      };
    }
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
      if (now - this.#lastHistorySample >= 16.67) {
        this.#history[this.#historyIndex] = this.#fps;
        this.#historyIndex = (this.#historyIndex + 1) % FPS_HISTORY_SIZE;
        this.#lastHistorySample = now;
        this.#totalSamples++;
      }
      this.#animationId = requestAnimationFrame(() => this.#tick());
    }
    #cancelAnimation() {
      if (this.#animationId) {
        cancelAnimationFrame(this.#animationId);
        this.#animationId = null;
      }
    }
  }

  class LagRadar {
    #root = null;
    #hand = null;
    #arcs = [];
    #animationId = null;
    #size = 200;
    #running = false;
    #frames = 50;
    #speed = 0.0017;
    #inset = 3;
    #last = null;
    #framePtr = 0;
    #middle = 0;
    #radius = 0;
    constructor(_fpsMonitor, options = {}) {
      this.#size = options.size || 200;
      this.#frames = options.frames || 50;
      this.#speed = options.speed || 0.0017;
      this.#inset = options.inset || 3;
      this.#middle = this.#size / 2;
      this.#radius = this.#middle - this.#inset;
    }
    #svg(tag, props = {}, children = []) {
      const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.entries(props).forEach(([prop, value]) => el.setAttribute(prop, value));
      children.forEach((child) => el.appendChild(child));
      return el;
    }
    create() {
      if (this.#root)
        return this.#root;
      const styles = document.createTextNode(`
      .lagRadar-sweep > * { shape-rendering: crispEdges; }
      .lagRadar-face { fill: transparent; stroke: rgba(255, 255, 255, 0.85); stroke-width: 4px; }
      .lagRadar-hand { stroke: rgba(255, 255, 255, 0.85); stroke-width: 4px; stroke-linecap: round; }
    `);
      this.#hand = this.#svg("path", { class: "lagRadar-hand" });
      this.#arcs = new Array(this.#frames).fill("path").map(() => this.#svg("path"));
      this.#root = this.#svg("svg", { class: "lagRadar", height: String(this.#size), width: String(this.#size), style: "display: block; margin: 0 auto;" }, [
        this.#svg("style", { type: "text/css" }, [styles]),
        this.#svg("g", { class: "lagRadar-sweep" }, this.#arcs),
        this.#hand,
        this.#svg("circle", { class: "lagRadar-face", cx: String(this.#middle), cy: String(this.#middle), r: String(this.#radius) })
      ]);
      return this.#root;
    }
    start() {
      if (this.#running)
        return;
      this.#running = true;
      this.#last = { rotation: 0, now: Date.now(), tx: this.#middle + this.#radius, ty: this.#middle };
      this.#framePtr = 0;
      this.#animate();
    }
    stop() {
      this.#running = false;
      if (this.#animationId) {
        cancelAnimationFrame(this.#animationId);
        this.#animationId = null;
      }
    }
    destroy() {
      this.stop();
      if (this.#root)
        this.#root.remove();
      this.#root = null;
      this.#hand = null;
      this.#arcs = [];
    }
    #calcHue(msDelta) {
      const maxHue = 120, maxMs = 1000, logF = 10;
      const mult = maxHue / Math.log(maxMs / logF);
      return maxHue - Math.max(0, Math.min(mult * Math.log(msDelta / logF), maxHue));
    }
    #animate() {
      if (!this.#running || !this.#last)
        return;
      const PI2 = Math.PI * 2, middle = this.#middle, radius = this.#radius, frames = this.#frames;
      const now = Date.now();
      const rdelta = Math.min(PI2 - this.#speed, this.#speed * (now - this.#last.now));
      const rotation = (this.#last.rotation + rdelta) % PI2;
      const tx = middle + radius * Math.cos(rotation);
      const ty = middle + radius * Math.sin(rotation);
      const bigArc = rdelta < Math.PI ? "0" : "1";
      const path = `M${tx} ${ty}A${radius} ${radius} 0 ${bigArc} 0 ${this.#last.tx} ${this.#last.ty}L${middle} ${middle}`;
      const hue = this.#calcHue(rdelta / this.#speed);
      this.#arcs[this.#framePtr % frames]?.setAttribute("d", path);
      this.#arcs[this.#framePtr % frames]?.setAttribute("fill", `hsl(${hue}, 80%, 40%)`);
      if (this.#hand)
        this.#hand.setAttribute("d", `M${middle} ${middle}L${tx} ${ty}`);
      for (let i = 0;i < frames; i++) {
        const arc = this.#arcs[(frames + this.#framePtr - i) % frames];
        if (arc)
          arc.style.fillOpacity = String(1 - i / frames);
      }
      this.#framePtr++;
      this.#last = { now, rotation, tx, ty };
      this.#animationId = requestAnimationFrame(() => this.#animate());
    }
  }

  class MemoryMonitor {
    static isSupported() {
      return !!(performance.memory && typeof performance.memory.usedJSHeapSize === "number");
    }
    getInfo() {
      const memory = performance.memory;
      if (!memory || typeof memory.usedJSHeapSize !== "number")
        return null;
      const bytesToMB = (bytes) => Math.round(bytes / (1024 * 1024));
      const usedMB = bytesToMB(memory.usedJSHeapSize);
      const totalMB = bytesToMB(memory.totalJSHeapSize);
      const limitMB = bytesToMB(memory.jsHeapSizeLimit);
      const percent = Math.round(memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100);
      return { usedMB, totalMB, limitMB, percent };
    }
    getColor(percent) {
      const { memoryCritical, memoryWarning } = CONFIG.thresholds;
      const { memoryCritical: criticalColor, memoryWarning: warningColor, memoryHealthy: healthyColor } = CONFIG.colors;
      if (percent > memoryCritical)
        return criticalColor;
      if (percent > memoryWarning)
        return warningColor;
      return healthyColor;
    }
  }

  // devtools/ui.ts
  var TooltipState = {
    IDLE: "idle",
    PINNED: "pinned",
    SUSPENDED: "suspended"
  };

  class TooltipManager {
    #element = null;
    #contentElement = null;
    #hideTimeout = null;
    #showTimeout = null;
    #lastElementX = null;
    #cleanupFns = [];
    #state = TooltipState.IDLE;
    #stateBeforeSuspend = TooltipState.IDLE;
    create() {
      const container = document.createElement("div");
      container.className = "devtools-tooltip";
      const liveIndicator = document.createElement("div");
      liveIndicator.className = "live-indicator";
      container.appendChild(liveIndicator);
      const content = document.createElement("div");
      content.className = "devtools-tooltip-content";
      container.appendChild(content);
      this.#element = container;
      this.#contentElement = content;
      return { container, content };
    }
    setupEvents(container) {
      const tooltipElements = container.querySelectorAll("[data-tooltip]");
      for (const el of tooltipElements) {
        const handleMouseEnter = () => {
          if (this.#state !== TooltipState.IDLE)
            return;
          this.#cancelHideTimeout();
          const tooltipText = el.getAttribute("data-tooltip");
          const rect = el.getBoundingClientRect();
          const currentX = rect.left + rect.width / 2;
          let direction = "left";
          if (this.#lastElementX !== null) {
            direction = currentX > this.#lastElementX ? "left" : "right";
          }
          this.#lastElementX = currentX;
          if (this.#element?.classList.contains("visible")) {
            this.#showContent(tooltipText, direction);
          } else {
            this.#cancelShowTimeout();
            this.#showTimeout = setTimeout(() => {
              this.#showContent(tooltipText, direction);
              this.#showTimeout = null;
            }, CONFIG.intervals.tooltipShowDelay ?? 300);
          }
        };
        const handleMouseLeave = () => {
          if (this.#state !== TooltipState.IDLE)
            return;
          this.#cancelShowTimeout();
          this.#hideTimeout = setTimeout(() => {
            this.#hideTooltip();
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
    pin(text) {
      this.#cancelAllTimeouts();
      this.#state = TooltipState.PINNED;
      this.#element?.classList.add("pinned");
      if (this.#contentElement) {
        this.#contentElement.innerHTML = text;
        this.#contentElement.style.transform = "translateX(0)";
        this.#contentElement.style.opacity = "1";
      }
      this.#element?.classList.add("visible");
    }
    pinElement(element) {
      this.#cancelAllTimeouts();
      this.#state = TooltipState.PINNED;
      this.#element?.classList.add("pinned");
      if (this.#contentElement) {
        this.#contentElement.innerHTML = "";
        this.#contentElement.appendChild(element);
        this.#contentElement.style.transform = "translateX(0)";
        this.#contentElement.style.opacity = "1";
      }
      this.#element?.classList.add("visible");
    }
    unpin() {
      this.#state = TooltipState.IDLE;
      this.#element?.classList.remove("pinned");
      this.#hideTooltip();
    }
    updatePinnedContent(text) {
      if (this.#state === TooltipState.PINNED && this.#contentElement) {
        this.#contentElement.innerHTML = text;
      }
    }
    isPinned() {
      return this.#state === TooltipState.PINNED;
    }
    getElement() {
      return this.#element;
    }
    suspend() {
      if (this.#state === TooltipState.SUSPENDED)
        return;
      this.#stateBeforeSuspend = this.#state;
      this.#state = TooltipState.SUSPENDED;
      this.#cancelAllTimeouts();
      if (this.#stateBeforeSuspend !== TooltipState.PINNED) {
        this.#hideTooltip();
      }
    }
    resume() {
      if (this.#state !== TooltipState.SUSPENDED)
        return;
      this.#state = this.#stateBeforeSuspend;
    }
    destroy() {
      this.#cancelAllTimeouts();
      for (const cleanup of this.#cleanupFns) {
        cleanup();
      }
      this.#cleanupFns = [];
      this.#element = null;
      this.#contentElement = null;
      this.#lastElementX = null;
    }
    #showContent(text, direction = "left") {
      if (!this.#element || !this.#contentElement)
        return;
      const content = this.#contentElement;
      const tooltip = this.#element;
      const displayText = text ?? "";
      if (!tooltip.classList.contains("visible")) {
        content.innerHTML = displayText;
        content.style.transform = "translateX(0)";
        content.style.opacity = "1";
        tooltip.classList.add("visible");
        return;
      }
      const slideOutX = direction === "left" ? "15px" : "-15px";
      const slideInX = direction === "left" ? "-15px" : "15px";
      const slideMs = CONFIG.animation.tooltipSlideMs;
      content.style.transition = `transform ${slideMs}ms ease-out, opacity ${slideMs}ms ease-out`;
      content.style.transform = `translateX(${slideOutX})`;
      content.style.opacity = "0";
      setTimeout(() => {
        content.innerHTML = displayText;
        content.style.transition = "none";
        content.style.transform = `translateX(${slideInX})`;
        content.offsetWidth;
        content.style.transition = `transform ${slideMs + 30}ms ease-out, opacity ${slideMs + 30}ms ease-out`;
        content.style.transform = "translateX(0)";
        content.style.opacity = "1";
      }, slideMs);
    }
    #hideTooltip() {
      if (!this.#element)
        return;
      this.#element.classList.remove("visible");
      this.#lastElementX = null;
    }
    #cancelAllTimeouts() {
      if (this.#hideTimeout) {
        clearTimeout(this.#hideTimeout);
        this.#hideTimeout = null;
      }
      if (this.#showTimeout) {
        clearTimeout(this.#showTimeout);
        this.#showTimeout = null;
      }
    }
    #cancelHideTimeout() {
      if (this.#hideTimeout) {
        clearTimeout(this.#hideTimeout);
        this.#hideTimeout = null;
      }
    }
    #cancelShowTimeout() {
      if (this.#showTimeout) {
        clearTimeout(this.#showTimeout);
        this.#showTimeout = null;
      }
    }
  }

  class DragController {
    #element = null;
    #isDragging = false;
    #position = { x: 0, y: 0 };
    #corner = "bottom-right";
    #collapsed = null;
    #transitionTimeoutId = null;
    #onDragStart = null;
    #onDragEnd = null;
    #onPositionChange = null;
    #onCollapse = null;
    #onExpand = null;
    constructor(options = {}) {
      this.#onDragStart = options.onDragStart ?? null;
      this.#onDragEnd = options.onDragEnd ?? null;
      this.#onPositionChange = options.onPositionChange ?? null;
      this.#onCollapse = options.onCollapse ?? null;
      this.#onExpand = options.onExpand ?? null;
    }
    get isDragging() {
      return this.#isDragging;
    }
    get position() {
      return { ...this.#position };
    }
    get corner() {
      return this.#corner;
    }
    get collapsed() {
      return this.#collapsed ? { ...this.#collapsed } : null;
    }
    init(element) {
      this.#element = element;
      element.addEventListener("pointerdown", (e) => this.#handlePointerDown(e));
    }
    setPosition(position, corner) {
      this.#position = { ...position };
      if (corner)
        this.#corner = corner;
      this.#applyPosition(false);
    }
    setCollapsed(state) {
      this.#collapsed = state ? { ...state } : null;
      if (state) {
        this.#corner = state.corner;
      }
    }
    snapToCorner(corner, width, height) {
      this.#corner = corner;
      this.#position = this.#calculatePosition(corner, width, height);
      this.#applyPosition(true);
    }
    expand() {
      if (!this.#collapsed)
        return;
      const savedCorner = this.#collapsed.corner;
      this.#collapsed = null;
      this.#onExpand?.(savedCorner);
    }
    #handlePointerDown(e) {
      const target = e.target;
      if (target.closest("button") || target.closest("input") || target.closest("label") || target.closest(".clickable")) {
        return;
      }
      e.preventDefault();
      if (!this.#element)
        return;
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
      toolbar.setPointerCapture(e.pointerId);
      const pointerId = e.pointerId;
      const handlePointerMove = (moveEvent) => {
        lastMouseX = moveEvent.clientX;
        lastMouseY = moveEvent.clientY;
        if (rafId)
          return;
        rafId = requestAnimationFrame(() => {
          const deltaX = lastMouseX - initialMouseX;
          const deltaY = lastMouseY - initialMouseY;
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
        if (!hasMoved)
          return;
        const totalDeltaX = Math.abs(lastMouseX - initialMouseX);
        const totalDeltaY = Math.abs(lastMouseY - initialMouseY);
        const totalMovement = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);
        if (totalMovement < CONFIG.thresholds.snapDistance) {
          this.#position = this.#calculatePosition(this.#corner, toolbar.offsetWidth, toolbar.offsetHeight);
          this.#applyPosition(true);
          return;
        }
        const toolbarWidth = CONFIG.dimensions.toolbarWidth;
        const toolbarHeight = toolbar.offsetHeight || 40;
        if (this.#shouldCollapse(currentX, currentY, toolbarWidth, toolbarHeight)) {
          const target2 = this.#getCollapseTarget(currentX, currentY, toolbarWidth, toolbarHeight);
          if (target2) {
            this.#collapsed = target2;
            this.#corner = target2.corner;
            this.#onCollapse?.(target2.corner, target2.orientation);
            return;
          }
        }
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
    #handleCollapsedDrag(e) {
      if (!this.#collapsed)
        return;
      const { corner, orientation } = this.#collapsed;
      const initialMouseX = e.clientX;
      const initialMouseY = e.clientY;
      let hasExpanded = false;
      const handlePointerMove = (moveEvent) => {
        if (hasExpanded)
          return;
        const deltaX = moveEvent.clientX - initialMouseX;
        const deltaY = moveEvent.clientY - initialMouseY;
        const threshold = CONFIG.thresholds.expandDragDistance;
        let shouldExpand = false;
        if (orientation === "horizontal") {
          if (corner.endsWith("left") && deltaX > threshold)
            shouldExpand = true;
          else if (corner.endsWith("right") && deltaX < -threshold)
            shouldExpand = true;
        } else {
          if (corner.startsWith("top") && deltaY > threshold)
            shouldExpand = true;
          else if (corner.startsWith("bottom") && deltaY < -threshold)
            shouldExpand = true;
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
    #applyPosition(animate) {
      if (!this.#element)
        return;
      const style = this.#element.style;
      style.left = "0";
      style.top = "0";
      if (animate) {
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
        return movingRight ? isBottom ? "bottom-right" : "top-right" : isBottom ? "bottom-left" : "top-left";
      }
      if (movingDown || movingUp) {
        const isRight = mouseX > centerX;
        return movingDown ? isRight ? "bottom-right" : "bottom-left" : isRight ? "top-right" : "top-left";
      }
      return mouseX > centerX ? mouseY > centerY ? "bottom-right" : "top-right" : mouseY > centerY ? "bottom-left" : "top-left";
    }
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
    #getCollapseTarget(x, y, width, height) {
      const outsideLeft = -x;
      const outsideRight = x + width - window.innerWidth;
      const outsideTop = -y;
      const outsideBottom = y + height - window.innerHeight;
      const maxOutside = Math.max(outsideLeft, outsideRight, outsideTop, outsideBottom);
      if (maxOutside < 0)
        return null;
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
    destroy() {
      if (this.#transitionTimeoutId) {
        clearTimeout(this.#transitionTimeoutId);
        this.#transitionTimeoutId = null;
      }
      this.#element = null;
    }
  }

  // devtools/toolbar.ts
  class Toolbar {
    #root = null;
    #shadowRoot = null;
    #toolbar = null;
    #content = null;
    #expandButton = null;
    #inspectButton = null;
    #scanningToggle = null;
    #fpsValueElement = null;
    #memoryValueElement = null;
    #fpsMonitor = new FPSMonitor;
    #memoryMonitor = new MemoryMonitor;
    #tooltipManager = new TooltipManager;
    #lagRadarTooltipManager = new TooltipManager;
    #domStatsTooltipManager = new TooltipManager;
    #dragController = null;
    #fpsIntervalId = null;
    #memoryIntervalId = null;
    #domStatsIntervalId = null;
    #prevDomCounts = null;
    #prevTotalNodes = null;
    #lagRadar = null;
    #fpsMeterElement = null;
    #lagRadarPinned = false;
    #domStatsPinned = false;
    #pinnedOrder = [];
    #onScanningToggle = null;
    #onInspectToggle = null;
    constructor(options = {}) {
      this.#onScanningToggle = options.onScanningToggle ?? null;
      this.#onInspectToggle = options.onInspectToggle ?? null;
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
          this.#updateCornerClasses();
          this.#updateTooltipStacking();
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
        }
      });
    }
    mount() {
      if (this.#root)
        return;
      const existing = document.getElementById("devtools-root");
      if (existing) {
        console.warn("Devtools: Toolbar already exists in DOM, skipping mount");
        return;
      }
      this.#root = document.createElement("div");
      this.#root.id = "devtools-root";
      this.#root.setAttribute(CONFIG.attributes.devtools, "toolbar");
      this.#shadowRoot = this.#root.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = STYLES;
      this.#shadowRoot.appendChild(style);
      this.#toolbar = this.#createToolbar();
      this.#shadowRoot.appendChild(this.#toolbar);
      document.documentElement.appendChild(this.#root);
      requestAnimationFrame(() => {
        this.#initPosition();
        this.#updateTooltipStacking();
      });
      window.addEventListener("resize", () => this.#handleResize());
      this.#startDisplayUpdates();
    }
    unmount() {
      this.#stopDisplayUpdates();
      this.#fpsMonitor.stop();
      this.#tooltipManager.destroy();
      this.#lagRadarTooltipManager.destroy();
      this.#domStatsTooltipManager.destroy();
      this.#dragController?.destroy();
      if (this.#lagRadar) {
        this.#lagRadar.destroy();
        this.#lagRadar = null;
      }
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
    updateInspectButton(isInspecting) {
      if (!this.#inspectButton)
        return;
      this.#inspectButton.classList.toggle("active", isInspecting);
      this.#inspectButton.innerHTML = isInspecting ? ICONS["close"] ?? "" : ICONS["inspect"] ?? "";
      this.#inspectButton.setAttribute("data-tooltip", isInspecting ? "Exit inspect mode — or press Esc" : "Inspect component (Ctrl+Shift+C) — click to jump to source code in your IDE");
    }
    #createToolbar() {
      const toolbar = document.createElement("div");
      toolbar.className = "devtools-toolbar";
      this.#dragController?.init(toolbar);
      this.#expandButton = this.#createExpandButton();
      this.#expandButton.style.display = "none";
      toolbar.appendChild(this.#expandButton);
      this.#content = document.createElement("div");
      this.#content.style.cssText = "display: flex; align-items: center; gap: 8px;";
      this.#inspectButton = this.#createInspectButton();
      this.#content.appendChild(this.#inspectButton);
      const toggle = this.#createScanningToggle();
      this.#content.appendChild(toggle);
      const fpsMeter = this.#createFPSMeter();
      this.#content.appendChild(fpsMeter);
      if (MemoryMonitor.isSupported()) {
        const memoryMeter = this.#createMemoryMeter();
        this.#content.appendChild(memoryMeter);
      }
      const domStatsBtn = this.#createDomStatsButton();
      this.#content.appendChild(domStatsBtn);
      toolbar.appendChild(this.#content);
      const { container: tooltip } = this.#tooltipManager.create();
      toolbar.appendChild(tooltip);
      const { container: lagRadarTooltip } = this.#lagRadarTooltipManager.create();
      toolbar.appendChild(lagRadarTooltip);
      const { container: domStatsTooltip } = this.#domStatsTooltipManager.create();
      toolbar.appendChild(domStatsTooltip);
      this.#tooltipManager.setupEvents(toolbar);
      return toolbar;
    }
    #createExpandButton() {
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
    #createInspectButton() {
      const btn = document.createElement("button");
      btn.className = "devtools-icon-btn";
      btn.setAttribute("data-tooltip", `Inspect component (Ctrl+Shift+C) 
 Click to jump to source code in your IDE`);
      btn.innerHTML = ICONS["inspect"] ?? "";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.#onInspectToggle?.();
      });
      return btn;
    }
    #createScanningToggle() {
      const toggle = document.createElement("label");
      toggle.className = "devtools-toggle";
      toggle.setAttribute("data-tooltip", `Highlight DOM mutations 
 Detect unexpected re-renders`);
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
    #createFPSMeter() {
      const container = document.createElement("div");
      container.className = "devtools-meter clickable";
      container.setAttribute("data-tooltip", `Frames per second 
 Click to show lag radar`);
      const value = document.createElement("span");
      value.className = "devtools-meter-value";
      value.textContent = "60";
      this.#fpsValueElement = value;
      const label = document.createElement("span");
      label.className = "devtools-meter-label";
      label.textContent = "FPS";
      container.appendChild(value);
      container.appendChild(label);
      this.#fpsMeterElement = container;
      container.addEventListener("click", (e) => {
        e.stopPropagation();
        this.#toggleLagRadarPin();
      });
      if (StorageManager.isLagRadarPinned()) {
        requestAnimationFrame(() => {
          this.#pinLagRadar();
        });
      }
      return container;
    }
    #createLagRadarContent() {
      const container = document.createElement("div");
      container.className = "devtools-radar-container";
      this.#lagRadar = new LagRadar(this.#fpsMonitor, {
        size: CONFIG.dimensions.radarSize
      });
      const canvas = this.#lagRadar.create();
      container.appendChild(canvas);
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
    #updateTooltipStacking() {
      const lagRadarTooltip = this.#lagRadarTooltipManager.getElement();
      const domStatsTooltip = this.#domStatsTooltipManager.getElement();
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
      const isTop = this.#toolbar?.classList.contains("corner-top") ?? false;
      const baseGap = 8;
      const tooltipGap = 8;
      let accumulatedOffset = baseGap;
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
          if (isTop) {
            tooltip.style.top = `calc(100% + ${accumulatedOffset}px)`;
          } else {
            tooltip.style.bottom = `calc(100% + ${accumulatedOffset}px)`;
          }
          const tooltipHeight = tooltip.offsetHeight || CONFIG.dimensions.tooltipMinHeight;
          accumulatedOffset += tooltipHeight + tooltipGap;
        }
      });
    }
    #pinLagRadar() {
      if (!this.#fpsMeterElement)
        return;
      this.#lagRadarPinned = true;
      this.#fpsMeterElement.classList.add("active");
      StorageManager.setLagRadarPinned(true);
      if (!this.#pinnedOrder.includes("lagRadar")) {
        this.#pinnedOrder.push("lagRadar");
      }
      const radarContent = this.#createLagRadarContent();
      this.#lagRadarTooltipManager.pinElement(radarContent);
      this.#updateTooltipStacking();
      this.#lagRadar?.start();
    }
    #unpinLagRadar() {
      if (!this.#fpsMeterElement)
        return;
      this.#lagRadarPinned = false;
      this.#fpsMeterElement.classList.remove("active");
      StorageManager.setLagRadarPinned(false);
      this.#pinnedOrder = this.#pinnedOrder.filter((id) => id !== "lagRadar");
      this.#lagRadarTooltipManager.unpin();
      this.#updateTooltipStacking();
      if (this.#lagRadar) {
        const radar = this.#lagRadar;
        this.#lagRadar = null;
        setTimeout(() => {
          radar.destroy();
        }, CONFIG.animation.tooltipFadeMs);
      }
    }
    #toggleLagRadarPin() {
      if (this.#lagRadarPinned) {
        this.#unpinLagRadar();
      } else {
        this.#pinLagRadar();
      }
    }
    #createMemoryMeter() {
      const container = document.createElement("div");
      container.className = "devtools-meter";
      container.setAttribute("data-tooltip", `JS heap memory usage 
 Detect memory leaks and excessive allocations`);
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
    #createDomStatsButton() {
      const btn = document.createElement("button");
      btn.className = "devtools-icon-btn";
      btn.innerHTML = ICONS["domTree"] ?? "";
      btn.setAttribute("data-tooltip", `DOM statistics 
 Click to pin`);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.#toggleDomStatsPin(btn);
      });
      if (StorageManager.isDomStatsPinned()) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.#pinDomStats(btn);
          });
        });
      }
      return btn;
    }
    #pinDomStats(btn) {
      this.#domStatsPinned = true;
      btn.classList.add("active");
      StorageManager.setDomStatsPinned(true);
      if (!this.#pinnedOrder.includes("domStats")) {
        this.#pinnedOrder.push("domStats");
      }
      const statsElement = this.#createDomStatsElement();
      this.#domStatsTooltipManager.pinElement(statsElement);
      this.#updateTooltipStacking();
      this.#domStatsIntervalId = setInterval(() => {
        this.#updateDomStatsElement(statsElement);
      }, 500);
    }
    #unpinDomStats(btn) {
      this.#domStatsPinned = false;
      this.#domStatsTooltipManager.unpin();
      btn.classList.remove("active");
      StorageManager.setDomStatsPinned(false);
      this.#pinnedOrder = this.#pinnedOrder.filter((id) => id !== "domStats");
      if (this.#domStatsIntervalId) {
        clearInterval(this.#domStatsIntervalId);
        this.#domStatsIntervalId = null;
      }
      this.#updateTooltipStacking();
    }
    #toggleDomStatsPin(btn) {
      if (this.#domStatsPinned) {
        this.#unpinDomStats(btn);
      } else {
        this.#pinDomStats(btn);
      }
    }
    #getDOMStatsData() {
      const body = document.body;
      if (!body)
        return { total: 0, counts: {}, sorted: [] };
      const allNodes = body.querySelectorAll("*");
      const totalNodes = allNodes.length;
      const counts = {};
      for (const el of allNodes) {
        const tag = el.tagName.toLowerCase();
        counts[tag] = (counts[tag] || 0) + 1;
      }
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
      return { total: totalNodes, counts, sorted };
    }
    #createOdometerHtml(newVal, oldVal) {
      const newStr = String(newVal);
      const oldStr = oldVal !== null ? String(oldVal) : newStr;
      let direction = "";
      if (oldVal !== null) {
        if (newVal > oldVal)
          direction = "increasing";
        else if (newVal < oldVal)
          direction = "decreasing";
      }
      const maxLen = Math.max(newStr.length, oldStr.length);
      const paddedNew = newStr.padStart(maxLen, " ");
      const paddedOld = oldStr.padStart(maxLen, " ");
      let digits = "";
      for (let i = 0;i < maxLen; i++) {
        const oldDigit = paddedOld[i] ?? " ";
        const newDigit = paddedNew[i] ?? " ";
        let digitAnim = "";
        if (oldDigit !== newDigit && oldVal !== null) {
          const oldNum = oldDigit === " " ? -1 : parseInt(oldDigit, 10);
          const newNum = newDigit === " " ? -1 : parseInt(newDigit, 10);
          if (newNum > oldNum || oldDigit === " " && newDigit !== " ") {
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
    #createDomStatsElement() {
      const { total, sorted } = this.#getDOMStatsData();
      const maxCount = sorted.length > 0 ? sorted[0]?.[1] ?? 1 : 1;
      const container = document.createElement("div");
      container.className = "devtools-dom-stats";
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
        bar.style.width = `${count / maxCount * 100}%`;
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
      this.#prevTotalNodes = total;
      this.#prevDomCounts = Object.fromEntries(sorted);
      return container;
    }
    #updateDomStatsElement(container) {
      const { total, sorted } = this.#getDOMStatsData();
      const maxCount = sorted.length > 0 ? sorted[0]?.[1] ?? 1 : 1;
      const totalEl = container.querySelector(".devtools-dom-stats-total");
      if (totalEl) {
        const prevTotal = parseInt(totalEl.dataset["value"] ?? "0", 10) || 0;
        if (total !== prevTotal) {
          totalEl.innerHTML = this.#createOdometerHtml(total, prevTotal);
          totalEl.dataset["value"] = String(total);
        }
      }
      const chart = container.querySelector(".devtools-dom-stats-chart");
      if (!chart)
        return;
      const rows = chart.querySelectorAll(".devtools-dom-stats-row");
      sorted.forEach(([tag, count], index) => {
        const row = rows[index];
        if (!row)
          return;
        const prevCount = this.#prevDomCounts?.[tag] ?? count;
        const hasChanged = count !== prevCount;
        const tagEl = row.querySelector(".devtools-dom-stats-tag");
        if (tagEl && tagEl.textContent !== tag) {
          tagEl.textContent = tag;
        }
        row.dataset["tag"] = tag;
        const bar = row.querySelector(".devtools-dom-stats-bar");
        if (bar) {
          bar.style.width = `${count / maxCount * 100}%`;
          if (hasChanged) {
            bar.classList.remove("increasing", "decreasing");
            bar.offsetWidth;
            bar.classList.add(count > prevCount ? "increasing" : "decreasing");
          }
          bar.dataset["count"] = String(count);
        }
        const countEl = row.querySelector(".devtools-dom-stats-count");
        if (countEl) {
          countEl.textContent = count.toLocaleString();
        }
      });
      this.#prevTotalNodes = total;
      this.#prevDomCounts = Object.fromEntries(sorted);
    }
    #initPosition() {
      if (!this.#toolbar || !this.#dragController)
        return;
      const collapsedState = StorageManager.getCollapsedState();
      if (collapsedState) {
        this.#dragController.setCollapsed(collapsedState);
        this.#applyCollapsedState(collapsedState.corner, collapsedState.orientation);
        return;
      }
      const saved = StorageManager.getToolbarPosition();
      const rect = this.#toolbar.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      let corner = "bottom-right";
      if (saved?.corner) {
        corner = saved.corner;
      }
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
    #applyCollapsedState(corner, orientation) {
      if (!this.#toolbar)
        return;
      if (this.#content)
        this.#content.style.display = "none";
      if (this.#expandButton)
        this.#expandButton.style.display = "flex";
      this.#toolbar.classList.add("collapsed", `collapsed-${orientation}`);
      this.#toolbar.classList.remove("edge-left", "edge-right", "edge-top", "edge-bottom");
      if (orientation === "horizontal") {
        this.#toolbar.classList.add(corner.endsWith("left") ? "edge-left" : "edge-right");
      } else {
        this.#toolbar.classList.add(corner.startsWith("top") ? "edge-top" : "edge-bottom");
      }
      const collapsedSize = orientation === "horizontal" ? CONFIG.dimensions.collapsedHorizontal : CONFIG.dimensions.collapsedVertical;
      const safeArea = CONFIG.dimensions.safeArea;
      let position;
      switch (corner) {
        case "top-left":
          position = orientation === "horizontal" ? { x: -1, y: safeArea } : { x: safeArea, y: -1 };
          break;
        case "bottom-left":
          position = orientation === "horizontal" ? { x: -1, y: window.innerHeight - collapsedSize.height - safeArea } : { x: safeArea, y: window.innerHeight - collapsedSize.height + 1 };
          break;
        case "top-right":
          position = orientation === "horizontal" ? { x: window.innerWidth - collapsedSize.width + 1, y: safeArea } : { x: window.innerWidth - collapsedSize.width - safeArea, y: -1 };
          break;
        case "bottom-right":
        default:
          position = orientation === "horizontal" ? { x: window.innerWidth - collapsedSize.width + 1, y: window.innerHeight - collapsedSize.height - safeArea } : { x: window.innerWidth - collapsedSize.width - safeArea, y: window.innerHeight - collapsedSize.height + 1 };
          break;
      }
      this.#dragController?.setPosition(position, corner);
    }
    #expandFromCollapsed(savedCorner) {
      if (!this.#toolbar)
        return;
      this.#tooltipManager.suspend();
      this.#lagRadarTooltipManager.suspend();
      this.#domStatsTooltipManager.suspend();
      this.#toolbar.classList.remove("collapsed", "collapsed-horizontal", "collapsed-vertical");
      this.#toolbar.classList.remove("edge-left", "edge-right", "edge-top", "edge-bottom");
      if (this.#content)
        this.#content.style.display = "flex";
      if (this.#expandButton)
        this.#expandButton.style.display = "none";
      requestAnimationFrame(() => {
        if (!this.#toolbar || !this.#dragController)
          return;
        const rect = this.#toolbar.getBoundingClientRect();
        this.#dragController.snapToCorner(savedCorner, CONFIG.dimensions.toolbarWidth, rect.height || 40);
        StorageManager.setToolbarPosition(savedCorner, this.#dragController.position);
        StorageManager.setCollapsedState(null);
        this.#updateCornerClasses();
        setTimeout(() => {
          this.#tooltipManager.resume();
          this.#lagRadarTooltipManager.resume();
          this.#domStatsTooltipManager.resume();
        }, 400);
      });
    }
    #updateCornerClasses() {
      if (!this.#toolbar || !this.#dragController)
        return;
      const corner = this.#dragController.corner;
      const isTop = corner.startsWith("top");
      const isLeft = corner.endsWith("left");
      this.#toolbar.classList.toggle("corner-top", isTop);
      this.#toolbar.classList.toggle("corner-left", isLeft);
    }
    #handleResize() {
      if (!this.#toolbar || !this.#dragController)
        return;
      const collapsed = this.#dragController.collapsed;
      if (collapsed) {
        this.#applyCollapsedState(collapsed.corner, collapsed.orientation);
      } else {
        const rect = this.#toolbar.getBoundingClientRect();
        const corner = this.#dragController.corner;
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
    #startDisplayUpdates() {
      this.#fpsMonitor.start();
      this.#fpsIntervalId = setInterval(() => {
        if (this.#fpsValueElement) {
          const fps = this.#fpsMonitor.getFPS();
          this.#fpsValueElement.textContent = String(fps);
          this.#fpsValueElement.style.color = this.#fpsMonitor.getColor();
        }
      }, CONFIG.intervals.fpsDisplay);
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

  // devtools/hotkeys.ts
  class HotkeyManager {
    #handlers = new Map;
    #active = false;
    #boundKeydown;
    constructor() {
      this.#boundKeydown = this.#handleKeydown.bind(this);
    }
    start() {
      if (this.#active)
        return;
      this.#active = true;
      document.addEventListener("keydown", this.#boundKeydown, { capture: true });
    }
    stop() {
      if (!this.#active)
        return;
      this.#active = false;
      document.removeEventListener("keydown", this.#boundKeydown, { capture: true });
    }
    register(combo, handler) {
      this.#handlers.set(combo.toLowerCase(), handler);
    }
    unregister(combo) {
      this.#handlers.delete(combo.toLowerCase());
    }
    #handleKeydown(e) {
      const parts = [];
      if (e.ctrlKey)
        parts.push("ctrl");
      if (e.metaKey)
        parts.push("meta");
      if (e.shiftKey)
        parts.push("shift");
      if (e.altKey)
        parts.push("alt");
      const key = e.key.toLowerCase();
      if (!["control", "shift", "alt", "meta"].includes(key)) {
        parts.push(key);
      }
      const combo = parts.join("+");
      const handler = this.#handlers.get(combo);
      if (handler) {
        e.preventDefault();
        e.stopPropagation();
        handler();
      }
    }
    destroy() {
      this.stop();
      this.#handlers.clear();
    }
  }

  // devtools/api.ts
  var Devtools = {
    _scanner: null,
    _inspector: null,
    _toolbar: null,
    _hotkeys: null,
    enable() {
      StorageManager.setString(CONFIG.storageKeys.enabled, "true");
      if (!this._toolbar) {
        this.init();
      }
      console.log("Devtools: Enabled. Toolbar is now visible.");
    },
    disable() {
      StorageManager.setString(CONFIG.storageKeys.enabled, "false");
      this.destroy();
      console.log("Devtools: Disabled. Toolbar hidden.");
    },
    isEnabled() {
      return StorageManager.isDevtoolsEnabled();
    },
    show() {
      if (!this._toolbar) {
        this.init();
      }
    },
    hide() {
      this.destroy();
    },
    init() {
      if (this._toolbar)
        return;
      this._scanner = new MutationScanner;
      this._inspector = new ComponentInspector({
        onStateChange: (inspecting) => {
          this._toolbar?.updateInspectButton(inspecting);
        }
      });
      this._toolbar = new Toolbar({
        onScanningToggle: (enabled) => {
          if (enabled) {
            this._scanner?.start();
          } else {
            this._scanner?.stop();
          }
        },
        onInspectToggle: () => {
          this._inspector?.toggle();
        }
      });
      this._toolbar.mount();
      this._hotkeys = new HotkeyManager;
      this._hotkeys.register("ctrl+shift+c", () => {
        this._inspector?.toggle();
      });
      this._hotkeys.start();
      if (StorageManager.isScanningEnabled()) {
        this._scanner?.start();
      }
    },
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
    isRunning() {
      return this._scanner?.isRunning ?? false;
    },
    start() {
      this._scanner?.start();
    },
    stop() {
      this._scanner?.stop();
    },
    toggle() {
      this._scanner?.toggle();
    },
    isInspecting() {
      return this._inspector?.isInspecting ?? false;
    },
    startInspect() {
      this._inspector?.start();
    },
    stopInspect() {
      this._inspector?.stop();
    },
    toggleInspect() {
      this._inspector?.toggle();
    }
  };
  window.Devtools = Devtools;

  // devtools/index.ts
  function initDevtools() {
    if (StorageManager.isDevtoolsEnabled()) {
      Devtools.init();
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDevtools);
  } else {
    initDevtools();
  }
})();
