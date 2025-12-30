(function () {
  "use strict";

  // Configuration
  const PRIMARY_COLOR = { r: 115, g: 97, b: 230 };
  const TOTAL_FRAMES = 45;
  const INTERPOLATION_SPEED = 0.51; // "fast" speed
  const MONO_FONT = "11px Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace";
  const DATA_SCALA_ATTR = "data-scala";
  const DEVTOOLS_ATTR = "data-frontend-devtools";

  // Scala element properties for source info
  const SCALA_SOURCE_PATH_PROP = "__scalasourcepath";
  const SCALA_SOURCE_LINE_PROP = "__scalasourceline";
  const SCALA_FILENAME_PROP = "__scalafilename";
  const SCALA_NAME_PROP = "__scalaname";
  const MARK_AS_COMPONENT_PROP = "__markascomponent";

  // Inspect icon SVG (cursor style)
  const INSPECT_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/>
    <path d="M5 3a2 2 0 0 0-2 2"/>
    <path d="M19 3a2 2 0 0 1 2 2"/>
    <path d="M5 21a2 2 0 0 1-2-2"/>
    <path d="M9 3h1"/>
    <path d="M9 21h2"/>
    <path d="M14 3h1"/>
    <path d="M3 9v1"/>
    <path d="M21 9v2"/>
    <path d="M3 14v1"/>
  </svg>`;

  // State
  let isEnabled = false;
  let observer = null;
  let canvas = null;
  let animationFrameId = null;
  let resizeHandler = null;
  const activeHighlights = new Map();

  // FPS tracking state
  let fps = 0;
  let fpsLastTime = performance.now();
  let fpsFrameCount = 0;
  let fpsInitialized = false;
  let fpsAnimationId = null;

  // FPS functions
  function updateFPS() {
    fpsFrameCount++;
    const now = performance.now();
    if (now - fpsLastTime >= 1000) {
      fps = fpsFrameCount;
      fpsFrameCount = 0;
      fpsLastTime = now;
    }
    fpsAnimationId = requestAnimationFrame(updateFPS);
  }

  function getFPS() {
    if (!fpsInitialized) {
      fpsInitialized = true;
      updateFPS();
      fps = 60; // Default until first measurement
    }
    return fps;
  }

  function getFPSColor(fps) {
    if (fps < 30) return "#EF4444"; // Red
    if (fps < 50) return "#F59E0B"; // Yellow
    return "rgb(214,132,245)"; // Purple
  }

  // Inspect state: 'off' | 'inspecting'
  let inspectState = { kind: "off" };
  let inspectCanvas = null;
  let inspectEventCatcher = null;
  let inspectCurrentRect = null;
  let inspectLastHovered = null;
  let inspectRafId = null;

  function getScalaComponent(element) {
    if (!element) return null;
    const closest = element.closest(`[${DATA_SCALA_ATTR}]`);
    if (!closest) return null;
    return {
      element: closest,
      name: closest.getAttribute(DATA_SCALA_ATTR),
    };
  }

  function createInspectCanvas() {
    const c = document.createElement("canvas");
    c.setAttribute(DEVTOOLS_ATTR, "inspect-canvas");
    const dpr = Math.max(window.devicePixelRatio, 1);
    Object.assign(c.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: `${window.innerWidth}px`,
      height: `${window.innerHeight}px`,
      pointerEvents: "none",
      zIndex: "2147483646",
      opacity: "0",
      transition: "opacity 0.15s ease-in-out",
    });
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    c.getContext("2d").scale(dpr, dpr);
    return c;
  }

  function createEventCatcher() {
    const div = document.createElement("div");
    div.setAttribute(DEVTOOLS_ATTR, "event-catcher");
    Object.assign(div.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      pointerEvents: "none",
      zIndex: "2147483645",
    });
    return div;
  }

  function drawInspectOverlay(rect, componentName, componentInfo) {
    if (!inspectCanvas) return;
    const ctx = inspectCanvas.getContext("2d");
    const dpr = Math.max(window.devicePixelRatio, 1);
    ctx.clearRect(0, 0, inspectCanvas.width / dpr, inspectCanvas.height / dpr);

    if (!rect) return;

    // Use different colors for marked components
    const isMarked = componentInfo?.isMarked || false;
    const strokeColor = isMarked ? "rgba(79, 192, 255, 0.6)" : "rgba(142, 97, 227, 0.5)";
    const fillColor = isMarked ? "rgba(79, 192, 255, 0.10)" : "rgba(173, 97, 230, 0.10)";

    // Draw rectangle
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4]);
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

    // Draw label pill
    if (componentName) {
      const pillHeight = 24;
      const pillPadding = 8;

      ctx.font = "12px system-ui, -apple-system, sans-serif";
      const textWidth = ctx.measureText(componentName).width;
      const pillWidth = textWidth + pillPadding * 2;
      const pillX = rect.left;
      const pillY = rect.top - pillHeight - 4;

      // Pill background - different color for marked components
      ctx.fillStyle = isMarked ? "rgba(20, 60, 80, 0.85)" : "rgba(37, 37, 38, 0.75)";
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3);
      ctx.fill();

      // Text - cyan tint for marked components
      ctx.fillStyle = isMarked ? "#79c0ff" : "white";
      ctx.textBaseline = "middle";
      ctx.fillText(componentName, pillX + pillPadding, pillY + pillHeight / 2);
    }
  }

  function animateInspectRect(targetRect, componentName, componentInfo) {
    if (!inspectCurrentRect) {
      inspectCurrentRect = { ...targetRect };
      drawInspectOverlay(inspectCurrentRect, componentName, componentInfo);
      return;
    }

    const animate = () => {
      inspectCurrentRect.left = lerp(inspectCurrentRect.left, targetRect.left);
      inspectCurrentRect.top = lerp(inspectCurrentRect.top, targetRect.top);
      inspectCurrentRect.width = lerp(inspectCurrentRect.width, targetRect.width);
      inspectCurrentRect.height = lerp(inspectCurrentRect.height, targetRect.height);

      drawInspectOverlay(inspectCurrentRect, componentName, componentInfo);

      const stillMoving =
        Math.abs(inspectCurrentRect.left - targetRect.left) > 0.5 ||
        Math.abs(inspectCurrentRect.top - targetRect.top) > 0.5 ||
        Math.abs(inspectCurrentRect.width - targetRect.width) > 0.5 ||
        Math.abs(inspectCurrentRect.height - targetRect.height) > 0.5;

      if (stillMoving) {
        inspectRafId = requestAnimationFrame(animate);
      } else {
        inspectCurrentRect = { ...targetRect };
        drawInspectOverlay(inspectCurrentRect, componentName, componentInfo);
      }
    };

    cancelAnimationFrame(inspectRafId);
    inspectRafId = requestAnimationFrame(animate);
  }

  function handleInspectPointerMove(e) {
    if (inspectState.kind !== "inspecting") return;

    inspectEventCatcher.style.pointerEvents = "none";
    const element = document.elementFromPoint(e.clientX, e.clientY);
    inspectEventCatcher.style.pointerEvents = "auto";

    if (!element) return;

    const component = getScalaComponent(element);
    if (!component) {
      if (inspectLastHovered) {
        inspectLastHovered = null;
        inspectCurrentRect = null;
        drawInspectOverlay(null, null, null);
      }
      return;
    }

    if (component.element === inspectLastHovered) return;
    inspectLastHovered = component.element;

    const rect = component.element.getBoundingClientRect();
    const info = getComponentInfo(component.element);
    animateInspectRect(
      { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      component.name,
      info
    );
  }

  function handleInspectClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (inspectState.kind !== "inspecting") return;
    if (!inspectLastHovered) return;

    const component = getScalaComponent(inspectLastHovered);
    if (!component) return;

    // Open file in IDE directly
    const sourcePath = getSourcePath(component.element);
    const sourceLine = getSourceLine(component.element);
    if (sourcePath) {
      openFileInIDE(sourcePath, sourceLine);
    } else {
      console.warn("ScalaDevtools: No source path found for element");
    }
  }

  function handleInspectKeydown(e) {
    if (e.key === "Escape" && inspectState.kind === "inspecting") {
      stopInspecting();
    }
  }

  function startInspecting() {
    if (inspectState.kind !== "off") return;

    inspectState = { kind: "inspecting", hoveredElement: null };

    // Create canvas and event catcher
    inspectCanvas = createInspectCanvas();
    inspectEventCatcher = createEventCatcher();

    document.body.appendChild(inspectCanvas);
    document.body.appendChild(inspectEventCatcher);

    // Fade in
    requestAnimationFrame(() => {
      inspectCanvas.style.opacity = "1";
      inspectEventCatcher.style.pointerEvents = "auto";
    });

    // Add event listeners
    document.addEventListener("pointermove", handleInspectPointerMove, { passive: true, capture: true });
    document.addEventListener("click", handleInspectClick, { capture: true });
    document.addEventListener("keydown", handleInspectKeydown);

    if (Toolbar.updateInspectButton) Toolbar.updateInspectButton();
  }

  function stopInspecting() {
    if (inspectState.kind === "off") return;

    inspectState = { kind: "off" };

    // Remove event listeners
    document.removeEventListener("pointermove", handleInspectPointerMove, { capture: true });
    document.removeEventListener("click", handleInspectClick, { capture: true });
    document.removeEventListener("keydown", handleInspectKeydown);

    // Cleanup
    cancelAnimationFrame(inspectRafId);
    inspectRafId = null;
    inspectCurrentRect = null;
    inspectLastHovered = null;

    if (inspectCanvas) {
      inspectCanvas.style.opacity = "0";
      setTimeout(() => {
        if (inspectCanvas && inspectCanvas.parentNode) {
          inspectCanvas.parentNode.removeChild(inspectCanvas);
        }
        inspectCanvas = null;
      }, 150);
    }

    if (inspectEventCatcher && inspectEventCatcher.parentNode) {
      inspectEventCatcher.parentNode.removeChild(inspectEventCatcher);
    }
    inspectEventCatcher = null;

    if (Toolbar.updateInspectButton) Toolbar.updateInspectButton();
  }

  function toggleInspect() {
    if (inspectState.kind === "off") {
      startInspecting();
    } else {
      stopInspecting();
    }
  }

  // Utility functions
  function lerp(start, end) {
    return start + (end - start) * INTERPOLATION_SPEED;
  }

  function getScalaSource(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!element) return null;

    const attr = element.getAttribute(DATA_SCALA_ATTR);
    if (attr) return attr;

    const closest = element.closest(`[${DATA_SCALA_ATTR}]`);
    return closest ? closest.getAttribute(DATA_SCALA_ATTR) : null;
  }

  // Get source path from element (uses __scalasourcepath property)
  function getSourcePath(element) {
    if (!element) return null;
    return element[SCALA_SOURCE_PATH_PROP] || null;
  }

  // Get source line from element (uses __scalasourceline property)
  function getSourceLine(element) {
    if (!element) return null;
    const line = element[SCALA_SOURCE_LINE_PROP];
    return line !== undefined ? String(line) : null;
  }

  // Get filename from element (uses __scalafilename property)
  function getFilename(element) {
    if (!element) return null;
    return element[SCALA_FILENAME_PROP] || null;
  }

  // Get scala name (method/function name) from element
  function getScalaName(element) {
    if (!element) return null;
    return element[SCALA_NAME_PROP] || null;
  }

  // Check if element is marked as component
  function isMarkedAsComponent(element) {
    if (!element) return false;
    return element[MARK_AS_COMPONENT_PROP] === "true";
  }

  // Get component info object with all available source information
  function getComponentInfo(element) {
    if (!element) return null;
    return {
      sourcePath: getSourcePath(element),
      sourceLine: getSourceLine(element),
      filename: getFilename(element),
      scalaName: getScalaName(element),
      isMarked: isMarkedAsComponent(element),
      displayName: element.getAttribute(DATA_SCALA_ATTR)
    };
  }

  // Open file at source path using IDEA protocol
  function openFileInIDE(sourcePath, sourceLine) {
    if (!sourcePath) {
      console.warn("ScalaDevtools: No source path provided");
      return;
    }

    // Build IDEA URI: idea://open?file=<path>&line=<line>
    let uri = `idea://open?file=${sourcePath}`;
    if (sourceLine) {
      uri += `&line=${sourceLine}`;
    }

    console.log("ScalaDevtools: Opening file in IDE:", uri);
    window.open(uri, "_blank");
  }

  function createCanvas() {
    const c = document.createElement("canvas");
    c.setAttribute(DEVTOOLS_ATTR, "canvas");
    const dpr = Math.max(window.devicePixelRatio, 1);

    Object.assign(c.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: `${window.innerWidth}px`,
      height: `${window.innerHeight}px`,
      pointerEvents: "none",
      zIndex: "2147483647",
    });

    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;

    document.body.appendChild(c);

    const ctx = c.getContext("2d");
    ctx.scale(dpr, dpr);

    return c;
  }

  function drawHighlights() {
    if (!isEnabled || !canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.max(window.devicePixelRatio, 1);

    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    const toRemove = [];
    const labelMap = new Map();

    activeHighlights.forEach((highlight, element) => {
      // Interpolate position
      highlight.x = lerp(highlight.x, highlight.targetX);
      highlight.y = lerp(highlight.y, highlight.targetY);
      highlight.width = lerp(highlight.width, highlight.targetWidth);
      highlight.height = lerp(highlight.height, highlight.targetHeight);

      const alpha = 1.0 - highlight.frame / TOTAL_FRAMES;
      highlight.frame++;

      if (highlight.frame > TOTAL_FRAMES) {
        toRemove.push(element);
      } else {
        const { r, g, b } = PRIMARY_COLOR;

        // Draw outline
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(highlight.x, highlight.y, highlight.width, highlight.height);
        ctx.stroke();

        // Draw fill
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.1})`;
        ctx.fill();

        // Prepare label
        const labelKey = `${highlight.x},${highlight.y}`;
        const existing = labelMap.get(labelKey);
        if (!existing || existing.alpha < alpha) {
          labelMap.set(labelKey, { ...highlight, alpha });
        }
      }
    });

    // Draw labels
    ctx.font = MONO_FONT;
    labelMap.forEach(({ x, y, name, alpha }) => {
      const textWidth = ctx.measureText(name).width;
      const textHeight = 11;
      const padding = 2;

      let labelY = y - textHeight - padding * 2;
      if (labelY < 0) labelY = 0;

      const { r, g, b } = PRIMARY_COLOR;

      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(x, labelY, textWidth + padding * 2, textHeight + padding * 2);

      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillText(name, x + padding, labelY + textHeight + padding - 2);
    });

    toRemove.forEach((el) => activeHighlights.delete(el));

    if (activeHighlights.size > 0) {
      animationFrameId = requestAnimationFrame(drawHighlights);
    } else {
      animationFrameId = null;
    }
  }

  function highlightElement(element) {
    if (!isEnabled) return;
    if (canvas && element === canvas) return;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const name = getScalaSource(element) || element.tagName.toLowerCase();

    const existing = activeHighlights.get(element);
    if (existing) {
      existing.targetX = rect.left;
      existing.targetY = rect.top;
      existing.targetWidth = rect.width;
      existing.targetHeight = rect.height;
      existing.frame = 0;
    } else {
      activeHighlights.set(element, {
        element,
        name,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        targetX: rect.left,
        targetY: rect.top,
        targetWidth: rect.width,
        targetHeight: rect.height,
        frame: 0,
      });
    }

    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(drawHighlights);
    }
  }

  // Check if element is part of devtools UI (should be ignored by mutation observer)
  function isDevtoolsElement(element) {
    if (!element) return false;
    return element.hasAttribute(DEVTOOLS_ATTR) || element.closest(`[${DEVTOOLS_ATTR}]`);
  }

  function handleMutations(mutationsList) {
    if (!isEnabled) return;
    mutationsList.forEach((record) => {
      const target = record.target.nodeType === Node.ELEMENT_NODE
        ? record.target
        : record.target.parentElement;

      // Skip devtools elements
      if (!target || isDevtoolsElement(target)) return;

      highlightElement(target);
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && !isDevtoolsElement(node)) {
          highlightElement(node);
        }
      });
    });
  }

  function handleResize() {
    if (!canvas) return;
    const dpr = Math.max(window.devicePixelRatio, 1);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
  }

  // Devtools API
  const ScalaDevtools = {
    isRunning() {
      return isEnabled;
    },

    start() {
      if (isEnabled) return;
      isEnabled = true;

      canvas = createCanvas();

      resizeHandler = handleResize;
      window.addEventListener("resize", resizeHandler);

      observer = new MutationObserver(handleMutations);
      observer.observe(document.body, {
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true,
      });
    },

    stop() {
      if (!isEnabled) return;
      isEnabled = false;

      if (observer) {
        observer.disconnect();
        observer = null;
      }

      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = null;
      }

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
        canvas = null;
      }

      activeHighlights.clear();
    },

    toggle() {
      if (this.isRunning()) this.stop();
      else this.start();
    },

    // Inspect API
    isInspecting() {
      return inspectState.kind === "inspecting";
    },

    startInspect() {
      startInspecting();
    },

    stopInspect() {
      stopInspecting();
    },

    toggleInspect() {
      toggleInspect();
    },
  };

  // Drag and snap constants
  const SAFE_AREA = 16;
  const LOCALSTORAGE_KEY = "frontend-devtools-position";
  const DRAG_THRESHOLD = 5;
  const SNAP_THRESHOLD = 60;

  // Drag and snap state
  let toolbarPosition = { x: 0, y: 0 };
  let toolbarCorner = "bottom-right"; // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

  // Calculate position for a given corner
  function calculatePosition(corner, width, height) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const rightX = windowWidth - width - SAFE_AREA;
    const bottomY = windowHeight - height - SAFE_AREA;

    switch (corner) {
      case "top-left":
        return { x: SAFE_AREA, y: SAFE_AREA };
      case "top-right":
        return { x: rightX, y: SAFE_AREA };
      case "bottom-left":
        return { x: SAFE_AREA, y: bottomY };
      case "bottom-right":
      default:
        return { x: rightX, y: bottomY };
    }
  }

  // Determine best corner based on current position and movement
  function getBestCorner(mouseX, mouseY, initialMouseX, initialMouseY, threshold = 40) {
    const deltaX = mouseX - initialMouseX;
    const deltaY = mouseY - initialMouseY;

    const windowCenterX = window.innerWidth / 2;
    const windowCenterY = window.innerHeight / 2;

    // Determine movement direction
    const movingRight = deltaX > threshold;
    const movingLeft = deltaX < -threshold;
    const movingDown = deltaY > threshold;
    const movingUp = deltaY < -threshold;

    // If significant horizontal movement
    if (movingRight || movingLeft) {
      const isBottom = mouseY > windowCenterY;
      return movingRight
        ? (isBottom ? "bottom-right" : "top-right")
        : (isBottom ? "bottom-left" : "top-left");
    }

    // If significant vertical movement
    if (movingDown || movingUp) {
      const isRight = mouseX > windowCenterX;
      return movingDown
        ? (isRight ? "bottom-right" : "bottom-left")
        : (isRight ? "top-right" : "top-left");
    }

    // If no significant movement, use quadrant-based position
    return mouseX > windowCenterX
      ? (mouseY > windowCenterY ? "bottom-right" : "top-right")
      : (mouseY > windowCenterY ? "bottom-left" : "top-left");
  }

  // Save position to localStorage
  function saveToolbarPosition() {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({
        corner: toolbarCorner,
        position: toolbarPosition
      }));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Load position from localStorage
  function loadToolbarPosition() {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.corner) toolbarCorner = data.corner;
        if (data.position) toolbarPosition = data.position;
        return true;
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return false;
  }

  // Toolbar styles
  const TOOLBAR_WIDTH = 173; // Width in pixels for toolbar and tooltip

  const TOOLBAR_STYLES = `
    .frontend-devtools-toolbar {
      position: fixed;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #000;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      color: #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 2147483646;
      user-select: none;
      cursor: grab;
      touch-action: none;
      width: ${TOOLBAR_WIDTH}px;
      box-sizing: border-box;
    }
    .frontend-devtools-toolbar.dragging {
      cursor: grabbing;
      transition: none !important;
    }
    .frontend-devtools-toolbar.snapping {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .frontend-devtools-label {
      font-weight: 500;
      color: #e5e5e5;
    }
    .frontend-devtools-toggle {
      position: relative;
      width: 40px;
      height: 24px;
      cursor: pointer;
      display: inline-flex;
    }
    .frontend-devtools-toggle input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      width: 100%;
      height: 100%;
      z-index: 1;
      margin: 0;
    }
    .frontend-devtools-toggle-track {
      position: absolute;
      inset: 4px;
      background: #525252;
      border-radius: 9999px;
      transition: background-color 0.3s;
    }
    .frontend-devtools-toggle input:checked + .frontend-devtools-toggle-track {
      background: #7361e6;
    }
    .frontend-devtools-toggle-thumb {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      background: #fff;
      border: 2px solid #525252;
      border-radius: 9999px;
      transition: all 0.3s;
    }
    .frontend-devtools-toggle input:checked + .frontend-devtools-toggle-track .frontend-devtools-toggle-thumb {
      left: 100%;
      transform: translate(-100%, -50%);
      border-color: #7361e6;
    }
    .frontend-devtools-fps {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      height: 24px;
      border-radius: 6px;
      font-family: ui-monospace, monospace;
      background: #141414;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
    }
    .frontend-devtools-fps-value {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.025em;
      transition: color 0.15s ease-in-out;
      min-width: 24px;
      text-align: center;
    }
    .frontend-devtools-fps-label {
      color: rgba(255,255,255,0.3);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.025em;
    }
    .frontend-devtools-inspect-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #999;
      transition: color 0.15s, background 0.15s;
    }
    .frontend-devtools-inspect-btn:hover {
      background: rgba(255,255,255,0.1);
    }
    .frontend-devtools-inspect-btn.active {
      color: #8e61e3;
    }
    .frontend-devtools-inspect-btn svg {
      width: 16px;
      height: 16px;
    }
    /* Tooltip styles - fixed rectangle panel relative to toolbar */
    .frontend-devtools-toolbar::before {
      content: attr(data-active-tooltip);
      position: absolute;
      left: 0;
      bottom: calc(100% + 8px);
      width: ${TOOLBAR_WIDTH}px;
      min-height: 100px;
      padding: 12px;
      background: rgba(35, 35, 38, 0.98);
      color: #f0f0f0;
      font-size: 12px;
      font-weight: 400;
      line-height: 1.4;
      text-align: left;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08);
      box-sizing: border-box;
      display: block;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.2s ease-out, visibility 0.2s ease-out;
      z-index: 10;
      white-space: normal;
      overflow: hidden;
    }
    .frontend-devtools-toolbar.tooltip-visible::before {
      opacity: 1;
      visibility: visible;
    }
    /* Tooltip below (for top corners) */
    .frontend-devtools-toolbar.corner-top::before {
      bottom: auto;
      top: calc(100% + 8px);
    }
  `;

  // Toolbar
  const Toolbar = {
    rootContainer: null,
    shadowRoot: null,
    toolbarElement: null,
    fpsValueElement: null,
    fpsIntervalId: null,
    inspectButton: null,
    isDragging: false,
    resizeHandler: null,

    // Initialize toolbar position
    initPosition() {
      if (!this.toolbarElement) return;

      const rect = this.toolbarElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Try to load saved position
      if (!loadToolbarPosition()) {
        // Default to bottom-right
        toolbarCorner = "bottom-right";
        toolbarPosition = calculatePosition(toolbarCorner, width, height);
      } else {
        // Recalculate position for current corner (in case window was resized)
        toolbarPosition = calculatePosition(toolbarCorner, width, height);
      }

      this.applyPosition(false);
    },

    // Apply current position to toolbar
    applyPosition(animate = true) {
      if (!this.toolbarElement) return;

      if (animate) {
        this.toolbarElement.classList.add("snapping");
        this.toolbarElement.classList.remove("dragging");
      } else {
        this.toolbarElement.classList.remove("snapping", "dragging");
      }

      // Update corner class for tooltip positioning
      const isTop = toolbarCorner.startsWith("top");
      this.toolbarElement.classList.toggle("corner-top", isTop);

      this.toolbarElement.style.transform = `translate3d(${toolbarPosition.x}px, ${toolbarPosition.y}px, 0)`;
      this.toolbarElement.style.left = "0";
      this.toolbarElement.style.top = "0";

      if (animate) {
        // Remove snapping class after animation
        setTimeout(() => {
          if (this.toolbarElement) {
            this.toolbarElement.classList.remove("snapping");
          }
        }, 300);
      }
    },

    // Handle drag start
    handleDragStart(e) {
      // Don't drag if clicking on buttons or inputs
      if (e.target.closest("button") || e.target.closest("input") || e.target.closest("label")) {
        return;
      }

      e.preventDefault();

      const toolbar = this.toolbarElement;
      if (!toolbar) return;

      this.isDragging = false;
      const initialMouseX = e.clientX;
      const initialMouseY = e.clientY;
      const initialX = toolbarPosition.x;
      const initialY = toolbarPosition.y;

      let currentX = initialX;
      let currentY = initialY;
      let lastMouseX = initialMouseX;
      let lastMouseY = initialMouseY;
      let hasMoved = false;
      let rafId = null;

      const handlePointerMove = (e) => {
        if (rafId) return;

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        rafId = requestAnimationFrame(() => {
          const deltaX = lastMouseX - initialMouseX;
          const deltaY = lastMouseY - initialMouseY;

          // Check if we've moved enough to consider it a drag
          if (!hasMoved && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
            hasMoved = true;
            this.isDragging = true;
            toolbar.classList.add("dragging");
            toolbar.classList.remove("snapping");
          }

          if (hasMoved) {
            currentX = initialX + deltaX;
            currentY = initialY + deltaY;

            // Apply position directly (no transition during drag)
            toolbar.style.transition = "none";
            toolbar.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
          }

          rafId = null;
        });
      };

      const handlePointerEnd = () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerEnd);

        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }

        toolbar.classList.remove("dragging");
        this.isDragging = false;

        if (!hasMoved) return;

        // Calculate total movement
        const totalDeltaX = Math.abs(lastMouseX - initialMouseX);
        const totalDeltaY = Math.abs(lastMouseY - initialMouseY);
        const totalMovement = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);

        // Only snap if moved enough
        if (totalMovement < SNAP_THRESHOLD) {
          // Snap back to original position
          toolbarPosition = calculatePosition(toolbarCorner, toolbar.offsetWidth, toolbar.offsetHeight);
          this.applyPosition(true);
          return;
        }

        // Determine new corner based on drag direction and position
        const newCorner = getBestCorner(lastMouseX, lastMouseY, initialMouseX, initialMouseY, 40);

        // Calculate snap position for the new corner
        const rect = toolbar.getBoundingClientRect();
        toolbarCorner = newCorner;
        toolbarPosition = calculatePosition(newCorner, rect.width, rect.height);

        // Animate to snap position
        this.applyPosition(true);

        // Save to localStorage
        saveToolbarPosition();
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerEnd);
    },

    // Handle window resize
    handleResize() {
      if (!this.toolbarElement) return;

      const rect = this.toolbarElement.getBoundingClientRect();
      toolbarPosition = calculatePosition(toolbarCorner, rect.width, rect.height);
      this.applyPosition(false);
    },

    createFPSMeter() {
      const container = document.createElement("div");
      container.className = "frontend-devtools-fps";
      container.setAttribute("data-tooltip", "Frames per second — detect long-running scripts blocking the main thread");

      const value = document.createElement("span");
      value.className = "frontend-devtools-fps-value";
      value.textContent = "60";
      this.fpsValueElement = value;

      const label = document.createElement("span");
      label.className = "frontend-devtools-fps-label";
      label.textContent = "FPS";

      container.appendChild(value);
      container.appendChild(label);

      return container;
    },

    createInspectButton() {
      const btn = document.createElement("button");
      btn.className = "frontend-devtools-inspect-btn";
      btn.setAttribute("data-tooltip", "Inspect component — click to jump to source code in your IDE");
      btn.innerHTML = INSPECT_ICON_SVG;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleInspect();
      });
      this.inspectButton = btn;
      return btn;
    },

    updateInspectButton() {
      if (!this.inspectButton) return;
      const isActive = inspectState.kind === "inspecting";
      this.inspectButton.classList.toggle("active", isActive);
      this.inspectButton.setAttribute("data-tooltip", isActive ? "Click any component to open in IDE — press Esc to cancel" : "Inspect component — click to jump to source code in your IDE");
    },

    startFPSUpdates() {
      // Initialize FPS tracking
      getFPS();

      // Update FPS display every 200ms
      this.fpsIntervalId = setInterval(() => {
        if (this.fpsValueElement) {
          const currentFPS = getFPS();
          this.fpsValueElement.textContent = currentFPS;
          this.fpsValueElement.style.color = getFPSColor(currentFPS);
        }
      }, 200);
    },

    stopFPSUpdates() {
      if (this.fpsIntervalId) {
        clearInterval(this.fpsIntervalId);
        this.fpsIntervalId = null;
      }
    },

    // Setup tooltip event handlers for elements with data-tooltip
    setupTooltipEvents(toolbar) {
      const tooltipElements = toolbar.querySelectorAll("[data-tooltip]");
      tooltipElements.forEach((el) => {
        el.addEventListener("mouseenter", () => {
          const tooltipText = el.getAttribute("data-tooltip");
          toolbar.setAttribute("data-active-tooltip", tooltipText);
          toolbar.classList.add("tooltip-visible");
        });
        el.addEventListener("mouseleave", () => {
          toolbar.classList.remove("tooltip-visible");
        });
      });
    },

    createToolbar() {
      const toolbar = document.createElement("div");
      toolbar.className = "frontend-devtools-toolbar";

      // Add drag handler
      toolbar.addEventListener("pointerdown", (e) => this.handleDragStart(e));

      // Add inspect button first
      const inspectBtn = this.createInspectButton();
      toolbar.appendChild(inspectBtn);

      const toggle = document.createElement("label");
      toggle.className = "frontend-devtools-toggle";
      toggle.setAttribute("data-tooltip", "Highlight DOM mutations — detect unexpected re-renders");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = ScalaDevtools.isRunning();
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) ScalaDevtools.start();
        else ScalaDevtools.stop();
      });
      toggle.appendChild(checkbox);

      const track = document.createElement("div");
      track.className = "frontend-devtools-toggle-track";
      const thumb = document.createElement("div");
      thumb.className = "frontend-devtools-toggle-thumb";
      track.appendChild(thumb);
      toggle.appendChild(track);

      toolbar.appendChild(toggle);

      // Add FPS meter
      const fpsMeter = this.createFPSMeter();
      toolbar.appendChild(fpsMeter);

      // Setup tooltip events
      this.setupTooltipEvents(toolbar);

      this.toolbarElement = toolbar;
      return toolbar;
    },

    mount() {
      if (this.rootContainer) return;

      this.rootContainer = document.createElement("div");
      this.rootContainer.id = "frontend-devtools-root";
      this.rootContainer.setAttribute(DEVTOOLS_ATTR, "toolbar");

      this.shadowRoot = this.rootContainer.attachShadow({ mode: "open" });

      const style = document.createElement("style");
      style.textContent = TOOLBAR_STYLES;
      this.shadowRoot.appendChild(style);

      const toolbar = this.createToolbar();
      this.shadowRoot.appendChild(toolbar);

      document.documentElement.appendChild(this.rootContainer);

      // Initialize position after toolbar is in DOM (so we can measure it)
      requestAnimationFrame(() => {
        this.initPosition();
      });

      // Add resize handler
      this.resizeHandler = () => this.handleResize();
      window.addEventListener("resize", this.resizeHandler);

      // Start FPS updates
      this.startFPSUpdates();
    },

    remove() {
      // Stop FPS updates
      this.stopFPSUpdates();

      // Remove resize handler
      if (this.resizeHandler) {
        window.removeEventListener("resize", this.resizeHandler);
        this.resizeHandler = null;
      }

      if (fpsAnimationId) {
        cancelAnimationFrame(fpsAnimationId);
        fpsAnimationId = null;
      }

      if (this.rootContainer && this.rootContainer.parentNode) {
        this.rootContainer.parentNode.removeChild(this.rootContainer);
      }
      this.rootContainer = null;
      this.shadowRoot = null;
      this.toolbarElement = null;
      this.fpsValueElement = null;
    },
  };

  // Auto-mount toolbar when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => Toolbar.mount());
  } else {
    Toolbar.mount();
  }

  // Expose API globally
  window.ScalaDevtools = ScalaDevtools;
  window.ScalaDevtoolsToolbar = Toolbar;
})();

