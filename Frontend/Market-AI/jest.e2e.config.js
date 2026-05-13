/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/selenium/tests/**/*.test.ts'],
  passWithNoTests: true,
  testTimeout: 60000,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { esModuleInterop: true } }],
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'selenium-results', outputName: 'results.xml' }],
  ],
};

module.exports = config;
