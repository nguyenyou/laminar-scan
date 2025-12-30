// ============================================================================
// HOTKEY MANAGER
// ============================================================================
// Global keyboard shortcut handling.
// ============================================================================

/**
 * Manages global keyboard shortcuts for devtools.
 * 
 * Default hotkeys:
 * - Ctrl+Shift+C: Toggle inspect mode
 */
class HotkeyManager {
  /** @type {Map<string, Function>} Registered hotkey handlers */
  #handlers = new Map();

  /** @type {boolean} Whether the manager is active */
  #active = false;

  /** @type {Function} Bound keydown handler */
  #boundKeydown = null;

  constructor() {
    this.#boundKeydown = this.#handleKeydown.bind(this);
  }

  /**
   * Start listening for hotkeys.
   */
  start() {
    if (this.#active) return;
    this.#active = true;
    document.addEventListener("keydown", this.#boundKeydown, { capture: true });
  }

  /**
   * Stop listening for hotkeys.
   */
  stop() {
    if (!this.#active) return;
    this.#active = false;
    document.removeEventListener("keydown", this.#boundKeydown, { capture: true });
  }

  /**
   * Register a hotkey handler.
   * @param {string} combo - Key combination (e.g., "ctrl+shift+c")
   * @param {Function} handler - Handler function
   */
  register(combo, handler) {
    this.#handlers.set(combo.toLowerCase(), handler);
  }

  /**
   * Unregister a hotkey handler.
   * @param {string} combo - Key combination to remove
   */
  unregister(combo) {
    this.#handlers.delete(combo.toLowerCase());
  }

  /**
   * Handle keydown events.
   * @private
   * @param {KeyboardEvent} e
   */
  #handleKeydown(e) {
    // Build the key combo string
    const parts = [];
    if (e.ctrlKey) parts.push("ctrl");
    if (e.metaKey) parts.push("meta");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");

    // Add the key itself (lowercase)
    const key = e.key.toLowerCase();
    if (!["control", "shift", "alt", "meta"].includes(key)) {
      parts.push(key);
    }

    const combo = parts.join("+");

    // Check if we have a handler for this combo
    const handler = this.#handlers.get(combo);
    if (handler) {
      e.preventDefault();
      e.stopPropagation();
      handler();
    }
  }

  /**
   * Cleanup all handlers.
   */
  destroy() {
    this.stop();
    this.#handlers.clear();
  }
}

