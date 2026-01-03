// ============================================================================
// REACT INSPECTOR UTILITIES
// ============================================================================
// Utilities for inspecting React components from DOM nodes.
// Based on React's internal implementation.
// @see packages/react-dom-bindings/src/client/ReactDOMComponentTree.js
// @see packages/shared/getComponentNameFromType.js
// @see packages/react-reconciler/src/getComponentNameFromFiber.js
// ============================================================================

interface ReactFiber {
  type: any;
  memoizedProps: any;
  return: ReactFiber | null;
  [key: string]: any;
}

interface ReactComponentInfo {
  name: string;
  fiber: ReactFiber;
  props: any;
  element: Element;
}

interface ReactComponentResult {
  element: Element;
  name: string;
  isReact: true;
}

interface ReactSourceInfo {
  sourcePath: string | null;
  sourceLine: string | null;
  filename: string | null;
  scalaName: null;
  isMarked: false;
  isReact: true;
  displayName: string | null;
  props: any;
  fiber: ReactFiber;
}

/**
 * Get the React fiber attached to a DOM node.
 * React attaches fibers using '__reactFiber$' + randomKey
 */
function getReactFiber(domNode: Element | null): ReactFiber | null {
  try {
    if (!domNode) return null;

    const key = Object.keys(domNode).find(
      k => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$')
    );

    return key ? (domNode as any)[key] : null;
  } catch {
    return null;
  }
}

/**
 * Get the React props attached to a DOM node.
 * React attaches props using '__reactProps$' + randomKey
 */
export function getReactProps(domNode: Element | null): any {
  try {
    if (!domNode) return null;

    const key = Object.keys(domNode).find(k => k.startsWith('__reactProps$'));
    return key ? (domNode as any)[key] : null;
  } catch {
    return null;
  }
}

/**
 * Get component name from a React type.
 * Mirrors: packages/shared/getComponentNameFromType.js
 */
function getComponentNameFromType(type: any): string | null {
  try {
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
  } catch {
    return null;
  }
}

/**
 * Get component name from a React fiber.
 * Mirrors: packages/react-reconciler/src/getComponentNameFromFiber.js
 */
function getComponentNameFromFiber(fiber: ReactFiber | null): string | null {
  try {
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
  } catch {
    return null;
  }
}

/**
 * Get the nearest React component info for a DOM node.
 * Traverses up the fiber tree to find actual React components (skipping host components).
 */
export function getReactComponentFromNode(domNode: Element | null): ReactComponentInfo | null {
  try {
    const fiber = getReactFiber(domNode);
    if (!fiber) return null;

    let current: ReactFiber | null = fiber;
    let iterations = 0;
    const maxIterations = 500; // Prevent infinite loops

    while (current && iterations < maxIterations) {
      iterations++;
      const name = getComponentNameFromFiber(current);

      // Skip host components (DOM elements like 'div', 'span')
      if (name && typeof current.type !== 'string') {
        return {
          name,
          fiber: current,
          props: current.memoizedProps,
          element: domNode!, // The DOM node we started from
        };
      }

      current = current.return;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get all React components in the fiber tree for a DOM node.
 * Useful for getting the full component hierarchy.
 */
export function getAllReactComponentsFromNode(domNode: Element | null): Array<Omit<ReactComponentInfo, 'element'>> {
  try {
    const fiber = getReactFiber(domNode);
    if (!fiber) return [];

    const components: Array<Omit<ReactComponentInfo, 'element'>> = [];
    let current: ReactFiber | null = fiber;
    let iterations = 0;
    const maxIterations = 500; // Prevent infinite loops

    while (current && iterations < maxIterations) {
      iterations++;
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
  } catch {
    return [];
  }
}

/**
 * Get React component info in a format compatible with the inspector.
 */
export function getReactComponent(element: Element | null): ReactComponentResult | null {
  try {
    if (!element) return null;

    const reactInfo = getReactComponentFromNode(element);
    if (!reactInfo) return null;

    return {
      element: reactInfo.element,
      name: reactInfo.name,
      isReact: true,
    };
  } catch {
    return null;
  }
}

/**
 * Get source info for a React component (limited compared to Scala).
 * React components don't have built-in source mapping in production.
 * However, if the display name looks like a file path (contains /), treat it as source.
 */
export function getReactComponentSourceInfo(element: Element | null): ReactSourceInfo | null {
  try {
    const reactInfo = getReactComponentFromNode(element);
    if (!reactInfo) return null;

    // Check if the component name looks like a file path (contains /)
    // This allows components with path-like display names to support jump-to-source
    let sourcePath: string | null = null;
    let sourceLine: string | null = null;
    let filename: string | null = null;
    const name = reactInfo.name || "";

    if (name.includes("/")) {
      // Parse potential line number from format: "path/to/file.tsx:123"
      const lineMatch = name.match(/^(.+):(\d+)$/);
      if (lineMatch) {
        sourcePath = lineMatch[1] ?? null;
        sourceLine = lineMatch[2] ?? null;
      } else {
        sourcePath = name;
      }
      // Extract filename from path
      if (sourcePath) {
        const pathParts = sourcePath.split("/");
        filename = pathParts[pathParts.length - 1] ?? null;
      }
    }

    return {
      sourcePath,
      sourceLine,
      filename,
      scalaName: null,
      isMarked: false,
      isReact: true,
      displayName: reactInfo.name,
      props: reactInfo.props,
      fiber: reactInfo.fiber,
    };
  } catch {
    return null;
  }
}

