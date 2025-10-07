import { gsiStandard, baseMaps, markers, centerMarkers, lengthIcons } from './leaflet.js';
import { createMarker } from './marker.js';
import { measureLength } from './measurement.js';
import 'leaflet-contextmenu';
import L from 'leaflet';
import { ContextMenuEvent } from './interface.js';

/*---------------------------------------------------------
// leaflet のセットアップ
// 初期位置は日本緯度経度原点
// 北緯35度39分29.1572秒, 東経139度44分28.8869秒
---------------------------------------------------------*/
export let map = L.map('map', {
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
L.control.layers(baseMaps).addTo(map);
gsiStandard.addTo(map);

interface MeasurePoints {
  start: L.LatLng | null;
  end: L.LatLng | null;
}
// アイコン同士の距離を測るための変数
export let measureMarkers: MeasurePoints = {
  start: null,
  end: null,
};
// 任意の2点間の距離を測るための変数
export let measureLocations: MeasurePoints = {
  start: null,
  end: null,
};

// 半径を入力するダイアログを表示する処理
function openRadiusInputDialog(e: ContextMenuEvent) {
  const dialog = document.querySelector<HTMLDialogElement>('#inputDiameter');
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
    if (e.target instanceof HTMLElement && e.target.id === 'inputDiameter') {
      dialog.close();
    }
  });
}

/**
 * 任意の場所にアイコンを追加する処理
 * @param {object} e クリックした場所の緯度経度、ピクセル形式の場所情報、親要素のピクセル形式の場所情報
 */
function addMarker(e: ContextMenuEvent) {
  const iconColor = document.querySelector<HTMLSelectElement>('#selectMarkerIcon')?.value;
  if (iconColor != 'none') {
    const marker = createMarker(Number(e.latlng.lat), Number(e.latlng.lng), iconColor);
    marker.bindTooltip('緯度経度: ' + Number(e.latlng.lat) + ', ' + e.latlng.lng, {}).openTooltip();
    marker.addTo(map);
  } else {
    window.alert('アイコンの色を選択してください')
  }
}

/**
 * 任意の2点間の距離の計測を開始する処理
 * @param {object} e クリックした場所の緯度経度、ピクセル形式の場所情報、親要素のピクセル形式の場所情報
 */
function measureFromThisPoint(e: ContextMenuEvent) {
  const marker = createMarker(Number(e.latlng.lat), Number(e.latlng.lng), 'length');
  marker.addTo(map);
  measureLocations.start = marker._latlng;
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
  measureLocations.end = marker._latlng;
  if (measureLocations.start != null) {
    measureLength('point');
  }
}
