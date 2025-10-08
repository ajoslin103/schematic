/**
 * Centralized debug logging system for the Schematic library
 * Allows granular control over debug output by category
 */
export class Debug {
  constructor(options = {}) {
    // Parse options - can be boolean (enable all) or object with category flags
    if (typeof options === 'boolean') {
      const enabled = options;
      this.flags = {
        schematic: enabled,
        events: enabled,
        grid: enabled,
        map: enabled,
        units: enabled,
        calibration: enabled
      };
    } else {
      this.flags = {
        schematic: options.schematic ?? false,
        events: options.events ?? false,
        grid: options.grid ?? false,
        map: options.map ?? false,
        units: options.units ?? false,
        calibration: options.calibration ?? false
      };
    }
  }

  /**
   * Log a message if the given category is enabled
   * @param {string} category - Debug category (schematic, events, grid, map, units, calibration)
   * @param {...any} args - Arguments to pass to console.log
   */
  log(category, ...args) {
    if (this.flags[category]) {
      console.log(...args);
    }
  }

  /**
   * Log a warning if the given category is enabled
   * @param {string} category - Debug category
   * @param {...any} args - Arguments to pass to console.warn
   */
  warn(category, ...args) {
    if (this.flags[category]) {
      console.warn(...args);
    }
  }

  /**
   * Enable a debug category
   * @param {string} category - Category to enable
   */
  enable(category) {
    if (category === 'all') {
      Object.keys(this.flags).forEach(key => this.flags[key] = true);
    } else {
      this.flags[category] = true;
    }
  }

  /**
   * Disable a debug category
   * @param {string} category - Category to disable
   */
  disable(category) {
    if (category === 'all') {
      Object.keys(this.flags).forEach(key => this.flags[key] = false);
    } else {
      this.flags[category] = false;
    }
  }

  /**
   * Check if a category is enabled
   * @param {string} category - Category to check
   * @return {boolean}
   */
  isEnabled(category) {
    return !!this.flags[category];
  }
}

// Default instance (all disabled for production)
export const debug = new Debug(false);
