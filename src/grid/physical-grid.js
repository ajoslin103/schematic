/**
 * physical-grid.js
 * Contains pure functions for creating and rendering truly unit-based grids
 * that adjust spacing based on physical measurement standards.
 */

// Import constants from grid-units.js
import { POINTS_PER_INCH, POINTS_PER_MM } from './grid-units.js';

/**
 * Calculates proper physical grid spacing based on unit system
 * 
 * @param {string} units - The current unit system ('points', 'imperial', or 'metric')
 * @param {number} zoom - The current zoom level
 * @param {number} pixelRatio - Device pixel ratio for high DPI displays
 * @param {number} unitToPixelSize - How many pixels 1 unit occupies at current zoom
 * @return {object} Grid spacing information with multiple levels of detail
 */
export function calculatePhysicalGridSpacing(units, zoom, pixelRatio = 1, unitToPixelSize) {
  // Determine the base pixel size for a single unit at current zoom
  let pixelsPerUnit;
  
  if (unitToPixelSize && unitToPixelSize > 0) {
    // Use provided pixel size from Fabric.js if available
    pixelsPerUnit = unitToPixelSize;
  } else {
    // Fallback calculation based on zoom
    pixelsPerUnit = zoom * (units === 'points' ? 1 : 
                          units === 'imperial' ? POINTS_PER_INCH : 
                          POINTS_PER_MM);
  }
  
  // Define minimum physical measurement that should be visible
  // This is the smallest increment we'll show at the highest zoom level
  const minPixelsForSmallestIncrement = 10; // Minimum pixels for smallest increment to be visible
  
  // Grid spacing configuration for each unit system
  let gridConfig;
  
  if (units === 'imperial') {
    // Imperial measurement grid spacings (in inches)
    gridConfig = {
      // Primary increments (major grid lines)
      primaryIncrements: [1, 2, 3, 4, 6, 12, 24, 36, 48],  // 1", 2", etc.
      
      // Secondary increments (medium grid lines)
      secondaryIncrements: [1/2, 1],  // 1/2", 1"
      
      // Tertiary increments (minor grid lines)
      tertiaryIncrements: [1/16, 1/8, 1/4], // 1/16", 1/8", 1/4"
      
      // Unit conversion factors (for calculating actual pixel spacing)
      unitToPixel: POINTS_PER_INCH,
      
      // Format functions for labels
      formatPrimary: (value) => formatImperialMajor(value),
      formatSecondary: (value) => formatImperialFraction(value),
      formatTertiary: (value) => formatImperialFraction(value)
    };
  } 
  else if (units === 'metric') {
    // Metric measurement grid spacings (in mm)
    gridConfig = {
      // Primary increments (major grid lines)
      primaryIncrements: [10, 20, 50, 100, 200, 500, 1000],  // 1cm, 2cm, 5cm, etc.
      
      // Secondary increments (medium grid lines)
      secondaryIncrements: [5, 10],  // 5mm, 10mm
      
      // Tertiary increments (minor grid lines)
      tertiaryIncrements: [1, 2], // 1mm, 2mm
      
      // Unit conversion factors
      unitToPixel: POINTS_PER_MM,
      
      // Format functions for labels
      formatPrimary: (value) => formatMetric(value),
      formatSecondary: (value) => formatMetric(value),
      formatTertiary: (value) => formatMetric(value)
    };
  } 
  else {
    // Points measurement grid spacings (default)
    gridConfig = {
      // Primary increments (major grid lines)
      primaryIncrements: [50, 100, 200, 500, 1000],
      
      // Secondary increments (medium grid lines)
      secondaryIncrements: [10, 20, 50],
      
      // Tertiary increments (minor grid lines)
      tertiaryIncrements: [1, 2, 5],
      
      // No conversion needed for points
      unitToPixel: 1,
      
      // Format functions for labels
      formatPrimary: (value) => Math.round(value).toString(),
      formatSecondary: (value) => Math.round(value).toString(),
      formatTertiary: (value) => Math.round(value).toString()
    };
  }
  
  // Determine appropriate spacing levels based on current zoom
  // We want to find increments where:
  // 1. Primary increment is at least 50px apart
  // 2. Secondary increment is at least 25px apart 
  // 3. Tertiary increment is at least 10px apart
  
  // Calculate pixel spacing for each level
  function findAppropriateSpacing(increments, minPixelSpacing) {
    for (const increment of increments) {
      const pixelSpacing = increment * pixelsPerUnit;
      if (pixelSpacing >= minPixelSpacing) {
        return { increment, pixelSpacing };
      }
    }
    // If no increment is large enough, use the largest one
    const largestIncrement = increments[increments.length - 1];
    return { 
      increment: largestIncrement, 
      pixelSpacing: largestIncrement * pixelsPerUnit 
    };
  }
  
  // Find appropriate spacings for each level
  const primary = findAppropriateSpacing(gridConfig.primaryIncrements, 50);
  const secondary = findAppropriateSpacing(gridConfig.secondaryIncrements, 25);
  const tertiary = findAppropriateSpacing(gridConfig.tertiaryIncrements, 10);
  
  // Determine visibility of each level based on actual pixel spacing
  const showPrimary = primary.pixelSpacing >= 50;
  const showSecondary = secondary.pixelSpacing >= 25;
  const showTertiary = tertiary.pixelSpacing >= 10;
  
  // Return complete grid spacing configuration
  return {
    // Unit system information
    units,
    pixelsPerUnit,
    unitToPixel: gridConfig.unitToPixel,
    
    // Primary grid level (major lines)
    primary: {
      increment: primary.increment,
      pixelSpacing: primary.pixelSpacing,
      visible: showPrimary,
      format: gridConfig.formatPrimary
    },
    
    // Secondary grid level (medium lines)
    secondary: {
      increment: secondary.increment,
      pixelSpacing: secondary.pixelSpacing,
      visible: showSecondary,
      format: gridConfig.formatSecondary
    },
    
    // Tertiary grid level (minor lines)
    tertiary: {
      increment: tertiary.increment,
      pixelSpacing: tertiary.pixelSpacing,
      visible: showTertiary,
      format: gridConfig.formatTertiary
    },
    
    // Helper function to convert grid units to actual pixel positions
    unitToPixelPosition: (unitValue) => unitValue * pixelsPerUnit
  };
}

/**
 * Draws a unit-based grid using the physical grid spacing configuration
 * 
 * @param {Object} ctx - Canvas 2D rendering context
 * @param {Object} gridSpacing - Grid spacing configuration from calculatePhysicalGridSpacing
 * @param {Object} viewport - Current viewport information (width, height, centerX, centerY)
 * @param {Object} style - Grid line styling options
 * @return {void}
 */
export function drawPhysicalGrid(ctx, gridSpacing, viewport, style) {
  const { width, height, centerX, centerY, zoom } = viewport;
  
  // Calculate visible range in grid units
  const halfWidthUnits = (width / 2) / gridSpacing.pixelsPerUnit;
  const halfHeightUnits = (height / 2) / gridSpacing.pixelsPerUnit;
  
  // Calculate the range of grid units visible in the viewport
  const minX = Math.floor((centerX - halfWidthUnits) / gridSpacing.primary.increment) * gridSpacing.primary.increment;
  const maxX = Math.ceil((centerX + halfWidthUnits) / gridSpacing.primary.increment) * gridSpacing.primary.increment;
  const minY = Math.floor((centerY - halfHeightUnits) / gridSpacing.primary.increment) * gridSpacing.primary.increment;
  const maxY = Math.ceil((centerY + halfHeightUnits) / gridSpacing.primary.increment) * gridSpacing.primary.increment;
  
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  
  // Set up styles for different grid levels
  const primaryStyle = {
    color: style.primaryColor || 'rgba(0, 0, 0, 0.5)',
    width: style.primaryWidth || 1.0,
    dash: style.primaryDash
  };
  
  const secondaryStyle = {
    color: style.secondaryColor || 'rgba(0, 0, 0, 0.3)',
    width: style.secondaryWidth || 0.5,
    dash: style.secondaryDash
  };
  
  const tertiaryStyle = {
    color: style.tertiaryColor || 'rgba(0, 0, 0, 0.2)',
    width: style.tertiaryWidth || 0.5,
    dash: style.tertiaryDash || [1, 2]
  };
  
  // Save the current canvas state
  ctx.save();
  
  // Translate to the center of the viewport
  ctx.translate(width / 2, height / 2);
  
  // Reflect Y axis for standard Cartesian coordinates (if using standard Fabric.js coordinates)
  ctx.scale(1, -1);
  
  // Translate based on the center position
  ctx.translate(-centerX * gridSpacing.pixelsPerUnit, -centerY * gridSpacing.pixelsPerUnit);
  
  // Draw tertiary grid lines (smallest increment)
  if (gridSpacing.tertiary.visible) {
    drawGridLines(
      ctx, 
      gridSpacing.tertiary.increment,
      minX, maxX, minY, maxY,
      gridSpacing.pixelsPerUnit,
      tertiaryStyle
    );
  }
  
  // Draw secondary grid lines (medium increment)
  if (gridSpacing.secondary.visible) {
    drawGridLines(
      ctx, 
      gridSpacing.secondary.increment,
      minX, maxX, minY, maxY,
      gridSpacing.pixelsPerUnit,
      secondaryStyle
    );
  }
  
  // Draw primary grid lines (largest increment)
  if (gridSpacing.primary.visible) {
    drawGridLines(
      ctx, 
      gridSpacing.primary.increment,
      minX, maxX, minY, maxY,
      gridSpacing.pixelsPerUnit,
      primaryStyle
    );
  }
  
  // Draw axes (x=0, y=0)
  drawAxes(ctx, minX, maxX, minY, maxY, gridSpacing.pixelsPerUnit, style.axisStyle || {
    color: 'rgba(0, 0, 0, 0.7)',
    width: 2
  });
  
  // Draw labels
  if (style.showLabels !== false) {
    drawGridLabels(
      ctx,
      gridSpacing,
      minX, maxX, minY, maxY,
      width, height,
      centerX, centerY,
      style.labelStyle || {}
    );
  }
  
  // Restore the canvas state
  ctx.restore();
}

/**
 * Draws grid lines at the specified interval
 */
function drawGridLines(ctx, interval, minX, maxX, minY, maxY, pixelsPerUnit, style) {
  ctx.beginPath();
  ctx.lineWidth = style.width;
  ctx.strokeStyle = style.color;
  
  if (style.dash) {
    ctx.setLineDash(style.dash);
  } else {
    ctx.setLineDash([]);
  }
  
  // Calculate the starting points aligned to the grid interval
  const startX = Math.floor(minX / interval) * interval;
  const startY = Math.floor(minY / interval) * interval;
  
  // Draw vertical lines
  for (let x = startX; x <= maxX; x += interval) {
    const pixelX = x * pixelsPerUnit;
    ctx.moveTo(pixelX, minY * pixelsPerUnit);
    ctx.lineTo(pixelX, maxY * pixelsPerUnit);
  }
  
  // Draw horizontal lines
  for (let y = startY; y <= maxY; y += interval) {
    const pixelY = y * pixelsPerUnit;
    ctx.moveTo(minX * pixelsPerUnit, pixelY);
    ctx.lineTo(maxX * pixelsPerUnit, pixelY);
  }
  
  ctx.stroke();
  ctx.closePath();
}

/**
 * Draws coordinate axes (x=0, y=0)
 */
function drawAxes(ctx, minX, maxX, minY, maxY, pixelsPerUnit, style) {
  ctx.beginPath();
  ctx.lineWidth = style.width;
  ctx.strokeStyle = style.color;
  ctx.setLineDash([]);
  
  // Draw X axis if visible
  if (minY <= 0 && maxY >= 0) {
    ctx.moveTo(minX * pixelsPerUnit, 0);
    ctx.lineTo(maxX * pixelsPerUnit, 0);
  }
  
  // Draw Y axis if visible
  if (minX <= 0 && maxX >= 0) {
    ctx.moveTo(0, minY * pixelsPerUnit);
    ctx.lineTo(0, maxY * pixelsPerUnit);
  }
  
  ctx.stroke();
  ctx.closePath();
}

/**
 * Draws grid labels at appropriate intervals
 */
function drawGridLabels(ctx, gridSpacing, minX, maxX, minY, maxY, width, height, centerX, centerY, style) {
  const { units, primary, pixelsPerUnit } = gridSpacing;
  
  // Set up label style
  ctx.font = style.font || '12px Arial';
  ctx.fillStyle = style.color || 'rgba(0, 0, 0, 0.7)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Restore normal Y orientation for text
  ctx.save();
  ctx.scale(1, -1);
  
  // Calculate the interval for labels - use primary grid spacing
  const labelInterval = primary.increment;
  
  // Calculate padding for labels
  const padding = style.padding || 5;
  
  // Calculate the starting positions aligned to the label interval
  const startX = Math.ceil(minX / labelInterval) * labelInterval;
  const startY = Math.ceil(minY / labelInterval) * labelInterval;
  
  // Draw X-axis labels
  for (let x = startX; x <= maxX; x += labelInterval) {
    // Skip origin (0,0) if specified
    if (style.skipOrigin && x === 0) continue;
    
    const pixelX = x * pixelsPerUnit;
    const pixelY = 0; // Draw at Y=0 axis when visible, or at bottom of screen
    
    // Format label using the primary formatter
    const label = primary.format(x);
    
    // Position the label below the X-axis or at the bottom of the viewport
    let labelY;
    if (minY <= 0 && maxY >= 0) {
      labelY = -(padding); // Just below the X-axis
    } else {
      // If X-axis not visible, place at bottom of viewport
      labelY = -(centerY * pixelsPerUnit + height / 2 - padding);
    }
    
    ctx.fillText(label, pixelX, labelY);
  }
  
  // Draw Y-axis labels
  for (let y = startY; y <= maxY; y += labelInterval) {
    // Skip origin (0,0) if specified
    if (style.skipOrigin && y === 0) continue;
    
    const pixelY = y * pixelsPerUnit;
    
    // Format label using the primary formatter
    const label = primary.format(y);
    
    // Position the label left of the Y-axis or at the left of the viewport
    let labelX;
    if (minX <= 0 && maxX >= 0) {
      labelX = -(padding); // Just left of the Y-axis
    } else {
      // If Y-axis not visible, place at left of viewport
      labelX = -(centerX * pixelsPerUnit + width / 2 - padding);
    }
    
    ctx.fillText(label, labelX, -pixelY); // Note the negative pixelY because we're in flipped context
  }
  
  ctx.restore();
}

/**
 * Format a metric value with appropriate units
 */
function formatMetric(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}m`;
  } else if (value >= 10) {
    return `${(value / 10).toFixed(0)}cm`;
  } else {
    return `${value}mm`;
  }
}

/**
 * Format a major imperial value (feet and inches)
 */
function formatImperialMajor(value) {
  if (value >= 12) {
    const feet = Math.floor(value / 12);
    const inches = value % 12;
    return inches > 0 ? `${feet}'${Math.round(inches)}"` : `${feet}'`;
  } else {
    return `${value}"`;
  }
}

/**
 * Format an imperial value as a fraction
 */
function formatImperialFraction(value) {
  // For whole inches, just return the value with inch symbol
  if (Number.isInteger(value)) {
    return `${value}"`;
  }
  
  // For fractions, convert to the closest standard fraction
  const wholePart = Math.floor(value);
  const fractionPart = value - wholePart;
  
  // Standard imperial fractions
  const fractions = [
    { value: 1/16, display: '1/16' },
    { value: 1/8, display: '1/8' },
    { value: 3/16, display: '3/16' },
    { value: 1/4, display: '1/4' },
    { value: 5/16, display: '5/16' },
    { value: 3/8, display: '3/8' },
    { value: 7/16, display: '7/16' },
    { value: 1/2, display: '1/2' },
    { value: 9/16, display: '9/16' },
    { value: 5/8, display: '5/8' },
    { value: 11/16, display: '11/16' },
    { value: 3/4, display: '3/4' },
    { value: 13/16, display: '13/16' },
    { value: 7/8, display: '7/8' },
    { value: 15/16, display: '15/16' }
  ];
  
  // Find the closest fraction
  let closestFraction = fractions[0];
  let smallestDiff = Math.abs(fractionPart - closestFraction.value);
  
  for (let i = 1; i < fractions.length; i++) {
    const diff = Math.abs(fractionPart - fractions[i].value);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestFraction = fractions[i];
    }
  }
  
  // Format the result
  if (wholePart === 0) {
    return `${closestFraction.display}"`;
  } else {
    return `${wholePart} ${closestFraction.display}"`;
  }
}
