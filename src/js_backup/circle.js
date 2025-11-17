import { map } from './map';
import { measureMarkers } from './map';
import { measureLength } from './measurement';
import { centerMarkers } from './leaflet';
import 'leaflet-contextmenu';
import { spheroid } from 'geo4326';
import { isNearlyEqual } from './nearlyEqual';

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

export function addCircle(latlng, radius, lineColor, markerColor) {
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
  const tooltipOption = {
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

function removeCircle(e) {
  // 引数の `e` に `leaflet.id` は含まれていないため、引数からクリックされた円を判別することはできない。
  // そのため、クリックした場所が削除したい円の内側に含まれるか判定する関数を自作している。

  // 円の中心点マーカー、ツールチップおよび距離測定の polyline などの削除で使う円の緯度経度
  // （中心点のアイコンの緯度経度は円の中心の緯度経度と同じ）
  let circleCenter = null;
  map.eachLayer((layer) => {
    const attribution = layer.options.attribution;
    // 円の削除
    if (attribution == 'circle' && isInnerCircle(e, layer)) {
      circleCenter = layer._latlng;
      layer.remove();
    }
    // 円の中心点 marker の削除
    if (attribution == 'centerMarker' && circleCenter != null) {
      if (layer._latlng.lat == circleCenter.lat && layer._latlng.lng == circleCenter.lng) {
        layer.remove();
      }
    }
    // 円の半径を示す tooltip の削除
    if (attribution == 'circleTooltip' && circleCenter != null) {
      if (layer._latlng.lat == circleCenter.lat && layer._latlng.lng == circleCenter.lng) {
        layer.remove();
      }
    }
    // 距離計測で描画した polyline の削除
    if (
      (attribution == 'measurementPolyline' || attribution == 'measurementPolyline') &&
      circleCenter != null
    ) {
      layer._latlngs.forEach((latlng) => {
        console.info(layer.getLatLngs()[0].lat)
        if (
          isNearlyEqual(latlng.lat, circleCenter.lat) &&
          isNearlyEqual(latlng.lng, circleCenter.lng)
        ) {
          layer.remove();
        }
      });
    }
  });
}

// 円の中心点からの距離を計測する処理
function measureFromThisCircle(e) {
  map.eachLayer((layer) => {
    if (layer.options.attribution == 'circle' && isInnerCircle(e, layer)) {
      measureMarkers.start = layer._latlng;
    }
  });
  if (measureMarkers.end != null) {
    measureLength('circle');
  }
}
function measureToThisCircle(e) {
  map.eachLayer((layer) => {
    if (layer.options.attribution == 'circle' && isInnerCircle(e, layer)) {
      measureMarkers.end = layer._latlng;
    }
  });
  if (measureMarkers.start != null) {
    measureLength('circle');
  }
}

/**
 * 円の内側をクリックしたか否かを返す関数
 * @param {object} e クリックした地点に関する情報
 * @param {object} layer レイヤーに関する情報
 * @return {boolean} 円の内側をクリックしていれば true、外側なら false
 */
function isInnerCircle(e, layer) {
  const distanceLatLngs = spheroid.distance([
    [e.latlng.lng, e.latlng.lat],
    [layer._latlng.lng, layer._latlng.lat],
  ]);
  return distanceLatLngs <= layer._mRadius ? true : false;
}
