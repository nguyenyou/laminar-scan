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
 * Renders an animated lag radar visualization using SVG.
 * Based on lag-radar by @mobz (Dan Abramov version).
 * Colors based on frame delta time: Green = smooth, Red = laggy.
 */
class LagRadar {
  /** @type {SVGSVGElement | null} SVG root element */
  #root = null;

  /** @type {SVGPathElement | null} Hand/sweep line element */
  #hand = null;

  /** @type {SVGPathElement[]} Arc path elements */
  #arcs = [];

  /** @type {number | null} RAF ID for animation loop */
  #animationId = null;

  /** @type {number} Size of the radar in pixels */
  #size = 200;

  /** @type {boolean} Whether radar is running */
  #running = false;

  /** @type {number} Number of arc frames to keep */
  #frames = 50;

  /** @type {number} Sweep speed in radians per millisecond */
  #speed = 0.0017;

  /** @type {number} Circle inset in pixels */
  #inset = 3;

  /** @type {{ rotation: number, now: number, tx: number, ty: number }} Last frame state */
  #last = null;

  /** @type {number} Current frame pointer */
  #framePtr = 0;

  /** @type {number} Middle point of the radar */
  #middle = 0;

  /** @type {number} Radius of the radar */
  #radius = 0;

  /**
   * Create a new LagRadar (SVG-based).
   * @param {FPSMonitor} _fpsMonitor - Unused, kept for API compatibility
   * @param {{ size?: number, frames?: number, speed?: number, inset?: number }} [options] - Configuration options
   */
  constructor(_fpsMonitor, options = {}) {
    this.#size = options.size || 200;
    this.#frames = options.frames || 50;
    this.#speed = options.speed || 0.0017;
    this.#inset = options.inset || 3;
    this.#middle = this.#size / 2;
    this.#radius = this.#middle - this.#inset;
  }

  /**
   * Create an SVG element with attributes.
   * @private
   */
  #svg(tag, props = {}, children = []) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(props).forEach((prop) => el.setAttribute(prop, props[prop]));
    children.forEach((child) => el.appendChild(child));
    return el;
  }

  /**
   * Create and return the SVG element.
   * @returns {SVGSVGElement} The radar SVG
   */
  create() {
    if (this.#root) return this.#root;

    const styles = document.createTextNode(`
      .lagRadar-sweep > * {
        shape-rendering: crispEdges;
      }
      .lagRadar-face {
        fill: transparent;
      }
      .lagRadar-hand {
        stroke-width: 4px;
        stroke-linecap: round;
      }
    `);

    this.#hand = this.#svg("path", { class: "lagRadar-hand" });
    this.#arcs = new Array(this.#frames).fill("path").map(() => this.#svg("path"));

    this.#root = this.#svg(
      "svg",
      {
        class: "lagRadar",
        height: this.#size,
        width: this.#size,
        style: "display: block; margin: 0 auto;",
      },
      [
        this.#svg("style", { type: "text/css" }, [styles]),
        this.#svg("g", { class: "lagRadar-sweep" }, this.#arcs),
        this.#hand,
        this.#svg("circle", {
          class: "lagRadar-face",
          cx: this.#middle,
          cy: this.#middle,
          r: this.#radius,
        }),
      ]
    );

    return this.#root;
  }

  /**
   * Start the radar animation.
   */
  start() {
    if (this.#running) return;
    this.#running = true;

    this.#last = {
      rotation: 0,
      now: Date.now(),
      tx: this.#middle + this.#radius,
      ty: this.#middle,
    };
    this.#framePtr = 0;

    this.#animate();
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
    if (this.#root) {
      this.#root.remove();
    }
    this.#root = null;
    this.#hand = null;
    this.#arcs = [];
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
   * Main animation loop - lag-radar style with SVG.
   * @private
   */
  #animate() {
    if (!this.#running) return;

    const PI2 = Math.PI * 2;
    const middle = this.#middle;
    const radius = this.#radius;
    const frames = this.#frames;

    const now = Date.now();
    const rdelta = Math.min(PI2 - this.#speed, this.#speed * (now - this.#last.now));
    const rotation = (this.#last.rotation + rdelta) % PI2;
    const tx = middle + radius * Math.cos(rotation);
    const ty = middle + radius * Math.sin(rotation);
    const bigArc = rdelta < Math.PI ? "0" : "1";
    const path = `M${tx} ${ty}A${radius} ${radius} 0 ${bigArc} 0 ${this.#last.tx} ${this.#last.ty}L${middle} ${middle}`;
    const hue = this.#calcHue(rdelta / this.#speed);

    this.#arcs[this.#framePtr % frames].setAttribute("d", path);
    this.#arcs[this.#framePtr % frames].setAttribute("fill", `hsl(${hue}, 80%, 40%)`);
    this.#hand.setAttribute("d", `M${middle} ${middle}L${tx} ${ty}`);
    this.#hand.setAttribute("stroke", `hsl(${hue}, 80%, 60%)`);

    for (let i = 0; i < frames; i++) {
      this.#arcs[(frames + this.#framePtr - i) % frames].style.fillOpacity = 1 - i / frames;
    }

    this.#framePtr++;
    this.#last = { now, rotation, tx, ty };

    this.#animationId = requestAnimationFrame(() => this.#animate());
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

