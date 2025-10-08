/**
 * CalibrationDialog - A reusable component for calibrating screen measurements
 * This module provides functionality for measuring physical objects on screen
 * and calibrating the display to match real-world dimensions.
 * 
 * Features:
 * - Supports different measurement systems (imperial, metric, points)
 * - Adjustable calibration with buttons and keyboard shortcuts
 * - Customizable reference object dimensions
 */

class CalibrationDialog {
  /**
   * Create a new CalibrationDialog instance
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container element for the dialog
   * @param {Object} options.gridState - Reference to the grid state object
   * @param {string} options.system - Measurement system: 'imperial', 'metric', or 'points'
   * @param {Object} options.referenceObject - Reference object dimensions
   * @param {number} options.referenceObject.width - Width of reference object
   * @param {number} options.referenceObject.height - Height of reference object
   * @param {string} options.referenceObject.unit - Unit of reference object dimensions
   * @param {number} options.targetHeight - Target height in pixels for reference object
   * @param {number} options.dpi - Base DPI value (default: 96)
   * @param {function} options.onCalibrationComplete - Callback function when calibration is completed
   */
  constructor(options) {
    this.container = options.container;
    this.gridState = options.gridState;
    this.system = options.system || 'imperial';
    this.referenceObject = options.referenceObject || this.getDefaultReferenceObject();
    this.targetHeight = options.targetHeight || 318; // Default target height in pixels
    this.dpi = options.dpi || 96; // Standard screen DPI
    this.onCalibrationComplete = options.onCalibrationComplete || null;
    
    // Calculate reference scale based on system
    this.referenceScale = 0; // Start at 0%
    
    // Store calculated device pixel ratio
    this.calculatedDPR = window.devicePixelRatio || 1;
    
    // Load the template and initialize
    this.initialized = false;
    this.loadTemplate();
  }
  
  /**
   * Get default reference object based on measurement system
   * @returns {Object} Default reference object dimensions
   */
  getDefaultReferenceObject() {
    // Credit/bank card dimensions in different measurement systems
    switch (this.system) {
      case 'metric':
        return { width: 8.56, height: 5.4, unit: 'cm' };
      case 'points':
        return { width: 337.5, height: 212.5, unit: 'pt' }; // 100pt = 1 inch
      case 'imperial':
      default:
        return { width: 3.375, height: 2.125, unit: 'in' };
    }
  }
  
  /**
   * Load the HTML template and initialize the dialog
   */
  async loadTemplate() {
    try {
      const response = await fetch('/src/components/calibration/template.html');
      const html = await response.text();
      this.container.innerHTML = html;
      
      // Load styles
      this.loadStyles();
      
      // Initialize the dialog after template is loaded
      this.initialize();
    } catch (error) {
      console.error('Error loading calibration dialog template:', error);
    }
  }
  
  /**
   * Load the CSS styles for the dialog
   */
  loadStyles() {
    // Check if styles are already loaded
    if (document.getElementById('calibration-styles')) return;
    
    const link = document.createElement('link');
    link.id = 'calibration-styles';
    link.rel = 'stylesheet';
    link.href = '/src/components/calibration/styles.css';
    document.head.appendChild(link);
  }
  
  /**
   * Initialize dialog elements and event listeners
   */
  initialize() {
    // Get dialog elements
    this.dialog = document.getElementById('calibration-dialog');
    this.closeBtn = document.getElementById('close-calibration');
    this.upBtn = document.getElementById('calibrate-up');
    this.downBtn = document.getElementById('calibrate-down');
    this.resetBtn = document.getElementById('reset-calibration');
    this.percentDisplay = document.getElementById('calibration-percent');
    this.referenceBox = document.getElementById('dialog-reference');
    
    // Make sure all elements exist
    if (!this.dialog || !this.closeBtn || !this.upBtn || 
        !this.downBtn || !this.resetBtn || !this.percentDisplay || 
        !this.referenceBox) {
      console.error('Could not find all required dialog elements');
      return;
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Update reference box initial state
    this.updateReferenceBox();
    
    this.initialized = true;
  }
  
  /**
   * Set up event listeners for dialog controls
   */
  setupEventListeners() {
    // Close button
    this.closeBtn.addEventListener('click', () => this.closeDialog());
    
    // Calibration buttons
    this.upBtn.addEventListener('click', () => {
      this.updateCalibration(this.referenceScale + 0.01);
      this.updateCalibrationDisplay();
    });
    
    this.downBtn.addEventListener('click', () => {
      this.updateCalibration(this.referenceScale - 0.01);
      this.updateCalibrationDisplay();
    });
    
    // Reset button
    this.resetBtn.addEventListener('click', () => {
      if (this.gridState && this.gridState.baseScale) {
        this.updateCalibration(this.gridState.baseScale);
      } else {
        this.updateCalibration(1.0); // Default to 100%
      }
      this.updateCalibrationDisplay();
    });
    
    // Close when clicking backdrop
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        this.closeDialog();
      }
    });
    
    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();
  }
  
  /**
   * Set up keyboard shortcuts for fine calibration adjustments
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle if Alt key is pressed for fine control
      if (e.altKey) {
        switch(e.key) {
          case 'ArrowUp':
            e.preventDefault();
            this.updateCalibration(this.referenceScale + 0.01); // +1%
            this.updateCalibrationDisplay();
            break;
          case 'ArrowDown':
            e.preventDefault();
            this.updateCalibration(this.referenceScale - 0.01); // -1%
            this.updateCalibrationDisplay();
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.updateCalibration(this.referenceScale + 0.001); // +0.1% (finer adjustment)
            this.updateCalibrationDisplay();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            this.updateCalibration(this.referenceScale - 0.001); // -0.1% (finer adjustment)
            this.updateCalibrationDisplay();
            break;
        }
      }
    });
  }
  
  /**
   * Update the reference box dimensions based on current scale
   */
  updateReferenceBox() {
    if (!this.referenceBox || !this.gridState) return;
    
    // Calculate pixels per unit based on system
    let pixelsPerUnit;
    switch (this.system) {
      case 'metric':
        // Convert cm to pixels (1 inch = 2.54 cm at standard DPI)
        pixelsPerUnit = this.dpi / 2.54; // pixels per cm
        break;
      case 'points':
        // Convert points to pixels (100pt = 1 inch at standard DPI)
        pixelsPerUnit = this.dpi / 100; // pixels per point
        break;
      case 'imperial':
      default:
        pixelsPerUnit = this.dpi; // pixels per inch
        break;
    }
    
    // Fixed width for the reference box
    const dialogWidth = 200;
    
    // Calculate height based on reference scale and object dimensions
    const dialogHeight = Math.round(this.referenceObject.height * pixelsPerUnit * this.referenceScale);
    
    // Update reference box styles
    Object.assign(this.referenceBox.style, {
      width: `${dialogWidth}px`,
      height: `${dialogHeight}px`,
    });
  }
  
  /**
   * Update the calibration scale value
   * @param {number} newScale - New scale value
   */
  updateCalibration(newScale) {
    // Limit to reasonable range (50% to 200% of target scale)
    this.referenceScale = Math.max(0.5, Math.min(2.0, newScale));
    
    // Update the grid state
    if (this.gridState) {
      this.gridState.referenceScale = this.referenceScale;
    }
    
    // Update the reference box
    this.updateReferenceBox();
  }
  
  /**
   * Update the percentage display
   */
  updateCalibrationDisplay() {
    if (!this.percentDisplay || !this.gridState || !this.gridState.baseScale) return;
    
    // Calculate percentage based on base scale
    const percentage = Math.round((this.referenceScale / this.gridState.baseScale) * 100);
    this.percentDisplay.textContent = `${percentage}%`;
  }
  
  /**
   * Show the calibration dialog
   */
  showDialog() {
    if (!this.initialized) {
      console.warn('Calibration dialog not initialized yet');
      return;
    }
    
    // Calculate initial scale based on target height
    const pixelsPerUnit = this.getPixelsPerUnit();
    const initialScale = this.targetHeight / (this.referenceObject.height * pixelsPerUnit);
    
    // Store the initial scale as 100% reference
    this.gridState.baseScale = initialScale;
    this.updateCalibration(initialScale);
    this.updateCalibrationDisplay();
    
    // Show dialog
    this.dialog.showModal();
  }
  
  /**
   * Close the calibration dialog and calculate device pixel ratio
   */
  closeDialog() {
    if (this.dialog) {
      this.dialog.close();
      
      // Calculate the device pixel ratio based on calibration
      this.calculateDevicePixelRatio();
      
      // Call the completion callback if provided
      if (typeof this.onCalibrationComplete === 'function') {
        this.onCalibrationComplete({
          calculatedDPR: this.calculatedDPR,
          referenceScale: this.referenceScale,
          system: this.system
        });
      }
    }
  }
  
  /**
   * Get pixels per unit based on measurement system
   * @returns {number} Pixels per unit (inch, cm, or point)
   */
  getPixelsPerUnit() {
    switch (this.system) {
      case 'metric':
        return this.dpi / 2.54; // pixels per cm
      case 'points':
        return this.dpi / 100; // pixels per point
      case 'imperial':
      default:
        return this.dpi; // pixels per inch
    }
  }
  
  /**
   * Set the button for triggering the calibration dialog
   * @param {HTMLElement} button - Button element
   */
  setTriggerButton(button) {
    if (!button) {
      console.error('No trigger button provided');
      return;
    }
    
    button.addEventListener('click', () => this.showDialog());
  }
  
  /**
   * Calculate the device pixel ratio based on the calibration
   * @returns {number} The calculated device pixel ratio
   */
  calculateDevicePixelRatio() {
    // Get the reported device pixel ratio
    const reportedDPR = window.devicePixelRatio || 1;
    
    // Only calculate if we have a valid reference scale and base scale
    if (!this.referenceScale || !this.gridState || !this.gridState.baseScale) {
      return reportedDPR;
    }
    
    // The ratio between what the user calibrated and what we expected
    // is our adjustment to the device pixel ratio
    const adjustmentFactor = this.referenceScale / this.gridState.baseScale;
    
    // Calculate the actual device pixel ratio based on calibration
    // If user makes card bigger (referenceScale > baseScale), actual DPR is lower than reported
    this.calculatedDPR = reportedDPR / adjustmentFactor;
    
    return this.calculatedDPR;
  }
  
  /**
   * Get the calculated device pixel ratio
   * @returns {number} The calculated device pixel ratio
   */
  getDevicePixelRatio() {
    return this.calculatedDPR;
  }
}

// Export the CalibrationDialog class
export default CalibrationDialog;