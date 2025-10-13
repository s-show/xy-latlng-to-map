import { map, measureMarkers } from './map';
import { measureLength } from './measurement';
import { centerMarkers } from './leaflet';
import 'leaflet-contextmenu';
import { spheroid } from 'geo4326';
import { isNearlyEqual } from './nearlyEqual';
import L, { Direction, LatLng } from 'leaflet'
import { ContextMenuEvent } from './interface';
import { hasLatLng, hasLatLngs } from './util';

const circleMenuItems = [
  {
    text: '円を削除',
    callback: removeCircle,
  },
  {
    text: '円の中心からの距離を計測',
    callback: measureFromThisCircle,
  },
  {
    text: '円の中心までの距離を計測',
    callback: measureToThisCircle,
  },
];

/**
 * 型の情報は、leaflet-contextmenu/README.md の
 * All Options -> Menu Item Options -> callback 参照
 */

export function addCircle(
  latlng: LatLng,
  radius: number,
  lineColor: string,
  markerColor: 'red' | 'blue' | 'yellow' | 'green'
) {
  const circleOption = {
    radius: radius,
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
    icon: centerMarkers[markerColor],
    attribution: 'centerMarker',
    contextmenu: true,
    contextmenuInheritItems: false,
    contextmenuItems: circleMenuItems,
  };
  interface tooltipOption {
    offset: L.Point,
    direction: Direction,
    permanent: boolean,
    content: string,
    className: string,
    attribution: string,
    opacity: number,
  };
  const tooltipOption: tooltipOption = {
    offset: L.point(0, 1),
    direction: 'bottom',
    permanent: true,
    content: '半径: ' + radius + 'm',
    className: 'tooltipVisual',
    attribution: 'circleTooltip',
    opacity: 1.0,
  };

  return {
    circle: L.circle(latlng, circleOption),
    marker: L.marker(latlng, centerMarkerOption),
    tooltip: L.tooltip(latlng, tooltipOption),
  };
}

function removeCircle(e: ContextMenuEvent) {
  // 引数の `e` に `leaflet.id` は含まれていないため、引数からクリックされた円を判別することはできない。
  // そのため、クリックした場所が削除したい円の内側に含まれるか判定する関数を自作している。

  // 円の中心点マーカー、ツールチップおよび距離測定の polyline などの削除で使う円の緯度経度
  // （中心点のアイコンの緯度経度は円の中心の緯度経度と同じ）
  let circleCenter: L.LatLng
  map.eachLayer((layer) => {
    const attribution = layer.options.attribution;
    // 円の削除
    if (attribution == 'circle' && isInnerCircle(e, layer)) {
      if (hasLatLng(layer)) {
        circleCenter = layer.getLatLng();
        layer.remove();
      }
    }
    // 円の中心点 marker の削除
    if (attribution == 'centerMarker' && circleCenter != null) {
      if (hasLatLng(layer)) {
        if (layer.getLatLng().lat == circleCenter.lat && layer.getLatLng().lng == circleCenter.lng) {
          layer.remove();
        }
      }
    }
    // 円の半径を示す tooltip の削除
    if (attribution == 'circleTooltip' && circleCenter != null) {
      if (hasLatLng(layer)) {
        if (layer.getLatLng().lat == circleCenter.lat && layer.getLatLng().lng == circleCenter.lng) {
          layer.remove();
        }
      }
    }
    // 距離計測で描画した polyline の削除
    if (
      (attribution == 'measurementPolyline' || attribution == 'measurementPolyline') &&
      circleCenter != null
    ) {
      if (hasLatLngs(layer)) {
        // `getLatLngs()` は多次元配列を返す可能性があるが、この状況では
        // 一次元の配列しか返らないはずなので、型アサーションで対処している。
        const latlngs: L.LatLng[] = layer.getLatLngs() as L.LatLng[]
        latlngs.forEach((latlng) => {
          if (
            isNearlyEqual(latlng.lat, circleCenter.lat) &&
            isNearlyEqual(latlng.lng, circleCenter.lng)
          ) {
            layer.remove();
          }
        });
      }
    }
  });
}

// 円の中心点からの距離を計測する処理
function measureFromThisCircle(e: ContextMenuEvent) {
  map.eachLayer((layer) => {
    if (hasLatLng(layer)) {
      if (layer.options.attribution == 'circle' && isInnerCircle(e, layer)) {
        measureMarkers['start'] = layer.getLatLng();
      }
    }
  });
  if (measureMarkers.end != null) {
    measureLength('circle');
  }
}
function measureToThisCircle(e: ContextMenuEvent) {
  map.eachLayer((layer) => {
    if (hasLatLng(layer)) {
      if (layer.options.attribution == 'circle' && isInnerCircle(e, layer)) {
        measureMarkers['end'] = layer.getLatLng();
      }
    }
  });
  if (measureMarkers.start != null) {
    measureLength('circle');
  }
}

/**
 * 円の内側をクリックしたか否かを返す関数
 */
function isInnerCircle(e: ContextMenuEvent, layer: L.Layer): boolean {
  if (!('getRadius' in layer && typeof layer.getRadius === 'function')) {
    return false;
  }
  const circle = layer as L.Circle;
  const distanceLatLngs = spheroid.distance([
    [e.latlng.lng, e.latlng.lat],
    [circle.getLatLng().lng, circle.getLatLng().lat],
  ]);
  return distanceLatLngs <= circle.getRadius();
}
