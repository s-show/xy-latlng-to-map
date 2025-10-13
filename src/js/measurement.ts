import { map, measureLocations, measureMarkers } from './map';
import 'leaflet-arrowheads';
import { spheroid } from 'geo4326';
import L from 'leaflet'

/**
 * 2点間の距離計測処理。マップへの書き込みも行う。
 * @param {string} referrer 呼び出し元を区別するための引数
 */
export function measureLength(referrer: string) {
  let measureStart = null;
  let measureEnd = null;
  if (referrer == 'marker' || referrer == 'circle') {
    measureStart = measureMarkers.start;
    measureEnd = measureMarkers.end;
  } else {
    measureStart = measureLocations.start;
    measureEnd = measureLocations.end;
  }
  if (measureStart == null || measureEnd == null) {
    return false
  }
  const startLatLng = L.latLng(Number(measureStart.lat), Number(measureStart.lng));
  const endLatLng = L.latLng(Number(measureEnd.lat), Number(measureEnd.lng));
  const polyline = L.polyline(
    [
      [startLatLng.lat, startLatLng.lng],
      [endLatLng.lat, endLatLng.lng],
    ],
    {
      renderer: L.svg(),
      weight: 4,
      color: '#696969',
      attribution: 'measurementPolyline',
    }
  );
  polyline.arrowheads({
    yawn: 45,
    size: '25px',
  });
  polyline.addTo(map);
  const polylineTooltip = L.tooltip(
    polyline.getCenter(),
    {
      content:
        '距離: ' +
        Math.round(
          spheroid.distance([
            [startLatLng.lng, startLatLng.lat],
            [endLatLng.lng, endLatLng.lat],
          ])
        ) +
        'm',
      direction: 'center',
      permanent: true,
      attribution: 'measurementTooltip',
    } as L.TooltipOptions & { attribution: string }
  );
  polyline.bindTooltip(polylineTooltip);
  measureMarkers.start = null;
  measureMarkers.end = null;
  measureLocations.start = null;
  measureLocations.end = null;
}
