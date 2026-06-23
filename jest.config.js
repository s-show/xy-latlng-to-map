export default {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      extensionsToTreatAsEsm: ['.ts'],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            useESM: true,
          },
        ],
      },
      testMatch: ['**/test/**/*.test.ts'],
      testPathIgnorePatterns: ['/node_modules/', '/test/ui/'],
    },
    {
      displayName: 'ui',
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'jsdom',
      extensionsToTreatAsEsm: ['.ts'],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            useESM: true,
          },
        ],
      },
      testMatch: ['**/test/ui/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/ui/setup.ts'],
    },
  ],
};
