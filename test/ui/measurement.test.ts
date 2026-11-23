import L from 'leaflet';
import {
  calculateDistanceMeters,
  createMeasurementState,
  measureLength,
} from '../../src/js/measurement.js';

describe('measurement module (decoupled)', () => {
  test('calculateDistanceMeters は東京タワー付近と東京駅付近の概算距離（約 2.9km）を返す', () => {
    const distance = calculateDistanceMeters(
      { lat: 35.65858, lng: 139.745433 },
      { lat: 35.681236, lng: 139.767125 },
    );
    expect(distance).toBeGreaterThan(2900);
    expect(distance).toBeLessThan(3400);
  });

  test('measureLength は始点終点が揃うと線と距離ツールチップを描画し、計測状態をリセットする', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const map = L.map(container).setView([35.66, 139.75], 15);
    try {
      const state = createMeasurementState();
      expect(measureLength(map, state, 'point')).toBe(false);

      state.locations.start = L.latLng(35.65858, 139.745433);
      state.locations.end = L.latLng(35.681236, 139.767125);

      const polyline = measureLength(map, state, 'point');
      expect(polyline).toBeInstanceOf(L.Polyline);
      expect(map.hasLayer(polyline as L.Polyline)).toBe(true);
      expect(state.locations.start).toBeNull();
      expect(state.locations.end).toBeNull();
    } finally {
      map.remove();
      container.remove();
    }
  });
});
