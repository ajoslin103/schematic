import Base from '../core/Base.js';
import { clamp } from '../lib/mumath/index.js';
import gridStyle from './gridStyle.js';
import Axis from './Axis.js';
import { Point } from '../geometry/Point.js';
import { 
  POINTS_PER_INCH, 
  POINTS_PER_MM
} from './grid-units.js';
import {
  calculatePhysicalGridSpacing,
  drawPhysicalGrid
} from './physical-grid.js';

/**
 * PhysicalGrid - A truly unit-based grid that adjusts spacing based on
 * physical measurement standards rather than just visual spacing.
 * 
 * This grid displays measurements in true physical units:
 * - Points: 72 points = 1 inch
 * - Imperial: Uses standard fractions (1/16", 1/8", 1/4", etc.)
 * - Metric: Uses decimal divisions (1mm, 2mm, 5mm, 10mm, etc.)
 */
class PhysicalGrid extends Base {
  // Canvas rendering context
  context = null;
  
  // Canvas dimensions
  width = 0;
  height = 0;
  
  // Device pixel ratio for high DPI displays
  pixelRatio = window.devicePixelRatio;
  
  // Grid behavior flags
  autostart = true;
  
  // Center position with zoom
  center = { x: 0, y: 0, zoom: 1 };
  
  // Grid configuration
  units = 'points'; // Default units: points, imperial, metric
  minZoom = 0.1;
  maxZoom = Infinity;
  zoom = 1;
  zoomEnabled = true;
  panEnabled = true;
  
  // Label settings
  labels = true;
  fontSize = '11px';
  fontFamily = 'sans-serif';
  padding = 5;
  color = 'rgb(0,0,0,1)';
  
  // Grid style settings
  primaryColor = 'rgba(0, 0, 0, 0.5)';
  secondaryColor = 'rgba(0, 0, 0, 0.3)';
  tertiaryColor = 'rgba(0, 0, 0, 0.2)';
  primaryWidth = 1.0;
  secondaryWidth = 0.5;
  tertiaryWidth = 0.5;
  
  // Axis settings
  showAxis = true;
  axisWidth = 2;
  axisColor = 'rgba(0, 0, 0, 0.7)';
  
  // Grid spacing configuration (updated dynamically)
  gridSpacing = null;
  
  constructor(context, opts) {
    super(opts);
    this.context = context;
    
    console.log('[PhysicalGrid] Grid class instantiated with physical units support');
    
    this.setDefaults();
    this.updateConfiguration(opts);
    
    // Initialize with default units
    console.log('[PhysicalGrid] Initial units:', this.units);
  }
  
  setDefaults() {
    // Apply grid style and user options
    this.defaults = Object.assign({}, gridStyle, this._options);
    
    // Initialize center point
    this.center = new Point(this.center);
    
    // Apply any remaining options
    if (this._options) {
      Object.assign(this, this._options);
    }
  }
  
  render() {
    this.draw();
    return this;
  }
  
  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.updateConfiguration();
    return this;
  }
  
  setWidth(width) {
    this.width = width;
    this.updateConfiguration();
    return this;
  }
  
  setHeight(height) {
    this.height = height;
    this.updateConfiguration();
    return this;
  }
  
  /**
   * Set the units for the grid (points, imperial, or metric)
   * @param {string} units - The units to use ('points', 'imperial', or 'metric')
   * @return {PhysicalGrid} - This instance for chaining
   */
  setUnits(units) {
    if (!['points', 'imperial', 'metric'].includes(units)) {
      console.warn(`Invalid units: ${units}. Using default 'points'.`);
      units = 'points';
    }
    
    const prevUnits = this.units;
    
    // Skip if units haven't changed
    if (prevUnits === units) {
      return this;
    }
    
    // Store new units
    this.units = units;
    
    // Update configuration and render the grid
    this.updateConfiguration();
    this.render();
    
    // Emit a custom event to notify of unit change
    const event = new CustomEvent('grid-units-changed', { detail: { units: units } });
    document.dispatchEvent(event);
    
    return this;
  }
  
  /**
   * Get the current units setting
   * @return {string} Current units ('points', 'imperial', or 'metric')
   */
  getUnits() {
    return this.units;
  }
  
  /**
   * Update grid configuration based on current settings
   * @param {Object} opts - Optional configuration overrides
   * @return {PhysicalGrid} - This instance for chaining
   */
  updateConfiguration(opts = {}) {
    // Apply any new options
    Object.assign(this, opts);
    
    // Calculate physical grid spacing based on current units and zoom
    this.gridSpacing = calculatePhysicalGridSpacing(
      this.units,
      this.zoom,
      this.pixelRatio,
      this.unitToPixelSize
    );
    
    console.log(`[PhysicalGrid] Calculated grid spacing for ${this.units}:`, {
      primary: `${this.gridSpacing.primary.increment} (${this.gridSpacing.primary.pixelSpacing.toFixed(2)}px)`,
      secondary: `${this.gridSpacing.secondary.increment} (${this.gridSpacing.secondary.pixelSpacing.toFixed(2)}px)`,
      tertiary: `${this.gridSpacing.tertiary.increment} (${this.gridSpacing.tertiary.pixelSpacing.toFixed(2)}px)`
    });
    
    return this;
  }
  
  /**
   * Update grid based on viewport position
   * @param {Object} center - Current viewport center and zoom
   * @return {PhysicalGrid} - This instance for chaining
   */
  updateViewport(center) {
    Object.assign(this.center, center);
    
    // Store unitToPixelSize if provided by Fabric
    if (center.unitToPixelSize !== undefined) {
      this.unitToPixelSize = center.unitToPixelSize;
    }
    
    // Update grid spacing based on new viewport
    this.updateConfiguration();
    
    return this;
  }
  
  /**
   * Draw the grid with current configuration
   * @return {PhysicalGrid} - This instance for chaining
   */
  draw() {
    // Skip drawing if no context or dimensions
    if (!this.context || this.width <= 0 || this.height <= 0) {
      return this;
    }
    
    // Ensure we have current grid spacing
    if (!this.gridSpacing) {
      this.updateConfiguration();
    }
    
    // Create viewport configuration for the drawing function
    const viewport = {
      width: this.width,
      height: this.height,
      centerX: this.center.x,
      centerY: this.center.y,
      zoom: this.zoom
    };
    
    // Create style configuration
    const style = {
      // Primary grid line style
      primaryColor: this.primaryColor,
      primaryWidth: this.primaryWidth,
      
      // Secondary grid line style
      secondaryColor: this.secondaryColor,
      secondaryWidth: this.secondaryWidth,
      
      // Tertiary grid line style
      tertiaryColor: this.tertiaryColor,
      tertiaryWidth: this.tertiaryWidth,
      tertiaryDash: [1, 2],
      
      // Axis style
      axisStyle: {
        color: this.axisColor,
        width: this.axisWidth
      },
      
      // Label style
      showLabels: this.labels,
      labelStyle: {
        font: `${this.fontSize} ${this.fontFamily}`,
        color: this.color,
        padding: this.padding
      }
    };
    
    // Draw the physical grid
    drawPhysicalGrid(this.context, this.gridSpacing, viewport, style);
    
    return this;
  }
  
  /**
   * Set zoom level
   * @param {number} zoom - New zoom level
   * @return {PhysicalGrid} - This instance for chaining
   */
  setZoom(zoom) {
    this.zoom = clamp(zoom, this.minZoom, this.maxZoom);
    this.updateConfiguration();
    return this;
  }
  
  /**
   * Set zoom limits
   * @param {number} min - Minimum zoom level
   * @param {number} max - Maximum zoom level
   * @return {PhysicalGrid} - This instance for chaining
   */
  setZoomLimits(min, max) {
    this.minZoom = min;
    this.maxZoom = max;
    this.zoom = clamp(this.zoom, min, max);
    this.updateConfiguration();
    return this;
  }
  
  /**
   * Reset the grid view to initial state
   * @return {PhysicalGrid} - This instance for chaining
   */
  reset() {
    this.center.x = 0;
    this.center.y = 0;
    this.zoom = 1;
    this.updateConfiguration();
    return this;
  }
}

export default PhysicalGrid;
