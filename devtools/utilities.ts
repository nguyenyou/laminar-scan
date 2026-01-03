// ============================================================================
// UTILITIES
// ============================================================================
// Pure helper functions with no side effects or dependencies.
// ============================================================================

import { CONFIG } from "./config";

/**
 * Linear interpolation between two values.
 * @param start - Starting value
 * @param end - Target value
 * @param speed - Interpolation factor (0-1), defaults to CONFIG.animation.interpolationSpeed
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, speed: number = CONFIG.animation.interpolationSpeed): number {
  return start + (end - start) * speed;
}

/**
 * Clamp a value between min and max bounds.
 * @param value - Value to clamp
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
}

/**
 * Create a debounced version of a function.
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with cancel() method
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
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
 * @returns Device pixel ratio
 */
export function getDevicePixelRatio(): number {
  return Math.max(window.devicePixelRatio, 1);
}

/**
 * Check if an element is part of the devtools UI.
 * @param element - Element to check
 * @returns True if element is a devtools element
 */
export function isDevtoolsElement(element: Element | null): boolean {
  if (!element) return false;
  const attr = CONFIG.attributes.devtools;
  return element.hasAttribute(attr) || element.closest(`[${attr}]`) !== null;
}

interface ScalaComponentInfo {
  element: Element;
  name: string | null;
}

/**
 * Get Scala component info from an element or its ancestors.
 * @param element - Starting element
 * @returns Component info or null
 */
export function getScalaComponent(element: Element | null): ScalaComponentInfo | null {
  if (!element) return null;
  const attr = CONFIG.attributes.scalaComponent;
  const closest = element.closest(`[${attr}]`);
  if (!closest) return null;
  return {
    element: closest as Element,
    name: closest.getAttribute(attr),
  };
}

/**
 * Get the Scala source attribute value from an element or its ancestors.
 * @param node - Starting node
 * @returns Scala source identifier or null
 */
export function getScalaSource(node: Node | null): string | null {
  const element = node && node.nodeType === Node.ELEMENT_NODE ? (node as Element) : (node as Node)?.parentElement;
  if (!element) return null;

  const attr = CONFIG.attributes.scalaComponent;
  const value = element.getAttribute(attr);
  if (value) return value;

  const closest = element.closest(`[${attr}]`);
  return closest ? closest.getAttribute(attr) : null;
}

interface ComponentSourceInfo {
  sourcePath: string | null;
  sourceLine: string | null;
  filename: string | null;
  scalaName: string | null;
  isMarked: boolean;
  displayName: string | null;
}

/**
 * Extract all source information from a Scala component element.
 * @param element - Component element
 * @returns Source information object
 */
export function getComponentSourceInfo(element: Element | null): ComponentSourceInfo | null {
  if (!element) return null;

  const props = CONFIG.properties;
  const el = element as any;
  return {
    sourcePath: el[props.sourcePath] || null,
    sourceLine: el[props.sourceLine] !== undefined ? String(el[props.sourceLine]) : null,
    filename: el[props.filename] || null,
    scalaName: el[props.name] || null,
    isMarked: el[props.markAsComponent] === "true",
    displayName: element.getAttribute(CONFIG.attributes.scalaComponent),
  };
}

/**
 * Open a file in the IDE using the IDEA protocol.
 * @param sourcePath - File path to open
 * @param sourceLine - Optional line number
 */
export function openInIDE(sourcePath: string | null, sourceLine: string | null = null): void {
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

