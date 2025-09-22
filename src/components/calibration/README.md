# Calibration Dialog Component

A reusable calibration dialog component for standardizing screen measurements across different grid demos.

## Features

- Supports multiple measurement systems (imperial, metric, points)
- Configurable reference object dimensions
- Fine-grained calibration with buttons and keyboard shortcuts
- Modular design for easy integration with existing projects

## Usage

### Basic Implementation

```html
<!-- In your HTML file -->
<link rel="stylesheet" href="../components/calibration/styles.css">

<!-- Add a container for the dialog -->
<div id="calibration-dialog-container"></div>

<!-- Add a button to trigger calibration -->
<button id="btn-calibrate">Calibration</button>
```

```javascript
// In your JavaScript file
import CalibrationDialog from '../components/calibration/index.js';

// Initialize the grid state
window.gridState = {
  zoom: 1,
  referenceScale: 0 // Will be set by calibration dialog
};

// Create a calibration dialog instance
const calibrationDialog = new CalibrationDialog({
  container: document.getElementById('calibration-dialog-container'),
  gridState: window.gridState,
  system: 'imperial', // Can be 'imperial', 'metric', or 'points'
  referenceObject: { width: 3.375, height: 2.125, unit: 'in' }, // Credit card dimensions
  targetHeight: 318, // Target height in pixels
  dpi: 96 // Standard DPI
});

// Set the calibration button as trigger
calibrationDialog.setTriggerButton(document.getElementById('btn-calibrate'));
```

### Configuration Options

The `CalibrationDialog` constructor accepts the following options:

| Option | Description | Default |
|--------|-------------|---------|
| `container` | The HTML element that will contain the dialog | Required |
| `gridState` | Reference to the grid state object | Required |
| `system` | Measurement system ('imperial', 'metric', or 'points') | 'imperial' |
| `referenceObject` | Dimensions of reference object | System-dependent |
| `targetHeight` | Target height in pixels for reference object | 318 |
| `dpi` | Base DPI value for calculations | 96 |

### Measurement Systems

- **Imperial**: Uses inches (in) as the base unit
- **Metric**: Uses centimeters (cm) as the base unit
- **Points**: Uses typographic points (pt) as the base unit (100pt = 1 inch)

### Reference Objects

Default reference object is a standard credit/bank card with dimensions:
- Imperial: 3.375" × 2.125"
- Metric: 8.56cm × 5.4cm
- Points: 337.5pt × 212.5pt

## Methods

- `showDialog()`: Shows the calibration dialog
- `closeDialog()`: Closes the calibration dialog
- `setTriggerButton(button)`: Sets a button element to trigger the dialog
- `updateCalibration(newScale)`: Updates the calibration scale

## Example

See `demo/grid-demo-example.html` for a complete implementation example.