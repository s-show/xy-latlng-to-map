import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const projectRoot = resolve(import.meta.dirname, '..');
const outputDirectory = resolve(projectRoot, 'docs/assets/screenshots');
const applicationUrl = process.env.MANUAL_BASE_URL ?? 'http://127.0.0.1:4173/';

const samplePoints = [
  ['35.658580', '139.745433'],
  ['35.657490', '139.748240'],
  ['35.654690', '139.747710'],
];

const gpsPhotoPaths = [
  resolve(projectRoot, 'gps_test1.jpg'),
  resolve(projectRoot, 'gps_test2.jpg'),
  resolve(projectRoot, 'gps_test3.jpg'),
];

function chromiumExecutable() {
  const configuredPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (configuredPath && existsSync(configuredPath)) return configuredPath;

  const bundledPath = chromium.executablePath();
  if (existsSync(bundledPath)) return bundledPath;

  const commonPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/run/current-system/sw/bin/chromium',
    '/run/current-system/sw/bin/chromium-browser',
  ];
  const commonPath = commonPaths.find(existsSync);
  if (commonPath) return commonPath;

  if (existsSync('/nix/store')) {
    const nixChromiums = readdirSync('/nix/store')
      .filter((name) => /-chromium-\d/.test(name) && !name.includes('unwrapped'))
      .map((name) => resolve('/nix/store', name, 'bin/chromium'))
      .filter(existsSync)
      .sort((left, right) => {
        const leftVersion = left.match(/chromium-(\d+(?:\.\d+)+)/)?.[1] ?? '0';
        const rightVersion = right.match(/chromium-(\d+(?:\.\d+)+)/)?.[1] ?? '0';
        return rightVersion.localeCompare(leftVersion, undefined, { numeric: true });
      });
    if (nixChromiums[0]) return nixChromiums[0];
  }

  throw new Error(
    'Chromiumが見つかりません。PLAYWRIGHT_CHROMIUM_EXECUTABLEに実行ファイルのパスを指定してください。',
  );
}

async function serverIsReady() {
  try {
    const response = await fetch(applicationUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function startPreviewServer() {
  if (await serverIsReady()) return null;

  const server = spawn('pnpm', ['preview', '--host', '127.0.0.1'], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let errorOutput = '';
  server.stderr.on('data', (chunk) => {
    errorOutput += chunk.toString();
  });

  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await serverIsReady()) return server;
    if (server.exitCode !== null) {
      throw new Error(`Vite Previewの起動に失敗しました。\n${errorOutput}`);
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }

  server.kill('SIGTERM');
  throw new Error('Vite Previewの起動待ちがタイムアウトしました。');
}

async function waitForMap(page) {
  await page.locator('#map').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const tiles = [...document.querySelectorAll('.leaflet-tile')];
    const renderedTiles = tiles.filter((tile) => Number.parseFloat(getComputedStyle(tile).opacity) > 0);
    const renderedContainers = [...document.querySelectorAll('.leaflet-tile-container')]
      .filter((container) =>
        container.querySelector('.leaflet-tile') &&
        Number.parseFloat(getComputedStyle(container).opacity) > 0
      );
    return renderedTiles.length > 0 &&
      renderedTiles.every((tile) =>
        tile.complete &&
        tile.naturalWidth > 0 &&
        Number.parseFloat(getComputedStyle(tile).opacity) >= 0.99
      ) &&
      renderedContainers.every((container) =>
        Number.parseFloat(getComputedStyle(container).opacity) >= 0.99
      );
  });
  await page.waitForTimeout(500);
}

async function selectBaseMap(page, mapName) {
  const layersControl = page.locator('.leaflet-control-layers');
  await layersControl.hover();
  const mapOption = layersControl
    .locator('label')
    .filter({ hasText: mapName })
    .locator('input');
  await mapOption.check();
  await page.mouse.move(600, 500);
  await waitForMap(page);
}

async function openMenu(page) {
  const menu = page.locator('#menu-column');
  const isOpen = await menu.evaluate((element) => element.matches(':popover-open'));
  if (!isOpen) {
    await page.locator('#menu-toggle-btn').click();
    await menu.waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
  }
}

async function closeMenu(page) {
  const menu = page.locator('#menu-column');
  const isOpen = await menu.evaluate((element) => element.matches(':popover-open'));
  if (isOpen) {
    await menu.getByRole('button', { name: '閉じる' }).click();
    await page.waitForTimeout(300);
  }
}

async function setTableCell(page, tableSelector, x, y, value) {
  const cell = page.locator(`${tableSelector} td[data-x="${x}"][data-y="${y}"]`);
  await cell.dblclick();
  await page.keyboard.press('Control+A');
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
}

async function enterSampleLatLngs(page) {
  await page.locator('#source-is-latlng').check();
  await page.locator('#source-is-jgd2011').check();
  for (const [row, point] of samplePoints.entries()) {
    await setTableCell(page, '#source-data-table', 0, row, point[0]);
    await setTableCell(page, '#source-data-table', 1, row, point[1]);
  }
}

async function reloadApplication(page) {
  await page.goto(applicationUrl, { waitUntil: 'networkidle' });
  await waitForMap(page);
  await selectBaseMap(page, '地理院地図 (淡色地図)');
}

async function dropGpsPhotos(page) {
  const files = gpsPhotoPaths.map((path) => ({
    name: path.split('/').at(-1),
    type: 'image/jpeg',
    base64: readFileSync(path).toString('base64'),
  }));
  const dataTransfer = await page.evaluateHandle((photoFiles) => {
    const transfer = new DataTransfer();
    for (const photoFile of photoFiles) {
      const binary = atob(photoFile.base64);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      transfer.items.add(new File([bytes], photoFile.name, { type: photoFile.type }));
    }
    return transfer;
  }, files);

  await page.locator('#map').dispatchEvent('drop', { dataTransfer });
  await dataTransfer.dispose();
  await page.waitForFunction(
    () => document.querySelectorAll('.photo-icon').length === 3,
    undefined,
    { timeout: 30_000 },
  );
  await page.waitForTimeout(800);
  await waitForMap(page);
  await page.locator('.leaflet-control-zoom-out').click();
  await page.mouse.move(700, 500);
  await page.waitForTimeout(2_000);
  await waitForMap(page);
}

async function capture(page, fileName) {
  await page.screenshot({
    path: resolve(outputDirectory, fileName),
    animations: 'disabled',
  });
  console.log(`captured ${fileName}`);
}

async function captureElementWithPadding(page, locator, fileName, padding = 16) {
  const elementBox = await locator.boundingBox();
  if (!elementBox) throw new Error(`${fileName} の撮影対象が見つかりません。`);

  const viewport = page.viewportSize();
  const left = Math.max(0, elementBox.x - padding);
  const top = Math.max(0, elementBox.y - padding);
  const right = Math.min(viewport.width, elementBox.x + elementBox.width + padding);
  const bottom = Math.min(viewport.height, elementBox.y + elementBox.height + padding);

  await page.screenshot({
    path: resolve(outputDirectory, fileName),
    animations: 'disabled',
    clip: {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    },
  });
  console.log(`captured ${fileName}`);
}

async function captureScreenshots(page) {
  await reloadApplication(page);
  await capture(page, '01-overview.png');
  await captureElementWithPadding(
    page,
    page.locator('.leaflet-control-layers-toggle'),
    '01-layer-button.png',
  );

  await openMenu(page);
  await enterSampleLatLngs(page);
  await page.locator('#source-data-table').scrollIntoViewIfNeeded();
  await capture(page, '02-data-input.png');

  await closeMenu(page);
  await selectBaseMap(page, '地理院地図 (航空写真)');
  await openMenu(page);
  await page.locator('#select-marker-icon').selectOption('red');
  await page.locator('#select-line-color').selectOption('yellow');
  await page.locator('#add-marker-btn').scrollIntoViewIfNeeded();
  await capture(page, '03-marker-line-settings.png');
  await page.locator('#add-marker-btn').click();
  await closeMenu(page);
  await waitForMap(page);
  await capture(page, '03-markers-and-lines.png');

  await reloadApplication(page);
  await selectBaseMap(page, '地理院地図 (航空写真)');
  await openMenu(page);
  await enterSampleLatLngs(page);
  await page.locator('#select-marker-icon').selectOption('yellow');
  await page.locator('#select-line-color').selectOption('no');
  await page.locator('#add-marker-btn').scrollIntoViewIfNeeded();
  await capture(page, '03-icon-only-settings.png');
  await page.locator('#add-marker-btn').click();
  await closeMenu(page);
  await waitForMap(page);
  await capture(page, '03-icons-only.png');

  await reloadApplication(page);
  const map = page.locator('#map');
  await map.click({ button: 'right', position: { x: 720, y: 430 } });
  await capture(page, '04-map-context-menu.png');
  await page.getByText('円を追加', { exact: true }).click();
  await page.locator('#radius').fill('500');
  await capture(page, '05-circle-radius-dialog.png');
  await page.locator('#add-circle-to-map').click();
  await capture(page, '06-circle.png');

  await reloadApplication(page);
  await map.click({ button: 'right', position: { x: 570, y: 470 } });
  await page.getByText('この地点からの距離を計測', { exact: true }).click();
  await map.click({ button: 'right', position: { x: 870, y: 470 } });
  await page.getByText('この地点までの距離を計測', { exact: true }).click();
  await capture(page, '07-distance-measurement.png');

  await reloadApplication(page);
  await openMenu(page);
  await enterSampleLatLngs(page);
  await page.locator('a[href="#data-convert-pane"]').click();
  await page.locator('#convert-to-xy').check();
  await page.locator('#convert-to-jgd2011').check();
  await page.locator('#convert-zone-no').selectOption('9');
  await page.locator('#data-convert-btn').click();
  await page.locator('#data-convert-pane').scrollIntoViewIfNeeded();
  await capture(page, '08-coordinate-conversion.png');

  await page.locator('#open-acceptable-data-dialog').click();
  await capture(page, '09-input-formats.png');
  await page.locator('#close-acceptable-data-dialog').click();
  await closeMenu(page);

  await page.getByRole('button', { name: '使い方を表示' }).click();
  const help = page.locator('#help-column');
  await help.waitFor({ state: 'visible' });
  await help.locator('#xy-or-latlng-to-marker').click();
  await page.waitForTimeout(300);
  await capture(page, '10-help-panel.png');

  if (gpsPhotoPaths.every(existsSync)) {
    await reloadApplication(page);
    await dropGpsPhotos(page);
    await capture(page, '11-photo-locations.png');
  } else {
    console.warn('GPS写真が見つからないため、11-photo-locations.png の再撮影をスキップします。');
  }
}

mkdirSync(outputDirectory, { recursive: true });
execFileSync('pnpm', ['build'], { cwd: projectRoot, stdio: 'inherit' });
const previewServer = await startPreviewServer();
let browser;

try {
  const executablePath = chromiumExecutable();
  console.log(`using Chromium: ${executablePath}`);
  browser = await chromium.launch({ headless: true, executablePath });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'ja-JP',
  });
  await context.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') console.error(`browser: ${message.text()}`);
  });
  await captureScreenshots(page);
  await context.close();
} finally {
  await browser?.close();
  previewServer?.kill('SIGTERM');
}
