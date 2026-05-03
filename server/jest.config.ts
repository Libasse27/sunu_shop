import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$':      '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        // Moins strict pour les tests
        strict: false,
      },
    }],
  },
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  coverageDirectory: 'coverage',
  // json-summary génère coverage/coverage-summary.json (lu par le Step Summary CI)
  coverageReporters: ['json-summary', 'text', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/worker.ts',
    '!src/seeds/**',
    '!src/types/**',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches:   70,
      functions:  70,
      lines:      70,
      statements: 70,
    },
    // Modules critiques — seuil plus élevé
    './src/services/pricing.service.ts': {
      branches: 90, functions: 90, lines: 90, statements: 90,
    },
    './src/services/inventory.service.ts': {
      branches: 90, functions: 90, lines: 90, statements: 90,
    },
    './src/services/coupon.service.ts': {
      branches: 80, functions: 80, lines: 80, statements: 80,
    },
  },
};

export default config;
