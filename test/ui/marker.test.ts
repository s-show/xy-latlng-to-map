import { jest } from '@jest/globals';
import L from 'leaflet';
import { addMarkerGroups, createMarker } from '../../src/js/marker.js';
import { createMeasurementState } from '../../src/js/measurement.js';
import { createMarkerIcons } from '../../src/js/mapIcons.js';

function createTestMap(): { map: L.Map; container: HTMLDivElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const map = L.map(container).setView([35.658, 139.745], 15);
  return { map, container };
}

describe('marker module (decoupled)', () => {
  const icons = createMarkerIcons((name, ext) => `/assets/${name}.${ext}`).markers;
  let map: L.Map;
  let container: HTMLDivElement;

  beforeEach(() => {
    ({ map, container } = createTestMap());
  });

  afterEach(() => {
    map.remove();
    container.remove();
  });

  test('createMarker はタイトルの HTML をテキストノードとして安全にポップアップへ設定する', () => {
    const measurementState = createMeasurementState();
    const payload = '<img src=x onerror=alert(1)>テストメモ';
    const marker = createMarker(35.658, 139.745, 'red', {
      map,
      measurementState,
      icons,
      title: payload,
    }).addTo(map);

    const content = marker.getPopup()?.getContent();
    expect(content).toBeInstanceOf(HTMLElement);
    const el = content as HTMLElement;
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toBe(payload);
  });

  test('addMarkerGroups はグループ内だけを線で結び、fitBounds: false で余計なビュー移動をしない', () => {
    const measurementState = createMeasurementState();
    const fitBoundsSpy = jest.spyOn(map, 'fitBounds');

    const result = addMarkerGroups(
      map,
      [
        [
          [35.6585, 139.7454, 'A'],
          [35.6575, 139.7482, 'B'],
        ],
        [[35.6547, 139.7477, 'C']],
      ],
      { iconColor: 'blue', lineColor: '#ff4500' },
      { measurementState, icons, fitBounds: false },
    );

    expect(result.markers).toHaveLength(3);
    expect(result.polylines).toHaveLength(1);
    expect(fitBoundsSpy).not.toHaveBeenCalled();
    expect(map.hasLayer(result.markers[0])).toBe(true);
    expect(map.hasLayer(result.polylines[0])).toBe(true);
  });

  test('IconColor マーカーは右クリックメニューに不動産情報ライブラリの情報表示を持ち、length/photo には出さない', () => {
    const measurementState = createMeasurementState();
    const onShowReinfolibInfo = jest.fn();

    const iconMarker = createMarker(35.6581, 139.7414, 'red', {
      map,
      measurementState,
      icons,
      onShowReinfolibInfo,
    }).addTo(map);
    const lengthMarker = createMarker(35.6581, 139.7414, 'length', {
      map,
      measurementState,
      icons,
      onShowReinfolibInfo,
    }).addTo(map);
    const photoMarker = createMarker(35.6581, 139.7414, 'photo', {
      map,
      measurementState,
      icons,
      onShowReinfolibInfo,
    }).addTo(map);

    type MenuItem = { text: string; callback: (e: { relatedTarget?: L.Layer }) => void };
    const getItems = (m: L.Marker): MenuItem[] =>
      ((m.options as unknown as { contextmenuItems?: MenuItem[] }).contextmenuItems ?? []);

    const reinfolibItem = getItems(iconMarker).find(
      (item) => item.text === '不動産情報ライブラリの情報を表示',
    );
    expect(reinfolibItem).toBeDefined();
    reinfolibItem!.callback({ relatedTarget: iconMarker });
    expect(onShowReinfolibInfo).toHaveBeenCalledTimes(1);
    const calledLatLng = onShowReinfolibInfo.mock.calls[0][0] as L.LatLng;
    expect(calledLatLng.lat).toBeCloseTo(35.6581, 6);
    expect(calledLatLng.lng).toBeCloseTo(139.7414, 6);

    expect(
      getItems(lengthMarker).some((item) => item.text === '不動産情報ライブラリの情報を表示'),
    ).toBe(false);
    expect(
      getItems(photoMarker).some((item) => item.text === '不動産情報ライブラリの情報を表示'),
    ).toBe(false);
  });
});
