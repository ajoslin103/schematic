/**
 * grid-units.js
 * Pure utility functions for unit-based grid calculations
 *
 * Minimum zoom levels required to represent the minimum measurement with 10 pixels:
 * - Points Units: zoom = 10.0 (1 point = 10 pixels)
 * - Imperial Units: zoom = 2.22 (1/16 inch = 10 pixels)
 * - Metric Units: zoom = 3.53 (1 mm = 10 pixels)
 *
 * These values are calculated using: zoom = 10 / (minIncrement * unitToPixelRatio)
 * where minIncrement is the smallest meaningful unit (1 point, 1/16 inch, 1 mm)
 * and unitToPixelRatio is the conversion factor from units to screen pixels.
 */

// Constants
export const POINTS_PER_INCH = 72; // Standard DTP points per inch
export const ONE_SIXTEENTH_INCH = 1 / 16;
export const MM_PER_INCH = 25.4;
export const POINTS_PER_MM = POINTS_PER_INCH / MM_PER_INCH; // Points per millimeter (POINTS_PER_CM/10)

// Natural grid increments for each unit system
export const NATURAL_INCREMENTS = {
  'points': [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  'imperial': [1/16, 1/8, 1/4, 1/2, 1, 2, 3, 4, 6, 12, 24, 36, 48, 72, 120, 240, 360], // inches, feet, yards
  'metric': [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000] // mm scale
};

// Minimum natural increment for each unit system
export const MIN_NATURAL_INCREMENTS = {
  'points': 1,
  'imperial': ONE_SIXTEENTH_INCH, // 1/16 0.0625
  'metric': 1 // 1mm (was previously 5mm)
};

// Maximum natural increment for each unit system
export const MAX_NATURAL_INCREMENTS = {
  'points': 10000,
  'imperial': 10000 / POINTS_PER_INCH,
  'metric': 10000 / POINTS_PER_MM
};

// this function takes numbers and returns true 
// if the number <= minimum increment for the unit system
export function isDisplayAtMinimum(displayValue, units) {
  if (!+displayValue) return false;
  switch (units) {
    case 'points':
      return Math.abs(displayValue) <= MIN_NATURAL_INCREMENTS.points;
    case 'imperial':
      return Math.abs(displayValue) <= MIN_NATURAL_INCREMENTS.imperial + 0.05;
    case 'metric':
      return Math.abs(displayValue) <= MIN_NATURAL_INCREMENTS.metric;
    default:
      return false;
  }
}

// this function takes numbers and returns true 
// if the number >= maximum increment for the unit system
export function isDisplayAtMaximum(displayValue, units) {
  switch (units) {
    case 'points':
      return Math.abs(displayValue) >= MAX_NATURAL_INCREMENTS.points;
    case 'imperial':
      return Math.abs(displayValue) >= MAX_NATURAL_INCREMENTS.imperial; // do this one by the minimum in Points
    case 'metric':
      return Math.abs(displayValue) >= MAX_NATURAL_INCREMENTS.metric; // do this one by the minimum in Points
    default:
      return false;
  }
}

// Ideal spacing between grid lines in pixels
export const IDEAL_GRID_LINE_SPACING = 50;

// Minimum pixels required for the smallest increment to be visible
export const MIN_VISIBLE_PIXELS = 5;

/**
 * Get the unit to pixel ratio for the specified units
 * @param {string} units - The current unit system ('points', 'imperial', or 'metric')
 * @param {number} pixelRatio - The device pixel ratio
 * @return {number} The conversion factor from units to pixels
 */
export function getUnitToPixelRatio(units, pixelRatio) {
  // This function should convert from units to screen pixels
  // The key is to maintain consistent physical dimensions across unit systems
  switch(units) {
    case 'imperial':
      // For imperial units, 1 inch should match 72 points (standard DTP resolution)
      return 1 / pixelRatio; // Scale is intrinsically correct because FabricJS uses points
    case 'metric':
      // For metric units, we need to match 1mm to the right number of points
      // Since FabricJS works in points, we need to convert mm to points
      // 1 inch = 72 points = 25.4 mm, so 1 mm = 72/25.4 = 2.835 points
      return 1 / pixelRatio; // We'll handle the unit conversion when transforming coordinates
    case 'points':
    default:
      // For points, 1 point = 1 unit in FabricJS
      return 1 / pixelRatio;
  }
}

/**
 * Calculate maximum zoom constraint based on minimum increment visibility
 * @param {string} units - The current unit system
 * @param {number} pixelRatio - The device pixel ratio
 * @param {number} baseMaxZoom - The default maximum zoom value
 * @return {number} The maximum allowed zoom level
 */
export function calculateMaxZoom(units, pixelRatio, baseMaxZoom = 20) {
  // Return infinite zoom - no constraints
  return Infinity;
}

/**
 * Calculate the minimum zoom level needed to properly display the minimum unit increment
 * Based on the formula: zoom = DESIRED_PIXELS / (minIncrement * unitToPixelRatio)
 * 
 * @param {string} units - The current unit system ('points', 'imperial', or 'metric')
 * @param {number} pixelRatio - The device pixel ratio
 * @param {number} desiredPixels - How many pixels wide the minimum increment should be (default: 10)
 * @return {number} The minimum zoom level required
 */
export function calculateMinZoomForDisplay(units, pixelRatio = 1, desiredPixels = 10) {
  const minIncrement = MIN_NATURAL_INCREMENTS[units];
  const unitToPixelRatio = getUnitToPixelRatio(units, pixelRatio);
  
  // Calculate the minimum zoom required to display the minimum increment at desired pixel size
  return desiredPixels / (minIncrement * unitToPixelRatio);
  
  // Known values for standard pixelRatio=1 and desiredPixels=10:
  // - Points: 10.0 (1 point = 10 pixels)
  // - Imperial: 2.22 (1/16 inch = 10 pixels)
  // - Metric: 3.53 (1 mm = 10 pixels)
}

/**
 * Unit-specific scale function that finds the appropriate natural increment
 * based on the unit system and minimum step size
 * 
 * @param {number} minStep - The minimum step size needed
 * @param {string} units - The current unit system ('points', 'imperial', or 'metric')
 * @return {number} The appropriate natural increment
 */
export function scaleByUnits(minStep, units) {
  // Get the natural increments for the current unit system
  const naturalSteps = NATURAL_INCREMENTS[units];
  if (!naturalSteps) {
    console.warn(`[Grid-Units] Unknown units '${units}', falling back to points`);
    return scaleByUnits(minStep, 'points');
  }

  // For imperial, we need special handling of the fractional values
  if (units === 'imperial') {
    // Find the closest natural increment that's >= minStep
    let bestStep = naturalSteps[0]; // Default to smallest increment
    
    for (let i = 0; i < naturalSteps.length; i++) {
      if (naturalSteps[i] >= minStep) {
        bestStep = naturalSteps[i];
        break;
      }
    }
    
    // If minStep is larger than all our predefined steps, we need to scale up
    if (bestStep < minStep) {
      const scaleFactor = Math.ceil(minStep / naturalSteps[naturalSteps.length-1]);
      bestStep = naturalSteps[naturalSteps.length-1] * scaleFactor;
    }
    
    return bestStep;
  } 
  // For metric and points, use a more decimal-friendly approach
  else {
    // Find the power of 10 that's appropriate for this step
    const power = Math.floor(Math.log10(minStep));
    const order = Math.pow(10, power);
    
    // Standard decimal-friendly steps: 1, 2, 5, 10, 20, 50, ...
    const baseSteps = [1, 2, 5];
    
    // Scale the steps by the order of magnitude
    let scaledSteps = baseSteps.map(v => v * order);
    if (order * 10 < minStep) {
      scaledSteps = scaledSteps.concat(baseSteps.map(v => v * order * 10));
    }
    
    // Find the smallest step that's >= minStep
    for (let i = 0; i < scaledSteps.length; i++) {
      if (scaledSteps[i] >= minStep) {
        return scaledSteps[i];
      }
    }
    
    // If we get here, the minStep is very large
    return scaledSteps[scaledSteps.length - 1] * Math.ceil(minStep / scaledSteps[scaledSteps.length - 1]);
  }
}

export function calculateGridSpacing(units, zoom, pixelRatio, unitToPixelSize) {
  // Determine how many pixels a unit takes at current zoom
  let pixelsPerUnit;
  
  if (unitToPixelSize && unitToPixelSize > 0) {
    // unitToPixelSize represents how many pixels a single unit takes up at current zoom
    pixelsPerUnit = unitToPixelSize;
  } else {
    // Fallback to traditional calculation
    const unitRatio = getUnitToPixelRatio(units, pixelRatio);
    pixelsPerUnit = zoom * unitRatio;
  }

  // Calculate the ideal unit spacing based on pixel size
  const idealUnitSpacing = IDEAL_GRID_LINE_SPACING / pixelsPerUnit;
  
  // Use our unit-specific scale function to get the appropriate natural increment
  const bestIncrement = scaleByUnits(idealUnitSpacing, units);
  
  return bestIncrement;
}

/**
 * Calculate the density of labels to display
 * @param {string} units - The current unit system
 * @param {number} zoom - The current zoom level
 * @return {number} The number of grid lines to skip between labels
 */
export function calculateLabelDensity(units, zoom) {
  // Updated algorithm: show more labels at lower zoom levels
  if (zoom < 0.3) return 10;
  if (zoom < 0.6) return 5;
  if (zoom < 0.9) return 2;
  return 1;
}

/**
 * Format a value according to the current unit system
 * @param {number} value - The value to format
 * @param {string} units - The current unit system
 * @return {string} The formatted value as a string
 */
export function formatValueByUnits(value, units) {
  // No debug for every label - too noisy
  
  // Convert value to a number if it's not already
  const numValue = typeof value !== 'number' ? Number(value) : value;
  
  // If conversion failed and resulted in NaN, return a safe fallback
  if (isNaN(numValue)) {
    console.warn(`[Grid-WARNING] Invalid value passed to formatValueByUnits: ${value}`);
    return String(value || '0');
  }
  
  // Handle negative values correctly
  let absValue = Math.abs(numValue);
  const negative = numValue < 0;
  let result = '';
  
  switch (units) {
    case 'imperial':
      // Sanity check: If imperial value is extremely large (over 1000 inches), it's likely
      // we have a scaling error and the value is actually in points. Apply the standard 72:1 conversion.
      // This safety check prevents displaying huge foot measurements when a conversion error occurs
      if (absValue > 1000) {
        console.warn(`[Grid-Units] Suspicious imperial value: ${absValue} inches - likely scaling error`);
        console.warn(`[Grid-Units] Converting from points to inches: ${absValue} / 72 = ${absValue/72} inches`);
        absValue = absValue / 72; // Apply standard conversion: 72 points = 1 inch
      } 
      
      // When in imperial mode, the values should be in inches
      if (absValue >= 12) {
        // Format as feet and inches
        const feet = Math.floor(absValue / 12);
        const inches = absValue % 12;
        
        if (inches === 0) {
          result = `${feet}'`;
        } else if (Math.abs(inches - Math.round(inches)) < 0.01) {
          // Whole inch values
          result = `${feet}'${Math.round(inches)}"`;
        } else {
          // Fractional inches - round to nearest 1/16
          const fraction = Math.round(inches * 16) / 16;
          const wholePart = Math.floor(fraction);
          const fracPart = fraction - wholePart;
          
          if (fracPart === 0) {
            result = `${feet}'${wholePart}"`;
          } else {
            // Convert to fraction
            const fractionStr = getFractionString(fracPart);
            result = `${feet}'${wholePart > 0 ? wholePart + ' ' : ''}${fractionStr}"`;
          }
        }
      } else if (absValue < 1) {
        // Small values as fractions
        result = getFractionString(absValue) + '"';
      } else {
        // Handle values between 1 and 12 inches
        if (Math.abs(absValue - Math.round(absValue)) < 0.01) {
          // Whole inch values
          result = `${Math.round(absValue)}"`;
        } else {
          // Fractional inches
          const wholePart = Math.floor(absValue);
          const fracPart = absValue - wholePart;
          const fractionStr = getFractionString(fracPart);
          result = `${wholePart > 0 ? wholePart + ' ' : ''}${fractionStr}"`;
        }
      }
      break;
      
    case 'metric':
      // In metric mode, all values are in mm
      if (absValue >= 1000) {
        // Format as meters (1000mm = 1m)
        result = `${(absValue / 1000).toFixed(2)}m`;
      } else if (absValue >= 100) {
        // Format as cm for larger values (100mm = 10cm)
        result = `${(absValue / 10).toFixed(1)}cm`;
      } else if (absValue >= 10) {
        // Format as mm with no decimal
        result = `${absValue.toFixed(0)}mm`;
      } else {
        // Format as mm with one decimal for small values
        result = `${absValue.toFixed(1)}mm`;
      }
      break;
      
    case 'points':
    default:
      // For points, just show the number
      result = `${Math.round(numValue)}`;
      break;
  }
  
  // Apply negative sign if needed
  if (negative && result !== '0') {
    result = `-${result}`;
  }
  
  return result;
}

/**
 * Convert a decimal value to a fraction string representation
 * @param {number} value - Decimal value between 0 and 1
 * @return {string} Fraction representation as string (e.g., "1/2", "3/16")
 */
function getFractionString(value) {
  if (value === 0) return '0';
  
  // Common fractions to check against
  const fractions = [
    { decimal: 1/16, fraction: '1/16' },
    { decimal: 1/8, fraction: '1/8' },
    { decimal: 3/16, fraction: '3/16' },
    { decimal: 1/4, fraction: '1/4' },
    { decimal: 5/16, fraction: '5/16' },
    { decimal: 3/8, fraction: '3/8' },
    { decimal: 7/16, fraction: '7/16' },
    { decimal: 1/2, fraction: '1/2' },
    { decimal: 9/16, fraction: '9/16' },
    { decimal: 5/8, fraction: '5/8' },
    { decimal: 11/16, fraction: '11/16' },
    { decimal: 3/4, fraction: '3/4' },
    { decimal: 13/16, fraction: '13/16' },
    { decimal: 7/8, fraction: '7/8' },
    { decimal: 15/16, fraction: '15/16' },
    { decimal: 1, fraction: '1' }
  ];
  
  // Find the closest match
  let closestFraction = '0';
  let smallestDiff = 1;
  
  for (const fraction of fractions) {
    const diff = Math.abs(value - fraction.decimal);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestFraction = fraction.fraction;
    }
  }
  
  return closestFraction;
}

/**
 * Convert a distance from one unit system to another
 * @param {number} distance - The distance to convert
 * @param {string} fromUnits - The source unit system
 * @param {string} toUnits - The target unit system
 * @return {number} The converted distance
 */
export function convertDistance(distance, fromUnits, toUnits) {
  // Critical debugging for unit conversion issue
  console.log(`[Grid-Units] Converting ${distance} from ${fromUnits} to ${toUnits}`);
  
  if (fromUnits === toUnits) {
    return distance;
  }
  
  // First convert to points as an intermediate step
  let pointValue;
  
  // Convert from source unit to points
  if (fromUnits === 'points') {
    pointValue = distance;
  } else if (fromUnits === 'imperial') {
    // Convert inch measurements to points
    pointValue = distance * POINTS_PER_INCH;
  } else if (fromUnits === 'metric') {
    // For metric, we're working in mm (not cm)
    // Convert mm measurements to points
    pointValue = distance * POINTS_PER_MM;
  } else {
    // Unrecognized unit, return original value
    return distance;
  }
  
  // Convert from points to target unit
  let result;
  
  if (toUnits === 'points') {
    result = pointValue;
  } else if (toUnits === 'imperial') {
    // Convert points to inches
    result = pointValue / POINTS_PER_INCH;
    console.log(`[Grid-Units] Point to inch: ${pointValue} points = ${result} inches (÷ ${POINTS_PER_INCH})`);
  } else if (toUnits === 'metric') {
    // Convert points to mm
    result = pointValue / POINTS_PER_MM;
    console.log(`[Grid-Units] Point to mm: ${pointValue} points = ${result} mm (÷ ${POINTS_PER_MM})`);
  } else {
    // Fallback
    result = distance;
  }
  
  return result;
}
