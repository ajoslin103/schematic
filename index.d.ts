// Type definitions for @23/schematic
// Project: https://github.com/ajoslin103/schematic

// Define the minimal fabric types we need instead of importing them
// This prevents the JSR import error with 'fabric'
interface FabricCanvas {
  add(object: any): FabricCanvas;
  remove(object: any): FabricCanvas;
  getElement(): HTMLCanvasElement;
  setDimensions(dimensions: { width: number; height: number }): FabricCanvas;
  setViewportTransform(vpt: number[]): FabricCanvas;
  viewportTransform?: number[];
  on(eventName: string, handler: Function): FabricCanvas;
  off(eventName: string, handler?: Function): FabricCanvas;
  upperCanvasEl?: HTMLCanvasElement;
  lowerCanvasEl?: HTMLCanvasElement;
  getContext(): CanvasRenderingContext2D;
}

interface FabricObject {
  set(key: any, value?: any): FabricObject;
  get(key: string): any;
}

interface FabricPoint {
  x: number;
  y: number;
}

// Base types
export class Base {
  constructor(options?: Record<string, any>);
  _options: Record<string, any>;
}

// Constants
export enum MAP {
  STEP = 10,
  SCALE = 100,
  WIDTH = 1000,
  HEIGHT = 1000,
  ORIGIN = 'NONE',
  MARGIN = 10
}

export enum Modes {
  NONE = 'NONE',
  SELECT = 'SELECT',
  DRAG = 'DRAG',
  DRAW = 'DRAW',
  EDIT = 'EDIT'
}

export function initializeFabric(canvasId: string): FabricCanvas;

// Geometry
export class Point {
  constructor(x: number, y: number);
  x: number;
  y: number;
  clone(): Point;
  set(x: number, y: number): this;
  add(point: Point): this;
  sub(point: Point): this;
  multiply(scalar: number): this;
  divide(scalar: number): this;
  invert(): this;
  distance(point: Point): number;
  angle(point: Point): number;
  normalize(): this;
  toString(): string;
}

// Grid components
export class Axis extends Base {
  constructor(options?: Record<string, any>);
  object: FabricObject;
}

export class Grid extends Base {
  constructor(container: HTMLElement, options?: Record<string, any>);
  container: HTMLElement;
  canvas: FabricCanvas;
  width: number;
  height: number;
  visible: boolean;
  step: number;
  scale: number;
  scaleLines: number[];
  bgColor: string;
  lineColor: string;
  axisColor: string;
  showAxis: boolean;
  axisWidth: number;
  lineWidth: number;
  units: 'points' | 'imperial' | 'metric';
  
  initialize(): void;
  recalculate(): void;
  show(visible?: boolean): void;
  hide(): void;
  setStep(step: number): void;
  setScale(scale: number): void;
  setSize(width: number, height: number): void;
  setUnits(units: 'points' | 'imperial' | 'metric'): Grid;
  getUnits(): 'points' | 'imperial' | 'metric';
  draw(): void;
  clear(): void;
}

// Map components
export class Map extends Base {
  constructor(options?: Record<string, any>);
  container: HTMLElement;
  zoom: number;
  onResize(width: number, height: number): void;
}

export function map(options?: Record<string, any>): Map;

// Schematic
export interface SchematicOptions {
  container?: HTMLElement;
  width?: number;
  height?: number;
  gridEnabled?: boolean;
  gridStep?: number;
  gridScale?: number;
  zoomDebounceDelay?: number;
  zoomOnCenter?: boolean;
  units?: 'points' | 'imperial' | 'metric';
}

export class Schematic extends Base {
  constructor(container: HTMLElement | string, options?: SchematicOptions);
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  fabric: FabricCanvas;
  width: number;
  height: number;
  listeners: Record<string, Function[]>;
  mapInstance: Map;
  
  initialize(): void;
  on(event: string, callback: Function): void;
  off(event: string, callback?: Function): void;
  trigger(event: string, data?: any): void;
  setZoom(zoom: number): void;
  setZoomLimits(min: number, max: number): void;
  setOriginPin(origin: string, margin: number): void;
  resetView(): void;
  
  // Grid visibility methods
  setShowGrid(enabled: boolean): void;
  getShowGrid(): boolean;
  toggleGridVisibility(visible: boolean): void; // Implementation method
  
  // Zoom center preference methods
  getZoomOnCenter(): boolean;
  setZoomOnCenter(enabled: boolean): void;
  
  // Scrollbar visibility methods
  getShowScrollbars(): boolean;
  setShowScrollbars(show: boolean): void;
  
  // Units methods
  getUnits(): 'points' | 'imperial' | 'metric';
  setUnits(units: 'points' | 'imperial' | 'metric'): void;
  
  // Cleanup method
  destroy(): void;
}

export function schematic(container: HTMLElement | string, options?: SchematicOptions): Schematic;
