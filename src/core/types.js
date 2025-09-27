/**
 * @typedef {Object} BaseOptions
 * @property {*} [key] - Any options property
 */

/**
 * @typedef {Object} SchematicOptions
 * @property {HTMLElement} [container] - Container element
 * @property {number} [width] - Width of the schematic
 * @property {number} [height] - Height of the schematic
 * @property {boolean} [gridEnabled] - Whether grid is enabled
 * @property {number} [gridStep] - Grid step size
 * @property {number} [gridScale] - Grid scale
 * @property {number} [zoomDebounceDelay] - Debounce delay for zoom events
 * @property {boolean} [zoomOnCenter] - Whether to zoom on center
 * @property {'points' | 'imperial' | 'metric'} [units] - Grid units
 * @property {boolean} [showGrid] - Whether to show grid
 */

/**
 * @typedef {Object} FabricCanvas
 * @property {function(Object): FabricCanvas} add - Add an object to the canvas
 * @property {function(Object): FabricCanvas} remove - Remove an object from the canvas
 * @property {function(): HTMLCanvasElement} getElement - Get the canvas element
 * @property {function({width: number, height: number}): FabricCanvas} setDimensions - Set canvas dimensions
 * @property {function(number[]): FabricCanvas} setViewportTransform - Set viewport transform
 * @property {number[]} [viewportTransform] - Current viewport transform
 * @property {function(string, function): FabricCanvas} on - Add event listener
 * @property {function(string, function=): FabricCanvas} off - Remove event listener
 * @property {HTMLCanvasElement} [upperCanvasEl] - Upper canvas element
 * @property {HTMLCanvasElement} [lowerCanvasEl] - Lower canvas element
 * @property {function(): CanvasRenderingContext2D} getContext - Get canvas context
 */

// Export the types for TypeScript
export const BaseOptions = {};
export const SchematicOptions = {};
export const FabricCanvas = {};

// Default export for module structure
export default { BaseOptions, SchematicOptions, FabricCanvas };
