import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '../../..');
const portIndex = process.argv.indexOf('--port');
const port = portIndex >= 0 && process.argv[portIndex + 1] ? process.argv[portIndex + 1] : '4179';
const distDir = `/tmp/xy-latlng-to-map-e2e/dist-${port}`;

mkdirSync(distDir, { recursive: true });

// Explicitly scrub Google Maps key and pin Reinfolib proxy URL to a local mock host
// so local .env files never leak external scripts into offline E2E runs.
execFileSync('pnpm', ['exec', 'vite', 'build', '--outDir', distDir], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_GOOGLE_MAPS_API_KEY: '',
    VITE_REINFOLIB_PROXY_URL: 'https://verify-reinfolib.invalid',
  },
});

const server = spawn(
  'pnpm',
  ['exec', 'vite', 'preview', '--outDir', distDir, '--host', '127.0.0.1', '--port', port, '--strictPort'],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env },
  },
);

const shutdown = (signal) => {
  server.kill(signal);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

server.on('exit', (code) => {
  process.exit(code ?? 0);
});
