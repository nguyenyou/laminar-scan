// Import web component (registers custom element as side effect)
import './frontend-devtools/frontend-devtools'

// Append to body if not already present
if (!document.querySelector('frontend-devtools')) {
  document.body.appendChild(document.createElement('frontend-devtools'))
}

