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
   */
  highlight(element, name) {
    if (!this.#canvas || !element.isConnected) return;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const existing = this.#highlights.get(element);
    if (existing) {
      // Update existing highlight
      existing.targetX = rect.left;
      existing.targetY = rect.top;
      existing.targetWidth = rect.width;
      existing.targetHeight = rect.height;
      existing.frame = 0;
      existing.count++;
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

      // Draw outline
      this.#ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      this.#ctx.lineWidth = 1;
      this.#ctx.beginPath();
      this.#ctx.rect(highlight.x, highlight.y, highlight.width, highlight.height);
      this.#ctx.stroke();

      // Draw fill
      this.#ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.1})`;
      this.#ctx.fill();

      // Aggregate labels at same position
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
    for (const [, { x, y, name, count, alpha }] of labelMap) {
      const labelText = count > 1 ? `${name} ×${count}` : name;
      const textWidth = this.#ctx.measureText(labelText).width;
      const textHeight = 11;
      const padding = 2;

      let labelY = y - textHeight - padding * 2;
      if (labelY < 0) labelY = 0;

      this.#ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
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
   * @param {{ isMarked?: boolean }} info - Component info
   */
  #drawOverlay(rect, componentName, info) {
    if (!this.#ctx) return;

    this.#clearCanvas();
    if (!rect) return;

    const isMarked = info?.isMarked || false;
    const colors = CONFIG.colors;

    // Select colors based on whether component is marked
    const strokeColor = isMarked ? colors.inspectMarkedStroke : colors.inspectStroke;
    const fillColor = isMarked ? colors.inspectMarkedFill : colors.inspectFill;

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

      this.#ctx.font = "12px system-ui, -apple-system, sans-serif";
      const textWidth = this.#ctx.measureText(componentName).width;
      const pillWidth = textWidth + pillPadding * 2;
      const pillX = rect.left;
      const pillY = rect.top - pillHeight - 4;

      // Pill background
      this.#ctx.fillStyle = isMarked ? colors.inspectMarkedPillBg : colors.inspectPillBg;
      this.#ctx.beginPath();
      this.#ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3);
      this.#ctx.fill();

      // Text
      this.#ctx.fillStyle = isMarked ? colors.inspectMarkedPillText : colors.inspectPillText;
      this.#ctx.textBaseline = "middle";
      this.#ctx.fillText(componentName, pillX + pillPadding, pillY + pillHeight / 2);
    }
  }
}

