// ============================================================================
// PERFORMANCE MONITORS
// ============================================================================
// FPS and Memory monitoring with encapsulated state.
// ============================================================================

/** Number of FPS samples to keep for radar history (one full rotation) */
const FPS_HISTORY_SIZE = 360;

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

  /** @type {number[]} Circular buffer of FPS history samples (-1 = no data) */
  #history = new Array(FPS_HISTORY_SIZE).fill(-1);

  /** @type {number} Current write index in history buffer */
  #historyIndex = 0;

  /** @type {number} Timestamp of last history sample */
  #lastHistorySample = 0;

  /** @type {number} Total samples recorded (tracks rotations) */
  #totalSamples = 0;

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
   * Get the FPS history buffer for radar visualization.
   * @returns {{ history: number[], index: number, totalSamples: number }} History data
   */
  getHistory() {
    return {
      history: this.#history,
      index: this.#historyIndex,
      totalSamples: this.#totalSamples,
    };
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

    // Sample FPS history every ~16.67ms (360 samples over 6 seconds)
    if (now - this.#lastHistorySample >= 16.67) {
      this.#history[this.#historyIndex] = this.#fps;
      this.#historyIndex = (this.#historyIndex + 1) % FPS_HISTORY_SIZE;
      this.#lastHistorySample = now;
      this.#totalSamples++;
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
 * Renders an animated lag radar visualization.
 * Based on lag-radar by @mobz - colors based on frame delta time.
 * Green = smooth (small delta), Red = laggy (large delta).
 */
class LagRadar {
  /** @type {HTMLCanvasElement | null} Canvas element */
  #canvas = null;

  /** @type {CanvasRenderingContext2D | null} Canvas 2D context */
  #ctx = null;

  /** @type {number | null} RAF ID for animation loop */
  #animationId = null;

  /** @type {number} Size of the radar in pixels */
  #size = 200;

  /** @type {boolean} Whether radar is running */
  #running = false;

  /** @type {number} Number of arc frames to keep */
  #frames = 60;

  /** @type {number} Sweep speed in radians per millisecond */
  #speed = 0.0017;

  /** @type {{ rotation: number, now: number, tx: number, ty: number }} Last frame state */
  #last = null;

  /** @type {number} Current frame pointer */
  #framePtr = 0;

  /** @type {{ path: Path2D, hue: number }[]} Arc frame buffer */
  #arcBuffer = [];

  /**
   * Create a new FPSRadar (lag radar style).
   * @param {FPSMonitor} _fpsMonitor - Unused, kept for API compatibility
   * @param {{ size?: number, frames?: number, speed?: number }} [options] - Configuration options
   */
  constructor(_fpsMonitor, options = {}) {
    this.#size = options.size || 200;
    this.#frames = options.frames || 60;
    this.#speed = options.speed || 0.0017;
  }

  /**
   * Create and return the canvas element.
   * @returns {HTMLCanvasElement} The radar canvas
   */
  create() {
    if (this.#canvas) return this.#canvas;

    const canvas = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = this.#size * dpr;
    canvas.height = this.#size * dpr;
    canvas.style.width = `${this.#size}px`;
    canvas.style.height = `${this.#size}px`;
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
    canvas.style.borderRadius = "50%";

    this.#canvas = canvas;
    this.#ctx = canvas.getContext("2d");
    this.#ctx.scale(dpr, dpr);

    // Initialize arc buffer
    this.#arcBuffer = new Array(this.#frames).fill(null).map(() => ({ path: null, hue: 120 }));

    return canvas;
  }

  /**
   * Start the radar animation.
   */
  start() {
    if (this.#running) return;
    this.#running = true;
    
    const middle = this.#size / 2;
    const radius = middle - 4;
    
    this.#last = {
      rotation: 0,
      now: performance.now(),
      tx: middle + radius,
      ty: middle,
    };
    this.#framePtr = 0;
    
    this.#animationId = requestAnimationFrame(() => this.#draw());
  }

  /**
   * Stop the radar animation.
   */
  stop() {
    this.#running = false;
    if (this.#animationId) {
      cancelAnimationFrame(this.#animationId);
      this.#animationId = null;
    }
  }

  /**
   * Destroy the radar and cleanup resources.
   */
  destroy() {
    this.stop();
    this.#canvas = null;
    this.#ctx = null;
    this.#arcBuffer = [];
  }

  /**
   * Calculate hue based on frame delta (lag-radar algorithm).
   * Logarithmic scale: small delta = green (120), large delta = red (0)
   * @private
   * @param {number} msDelta - Milliseconds since last frame
   * @returns {number} Hue value (0-120)
   */
  #calcHue(msDelta) {
    const maxHue = 120;
    const maxMs = 1000;
    const logF = 10;
    const mult = maxHue / Math.log(maxMs / logF);
    return maxHue - Math.max(0, Math.min(mult * Math.log(msDelta / logF), maxHue));
  }

  /**
   * Main draw loop - lag-radar style.
   * Each frame draws an arc from last position to current position.
   * @private
   */
  #draw() {
    if (!this.#running || !this.#ctx || !this.#canvas) return;

    const ctx = this.#ctx;
    const size = this.#size;
    const middle = size / 2;
    const radius = middle - 4;
    const PI2 = Math.PI * 2;

    const now = performance.now();
    const timeDelta = now - this.#last.now;
    const rdelta = Math.min(PI2 - this.#speed, this.#speed * timeDelta);
    const rotation = (this.#last.rotation + rdelta) % PI2;
    const tx = middle + radius * Math.cos(rotation);
    const ty = middle + radius * Math.sin(rotation);

    // Calculate hue based on frame delta
    const hue = this.#calcHue(timeDelta);

    // Create arc path from current to last position
    const arcPath = new Path2D();
    arcPath.moveTo(middle, middle);
    arcPath.lineTo(tx, ty);
    // Arc from current to last
    const bigArc = rdelta < Math.PI ? 0 : 1;
    arcPath.arc(middle, middle, radius, rotation, this.#last.rotation, true);
    arcPath.closePath();

    // Store arc in buffer
    const bufferIdx = this.#framePtr % this.#frames;
    this.#arcBuffer[bufferIdx] = { path: arcPath, hue };

    // Clear and draw background
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(middle, middle, radius, 0, PI2);
    ctx.fillStyle = "#000";
    ctx.fill();

    // Draw all arcs with fading opacity
    for (let i = 0; i < this.#frames; i++) {
      const idx = (this.#frames + this.#framePtr - i) % this.#frames;
      const arc = this.#arcBuffer[idx];
      if (!arc || !arc.path) continue;

      const opacity = 1 - (i / this.#frames);
      ctx.fillStyle = `hsla(${arc.hue}, 80%, 50%, ${opacity})`;
      ctx.fill(arc.path);
    }

    // Draw sweep line (hand)
    ctx.beginPath();
    ctx.moveTo(middle, middle);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.stroke();

    // Draw circle outline
    ctx.beginPath();
    ctx.arc(middle, middle, radius, 0, PI2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Update state
    this.#framePtr++;
    this.#last = { now, rotation, tx, ty };

    // Continue animation
    this.#animationId = requestAnimationFrame(() => this.#draw());
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

