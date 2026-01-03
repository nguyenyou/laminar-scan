// ============================================================================
// PUBLIC API
// ============================================================================
// Clean facade exposing the public devtools API.
// ============================================================================

import { CONFIG } from "./00-config";
import { StorageManager } from "./02-storage";
import { MutationScanner, ComponentInspector } from "./05-core";
import { Toolbar } from "./08-toolbar";
import { HotkeyManager } from "./06-hotkeys";

/**
 * Devtools - Public API facade.
 * Coordinates the scanner, inspector, and toolbar components.
 *
 * @example
 * // Enable devtools (shows toolbar on next page load)
 * Devtools.enable();
 *
 * // Disable devtools (hides toolbar on next page load)
 * Devtools.disable();
 *
 * // Toggle devtools visibility immediately
 * Devtools.show();
 * Devtools.hide();
 */
export const Devtools: {
  _scanner: MutationScanner | null;
  _inspector: ComponentInspector | null;
  _toolbar: Toolbar | null;
  _hotkeys: HotkeyManager | null;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  show(): void;
  hide(): void;
  init(): void;
  destroy(): void;
  isRunning(): boolean;
  start(): void;
  stop(): void;
  toggle(): void;
  isInspecting(): boolean;
  startInspect(): void;
  stopInspect(): void;
  toggleInspect(): void;
} = {
  _scanner: null as MutationScanner | null,
  _inspector: null as ComponentInspector | null,
  _toolbar: null as Toolbar | null,
  _hotkeys: null as HotkeyManager | null,

  // ===== Enable/Disable API =====

  /**
   * Enable devtools. Sets localStorage and initializes immediately.
   * The toolbar will appear and persist across page reloads.
   */
  enable() {
    StorageManager.setString(CONFIG.storageKeys.enabled, "true");
    if (!this._toolbar) {
      this.init();
    }
    console.log("Devtools: Enabled. Toolbar is now visible.");
  },

  /**
   * Disable devtools. Clears localStorage and destroys immediately.
   * The toolbar will not appear on page reload.
   */
  disable() {
    StorageManager.setString(CONFIG.storageKeys.enabled, "false");
    this.destroy();
    console.log("Devtools: Disabled. Toolbar hidden.");
  },

  /**
   * Check if devtools is enabled in localStorage.
   * @returns {boolean}
   */
  isEnabled() {
    return StorageManager.isDevtoolsEnabled();
  },

  /**
   * Show the toolbar immediately (without persisting to localStorage).
   */
  show() {
    if (!this._toolbar) {
      this.init();
    }
  },

  /**
   * Hide the toolbar immediately (without changing localStorage).
   */
  hide() {
    this.destroy();
  },

  /**
   * Initialize the devtools system.
   * Creates the toolbar and sets up component coordination.
   */
  init() {
    if (this._toolbar) return; // Already initialized

    // Create scanner
    this._scanner = new MutationScanner();

    // Create inspector with state change callback
    this._inspector = new ComponentInspector({
      onStateChange: (inspecting) => {
        this._toolbar?.updateInspectButton(inspecting);
      },
    });

    // Create toolbar with callbacks
    this._toolbar = new Toolbar({
      onScanningToggle: (enabled) => {
        if (enabled) {
          this._scanner?.start();
        } else {
          this._scanner?.stop();
        }
      },
      onInspectToggle: () => {
        this._inspector?.toggle();
      },
    });

    // Mount toolbar
    this._toolbar.mount();

    // Setup hotkeys
    this._hotkeys = new HotkeyManager();
    this._hotkeys.register("ctrl+shift+c", () => {
      this._inspector?.toggle();
    });
    this._hotkeys.start();

    // Auto-start scanning if previously enabled
    if (StorageManager.isScanningEnabled()) {
      this._scanner?.start();
    }
  },

  /**
   * Destroy the devtools system.
   */
  destroy() {
    this._hotkeys?.destroy();
    this._scanner?.stop();
    this._inspector?.stop();
    this._toolbar?.unmount();

    this._hotkeys = null;
    this._scanner = null;
    this._inspector = null;
    this._toolbar = null;
  },

  // ===== Scanner API =====

  /**
   * Check if the mutation scanner is running.
   * @returns {boolean}
   */
  isRunning() {
    return this._scanner?.isRunning ?? false;
  },

  /**
   * Start the mutation scanner.
   */
  start() {
    this._scanner?.start();
  },

  /**
   * Stop the mutation scanner.
   */
  stop() {
    this._scanner?.stop();
  },

  /**
   * Toggle the mutation scanner.
   */
  toggle() {
    this._scanner?.toggle();
  },

  // ===== Inspector API =====

  /**
   * Check if component inspection is active.
   * @returns {boolean}
   */
  isInspecting() {
    return this._inspector?.isInspecting ?? false;
  },

  /**
   * Start component inspection mode.
   */
  startInspect() {
    this._inspector?.start();
  },

  /**
   * Stop component inspection mode.
   */
  stopInspect() {
    this._inspector?.stop();
  },

  /**
   * Toggle component inspection mode.
   */
  toggleInspect() {
    this._inspector?.toggle();
  },
};

// Expose to global scope for console access
declare global {
  interface Window {
    Devtools: typeof Devtools;
  }
}
window.Devtools = Devtools;

