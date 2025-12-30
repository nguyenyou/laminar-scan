# Devtools Module Structure

This directory contains the refactored devtools code split into logical modules.

## File Order (for concatenation)

The files are numbered to indicate the correct order for combining:

```
00-config.js     - Configuration, icons, and styles
01-utilities.js  - Pure helper functions
02-storage.js    - StorageManager class
03-monitors.js   - FPSMonitor, MemoryMonitor classes
04-canvas.js     - HighlightCanvas, InspectOverlay classes
05-core.js       - MutationScanner, ComponentInspector classes
06-ui.js         - TooltipManager, DragController classes
07-toolbar.js    - Main Toolbar class
08-api.js        - FrontendDevtools public API facade
09-init.js       - Auto-initialization logic
```

## How to Combine into a Single File

### Option 1: Manual Copy-Paste

1. Create a new file starting with:
   ```javascript
   (function () {
     "use strict";
   ```

2. Copy contents of each file (00 through 09) in order

3. End the file with:
   ```javascript
   })();
   ```

### Option 2: Using the Build Script

Run the build script from the project root:

```bash
./devtools/build.sh
```

This will create `devtools.js` in the project root.

### Option 3: Using cat (Unix/Mac)

```bash
echo '(function () {
  "use strict";
' > devtools.js
cat devtools/00-config.js >> devtools.js
cat devtools/01-utilities.js >> devtools.js
cat devtools/02-storage.js >> devtools.js
cat devtools/03-monitors.js >> devtools.js
cat devtools/04-canvas.js >> devtools.js
cat devtools/05-core.js >> devtools.js
cat devtools/06-ui.js >> devtools.js
cat devtools/07-toolbar.js >> devtools.js
cat devtools/08-api.js >> devtools.js
cat devtools/09-init.js >> devtools.js
echo '})();' >> devtools.js
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       FrontendDevtools (API)                     │
├─────────────────────────────────────────────────────────────────┤
│   ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│   │ MutationScanner │  │ComponentInspector│  │    Toolbar    │  │
│   │                 │  │                  │  │               │  │
│   │ ┌─────────────┐ │  │ ┌──────────────┐ │  │ ┌───────────┐ │  │
│   │ │HighlightCan-│ │  │ │InspectOverlay│ │  │ │FPSMonitor │ │  │
│   │ │     vas     │ │  │ │              │ │  │ ├───────────┤ │  │
│   │ └─────────────┘ │  │ └──────────────┘ │  │ │MemoryMon- │ │  │
│   └─────────────────┘  └──────────────────┘  │ │   itor    │ │  │
│                                              │ ├───────────┤ │  │
│                                              │ │TooltipMgr │ │  │
│                                              │ ├───────────┤ │  │
│                                              │ │DragControl│ │  │
│                                              │ │   ler     │ │  │
│                                              │ └───────────┘ │  │
│                                              └───────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      StorageManager                              │
├─────────────────────────────────────────────────────────────────┤
│              CONFIG  │  ICONS  │  STYLES  │  Utilities           │
└─────────────────────────────────────────────────────────────────┘
```

## Class Responsibilities

| Class | Responsibility |
|-------|----------------|
| `CONFIG` | All configuration values and constants |
| `ICONS` | SVG icon definitions |
| `STYLES` | CSS styles for Shadow DOM |
| `StorageManager` | localStorage operations with error handling |
| `FPSMonitor` | Real-time FPS tracking via RAF |
| `MemoryMonitor` | JS heap memory tracking (Chrome only) |
| `HighlightCanvas` | Canvas for mutation highlight animations |
| `InspectOverlay` | Canvas for component inspection overlay |
| `MutationScanner` | DOM mutation observation and visualization |
| `ComponentInspector` | Component hover/click inspection mode |
| `TooltipManager` | Animated tooltip display |
| `DragController` | Drag-to-move and snap-to-corner behavior |
| `Toolbar` | Main UI component composing others |
| `FrontendDevtools` | Public API facade |

