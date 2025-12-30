(function () {
  "use strict";

  // Configuration
  const PRIMARY_COLOR = { r: 115, g: 97, b: 230 };
  const TOTAL_FRAMES = 45;
  const INTERPOLATION_SPEED = 0.1;
  const MONO_FONT = "11px Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace";
  const DATA_SCALA_ATTR = "data-scala";

  // State
  let isEnabled = false;
  let observer = null;
  let canvas = null;
  let animationFrameId = null;
  let resizeHandler = null;
  const activeHighlights = new Map();

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
  `;

  // Toolbar
  const Toolbar = {
    rootContainer: null,
    shadowRoot: null,

    createToolbar() {
      const toolbar = document.createElement("div");
      toolbar.className = "scala-devtools-toolbar";

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
    },

    remove() {
      if (this.rootContainer && this.rootContainer.parentNode) {
        this.rootContainer.parentNode.removeChild(this.rootContainer);
      }
      this.rootContainer = null;
      this.shadowRoot = null;
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

