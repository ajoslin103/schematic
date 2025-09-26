# Schematic Packaging Specification

## Minimal Distribution Structure
```
├── dist/
│   ├── schematic.cjs.js    # CommonJS for Node.js
│   ├── schematic.esm.js    # ES Modules for bundlers
│   └── schematic.umd.js    # Browser-ready UMD
├── src/
│   └── ... (your lean codebase)
├── package.json
├── rollup.config.js
└── README.md
```

---

## Critical Packaging Rules

### 1. Dependency Architecture
```json
"peerDependencies": {
  "fabric-pure-browser": "^3.4.0"
}
```
- **Why**: Your code depends on Fabric.js but shouldn't bundle it
- **Consumer must**: `npm install fabric-pure-browser@^3.4.0`

### 2. Build Requirements
```bash
npm install -D rollup @rollup/plugin-node-resolve
npm run build
```


---

## Integration Guide

### Browser Usage (No Bundler)
```html
<script src="https://unpkg.com/fabric-pure-browser@3.4.0/dist/fabric.js"></script>
<script src="dist/indoor.umd.js"></script>

<script>
  const map = new IndoorMap.Map(document.getElementById('map'), {
    width: 800,
    height: 600
  });
  
  // ... your configuration
  map.update();
</script>
```

### Modern Framework Usage
```js
// vite.config.js
export default defineConfig({
  optimizeDeps: {
    include: ['fabric-pure-browser']
  }
});

// Your component
import { Map } from 'schematic-map';
import * as fabric from 'fabric-pure-browser';

const map = new Map(document.getElementById('map'), { ... });
```

---

## Build Process

1. **Verify dependencies**:
   ```bash
   npm ls fabric-pure-browser  # Must show ^3.4.0
   ```

2. **Generate production builds**:
   ```bash
   npm run build
   ```

3. **Development workflow**:
   ```bash
   npm run dev  # Watch mode with live rebuilds
   ```

---

## Critical Constraints

- **No bundling Fabric.js**: Must be provided by consumer
- **Strict version matching**: `fabric-pure-browser@3.4.x` required
- **No polyfills**: Consumer must handle browser compatibility
- **Explicit rendering**: Always call `.update()` after state changes