/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/selenium/tests/**/*.test.ts'],
  passWithNoTests: true,
  testTimeout: 60000,
  setupFiles: ['<rootDir>/selenium/setup-env.js'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { esModuleInterop: true } }],
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'selenium-results', outputName: 'results.xml' }],
  ],
};

module.exports = config;
