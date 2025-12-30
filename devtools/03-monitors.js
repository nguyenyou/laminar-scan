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

