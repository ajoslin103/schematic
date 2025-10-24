# Schematic

A lightweight [Fabric.js](https://fabricjs.com/) library for working with canvas objects above an interactive coordinate grid.

[![Demo Video](https://customer-07ipt1f17u9wyil4.cloudflarestream.com/d7447956e969ce80d2f0113a59a04324/thumbnails/thumbnail.jpg?time=&height=600)](https://customer-07ipt1f17u9wyil4.cloudflarestream.com/d7447956e969ce80d2f0113a59a04324/watch)

<small>(click image to watch video)</small>

## Features

- **Interactive coordinate grid** with pan, zoom, and configurable units (points, imperial, metric)
- **Built on Fabric.js v6+** – full access to Fabric's powerful canvas API
- **Mouse/touch interactions** – wheel zoom, right-click panning, optional origin pinning
- **TypeScript support** with full type definitions
- **Flexible architecture** – use high-level `Schematic` or low-level `Map` API
- **Debug system** with granular logging categories
- **Zero dependencies** (except Fabric.js peer dependency)

## Architecture

```
Your App → Schematic → Map → Fabric Canvas
                       ↓
                     Grid (renders behind objects)
```

### Core Components

**Schematic** – Main entry point with event system and interaction controls  
**Map** – Manages Fabric canvas lifecycle and grid synchronization  
**Grid** – Renders coordinate grid, axis, and labels beneath Fabric objects  
**Base** – Shared configuration foundation for all components

## Installation

```bash
npm install @ajoslin103/schematic fabric
# or
yarn add @ajoslin103/schematic fabric
```

**Requirements:**
- Fabric.js `^6.7.1` (peer dependency)
- Modern browser with ES6+ support

**Package exports:**
- ESM: `dist/schematic.esm.js`
- CommonJS: `dist/schematic.cjs.js`
- UMD: `dist/schematic.umd.js`
- TypeScript types: `dist/types/index.d.ts`

## Quick Start

### Basic Usage

```javascript
import { Schematic } from '@ajoslin103/schematic';
import * as fabric from 'fabric';

const container = document.getElementById('canvas-container');
const schematic = new Schematic(container, {
  gridEnabled: true,
  units: 'points',
  zoomDebounceDelay: 200
});

// Access the Fabric canvas
const canvas = schematic.fabricCanvas;

// Configure zoom behavior
schematic.setZoomLimits(0.1, 10);
schematic.setZoom(1);

// Add Fabric objects
const rect = new fabric.Rect({
  left: 100,
  top: 100,
  width: 200,
  height: 150,
  fill: '#4CAF50'
});
canvas.add(rect);
```

### TypeScript

```typescript
import { Schematic, SchematicOptions } from '@ajoslin103/schematic';
import { Rect } from 'fabric';

const container = document.getElementById('canvas-container');
if (!container) throw new Error('Container not found');

const options: SchematicOptions = {
  gridEnabled: true,
  units: 'imperial',
  mouseWheelZoom: true,
  zoomOnCenter: false
};

const schematic = new Schematic(container, options);

// Configure
schematic.setZoomLimits(0.1, 10);
schematic.setShowGrid(true);
schematic.setUnits('metric');

// Add objects with type safety
const rect = new Rect({
  left: 50,
  top: 50,
  width: 100,
  height: 100,
  fill: 'rgba(255, 99, 71, 0.8)'
});
schematic.fabricCanvas.add(rect);
```

### Event Handling

```javascript
// Listen to zoom events
schematic.on('zoom:change', (data) => {
  console.log('Zoom changed:', data.zoom);
});

schematic.on('zoom:completed', (data) => {
  console.log('Zoom completed:', data.zoom);
});

// Listen to pan events
schematic.on('pan:completed', (data) => {
  console.log('Pan completed:', data);
});

// Grid visibility changes
schematic.on('grid:change', (data) => {
  console.log('Grid visibility:', data.enabled);
});
```

### Advanced Configuration

```javascript
// Pin origin to corner (locks grid to viewport)
schematic.setOriginPin('TOP_LEFT', 15);
// Options: 'TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER', 'NONE'

// Reset view to initial state
schematic.resetView();

// Toggle grid visibility
schematic.setShowGrid(false);

// Change units dynamically
schematic.setUnits('metric'); // 'points' | 'imperial' | 'metric'

// Control zoom behavior
schematic.setZoomOnCenter(true); // Zoom around center vs mouse position
```

## API Reference

### Schematic Class

**Constructor:**
```typescript
new Schematic(container: HTMLElement, options?: SchematicOptions)
```

**Properties:**
- `fabricCanvas` – Fabric.js Canvas instance
- `mapInstance` – Underlying Map instance
- `gridEnabled` – Grid visibility state
- `zoomOnCenter` – Zoom around center vs mouse
- `units` – Current unit system

**Methods:**
- `setZoom(zoom: number)` – Set zoom level
- `setZoomLimits(min: number, max: number)` – Clamp zoom range
- `setShowGrid(enabled: boolean)` – Toggle grid visibility
- `setOriginPin(pin: string, margin: number)` – Pin origin to corner
- `setUnits(units: 'points' | 'imperial' | 'metric')` – Change units
- `setZoomOnCenter(enabled: boolean)` – Control zoom anchor
- `resetView()` – Reset to initial view
- `on(event: string, callback: Function)` – Subscribe to event
- `off(event: string, callback?: Function)` – Unsubscribe
- `emit(event: string, data: any)` – Emit custom event

**Events:**
- `zoom` – Zoom in progress
- `zoom:change` – Zoom changed
- `zoom:completed` – Zoom finished
- `pan:move` – Pan in progress
- `pan:completed` – Pan finished
- `grid:change` – Grid visibility changed
- `view:reset` – View reset triggered

### Map Class (Low-level)

**Constructor:**
```typescript
new Map(container: HTMLElement, options?: BaseOptions)
```

**Methods:**
- `setZoom(zoom: number)` – Set zoom
- `onResize(width: number, height: number)` – Handle resize
- `update()` – Force grid sync
- `reset()` – Reset viewport

### Grid Class

**Properties:**
- `visible` – Grid visibility
- `units` – Unit system
- `step` – Grid step size
- `scale` – Grid scale

**Methods:**
- `setUnits(units: string)` – Change units
- `show(visible?: boolean)` – Show/hide grid
- `render()` – Force redraw

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
  console.log('Units debug enabled');
}
```

## Interactions

**Mouse:**
- **Scroll wheel** – Zoom in/out (with configurable limits)
- **Alt/Option + scroll** – Zoom around cursor position
- **Right-click + drag** – Pan canvas (or Ctrl+Left on macOS)
- **Left-click** – Select/interact with Fabric objects

**Programmatic:**
- `setZoom()`, `setZoomLimits()` – Control zoom
- `setOriginPin()` – Lock origin to viewport corner
- `resetView()` – Return to initial state

## Development

**Setup:**
```bash
git clone https://github.com/ajoslin103/schematic.git
cd schematic
npm install
```

**Scripts:**
- `npm run dev` – Start dev server with live reload
- `npm run build` – Build all bundles (CJS, ESM, UMD) + types
- `npm run watch` – Watch mode for development
- `npm run serve` – Serve demo files

**Project Structure:**
```
src/
├── core/          # Schematic, Base, Debug, Constants
├── map/           # Map class
├── grid/          # Grid rendering
├── geometry/      # Point utilities
├── components/    # Calibration tools
└── lib/           # Helper functions
```

## Notes

- Grid renders in Fabric's `before:render` phase and never mutates Fabric objects
- Grid Y-axis is inverted for display; Fabric world coordinates remain standard
- Integer snapping enabled by default for object positioning
- TypeScript definitions included for full IDE support

## Credits

Built on the foundation of [IndoorJS](https://github.com/mudin/indoorjs) by [Mudin](https://github.com/mudin).

## License

MIT © Allen Joslin
