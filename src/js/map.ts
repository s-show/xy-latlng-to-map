import { gsiStandard, baseMapsWithoutGoogle, getBaseMaps } from './leaflet.js';
import { createMarker, MarkerColor } from './marker.js';
import { measureLength } from './measurement.js';
import 'leaflet-contextmenu';
import L from 'leaflet';
import { ContextMenuEvent } from './interface.js';

/*---------------------------------------------------------
// leaflet のセットアップ
// 初期位置は日本緯度経度原点
// 北緯35度39分29.1572秒, 東経139度44分28.8869秒
---------------------------------------------------------*/
export const map = L.map('map', {
  preferCanvas: true,
  contextmenu: true,
  contextmenuItems: [
    {
      text: '円を追加',
      callback: openRadiusInputDialog,
    },
    {
      text: 'アイコンを追加',
      callback: addMarker,
    },
    {
      text: 'この地点からの距離を計測',
      callback: measureFromThisPoint,
    },
    {
      text: 'この地点までの距離を計測',
      callback: measureToThisPoint,
    },
  ],
}).setView([35.6580992222, 139.7413574722], 15);
// 初期状態では地理院地図のみでレイヤーコントロールを作成
let layersControl = L.control.layers(baseMapsWithoutGoogle).addTo(map);
gsiStandard.addTo(map);

// Google Maps API 読み込み完了後に Google Maps レイヤーを追加
(async () => {
  // APIキー未設定時は index.html で Google Maps の script タグ自体を出力しないため、
  // レイヤーコントロールも地理院地図のみのままにする
  if (!import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) {
    console.info('VITE_GOOGLE_MAPS_API_KEY が未設定のため Google Maps レイヤーは追加しません（地理院地図のみ利用できます）');
    return;
  }
  try {
    const fullBaseMaps = await getBaseMaps();
    // 既存のコントロールを削除して再作成
    layersControl.remove();
    layersControl = L.control.layers(fullBaseMaps).addTo(map);
  } catch (error) {
    console.warn('Google Maps レイヤーの初期化に失敗しました:', error);
  }
})();

// 現在アクティブなベースマップの名前を保持
// export let activeBaseMapName: string = '地理院地図 (標準地図)';

// ベースレイヤー変更時にアクティブレイヤー名を更新
// map.on('baselayerchange', (e: L.LayersControlEvent) => {
//   activeBaseMapName = e.name;
// });

interface MeasurePoints {
  start: L.LatLng | null;
  end: L.LatLng | null;
}
// アイコン同士の距離を測るための変数
export const measureMarkers: MeasurePoints = {
  start: null,
  end: null,
};
// 任意の2点間の距離を測るための変数
export const measureLocations: MeasurePoints = {
  start: null,
  end: null,
};

// 半径を入力するダイアログを表示する処理
function openRadiusInputDialog(e: ContextMenuEvent) {
  const dialog = document.querySelector<HTMLDialogElement>('#input-diameter');
  dialog?.showModal();
  const inputRadius = document.querySelector<HTMLInputElement>('#radius')
  inputRadius?.select();
  const inputLatitude = document.querySelector<HTMLInputElement>('#latitude')
  const inputLongitude = document.querySelector<HTMLInputElement>('#longitude')
  if (inputLatitude && inputLongitude) {
    inputLatitude.value = String(e.latlng.lat);
    inputLongitude.value = String(e.latlng.lng);
  }
  dialog?.addEventListener('click', (e: PointerEvent) => {
    if (e.target instanceof HTMLElement && e.target.id === 'input-diameter') {
      dialog.close();
    }
  });
}

/**
 * 任意の場所にアイコンを追加する処理
 * @param {object} e クリックした場所の緯度経度、ピクセル形式の場所情報、親要素のピクセル形式の場所情報
 */
function addMarker(e: ContextMenuEvent) {
  const selectMarkerIcon = document.querySelector<HTMLSelectElement>('#select-marker-icon');
  if (selectMarkerIcon !== null) {
    const iconColor = selectMarkerIcon.value;
    if (iconColor !== 'none' && iconColor !== null) {
      const marker = createMarker(Number(e.latlng.lat), Number(e.latlng.lng), iconColor as MarkerColor);
      marker.bindTooltip('緯度経度: ' + Number(e.latlng.lat) + '<br />' + e.latlng.lng, {}).openTooltip();
      marker.addTo(map);
    } else {
      window.alert('アイコンの色を選択してください')
    }
  }
}

/**
 * 任意の2点間の距離の計測を開始する処理
 * @param {object} e クリックした場所の緯度経度、ピクセル形式の場所情報、親要素のピクセル形式の場所情報
 */
function measureFromThisPoint(e: ContextMenuEvent) {
  const marker = createMarker(Number(e.latlng.lat), Number(e.latlng.lng), 'length');
  marker.addTo(map);
  measureLocations.start = marker.getLatLng();
  if (measureLocations.end != null) {
    measureLength('point');
  }
}
/**
 * 任意の2点間の距離の計測を終了する処理
 * @param {object} e クリックした場所の緯度経度、ピクセル形式の場所情報、親要素のピクセル形式の場所情報
 */
function measureToThisPoint(e: ContextMenuEvent) {
  const marker = createMarker(Number(e.latlng.lat), Number(e.latlng.lng), 'length');
  marker.addTo(map);
  measureLocations.end = marker.getLatLng();
  if (measureLocations.start != null) {
    measureLength('point');
  }
}
