import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      // Core logic is the coverage target; main.js is DOM/audio glue exercised
      // by the jsdom smoke test rather than measured for a line percentage.
      include: ['src/lib/**'],
      reporter: ['text', 'html'],
    },
  },
});
