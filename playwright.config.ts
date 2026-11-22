import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, defineConfig } from '@playwright/test';

const E2E_PORT = Number.parseInt(process.env.E2E_PORT ?? '4179', 10);
const BASE_URL = `http://127.0.0.1:${E2E_PORT}`;

function resolveChromiumExecutable(): string | undefined {
  const configured = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (configured && existsSync(configured)) {
    return configured;
  }

  const bundled = chromium.executablePath();
  if (bundled && existsSync(bundled)) {
    return bundled;
  }

  const commonPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/run/current-system/sw/bin/chromium',
    '/run/current-system/sw/bin/chromium-browser',
  ];
  const common = commonPaths.find(existsSync);
  if (common) {
    return common;
  }

  if (existsSync('/nix/store')) {
    const nixChromiums = readdirSync('/nix/store')
      .filter((name) => /-chromium-\d/.test(name) && !name.includes('unwrapped'))
      .map((name) => resolve('/nix/store', name, 'bin/chromium'))
      .filter(existsSync)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    if (nixChromiums[0]) {
      return nixChromiums[0];
    }
  }

  return undefined;
}

const executablePath = resolveChromiumExecutable();

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 1 : 2,
  reporter: 'list',
  outputDir: '/tmp/xy-latlng-to-map-e2e/test-results',
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'ja-JP',
    acceptDownloads: true,
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  webServer: {
    command: `node test/e2e/helpers/startPreview.mjs --port ${E2E_PORT}`,
    url: `${BASE_URL}/`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
