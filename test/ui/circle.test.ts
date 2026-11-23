import L from 'leaflet';
import { addCircle, isPointInsideCircle } from '../../src/js/circle.js';
import { createMeasurementState } from '../../src/js/measurement.js';
import { createMarkerIcons } from '../../src/js/mapIcons.js';

describe('circle module (decoupled)', () => {
  const icons = createMarkerIcons((name, ext) => `/assets/${name}.${ext}`).centerMarkers;

  test('isPointInsideCircle は中心から半径以内の点を true、外側の点を false と判定する', () => {
    const center = { lat: 35.658099, lng: 139.741357 };
    const inside = { lat: 35.6585, lng: 139.741357 }; // 約 45m
    const outside = { lat: 35.67, lng: 139.741357 }; // 約 1320m

    expect(isPointInsideCircle(inside, center, 500)).toBe(true);
    expect(isPointInsideCircle(outside, center, 500)).toBe(false);
  });

  test('addCircle は円・中心マーカー・半径ツールチップを生成し、無効な色は赤にフォールバックする', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const map = L.map(container).setView([35.658, 139.741], 15);
    try {
      const measurementState = createMeasurementState();
      const { circle, marker, tooltip } = addCircle(
        L.latLng(35.658, 139.741),
        500,
        '#ff4500',
        'invalid-color',
        { map, measurementState, icons },
      );

      expect(circle.getRadius()).toBe(500);
      expect(marker.options.icon).toBe(icons.red);
      expect(tooltip.getContent()).toBe('半径: 500m');
    } finally {
      map.remove();
      container.remove();
    }
  });
});
