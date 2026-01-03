// ============================================================================
// UI COMPONENTS
// ============================================================================
// Reusable UI components for the toolbar: tooltips and drag handling.
// ============================================================================

import { CONFIG } from "./00-config";
import { debounce, clamp, lerp, type DebouncedFunction } from "./01-utilities";

/**
 * Tooltip state enum.
 */
export const TooltipState = {
  /** Hover shows tooltips normally */
  IDLE: "idle",
  /** Click-pinned content, hover completely ignored */
  PINNED: "pinned",
  /** Temporarily disabled (during drag), will return to previous state */
  SUSPENDED: "suspended",
} as const;

type TooltipStateType = (typeof TooltipState)[keyof typeof TooltipState];

/**
 * Manages tooltip display with animated content transitions.
 *
 * State machine:
 * - IDLE: Hover triggers show/hide with delays. Click can transition to PINNED.
 * - PINNED: Tooltip stays visible with pinned content. Hover is ignored. Click unpins → IDLE.
 * - SUSPENDED: All interactions ignored (used during drag). Returns to previous state.
 */
export class TooltipManager {
  #element: HTMLDivElement | null = null;
  #contentElement: HTMLDivElement | null = null;
  #hideTimeout: ReturnType<typeof setTimeout> | null = null;
  #showTimeout: ReturnType<typeof setTimeout> | null = null;
  #lastElementX: number | null = null;
  #cleanupFns: (() => void)[] = [];
  #state: TooltipStateType = TooltipState.IDLE;
  #stateBeforeSuspend: TooltipStateType = TooltipState.IDLE;

  /**
   * Create the tooltip DOM elements.
   * @returns {{ container: HTMLDivElement, content: HTMLDivElement }} Tooltip elements
   */
  create() {
    const container = document.createElement("div");
    container.className = "devtools-tooltip";

    // Add live indicator (hidden by default, shown when pinned)
    const liveIndicator = document.createElement("div");
    liveIndicator.className = "live-indicator";
    container.appendChild(liveIndicator);

    const content = document.createElement("div");
    content.className = "devtools-tooltip-content";
    container.appendChild(content);

    this.#element = container;
    this.#contentElement = content;

    return { container, content };
  }

  /**
   * Setup tooltip event handlers for elements with data-tooltip attribute.
   * Hover events only work in IDLE state.
   */
  setupEvents(container: HTMLElement): void {
    const tooltipElements = container.querySelectorAll("[data-tooltip]");

    for (const el of tooltipElements) {
      const handleMouseEnter = () => {
        // Only respond to hover in IDLE state
        if (this.#state !== TooltipState.IDLE) return;

        // Cancel any pending hide
        this.#cancelHideTimeout();

        const tooltipText = el.getAttribute("data-tooltip");
        const rect = el.getBoundingClientRect();
        const currentX = rect.left + rect.width / 2;

        // Determine slide direction based on movement
        let direction: "left" | "right" = "left";
        if (this.#lastElementX !== null) {
          direction = currentX > this.#lastElementX ? "left" : "right";
        }
        this.#lastElementX = currentX;

        // If tooltip is already visible (moving between elements), show immediately
        if (this.#element?.classList.contains("visible")) {
          this.#showContent(tooltipText, direction);
        } else {
          // Delay showing tooltip to prevent accidental hover triggers
          this.#cancelShowTimeout();
          this.#showTimeout = setTimeout(() => {
            this.#showContent(tooltipText, direction);
            this.#showTimeout = null;
          }, CONFIG.intervals.tooltipShowDelay ?? 300);
        }
      };

      const handleMouseLeave = () => {
        // Only respond to hover in IDLE state
        if (this.#state !== TooltipState.IDLE) return;

        // Cancel any pending show
        this.#cancelShowTimeout();

        // Delay hiding to allow moving between buttons
        this.#hideTimeout = setTimeout(() => {
          this.#hideTooltip();
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

  // ===========================================================================
  // State Transitions (Public API for click handlers)
  // ===========================================================================

  /**
   * Pin the tooltip with text content. Transitions to PINNED state.
   */
  pin(text: string): void {
    this.#cancelAllTimeouts();
    this.#state = TooltipState.PINNED;

    // Add pinned class for styling
    this.#element?.classList.add("pinned");

    // Set content directly (bypasses state check since we just set PINNED)
    if (this.#contentElement) {
      this.#contentElement.innerHTML = text;
      this.#contentElement.style.transform = "translateX(0)";
      this.#contentElement.style.opacity = "1";
    }

    // Make sure tooltip is visible
    this.#element?.classList.add("visible");
  }

  /**
   * Pin the tooltip with a DOM element. Transitions to PINNED state.
   */
  pinElement(element: HTMLElement): void {
    this.#cancelAllTimeouts();
    this.#state = TooltipState.PINNED;

    // Add pinned class for styling
    this.#element?.classList.add("pinned");

    if (this.#contentElement) {
      // Clear existing content and append the element
      this.#contentElement.innerHTML = "";
      this.#contentElement.appendChild(element);

      // Set content visibility
      this.#contentElement.style.transform = "translateX(0)";
      this.#contentElement.style.opacity = "1";
    }

    // Make sure tooltip is visible
    this.#element?.classList.add("visible");
  }

  /**
   * Unpin the tooltip and hide it. Transitions to IDLE state.
   */
  unpin(): void {
    this.#state = TooltipState.IDLE;
    this.#element?.classList.remove("pinned");
    this.#hideTooltip();
  }

  /**
   * Update pinned content if tooltip is in PINNED state (without animation).
   */
  updatePinnedContent(text: string): void {
    if (this.#state === TooltipState.PINNED && this.#contentElement) {
      this.#contentElement.innerHTML = text;
    }
  }

  /**
   * Check if tooltip is in PINNED state.
   */
  isPinned(): boolean {
    return this.#state === TooltipState.PINNED;
  }

  /**
   * Get the tooltip container element.
   */
  getElement(): HTMLDivElement | null {
    return this.#element;
  }

  /**
   * Temporarily suspend tooltips (e.g., during drag). Transitions to SUSPENDED state.
   */
  suspend() {
    if (this.#state === TooltipState.SUSPENDED) return;
    this.#stateBeforeSuspend = this.#state;
    this.#state = TooltipState.SUSPENDED;
    this.#cancelAllTimeouts();
    // Don't hide if pinned content was showing
    if (this.#stateBeforeSuspend !== TooltipState.PINNED) {
      this.#hideTooltip();
    }
  }

  /**
   * Resume tooltips after suspension. Returns to previous state.
   */
  resume() {
    if (this.#state !== TooltipState.SUSPENDED) return;
    this.#state = this.#stateBeforeSuspend;
  }

  /**
   * Cleanup all event handlers.
   */
  destroy() {
    this.#cancelAllTimeouts();
    for (const cleanup of this.#cleanupFns) {
      cleanup();
    }
    this.#cleanupFns = [];
    this.#element = null;
    this.#contentElement = null;
    this.#lastElementX = null;
  }

  // ===========================================================================
  // Internal Methods (Private)
  // ===========================================================================

  /**
   * Show tooltip content with optional animation.
   */
  #showContent(text: string | null, direction: "left" | "right" = "left"): void {
    if (!this.#element || !this.#contentElement) return;

    const content = this.#contentElement;
    const tooltip = this.#element;
    const displayText = text ?? "";

    // If not visible, just set content and show
    if (!tooltip.classList.contains("visible")) {
      content.innerHTML = displayText;
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
      content.innerHTML = displayText;
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
   * Hide the tooltip (internal, no state check).
   * @private
   */
  #hideTooltip() {
    if (!this.#element) return;
    this.#element.classList.remove("visible");
    this.#lastElementX = null;
  }

  /**
   * Cancel all pending timeouts.
   * @private
   */
  #cancelAllTimeouts() {
    if (this.#hideTimeout) {
      clearTimeout(this.#hideTimeout);
      this.#hideTimeout = null;
    }
    if (this.#showTimeout) {
      clearTimeout(this.#showTimeout);
      this.#showTimeout = null;
    }
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

  /**
   * Cancel the show timeout.
   * @private
   */
  #cancelShowTimeout() {
    if (this.#showTimeout) {
      clearTimeout(this.#showTimeout);
      this.#showTimeout = null;
    }
  }
}

interface CollapsedState {
  corner: string;
  orientation: string;
}

interface Position {
  x: number;
  y: number;
}

interface DragControllerOptions {
  onDragStart?: (isDragging: boolean) => void;
  onDragEnd?: () => void;
  onPositionChange?: (position: Position, corner: string) => void;
  onCollapse?: (corner: string, orientation: string) => void;
  onExpand?: (corner: string) => void;
}

/**
 * Handles drag-to-move and snap-to-corner behavior for the toolbar.
 */
export class DragController {
  #element: HTMLElement | null = null;
  #isDragging = false;
  #position: Position = { x: 0, y: 0 };
  #corner = "bottom-right";
  #collapsed: CollapsedState | null = null;
  #transitionTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Callbacks
  #onDragStart: ((isDragging: boolean) => void) | null = null;
  #onDragEnd: (() => void) | null = null;
  #onPositionChange: ((position: Position, corner: string) => void) | null = null;
  #onCollapse: ((corner: string, orientation: string) => void) | null = null;
  #onExpand: ((corner: string) => void) | null = null;

  /**
   * Create a new DragController.
   */
  constructor(options: DragControllerOptions = {}) {
    this.#onDragStart = options.onDragStart ?? null;
    this.#onDragEnd = options.onDragEnd ?? null;
    this.#onPositionChange = options.onPositionChange ?? null;
    this.#onCollapse = options.onCollapse ?? null;
    this.#onExpand = options.onExpand ?? null;
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
    // Don't drag if clicking on interactive elements
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest("label") || e.target.closest(".clickable")) {
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

