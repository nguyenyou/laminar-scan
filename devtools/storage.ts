// ============================================================================
// STORAGE MANAGER
// ============================================================================
// Centralized localStorage operations with error handling.
// ============================================================================

import { CONFIG } from "./config";

interface ToolbarPosition {
  corner: string;
  position: { x: number; y: number };
}

interface CollapsedState {
  corner: string;
  orientation: string;
}

/**
 * Manages persistent storage operations with graceful error handling.
 * All localStorage access goes through this class.
 */
export class StorageManager {
  /**
   * Get a value from localStorage.
   * @param key - Storage key
   * @param defaultValue - Default value if key doesn't exist or on error
   * @returns Parsed value or default
   */
  static get<T = any>(key: string, defaultValue: T | null = null): T | null {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Get a raw string value from localStorage.
   * @param key - Storage key
   * @param defaultValue - Default value if key doesn't exist
   * @returns Raw string value
   */
  static getString(key: string, defaultValue: string = ""): string {
    try {
      return localStorage.getItem(key) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Set a value in localStorage.
   * @param key - Storage key
   * @param value - Value to store (will be JSON serialized)
   * @returns True if successful
   */
  static set(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set a raw string value in localStorage.
   * @param key - Storage key
   * @param value - String value to store
   * @returns True if successful
   */
  static setString(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove a key from localStorage.
   * @param key - Storage key to remove
   * @returns True if successful
   */
  static remove(key: string): boolean {
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
   * @returns True if enabled
   */
  static isDevtoolsEnabled(): boolean {
    return this.getString(CONFIG.storageKeys.enabled) !== "false";
  }

  /**
   * Check if mutation scanning is enabled.
   * @returns True if scanning is enabled
   */
  static isScanningEnabled(): boolean {
    return this.getString(CONFIG.storageKeys.scanning) === "true";
  }

  /**
   * Save scanning enabled state.
   * @param enabled - Whether scanning is enabled
   */
  static setScanningEnabled(enabled: boolean): void {
    this.setString(CONFIG.storageKeys.scanning, enabled ? "true" : "false");
  }

  /**
   * Get saved toolbar position.
   * @returns Toolbar position or null
   */
  static getToolbarPosition(): ToolbarPosition | null {
    return this.get<ToolbarPosition>(CONFIG.storageKeys.position, null);
  }

  /**
   * Save toolbar position.
   * @param corner - Corner identifier
   * @param position - Position coordinates
   */
  static setToolbarPosition(corner: string, position: { x: number; y: number }): void {
    this.set(CONFIG.storageKeys.position, { corner, position });
  }

  /**
   * Get saved collapsed state.
   * @returns Collapsed state or null
   */
  static getCollapsedState(): CollapsedState | null {
    return this.get<CollapsedState>(CONFIG.storageKeys.collapsed, null);
  }

  /**
   * Save collapsed state.
   * @param state - Collapsed state or null
   */
  static setCollapsedState(state: CollapsedState | null): void {
    this.set(CONFIG.storageKeys.collapsed, state);
  }

  /**
   * Check if DOM stats is pinned.
   * @returns True if pinned
   */
  static isDomStatsPinned(): boolean {
    return this.getString(CONFIG.storageKeys.domStatsPinned) === "true";
  }

  /**
   * Save DOM stats pinned state.
   * @param pinned - Whether DOM stats is pinned
   */
  static setDomStatsPinned(pinned: boolean): void {
    this.setString(CONFIG.storageKeys.domStatsPinned, pinned ? "true" : "false");
  }

  /**
   * Check if lag radar is pinned.
   * @returns True if pinned
   */
  static isLagRadarPinned(): boolean {
    return this.getString(CONFIG.storageKeys.lagRadarPinned) === "true";
  }

  /**
   * Save lag radar pinned state.
   * @param pinned - Whether lag radar is pinned
   */
  static setLagRadarPinned(pinned: boolean): void {
    this.setString(CONFIG.storageKeys.lagRadarPinned, pinned ? "true" : "false");
  }
}

