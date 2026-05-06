const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.selenium') });

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/selenium/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/selenium/tsconfig.json' }],
  },
  testTimeout: 120000,
  slowTestThreshold: 10,
};
