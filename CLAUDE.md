# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Laminar Scan is a browser devtools overlay for debugging Scala.js/Laminar and React applications. It provides real-time performance monitoring (lag radar, memory charts, FPS), DOM mutation highlighting, and component inspection with IDE integration.

## Commands

```bash
# Development
bun dev              # Start Vite dev server
bun build            # Build for production with Vite
bun typecheck        # Run TypeScript type checking (uses tsgo)
bun lint             # Run oxlint with type-aware rules
bun format           # Format code with oxfmt

# Scala.js (Mill build tool)
./mill www.fastLinkJS    # Fast compile Scala.js
./mill www.fullLinkJS    # Production compile Scala.js
./mill __.fix            # Run Scalafix
./mill mill.scalalib.scalafmt/  # Format Scala code

# Build standalone devtools bundle (IIFE)
bun build.ts         # Outputs frontend-devtools.js
```

## Architecture

### Two Devtools Implementations

1. **`frontend-devtools/`** - TypeScript/Lit Web Components (primary)
   - Entry: `frontend-devtools-bootstrap.ts` → imports `frontend-devtools/frontend-devtools.ts`
   - Uses Lit 3 with decorators (`@customElement`, `@property`, `@state`)
   - Components prefixed with `fd-` (e.g., `fd-panel`, `fd-lag-radar`)
   - Global API exposed as `window.Devtools.enable()` / `window.Devtools.disable()`

2. **`devtools/`** - Vanilla TypeScript implementation (legacy/alternative)
   - Canvas-based rendering
   - Different architecture, not web components

### Frontend Devtools Structure

```
frontend-devtools/
├── frontend-devtools.ts    # Main <frontend-devtools> component
├── design-tokens.ts        # CSS custom properties
├── core/
│   ├── utilities.ts        # CONFIG object, helpers (lerp, debounce, clamp)
│   ├── persistence-storage.ts  # localStorage wrapper with typed keys
│   ├── performance-color.ts    # Shared color calculation for perf metrics
│   ├── react-inspector.ts      # React fiber tree traversal
│   └── fd-mem-observer.ts      # Memory usage observer singleton
└── ui/
    ├── fd-panel.ts             # Draggable/dockable container
    ├── fd-lag-radar.ts         # SVG-based frame time visualizer
    ├── fd-mem-chart.ts         # Memory usage line chart
    ├── fd-mutation-canvas.ts   # DOM mutation highlighter (MutationObserver)
    ├── fd-component-inspector.ts  # Click-to-inspect with IDE jumping
    └── ...                     # Other UI components
```

### Key Patterns

- **Resource cleanup**: All components with timers/observers clean up in `disconnectedCallback()`
- **State persistence**: `persistenceStorage` with `StorageKeys` enum for localStorage
- **Component detection**: Looks for `data-scala` attribute (Scala.js) or React fiber (`__reactFiber$`)
- **IDE integration**: Opens files via `idea://open?file=...&line=...` protocol

### Scala.js Side

```
laminar-devtools/        # Mill module - Laminar-specific devtools
www/                     # Demo app using laminar-devtools (via Mill)
```

## TypeScript Configuration Notes

- Uses `tsgo` (native TypeScript) for type checking
- Strict mode with `noUncheckedIndexedAccess`
- Lit decorators require `experimentalDecorators: true` and `useDefineForClassFields: false`
