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
      setupFiles: ['<rootDir>/test/ui/polyfills.ts'],
      moduleNameMapper: {
        '\\.css$': '<rootDir>/test/ui/__mocks__/emptyMock.ts',
        '^leaflet-arrowheads$': '<rootDir>/test/ui/__mocks__/leafletArrowheadsMock.ts',
        '^leaflet-contextmenu$': '<rootDir>/test/ui/__mocks__/emptyMock.ts',
        '^leaflet\\.gridlayer\\.googlemutant$': '<rootDir>/test/ui/__mocks__/googleMutantMock.ts',
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
