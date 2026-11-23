import { measureLength } from './measurement.js';
import type { MeasurementState } from './measurement.js';
import { centerMarkers as defaultCenterMarkers } from './mapIcons.js';
import type { CenterMarkerIconSet } from './mapIcons.js';
import { isIconColor } from './colors.js';
import 'leaflet-contextmenu';
import { spheroid } from 'geo4326';
import { isNearlyEqual } from './nearlyEqual.js';
import L, { Direction, LatLng } from 'leaflet';
import { ContextMenuEvent } from './interface.js';
import { hasLatLng, hasLatLngs } from './util.js';

export interface CircleDeps {
  readonly map: L.Map;
  readonly measurementState: MeasurementState;
  readonly icons?: CenterMarkerIconSet;
}

/**
 * 指定地点が円の中心から半径（m）以内にあるかを判定する純粋関数。
 */
export function isPointInsideCircle(
  point: { readonly lat: number; readonly lng: number },
  center: { readonly lat: number; readonly lng: number },
  radiusMeters: number,
): boolean {
  const distanceMeters = spheroid.distance([
    [point.lng, point.lat],
    [center.lng, center.lat],
  ]);
  return distanceMeters <= radiusMeters;
}

function isInnerCircle(e: ContextMenuEvent, layer: L.Layer): boolean {
  if (!('getRadius' in layer && typeof layer.getRadius === 'function')) {
    return false;
  }
  const circle = layer as L.Circle;
  return isPointInsideCircle(e.latlng, circle.getLatLng(), circle.getRadius());
}

function removeCircle(e: ContextMenuEvent, map: L.Map): void {
  // 引数の `e` に `leaflet.id` は含まれていないため、クリックした場所が
  // 削除したい円の内側に含まれるかで対象を判別する。
  let circleCenter: L.LatLng | null = null;
  map.eachLayer((layer) => {
    const attribution = layer.options.attribution;
    if (attribution === 'circle' && isInnerCircle(e, layer) && hasLatLng(layer)) {
      circleCenter = layer.getLatLng();
      layer.remove();
    }
    if (attribution === 'centerMarker' && circleCenter !== null && hasLatLng(layer)) {
      if (layer.getLatLng().lat === circleCenter.lat && layer.getLatLng().lng === circleCenter.lng) {
        layer.remove();
      }
    }
    if (attribution === 'circleTooltip' && circleCenter !== null && hasLatLng(layer)) {
      if (layer.getLatLng().lat === circleCenter.lat && layer.getLatLng().lng === circleCenter.lng) {
        layer.remove();
      }
    }
    if (attribution === 'measurementPolyline' && circleCenter !== null && hasLatLngs(layer)) {
      const center = circleCenter;
      const latlngs: L.LatLng[] = layer.getLatLngs() as L.LatLng[];
      latlngs.forEach((latlng) => {
        if (isNearlyEqual(latlng.lat, center.lat) && isNearlyEqual(latlng.lng, center.lng)) {
          layer.remove();
        }
      });
    }
  });
}

function measureFromThisCircle(e: ContextMenuEvent, map: L.Map, measurementState: MeasurementState): void {
  map.eachLayer((layer) => {
    if (hasLatLng(layer) && layer.options.attribution === 'circle' && isInnerCircle(e, layer)) {
      measurementState.markers.start = layer.getLatLng();
    }
  });
  if (measurementState.markers.end !== null) {
    measureLength(map, measurementState, 'circle');
  }
}

function measureToThisCircle(e: ContextMenuEvent, map: L.Map, measurementState: MeasurementState): void {
  map.eachLayer((layer) => {
    if (hasLatLng(layer) && layer.options.attribution === 'circle' && isInnerCircle(e, layer)) {
      measurementState.markers.end = layer.getLatLng();
    }
  });
  if (measurementState.markers.start !== null) {
    measureLength(map, measurementState, 'circle');
  }
}

/**
 * 型の情報は leaflet-contextmenu/README.md の
 * All Options -> Menu Item Options -> callback 参照
 */
export function addCircle(
  latlng: LatLng,
  radius: number,
  lineColor: string,
  markerColor: string,
  deps: CircleDeps,
) {
  const validColor = isIconColor(markerColor) ? markerColor : 'red';
  const icons = deps.icons ?? defaultCenterMarkers;
  const circleMenuItems = [
    {
      text: '円を削除',
      callback: (e: ContextMenuEvent) => removeCircle(e, deps.map),
    },
    {
      text: '円の中心からの距離を計測',
      callback: (e: ContextMenuEvent) => measureFromThisCircle(e, deps.map, deps.measurementState),
    },
    {
      text: '円の中心までの距離を計測',
      callback: (e: ContextMenuEvent) => measureToThisCircle(e, deps.map, deps.measurementState),
    },
  ];

  const circleOption = {
    radius,
    color: lineColor,
    opacity: 1.0,
    fill: true,
    fillOpacity: 0.05,
    attribution: 'circle',
    contextmenu: true,
    contextmenuInheritItems: false,
    contextmenuItems: circleMenuItems,
  };
  const centerMarkerOption = {
    icon: icons[validColor],
    attribution: 'centerMarker',
    contextmenu: true,
    contextmenuInheritItems: false,
    contextmenuItems: circleMenuItems,
  };
  interface TooltipOption {
    offset: L.Point;
    direction: Direction;
    permanent: boolean;
    content: string;
    className: string;
    attribution: string;
    opacity: number;
  }
  const tooltipOption: TooltipOption = {
    offset: L.point(0, 1),
    direction: 'bottom',
    permanent: true,
    content: `半径: ${radius}m`,
    className: 'tooltip-visual',
    attribution: 'circleTooltip',
    opacity: 1.0,
  };

  return {
    circle: L.circle(latlng, circleOption),
    marker: L.marker(latlng, centerMarkerOption),
    tooltip: L.tooltip(latlng, tooltipOption),
  };
}
