/**
 * Grid-Imperial.js
 * Imperial-specific grid implementation with fixed DPI and inch-based units.
 * This version removes unit-changing functionality and optimizes for imperial measurements.
 */

import Base from '../core/Base.js';
import Axis from './Axis.js';
import gridStyle from './gridStyle.js';

// Import Point as a named export
import { Point } from '../geometry/Point.js';
import {
  calcCoordinate,
  calculateLineCoordinates,
  calculateTicksAndLabels,
  calculateTickPoints,
} from './grid-calcs.js';
import alpha from '../lib/color-alpha.js';
import {
  clamp
} from '../lib/mumath/index.js';

// Imperial-specific constants
const GRID_DPI = 96;         // Pixels per inch at 100% zoom
const GRID_UNIT = 'Inches';  // Unit name
const POINTS_PER_INCH = 72;  // Standard conversion

// Grid spacing constants for imperial
const INCH_SPACING = 72;     // 1 inch = 72 points
const GRID_PRIMARY = 1;      // Primary grid in inches 
const GRID_SECONDARY = 0.5;  // Secondary grid in inches
const GRID_FINE = 0.25;      // Fine grid in inches

class GridImperial extends Base {
  constructor(context, opts) {
    super(opts);
    this.context = context;
    
    // Set imperial-specific properties
    this.dpi = GRID_DPI;
    this.units = 'imperial';
    this.unitName = GRID_UNIT;
    this.distance = INCH_SPACING;
    
    console.log('[GridImperial] Initialized with imperial units, DPI:', this.dpi);
    
    this.setDefaults();
    this.updateConfiguration(opts);
  }

  render() {
    this.draw();
    return this;
  }

  // Sets width of the grid canvas
  setWidth(width) {
    this.width = width;
    this.updateConfiguration();
  }

  // Sets height of the grid canvas
  setHeight(height) {
    this.height = height;
    this.updateConfiguration();
  }

  // Re-evaluate lines, calc options for renderer based on configuration
  updateConfiguration(opts) {
    if (!opts) opts = {};
    const shape = [this.width, this.height];
    
    // Imperial grid uses fixed spacing
    console.log(`[GridImperial] Using imperial grid spacing: ${this.distance} points (${this.distance/POINTS_PER_INCH} inches)`);

    // Calculate state for rendering
    this.state.x = this.calcCoordinate(this.axisX, shape, this);
    this.state.y = this.calcCoordinate(this.axisY, shape, this);
    this.state.x.opposite = this.state.y;
    this.state.y.opposite = this.state.x;
    
    return this;
  }

  // Update viewport with center position and zoom
  updateViewport(center) {
    const shape = [this.width, this.height];
    Object.assign(this.center, center);
    
    // Store unitToPixelSize if provided by FabricJS
    if (center.unitToPixelSize !== undefined) {
      this.unitToPixelSize = center.unitToPixelSize;
      console.log(`[GridImperial] Current unitToPixelSize: ${this.unitToPixelSize} pixels per inch`); 
    }
    
    // Calculate state for rendering
    this.state.x = this.calcCoordinate(this.axisX, shape, this);
    this.state.y = this.calcCoordinate(this.axisY, shape, this);
    this.state.x.opposite = this.state.y;
    this.state.y.opposite = this.state.x;

    // Update axis offsets
    this.axisX.offset = center.x;
    this.axisX.zoom = 1 / center.zoom;

    this.axisY.offset = center.y;
    this.axisY.zoom = 1 / center.zoom;
  }

  // Get state object with calculated params, ready for rendering
  calcCoordinate(coord, shape) {
    const state = calcCoordinate(coord, shape);
    state.grid = this;
    return state;
  }

  setDefaults() {
    // Create defaults object with basic axis functionality and applying grid styles
    const baseDefaults = {
      state: {},
      // Ensure a default color is present for calculations that depend on coord.color
      color: this.color || 'rgba(0,0,0,1)',
      
      // Geometry/viewport defaults expected by Axis/calculations
      zoom: 1,
      offset: 0,
      minZoom: -Infinity,
      maxZoom: Infinity,
      min: -Infinity,
      max: Infinity,
      axis: true,
      axisOrigin: 0,
      
      // Style defaults expected in grid-calcs and drawing
      padding: 0,
      tickAlign: 0.5,
      lineWidth: 1,
      axisWidth: 2,
      axisColor: 0.8,
      labels: true,
      lines: true,
      fontSize: '11pt',
      fontFamily: 'sans-serif',
      
      // Methods that will be overridden by specific axis implementations
      getCoords: () => [0, 0, 0, 0],
      getRatio: () => 0,
      format: v => this.formatImperial(v)
    };
    
    // Create a custom grid style with imperial-specific distance value
    const customGridStyle = Object.assign({}, gridStyle, {
      // Override the distance value with imperial grid spacing
      distance: this.distance
    });
    
    console.log(`[GridImperial] Setting up grid with distance: ${this.distance}`);
    
    // Apply grid style and user options, ensuring imperial grid spacing is used
    this.defaults = Object.assign({}, baseDefaults, customGridStyle, this._options);
    
    // Initialize axes
    this.axisX = Object.assign(new Axis('x', this.defaults), {
      orientation: 'x',
      offset: this.center.x,
      units: 'imperial',
      getCoords: (values, state) => {
        const coords = [];
        if (!values) return coords;
        for (let i = 0; i < values.length; i += 1) {
          const t = state.coordinate.getRatio(values[i], state);
          coords.push(t);
          coords.push(0);
          coords.push(t);
          coords.push(1);
        }
        return coords;
      },
      getRange: state => state.shape[0] * state.coordinate.zoom,
      getRatio: (value, state) => (value - state.offset) / state.range
    });
    
    this.axisY = Object.assign(new Axis('y', this.defaults), {
      orientation: 'y',
      offset: this.center.y,
      units: 'imperial',
      getCoords: (values, state) => {
        const coords = [];
        if (!values) return coords;
        for (let i = 0; i < values.length; i += 1) {
          const t = state.coordinate.getRatio(values[i], state);
          coords.push(0);
          coords.push(t);
          coords.push(1);
          coords.push(t);
        }
        return coords;
      },
      getRange: state => state.shape[1] * state.coordinate.zoom,
      getRatio: (value, state) => 1 - (value - state.offset) / state.range
    });
    
    // Apply any remaining options
    if (this._options) {
      Object.assign(this, this._options);
    }
    
    // Ensure center is a Point object
    this.center = new Point(this.center);
  }

  /**
   * Format a value in imperial units (inches and fractions)
   * @param {number} value - The value to format
   * @return {string} The formatted value
   */
  formatImperial(value) {
    // Convert from points to inches (72 points = 1 inch)
    const inches = value / POINTS_PER_INCH;
    
    // For small values, use fractional representation
    if (Math.abs(inches) < 1 && Math.abs(inches) > 0.001) {
      // Determine if this is close to a common fraction
      const fractions = {
        '1/16': 1/16, '1/8': 1/8, '3/16': 3/16, '1/4': 1/4, 
        '5/16': 5/16, '3/8': 3/8, '7/16': 7/16, '1/2': 1/2,
        '9/16': 9/16, '5/8': 5/8, '11/16': 11/16, '3/4': 3/4,
        '13/16': 13/16, '7/8': 7/8, '15/16': 15/16
      };
      
      // Find closest fraction
      let closestFraction = null;
      let minDiff = Number.MAX_VALUE;
      
      Object.entries(fractions).forEach(([fraction, val]) => {
        const diff = Math.abs(Math.abs(inches) - val);
        if (diff < minDiff) {
          minDiff = diff;
          closestFraction = fraction;
        }
      });
      
      // Only use fraction if it's close enough
      if (minDiff < 0.03) {
        return `${inches < 0 ? '-' : ''}${closestFraction}"`;
      }
    }
    
    // For integers or larger values, use decimal format
    if (Math.abs(inches) >= 10) {
      return `${inches.toFixed(0)}"`;
    } else if (Math.abs(inches) >= 1) {
      return `${inches.toFixed(1)}"`;
    } else {
      return `${inches.toFixed(2)}"`;
    }
  }

  /**
   * Draw grid to the canvas using its current state
   * @return {GridImperial} This instance for chaining
   */
  draw() {
    // Reset the minimum increment tracking flag at the start of each render cycle
    this.minimumIncrementDisplayed = false;
    this.maximumIncrementDisplayed = false;
    
    this.context.clearRect(0, 0, this.width, this.height);
    this.drawLines(this.state.x, this.context);
    this.drawLines(this.state.y, this.context);
    
    return this;
  }

  // Draw grid lines for an axis
  drawLines(state, ctx) {
    // Draw lines and sublines
    if (!state || !state.coordinate) return;

    const [width, height] = state.shape;
    const left = 0;
    const top = 0;
    const [pt, pr, pb, pl] = state.padding;
    const dimensions = { width, height, left, top, padding: [pt, pr, pb, pl] };

    let axisRatio = state.opposite.coordinate.getRatio(state.coordinate.axisOrigin, state.opposite);
    axisRatio = clamp(axisRatio, 0, 1);
    const coords = state.coordinate.getCoords(state.lines, state);
    
    // Get line coordinates from the utility function
    const lineCoords = calculateLineCoordinates(state, coords, dimensions);
    
    // Draw the lines
    ctx.lineWidth = 1; 
    for (let i = 0, j = 0; i < lineCoords.length; i++, j += 1) {
      const color = state.lineColors[j];
      if (!color) continue;
      
      const { x1, y1, x2, y2 } = lineCoords[i];
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.closePath();
    }
    
    // Calculate ticks and labels positions using the utility function
    const { tickCoords, labelCoords } = calculateTicksAndLabels(state, coords, axisRatio);
    state.labelCoords = labelCoords;
    
    // Draw ticks
    if (state.ticks && state.ticks.length) {
      // Get tick points from the utility function
      const tickPoints = calculateTickPoints(state, tickCoords, dimensions);
      
      ctx.lineWidth = state.axisWidth / 2;
      ctx.beginPath();
      
      // Draw all the tick points
      for (const point of tickPoints) {
        ctx.moveTo(point.x1, point.y1);
        ctx.lineTo(point.x2, point.y2);
      }
      
      ctx.strokeStyle = state.axisColor;
      ctx.stroke();
      ctx.closePath();
    }
    
    // Draw labels
    if (state.labels) {
      // Measure a common character to establish vertical offset
      ctx.font = `${state.fontSize}px ${state.fontFamily}`;
      const textMetric = ctx.measureText('0');
      const textHeight = textMetric.actualBoundingBoxAscent + textMetric.actualBoundingBoxDescent;
      
      ctx.fillStyle = state.labelColor;
      ctx.textAlign = 'center';
      
      // Calculate grid spacing in screen pixels for label density determination
      const currentZoom = state.coordinate.zoom || 1;
      const pixelDensity = this.unitToPixelSize || (GRID_DPI * currentZoom);
      const gridInchSpacing = this.distance / POINTS_PER_INCH; // Convert points to inches
      const gridPixelSpacing = gridInchSpacing * pixelDensity; 
      
      // Only draw labels when there's enough space
      const MIN_LABEL_SPACING = 50; // Minimum pixels between labels
      const shouldShowLabels = gridPixelSpacing > MIN_LABEL_SPACING;
      
      if (shouldShowLabels) {
        for (let i = 0, j = 0; i < state.labelCoords.length; i += 2, j += 1) {
          const label = state.labels[j];
          if (!label) continue;
          
          // Skip axis label (0), often redundant
          if (state.lines[j] === 0 && state.coordinate.orientation !== 'x') continue;
          
          // Calculate text position
          const textWidth = ctx.measureText(label).width;
          const xPos = left + pl + state.labelCoords[i] * (width - pl - pr);
          const yPos = top + pt + state.labelCoords[i + 1] * (height - pt - pb);
          
          // Only draw for x-axis (horizontal lines) or at sufficient distance from each other
          if (state.coordinate.orientation === 'x') {
            ctx.fillText(label, xPos, yPos + textHeight + 5);
          } else {
            ctx.fillText(label, xPos - textWidth - 5, yPos + textHeight / 3);
          }
        }
      }
    }
    
    // Draw axis (0,0 line)
    if (state.axis) {
      ctx.lineWidth = state.axisWidth;
      ctx.strokeStyle = state.axisColor;
      ctx.beginPath();
      
      const axisCoords = state.opposite.coordinate.getCoords(
        [state.coordinate.axisOrigin],
        state.opposite
      );
      
      if (state.coordinate.orientation === 'x') {
        const y = top + pt + clamp(axisCoords[1], 0, 1) * (height - pt - pb);
        ctx.moveTo(left + pl, y);
        ctx.lineTo(left + pl + (width - pl - pr), y);
      } else {
        const x = left + pl + clamp(axisCoords[0], 0, 1) * (width - pl - pr);
        ctx.moveTo(x, top + pt);
        ctx.lineTo(x, top + pt + (height - pt - pb));
      }
      
      ctx.stroke();
      ctx.closePath();
    }
  }
  
  /**
   * Track whether the minimum grid increment is currently displayed
   * This helps prevent zooming in too far
   * @return {boolean} - True if minimum increment is displayed
   */
  isMinimumIncrementVisible() {
    return this.minimumIncrementDisplayed;
  }
  
  /**
   * Track whether the maximum grid increment is currently displayed
   * This helps prevent zooming out too far
   * @return {boolean} - True if maximum increment is displayed
   */
  isMaximumIncrementVisible() {
    return this.maximumIncrementDisplayed;
  }
  
  /**
   * Get the current grid units
   * @return {string} - Current units (always 'imperial' for this class)
   */
  getUnits() {
    return this.units;
  }
}

export default GridImperial;
