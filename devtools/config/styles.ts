// ============================================================================
// STYLES
// ============================================================================
// CSS styles for the toolbar and its components.
// Injected into Shadow DOM for style isolation.
// ============================================================================

import { CONFIG } from "./constants";

/**
 * CSS styles for the toolbar and its components.
 * Injected into Shadow DOM for style isolation.
 */
export const STYLES: string = `
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

  .odometer-digit {
    display: inline-block;
    position: relative;
    overflow: hidden;
    height: 1.3em;
  }

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

  .odometer-digit-inner.roll-up {
    animation: odometerRollUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .odometer-digit-inner.roll-down {
    animation: odometerRollDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .odometer.increasing {
    animation: pulseRed 0.5s ease-out;
  }

  .odometer.decreasing {
    animation: pulseGreen 0.5s ease-out;
  }

  @keyframes odometerRollUp {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }

  @keyframes odometerRollDown {
    0% { transform: translateY(-50%); }
    100% { transform: translateY(0); }
  }

  @keyframes pulseGreen {
    0% { color: inherit; text-shadow: none; }
    30% { color: #4ade80; text-shadow: 0 0 8px rgba(74, 222, 128, 0.5); }
    100% { color: inherit; text-shadow: none; }
  }

  @keyframes pulseRed {
    0% { color: inherit; text-shadow: none; }
    30% { color: #f87171; text-shadow: 0 0 8px rgba(248, 113, 113, 0.5); }
    100% { color: inherit; text-shadow: none; }
  }

  .odometer-digit:nth-child(1) .odometer-digit-inner { animation-delay: 0ms; }
  .odometer-digit:nth-child(2) .odometer-digit-inner { animation-delay: 30ms; }
  .odometer-digit:nth-child(3) .odometer-digit-inner { animation-delay: 60ms; }
  .odometer-digit:nth-child(4) .odometer-digit-inner { animation-delay: 90ms; }
  .odometer-digit:nth-child(5) .odometer-digit-inner { animation-delay: 120ms; }
  .odometer-digit:nth-child(6) .odometer-digit-inner { animation-delay: 150ms; }

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
    0% { transform: translateY(100%); opacity: 0; }
    60% { opacity: 1; }
    100% { transform: translateY(0); opacity: 1; }
  }

  @keyframes legacyRollDown {
    0% { transform: translateY(-100%); opacity: 0; }
    60% { opacity: 1; }
    100% { transform: translateY(0); opacity: 1; }
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

