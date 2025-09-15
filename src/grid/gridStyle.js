/* eslint-disable consistent-return */
import alpha from '../lib/color-alpha.js';
import {
  range, almost, scale, isMultiple, lg
} from '../lib/mumath/index.js';

const gridStyle = {
  steps: [1, 2, 5],
  distance: 20,
  unit: 10,
  lines: (state) => {
    const coord = state.coordinate;
    const grid = state.grid;
    
    // IMPORTANT: Always use the distance value that was passed from the Grid class
    // This ensures we respect the unit-specific grid spacing values
    let effectiveDistance = coord.distance;
    const units = grid?.units || 'points';
    
    // Log the distance value we're actually using
    console.log(`[GridStyle] Generating grid lines with coord.distance=${effectiveDistance}, units=${units}, zoom=${coord.zoom}`);
    
    // Calculate step size based on the effective distance
    // eslint-disable-next-line no-multi-assign
    const step = state.step = scale(effectiveDistance * coord.zoom, coord.steps);
    
    console.log(`[GridStyle] Calculated step size: ${step} for ${units} units`);
    
    const start = Math.floor(state.offset / step) * step;
    const end = Math.ceil((state.offset + state.range) / step + 1) * step;
    
    const lines = range(start, end, step);
    
    return lines;
  },
  lineColor: (state) => {
    if (!state.lines) return;
    const coord = state.coordinate;

    const light = alpha(coord.color, 0.1);
    const heavy = alpha(coord.color, 0.3);

    const step = state.step;
    const power = Math.ceil(lg(step));
    const tenStep = 10 ** power;
    const nextStep = 10 ** (power + 1);
    const eps = step / 10;
    const colors = state.lines.map(v => {
      if (isMultiple(v, nextStep, eps)) return heavy;
      if (isMultiple(v, tenStep, eps)) return light;
      return null;
    });
    return colors;
  },
  ticks: state => {
    if (!state.lines) return;
    const coord = state.coordinate;
    const step = scale(scale(state.step * 1.1, coord.steps) * 1.1, coord.steps);
    const eps = step / 10;
    const tickWidth = state.axisWidth * 4;
    return state.lines.map(v => {
      if (!isMultiple(v, step, eps)) return null;
      if (almost(v, 0, eps)) return null;
      return tickWidth;
    });
  },
  labels: state => {
    if (!state.lines) return;
    const coord = state.coordinate;

    const step = scale(scale(state.step * 1.1, coord.steps) * 1.1, coord.steps);
    // let precision = clamp(Math.abs(Math.floor(lg(step))), 10, 20);
    const eps = step / 100;
    return state.lines.map(v => {
      if (!isMultiple(v, step, eps)) return null;
      if (almost(v, 0, eps)) return coord.orientation === 'y' ? null : '0';
      // Display the actual value in Fabric.js units
      return coord.format(v);
    });
  }
};

export default gridStyle;
