(function () {
  "use strict";

  // Configuration
  const PRIMARY_COLOR = { r: 115, g: 97, b: 230 };
  const TOTAL_FRAMES = 45;
  const INTERPOLATION_SPEED = 0.51; // Same as react-scan "fast" speed
  const MONO_FONT = "11px Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace";
  const DATA_SCALA_ATTR = "data-scala";

  // Inspect icon SVG (cursor style, same as react-scan)
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

  const FOCUS_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3"/>
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

  // Inspect state: 'off' | 'inspecting' | 'focused'
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

  function drawInspectOverlay(rect, componentName, isLocked) {
    if (!inspectCanvas) return;
    const ctx = inspectCanvas.getContext("2d");
    const dpr = Math.max(window.devicePixelRatio, 1);
    ctx.clearRect(0, 0, inspectCanvas.width / dpr, inspectCanvas.height / dpr);

    if (!rect) return;

    // Draw rectangle
    ctx.strokeStyle = "rgba(142, 97, 227, 0.5)";
    ctx.fillStyle = "rgba(173, 97, 230, 0.10)";
    ctx.lineWidth = 1;
    ctx.setLineDash(isLocked ? [] : [4]);
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

    // Draw label pill
    if (componentName) {
      const pillHeight = 24;
      const pillPadding = 8;
      const lockIconSize = isLocked ? 14 : 0;
      const lockIconPadding = isLocked ? 6 : 0;

      ctx.font = "12px system-ui, -apple-system, sans-serif";
      const textWidth = ctx.measureText(componentName).width;
      const pillWidth = textWidth + pillPadding * 2 + lockIconSize + lockIconPadding;
      const pillX = rect.left;
      const pillY = rect.top - pillHeight - 4;

      // Pill background
      ctx.fillStyle = "rgba(37, 37, 38, 0.75)";
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3);
      ctx.fill();

      // Lock icon if focused
      if (isLocked) {
        const lockX = pillX + pillPadding;
        const lockY = pillY + (pillHeight - lockIconSize) / 2 + 2;
        ctx.save();
        ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        ctx.lineWidth = 1.5;
        // Shackle
        const shackleWidth = lockIconSize * 0.6;
        const shackleHeight = lockIconSize * 0.5;
        ctx.beginPath();
        ctx.arc(lockX + shackleWidth / 2 + (lockIconSize - shackleWidth) / 2, lockY + shackleHeight / 2, shackleWidth / 2, Math.PI, 0, false);
        ctx.stroke();
        // Body
        const bodyWidth = lockIconSize * 0.8;
        const bodyHeight = lockIconSize * 0.5;
        ctx.fillRect(lockX + (lockIconSize - bodyWidth) / 2, lockY + shackleHeight / 2, bodyWidth, bodyHeight);
        ctx.restore();
      }

      // Text
      ctx.fillStyle = "white";
      ctx.textBaseline = "middle";
      ctx.fillText(componentName, pillX + pillPadding + lockIconSize + lockIconPadding, pillY + pillHeight / 2);
    }
  }

  function animateInspectRect(targetRect, componentName, isLocked) {
    if (!inspectCurrentRect) {
      inspectCurrentRect = { ...targetRect };
      drawInspectOverlay(inspectCurrentRect, componentName, isLocked);
      return;
    }

    const animate = () => {
      inspectCurrentRect.left = lerp(inspectCurrentRect.left, targetRect.left);
      inspectCurrentRect.top = lerp(inspectCurrentRect.top, targetRect.top);
      inspectCurrentRect.width = lerp(inspectCurrentRect.width, targetRect.width);
      inspectCurrentRect.height = lerp(inspectCurrentRect.height, targetRect.height);

      drawInspectOverlay(inspectCurrentRect, componentName, isLocked);

      const stillMoving =
        Math.abs(inspectCurrentRect.left - targetRect.left) > 0.5 ||
        Math.abs(inspectCurrentRect.top - targetRect.top) > 0.5 ||
        Math.abs(inspectCurrentRect.width - targetRect.width) > 0.5 ||
        Math.abs(inspectCurrentRect.height - targetRect.height) > 0.5;

      if (stillMoving) {
        inspectRafId = requestAnimationFrame(animate);
      } else {
        inspectCurrentRect = { ...targetRect };
        drawInspectOverlay(inspectCurrentRect, componentName, isLocked);
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
        drawInspectOverlay(null, null, false);
      }
      return;
    }

    if (component.element === inspectLastHovered) return;
    inspectLastHovered = component.element;

    const rect = component.element.getBoundingClientRect();
    animateInspectRect(
      { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      component.name,
      false
    );
  }

  function handleInspectClick(e) {
    if (inspectState.kind !== "inspecting") return;
    if (!inspectLastHovered) return;

    e.preventDefault();
    e.stopPropagation();

    const component = getScalaComponent(inspectLastHovered);
    if (!component) return;

    inspectState = {
      kind: "focused",
      element: component.element,
      name: component.name,
    };

    const rect = component.element.getBoundingClientRect();
    animateInspectRect(
      { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      component.name,
      true
    );

    // Update toolbar button state
    if (Toolbar.updateInspectButton) Toolbar.updateInspectButton();
  }

  function handleInspectKeydown(e) {
    if (e.key === "Escape") {
      if (inspectState.kind === "focused") {
        // Go back to inspecting
        inspectState = { kind: "inspecting", hoveredElement: inspectLastHovered };
        if (inspectLastHovered) {
          const component = getScalaComponent(inspectLastHovered);
          if (component) {
            const rect = component.element.getBoundingClientRect();
            animateInspectRect(
              { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
              component.name,
              false
            );
          }
        }
        if (Toolbar.updateInspectButton) Toolbar.updateInspectButton();
      } else if (inspectState.kind === "inspecting") {
        stopInspecting();
      }
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
    switch (inspectState.kind) {
      case "off":
        startInspecting();
        break;
      case "inspecting":
        stopInspecting();
        break;
      case "focused":
        // Go back to inspecting mode
        inspectState = { kind: "inspecting", hoveredElement: inspectState.element };
        inspectLastHovered = inspectState.element;
        const component = getScalaComponent(inspectState.element);
        if (component) {
          const rect = component.element.getBoundingClientRect();
          animateInspectRect(
            { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
            component.name,
            false
          );
        }
        if (Toolbar.updateInspectButton) Toolbar.updateInspectButton();
        break;
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

  function createCanvas() {
    const c = document.createElement("canvas");
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

  function handleMutations(mutationsList) {
    if (!isEnabled) return;
    mutationsList.forEach((record) => {
      const target = record.target.nodeType === Node.ELEMENT_NODE
        ? record.target
        : record.target.parentElement;

      if (target) {
        highlightElement(target);
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            highlightElement(node);
          }
        });
      }
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

    isFocused() {
      return inspectState.kind === "focused";
    },

    getInspectState() {
      return inspectState;
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

  // Toolbar styles
  const TOOLBAR_STYLES = `
    .scala-devtools-toolbar {
      position: fixed;
      bottom: 16px;
      right: 16px;
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
    }
    .scala-devtools-label {
      font-weight: 500;
      color: #e5e5e5;
    }
    .scala-devtools-toggle {
      position: relative;
      width: 40px;
      height: 24px;
      cursor: pointer;
      display: inline-flex;
    }
    .scala-devtools-toggle input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      width: 100%;
      height: 100%;
      z-index: 1;
      margin: 0;
    }
    .scala-devtools-toggle-track {
      position: absolute;
      inset: 4px;
      background: #525252;
      border-radius: 9999px;
      transition: background-color 0.3s;
    }
    .scala-devtools-toggle input:checked + .scala-devtools-toggle-track {
      background: #7361e6;
    }
    .scala-devtools-toggle-thumb {
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
    .scala-devtools-toggle input:checked + .scala-devtools-toggle-track .scala-devtools-toggle-thumb {
      left: 100%;
      transform: translate(-100%, -50%);
      border-color: #7361e6;
    }
    .scala-devtools-fps {
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
    .scala-devtools-fps-value {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.025em;
      transition: color 0.15s ease-in-out;
      min-width: 24px;
      text-align: center;
    }
    .scala-devtools-fps-label {
      color: rgba(255,255,255,0.3);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.025em;
    }
    .scala-devtools-inspect-btn {
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
    .scala-devtools-inspect-btn:hover {
      background: rgba(255,255,255,0.1);
    }
    .scala-devtools-inspect-btn.active {
      color: #8e61e3;
    }
    .scala-devtools-inspect-btn svg {
      width: 16px;
      height: 16px;
    }
  `;

  // Toolbar
  const Toolbar = {
    rootContainer: null,
    shadowRoot: null,
    fpsValueElement: null,
    fpsIntervalId: null,
    inspectButton: null,

    createFPSMeter() {
      const container = document.createElement("div");
      container.className = "scala-devtools-fps";

      const value = document.createElement("span");
      value.className = "scala-devtools-fps-value";
      value.textContent = "60";
      this.fpsValueElement = value;

      const label = document.createElement("span");
      label.className = "scala-devtools-fps-label";
      label.textContent = "FPS";

      container.appendChild(value);
      container.appendChild(label);

      return container;
    },

    createInspectButton() {
      const btn = document.createElement("button");
      btn.className = "scala-devtools-inspect-btn";
      btn.title = "Inspect element";
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
      const isActive = inspectState.kind === "inspecting" || inspectState.kind === "focused";
      this.inspectButton.classList.toggle("active", isActive);
      // Change icon based on state
      if (inspectState.kind === "focused") {
        this.inspectButton.innerHTML = FOCUS_ICON_SVG;
        this.inspectButton.title = "Focused on component (click to inspect, Esc to exit)";
      } else {
        this.inspectButton.innerHTML = INSPECT_ICON_SVG;
        this.inspectButton.title = inspectState.kind === "inspecting" ? "Click element to focus (Esc to cancel)" : "Inspect element";
      }
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

    createToolbar() {
      const toolbar = document.createElement("div");
      toolbar.className = "scala-devtools-toolbar";

      // Add inspect button first
      const inspectBtn = this.createInspectButton();
      toolbar.appendChild(inspectBtn);

      const label = document.createElement("span");
      label.className = "scala-devtools-label";
      label.textContent = "Scala Devtools";
      toolbar.appendChild(label);

      const toggle = document.createElement("label");
      toggle.className = "scala-devtools-toggle";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = ScalaDevtools.isRunning();
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) ScalaDevtools.start();
        else ScalaDevtools.stop();
      });
      toggle.appendChild(checkbox);

      const track = document.createElement("div");
      track.className = "scala-devtools-toggle-track";
      const thumb = document.createElement("div");
      thumb.className = "scala-devtools-toggle-thumb";
      track.appendChild(thumb);
      toggle.appendChild(track);

      toolbar.appendChild(toggle);

      // Add FPS meter
      const fpsMeter = this.createFPSMeter();
      toolbar.appendChild(fpsMeter);

      return toolbar;
    },

    mount() {
      if (this.rootContainer) return;

      this.rootContainer = document.createElement("div");
      this.rootContainer.id = "scala-devtools-root";

      this.shadowRoot = this.rootContainer.attachShadow({ mode: "open" });

      const style = document.createElement("style");
      style.textContent = TOOLBAR_STYLES;
      this.shadowRoot.appendChild(style);

      const toolbar = this.createToolbar();
      this.shadowRoot.appendChild(toolbar);

      document.documentElement.appendChild(this.rootContainer);

      // Start FPS updates
      this.startFPSUpdates();
    },

    remove() {
      // Stop FPS updates
      this.stopFPSUpdates();

      if (fpsAnimationId) {
        cancelAnimationFrame(fpsAnimationId);
        fpsAnimationId = null;
      }

      if (this.rootContainer && this.rootContainer.parentNode) {
        this.rootContainer.parentNode.removeChild(this.rootContainer);
      }
      this.rootContainer = null;
      this.shadowRoot = null;
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

