// ============================================================================
// TOOLTIP MANAGER
// ============================================================================
// Manages tooltip display with animated content transitions.
// ============================================================================

import { CONFIG } from "../config";

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
        if (this.#state !== TooltipState.IDLE) return;
        this.#cancelHideTimeout();

        const tooltipText = el.getAttribute("data-tooltip");
        const rect = el.getBoundingClientRect();
        const currentX = rect.left + rect.width / 2;

        let direction: "left" | "right" = "left";
        if (this.#lastElementX !== null) {
          direction = currentX > this.#lastElementX ? "left" : "right";
        }
        this.#lastElementX = currentX;

        if (this.#element?.classList.contains("visible")) {
          this.#showContent(tooltipText, direction);
        } else {
          this.#cancelShowTimeout();
          this.#showTimeout = setTimeout(() => {
            this.#showContent(tooltipText, direction);
            this.#showTimeout = null;
          }, CONFIG.intervals.tooltipShowDelay ?? 300);
        }
      };

      const handleMouseLeave = () => {
        if (this.#state !== TooltipState.IDLE) return;
        this.#cancelShowTimeout();

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

  /**
   * Pin the tooltip with text content. Transitions to PINNED state.
   */
  pin(text: string): void {
    this.#cancelAllTimeouts();
    this.#state = TooltipState.PINNED;
    this.#element?.classList.add("pinned");

    if (this.#contentElement) {
      this.#contentElement.innerHTML = text;
      this.#contentElement.style.transform = "translateX(0)";
      this.#contentElement.style.opacity = "1";
    }

    this.#element?.classList.add("visible");
  }

  /**
   * Pin the tooltip with a DOM element. Transitions to PINNED state.
   */
  pinElement(element: HTMLElement): void {
    this.#cancelAllTimeouts();
    this.#state = TooltipState.PINNED;
    this.#element?.classList.add("pinned");

    if (this.#contentElement) {
      this.#contentElement.innerHTML = "";
      this.#contentElement.appendChild(element);
      this.#contentElement.style.transform = "translateX(0)";
      this.#contentElement.style.opacity = "1";
    }

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

  /**
   * Show tooltip content with optional animation.
   * @private
   */
  #showContent(text: string | null, direction: "left" | "right" = "left"): void {
    if (!this.#element || !this.#contentElement) return;

    const content = this.#contentElement;
    const tooltip = this.#element;
    const displayText = text ?? "";

    if (!tooltip.classList.contains("visible")) {
      content.innerHTML = displayText;
      content.style.transform = "translateX(0)";
      content.style.opacity = "1";
      tooltip.classList.add("visible");
      return;
    }

    const slideOutX = direction === "left" ? "15px" : "-15px";
    const slideInX = direction === "left" ? "-15px" : "15px";
    const slideMs = CONFIG.animation.tooltipSlideMs;

    content.style.transition = `transform ${slideMs}ms ease-out, opacity ${slideMs}ms ease-out`;
    content.style.transform = `translateX(${slideOutX})`;
    content.style.opacity = "0";

    setTimeout(() => {
      content.innerHTML = displayText;
      content.style.transition = "none";
      content.style.transform = `translateX(${slideInX})`;
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

