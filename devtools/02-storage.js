// ============================================================================
// STORAGE MANAGER
// ============================================================================
// Centralized localStorage operations with error handling.
// ============================================================================

/**
 * Manages persistent storage operations with graceful error handling.
 * All localStorage access goes through this class.
 */
class StorageManager {
  /**
   * Get a value from localStorage.
   * @param {string} key - Storage key
   * @param {*} [defaultValue=null] - Default value if key doesn't exist or on error
   * @returns {*} Parsed value or default
   */
  static get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Get a raw string value from localStorage.
   * @param {string} key - Storage key
   * @param {string} [defaultValue=''] - Default value if key doesn't exist
   * @returns {string} Raw string value
   */
  static getString(key, defaultValue = "") {
    try {
      return localStorage.getItem(key) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Set a value in localStorage.
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be JSON serialized)
   * @returns {boolean} True if successful
   */
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set a raw string value in localStorage.
   * @param {string} key - Storage key
   * @param {string} value - String value to store
   * @returns {boolean} True if successful
   */
  static setString(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove a key from localStorage.
   * @param {string} key - Storage key to remove
   * @returns {boolean} True if successful
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if devtools is enabled.
   * Enabled by default unless explicitly disabled.
   * @returns {boolean} True if enabled
   */
  static isDevtoolsEnabled() {
    return this.getString(CONFIG.storageKeys.enabled) !== "false";
  }

  /**
   * Check if mutation scanning is enabled.
   * @returns {boolean} True if scanning is enabled
   */
  static isScanningEnabled() {
    return this.getString(CONFIG.storageKeys.scanning) === "true";
  }

  /**
   * Save scanning enabled state.
   * @param {boolean} enabled - Whether scanning is enabled
   */
  static setScanningEnabled(enabled) {
    this.setString(CONFIG.storageKeys.scanning, enabled ? "true" : "false");
  }

  /**
   * Get saved toolbar position.
   * @returns {{ corner: string, position: { x: number, y: number } } | null}
   */
  static getToolbarPosition() {
    return this.get(CONFIG.storageKeys.position, null);
  }

  /**
   * Save toolbar position.
   * @param {string} corner - Corner identifier
   * @param {{ x: number, y: number }} position - Position coordinates
   */
  static setToolbarPosition(corner, position) {
    this.set(CONFIG.storageKeys.position, { corner, position });
  }

  /**
   * Get saved collapsed state.
   * @returns {{ corner: string, orientation: string } | null}
   */
  static getCollapsedState() {
    return this.get(CONFIG.storageKeys.collapsed, null);
  }

  /**
   * Save collapsed state.
   * @param {{ corner: string, orientation: string } | null} state - Collapsed state or null
   */
  static setCollapsedState(state) {
    this.set(CONFIG.storageKeys.collapsed, state);
  }

  /**
   * Check if DOM stats is pinned.
   * @returns {boolean} True if pinned
   */
  static isDomStatsPinned() {
    return this.getString(CONFIG.storageKeys.domStatsPinned) === "true";
  }

  /**
   * Save DOM stats pinned state.
   * @param {boolean} pinned - Whether DOM stats is pinned
   */
  static setDomStatsPinned(pinned) {
    this.setString(CONFIG.storageKeys.domStatsPinned, pinned ? "true" : "false");
  }

  /**
   * Check if lag radar is pinned.
   * @returns {boolean} True if pinned
   */
  static isLagRadarPinned() {
    return this.getString(CONFIG.storageKeys.lagRadarPinned) === "true";
  }

  /**
   * Save lag radar pinned state.
   * @param {boolean} pinned - Whether lag radar is pinned
   */
  static setLagRadarPinned(pinned) {
    this.setString(CONFIG.storageKeys.lagRadarPinned, pinned ? "true" : "false");
  }
}

