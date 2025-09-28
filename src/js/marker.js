import { markers } from './leaflet.js';
import { map, measureMarkers } from './map.js';
import { measureLength } from './measurement.js';
import 'leaflet-contextmenu';
import { isNearlyEqual } from './nearlyEqual.js';

// 選択したアイコンを削除する処理
function removeSelectedMarker(e) {
  const selectedMarkerId = e.relatedTarget._leaflet_id;
  let markerLatlng = null;
  map.eachLayer((layer) => {
    if (layer._leaflet_id == selectedMarkerId) {
      // これから削除するアイコンにかかる距離計測で描画した
      // Polyline の緯度経度は削除するアイコンと同じため、
      // Polyline を削除するために緯度経度情報を控えておく。
      markerLatlng = layer._latlng;
      layer.remove();
      if (layer._latlng == measureMarkers.start) {
        measureMarkers.start = null;
      } else if (layer._latlng == measureMarkers.end) {
        measureMarkers.end = null;
      }
    }
  });
  map.eachLayer((layer) => {
    const attribution = layer.options.attribution;
    if (
      (attribution == 'markerPolyline' || attribution == 'measurementPolyline') &&
      markerLatlng != null
    ) {
      layer._latlngs.forEach((latlng) => {
        // Leaflet.Arc は polyline を描画する際、与えられた緯度経度とわずかに違う緯度経度に変換して描画することがある。
        // そのため、2つの地点の緯度経度がほぼ同じであれば等しいと判定する関数 isNearyEqual を自作している。
        if (
          isNearlyEqual(latlng.lat, markerLatlng.lat) &&
          isNearlyEqual(latlng.lng, markerLatlng.lng)
        ) {
          layer.remove();
        }
      });
    }
  });
}

// アイコン同士の距離計測の準備
function measureFromThisMarker(e) {
  // 選択したアイコンを判別するために `leaflet_id` を取得
  const startMarkerId = e.relatedTarget._leaflet_id;
  map.eachLayer((layer) => {
    if (layer._leaflet_id == startMarkerId) {
      measureMarkers.start = layer._latlng;
    }
  });
  if (measureMarkers.end != null) {
    measureLength('marker');
  }
}
function measureToThisMarker(e) {
  const endMarkerId = e.relatedTarget._leaflet_id;
  map.eachLayer((layer) => {
    if (layer._leaflet_id == endMarkerId) {
      measureMarkers.end = layer._latlng;
    }
  });
  if (measureMarkers.start != null) {
    measureLength('marker');
  }
}

export function createMarker(lat, lng, color) {
  const marker = L.marker([lat, lng], {
    icon: markers[color],
    attribution: 'marker',
    contextmenu: true,
    contextmenuInheritItems: false,
    contextmenuItems: [
      {
        text: 'アイコンを削除',
        callback: removeSelectedMarker,
      },
      {
        text: 'このアイコンからの距離を計測',
        callback: measureFromThisMarker,
      },
      {
        text: 'このアイコンまでの距離を計測',
        callback: measureToThisMarker,
      },
    ],
  });
  return marker;
}
