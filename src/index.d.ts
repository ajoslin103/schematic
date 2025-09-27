// Type definitions for @ajoslin103/schematic

import { BaseOptions, SchematicOptions, FabricCanvas } from './core/types';

// Base class
export class Base {
  constructor(options?: Record<string, unknown>);
  _options: Record<string, unknown>;
}

// Constants
export enum MAP {
  STEP = 10,
  SCALE = 100,
  WIDTH = 1000,
  HEIGHT = 1001,
  ORIGIN = 'NONE',
  MARGIN = 15
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
  constructor(options?: Record<string, unknown>);
  object: unknown;
}

export class Grid extends Base {
  constructor(container: HTMLElement, options?: Record<string, unknown>);
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
  constructor(options?: Record<string, unknown>);
  container: HTMLElement;
  zoom: number;
  onResize(width: number, height: number): void;
}

export function map(options?: Record<string, unknown>): Map;

// Schematic
export class Schematic extends Base {
  constructor(container: HTMLElement | string, options?: SchematicOptions);
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  fabric: FabricCanvas;
  width: number;
  height: number;
  listeners: Record<string, ((data: unknown) => void)[]>;
  mapInstance: Map;
  zoomOnCenter: boolean;
  
  initialize(): void;
  on(event: string, callback: (data: unknown) => void): void;
  off(event: string, callback?: (data: unknown) => void): void;
  trigger(event: string, data?: unknown): void;
  setZoom(zoom: number): Schematic;
  setZoomLimits(min: number, max: number): Schematic;
  setOriginPin(origin: string, margin: number): Schematic;
  resetView(): Schematic;
  
  // Grid visibility methods
  showGrid(enabled: boolean): Schematic;
  getShowGrid(): boolean;
  toggleGridVisibility(visible: boolean): void;
  
  // Zoom center preference methods
  getZoomOnCenter(): boolean;
  setZoomOnCenter(enabled: boolean): void;
  
  // Scrollbar visibility methods
  getShowScrollbars(): boolean;
  setShowScrollbars(show: boolean): Schematic;
  
  // Units methods
  getUnits(): 'points' | 'imperial' | 'metric';
  setUnits(units: 'points' | 'imperial' | 'metric'): void;
}

export function schematic(container: HTMLElement | string, options?: SchematicOptions): Schematic;
