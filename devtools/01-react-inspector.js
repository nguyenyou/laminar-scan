// ============================================================================
// REACT INSPECTOR UTILITIES
// ============================================================================
// Utilities for inspecting React components from DOM nodes.
// Based on React's internal implementation.
// @see packages/react-dom-bindings/src/client/ReactDOMComponentTree.js
// @see packages/shared/getComponentNameFromType.js
// @see packages/react-reconciler/src/getComponentNameFromFiber.js
// ============================================================================

/**
 * Get the React fiber attached to a DOM node.
 * React attaches fibers using '__reactFiber$' + randomKey
 * 
 * @param {Element} domNode - DOM node to inspect
 * @returns {object | null} React fiber or null
 */
function getReactFiber(domNode) {
  if (!domNode) return null;
  
  // React attaches fiber with: '__reactFiber$' + randomKey
  // Container roots use: '__reactContainer$' + randomKey
  const key = Object.keys(domNode).find(
    k => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$')
  );
  
  return key ? domNode[key] : null;
}

/**
 * Get the React props attached to a DOM node.
 * React attaches props using '__reactProps$' + randomKey
 * 
 * @param {Element} domNode - DOM node to inspect
 * @returns {object | null} React props or null
 */
function getReactProps(domNode) {
  if (!domNode) return null;
  
  const key = Object.keys(domNode).find(k => k.startsWith('__reactProps$'));
  return key ? domNode[key] : null;
}

/**
 * Get component name from a React type.
 * Mirrors: packages/shared/getComponentNameFromType.js
 * 
 * @param {*} type - React component type
 * @returns {string | null} Component name or null
 */
function getComponentNameFromType(type) {
  if (type == null) return null;
  
  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }
  
  if (typeof type === 'string') {
    return type; // Host component like 'div'
  }
  
  if (typeof type === 'object') {
    const $$typeof = type.$$typeof;
    if (!$$typeof) return null;
    
    const typeStr = $$typeof.toString();
    
    // ForwardRef
    if (typeStr === 'Symbol(react.forward_ref)') {
      const displayName = type.displayName;
      if (displayName) return displayName;
      const innerName = type.render?.displayName || type.render?.name || '';
      return innerName ? `ForwardRef(${innerName})` : 'ForwardRef';
    }
    
    // Memo
    if (typeStr === 'Symbol(react.memo)') {
      return type.displayName || getComponentNameFromType(type.type) || 'Memo';
    }
    
    // Lazy
    if (typeStr === 'Symbol(react.lazy)') {
      try {
        return getComponentNameFromType(type._init(type._payload));
      } catch {
        return null;
      }
    }
    
    // Context
    if (typeStr === 'Symbol(react.context)') {
      return (type.displayName || 'Context') + '.Provider';
    }
    
    if (typeStr === 'Symbol(react.consumer)') {
      return (type._context?.displayName || 'Context') + '.Consumer';
    }
  }
  
  return null;
}

/**
 * Get component name from a React fiber.
 * Mirrors: packages/react-reconciler/src/getComponentNameFromFiber.js
 * 
 * @param {object} fiber - React fiber
 * @returns {string | null} Component name or null
 */
function getComponentNameFromFiber(fiber) {
  if (!fiber) return null;
  
  const { type } = fiber;
  
  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }
  
  if (typeof type === 'string') {
    return type; // DOM element like 'div'
  }
  
  if (typeof type === 'object' && type !== null) {
    return getComponentNameFromType(type);
  }
  
  return null;
}

/**
 * Get the nearest React component info for a DOM node.
 * Traverses up the fiber tree to find actual React components (skipping host components).
 * 
 * @param {Element} domNode - DOM node to inspect
 * @returns {{ name: string, fiber: object, props: object, element: Element } | null} Component info or null
 */
function getReactComponentFromNode(domNode) {
  const fiber = getReactFiber(domNode);
  if (!fiber) return null;
  
  let current = fiber;
  while (current) {
    const name = getComponentNameFromFiber(current);
    
    // Skip host components (DOM elements like 'div', 'span')
    if (name && typeof current.type !== 'string') {
      return {
        name,
        fiber: current,
        props: current.memoizedProps,
        element: domNode, // The DOM node we started from
      };
    }
    
    current = current.return;
  }
  
  return null;
}

/**
 * Get all React components in the fiber tree for a DOM node.
 * Useful for getting the full component hierarchy.
 * 
 * @param {Element} domNode - DOM node to inspect
 * @returns {Array<{ name: string, fiber: object, props: object }>} Array of component info
 */
function getAllReactComponentsFromNode(domNode) {
  const fiber = getReactFiber(domNode);
  if (!fiber) return [];
  
  const components = [];
  let current = fiber;
  
  while (current) {
    const name = getComponentNameFromFiber(current);
    
    if (name && typeof current.type !== 'string') {
      components.push({
        name,
        fiber: current,
        props: current.memoizedProps,
      });
    }
    
    current = current.return;
  }
  
  return components;
}

/**
 * Get React component info in a format compatible with the inspector.
 * @param {Element} element - DOM element to inspect
 * @returns {{ element: Element, name: string, isReact: true } | null} Component info or null
 */
function getReactComponent(element) {
  if (!element) return null;
  
  const reactInfo = getReactComponentFromNode(element);
  if (!reactInfo) return null;
  
  return {
    element: reactInfo.element,
    name: reactInfo.name,
    isReact: true,
  };
}

/**
 * Get source info for a React component (limited compared to Scala).
 * React components don't have built-in source mapping in production.
 * 
 * @param {Element} element - DOM element
 * @returns {Object} Source information object
 */
function getReactComponentSourceInfo(element) {
  const reactInfo = getReactComponentFromNode(element);
  if (!reactInfo) return null;
  
  return {
    sourcePath: null, // React doesn't expose source paths in production
    sourceLine: null,
    filename: null,
    scalaName: null,
    isMarked: false,
    isReact: true,
    displayName: reactInfo.name,
    props: reactInfo.props,
    fiber: reactInfo.fiber,
  };
}


