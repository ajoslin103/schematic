import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'src/index.js',
    output: [
      { 
        file: 'dist/schematic.cjs.js', 
        format: 'cjs',
        exports: 'named'
      },
      { 
        file: 'dist/schematic.esm.js', 
        format: 'esm'
      },
      { 
        file: 'dist/schematic.umd.js', 
        format: 'umd',
        name: 'Schematic',
        globals: {
          'fabric': 'fabric'
        },
        exports: 'named'
      }
    ],
    plugins: [
      resolve(),
      commonjs()
    ],
    external: ['fabric']
  }
];