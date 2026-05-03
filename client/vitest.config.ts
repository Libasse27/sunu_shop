import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      // Seuils bloquants CI — les modules critiques doivent atteindre 80%
      thresholds: {
        lines:      75,
        branches:   70,
        functions:  75,
        statements: 75,
      },
      include: [
        'src/features/**/*.ts',
        'src/hooks/**/*.ts',
        'src/services/**/*.ts',
        'src/utils/**/*.ts',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**',
        'src/main.tsx',
        'src/types/**',
        'src/store/store.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
