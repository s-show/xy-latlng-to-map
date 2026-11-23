import { deflateSync } from 'node:zlib';
import type { BrowserContext, Page } from '@playwright/test';

export const REINFOLIB_MOCK_ORIGIN = 'https://verify-reinfolib.invalid';

const REINFOLIB_FIXTURES: Record<string, Record<string, string>> = {
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

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, 'ascii');
  const lengthBytes = Buffer.alloc(4);
  lengthBytes.writeUInt32BE(data.length, 0);
  const crcBytes = Buffer.alloc(4);
  crcBytes.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([lengthBytes, typeBytes, data, crcBytes]);
}

function createSolidTilePng(width: number, height: number, [r, g, b]: [number, number, number]): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const rowStride = 1 + width * 3;
  const raw = Buffer.alloc(rowStride * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowStride;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const px = rowStart + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }
  return Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', deflateSync(raw)),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const MOCK_TILE_PNG = createSolidTilePng(256, 256, [236, 242, 248]);

function tileCoordsFor(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const tileCount = 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;
  return {
    x: Math.floor(((lng + 180) / 360) * tileCount),
    y: Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * tileCount,
    ),
  };
}

function buildReinfolibFixture(apiId: string, zoom: number, x: number, y: number) {
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

function buildAddressSearchFixture(query: string) {
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

export interface OfflineDiagnostics {
  readonly consoleErrors: string[];
  readonly pageErrors: string[];
  readonly blockedExternalRequests: string[];
}

export async function installOfflineMocks(
  context: BrowserContext,
  page: Page,
  baseURL: string,
): Promise<OfflineDiagnostics> {
  const diagnostics: OfflineDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
    blockedExternalRequests: [],
  };
  const appOrigin = new URL(baseURL).origin;

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
      await route.fulfill({ status: 200, contentType: 'image/png', body: MOCK_TILE_PNG });
      return;
    }
    if (parsed.hostname === 'msearch.gsi.go.jp' && parsed.pathname.includes('AddressSearch')) {
      const query = parsed.searchParams.get('q') ?? '';
      await route.fulfill({ json: buildAddressSearchFixture(query) });
      return;
    }
    if (requestUrl.startsWith(`${REINFOLIB_MOCK_ORIGIN}/tiles/`)) {
      const match = parsed.pathname.match(/^\/tiles\/(XKT\d+)\/(\d+)\/(\d+)\/(\d+)$/);
      const body = match
        ? buildReinfolibFixture(match[1], Number(match[2]), Number(match[3]), Number(match[4]))
        : { type: 'FeatureCollection', features: [] };
      await route.fulfill({ json: body });
      return;
    }

    diagnostics.blockedExternalRequests.push(requestUrl);
    await route.abort('blockedbyclient');
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      diagnostics.consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    diagnostics.pageErrors.push(String(error));
  });

  return diagnostics;
}

export async function waitForMapReady(page: Page): Promise<void> {
  await page.locator('#map').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const tiles = [...document.querySelectorAll<HTMLImageElement>('.leaflet-tile')];
    return tiles.length > 0 && tiles.every((tile) => tile.complete && tile.naturalWidth > 0);
  });
}

export async function openMenu(page: Page): Promise<void> {
  const menu = page.locator('#menu-column');
  const isOpen = await menu.evaluate((el) => el.matches(':popover-open'));
  if (!isOpen) {
    await page.getByRole('button', { name: 'メニューを開く' }).click();
    await menu.waitFor({ state: 'visible' });
  }
}

export async function closeMenu(page: Page): Promise<void> {
  const menu = page.locator('#menu-column');
  const isOpen = await menu.evaluate((el) => el.matches(':popover-open'));
  if (isOpen) {
    await menu.getByRole('button', { name: '閉じる' }).click();
    await page.waitForFunction(() => !document.querySelector('#menu-column')?.matches(':popover-open'));
  }
}

export async function setTableCell(
  page: Page,
  tableSelector: string,
  col: number,
  row: number,
  value: string,
): Promise<void> {
  const cell = page.locator(`${tableSelector} td[data-x="${col}"][data-y="${row}"]`);
  await cell.dblclick();
  await page.keyboard.press('Control+A');
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
}
