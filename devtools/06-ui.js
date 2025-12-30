// ============================================================================
// UI COMPONENTS
// ============================================================================
// Reusable UI components for the toolbar: tooltips and drag handling.
// ============================================================================

/**
 * Manages tooltip display with animated content transitions.
 */
class TooltipManager {
  /** @type {HTMLDivElement | null} Tooltip container element */
  #element = null;

  /** @type {HTMLDivElement | null} Inner content element */
  #contentElement = null;

  /** @type {number | null} Timeout for hiding tooltip */
  #hideTimeout = null;

  /** @type {number | null} Last hovered element's X position */
  #lastElementX = null;

  /** @type {Array<Function>} Cleanup functions for event listeners */
  #cleanupFns = [];

  /** @type {boolean} Whether tooltips are disabled */
  #disabled = false;

  /**
   * Create the tooltip DOM elements.
   * @returns {{ container: HTMLDivElement, content: HTMLDivElement }} Tooltip elements
   */
  create() {
    const container = document.createElement("div");
    container.className = "devtools-tooltip";

    const content = document.createElement("div");
    content.className = "devtools-tooltip-content";
    container.appendChild(content);

    this.#element = container;
    this.#contentElement = content;

    return { container, content };
  }

  /**
   * Setup tooltip event handlers for elements with data-tooltip attribute.
   * @param {HTMLElement} container - Container to search for tooltip elements
   */
  setupEvents(container) {
    const tooltipElements = container.querySelectorAll("[data-tooltip]");

    for (const el of tooltipElements) {
      const handleMouseEnter = () => {
        if (this.#disabled) return;

        // Cancel any pending hide
        this.#cancelHideTimeout();

        const tooltipText = el.getAttribute("data-tooltip");
        const rect = el.getBoundingClientRect();
        const currentX = rect.left + rect.width / 2;

        // Determine slide direction based on movement
        let direction = "left";
        if (this.#lastElementX !== null) {
          direction = currentX > this.#lastElementX ? "left" : "right";
        }
        this.#lastElementX = currentX;

        this.show(tooltipText, direction);
      };

      const handleMouseLeave = () => {
        // Delay hiding to allow moving between buttons
        this.#hideTimeout = setTimeout(() => {
          this.hide();
          this.#hideTimeout = null;
        }, CONFIG.intervals.tooltipHideDelay || 200);
      };

      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);

      this.#cleanupFns.push(() => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    }
  }

  /**
   * Show the tooltip with the given text.
   * @param {string} text - Tooltip text
   * @param {'left' | 'right'} [direction='left'] - Animation direction
   */
  show(text, direction = "left") {
    if (!this.#element || !this.#contentElement) return;

    const content = this.#contentElement;
    const tooltip = this.#element;

    // If not visible, just set content and show
    if (!tooltip.classList.contains("visible")) {
      content.textContent = text;
      content.style.transform = "translateX(0)";
      content.style.opacity = "1";
      tooltip.classList.add("visible");
      return;
    }

    // Animate content change with slide effect
    const slideOutX = direction === "left" ? "15px" : "-15px";
    const slideInX = direction === "left" ? "-15px" : "15px";
    const slideMs = CONFIG.animation.tooltipSlideMs;

    // Slide out current content
    content.style.transition = `transform ${slideMs}ms ease-out, opacity ${slideMs}ms ease-out`;
    content.style.transform = `translateX(${slideOutX})`;
    content.style.opacity = "0";

    // After slide out, update content and slide in
    setTimeout(() => {
      content.textContent = text;
      content.style.transition = "none";
      content.style.transform = `translateX(${slideInX})`;

      // Force reflow
      void content.offsetWidth;

      content.style.transition = `transform ${slideMs + 30}ms ease-out, opacity ${slideMs + 30}ms ease-out`;
      content.style.transform = "translateX(0)";
      content.style.opacity = "1";
    }, slideMs);
  }

  /**
   * Hide the tooltip.
   */
  hide() {
    if (!this.#element) return;
    this.#element.classList.remove("visible");
    this.#lastElementX = null;
  }

  /**
   * Temporarily disable tooltips.
   */
  disable() {
    this.#disabled = true;
    this.hide();
  }

  /**
   * Re-enable tooltips.
   */
  enable() {
    this.#disabled = false;
  }

  /**
   * Cleanup all event handlers.
   */
  destroy() {
    this.#cancelHideTimeout();
    for (const cleanup of this.#cleanupFns) {
      cleanup();
    }
    this.#cleanupFns = [];
    this.#element = null;
    this.#contentElement = null;
    this.#lastElementX = null;
  }

  /**
   * Cancel the hide timeout.
   * @private
   */
  #cancelHideTimeout() {
    if (this.#hideTimeout) {
      clearTimeout(this.#hideTimeout);
      this.#hideTimeout = null;
    }
  }
}

/**
 * Handles drag-to-move and snap-to-corner behavior for the toolbar.
 */
class DragController {
  /** @type {HTMLElement | null} Element being dragged */
  #element = null;

  /** @type {boolean} Whether currently dragging */
  #isDragging = false;

  /** @type {{ x: number, y: number }} Current position */
  #position = { x: 0, y: 0 };

  /** @type {string} Current corner */
  #corner = "bottom-right";

  /** @type {{ corner: string, orientation: string } | null} Collapsed state */
  #collapsed = null;

  /** @type {number | null} Transition timeout ID */
  #transitionTimeoutId = null;

  // Callbacks
  #onDragStart = null;
  #onDragEnd = null;
  #onPositionChange = null;
  #onCollapse = null;
  #onExpand = null;

  /**
   * Create a new DragController.
   * @param {Object} options - Configuration options
   * @param {(isDragging: boolean) => void} [options.onDragStart] - Called when drag starts
   * @param {() => void} [options.onDragEnd] - Called when drag ends
   * @param {(position: { x: number, y: number }, corner: string) => void} [options.onPositionChange] - Called when position changes
   * @param {(corner: string, orientation: string) => void} [options.onCollapse] - Called when collapsing
   * @param {(corner: string) => void} [options.onExpand] - Called when expanding
   */
  constructor(options = {}) {
    this.#onDragStart = options.onDragStart || null;
    this.#onDragEnd = options.onDragEnd || null;
    this.#onPositionChange = options.onPositionChange || null;
    this.#onCollapse = options.onCollapse || null;
    this.#onExpand = options.onExpand || null;
  }

  /**
   * Check if currently dragging.
   * @returns {boolean}
   */
  get isDragging() {
    return this.#isDragging;
  }

  /**
   * Get current position.
   * @returns {{ x: number, y: number }}
   */
  get position() {
    return { ...this.#position };
  }

  /**
   * Get current corner.
   * @returns {string}
   */
  get corner() {
    return this.#corner;
  }

  /**
   * Get collapsed state.
   * @returns {{ corner: string, orientation: string } | null}
   */
  get collapsed() {
    return this.#collapsed ? { ...this.#collapsed } : null;
  }

  /**
   * Initialize the drag controller with an element.
   * @param {HTMLElement} element - Element to make draggable
   */
  init(element) {
    this.#element = element;
    element.addEventListener("pointerdown", (e) => this.#handlePointerDown(e));
  }

  /**
   * Set the current position without animation.
   * @param {{ x: number, y: number }} position - New position
   * @param {string} [corner] - Corner identifier
   */
  setPosition(position, corner) {
    this.#position = { ...position };
    if (corner) this.#corner = corner;
    this.#applyPosition(false);
  }

  /**
   * Set collapsed state.
   * @param {{ corner: string, orientation: string } | null} state - Collapsed state
   */
  setCollapsed(state) {
    this.#collapsed = state ? { ...state } : null;
    if (state) {
      this.#corner = state.corner;
    }
  }

  /**
   * Animate to a corner position.
   * @param {string} corner - Target corner
   * @param {number} width - Element width
   * @param {number} height - Element height
   */
  snapToCorner(corner, width, height) {
    this.#corner = corner;
    this.#position = this.#calculatePosition(corner, width, height);
    this.#applyPosition(true);
  }

  /**
   * Expand from collapsed state.
   */
  expand() {
    if (!this.#collapsed) return;

    const savedCorner = this.#collapsed.corner;
    this.#collapsed = null;

    this.#onExpand?.(savedCorner);
  }

  /**
   * Handle pointer down event.
   * @private
   * @param {PointerEvent} e - Pointer event
   */
  #handlePointerDown(e) {
    // Don't drag if clicking on buttons or inputs
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest("label")) {
      return;
    }

    e.preventDefault();

    if (!this.#element) return;

    // If collapsed, handle expand drag
    if (this.#collapsed) {
      this.#handleCollapsedDrag(e);
      return;
    }

    const toolbar = this.#element;
    const toolbarStyle = toolbar.style;

    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialX = this.#position.x;
    const initialY = this.#position.y;

    let currentX = initialX;
    let currentY = initialY;
    let lastMouseX = initialMouseX;
    let lastMouseY = initialMouseY;
    let hasMoved = false;
    let rafId = null;

    // Capture pointer for smooth tracking
    toolbar.setPointerCapture(e.pointerId);
    const pointerId = e.pointerId;

    const handlePointerMove = (moveEvent) => {
      lastMouseX = moveEvent.clientX;
      lastMouseY = moveEvent.clientY;

      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const deltaX = lastMouseX - initialMouseX;
        const deltaY = lastMouseY - initialMouseY;

        // Check if moved enough to start drag
        if (!hasMoved && (Math.abs(deltaX) > CONFIG.thresholds.dragStart || Math.abs(deltaY) > CONFIG.thresholds.dragStart)) {
          hasMoved = true;
          this.#isDragging = true;
          toolbar.classList.add("dragging");
          this.#onDragStart?.(true);
        }

        if (hasMoved) {
          currentX = initialX + deltaX;
          currentY = initialY + deltaY;
          toolbarStyle.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }

        rafId = null;
      });
    };

    const handlePointerEnd = () => {
      if (toolbar.hasPointerCapture(pointerId)) {
        toolbar.releasePointerCapture(pointerId);
      }

      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerEnd);
      document.removeEventListener("pointercancel", handlePointerEnd);

      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      toolbar.classList.remove("dragging");
      this.#isDragging = false;
      this.#onDragEnd?.();

      if (!hasMoved) return;

      // Calculate movement
      const totalDeltaX = Math.abs(lastMouseX - initialMouseX);
      const totalDeltaY = Math.abs(lastMouseY - initialMouseY);
      const totalMovement = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);

      // Snap back if didn't move enough
      if (totalMovement < CONFIG.thresholds.snapDistance) {
        this.#position = this.#calculatePosition(this.#corner, toolbar.offsetWidth, toolbar.offsetHeight);
        this.#applyPosition(true);
        return;
      }

      // Check for collapse
      const toolbarWidth = CONFIG.dimensions.toolbarWidth;
      const toolbarHeight = toolbar.offsetHeight || 40;

      if (this.#shouldCollapse(currentX, currentY, toolbarWidth, toolbarHeight)) {
        const target = this.#getCollapseTarget(currentX, currentY, toolbarWidth, toolbarHeight);
        if (target) {
          this.#collapsed = target;
          this.#corner = target.corner;
          this.#onCollapse?.(target.corner, target.orientation);
          return;
        }
      }

      // Determine new corner and snap
      const newCorner = this.#getBestCorner(lastMouseX, lastMouseY, initialMouseX, initialMouseY);
      this.#corner = newCorner;
      this.#position = this.#calculatePosition(newCorner, toolbar.offsetWidth, toolbar.offsetHeight);
      this.#applyPosition(true);

      this.#onPositionChange?.(this.#position, this.#corner);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerEnd);
    document.addEventListener("pointercancel", handlePointerEnd);
  }

  /**
   * Handle drag on collapsed toolbar.
   * @private
   * @param {PointerEvent} e - Pointer event
   */
  #handleCollapsedDrag(e) {
    if (!this.#collapsed) return;

    const { corner, orientation } = this.#collapsed;
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    let hasExpanded = false;

    const handlePointerMove = (moveEvent) => {
      if (hasExpanded) return;

      const deltaX = moveEvent.clientX - initialMouseX;
      const deltaY = moveEvent.clientY - initialMouseY;
      const threshold = CONFIG.thresholds.expandDragDistance;

      let shouldExpand = false;

      if (orientation === "horizontal") {
        if (corner.endsWith("left") && deltaX > threshold) shouldExpand = true;
        else if (corner.endsWith("right") && deltaX < -threshold) shouldExpand = true;
      } else {
        if (corner.startsWith("top") && deltaY > threshold) shouldExpand = true;
        else if (corner.startsWith("bottom") && deltaY < -threshold) shouldExpand = true;
      }

      if (shouldExpand) {
        hasExpanded = true;
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerEnd);
        this.expand();
      }
    };

    const handlePointerEnd = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerEnd);
    };

    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerup", handlePointerEnd);
  }

  /**
   * Apply current position to element.
   * @private
   * @param {boolean} animate - Whether to animate
   */
  #applyPosition(animate) {
    if (!this.#element) return;

    const style = this.#element.style;
    style.left = "0";
    style.top = "0";

    if (animate) {
      // Clear any existing timeout
      if (this.#transitionTimeoutId) {
        clearTimeout(this.#transitionTimeoutId);
      }

      style.transition = `transform ${CONFIG.animation.snapTransitionMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;

      requestAnimationFrame(() => {
        style.transform = `translate3d(${this.#position.x}px, ${this.#position.y}px, 0)`;
      });

      this.#transitionTimeoutId = setTimeout(() => {
        style.transition = "none";
        this.#transitionTimeoutId = null;
      }, CONFIG.animation.snapTransitionMs + 50);
    } else {
      style.transition = "none";
      style.transform = `translate3d(${this.#position.x}px, ${this.#position.y}px, 0)`;
    }
  }

  /**
   * Calculate position for a corner.
   * @private
   * @param {string} corner - Corner identifier
   * @param {number} width - Element width
   * @param {number} height - Element height
   * @returns {{ x: number, y: number }}
   */
  #calculatePosition(corner, width, height) {
    const safeArea = CONFIG.dimensions.safeArea;
    const rightX = window.innerWidth - width - safeArea;
    const bottomY = window.innerHeight - height - safeArea;

    switch (corner) {
      case "top-left":
        return { x: safeArea, y: safeArea };
      case "top-right":
        return { x: rightX, y: safeArea };
      case "bottom-left":
        return { x: safeArea, y: bottomY };
      case "bottom-right":
      default:
        return { x: rightX, y: bottomY };
    }
  }

  /**
   * Determine best corner based on drag direction.
   * @private
   */
  #getBestCorner(mouseX, mouseY, initialMouseX, initialMouseY) {
    const deltaX = mouseX - initialMouseX;
    const deltaY = mouseY - initialMouseY;
    const threshold = 40;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const movingRight = deltaX > threshold;
    const movingLeft = deltaX < -threshold;
    const movingDown = deltaY > threshold;
    const movingUp = deltaY < -threshold;

    if (movingRight || movingLeft) {
      const isBottom = mouseY > centerY;
      return movingRight
        ? (isBottom ? "bottom-right" : "top-right")
        : (isBottom ? "bottom-left" : "top-left");
    }

    if (movingDown || movingUp) {
      const isRight = mouseX > centerX;
      return movingDown
        ? (isRight ? "bottom-right" : "bottom-left")
        : (isRight ? "top-right" : "top-left");
    }

    return mouseX > centerX
      ? (mouseY > centerY ? "bottom-right" : "top-right")
      : (mouseY > centerY ? "bottom-left" : "top-left");
  }

  /**
   * Check if toolbar should collapse.
   * @private
   */
  #shouldCollapse(x, y, width, height) {
    const right = x + width;
    const bottom = y + height;

    const outsideLeft = Math.max(0, -x);
    const outsideRight = Math.max(0, right - window.innerWidth);
    const outsideTop = Math.max(0, -y);
    const outsideBottom = Math.max(0, bottom - window.innerHeight);

    const horizontalOutside = Math.min(width, outsideLeft + outsideRight);
    const verticalOutside = Math.min(height, outsideTop + outsideBottom);
    const areaOutside = horizontalOutside * height + verticalOutside * width - horizontalOutside * verticalOutside;
    const totalArea = width * height;

    return areaOutside > totalArea * CONFIG.thresholds.collapseRatio;
  }

  /**
   * Get collapse target corner and orientation.
   * @private
   */
  #getCollapseTarget(x, y, width, height) {
    const outsideLeft = -x;
    const outsideRight = (x + width) - window.innerWidth;
    const outsideTop = -y;
    const outsideBottom = (y + height) - window.innerHeight;

    const maxOutside = Math.max(outsideLeft, outsideRight, outsideTop, outsideBottom);
    if (maxOutside < 0) return null;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    if (outsideLeft === maxOutside) {
      return { orientation: "horizontal", corner: y < centerY ? "top-left" : "bottom-left" };
    } else if (outsideRight === maxOutside) {
      return { orientation: "horizontal", corner: y < centerY ? "top-right" : "bottom-right" };
    } else if (outsideTop === maxOutside) {
      return { orientation: "vertical", corner: x < centerX ? "top-left" : "top-right" };
    } else {
      return { orientation: "vertical", corner: x < centerX ? "bottom-left" : "bottom-right" };
    }
  }

  /**
   * Cleanup resources.
   */
  destroy() {
    if (this.#transitionTimeoutId) {
      clearTimeout(this.#transitionTimeoutId);
      this.#transitionTimeoutId = null;
    }
    this.#element = null;
  }
}

