import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/selenium/**/*.test.ts'],
  testTimeout: 30000,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { esModuleInterop: true } }],
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'selenium-results', outputName: 'results.xml' }],
  ],
};

export default config;
