// ============================================================================
// CANVAS RENDERING
// ============================================================================
// Canvas management for mutation highlights and component inspection overlays.
// ============================================================================

import { CONFIG } from "./config";
import { debounce, getDevicePixelRatio, lerp, type DebouncedFunction } from "./utilities";

interface HighlightData {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  targetY: number;
  targetWidth: number;
  targetHeight: number;
  frame: number;
  count: number;
  isReact: boolean;
}

/**
 * Manages the canvas used for rendering mutation highlights.
 * Handles creation, resizing, and drawing of highlight rectangles.
 */
export class HighlightCanvas {
  #canvas: HTMLCanvasElement | null = null;
  #ctx: CanvasRenderingContext2D | null = null;
  #animationId: number | null = null;
  #highlights: Map<Element, HighlightData> = new Map();
  #resizeHandler: DebouncedFunction<() => void> | null = null;

  /**
   * Create and mount the highlight canvas.
   * @returns {HTMLCanvasElement} The created canvas element
   */
  create(): HTMLCanvasElement {
    if (this.#canvas) return this.#canvas;

    // Safety check: prevent duplicate highlight canvases in DOM
    const existing = document.querySelector(`[${CONFIG.attributes.devtools}="highlight-canvas"]`) as HTMLCanvasElement | null;
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
      zIndex: "2147483647",
    });

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    document.body.appendChild(canvas);

    this.#canvas = canvas;
    this.#ctx = canvas.getContext("2d");
    this.#ctx?.scale(dpr, dpr);

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
   */
  highlight(element: Element, name: string, options: { isReact?: boolean } = {}): void {
    if (!this.#canvas || !element.isConnected) return;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const isReact = options.isReact ?? false;

    const existing = this.#highlights.get(element);
    if (existing) {
      // Update existing highlight
      existing.targetX = rect.left;
      existing.targetY = rect.top;
      existing.targetWidth = rect.width;
      existing.targetHeight = rect.height;
      existing.frame = 0;
      existing.count++;
      existing.isReact = isReact;
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
        isReact,
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
    // React color (cyan): rgb(97, 218, 251)
    const reactColor = { r: 97, g: 218, b: 251 };
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

      // Select color based on component type
      const color = highlight.isReact ? reactColor : { r, g, b };

      // Draw outline
      this.#ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
      this.#ctx.lineWidth = 1;
      this.#ctx.beginPath();
      this.#ctx.rect(highlight.x, highlight.y, highlight.width, highlight.height);
      this.#ctx.stroke();

      // Draw fill
      this.#ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.1})`;
      this.#ctx.fill();

      // Aggregate labels at same position (keep isReact flag)
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
    for (const [, { x, y, name, count, alpha, isReact }] of labelMap) {
      // Select color based on component type
      const color = isReact ? reactColor : { r, g, b };
      
      // Add React icon prefix for React components
      const displayName = isReact ? `⚛ ${name}` : name;
      const labelText = count > 1 ? `${displayName} ×${count}` : displayName;
      const textWidth = this.#ctx.measureText(labelText).width;
      const textHeight = 11;
      const padding = 2;

      let labelY = y - textHeight - padding * 2;
      if (labelY < 0) labelY = 0;

      this.#ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
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

interface RectType {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface OverlayInfo {
  isMarked?: boolean;
  isReact?: boolean;
}

/**
 * Manages the overlay canvas used during component inspection.
 * Draws animated highlight rectangles and component name labels.
 */
export class InspectOverlay {
  #canvas: HTMLCanvasElement | null = null;
  #ctx: CanvasRenderingContext2D | null = null;
  #currentRect: RectType | null = null;
  #animationId: number | null = null;
  #removeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Create and mount the inspect overlay canvas.
   */
  create(): HTMLCanvasElement {
    if (this.#canvas) return this.#canvas;

    // Safety check: prevent duplicate inspect canvases in DOM
    const existing = document.querySelector(`[${CONFIG.attributes.devtools}="inspect-canvas"]`) as HTMLCanvasElement | null;
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
      transition: "opacity 0.15s ease-in-out",
    });

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    this.#canvas = canvas;
    this.#ctx = canvas.getContext("2d");
    this.#ctx?.scale(dpr, dpr);

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
   */
  animateTo(targetRect: RectType, componentName: string, info: OverlayInfo = {}): void {
    if (!this.#currentRect) {
      this.#currentRect = { ...targetRect };
      this.#drawOverlay(this.#currentRect, componentName, info);
      return;
    }

    this.#cancelAnimation();

    const animate = () => {
      if (!this.#currentRect) return;
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
   */
  #drawOverlay(rect: RectType, componentName: string, info: OverlayInfo): void {
    if (!this.#ctx) return;

    this.#clearCanvas();
    if (!rect) return;

    const isMarked = info?.isMarked || false;
    const isReact = info?.isReact || false;
    const colors = CONFIG.colors;

    // Select colors based on component type
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
      const pillGap = 4; // Gap between pill and rectangle

      this.#ctx.font = "12px system-ui, -apple-system, sans-serif";
      
      // Add React icon prefix for React components
      const displayName = isReact ? `⚛ ${componentName}` : componentName;
      const textWidth = this.#ctx.measureText(displayName).width;
      const pillWidth = textWidth + pillPadding * 2;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate available space in each direction
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - (rect.top + rect.height);
      const spaceInside = rect.height;

      // Determine best vertical position
      let pillY;
      const requiredHeight = pillHeight + pillGap;

      if (spaceAbove >= requiredHeight) {
        // Prefer above the rectangle
        pillY = rect.top - pillHeight - pillGap;
      } else if (spaceBelow >= requiredHeight) {
        // Fall back to below the rectangle
        pillY = rect.top + rect.height + pillGap;
      } else if (spaceInside >= pillHeight + pillGap * 2) {
        // Place inside at top with padding
        pillY = rect.top + pillGap;
      } else {
        // Last resort: place at top of viewport or inside whichever fits better
        pillY = Math.max(pillGap, Math.min(rect.top + pillGap, viewportHeight - pillHeight - pillGap));
      }

      // Determine horizontal position (keep within viewport)
      let pillX = rect.left;
      
      // Ensure pill doesn't go off the right edge
      if (pillX + pillWidth > viewportWidth - pillGap) {
        pillX = viewportWidth - pillWidth - pillGap;
      }
      
      // Ensure pill doesn't go off the left edge
      if (pillX < pillGap) {
        pillX = pillGap;
      }

      // Pill background
      this.#ctx.fillStyle = pillBg;
      this.#ctx.beginPath();
      this.#ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3);
      this.#ctx.fill();

      // Text
      this.#ctx.fillStyle = pillText;
      this.#ctx.textBaseline = "middle";
      this.#ctx.fillText(displayName, pillX + pillPadding, pillY + pillHeight / 2);
    }
  }
}

