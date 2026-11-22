import { jest } from '@jest/globals';
import L from 'leaflet';
import type { WorksheetInstance } from 'jspreadsheet-ce';
import { bootstrapApp } from '../../src/js/index.js';
import type { AppTables } from '../../src/js/jspreadsheet.js';
import { createMarkerApiController } from '../../src/js/markerApi.js';
import { createMarkerIcons } from '../../src/js/mapIcons.js';
import { createMeasurementState } from '../../src/js/measurement.js';

function createStubTables(): { tables: AppTables; setDataSpy: jest.Mock } {
  const setDataSpy = jest.fn();
  const createWorksheet = () =>
    ({
      getData: jest.fn(() => [['110.1', '51.1', '']]),
      setData: setDataSpy,
      setWidth: jest.fn(),
      hideIndex: jest.fn(),
      showIndex: jest.fn(),
    }) as unknown as WorksheetInstance;

  return {
    tables: {
      sourceTable: [createWorksheet()],
      convertedTable: [createWorksheet()],
      clearTable: jest.fn(),
      resizeTable: jest.fn(),
      dispose: jest.fn(),
    },
    setDataSpy,
  };
}

const APP_HTML = `
  <div class="map-container"><div id="map"></div></div>
  <div id="source-data-table"></div>
  <div id="converted-data-table"></div>
  <select id="select-marker-icon"><option value="red" selected>赤</option></select>
  <select id="select-line-color"><option value="no" selected>線無し</option></select>
  <button id="add-marker-btn" type="button">追加</button>
  <button id="remove-marker-btn" type="button">全図形を削除</button>
  <div id="error-message-wrap" class="visually-hidden"><p id="error-message"></p></div>
`;

describe('createMarkerApiController', () => {
  const icons = createMarkerIcons((name, ext) => `/assets/${name}.${ext}`).markers;
  let map: L.Map;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    map = L.map(container).setView([35.658, 139.741], 15);
  });

  afterEach(() => {
    map.remove();
    container.remove();
  });

  test('単一点追加は 1 回だけ setView し、getMarkers と clearMarkers が整合し計測状態もリセットする', () => {
    const measurementState = createMeasurementState();
    const setViewSpy = jest.spyOn(map, 'setView');
    const fitBoundsSpy = jest.spyOn(map, 'fitBounds');
    const controller = createMarkerApiController({ map, measurementState, icons });

    const added = controller.publicApi.addMarkers({
      type: 'XY',
      geodeticSystem: 'JGD2011',
      zoneNo: 9,
      points: [{ first: -37875.1959, second: -7958.6436, memo: '-1F <img src=x>' }],
      iconColor: 'blue',
    });

    expect(added.ok).toBe(true);
    if (!added.ok) return;

    expect(added.data.markers).toHaveLength(1);
    expect(added.data.markers[0].id).toBe('api-marker-1');
    expect(added.data.markers[0].color).toBe('blue');
    expect(added.data.markers[0].memo).toBe('-1F <img src=x>');
    expect(added.data.markers[0].lat).toBeCloseTo(35.65858, 4);
    expect(setViewSpy).toHaveBeenCalledTimes(1);
    expect(fitBoundsSpy).not.toHaveBeenCalled();

    measurementState.markers.start = L.latLng(added.data.markers[0].lat, added.data.markers[0].lng);
    expect(controller.publicApi.getMarkers()).toHaveLength(1);

    const cleared = controller.publicApi.clearMarkers();
    expect(cleared).toEqual({ clearedMarkers: 1, clearedLines: 0 });
    expect(controller.publicApi.getMarkers()).toEqual([]);
    expect(measurementState.markers.start).toBeNull();
  });

  test('複数点と線追加は fitBounds を 1 回だけ呼び、clearMarkers でマーカーと線を削除する', () => {
    const measurementState = createMeasurementState();
    const fitBoundsSpy = jest.spyOn(map, 'fitBounds');
    const controller = createMarkerApiController({ map, measurementState, icons });

    const added = controller.publicApi.addMarkers({
      points: [
        { first: 35.65858, second: 139.745433, memo: 'A' },
        { first: 35.65749, second: 139.74824, memo: 'B' },
      ],
      iconColor: 'green',
      lineColor: 'yellow',
    });

    expect(added.ok).toBe(true);
    expect(fitBoundsSpy).toHaveBeenCalledTimes(1);
    expect(controller.publicApi.clearMarkers()).toEqual({ clearedMarkers: 2, clearedLines: 1 });
  });
});

describe('bootstrapApp URL hydration and window.xyLatLngToMap', () => {
  beforeEach(() => {
    document.body.innerHTML = APP_HTML;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('有効な URL クエリでアイコンを追加し、データテーブルを変更せず、全図形削除でレジストリも空にする', () => {
    const { tables, setDataSpy } = createStubTables();
    const app = bootstrapApp({
      search: '?x=-37875.1959&y=-7958.6436&zone=9&geodetic=JGD2011&color=blue&memo=東京タワー',
      createTables: () => tables,
      reinfolibProxyUrl: '',
      googleMapsApiKey: '',
    });

    try {
      expect(window.xyLatLngToMap).toBe(app.markerApi);
      expect(app.markerApi.getMarkers()).toHaveLength(1);
      expect(app.markerApi.getMarkers()[0].source).toBe('url');
      expect(setDataSpy).not.toHaveBeenCalled();
      expect(document.getElementById('error-message-wrap')).toHaveClass('visually-hidden');

      document.getElementById('remove-marker-btn')!.click();
      expect(app.markerApi.getMarkers()).toEqual([]);
    } finally {
      app.dispose();
    }
    expect(window.xyLatLngToMap).toBeUndefined();
  });

  test('不正な URL クエリは描画せず #error-message-wrap へプレーンテキストで理由を表示する', () => {
    const { tables } = createStubTables();
    const app = bootstrapApp({
      search: '?x=-37900&y=-8300',
      createTables: () => tables,
      reinfolibProxyUrl: '',
      googleMapsApiKey: '',
    });

    try {
      expect(app.markerApi.getMarkers()).toEqual([]);
      const wrap = document.getElementById('error-message-wrap')!;
      const msg = document.getElementById('error-message')!;
      expect(wrap).not.toHaveClass('visually-hidden');
      expect(msg.textContent).toContain('zone');
      expect(msg.querySelector('*')).toBeNull();
    } finally {
      app.dispose();
    }
  });
});
