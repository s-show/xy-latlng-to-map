import { markers } from './leaflet.js';
import { map, measureMarkers } from './map.js';
import { measureLength } from './measurement.js';
import 'leaflet-contextmenu';
import { isNearlyEqual } from './nearlyEqual.js';
import L, { Marker, ContextMenuItemClickEvent } from 'leaflet'
import { hasLatLng, hasLatLngs } from './util.js';
import type { ConvertedPoint } from './conversion.js';

// 選択したアイコンを削除する処理
function removeSelectedMarker(e: ContextMenuItemClickEvent): void {
  const selectedMarkerId: number = L.stamp(e.relatedTarget);
  let markerLatlng: L.LatLng;
  map.eachLayer((layer): void => {
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
  map.eachLayer((layer): void => {
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
function measureFromThisMarker(e: ContextMenuItemClickEvent): void {
  // 選択したアイコンを判別するために `leaflet_id` を取得
  // const startMarkerId: number = e.relatedTarget._leaflet_id;
  const startMarkerId: number = L.stamp(e.relatedTarget)
  map.eachLayer((layer): void => {
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
function measureToThisMarker(e: ContextMenuItemClickEvent): void {
  // const endMarkerId: number = e.relatedTarget._leaflet_id;
  const endMarkerId: number = L.stamp(e.relatedTarget)
  map.eachLayer((layer): void => {
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

const ICON_COLORS = ['red', 'blue', 'yellow', 'green'] as const;
export type IconColor = (typeof ICON_COLORS)[number];
export function isIconColor(value: string): value is IconColor {
  return ICON_COLORS.some((color) => color === value);
}

/**
 * 点のグループごとにアイコンと線を地図へ追加し、全ての点が収まるように地図を移動する。
 * 線は同じグループ内の隣り合う点だけを結ぶ。
 * @param groups 世界測地系の緯度経度に変換済みの点。少なくとも1点が必要。
 * @param style iconColor が null ならアイコンを、lineColor が null なら線を追加しない
 */
export function addMarkerGroups(
  groups: ConvertedPoint[][],
  style: { iconColor: IconColor | null; lineColor: string | null }
): void {
  groups.forEach((points) => {
    points.forEach(([lat, lng, memo], index) => {
      if (style.iconColor !== null) {
        createMarker(lat, lng, memo, style.iconColor).addTo(map);
      }
      const next = points[index + 1];
      if (style.lineColor !== null && next !== undefined) {
        // Leaflet は座標タプルの3番目を高度として扱うため、memo を除いた [緯度, 経度] だけを渡す
        L.polyline([[lat, lng], [next[0], next[1]]], {
          attribution: 'markerPolyline',
          color: style.lineColor,
        }).addTo(map);
      }
    });
  });
  map.fitBounds(L.latLngBounds(groups.flat().map(([lat, lng]): [number, number] => [lat, lng])));
}

export type MarkerColor = IconColor | 'length' | 'photo';
export function createMarker(
  lat: number,
  lng: number,
  title: string,
  color: MarkerColor
): Marker {
  if (color !== 'photo') {
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
    return L.marker([lat, lng], markerOptions).bindPopup(title);
  } else {
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
      ],
    };
    return L.marker([lat, lng], markerOptions)
  }
}
