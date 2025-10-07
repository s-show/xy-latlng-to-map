import { markers } from './leaflet.js';
import { map, measureMarkers } from './map.js';
import { measureLength } from './measurement.js';
import 'leaflet-contextmenu';
import { isNearlyEqual } from './nearlyEqual.js';
import { contextMenuControls } from 'jspreadsheet-ce';
import L from 'leaflet'
import { hasLatLng, hasLatLngs } from './util.js';

// 選択したアイコンを削除する処理
function removeSelectedMarker(e: contextMenuControls) {
  const selectedMarkerId: number = e.relatedTarget._leaflet_id;
  let markerLatlng: L.LatLng;
  map.eachLayer((layer) => {
    if (hasLatLng(layer)) {
      if (L.Util.stamp(layer) == selectedMarkerId) {
        // これから削除するアイコンにかかる距離計測で描画した
        // Polyline の緯度経度は削除するアイコンと同じため、
        // Polyline を削除するために緯度経度情報を控えておく。
        markerLatlng = layer.getLatLng();
        layer.remove();
        if (layer.getLatLng() == measureMarkers.start) {
          measureMarkers.start = null;
        } else if (layer.getLatLng() == measureMarkers.end) {
          measureMarkers.end = null;
        }
      }
    }
  });
  map.eachLayer((layer) => {
    const attribution = layer.options.attribution;
    if (
      (attribution == 'markerPolyline' || attribution == 'measurementPolyline') &&
      markerLatlng != null
    ) {
      if (hasLatLngs(layer)) {
        layer.getLatLngs().forEach((latlng) => {
          const latLng = latlng as L.LatLng
          // Leaflet.Arc は polyline を描画する際、与えられた緯度経度とわずかに違う緯度経度に変換して描画することがある。
          // そのため、2つの地点の緯度経度がほぼ同じであれば等しいと判定する関数 isNearyEqual を自作している。
          if (
            isNearlyEqual(latLng.lat, markerLatlng.lat) &&
            isNearlyEqual(latLng.lng, markerLatlng.lng)
          ) {
            layer.remove();
          }
        });
      }
    }
  });
}

// アイコン同士の距離計測の準備
function measureFromThisMarker(e: contextMenuControls) {
  // 選択したアイコンを判別するために `leaflet_id` を取得
  const startMarkerId: number = e.relatedTarget._leaflet_id;
  map.eachLayer((layer) => {
    if (L.Util.stamp(layer) == startMarkerId) {
      if (hasLatLng(layer)) {
        measureMarkers.start = layer.getLatLng();
      }
    }
  });
  if (measureMarkers.end != null) {
    measureLength('marker');
  }
}
function measureToThisMarker(e: contextMenuControls) {
  const endMarkerId: number = e.relatedTarget._leaflet_id;
  map.eachLayer((layer) => {
    if (L.Util.stamp(layer) == endMarkerId) {
      if (hasLatLng(layer)) {
        measureMarkers.end = layer.getLatLng()
      }
    }
  });
  if (measureMarkers.start != null) {
    measureLength('marker');
  }
}

export function createMarker(
  lat: number,
  lng: number,
  color: 'red' | 'blue' | 'yellow' | 'green'
) {
  const markerOptions = {
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
  };
  return L.marker([lat, lng], markerOptions)
}
