import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    yamibo: 'src/index.ts',
  },
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  shims: true,
  target: 'node18',
  outDir: 'dist',
  esbuildOptions(options) {
    options.alias = {
      '~': './src',
    }
  },
})
