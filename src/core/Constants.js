import { Point } from '../geometry/Point.js';
import * as fabric from 'fabric';

export const Modes = {
  SELECT: 'SELECT',
  GRAB: 'GRAB',
  MEASURE: 'MEASURE',
  DRAW: 'DRAW'
};

export const MAP = {
  center: new Point(),
  zoom: 1,
  gridEnabled: true,
  zoomEnabled: true,
  selectEnabled: true,
  mode: Modes.SELECT
};

/**
 * Initialize Fabric.js configuration settings
 * This function should be called before using any Fabric.js objects
 */
export function initializeFabric() {
  if (typeof fabric === 'undefined') {
    console.warn('Fabric.js not loaded. Cannot initialize Fabric settings.');
    return;
  }

  // // Set default origin to center for all Fabric objects
  // fabric.Object.prototype.originX = 'center';
  // fabric.Object.prototype.originY = 'center';

  // // Lock uniform scaling and prevent flipping
  // fabric.Object.prototype.lockUniScaling = true;
  // fabric.Object.prototype.lockScalingFlip = true;
  
  // // Visual settings
  // fabric.Object.prototype.transparentCorners = false;
  // fabric.Object.prototype.centeredScaling = true;
  // // fabric.Object.prototype.cornerStyle = 'circle';
  // fabric.Object.prototype.cornerColor = 'blue';
  // fabric.Object.prototype.borderColor = 'blue';
  // fabric.Object.prototype.borderOpacity = 0.7;
  // fabric.Object.prototype.cornerOpacity = 0.7;
  // fabric.Object.prototype.cornerStrokeColor = 'blue';
  
  // // Update border and corner colors
  // fabric.Object.prototype.borderColor = '#ff0099';
  // fabric.Object.prototype.cornerColor = '#00eaff';
  // fabric.Object.prototype.cornerStrokeColor = '#00bbff';
  
  // // Performance settings
  // fabric.Object.prototype.objectCaching = false;
  // fabric.Group.prototype.objectCaching = true;
  
  // // Group selection appearance
  // fabric.Group.prototype.selectionBackgroundColor = 'rgba(45,207,171,0.25)';
  
  // // Border style
  // fabric.Object.prototype.borderDashArray = [3, 3];
  
  // // Padding
  // fabric.Object.prototype.padding = 5;
  
  // Add getBounds utility method
  fabric.Object.prototype.getBounds = function getBounds() {
    const coords = [];
    coords.push(new Point(this.left - this.width / 2.0, this.top - this.height / 2.0));
    coords.push(new Point(this.left + this.width / 2.0, this.top + this.height / 2.0));
    return coords;
  };

  console.log('Fabric.js settings initialized successfully.');
}
