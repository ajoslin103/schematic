import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [{
  input: 'src/index.js',
  output: [
    { 
      file: 'dist/schematic.cjs.js', 
      format: 'cjs',
      exports: 'named',
      interop: 'auto'
    },
    { 
      file: 'dist/schematic.esm.js', 
      format: 'esm',
      paths: {
        'fabric': 'fabric'
      },
      interop: 'auto'
    },
    { 
      file: 'dist/schematic.umd.js', 
      format: 'umd',
      name: 'Schematic',
      globals: {
        'fabric': 'fabric'
      },
      exports: 'named',
      interop: 'auto'
    }
  ],
  plugins: [
    resolve({
      browser: true, 
      preferBuiltins: false
    }),
    commonjs({
      transformMixedEsModules: true,
      ignoreDynamicRequires: true
    })
  ],
  external: ['fabric']
}];