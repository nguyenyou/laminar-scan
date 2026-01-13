// ============================================================================
// KEYBOARD MANAGER
// ============================================================================
// Centralized keyboard event handling with priority-based registration.
// Components register handlers that return true if they handled the event.
// Higher priority handlers are called first.
// ============================================================================

/**
 * A keyboard handler function.
 * Returns true if the event was handled and should not propagate to lower-priority handlers.
 */
export type KeyboardHandler = (e: KeyboardEvent) => boolean

interface HandlerRegistration {
  id: string
  handler: KeyboardHandler
  priority: number
}

/**
 * Priority levels for keyboard handlers.
 * Higher numbers = higher priority (called first).
 */
export const KeyboardPriority = {
  /** Modal/dialog level - highest priority */
  MODAL: 1000,
  /** Overlay panels like component tree */
  PANEL: 500,
  /** Active tools like component inspector */
  TOOL: 100,
  /** Global shortcuts like Ctrl+Shift+C */
  GLOBAL: 0,
} as const

class KeyboardManager {
  private _handlers: HandlerRegistration[] = []
  private _active = false

  /**
   * Register a keyboard handler with a priority level.
   * Higher priority handlers are called first.
   * Returns an unregister function.
   */
  register(id: string, handler: KeyboardHandler, priority: number): () => void {
    // Remove existing handler with same id
    this._handlers = this._handlers.filter((h) => h.id !== id)

    const registration: HandlerRegistration = { id, handler, priority }
    this._handlers.push(registration)
    // Sort by priority descending (higher priority first)
    this._handlers.sort((a, b) => b.priority - a.priority)

    return () => this.unregister(id)
  }

  /**
   * Unregister a handler by id.
   */
  unregister(id: string): void {
    this._handlers = this._handlers.filter((h) => h.id !== id)
  }

  /**
   * Start listening for keyboard events.
   */
  start(): void {
    if (this._active) return
    this._active = true
    document.addEventListener('keydown', this._handleKeydown, { capture: true })
  }

  /**
   * Stop listening for keyboard events.
   */
  stop(): void {
    if (!this._active) return
    this._active = false
    document.removeEventListener('keydown', this._handleKeydown, { capture: true })
  }

  /**
   * Handle keydown events by calling handlers in priority order.
   */
  private _handleKeydown = (e: KeyboardEvent): void => {
    for (const { handler } of this._handlers) {
      try {
        const handled = handler(e)
        if (handled) {
          // Event was handled, stop propagation
          return
        }
      } catch (error) {
        console.error('KeyboardManager: handler error', error)
      }
    }
  }

  /**
   * Cleanup all handlers.
   */
  destroy(): void {
    this.stop()
    this._handlers = []
  }
}

// Singleton instance
export const keyboardManager = new KeyboardManager()

