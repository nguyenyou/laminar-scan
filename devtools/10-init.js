// ============================================================================
// INITIALIZATION
// ============================================================================
// Auto-mount logic when DOM is ready.
// ============================================================================

import { StorageManager } from "./02-storage.js";
import { Devtools } from "./09-api.js";

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

