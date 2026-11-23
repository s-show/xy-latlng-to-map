import { expect, test } from '@playwright/test';
import { installOfflineMocks, waitForMapReady } from './helpers/offlineHarness.js';

test.describe('Icon-Add API (URL query and window.xyLatLngToMap)', () => {
  test('hydrates single XY Zone 9 marker from URL query without mutating table', async ({
    context,
    page,
    baseURL,
  }) => {
    const diagnostics = await installOfflineMocks(context, page, baseURL!);
    await page.goto(
      '/?x=-37875.1959&y=-7958.6436&zone=9&geodetic=JGD2011&color=blue&memo=-1F%20%E5%85%A5%E5%8F%A3',
      { waitUntil: 'networkidle' },
    );
    await waitForMapReady(page);

    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
    await expect(page.locator('#error-message-wrap')).toHaveClass(/visually-hidden/);

    await page.locator('.leaflet-marker-icon').first().click();
    await expect(page.locator('.leaflet-popup-content')).toContainText('-1F 入口');

    const markers = await page.evaluate(() => window.xyLatLngToMap?.getMarkers() ?? []);
    expect(markers).toHaveLength(1);
    expect(markers[0].source).toBe('url');
    expect(markers[0].color).toBe('blue');
    expect(markers[0].lat).toBeCloseTo(35.65858, 4);
    expect(markers[0].lng).toBeCloseTo(139.745433, 4);

    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.pageErrors).toEqual([]);
    expect(diagnostics.blockedExternalRequests).toEqual([]);
  });

  test('hydrates DMS format latlng from URL query parameters', async ({
    context,
    page,
    baseURL,
  }) => {
    const diagnostics = await installOfflineMocks(context, page, baseURL!);
    const query = new URLSearchParams();
    query.set('type', 'latlng');
    query.append('p', '北緯35度39分29秒1572,東経139度44分28秒8869,日本経緯度原点');
    query.append('p', '35°39′53.82″,139°46′13.6″,サンプル地点');

    await page.goto(`/?${query.toString()}`, { waitUntil: 'networkidle' });
    await waitForMapReady(page);

    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2);
    await expect(page.locator('#error-message-wrap')).toHaveClass(/visually-hidden/);

    const markers = await page.evaluate(() => window.xyLatLngToMap?.getMarkers() ?? []);
    expect(markers).toHaveLength(2);
    expect(markers[0].lat).toBeCloseTo(35.658099, 5);
    expect(markers[0].lng).toBeCloseTo(139.741357, 5);
    expect(markers[0].memo).toBe('日本経緯度原点');
    expect(markers[1].lat).toBeCloseTo(35.66495, 5);
    expect(markers[1].lng).toBeCloseTo(139.770444, 5);

    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.pageErrors).toEqual([]);
    expect(diagnostics.blockedExternalRequests).toEqual([]);
  });

  test('hydrates multi-point URL query with connecting polyline and XSS-safe popup', async ({
    context,
    page,
    baseURL,
  }) => {
    const diagnostics = await installOfflineMocks(context, page, baseURL!);
    const payload = '<img src=x onerror=window.__xssTriggered=true>';
    const query = new URLSearchParams();
    query.set('type', 'latlng');
    query.append('p', `35.65858,139.745433,${payload}`);
    query.append('p', '35.65749,139.74824,増上寺');
    query.set('color', 'green');
    query.set('line', 'yellow');

    await page.goto(`/?${query.toString()}`, { waitUntil: 'networkidle' });
    await waitForMapReady(page);

    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2);
    await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(1);

    await page.locator('.leaflet-marker-icon').first().click();
    const popup = page.locator('.leaflet-popup-content');
    await expect(popup).toContainText(payload);
    await expect(popup.locator('img')).toHaveCount(0);

    const xssTriggered = await page.evaluate(
      () => (window as unknown as { __xssTriggered?: boolean }).__xssTriggered === true,
    );
    expect(xssTriggered).toBe(false);
    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.pageErrors).toEqual([]);
    expect(diagnostics.blockedExternalRequests).toEqual([]);
  });

  test('displays error banner and plots zero markers on invalid URL query', async ({
    context,
    page,
    baseURL,
  }) => {
    const diagnostics = await installOfflineMocks(context, page, baseURL!);
    await page.goto('/?x=-37900&y=-8300', { waitUntil: 'networkidle' });
    await waitForMapReady(page);

    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
    await expect(page.locator('#error-message-wrap')).not.toHaveClass(/visually-hidden/);
    await expect(page.locator('#error-message')).toContainText('zone');

    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.pageErrors).toEqual([]);
    expect(diagnostics.blockedExternalRequests).toEqual([]);
  });

  test('supports window.xyLatLngToMap addMarkers, getMarkers, clearMarkers, and 100-point perf', async ({
    context,
    page,
    baseURL,
  }) => {
    const diagnostics = await installOfflineMocks(context, page, baseURL!);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForMapReady(page);

    const result = await page.evaluate(() => {
      const api = window.xyLatLngToMap!;
      const invalid = api.addMarkers({ type: 'XY', points: [{ first: 0, second: 0 }] });

      const points = Array.from({ length: 100 }, (_, i) => ({
        first: -37900 + i * 10,
        second: -8300 + i * 10,
        memo: `地点-${i}`,
      }));
      const start = performance.now();
      const added = api.addMarkers({
        type: 'XY',
        geodeticSystem: 'JGD2011',
        zoneNo: 9,
        points,
        iconColor: 'red',
        lineColor: 'blue',
      });
      const elapsedMs = performance.now() - start;
      const countAfterAdd = api.getMarkers().length;
      const cleared = api.clearMarkers();
      const countAfterClear = api.getMarkers().length;
      return { invalid, addedOk: added.ok, elapsedMs, countAfterAdd, cleared, countAfterClear };
    });

    expect(result.invalid.ok).toBe(false);
    expect(result.addedOk).toBe(true);
    expect(result.countAfterAdd).toBe(100);
    expect(result.elapsedMs).toBeLessThan(300);
    expect(result.cleared).toEqual({ clearedMarkers: 100, clearedLines: 99 });
    expect(result.countAfterClear).toBe(0);
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
    await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(0);

    expect(diagnostics.consoleErrors).toEqual([]);
    expect(diagnostics.pageErrors).toEqual([]);
    expect(diagnostics.blockedExternalRequests).toEqual([]);
  });
});
