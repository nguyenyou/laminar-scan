// Import web component (registers custom element as side effect)
import './frontend-devtools/frontend-devtools'
import { persistenceStorage, StorageKeys } from './frontend-devtools/core/persistence-storage'

// Get or create the frontend-devtools element
function getOrCreateDevtoolsElement(): HTMLElement {
  const existing = document.querySelector('frontend-devtools')
  if (existing) {
    return existing as HTMLElement
  }
  const element = document.createElement('frontend-devtools')
  return element
}

// Append devtools element to the body if not already present
function appendDevtoolsElement(element: HTMLElement): void {
  if (!element.parentNode && document.body) {
    document.body.appendChild(element)
  }
}

// Remove devtools element from DOM
function removeDevtoolsElement(): void {
  const element = document.querySelector('frontend-devtools')
  if (element?.parentNode) {
    element.parentNode.removeChild(element)
  }
}

function enableDevtools(): void {
  persistenceStorage.setBoolean(StorageKeys.DEVTOOLS_ENABLED, true)
  persistenceStorage.setBoolean(StorageKeys.DEVTOOLS_HIDDEN, false)
  const element = getOrCreateDevtoolsElement()
  element.setAttribute('enable', 'true')
  appendDevtoolsElement(element)
  // Ensure panel is visible
  if ((element as any).show) {
    ;(element as any).show()
  }
  console.log('Devtools enabled.')
}

const DevtoolsAPI = {
  /** Enable and show devtools. */
  enable: enableDevtools,

  /** Alias for enable(). */
  show: enableDevtools,

  disable(): void {
    persistenceStorage.setBoolean(StorageKeys.DEVTOOLS_ENABLED, false)
    removeDevtoolsElement()
    console.log('Devtools disabled.')
  },

  isEnabled(): boolean {
    return persistenceStorage.getBoolean(StorageKeys.DEVTOOLS_ENABLED)
  },

  /**
   * Hide the devtools panel UI.
   * Only hotkey (Ctrl+Shift+C) to toggle inspect mode remains active.
   * Other features like FPS, mutation scan, memory monitor are disabled.
   * Does nothing if devtools is not enabled.
   */
  hide(): void {
    const element = document.querySelector('frontend-devtools') as any
    if (element?.hide) {
      element.hide()
      console.log('Devtools hidden. Use Ctrl+Shift+C to inspect, or Devtools.show() to restore.')
    }
  },

  /**
   * Check if devtools is currently hidden.
   */
  isHidden(): boolean {
    return persistenceStorage.getBoolean(StorageKeys.DEVTOOLS_HIDDEN)
  },
}

;(window as any).Devtools = DevtoolsAPI

// Auto-initialize if enabled in storage
function initializeDevtools(): void {
  if (DevtoolsAPI.isEnabled()) {
    const element = getOrCreateDevtoolsElement()
    element.setAttribute('enable', 'true')
    appendDevtoolsElement(element)
  }
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDevtools, { once: true })
} else {
  // DOM is already ready
  initializeDevtools()
}