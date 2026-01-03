// ============================================================================
// UTILITIES
// ============================================================================
// Pure helper functions with no side effects or dependencies.
// ============================================================================

import { CONFIG } from "./00-config.js";

/**
 * Linear interpolation between two values.
 * @param {number} start - Starting value
 * @param {number} end - Target value
 * @param {number} [speed] - Interpolation factor (0-1), defaults to CONFIG.animation.interpolationSpeed
 * @returns {number} Interpolated value
 */
export function lerp(start, end, speed = CONFIG.animation.interpolationSpeed) {
  return start + (end - start) * speed;
}

/**
 * Clamp a value between min and max bounds.
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Create a debounced version of a function.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function with cancel() method
 */
export function debounce(fn, delay) {
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
export function getDevicePixelRatio() {
  return Math.max(window.devicePixelRatio, 1);
}

/**
 * Check if an element is part of the devtools UI.
 * @param {Element} element - Element to check
 * @returns {boolean} True if element is a devtools element
 */
export function isDevtoolsElement(element) {
  if (!element) return false;
  const attr = CONFIG.attributes.devtools;
  return element.hasAttribute(attr) || element.closest(`[${attr}]`) !== null;
}

/**
 * Get Scala component info from an element or its ancestors.
 * @param {Element} element - Starting element
 * @returns {{ element: Element, name: string } | null} Component info or null
 */
export function getScalaComponent(element) {
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
export function getScalaSource(node) {
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
export function getComponentSourceInfo(element) {
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
export function openInIDE(sourcePath, sourceLine = null) {
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

