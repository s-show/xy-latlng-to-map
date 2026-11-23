import L from 'leaflet';
import { LINE_COLORS } from './colors.js';
import type { ConvertedPoint } from './conversion.js';
import type { MarkerIconSet } from './mapIcons.js';
import { addMarkerGroups } from './marker.js';
import {
  DEFAULT_SINGLE_POINT_ZOOM,
  parseAddMarkersInput,
  parseMarkerQueryParams,
  resolveMarkerCommand,
} from './markerApiSchema.js';
import type {
  ApiError,
  ApiResult,
  MarkerRecord,
  ResolvedMarkersPlan,
} from './markerApiSchema.js';
import type { MeasurementState } from './measurement.js';
import { isNearlyEqual } from './nearlyEqual.js';

export interface XyLatLngToMapApi {
  addMarkers(input: unknown): ApiResult<{ readonly markers: readonly MarkerRecord[] }>;
  clearMarkers(): { readonly clearedMarkers: number; readonly clearedLines: number };
  getMarkers(): readonly MarkerRecord[];
}

export interface MarkerApiController {
  readonly publicApi: XyLatLngToMapApi;
  applyQueryParams(search: string | URLSearchParams): ApiResult<{ readonly markers: readonly MarkerRecord[] }>;
  clearMarkers(): { readonly clearedMarkers: number; readonly clearedLines: number };
  getMarkers(): readonly MarkerRecord[];
}

export interface MarkerApiDeps {
  readonly map: L.Map;
  readonly measurementState: MeasurementState;
  readonly icons?: MarkerIconSet;
  readonly onShowReinfolibInfo?: (latlng: L.LatLng) => void;
}

export function formatApiErrors(errors: readonly ApiError[]): string {
  return errors.map((error) => `${error.field}: ${error.message}`).join('\n');
}

export function createMarkerApiController(deps: MarkerApiDeps): MarkerApiController {
  const { map, measurementState, icons, onShowReinfolibInfo } = deps;
  const markerEntries = new Map<string, { readonly record: MarkerRecord; readonly marker: L.Marker }>();
  const markerIdByLayer = new WeakMap<L.Marker, string>();
  const apiPolylines = new Set<L.Polyline>();
  let nextMarkerSeq = 1;

  const clearMatchingMeasurementEndpoint = (latlng: L.LatLng): void => {
    if (
      measurementState.markers.start !== null &&
      isNearlyEqual(latlng.lat, measurementState.markers.start.lat) &&
      isNearlyEqual(latlng.lng, measurementState.markers.start.lng)
    ) {
      measurementState.markers.start = null;
    }
    if (
      measurementState.markers.end !== null &&
      isNearlyEqual(latlng.lat, measurementState.markers.end.lat) &&
      isNearlyEqual(latlng.lng, measurementState.markers.end.lng)
    ) {
      measurementState.markers.end = null;
    }
  };

  const handleMarkerRemoved = (removedMarker: L.Marker): void => {
    const id = markerIdByLayer.get(removedMarker);
    if (id !== undefined) {
      markerEntries.delete(id);
      markerIdByLayer.delete(removedMarker);
    }
    const targetLatLng = removedMarker.getLatLng();
    clearMatchingMeasurementEndpoint(targetLatLng);

    for (const polyline of Array.from(apiPolylines)) {
      const latlngs = polyline.getLatLngs() as L.LatLng[];
      const touchesRemoved = latlngs.some(
        (point) =>
          isNearlyEqual(point.lat, targetLatLng.lat) && isNearlyEqual(point.lng, targetLatLng.lng),
      );
      if (touchesRemoved) {
        polyline.remove();
        apiPolylines.delete(polyline);
      }
    }
  };

  const applyPlan = (
    plan: ResolvedMarkersPlan,
    source: 'api' | 'url',
  ): ApiResult<{ readonly markers: readonly MarkerRecord[] }> => {
    const convertedGroups: ConvertedPoint[][] = plan.groups.map((group) =>
      group.map((point): ConvertedPoint => [point.lat, point.lng, point.memo]),
    );
    const lineColorHex = plan.lineColor !== null ? (LINE_COLORS.get(plan.lineColor) ?? null) : null;

    const { markers, polylines } = addMarkerGroups(
      map,
      convertedGroups,
      { iconColor: plan.iconColor, lineColor: lineColorHex },
      {
        measurementState,
        icons,
        fitBounds: false,
        markerAttribution: 'apiMarker',
        polylineAttribution: 'apiMarkerPolyline',
        onMarkerRemove: handleMarkerRemoved,
        onShowReinfolibInfo,
      },
    );

    const flatPoints = plan.groups.flat();
    const addedRecords: MarkerRecord[] = markers.map((marker, index) => {
      const point = flatPoints[index];
      const id = `api-marker-${nextMarkerSeq}`;
      nextMarkerSeq += 1;
      const record: MarkerRecord = {
        id,
        lat: point.lat,
        lng: point.lng,
        color: plan.iconColor,
        memo: point.memo,
        source,
      };
      markerEntries.set(id, { record, marker });
      markerIdByLayer.set(marker, id);
      return { ...record };
    });

    polylines.forEach((polyline) => apiPolylines.add(polyline));

    if (flatPoints.length === 1) {
      const [only] = flatPoints;
      map.setView([only.lat, only.lng], plan.zoom ?? DEFAULT_SINGLE_POINT_ZOOM);
    } else if (flatPoints.length > 1) {
      const bounds = L.latLngBounds(
        flatPoints.map((point): [number, number] => [point.lat, point.lng]),
      );
      if (plan.zoom !== null) {
        map.setView(bounds.getCenter(), plan.zoom);
      } else {
        map.fitBounds(bounds);
      }
    }

    return { ok: true, data: { markers: addedRecords } };
  };

  const addMarkers = (input: unknown): ApiResult<{ readonly markers: readonly MarkerRecord[] }> => {
    const parsed = parseAddMarkersInput(input);
    if (!parsed.ok) {
      return parsed;
    }
    const resolved = resolveMarkerCommand(parsed.data);
    if (!resolved.ok) {
      return resolved;
    }
    return applyPlan(resolved.data, 'api');
  };

  const applyQueryParams = (
    search: string | URLSearchParams,
  ): ApiResult<{ readonly markers: readonly MarkerRecord[] }> => {
    const parsed = parseMarkerQueryParams(search);
    if (!parsed.ok) {
      return parsed;
    }
    const resolved = resolveMarkerCommand(parsed.data);
    if (!resolved.ok) {
      return resolved;
    }
    return applyPlan(resolved.data, 'url');
  };

  const clearMarkers = (): { readonly clearedMarkers: number; readonly clearedLines: number } => {
    const clearedMarkers = markerEntries.size;
    const clearedLines = apiPolylines.size;

    for (const { marker } of markerEntries.values()) {
      clearMatchingMeasurementEndpoint(marker.getLatLng());
      marker.remove();
      markerIdByLayer.delete(marker);
    }
    markerEntries.clear();

    for (const polyline of apiPolylines) {
      polyline.remove();
    }
    apiPolylines.clear();

    return { clearedMarkers, clearedLines };
  };

  const getMarkers = (): readonly MarkerRecord[] =>
    Array.from(markerEntries.values(), ({ record }) => ({ ...record }));

  const publicApi: XyLatLngToMapApi = {
    addMarkers,
    clearMarkers,
    getMarkers,
  };

  return {
    publicApi,
    applyQueryParams,
    clearMarkers,
    getMarkers,
  };
}
