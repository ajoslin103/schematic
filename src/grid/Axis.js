class Axis {
  constructor(orientation, options) {
    Object.assign(this, options);
    this.orientation = orientation || 'x';
    this.units = options.units || 'points';
  }

  getCoords(values) {
    const coords = [];
    if (!values) return coords;
    for (let i = 0; i < values.length; i += 1) {
      const t = this.getRatio(values[i]);
      coords.push(t);
      coords.push(0);
      coords.push(t);
      coords.push(1);
    }
    return coords;
  }

  getRange() {
    let len = this.width;
    if (this.orientation === 'y') len = this.height;
    return len * this.zoom;
  }

  getRatio(value) {
    return (value - this.offset) / this.range;
  }

  setOffset(offset) {
    this.offset = offset;
  }
  
  setUnits(units) {
    if (this.units !== units) {
      console.log(`[Axis] Units changed from ${this.units} to ${units}`);
      this.units = units;
    }
  }

  update(options) {
    options = options || {};
    Object.assign(this, options);

    this.range = this.getRange();
  }
}
export default Axis;
