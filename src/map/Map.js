import { clamp } from '../lib/mumath/index.js';
import fabric from 'fabric';

import Base from '../core/Base.js';
import { MAP, Modes, initializeFabric } from '../core/Constants.js';
import Grid from '../grid/Grid.js';
import { Point } from '../geometry/Point.js';
export class Map extends Base {
  constructor(container, options) {
    super(options);

    this.defaults = Object.assign({}, MAP);

    // set defaults
    Object.assign(this, this.defaults);

    // overwrite options
    Object.assign(this, this._options);

    this.center = new Point(this.center);

    this.container = container || document.body;

    const canvas = document.createElement('canvas');
    this.container.appendChild(canvas);
    canvas.setAttribute('id', 'schematic-canvas');

    canvas.width = this.width || this.container.clientWidth;
    canvas.height = this.height || this.container.clientHeight;

    // Initialize Fabric.js settings before creating any Fabric objects
    initializeFabric();
    
    // create the fabric Canvas
    this.fabricCanvas = new fabric.Canvas(canvas, {
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      fireRightClick: true, // allow right-click events to flow through Fabric
      stopContextMenu: true // prevent default context menu to keep drag uninterrupted
    });
    this.context = this.fabricCanvas.getContext('2d');

    this.originX = -this.fabricCanvas.width / 2;
    this.originY = -this.fabricCanvas.height / 2;

    this.fabricCanvas.absolutePan({
      x: this.originX,
      y: this.originY
    });


    this.x = this.center.x;
    this.y = this.center.y;
    this.dx = 0;
    this.dy = 0;

    if (this.gridEnabled) {
      this.addGrid();
    }

    // Enable snapping of object move/resize to integer values
    this._registerSnapping();
    
    // Listen for grid unit changes and force a complete re-render
    document.addEventListener('grid-units-changed', (e) => {
      console.log(`[Map] Grid units changed event detected: ${e.detail?.units}`);
      
      // Store current viewport center and transformation
      const vpt = this.fabricCanvas.viewportTransform;
      const centerPoint = {
        x: this.fabricCanvas.width / 2,
        y: this.fabricCanvas.height / 2
      };
      
      // Force an immediate update
      this.update();
      
      // Force a complete canvas re-render after a short delay
      setTimeout(() => {
        // Ensure we're still centered at the same point
        if (vpt) {
          // Calculate world coordinates of center
          const centerX = (centerPoint.x - vpt[4]) / vpt[0];
          const centerY = (centerPoint.y - vpt[5]) / vpt[3];
          
          // Explicitly recenter the viewport
          this.fabricCanvas.setViewportTransform(vpt);
          
          console.log('[Map] Re-centering viewport after unit change');
        }
        
        // Brute force approach to ensure all objects are visible
        this.fabricCanvas.getObjects().forEach(obj => {
          if (obj.visible) {
            obj.dirty = true;
            obj.setCoords();
          }
        });
        
        // Force multiple render passes to ensure everything is visible
        this.fabricCanvas.requestRenderAll();
        setTimeout(() => this.fabricCanvas.renderAll(), 50);
      }, 100);
    });
    
  }

  addGrid() {
    // Create grid using the fabric canvas context
    this.grid = new Grid(this.context, this);
    
    // Set grid dimensions to match fabric canvas
    this.grid.width = this.fabricCanvas.width;
    this.grid.height = this.fabricCanvas.height;
    // Initialize grid state with correct dimensions
    this.grid.updateConfiguration();
    
    // Initialize grid center coordinates to match Fabric.js center
    this.grid.center.x = 0; // Center should be 0 to align with fabric's center
    this.grid.center.y = 0; // Center should be 0 to align with fabric's center
    
    // Hook into Fabric's render events to draw the grid after Fabric has rendered
    this.fabricCanvas.on('before:render', () => {
      if (this.grid) {
        this.grid.render();
      }
    });
    
    // Initial draw
    this.grid.render();
    
    return this.grid;
  }

  setZoom(zoom) {
    const { width, height } = this.fabricCanvas;
    
    // Apply zoom constraints
    this.zoom = clamp(zoom, this.minZoom, this.maxZoom);
    this.dx = 0;
    this.dy = 0;
    this.x = width / 2.0;
    this.y = height / 2.0;
    this.update();
    
    // Use setTimeout for browser compatibility
    setTimeout(() => {
      this.update();
    }, 0);
  }

  reset() {
    const { width, height } = this.fabricCanvas;
    this.zoom = this._options.zoom || 1;
    this.center = new Point();
    this.originX = -this.fabricCanvas.width / 2;
    this.originY = -this.fabricCanvas.height / 2;
    this.fabricCanvas.absolutePan({
      x: this.originX,
      y: this.originY
    });
    this.x = width / 2.0;
    this.y = height / 2.0;
    this.update();
    // Use setTimeout for browser compatibility
    setTimeout(() => {
      this.update();
    }, 0);
  }

  onResize(width, height) {
    const oldWidth = this.fabricCanvas.width;
    const oldHeight = this.fabricCanvas.height;

    // Parameters required; automatic resize behavior removed

    this.fabricCanvas.setWidth(width);
    this.fabricCanvas.setHeight(height);

    if (this.grid) {
      this.grid.width = width;
      this.grid.height = height;
      this.grid.updateConfiguration();
    }

    const dx = width / 2.0 - oldWidth / 2.0;
    const dy = height / 2.0 - oldHeight / 2.0;

    this.fabricCanvas.relativePan({
      x: dx,
      y: dy
    });

    this.update();
  }

  update() {
    const canvas = this.fabricCanvas;
    
    // Always clamp zoom to bounds, even if set directly elsewhere
    const z = clamp(this.zoom, this.minZoom, this.maxZoom);
    if (z !== this.zoom) {
      this.zoom = z;
    }

    // First apply the zoom to the center of the canvas
    const centerPoint = new fabric.Point(canvas.width / 2, canvas.height / 2);
    // Apply zoom
    canvas.zoomToPoint(centerPoint, this.zoom);
    
    // Then update the grid based on the new viewport transform
    if (this.grid) {
      // Get current viewport transform to calculate world coordinates
      const vpt = canvas.viewportTransform;
      if (vpt) {
        // Calculate the viewport center in world coordinates
        const centerX = (canvas.width / 2 - vpt[4]) / vpt[0];
        const centerY = (canvas.height / 2 - vpt[5]) / vpt[3];
        const gridCenterY = -centerY;
        
        // Calculate unit to pixel size directly from the FabricJS viewport transform
        // vpt[0] is the x-scale factor which tells us how many pixels 1 unit takes up
        const unitToPixelSize = vpt[0];
        
        // Create test points to verify scaling
        const originPoint = new fabric.Point(0, 0);
        const unitPoint = new fabric.Point(1, 0);
        const pixelOrigin = fabric.util.transformPoint(originPoint, vpt);
        const pixelUnit = fabric.util.transformPoint(unitPoint, vpt);
        const measuredPixels = Math.sqrt(
          Math.pow(pixelUnit.x - pixelOrigin.x, 2) + 
          Math.pow(pixelUnit.y - pixelOrigin.y, 2)
        );
        
        // Calculate grid units for scaling - this is critical for proper conversion
        // FabricJS uses points as its base unit, so we need to calculate pixels per unit
        // based on the current grid unit system
        const currentUnits = this.grid.units || 'points';
        let unitScaleFactor;
        
        // The key insight: FabricJS uses points as its base unit (1/72 of an inch)
        // So we need to scale appropriately when converting to different unit systems
        if (currentUnits === 'points') {
          unitScaleFactor = 1; // No conversion needed - leave as points
        } else if (currentUnits === 'imperial') {
          // When in imperial mode, we want to display inches
          // So we need to convert from points to inches (divide by 72)
          unitScaleFactor = 1/72; // 72 points = 1 inch
        } else if (currentUnits === 'metric') {
          // When in metric mode, we want to display mm
          // So we need to convert from points to mm (divide by 2.835)
          unitScaleFactor = 1/2.835; // 2.835 points = 1 mm (72/25.4)
        }

        // Calculate the properly scaled pixel size based on unit system
        const scaledPixelSize = measuredPixels / unitScaleFactor;
        
        // Detailed logging to verify unit scaling is working correctly
        // console.log(`[Map] ===== UNIT CONVERSION INFO =====`);
        // console.log(`[Map] Base metrics: 1 FabricJS unit = ${measuredPixels.toFixed(4)} pixels at zoom ${this.zoom}`);
        // console.log(`[Map] Unit system: ${currentUnits}, scale factor: ${unitScaleFactor}`);
        // console.log(`[Map] Final: 1 ${currentUnits} = ${scaledPixelSize.toFixed(4)} pixels`);
        // console.log(`[Map] Expected ratios: 1 inch = 72 points, 1 mm = 2.835 points`);
        // console.log(`[Map] ===== END UNIT CONVERSION INFO =====`);
        
        // Update the grid with the calculated values
        this.grid.updateViewport({
          x: centerX,
          y: gridCenterY,
          zoom: this.zoom,
          unitToPixelSize: scaledPixelSize // Use the unit-adjusted value
        });
      } else {
        // Fallback if no viewport transform is available
        this.grid.updateViewport({
          x: 0,
          y: 0,
          zoom: this.zoom
        });
      }
      
      // Render the grid with the updated position
      this.grid.render();
      
      // Force Fabric canvas to re-render to ensure objects are displayed after unit changes
      this.fabricCanvas.requestRenderAll();
    }

    const now = Date.now();
    if (this.lastUpdatedTime && Math.abs(this.lastUpdatedTime - now) < 100) {
      return;
    }
    this.lastUpdatedTime = now;
  }

  // registerListeners() method removed - all event handling code removed
}

export const map = (container, options) => {
  const mapInstance = new Map(container, options);
  return mapInstance.fabricCanvas;
};

// Private helpers on the prototype to keep constructor lean
Map.prototype._registerSnapping = function _registerSnapping() {
  const canvas = this.fabricCanvas;
  if (!canvas) return;

  const round = (v) => Math.round(v);

  // Snap position while dragging
  canvas.on('object:moving', (e) => {
    const t = e?.target;
    if (!t) return;
    // Round left/top to integers
    t.set({
      left: round(t.left || 0),
      top: round(t.top || 0)
    });
    t.setCoords();
  });

  // Snap effective size while scaling
  canvas.on('object:scaling', (e) => {
    const t = e?.target;
    if (!t) return;
    const baseW = t.width || 0;
    const baseH = t.height || 0;
    if (baseW > 0 && baseH > 0) {
      const newW = Math.max(1, round(baseW * (t.scaleX || 1)));
      const newH = Math.max(1, round(baseH * (t.scaleY || 1)));
      // Convert back to scale factors so Fabric maintains control handles correctly
      t.set({
        scaleX: newW / baseW,
        scaleY: newH / baseH
      });
    }
    // Also align position to integers to avoid subpixel jitter
    t.set({
      left: round(t.left || 0),
      top: round(t.top || 0)
    });
    t.setCoords();
  });
};
