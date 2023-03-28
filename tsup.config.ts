import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    splitting: false,
    sourcemap: false,
    clean: true,
    format: ['esm', 'cjs'],
    dts: true,
    treeshake: true,
    minify: true,
})
