import css from 'rollup-plugin-import-css';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

const isWatch = process.env.npm_lifecycle_event === 'watch';

export default [
  {
    input: 'src/index.js',
    output: {
      file: 'public/dist/js/index.js',
      format: 'es'
    },
    plugins: [
      resolve(),
      css(),
      json(),
      isWatch ? {} : terser()
    ]
  },
  {
    input: 'src/serviceworker.js',
    output: {
      file: 'public/serviceworker.js',
      format: 'es'
    },
    plugins: [
      isWatch ? {} : terser()
    ]
  }
];
