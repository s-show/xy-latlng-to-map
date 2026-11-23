import { jest } from '@jest/globals';
import L from 'leaflet';
import { addPhotoPoint } from '../../src/js/importPhoto.js';
import { createMeasurementState } from '../../src/js/measurement.js';
import { createMarkerIcons } from '../../src/js/mapIcons.js';

describe('addPhotoPoint (decoupled)', () => {
  const icons = createMarkerIcons((name, ext) => `/assets/${name}.${ext}`).markers;

  test('GPS 付き画像はマーカー追加し、GPS 無し画像は通知メッセージへまとめる', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const map = L.map(container).setView([35.658, 139.741], 15);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const notified: string[] = [];

    try {
      const gpsFile = new File(['dummy'], 'with-gps.jpg', { type: 'image/jpeg' });
      const noGpsFile = new File(['dummy'], 'no-gps.jpg', { type: 'image/jpeg' });
      const result = await addPhotoPoint(map, [gpsFile, noGpsFile], {
        measurementState: createMeasurementState(),
        icons,
        parseExif: async (file) =>
          file.name === 'with-gps.jpg' ? { latitude: 35.6585, longitude: 139.7454 } : undefined,
        notify: (message) => {
          notified.push(message);
        },
      });

      expect(result.addedCount).toBe(1);
      expect(result.noGpsFiles).toEqual(['no-gps.jpg']);
      expect(notified).toHaveLength(1);
      expect(notified[0]).toContain('no-gps.jpg');
    } finally {
      errorSpy.mockRestore();
      map.remove();
      container.remove();
    }
  });
});
