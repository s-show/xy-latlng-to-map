import { markers as defaultMarkers } from './mapIcons.js';
import type { MarkerIconSet } from './mapIcons.js';
import { isIconColor } from './colors.js';
import type { IconColor } from './colors.js';
import { createSafePopupContent } from './markerPopup.js';
import { measureLength } from './measurement.js';
import type { MeasurementState } from './measurement.js';
import 'leaflet-contextmenu';
import { isNearlyEqual } from './nearlyEqual.js';
import L, { Marker, ContextMenuItemClickEvent } from 'leaflet';
import { hasLatLng, hasLatLngs } from './util.js';
import type { ConvertedPoint } from './conversion.js';

export { isIconColor };
export type { IconColor };

export type MarkerColor = IconColor | 'length' | 'photo';

export interface MarkerDeps {
  readonly map: L.Map;
  readonly measurementState: MeasurementState;
  readonly icons?: MarkerIconSet;
  readonly title?: string;
  readonly attribution?: string;
  readonly onRemove?: (marker: L.Marker) => void;
  readonly onShowReinfolibInfo?: (latlng: L.LatLng) => void;
}

function removeSelectedMarker(
  e: ContextMenuItemClickEvent,
  deps: Pick<MarkerDeps, 'map' | 'measurementState' | 'attribution' | 'onRemove'>,
): void {
  const { map, measurementState, attribution: markerAttribution, onRemove } = deps;
  const selectedMarkerId: number = L.stamp(e.relatedTarget);
  let markerLatlng: L.LatLng | null = null;
  let removedMarker: L.Marker | null = null;

  map.eachLayer((layer): void => {
    if (hasLatLng(layer) && L.Util.stamp(layer) === selectedMarkerId) {
      // これから削除するアイコンにかかる距離計測で描画した Polyline を
      // 削除するため、削除前に緯度経度情報を控えておく。
      markerLatlng = layer.getLatLng();
      if (layer instanceof L.Marker) {
        removedMarker = layer;
      }
      layer.remove();
      if (
        measurementState.markers.start !== null &&
        isNearlyEqual(markerLatlng.lat, measurementState.markers.start.lat) &&
        isNearlyEqual(markerLatlng.lng, measurementState.markers.start.lng)
      ) {
        measurementState.markers.start = null;
      }
      if (
        measurementState.markers.end !== null &&
        isNearlyEqual(markerLatlng.lat, measurementState.markers.end.lat) &&
        isNearlyEqual(markerLatlng.lng, measurementState.markers.end.lng)
      ) {
        measurementState.markers.end = null;
      }
    }
  });

  if (removedMarker !== null && onRemove !== undefined) {
    onRemove(removedMarker);
  }

  const removablePolylineAttributions =
    markerAttribution === 'apiMarker'
      ? new Set(['measurementPolyline'])
      : new Set(['markerPolyline', 'measurementPolyline']);

  map.eachLayer((layer): void => {
    const attribution = layer.options.attribution;
    if (
      typeof attribution === 'string' &&
      removablePolylineAttributions.has(attribution) &&
      markerLatlng !== null &&
      hasLatLngs(layer)
    ) {
      const targetLatLng = markerLatlng;
      layer.getLatLngs().forEach((latlng) => {
        const latLng = latlng as L.LatLng;
        // Leaflet.Arc は polyline を描画する際、与えられた緯度経度とわずかに違う緯度経度に変換して描画することがある。
        // そのため、2つの地点の緯度経度がほぼ同じであれば等しいと判定する関数 isNearlyEqual を用いる。
        if (
          isNearlyEqual(latLng.lat, targetLatLng.lat) &&
          isNearlyEqual(latLng.lng, targetLatLng.lng)
        ) {
          layer.remove();
        }
      });
    }
  });
}

function measureFromThisMarker(
  e: ContextMenuItemClickEvent,
  map: L.Map,
  measurementState: MeasurementState,
): void {
  const startMarkerId: number = L.stamp(e.relatedTarget);
  map.eachLayer((layer): void => {
    if (L.Util.stamp(layer) === startMarkerId && hasLatLng(layer)) {
      measurementState.markers.start = layer.getLatLng();
    }
  });
  if (measurementState.markers.end !== null) {
    measureLength(map, measurementState, 'marker');
  }
}

function measureToThisMarker(
  e: ContextMenuItemClickEvent,
  map: L.Map,
  measurementState: MeasurementState,
): void {
  const endMarkerId: number = L.stamp(e.relatedTarget);
  map.eachLayer((layer): void => {
    if (L.Util.stamp(layer) === endMarkerId && hasLatLng(layer)) {
      measurementState.markers.end = layer.getLatLng();
    }
  });
  if (measurementState.markers.start !== null) {
    measureLength(map, measurementState, 'marker');
  }
}

export interface AddMarkerGroupsOptions {
  readonly measurementState: MeasurementState;
  readonly icons?: MarkerIconSet;
  readonly fitBounds?: boolean;
  readonly markerAttribution?: string;
  readonly polylineAttribution?: string;
  readonly onMarkerRemove?: (marker: L.Marker) => void;
  readonly onShowReinfolibInfo?: (latlng: L.LatLng) => void;
}

/**
 * 点のグループごとにアイコンと線を地図へ追加する。
 * 線は同じグループ内の隣り合う点だけを結ぶ。
 * @param groups 世界測地系の緯度経度に変換済みの点。少なくとも1点が必要。
 * @param style iconColor が null ならアイコンを、lineColor が null なら線を追加しない
 */
export function addMarkerGroups(
  map: L.Map,
  groups: readonly (readonly ConvertedPoint[])[],
  style: { readonly iconColor: IconColor | null; readonly lineColor: string | null },
  options: AddMarkerGroupsOptions,
): { readonly markers: L.Marker[]; readonly polylines: L.Polyline[] } {
  const createdMarkers: L.Marker[] = [];
  const createdPolylines: L.Polyline[] = [];
  const polylineAttribution = options.polylineAttribution ?? 'markerPolyline';

  groups.forEach((points) => {
    points.forEach(([lat, lng, memo], index) => {
      if (style.iconColor !== null) {
        const marker = createMarker(lat, lng, style.iconColor, {
          map,
          measurementState: options.measurementState,
          icons: options.icons,
          title: memo,
          attribution: options.markerAttribution,
          onRemove: options.onMarkerRemove,
          onShowReinfolibInfo: options.onShowReinfolibInfo,
        }).addTo(map);
        createdMarkers.push(marker);
      }
      const next = points[index + 1];
      if (style.lineColor !== null && next !== undefined) {
        // Leaflet は座標タプルの3番目を高度として扱うため、memo を除いた [緯度, 経度] だけを渡す
        const polyline = L.polyline([[lat, lng], [next[0], next[1]]], {
          attribution: polylineAttribution,
          color: style.lineColor,
        }).addTo(map);
        createdPolylines.push(polyline);
      }
    });
  });

  if (options.fitBounds !== false) {
    const allPoints = groups.flat().map(([lat, lng]): [number, number] => [lat, lng]);
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints));
    }
  }

  return { markers: createdMarkers, polylines: createdPolylines };
}

/**
 * @param deps.title 指定した場合だけ、クリックで開くポップアップにテキスト専用ノードとして表示する
 */
export function createMarker(
  lat: number,
  lng: number,
  color: MarkerColor,
  deps: MarkerDeps,
): Marker {
  const icons = deps.icons ?? defaultMarkers;
  const attribution = deps.attribution ?? 'marker';
  const onRemoveHandler = (e: ContextMenuItemClickEvent) =>
    removeSelectedMarker(e, {
      map: deps.map,
      measurementState: deps.measurementState,
      attribution,
      onRemove: deps.onRemove,
    });

  if (color !== 'photo') {
    const contextmenuItems = [
      {
        text: 'アイコンを削除',
        callback: onRemoveHandler,
      },
      {
        text: 'このアイコンからの距離を計測',
        callback: (e: ContextMenuItemClickEvent) =>
          measureFromThisMarker(e, deps.map, deps.measurementState),
      },
      {
        text: 'このアイコンまでの距離を計測',
        callback: (e: ContextMenuItemClickEvent) =>
          measureToThisMarker(e, deps.map, deps.measurementState),
      },
    ];
    if (isIconColor(color) && deps.onShowReinfolibInfo !== undefined) {
      const showInfo = deps.onShowReinfolibInfo;
      contextmenuItems.push({
        text: '不動産情報ライブラリの情報を表示',
        callback: (e: ContextMenuItemClickEvent) => {
          const targetLatLng =
            e.relatedTarget !== undefined && hasLatLng(e.relatedTarget)
              ? e.relatedTarget.getLatLng()
              : L.latLng(lat, lng);
          showInfo(targetLatLng);
        },
      });
    }
    const markerOptions = {
      icon: icons[color],
      attribution,
      contextmenu: true,
      contextmenuInheritItems: false,
      contextmenuItems,
    };
    const marker = L.marker([lat, lng], markerOptions);
    return deps.title !== undefined ? marker.bindPopup(createSafePopupContent(deps.title)) : marker;
  }

  const markerOptions = {
    icon: icons[color],
    attribution,
    contextmenu: true,
    contextmenuInheritItems: false,
    contextmenuItems: [
      {
        text: 'アイコンを削除',
        callback: onRemoveHandler,
      },
    ],
  };
  return L.marker([lat, lng], markerOptions);
}
