/*
 * ベクターレイヤーの描画性能ベンチマーク
 *
 * 目的:
 *   Leaflet のベクターレイヤーを Canvas レンダラ（preferCanvas: true）で描画した場合と
 *   SVG レンダラで描画した場合の描画性能を、同一シナリオ・同一端末で比較するために使う。
 *   印刷時に Chromium が Canvas の透明部分を不透明な白として印刷してしまう不具合
 *   （https://issues.chromium.org/issues/40788827）への対策として SVG 統一を検討した際、
 *   描画性能が許容範囲かを定量的に確認するのが狙い。
 *
 * 使い方:
 *   1) 現在のソースのまま計測する（例: Canvas レンダラの数値を取得）
 *        pnpm benchmark:vector -- --label canvas --out /tmp/bench-canvas.json
 *   2) ソース（src/js/map.ts の preferCanvas）を変更して再計測（例: SVG）
 *        pnpm benchmark:vector -- --label svg --out /tmp/bench-svg.json
 *   スクリプトは毎回 pnpm build から実行するため、その時点のソースがそのまま計測対象になる。
 *
 * 前提:
 *   - ./scripts/capture-manual-screenshots.mjs と同じく @playwright/test を利用する。
 *   - 外部サービスへは接続しない。地理院タイルと不動産情報ライブラリのプロキシは
 *     page.route でモックし、それ以外の外部ホストへのリクエストは abort する。
 *   - ビルドは VITE_REINFOLIB_PROXY_URL=https://manual-reinfolib.invalid で行い、
 *     不動産情報ライブラリのレイヤーを有効化して多数のポリゴンを描画させる。
 *   - Chromium の起動には libasound.so.2 などが必要な環境では、実行時に
 *     LD_LIBRARY_PATH を設定すること（未設定の場合は一般的なライブラリ置き場を探索する）。
 *
 * オプション:
 *   --label <name>              結果に付けるラベル（大きい差の比較用。既定: "vector"）
 *   --out <path>                JSON をファイルにも保存する
 *   --features-per-tile <n>     1タイルあたりに生成するモックポリゴン数（既定: 60）
 *   --iterations <n>            パン＋ズームの繰り返し回数（既定: 12）
 *   --circles <n>               事前に追加する円の数（既定: 12）
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const projectRoot = resolve(import.meta.dirname, '..');
const applicationUrl = process.env.BENCHMARK_BASE_URL ?? 'http://127.0.0.1:4173/';
const mockReinfolibUrl = 'https://manual-reinfolib.invalid';

// 地理院タイルのモックに使う 1x1 の透明 PNG（外部アクセスを避けるためのダミータイル）
const MOCK_TILE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

function parseArguments(argv) {
  const options = {
    label: 'vector',
    out: null,
    featuresPerTile: 60,
    iterations: 12,
    circles: 12,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === '--label' && value) {
      options.label = value;
      index += 1;
    } else if (argument === '--out' && value) {
      options.out = value;
      index += 1;
    } else if (argument === '--features-per-tile' && value) {
      options.featuresPerTile = Number.parseInt(value, 10);
      index += 1;
    } else if (argument === '--iterations' && value) {
      options.iterations = Number.parseInt(value, 10);
      index += 1;
    } else if (argument === '--circles' && value) {
      options.circles = Number.parseInt(value, 10);
      index += 1;
    }
  }
  return options;
}

// 標準的なXYZタイル方式（Web Mercator）でのタイル境界（緯度経度）
function tileBounds(z, x, y) {
  const tileCount = 2 ** z;
  return {
    lngWest: (x / tileCount) * 360 - 180,
    lngEast: ((x + 1) / tileCount) * 360 - 180,
    latNorth: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / tileCount))) * 180) / Math.PI,
    latSouth:
      (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / tileCount))) * 180) / Math.PI,
  };
}

// 指定タイル内に grid 状の小ポリゴンを featuresPerTile 個生成する。
// 実際のタイル境界に追従させることで、パン/ズームで新しいタイルを読み込むたびに
// 表示中のベクター要素数が増えていく（＝実利用に近い負荷になる）。
function mockFeaturesForTile(z, x, y, featuresPerTile) {
  const bounds = tileBounds(z, x, y);
  const columns = Math.max(1, Math.ceil(Math.sqrt(featuresPerTile)));
  const rows = Math.max(1, Math.ceil(featuresPerTile / columns));
  const features = [];
  for (let row = 0; row < rows && features.length < featuresPerTile; row += 1) {
    for (let column = 0; column < columns && features.length < featuresPerTile; column += 1) {
      const lng0 = bounds.lngWest + ((bounds.lngEast - bounds.lngWest) * column) / columns;
      const lng1 = bounds.lngWest + ((bounds.lngEast - bounds.lngWest) * (column + 1)) / columns;
      const lat0 = bounds.latSouth + ((bounds.latNorth - bounds.latSouth) * row) / rows;
      const lat1 = bounds.latSouth + ((bounds.latNorth - bounds.latSouth) * (row + 1)) / rows;
      // ポリゴンをセルから少し内側に縮めて重なりを減らす
      const insetLng = (lng1 - lng0) * 0.15;
      const insetLat = (lat1 - lat0) * 0.15;
      features.push({
        type: 'Feature',
        properties: {
          _index: 'bs001_use_area_202609010900',
          use_area_ja: '商業地域',
          u_floor_area_ratio_ja: '500.0%',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng0 + insetLng, lat0 + insetLat],
            [lng1 - insetLng, lat0 + insetLat],
            [lng1 - insetLng, lat1 - insetLat],
            [lng0 + insetLng, lat1 - insetLat],
            [lng0 + insetLng, lat0 + insetLat],
          ]],
        },
      });
    }
  }
  return { type: 'FeatureCollection', features };
}

// 外部アクセスを完全に防ぐルーティング。ローカルのプレビューのみ continue させ、
// 地理院タイルと不動産情報ライブラリのプロキシはモックで応答し、その他は abort する。
async function installNetworkMock(page, featuresPerTile) {
  await page.route('**', async (route) => {
    const requestUrl = route.request().url();
    const url = new URL(requestUrl);
    if (url.protocol === 'data:' || url.protocol === 'blob:') {
      return route.continue();
    }
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      return route.continue();
    }
    if (url.hostname.endsWith('gsi.go.jp')) {
      return route.fulfill({ contentType: 'image/png', body: MOCK_TILE_PNG });
    }
    if (requestUrl.startsWith(mockReinfolibUrl)) {
      const match = url.pathname.match(/^\/tiles\/(XKT\d+)\/(\d+)\/(\d+)\/(\d+)$/);
      const body = match
        ? mockFeaturesForTile(
            Number(match[2]),
            Number(match[3]),
            Number(match[4]),
            featuresPerTile,
          )
        : { type: 'FeatureCollection', features: [] };
      return route.fulfill({ json: body });
    }
    // Google Maps などの外部サービスには一切接続しない
    return route.abort();
  });
}

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

// libasound.so.2 など共有ライブラリが一般的な場所に無い環境向けに、
// LD_LIBRARY_PATH が未設定なら候補ディレクトリを探索して補う。
function launchEnvironment() {
  const environment = { ...process.env };
  if (environment.LD_LIBRARY_PATH) return environment;

  const libraryNames = ['libasound.so.2'];
  const candidateDirectories = [
    '/usr/lib/x86_64-linux-gnu',
    '/usr/lib/aarch64-linux-gnu',
    '/usr/lib64',
    '/lib/x86_64-linux-gnu',
    '/run/current-system/sw/lib',
  ];
  const foundLibraries = candidateDirectories.filter(
    (directory) =>
      existsSync(directory) &&
      libraryNames.some((library) => existsSync(resolve(directory, library))),
  );
  if (foundLibraries.length > 0) {
    environment.LD_LIBRARY_PATH = foundLibraries.join(':');
    console.log(`LD_LIBRARY_PATH を自動設定します: ${environment.LD_LIBRARY_PATH}`);
  }
  return environment;
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
  await page.waitForFunction(() => Boolean(document.querySelector('.leaflet-pane')));
  await page.waitForTimeout(500);
}

// 不動産情報ライブラリのレイヤー（用途地域）を有効化し、多数のポリゴンを描画させる。
async function enableReinfolibLayer(page) {
  const layersControl = page.locator('.leaflet-control-layers');
  await layersControl.hover();
  const overlayInput = layersControl
    .locator('label')
    .filter({ hasText: '不動産情報ライブラリ (用途地域)' })
    .locator('input');
  await overlayInput.check();
  await page.mouse.move(900, 700);
  // タイルごとのモック GeoJSON を読み込ませる
  await page.waitForTimeout(2_000);
}

// 円はユーザー実機で白く飛ぶ症状が報告されたレイヤーなので、
// 右クリックメニューから複数追加してベンチマークに含める。
async function addCircles(page, count) {
  const map = page.locator('#map');
  // 既存の円の内側を右クリックすると「円を追加」ではなく円用メニューが開くため、
  // 円（半径200m≒50px）が重ならないよう十分な間隔でグリッド配置する。
  const columns = 4;
  for (let index = 0; index < count; index += 1) {
    const x = 420 + (index % columns) * 160;
    const y = 300 + Math.floor(index / columns) * 160;
    await map.click({ button: 'right', position: { x, y } });
    await page.getByText('円を追加', { exact: true }).click();
    await page.locator('#radius').fill('200');
    await page.locator('#add-circle-to-map').click();
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(500);
}

// 計測用の rAF フックと long task オブザーバをアプリ読み込み前に仕込む。
async function installPerformanceInstrumentation(page) {
  await page.addInitScript(() => {
    window.__benchFrames = [];
    window.__benchRecording = false;
    window.__benchLongTasks = [];
    const recordFrame = (timestamp) => {
      if (window.__benchRecording) {
        window.__benchFrames.push(timestamp);
      }
      requestAnimationFrame(recordFrame);
    };
    requestAnimationFrame(recordFrame);
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__benchLongTasks.push(entry.duration);
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // longtask 非対応環境では収集しない
    }
  });
}

async function startRecording(page) {
  await page.evaluate(() => {
    window.__benchFrames.length = 0;
    window.__benchLongTasks.length = 0;
    window.__benchRecording = true;
  });
}

async function stopRecording(page) {
  await page.evaluate(() => {
    window.__benchRecording = false;
  });
  return page.evaluate(() => ({
    frames: window.__benchFrames,
    longTasks: window.__benchLongTasks,
  }));
}

// パンとズームを繰り返し、その間のフレーム間隔を計測する。
async function runPanZoomScenario(page, iterations) {
  const mapBox = await page.locator('#map').boundingBox();
  const centerX = mapBox.x + mapBox.width / 2;
  const centerY = mapBox.y + mapBox.height / 2;
  const zoomIn = page.locator('.leaflet-control-zoom-in');
  const zoomOut = page.locator('.leaflet-control-zoom-out');

  for (let index = 0; index < iterations; index += 1) {
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX - 260, centerY - 160, { steps: 14 });
    await page.mouse.move(centerX + 260, centerY + 160, { steps: 14 });
    await page.mouse.move(centerX, centerY, { steps: 8 });
    await page.mouse.up();
    await zoomIn.click();
    await page.waitForTimeout(300);
    await zoomOut.click();
    await page.waitForTimeout(300);
  }
}

async function countVectorElements(page) {
  return page.evaluate(() => ({
    svgPaths: document.querySelectorAll('.leaflet-overlay-pane svg path').length,
    overlayCanvases: document.querySelectorAll('.leaflet-overlay-pane canvas').length,
    allCanvases: document.querySelectorAll('canvas').length,
  }));
}

function summarizeFrames(frames) {
  if (frames.length < 2) {
    return { count: frames.length, meanIntervalMs: null, medianIntervalMs: null, p95IntervalMs: null };
  }
  const intervals = [];
  for (let index = 1; index < frames.length; index += 1) {
    intervals.push(frames[index] - frames[index - 1]);
  }
  const sorted = [...intervals].sort((left, right) => left - right);
  const mean = intervals.reduce((total, value) => total + value, 0) / intervals.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  // vsync の揺らぎ（16.7ms前後）を「60fps未満」と誤判定しないよう 1ms の猶予を置く
  const sixtyFpsThreshold = 1000 / 60 + 1;
  const below60fps = intervals.filter((value) => value > sixtyFpsThreshold).length;
  const jank = intervals.filter((value) => value > 25).length;
  const elapsedMs = frames[frames.length - 1] - frames[0];
  return {
    count: frames.length,
    elapsedMs,
    fps: elapsedMs > 0 ? ((frames.length - 1) / elapsedMs) * 1000 : null,
    meanIntervalMs: mean,
    medianIntervalMs: median,
    p95IntervalMs: p95,
    below60fpsFrames: below60fps,
    below60fpsRatio: below60fps / intervals.length,
    jankFramesOver25ms: jank,
    maxIntervalMs: sorted[sorted.length - 1],
  };
}

function summarizeLongTasks(longTasks) {
  const total = longTasks.reduce((sum, value) => sum + value, 0);
  return {
    count: longTasks.length,
    totalDurationMs: total,
    maxDurationMs: longTasks.length > 0 ? Math.max(...longTasks) : 0,
  };
}

function roundNumbers(value, digits = 3) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => roundNumbers(entry, digits));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, roundNumbers(entry, digits)]),
    );
  }
  return value;
}

const options = parseArguments(process.argv.slice(2));

execFileSync('pnpm', ['build'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env, VITE_REINFOLIB_PROXY_URL: mockReinfolibUrl },
});

const previewServer = await startPreviewServer();
let browser;
const result = {
  label: options.label,
  scenario: {
    featuresPerTile: options.featuresPerTile,
    iterations: options.iterations,
    circles: options.circles,
  },
};

try {
  const executablePath = chromiumExecutable();
  console.log(`using Chromium: ${executablePath}`);
  browser = await chromium.launch({
    headless: true,
    executablePath,
    env: launchEnvironment(),
  });
  const browserVersion = await browser.version();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'ja-JP',
  });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send('Performance.enable');

  await installPerformanceInstrumentation(page);
  await installNetworkMock(page, options.featuresPerTile);
  page.on('console', (message) => {
    if (message.type() === 'error') console.error(`browser: ${message.text()}`);
  });

  await page.goto(applicationUrl, { waitUntil: 'networkidle' });
  await waitForMap(page);
  await enableReinfolibLayer(page);
  if (options.circles > 0) {
    await addCircles(page, options.circles);
  }
  await page.mouse.move(900, 700);
  await page.waitForTimeout(1_000);

  const vectorCountsBefore = await countVectorElements(page);
  const metricsBefore = await client.send('Performance.getMetrics');
  await startRecording(page);

  const startedAt = performance.now();
  await runPanZoomScenario(page, options.iterations);
  const elapsedNodeMs = performance.now() - startedAt;

  const recording = await stopRecording(page);
  const metricsAfter = await client.send('Performance.getMetrics');
  const vectorCountsAfter = await countVectorElements(page);

  const metricsDelta = {};
  for (const name of [
    'LayoutDuration',
    'ScriptDuration',
    'RecalcStyleDuration',
    'TaskDuration',
    'JSHeapUsedSize',
  ]) {
    const before = metricsBefore.metrics.find((metric) => metric.name === name)?.value ?? 0;
    const after = metricsAfter.metrics.find((metric) => metric.name === name)?.value ?? 0;
    metricsDelta[name] = after - before;
  }

  result.browserVersion = browserVersion;
  result.renderingMode =
    vectorCountsBefore.overlayCanvases > 0 ? 'canvas' : vectorCountsBefore.svgPaths > 0 ? 'svg' : 'unknown';
  result.vectorCounts = { before: vectorCountsBefore, after: vectorCountsAfter };
  result.nodeElapsedMs = elapsedNodeMs;
  result.frames = summarizeFrames(recording.frames);
  result.longTasks = summarizeLongTasks(recording.longTasks);
  result.cdpMetricsDelta = metricsDelta;

  await context.close();
} finally {
  await browser?.close();
  previewServer?.kill('SIGTERM');
}

const output = roundNumbers(result);
console.log(JSON.stringify(output, null, 2));
if (options.out) {
  writeFileSync(resolve(options.out), `${JSON.stringify(output, null, 2)}\n`);
  console.log(`ベンチマーク結果を保存しました: ${resolve(options.out)}`);
}