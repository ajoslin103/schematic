Based on the code I've examined, I believe modifying the existing implementation would be more practical than starting from scratch. The current framework has most of the necessary components in place - it just needs a fundamental redesign in how grid spacing is determined.

Here's how I'd approach modifying the existing grid to make it truly unit-based:

## Approach to Creating a Truly Unit-Based Grid

1. **Modify the Core Spacing Logic**
   - Currently, `calculateGridSpacing()` is just helping determine a good visual spacing
   - Need to rework this to calculate the actual physical grid spacing based on units and zoom

2. **Implement Physical-to-Pixel Conversions**
   - Define standard physical-to-pixel mappings (e.g., 72 DPI = 1 inch = 72 pixels)
   - Use these conversions to determine the actual pixel spacing between grid lines

3. **Key Methods to Modify**

   ```javascript
   // This method needs to truly calculate spacing based on physical units
   calculateGridSpacing(units, zoom, pixelRatio, unitToPixelSize) {
     // Return actual pixel spacing for the given unit
     if (units === 'imperial') {
       // For imperial, use standard divisions: 1", 1/2", 1/4", 1/8", 1/16"
       return determineImperialSpacing(zoom, unitToPixelSize);
     } else if (units === 'metric') {
       // For metric, use standard divisions: 1mm, 2mm, 5mm, 1cm, 2cm, 5cm
       return determineMetricSpacing(zoom, unitToPixelSize);
     } else {
       // For points, continue with current approach
       return determinePointSpacing(zoom, unitToPixelSize);
     }
   }
   ```

4. **Unit-Specific Grid Divisions**
   - Imperial should use fractional divisions (1", 1/2", 1/4", 1/8", etc.)
   - Metric should use decimal divisions (1mm, 2mm, 5mm, 1cm, etc.)
   - Points could continue using the current approach

5. **Zoom Management**
   - The zoom factor needs to correctly scale physical units
   - At zoom = 1, physical measurements should match real-world sizes (e.g., 1 inch on screen = 1 inch in reality)

6. **Ensure Label Consistency**
   - Labels should correspond exactly to the unit divisions they represent
   - For imperial: show fractions (1/4", 1/2", etc.)
   - For metric: use appropriate prefixes (mm, cm) based on size

7. **Provide Visual Indicators**
   - Different styling for major vs. minor grid divisions
   - Match common ruler/measuring tape conventions for each unit system

This approach leverages your existing codebase while fundamentally changing how grid spacing works. The most significant changes would be to the `calculateGridSpacing()`, [updateConfiguration()](cci:1://file:///Users/ajoslin/Development/schematic/src/grid/Grid.js:138:2-169:3), and [drawLines()](cci:1://file:///Users/ajoslin/Development/schematic/src/grid/Grid.js:314:2-383:3) methods to ensure they produce physically accurate grid spacings rather than just applying different labels.

Would you prefer I focus on a specific aspect of this implementation first? For example, I could work on a new `calculateGridSpacing()` function that properly handles physical units.