#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { deflateSync } from 'node:zlib';
import { chromium } from '@playwright/test';

const PROJECT_ROOT = resolve(import.meta.dirname, '../../../..');
const VERIFY_ROOT = '/tmp/xy-latlng-to-map-verify';
const EVIDENCE_ROOT = resolve(VERIFY_ROOT, 'evidence');
const DEFAULT_REINFOLIB_MOCK_URL = 'https://verify-reinfolib.invalid';
const EXPECTED_TITLE_FRAGMENT = '座標の地図表示と座標・緯度経度の変換';

const REINFOLIB_FIXTURES = {
  XKT001: {
    _index: 'bs001_city_planning_202609010900',
    area_classification_ja: '市街化区域',
  },
  XKT002: {
    _index: 'bs001_use_area_202609010900',
    use_area_ja: '商業地域',
    u_floor_area_ratio_ja: '500.0%',
    u_building_coverage_ratio_ja: '80.0%',
  },
  XKT014: {
    _index: 'bs001_fire_prevention_202609010900',
    fire_prevention_ja: '防火地域',
  },
  XKT023: {
    _index: 'bs001_district_plan_202609010900',
    plan_name: '芝公園周辺地区地区計画',
  },
  XKT024: {
    _index: 'bs001_advanced_use_202609010900',
    plan_name: '高度利用地区',
  },
  XKT029: {
    _index: 'ksj_landslide_202609010900',
    A33_001: '1',
    A33_002: '1',
    A33_005: '芝公園周辺',
  },
};

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected positional argument: ${token}`);
    }
    const key = token.slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      i += 1;
    }
  }
  return { command, flags };
}

function requireRunId(flags) {
  const runId = flags['run-id'];
  if (
    typeof runId !== 'string' ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(runId) ||
    runId === 'evidence'
  ) {
    throw new Error(
      'Provide --run-id matching ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ (and not "evidence")',
    );
  }
  return runId;
}

function runDirFor(runId) {
  return resolve(VERIFY_ROOT, runId);
}

function statePathFor(runId) {
  return resolve(runDirFor(runId), 'state.json');
}

function evidenceDirFor(runId, scenario) {
  return scenario
    ? resolve(EVIDENCE_ROOT, runId, scenario)
    : resolve(EVIDENCE_ROOT, runId);
}

function currentGitRev() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

function findChromiumExecutable() {
  const configured = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (configured && existsSync(configured)) return configured;

  const bundled = chromium.executablePath();
  if (bundled && existsSync(bundled)) return bundled;

  const commonPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/run/current-system/sw/bin/chromium',
    '/run/current-system/sw/bin/chromium-browser',
  ];
  const common = commonPaths.find(existsSync);
  if (common) return common;

  if (existsSync('/nix/store')) {
    const nixChromiums = readdirSync('/nix/store')
      .filter((name) => /-chromium-\d/.test(name) && !name.includes('unwrapped'))
      .map((name) => resolve('/nix/store', name, 'bin/chromium'))
      .filter(existsSync)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    if (nixChromiums[0]) return nixChromiums[0];
  }

  throw new Error(
    'Chromium executable not found. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE or install Playwright Chromium.',
  );
}

async function allocatePort(requestedPort) {
  if (requestedPort !== undefined) {
    const parsed = Number.parseInt(String(requestedPort), 10);
    if (!Number.isInteger(parsed) || parsed < 1024 || parsed > 65535) {
      throw new Error(`Invalid --port value: ${requestedPort}`);
    }
    return parsed;
  }

  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.unref();
    server.on('error', rejectPort);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => rejectPort(new Error('Failed to allocate localhost port.')));
        return;
      }
      const { port } = address;
      server.close(() => resolvePort(port));
    });
  });
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function probeAppUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ok: false, status: response.status, reason: `HTTP ${response.status}` };
    }
    const html = await response.text();
    const hasTitle = html.includes(EXPECTED_TITLE_FRAGMENT);
    const hasMap = html.includes('id="map"');
    if (!hasTitle || !hasMap) {
      return {
        ok: false,
        status: response.status,
        reason: `Unexpected document at ${url} (hasTitle=${hasTitle}, hasMap=${hasMap})`,
      };
    }
    return { ok: true, status: response.status };
  } catch (error) {
    return { ok: false, status: null, reason: String(error) };
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lengthBytes = Buffer.alloc(4);
  lengthBytes.writeUInt32BE(data.length, 0);
  const crcBytes = Buffer.alloc(4);
  crcBytes.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([lengthBytes, typeBytes, data, crcBytes]);
}

function createSolidTilePng(width, height, [r, g, b]) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowStride = 1 + width * 3;
  const raw = Buffer.alloc(rowStride * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowStride;
    raw[rowStart] = 0; // no filter
    for (let x = 0; x < width; x += 1) {
      const px = rowStart + 1 + x * 3;
      const isBorder = x === 0 || y === 0;
      raw[px] = isBorder ? 205 : r;
      raw[px + 1] = isBorder ? 215 : g;
      raw[px + 2] = isBorder ? 225 : b;
    }
  }
  const idat = deflateSync(raw);
  return Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', idat),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const MOCK_TILE_PNG = createSolidTilePng(256, 256, [236, 242, 248]);

function tileCoordsFor(lat, lng, zoom) {
  const tileCount = 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;
  return {
    x: Math.floor(((lng + 180) / 360) * tileCount),
    y: Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * tileCount,
    ),
  };
}

function buildReinfolibFixture(apiId, zoom, x, y) {
  const fixtureTile = tileCoordsFor(35.6580992222, 139.7413574722, zoom);
  if (x !== fixtureTile.x || y !== fixtureTile.y || !(apiId in REINFOLIB_FIXTURES)) {
    return { type: 'FeatureCollection', features: [] };
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: REINFOLIB_FIXTURES[apiId],
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [139.73, 35.65],
            [139.75, 35.65],
            [139.75, 35.67],
            [139.73, 35.67],
            [139.73, 35.65],
          ]],
        },
      },
    ],
  };
}

function buildAddressSearchFixture(query) {
  if (query.includes('芝公園')) {
    return [
      {
        geometry: { coordinates: [139.7484, 35.6553], type: 'Point' },
        type: 'Feature',
        properties: { addressCode: '13103', title: '東京都港区芝公園一丁目' },
      },
      {
        geometry: { coordinates: [139.7495, 35.6542], type: 'Point' },
        type: 'Feature',
        properties: { addressCode: '13103', title: '東京都港区芝公園二丁目' },
      },
    ];
  }
  return [];
}

async function cmdStart(flags) {
  const runId = requireRunId(flags);
  const runDir = runDirFor(runId);
  const statePath = statePathFor(runId);
  if (existsSync(statePath)) {
    const existing = JSON.parse(readFileSync(statePath, 'utf8'));
    if (isPidAlive(existing.pid)) {
      throw new Error(`Run ${runId} is already running (pid=${existing.pid}, url=${existing.url}).`);
    }
  }

  const distDir = resolve(runDir, 'dist');
  const logPath = resolve(runDir, 'preview.log');
  const evidenceDir = evidenceDirFor(runId);
  mkdirSync(runDir, { recursive: true });
  mkdirSync(evidenceDir, { recursive: true });

  const reinfolibProxyUrl = flags['no-reinfolib'] ? '' : DEFAULT_REINFOLIB_MOCK_URL;
  const port = await allocatePort(flags.port);
  const url = `http://127.0.0.1:${port}/`;

  execFileSync('pnpm', ['exec', 'vite', 'build', '--outDir', distDir], {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
    env: {
      ...process.env,
      VITE_GOOGLE_MAPS_API_KEY: '',
      VITE_REINFOLIB_PROXY_URL: reinfolibProxyUrl,
    },
  });

  const logFd = openSync(logPath, 'w');
  const server = spawn(
    'pnpm',
    ['exec', 'vite', 'preview', '--outDir', distDir, '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: ['ignore', logFd, logFd],
      env: { ...process.env },
    },
  );
  server.unref();
  closeSync(logFd);

  let ready = false;
  let lastReason = 'not probed';
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (!isPidAlive(server.pid)) {
      const log = existsSync(logPath) ? readFileSync(logPath, 'utf8') : '';
      throw new Error(`Preview server exited early.\n${log}`);
    }
    const probe = await probeAppUrl(url);
    if (probe.ok) {
      ready = true;
      break;
    }
    lastReason = probe.reason;
    await new Promise((r) => setTimeout(r, 100));
  }

  if (!ready) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      try {
        process.kill(server.pid, 'SIGTERM');
      } catch {
        // ignore if already gone
      }
    }
    const log = existsSync(logPath) ? readFileSync(logPath, 'utf8') : '';
    throw new Error(`Preview server failed readiness check (${lastReason}).\n${log}`);
  }

  const state = {
    runId,
    pid: server.pid,
    port,
    url,
    distDir,
    logPath,
    evidenceDir,
    gitRev: currentGitRev(),
    reinfolibProxyUrl,
    startedAt: new Date().toISOString(),
  };
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ status: 'ready', ...state }, null, 2));
}

async function cmdDoctor(flags) {
  const runId = requireRunId(flags);
  const statePath = statePathFor(runId);
  if (!existsSync(statePath)) {
    console.error(JSON.stringify({ healthy: false, reason: `Missing state file: ${statePath}` }, null, 2));
    process.exit(1);
  }
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const pidAlive = isPidAlive(state.pid);
  const probe = pidAlive ? await probeAppUrl(state.url) : { ok: false, reason: 'PID not alive' };
  const headRev = currentGitRev();
  const revisionMatch = headRev === state.gitRev;
  let chromiumPath = null;
  let chromiumError = null;
  try {
    chromiumPath = findChromiumExecutable();
  } catch (error) {
    chromiumError = String(error);
  }

  const healthy = pidAlive && probe.ok && revisionMatch && chromiumPath !== null;
  const report = {
    healthy,
    runId,
    pid: state.pid,
    pidAlive,
    url: state.url,
    probe,
    builtRev: state.gitRev,
    headRev,
    revisionMatch,
    reinfolibProxyUrl: state.reinfolibProxyUrl,
    chromiumPath,
    chromiumError,
    evidenceDir: state.evidenceDir,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!healthy) {
    process.exit(1);
  }
}

async function cmdStop(flags) {
  const runId = requireRunId(flags);
  const runDir = runDirFor(runId);
  const statePath = statePathFor(runId);
  const evidenceDir = evidenceDirFor(runId);

  let stoppedPid = null;
  if (existsSync(statePath)) {
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    stoppedPid = state.pid;
    if (isPidAlive(state.pid)) {
      try {
        process.kill(-state.pid, 'SIGTERM');
      } catch {
        try {
          process.kill(state.pid, 'SIGTERM');
        } catch {
          // already exited
        }
      }
      for (let i = 0; i < 30; i += 1) {
        if (!isPidAlive(state.pid)) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      if (isPidAlive(state.pid)) {
        try {
          process.kill(-state.pid, 'SIGKILL');
        } catch {
          try {
            process.kill(state.pid, 'SIGKILL');
          } catch {
            // already exited
          }
        }
      }
    }
  }

  if (existsSync(runDir) && runDir.startsWith(`${VERIFY_ROOT}/`) && runDir !== EVIDENCE_ROOT) {
    rmSync(runDir, { recursive: true, force: true });
  }

  console.log(
    JSON.stringify(
      {
        status: 'stopped',
        runId,
        stoppedPid,
        removedRuntimeDir: runDir,
        preservedEvidenceDir: evidenceDir,
        evidenceExists: existsSync(evidenceDir),
      },
      null,
      2,
    ),
  );
}

async function waitForMapReady(page) {
  await page.locator('#map').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const tiles = [...document.querySelectorAll('.leaflet-tile')];
    return tiles.length > 0 && tiles.every((tile) => tile.complete && tile.naturalWidth > 0);
  });
}

async function openMenu(page) {
  const menu = page.locator('#menu-column');
  const isOpen = await menu.evaluate((el) => el.matches(':popover-open'));
  if (!isOpen) {
    await page.getByRole('button', { name: 'メニューを開く' }).click();
    await menu.waitFor({ state: 'visible' });
  }
}

async function closeMenu(page) {
  const menu = page.locator('#menu-column');
  const isOpen = await menu.evaluate((el) => el.matches(':popover-open'));
  if (isOpen) {
    await menu.getByRole('button', { name: '閉じる' }).click();
    await page.waitForFunction(() => !document.querySelector('#menu-column')?.matches(':popover-open'));
  }
}

async function setTableCell(page, tableSelector, col, row, value) {
  const cell = page.locator(`${tableSelector} td[data-x="${col}"][data-y="${row}"]`);
  await cell.dblclick();
  await page.keyboard.press('Control+A');
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
}

async function captureAriaSummary(page) {
  return page.evaluate(() => {
    const lines = [];
    lines.push(`title: ${document.title}`);
    lines.push(`url: ${window.location.href}`);
    const headings = [...document.querySelectorAll('h1, h2, h3, h4, .navbar-brand')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => el.textContent?.trim())
      .filter(Boolean);
    lines.push(`visibleHeadings: ${JSON.stringify(headings)}`);
    const alert = document.querySelector('#error-message-wrap');
    lines.push(
      `alertVisible: ${Boolean(alert && !alert.classList.contains('visually-hidden'))} text=${JSON.stringify(
        document.querySelector('#error-message')?.textContent?.trim() ?? '',
      )}`,
    );
    const searchStatus = document.querySelector('#address-search-message');
    lines.push(
      `addressSearchStatus: visible=${Boolean(
        searchStatus && !searchStatus.classList.contains('visually-hidden'),
      )} text=${JSON.stringify(searchStatus?.textContent?.trim() ?? '')}`,
    );
    lines.push(`markerIcons: ${document.querySelectorAll('.leaflet-marker-icon').length}`);
    lines.push(`overlayPaths: ${document.querySelectorAll('.leaflet-overlay-pane path').length}`);
    lines.push(`popups: ${document.querySelectorAll('.leaflet-popup-content').length}`);
    lines.push(`tooltips: ${document.querySelectorAll('.leaflet-tooltip').length}`);
    return `${lines.join('\n')}\n`;
  });
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  return message;
}

const BUILTIN_SCENARIOS = {
  async 'markers-and-lines'({ page, evidenceDir }) {
    const assertions = [];
    await page.screenshot({ path: resolve(evidenceDir, 'before.png'), animations: 'disabled' });

    await openMenu(page);
    await page.locator('#source-is-latlng').check();
    await page.locator('#source-is-jgd2011').check();

    const points = [
      ['35.658580', '139.745433', '東京タワー付近'],
      ['35.657490', '139.748240', '増上寺付近'],
      ['35.654690', '139.747710', '芝公園付近'],
    ];
    for (const [row, [lat, lng, memo]] of points.entries()) {
      await setTableCell(page, '#source-data-table', 0, row, lat);
      await setTableCell(page, '#source-data-table', 1, row, lng);
      await setTableCell(page, '#source-data-table', 2, row, memo);
    }

    await page.locator('#select-marker-icon').selectOption('red');
    await page.locator('#select-line-color').selectOption('yellow');
    await page.getByRole('button', { name: 'アイコンの一括追加' }).click();
    await closeMenu(page);
    await waitForMapReady(page);

    const markerCountAfterAdd = await page.locator('.leaflet-marker-icon').count();
    const pathCountAfterAdd = await page.locator('.leaflet-overlay-pane path').count();
    assertions.push(assertCondition(markerCountAfterAdd === 3, `expected 3 markers, got ${markerCountAfterAdd}`));
    assertions.push(assertCondition(pathCountAfterAdd === 2, `expected 2 polyline segments, got ${pathCountAfterAdd}`));

    await page.locator('.leaflet-marker-icon').first().click();
    const popupText = (await page.locator('.leaflet-popup-content').textContent())?.trim() ?? '';
    assertions.push(
      assertCondition(popupText.includes('東京タワー付近'), `expected popup to include memo, got "${popupText}"`),
    );
    await page.screenshot({ path: resolve(evidenceDir, 'after.png'), animations: 'disabled' });

    await openMenu(page);
    await page.getByRole('button', { name: '全図形を削除' }).click();
    await closeMenu(page);
    const markerCountAfterClear = await page.locator('.leaflet-marker-icon').count();
    const pathCountAfterClear = await page.locator('.leaflet-overlay-pane path').count();
    assertions.push(
      assertCondition(markerCountAfterClear === 0, `expected 0 markers after clear, got ${markerCountAfterClear}`),
    );
    assertions.push(
      assertCondition(pathCountAfterClear === 0, `expected 0 polylines after clear, got ${pathCountAfterClear}`),
    );
    await page.screenshot({ path: resolve(evidenceDir, 'after-clear.png'), animations: 'disabled' });

    return {
      entryPoint: 'Menu popover (#menu-toggle-btn) -> #source-data-table -> #add-marker-btn -> #remove-marker-btn',
      assertions,
      observations: {
        markerCountAfterAdd,
        pathCountAfterAdd,
        popupText,
        markerCountAfterClear,
        pathCountAfterClear,
      },
    };
  },

  async 'coordinate-conversion'({ page, evidenceDir }) {
    const assertions = [];
    await page.screenshot({ path: resolve(evidenceDir, 'before.png'), animations: 'disabled' });

    await openMenu(page);
    await page.locator('#source-is-latlng').check();
    await page.locator('#source-is-jgd2011').check();
    await setTableCell(page, '#source-data-table', 0, 0, '35.6580992222');
    await setTableCell(page, '#source-data-table', 1, 0, '139.7413574722');
    await setTableCell(page, '#source-data-table', 2, 0, '日本経緯度原点');
    await setTableCell(page, '#source-data-table', 0, 1, '');
    await setTableCell(page, '#source-data-table', 1, 1, '');
    await setTableCell(page, '#source-data-table', 0, 2, '');
    await setTableCell(page, '#source-data-table', 1, 2, '');

    await page.locator('a[href="#data-convert-pane"]').click();
    await page.locator('#convert-to-xy').check();
    await page.locator('#convert-to-jgd2011').check();
    await page.locator('#convert-zone-no').selectOption('9');
    await page.locator('#data-convert-btn').click();

    const convertedX = (await page.locator('#converted-data-table td[data-x="0"][data-y="0"]').textContent())?.trim();
    const convertedY = (await page.locator('#converted-data-table td[data-x="1"][data-y="0"]').textContent())?.trim();
    const xNum = Number(convertedX);
    const yNum = Number(convertedY);
    assertions.push(
      assertCondition(
        Number.isFinite(xNum) && xNum < -37000 && xNum > -39000,
        `expected Zone 9 X near -37900, got ${convertedX}`,
      ),
    );
    assertions.push(
      assertCondition(
        Number.isFinite(yNum) && yNum < -8000 && yNum > -9000,
        `expected Zone 9 Y near -8300, got ${convertedY}`,
      ),
    );

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-csv-btn').click();
    const download = await downloadPromise;
    const csvPath = resolve(evidenceDir, download.suggestedFilename());
    await download.saveAs(csvPath);
    const csvText = readFileSync(csvPath, 'utf8');
    assertions.push(
      assertCondition(
        csvText.includes('変換元') && csvText.includes('9系') && csvText.includes('35.6580992222'),
        'expected exported CSV to include headers, zone 9, and source latitude',
      ),
    );
    await page.screenshot({ path: resolve(evidenceDir, 'after.png'), animations: 'disabled' });

    return {
      entryPoint: 'Menu popover -> #data-convert-pane -> #data-convert-btn -> #export-csv-btn',
      assertions,
      observations: {
        convertedX: xNum,
        convertedY: yNum,
        exportedCsvFile: csvPath,
        exportedCsvBytes: Buffer.byteLength(csvText, 'utf8'),
      },
    };
  },

  async 'map-context-menu'({ page, evidenceDir }) {
    const assertions = [];
    await page.screenshot({ path: resolve(evidenceDir, 'before.png'), animations: 'disabled' });

    const map = page.locator('#map');
    const box = await map.boundingBox();
    assertCondition(box !== null, 'expected #map bounding box');
    const centerX = Math.round(box.width / 2);
    const centerY = Math.round(box.height / 2);

    await map.click({ button: 'right', position: { x: centerX - 80, y: centerY } });
    await page.getByText('アイコンを追加', { exact: true }).click();
    await page.locator('.leaflet-marker-icon').first().hover();
    const singleMarkerTooltip = (await page.locator('.leaflet-tooltip').first().textContent())?.trim() ?? '';
    assertions.push(
      assertCondition(
        singleMarkerTooltip.includes('緯度経度:'),
        `expected marker tooltip with 緯度経度:, got "${singleMarkerTooltip}"`,
      ),
    );

    await map.click({ button: 'right', position: { x: centerX + 80, y: centerY } });
    await page.getByText('円を追加', { exact: true }).click();
    await page.locator('#radius').fill('500');
    await page.locator('#add-circle-to-map').click();
    const tooltipTexts = await page.locator('.leaflet-tooltip').allTextContents();
    assertions.push(
      assertCondition(
        tooltipTexts.some((text) => text.includes('半径: 500m')),
        `expected circle radius tooltip "半径: 500m", got ${JSON.stringify(tooltipTexts)}`,
      ),
    );

    await map.click({ button: 'right', position: { x: centerX - 320, y: centerY + 220 } });
    await page.getByText('この地点からの距離を計測', { exact: true }).click();
    await map.click({ button: 'right', position: { x: centerX - 120, y: centerY + 220 } });
    await page.getByText('この地点までの距離を計測', { exact: true }).click();
    const allTooltips = await page.locator('.leaflet-tooltip').allTextContents();
    assertions.push(
      assertCondition(
        allTooltips.some((text) => /距離:\s*\d+m/.test(text)),
        `expected distance tooltip matching 距離: <n>m, got ${JSON.stringify(allTooltips)}`,
      ),
    );
    await page.screenshot({ path: resolve(evidenceDir, 'after.png'), animations: 'disabled' });

    return {
      entryPoint: 'Map right-click context menu (#map)',
      assertions,
      observations: {
        markerCount: await page.locator('.leaflet-marker-icon').count(),
        tooltipTexts: allTooltips.map((t) => t.trim()),
      },
    };
  },

  async 'address-search'({ page, evidenceDir }) {
    const assertions = [];
    await page.screenshot({ path: resolve(evidenceDir, 'before.png'), animations: 'disabled' });

    const input = page.locator('#address-search-input');
    const results = page.locator('#address-search-results');

    await input.fill('芝公園');
    await input.press('Enter');
    await results.locator('li').first().waitFor({ state: 'visible' });
    const optionCount = await results.locator('li').count();
    assertions.push(assertCondition(optionCount === 2, `expected 2 mocked address candidates, got ${optionCount}`));
    await page.screenshot({ path: resolve(evidenceDir, 'step-candidates.png'), animations: 'disabled' });

    await input.press('ArrowDown');
    await input.press('Enter');
    await page.waitForFunction(() => document.querySelectorAll('#address-search-results li').length === 0);
    const selectedValue = await input.inputValue();
    assertions.push(
      assertCondition(
        selectedValue === '東京都港区芝公園一丁目',
        `expected selected address in input, got "${selectedValue}"`,
      ),
    );

    await input.fill('存在しない住所テスト');
    await input.press('Enter');
    const emptyMessage = page.locator('#address-search-message');
    await emptyMessage.waitFor({ state: 'visible' });
    const statusText = (await emptyMessage.textContent())?.trim() ?? '';
    assertions.push(
      assertCondition(
        statusText.includes('該当する住所が見つかりませんでした'),
        `expected empty status message, got "${statusText}"`,
      ),
    );
    await page.screenshot({ path: resolve(evidenceDir, 'after.png'), animations: 'disabled' });

    return {
      entryPoint: 'Overlay search combobox (#address-search-input)',
      assertions,
      observations: {
        optionCount,
        selectedValue,
        emptyStatusText: statusText,
      },
    };
  },

  async 'reinfolib-info'({ page, evidenceDir }) {
    const assertions = [];
    await page.screenshot({ path: resolve(evidenceDir, 'before.png'), animations: 'disabled' });

    const map = page.locator('#map');
    const box = await map.boundingBox();
    assertCondition(box !== null, 'expected #map bounding box');
    await map.click({
      button: 'right',
      position: { x: Math.round(box.width / 2), y: Math.round(box.height / 2) },
    });
    await page.getByText('不動産情報ライブラリの情報を表示', { exact: true }).click();
    await page.locator('.reinfolib-popup').getByText('都市計画区域/区域区分', { exact: true }).waitFor();

    const popupText = (await page.locator('.reinfolib-popup').textContent()) ?? '';
    assertions.push(
      assertCondition(
        popupText.includes('市街化区域') && popupText.includes('商業地域') && popupText.includes('500%'),
        `expected formatted Reinfolib popup values, got "${popupText.slice(0, 120)}"`,
      ),
    );
    const printReady = await page
      .locator('#reinfolib-print-info')
      .evaluate((el) => el.classList.contains('reinfolib-print-grid--has-content') && el.textContent.includes('商業地域'));
    assertions.push(assertCondition(printReady, 'expected #reinfolib-print-info grid populated for printing'));
    const markersDuringPopup = await page.locator('.leaflet-marker-icon').count();
    assertions.push(
      assertCondition(markersDuringPopup === 1, `expected 1 temporary marker during popup, got ${markersDuringPopup}`),
    );
    await page.screenshot({ path: resolve(evidenceDir, 'after.png'), animations: 'disabled' });

    await page.locator('.leaflet-popup-close-button').click();
    await page.waitForFunction(() => document.querySelectorAll('.leaflet-popup-content').length === 0);
    const markersAfterClose = await page.locator('.leaflet-marker-icon').count();
    const printCleared = await page
      .locator('#reinfolib-print-info')
      .evaluate((el) => !el.classList.contains('reinfolib-print-grid--has-content') && el.innerHTML === '');
    assertions.push(
      assertCondition(markersAfterClose === 0, `expected temporary marker removed on close, got ${markersAfterClose}`),
    );
    assertions.push(assertCondition(printCleared, 'expected #reinfolib-print-info cleared on popup close'));

    return {
      entryPoint: 'Map right-click context menu -> 不動産情報ライブラリの情報を表示',
      assertions,
      observations: {
        markersDuringPopup,
        markersAfterClose,
        printReady,
        printCleared,
      },
    };
  },

  async 'icon-api'({ page, url, evidenceDir }) {
    const assertions = [];
    await page.screenshot({ path: resolve(evidenceDir, 'before.png'), animations: 'disabled' });

    const validUrl = `${url}?x=-37875.1959&y=-7958.6436&zone=9&geodetic=JGD2011&color=blue&memo=-1F%20%E5%85%A5%E5%8F%A3`;
    await page.goto(validUrl, { waitUntil: 'networkidle' });
    await waitForMapReady(page);

    const urlMarkerCount = await page.locator('.leaflet-marker-icon').count();
    assertions.push(assertCondition(urlMarkerCount === 1, `expected 1 URL marker, got ${urlMarkerCount}`));
    await page.locator('.leaflet-marker-icon').first().click();
    const popupText = (await page.locator('.leaflet-popup-content').textContent())?.trim() ?? '';
    assertions.push(
      assertCondition(popupText === '-1F 入口', `expected popup "-1F 入口", got "${popupText}"`),
    );
    await page.screenshot({ path: resolve(evidenceDir, 'after.png'), animations: 'disabled' });

    const jsOutcome = await page.evaluate(() => {
      const api = window.xyLatLngToMap;
      const before = api.getMarkers().length;
      const added = api.addMarkers({
        points: [
          { first: 35.65858, second: 139.745433, memo: '<img src=x onerror=alert(1)>' },
          { first: 35.65749, second: 139.74824, memo: '増上寺' },
        ],
        iconColor: 'green',
        lineColor: 'yellow',
      });
      const afterAdd = api.getMarkers().length;
      const cleared = api.clearMarkers();
      const afterClear = api.getMarkers().length;
      return { before, addedOk: added.ok, afterAdd, cleared, afterClear };
    });
    assertions.push(
      assertCondition(
        jsOutcome.before === 1 &&
          jsOutcome.addedOk &&
          jsOutcome.afterAdd === 3 &&
          jsOutcome.cleared.clearedMarkers === 3 &&
          jsOutcome.afterClear === 0,
        `expected JS API lifecycle 1 -> 3 -> 0, got ${JSON.stringify(jsOutcome)}`,
      ),
    );

    await page.goto(`${url}?x=-37900&y=-8300`, { waitUntil: 'networkidle' });
    await waitForMapReady(page);
    const errorVisible = await page
      .locator('#error-message-wrap')
      .evaluate((el) => !el.classList.contains('visually-hidden'));
    const errorText = (await page.locator('#error-message').textContent())?.trim() ?? '';
    const invalidMarkerCount = await page.locator('.leaflet-marker-icon').count();
    assertions.push(assertCondition(errorVisible, 'expected #error-message-wrap visible on invalid URL'));
    assertions.push(assertCondition(errorText.includes('zone'), `expected zone error message, got "${errorText}"`));
    assertions.push(
      assertCondition(invalidMarkerCount === 0, `expected 0 markers on invalid URL, got ${invalidMarkerCount}`),
    );
    await page.screenshot({ path: resolve(evidenceDir, 'after-invalid-url.png'), animations: 'disabled' });

    return {
      entryPoint: 'URL query hydration (?x&y&zone) + window.xyLatLngToMap',
      assertions,
      observations: {
        urlMarkerCount,
        popupText,
        jsOutcome,
        errorVisible,
        errorText,
        invalidMarkerCount,
      },
    };
  },
};

async function cmdDrive(flags) {
  const runId = requireRunId(flags);
  const scenario = flags.scenario;
  if (typeof scenario !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(scenario)) {
    throw new Error(
      `Provide --scenario (${Object.keys(BUILTIN_SCENARIOS).join(', ')}, or a name matching ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ with --custom <path>).`,
    );
  }

  const statePath = statePathFor(runId);
  if (!existsSync(statePath)) {
    throw new Error(`No running verification instance for run-id=${runId}. Run "start" first.`);
  }
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const probe = await probeAppUrl(state.url);
  if (!probe.ok) {
    throw new Error(`Target app at ${state.url} is unhealthy (${probe.reason}). Run "doctor" to inspect.`);
  }

  let runner;
  if (flags.custom) {
    const customPath = resolve(String(flags.custom));
    const mod = await import(pathToFileURL(customPath).href);
    if (typeof mod.run !== 'function') {
      throw new Error(`Custom script ${customPath} must export async function run({ page, url, evidenceDir, helpers }).`);
    }
    runner = mod.run;
  } else {
    runner = BUILTIN_SCENARIOS[scenario];
    if (!runner) {
      throw new Error(`Unknown scenario "${scenario}". Available: ${Object.keys(BUILTIN_SCENARIOS).join(', ')}`);
    }
  }

  const evidenceDir = evidenceDirFor(runId, scenario);
  mkdirSync(evidenceDir, { recursive: true });

  const consoleErrors = [];
  const pageErrors = [];
  const mockedRequests = [];
  const blockedExternalRequests = [];

  const executablePath = findChromiumExecutable();
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
      locale: 'ja-JP',
      acceptDownloads: true,
    });

    const appOrigin = new URL(state.url).origin;
    await context.route('**/*', async (route) => {
      const requestUrl = route.request().url();
      if (requestUrl.startsWith('data:') || requestUrl.startsWith('blob:')) {
        await route.continue();
        return;
      }
      const parsed = new URL(requestUrl);
      if (parsed.origin === appOrigin) {
        if (parsed.pathname === '/favicon.ico') {
          await route.fulfill({ status: 204 });
          return;
        }
        await route.continue();
        return;
      }
      if (parsed.hostname === 'cyberjapandata.gsi.go.jp') {
        mockedRequests.push({ kind: 'gsi-tile', url: requestUrl });
        await route.fulfill({ status: 200, contentType: 'image/png', body: MOCK_TILE_PNG });
        return;
      }
      if (parsed.hostname === 'msearch.gsi.go.jp' && parsed.pathname.includes('AddressSearch')) {
        const query = parsed.searchParams.get('q') ?? '';
        mockedRequests.push({ kind: 'gsi-address-search', query });
        await route.fulfill({ json: buildAddressSearchFixture(query) });
        return;
      }
      if (state.reinfolibProxyUrl && requestUrl.startsWith(`${state.reinfolibProxyUrl}/tiles/`)) {
        const match = parsed.pathname.match(/^\/tiles\/(XKT\d+)\/(\d+)\/(\d+)\/(\d+)$/);
        mockedRequests.push({ kind: 'reinfolib-tile', pathname: parsed.pathname });
        const body = match
          ? buildReinfolibFixture(match[1], Number(match[2]), Number(match[3]), Number(match[4]))
          : { type: 'FeatureCollection', features: [] };
        await route.fulfill({ json: body });
        return;
      }

      blockedExternalRequests.push(requestUrl);
      await route.abort('blockedbyclient');
    });

    const page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      pageErrors.push(String(error));
    });

    await page.goto(state.url, { waitUntil: 'networkidle' });
    await waitForMapReady(page);

    const outcome = await runner({
      page,
      url: state.url,
      evidenceDir,
      helpers: { waitForMapReady, openMenu, closeMenu, setTableCell, assertCondition },
    });

    const ariaText = await captureAriaSummary(page);
    writeFileSync(resolve(evidenceDir, 'aria.txt'), ariaText, 'utf8');

    const result = {
      passed:
        consoleErrors.length === 0 &&
        pageErrors.length === 0 &&
        blockedExternalRequests.length === 0,
      runId,
      scenario,
      gitRev: state.gitRev,
      url: state.url,
      evidenceDir,
      entryPoint: outcome.entryPoint,
      assertions: outcome.assertions,
      observations: outcome.observations,
      consoleErrors,
      pageErrors,
      blockedExternalRequests,
      mockedRequestCount: mockedRequests.length,
      recordedAt: new Date().toISOString(),
    };
    writeFileSync(resolve(evidenceDir, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify(result, null, 2));

    await context.close();
    if (!result.passed) {
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  switch (command) {
    case 'start':
      await cmdStart(flags);
      break;
    case 'doctor':
      await cmdDoctor(flags);
      break;
    case 'drive':
      await cmdDrive(flags);
      break;
    case 'stop':
      await cmdStop(flags);
      break;
    default:
      console.error('Usage: verify-app.mjs <start|doctor|drive|stop> --run-id <id> [options]');
      process.exit(2);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
