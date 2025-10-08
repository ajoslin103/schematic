# Schematic

A [fabric.js](https://fabricjs.com/) library, for working with fabric objects above a coordinate plane.

<div style="position: relative; padding-top: 102.69320843091334%;">
  <iframe
    src="https://customer-07ipt1f17u9wyil4.cloudflarestream.com/d7447956e969ce80d2f0113a59a04324/iframe?muted=true&preload=true&loop=true&autoplay=true&poster=https%3A%2F%2Fcustomer-07ipt1f17u9wyil4.cloudflarestream.com%2Fd7447956e969ce80d2f0113a59a04324%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600"
    loading="lazy"
    style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
    allowfullscreen="true"
  ></iframe>
</div>

## Architecture
                                        / -> Grid (draws lines/axes/labels)
                                       /
Your Application -> The Schematic -> The Map
                                           \
                                            \ -> Fabric.js canvas

### The Schematic

`Schematic` is the main entry point recommended for applications. It wraps a `Map` instance, exposing the underlying Fabric.js canvas via `schematic.fabricCanvas`, and forwards convenient methods and events for zooming, panning, and grid control.

It creates and owns the [Fabric.js](https://fabricjs.com/) canvas through the `Map`, provides event helpers (e.g. `on`, `off`, `once`, `emit`), and high-level controls like `setZoom()`, `setZoomLimits(min,max)`, `resetView()`, `setOriginPin(pin, margin)`, and `setShowGrid(true/false)`.

Interactions supported by default:
- Mouse wheel zoom with clamped limits; hold Alt/Option to zoom around the mouse position.
- ScrollBars, for moving about the canvas; or Right-click + drag-panning (Ctrl+Left on macOS)
- Programmatic `resetView()` to re-center and reset zoom.
- PinOrigin, which locks the grid/canvas origin to a viewport corner (disables panning)
- Units (Points, Imperial, Metric)

The schematic instance also exposes `mapInstance` for lower-level access when needed.

### The Map

`Map` creates and manages the Fabric.js canvas element and coordinates grid rendering relative to Fabric’s viewport transform. It keeps the grid aligned to the viewport center so grid lines remain consistent while you pan and zoom.

It listens to Fabric canvas events (via `Schematic`) and updates the grid state when the viewport changes. It also ensures grid rendering happens in Fabric’s `before:render` phase so the grid draws beneath objects.

`Map` exposes helpers:
- `setZoom(zoom)` and `setZoomLimits(min,max)` (via `Schematic`).
- `reset()` to restore initial zoom/origin.
- `onResize(width, height)` to resize the canvas and grid.

### The Grid

The `Grid` class uses the canvas 2D context (from Fabric’s canvas) to paint grid lines, axes, ticks, and labels. It displays a visible coordinate reference for Fabric objects without affecting those objects in any way.

The grid is stateless with respect to Fabric objects. Each time the viewport changes, the `Map` updates the grid’s center and zoom (using pure calculations) and triggers a draw; the effect is responsive without the grid owning any Fabric state.

### The Fabric.js canvas

The Fabric.js canvas does what it does — see their docs for details. The Fabric instance is available as `schematic.fabricCanvas` so your application can add and manipulate Fabric objects directly. Note: grid coordinates invert the Y axis for display, while Fabric’s world coordinates remain standard.

## Installation

- Peer dependency: `fabric@^6`
- Bundles: CommonJS, ESM, UMD (`dist/`)
- TypeScript type definitions included

```bash
npm install @ajoslin103/schematic fabric
# or
yarn add @ajoslin103/schematic fabric
```

## Quick start

The package exports both the `Schematic` class (recommended) and the lower-level `Map` class, along with all supporting utilities.

### Using Schematic (Recommended)

```javascript
// JavaScript
import { Schematic } from '@ajoslin103/schematic';

const container = document.getElementById('canvas-container');
const schematic = new Schematic(container, {
  setShowGrid: true,
  zoomDebounceDelay: 200
});

// Access Fabric.js instance
const fabricCanvas = schematic.fabric;

// Controls
schematic.setZoomLimits(0.05, 20);
schematic.setZoom(1);
schematic.setOriginPin('CENTER', 0); // or 'TOP_LEFT'|'TOP_RIGHT'|'BOTTOM_LEFT'|'BOTTOM_RIGHT'|'NONE'

// Add Fabric objects normally
const circle = new fabric.Circle({ left: 0, top: 0, radius: 50, fill: '#eee' });
fabricCanvas.add(circle);
```

### TypeScript Example

```typescript
import { Schematic } from '@ajoslin103/schematic';
import { Circle } from 'fabric';

const container = document.getElementById('canvas-container');
if (!container) throw new Error('Container not found');

const schematic = new Schematic(container, {
  setShowGrid: true,
  zoomDebounceDelay: 200
});

// Controls
schematic.setZoomLimits(0.05, 20);
schematic.setZoom(1);

// Add Fabric objects with type safety
const circle = new Circle({
  left: 0,
  top: 0,
  radius: 50,
  fill: '#eee',
  stroke: '#999',
  strokeWidth: 1
});
schematic.fabric.add(circle);
```

### Using the lower-level Map

```javascript
import { Map } from '@ajoslin103/schematic';

const container = document.getElementById('canvas-container');
const map = new Map(container, { setShowGrid: true });

// Access Fabric.js instance
const fabricCanvas = map.fabricCanvas;

// Controls
map.setZoom(1);
map.onResize(container.clientWidth, container.clientHeight);

// Add Fabric objects normally
const circle = new fabric.Circle({ left: 0, top: 0, radius: 50, fill: '#eee' });
fabricCanvas.add(circle);
```

## API overview (selected)

- **`Schematic(container, options)`**: creates a map + grid.
  - **Properties**: `fabricCanvas`, `mapInstance`.
  - **Events**: `zoom`, `zoom:change`, `zoom:completed`, `pan:move`, `pan:completed`, `grid:change`, `view:reset`.
  - **Methods**:
    - `setZoom(zoom)`
    - `setZoomLimits(min, max)`
    - `resetView()`
    - `setOriginPin(pin, margin)` and `setOriginScreen(x, y)`
    - `setShowGrid(visible)`
    - `addObject(obj)`, `removeObject(obj)` (delegate to `Map`)

- **`Map`** (lower-level): manages Fabric canvas and grid sync.
  - `setZoom(zoom)`, `reset()`, `onResize(w,h)`, `update()`

## Debug Logging

The library includes a centralized debug system that allows you to control console output by category. By default, all debug logging is disabled for production use.

### Enable all debug output

```javascript
const schematic = new Schematic(container, {
  debug: true  // Enable all debug categories
});
```

### Enable specific categories

```javascript
const schematic = new Schematic(container, {
  debug: {
    schematic: true,  // Schematic-level operations
    events: true,     // Mouse/interaction events
    grid: false,      // Grid rendering
    map: false,       // Map updates
    units: false,     // Unit conversions
    calibration: false // Calibration tools
  }
});
```

### Runtime control

```javascript
// Enable a category at runtime
schematic.debug.enable('events');

// Disable a category
schematic.debug.disable('grid');

// Enable all
schematic.debug.enable('all');

// Check if enabled
if (schematic.debug.isEnabled('units')) {
  // ...
}
```

## Development

- Demo: `npm run dev` (serves `demo/grid-demo.html` with live-reload)
- Build: `npm run build` (outputs `dist/schematic.*.js` via Rollup)
- Entry: `src/map/Map.js`; public wrappers: `src/core/Schematic.js`

## Notes

- Right-click (or Ctrl+Left on macOS) + drag to pan. Mouse wheel to zoom (Alt/Option anchors zoom to cursor).
- Grid renders in Fabric’s `before:render` and never mutates Fabric objects.
- Coordinates shown by the grid invert Y for display; Fabric world coordinates remain standard.

Schematic was based on the excellent original work of [IndoorJS](https://github.com/mudin/indoorjs) by [Mudin](https://github.com/mudin).

