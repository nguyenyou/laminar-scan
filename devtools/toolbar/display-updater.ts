// ============================================================================
// DISPLAY UPDATER
// ============================================================================
// Manages FPS and memory display interval updates.
// ============================================================================

import { CONFIG } from "../config";
import { FPSMonitor, MemoryMonitor } from "../monitors";

interface DisplayElements {
  fpsValue: HTMLSpanElement | null;
  memoryValue: HTMLSpanElement | null;
}

/**
 * Manages periodic updates for FPS and memory display elements.
 */
export class DisplayUpdater {
  #fpsMonitor: FPSMonitor;
  #memoryMonitor: MemoryMonitor;
  #elements: DisplayElements;

  #fpsIntervalId: ReturnType<typeof setInterval> | null = null;
  #memoryIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    fpsMonitor: FPSMonitor,
    memoryMonitor: MemoryMonitor,
    elements: DisplayElements
  ) {
    this.#fpsMonitor = fpsMonitor;
    this.#memoryMonitor = memoryMonitor;
    this.#elements = elements;
  }

  /**
   * Update the display element references.
   */
  setElements(elements: DisplayElements): void {
    this.#elements = elements;
  }

  /**
   * Start FPS and memory display updates.
   */
  start(): void {
    this.#fpsMonitor.start();

    // FPS updates
    this.#fpsIntervalId = setInterval(() => {
      if (this.#elements.fpsValue) {
        const fps = this.#fpsMonitor.getFPS();
        this.#elements.fpsValue.textContent = String(fps);
        this.#elements.fpsValue.style.color = this.#fpsMonitor.getColor();
      }
    }, CONFIG.intervals.fpsDisplay);

    // Memory updates
    this.#memoryIntervalId = setInterval(() => {
      if (this.#elements.memoryValue) {
        const info = this.#memoryMonitor.getInfo();
        if (info) {
          this.#elements.memoryValue.textContent = String(info.usedMB);
          this.#elements.memoryValue.style.color = this.#memoryMonitor.getColor(info.percent);
        }
      }
    }, CONFIG.intervals.memoryDisplay);
  }

  /**
   * Stop display updates.
   */
  stop(): void {
    if (this.#fpsIntervalId) {
      clearInterval(this.#fpsIntervalId);
      this.#fpsIntervalId = null;
    }
    if (this.#memoryIntervalId) {
      clearInterval(this.#memoryIntervalId);
      this.#memoryIntervalId = null;
    }
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    this.stop();
    this.#fpsMonitor.stop();
  }
}

