// ============================================================================
// TOOLBAR ELEMENTS
// ============================================================================
// DOM element creation helpers for toolbar components.
// ============================================================================

import { ICONS } from "../config";
import { StorageManager } from "../storage";

// Tooltip messages
const INSPECT_TOOLTIP = "Inspect component (Ctrl+Shift+C) \n Click to jump to source code in your IDE";

/**
 * Create the expand button for collapsed state.
 */
export function createExpandButton(onExpand: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "devtools-expand-btn";
  btn.title = "Expand toolbar";
  btn.innerHTML = ICONS["chevronRight"] ?? "";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onExpand();
  });
  return btn;
}

/**
 * Create the inspect button.
 */
export function createInspectButton(onInspect: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "devtools-icon-btn";
  btn.setAttribute("data-tooltip", INSPECT_TOOLTIP);
  btn.innerHTML = ICONS["inspect"] ?? "";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onInspect();
  });
  return btn;
}

/**
 * Create the scanning toggle.
 */
export function createScanningToggle(onToggle: (enabled: boolean) => void): HTMLLabelElement {
  const toggle = document.createElement("label");
  toggle.className = "devtools-toggle";
  toggle.setAttribute("data-tooltip", "Highlight DOM mutations \n Detect unexpected re-renders");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = StorageManager.isScanningEnabled();
  checkbox.addEventListener("change", () => {
    onToggle(checkbox.checked);
    StorageManager.setScanningEnabled(checkbox.checked);
  });

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
 * Create the FPS meter display.
 */
export function createFPSMeter(onFPSClick: () => void): { container: HTMLDivElement; valueElement: HTMLSpanElement } {
  const container = document.createElement("div");
  container.className = "devtools-meter clickable";
  container.setAttribute("data-tooltip", "Frames per second \n Click to show lag radar");

  const value = document.createElement("span");
  value.className = "devtools-meter-value";
  value.textContent = "60";

  const label = document.createElement("span");
  label.className = "devtools-meter-label";
  label.textContent = "FPS";

  container.appendChild(value);
  container.appendChild(label);

  container.addEventListener("click", (e) => {
    e.stopPropagation();
    onFPSClick();
  });

  return { container, valueElement: value };
}

/**
 * Create the memory meter display.
 */
export function createMemoryMeter(): { container: HTMLDivElement; valueElement: HTMLSpanElement } {
  const container = document.createElement("div");
  container.className = "devtools-meter";
  container.setAttribute("data-tooltip", "JS heap memory usage \n Detect memory leaks and excessive allocations");

  const value = document.createElement("span");
  value.className = "devtools-meter-value memory";
  value.textContent = "--";

  const label = document.createElement("span");
  label.className = "devtools-meter-label";
  label.textContent = "MB";

  container.appendChild(value);
  container.appendChild(label);

  return { container, valueElement: value };
}

/**
 * Create the DOM stats button.
 */
export function createDomStatsButton(onDomStatsClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "devtools-icon-btn";
  btn.innerHTML = ICONS["domTree"] ?? "";
  btn.setAttribute("data-tooltip", "DOM statistics \n Click to pin");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onDomStatsClick();
  });

  return btn;
}

/**
 * Update the inspect button state.
 */
export function updateInspectButton(btn: HTMLButtonElement, isInspecting: boolean): void {
  btn.classList.toggle("active", isInspecting);
  btn.innerHTML = isInspecting ? (ICONS["close"] ?? "") : (ICONS["inspect"] ?? "");
  btn.setAttribute(
    "data-tooltip",
    isInspecting
      ? "Exit inspect mode — or press Esc"
      : INSPECT_TOOLTIP
  );
}

/**
 * Update FPS meter active state.
 */
export function updateFPSMeterActive(container: HTMLDivElement, active: boolean): void {
  container.classList.toggle("active", active);
}

/**
 * Update DOM stats button active state.
 */
export function updateDomStatsButtonActive(btn: HTMLButtonElement, active: boolean): void {
  btn.classList.toggle("active", active);
}

