import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

/** @type {import('rollup').RollupOptions[]} */
export default [
  {
    input: 'src/ui/main.tsx',
    output: { file: 'public/dist/main.js', format: 'esm', sourcemap: true },
    plugins: [resolve({ browser: true }), commonjs(), typescript()],
  },
];
