import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import {
  closeMenu,
  installOfflineMocks,
  openMenu,
  setTableCell,
  waitForMapReady,
} from './helpers/offlineHarness.js';

test.describe('xy-latlng-to-map core workflows (offline mocked)', () => {
  test('bulk plots markers and polylines with memo popup and clears all shapes', async ({
    context,
    page,
    baseURL,
  }) => {
    const diagnostics = await installOfflineMocks(context, page, baseURL!);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForMapReady(page);

    await openMenu(page);
    await page.locator('#source-is-latlng').check();
    await page.locator('#source-is-jgd2011').check();

    const points: [string, string, string][] = [
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

    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(3);
    await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(2);

    await page.locator('.leaflet-marker-icon').first().click();
    await expect(page.locator('.leaflet-popup-content')).toContainText('東京タワー付近');

    await openMenu(page);
    await page.getByRole('button', { name: '全図形を削除' }).click();
    await closeMenu(page);

    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
    await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(0);
    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.pageErrors).toEqual([]);
    expect(diagnostics.blockedExternalRequests).toEqual([]);
  });

  test('converts JGD2011 latlng to Zone 9 XY and exports CSV with headers', async ({
    context,
    page,
    baseURL,
  }) => {
    const diagnostics = await installOfflineMocks(context, page, baseURL!);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForMapReady(page);

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

    const convertedX = Number(
      (await page.locator('#converted-data-table td[data-x="0"][data-y="0"]').textContent())?.trim(),
    );
    const convertedY = Number(
      (await page.locator('#converted-data-table td[data-x="1"][data-y="0"]').textContent())?.trim(),
    );
    expect(convertedX).toBeGreaterThan(-39000);
    expect(convertedX).toBeLessThan(-37000);
    expect(convertedY).toBeGreaterThan(-9000);
    expect(convertedY).toBeLessThan(-8000);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-csv-btn').click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const csvText = readFileSync(downloadPath!, 'utf8');
    expect(csvText).toContain('変換元');
    expect(csvText).toContain('9系');
    expect(csvText).toContain('35.6580992222');

    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.pageErrors).toEqual([]);
    expect(diagnostics.blockedExternalRequests).toEqual([]);
  });

  test('supports map context menu marker, circle, and distance measurement', async ({
    context,
    page,
    baseURL,
  }) => {
    const diagnostics = await installOfflineMocks(context, page, baseURL!);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForMapReady(page);

    const map = page.locator('#map');
    const box = await map.boundingBox();
    expect(box).not.toBeNull();
    const centerX = Math.round(box!.width / 2);
    const centerY = Math.round(box!.height / 2);

    await map.click({ button: 'right', position: { x: centerX - 80, y: centerY } });
    await page.getByText('アイコンを追加', { exact: true }).click();
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
    await page.locator('.leaflet-marker-icon').first().hover();
    await expect(page.locator('.leaflet-tooltip').first()).toContainText('緯度経度:');

    await map.click({ button: 'right', position: { x: centerX + 80, y: centerY } });
    await page.getByText('円を追加', { exact: true }).click();
    await page.locator('#radius').fill('500');
    await page.locator('#add-circle-to-map').click();
    await expect(page.locator('.leaflet-tooltip', { hasText: '半径: 500m' })).toHaveCount(1);

    await map.click({ button: 'right', position: { x: centerX - 320, y: centerY + 220 } });
    await page.getByText('この地点からの距離を計測', { exact: true }).click();
    await map.click({ button: 'right', position: { x: centerX - 120, y: centerY + 220 } });
    await page.getByText('この地点までの距離を計測', { exact: true }).click();
    await expect(page.locator('.leaflet-tooltip', { hasText: /距離:\s*\d+m/ })).toHaveCount(1);

    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.pageErrors).toEqual([]);
    expect(diagnostics.blockedExternalRequests).toEqual([]);
  });

  test('supports address search candidates, keyboard selection, and empty state', async ({
    context,
    page,
    baseURL,
  }) => {
    const diagnostics = await installOfflineMocks(context, page, baseURL!);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForMapReady(page);

    const input = page.locator('#address-search-input');
    const results = page.locator('#address-search-results');

    await input.fill('芝公園');
    await input.press('Enter');
    await expect(results.locator('li')).toHaveCount(2);

    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(results.locator('li')).toHaveCount(0);
    await expect(input).toHaveValue('東京都港区芝公園一丁目');

    await input.fill('存在しない住所テスト');
    await input.press('Enter');
    await expect(page.locator('#address-search-message')).toContainText(
      '該当する住所が見つかりませんでした',
    );

    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.pageErrors).toEqual([]);
    expect(diagnostics.blockedExternalRequests).toEqual([]);
  });

  test('displays Reinfolib 6-layer popup and print grid and cleans up on close', async ({
    context,
    page,
    baseURL,
  }) => {
    const diagnostics = await installOfflineMocks(context, page, baseURL!);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForMapReady(page);

    const map = page.locator('#map');
    const box = await map.boundingBox();
    expect(box).not.toBeNull();
    await map.click({
      button: 'right',
      position: { x: Math.round(box!.width / 2), y: Math.round(box!.height / 2) },
    });
    await page.getByText('不動産情報ライブラリの情報を表示', { exact: true }).click();

    const popup = page.locator('.reinfolib-popup');
    await expect(popup).toContainText('都市計画区域/区域区分');
    await expect(popup).toContainText('市街化区域');
    await expect(popup).toContainText('商業地域');
    await expect(popup).toContainText('500%');
    await expect(page.locator('#reinfolib-print-info')).toHaveClass(/reinfolib-print-grid--has-content/);
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);

    await page.locator('.leaflet-popup-close-button').click();
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
    await expect(page.locator('#reinfolib-print-info')).not.toHaveClass(/reinfolib-print-grid--has-content/);

    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.pageErrors).toEqual([]);
    expect(diagnostics.blockedExternalRequests).toEqual([]);
  });
});
