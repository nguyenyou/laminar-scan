// Import web component (registers custom element as side effect)
import './frontend-devtools/frontend-devtools'

// Safely append the devtools element to the body
function appendDevtools(): void {
  if (!document.querySelector('frontend-devtools') && document.body) {
    document.body.appendChild(document.createElement('frontend-devtools'))
  }
}

// Wait for DOM to be ready before appending
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', appendDevtools, { once: true })
} else {
  // DOM is already ready
  appendDevtools()
}