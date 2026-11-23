import 'leaflet-arrowheads';
import { spheroid } from 'geo4326';
import L from 'leaflet';

export interface MeasurePoints {
  start: L.LatLng | null;
  end: L.LatLng | null;
}

export interface MeasurementState {
  markers: MeasurePoints;
  locations: MeasurePoints;
}

export type MeasurementReferrer = 'marker' | 'circle' | 'point';

export function createMeasurementState(): MeasurementState {
  return {
    markers: { start: null, end: null },
    locations: { start: null, end: null },
  };
}

export function calculateDistanceMeters(
  start: { readonly lat: number; readonly lng: number },
  end: { readonly lat: number; readonly lng: number },
): number {
  return Math.round(
    spheroid.distance([
      [start.lng, start.lat],
      [end.lng, end.lat],
    ]),
  );
}

/**
 * 2点間の距離計測処理。マップへの書き込みと計測状態のリセットを行う。
 */
export function measureLength(
  map: L.Map,
  state: MeasurementState,
  referrer: MeasurementReferrer,
): L.Polyline | false {
  const points = referrer === 'marker' || referrer === 'circle' ? state.markers : state.locations;
  if (points.start === null || points.end === null) {
    return false;
  }
  const startLatLng = L.latLng(Number(points.start.lat), Number(points.start.lng));
  const endLatLng = L.latLng(Number(points.end.lat), Number(points.end.lng));
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
    },
  );
  polyline.arrowheads({
    yawn: 45,
    size: '25px',
  });
  polyline.addTo(map);
  const distanceMeters = calculateDistanceMeters(startLatLng, endLatLng);
  const polylineTooltip = L.tooltip(
    polyline.getCenter(),
    {
      content: `距離: ${distanceMeters}m`,
      direction: 'center',
      permanent: true,
      attribution: 'measurementTooltip',
    } as L.TooltipOptions & { attribution: string },
  );
  polyline.bindTooltip(polylineTooltip);
  state.markers.start = null;
  state.markers.end = null;
  state.locations.start = null;
  state.locations.end = null;
  return polyline;
}
