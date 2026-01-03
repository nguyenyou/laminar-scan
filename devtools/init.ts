// ============================================================================
// INITIALIZATION
// ============================================================================
// Auto-mount logic when DOM is ready.
// ============================================================================

import { StorageManager } from "./storage";
import { Devtools } from "./api";

/**
 * Initialize devtools when the DOM is ready (if enabled).
 */
function initDevtools() {
  if (StorageManager.isDevtoolsEnabled()) {
    Devtools.init();
  }
}

// Auto-mount when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDevtools);
} else {
  initDevtools();
}

