// ============================================================================
// INITIALIZATION
// ============================================================================
// Auto-mount logic when DOM is ready.
// ============================================================================

/**
 * Initialize devtools when the DOM is ready (if enabled).
 */
function initDevtools() {
  if (StorageManager.isDevtoolsEnabled()) {
    FrontendDevtools.init();
  }
}

// Auto-mount when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDevtools);
} else {
  initDevtools();
}

