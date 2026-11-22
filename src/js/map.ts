import { gsiStandard, baseMapsWithoutGoogle, getBaseMaps } from './leaflet.js';
import { createMarker, MarkerColor } from './marker.js';
import { createMarkerIcons } from './mapIcons.js';
import type { MapIcons } from './mapIcons.js';
import { createMeasurementState, measureLength } from './measurement.js';
import type { MeasurementState } from './measurement.js';
import { getReinfolibOverlays, createReinfolibInfoHandler } from './reinfolibLayer.js';
import 'leaflet-contextmenu';
import L from 'leaflet';
import { ContextMenuEvent } from './interface.js';

export interface MapContextOptions {
  readonly doc?: Document;
  readonly reinfolibProxyUrl?: string;
  readonly googleMapsApiKey?: string;
  readonly icons?: MapIcons;
  readonly notify?: (message: string) => void;
}

export interface MapContext {
  readonly map: L.Map;
  readonly measurementState: MeasurementState;
  readonly icons: MapIcons;
  dispose(): void;
}

// 初期位置は日本緯度経度原点（北緯35度39分29.1572秒, 東経139度44分28.8869秒）
const DEFAULT_CENTER: [number, number] = [35.6580992222, 139.7413574722];
const DEFAULT_ZOOM = 15;

export function createMapContext(
  container: string | HTMLElement = 'map',
  options: MapContextOptions = {},
): MapContext {
  const doc = options.doc ?? document;
  const icons = options.icons ?? createMarkerIcons();
  const notify = options.notify ?? ((message: string) => window.alert(message));
  const measurementState = createMeasurementState();
  const reinfolibProxyUrl =
    options.reinfolibProxyUrl !== undefined
      ? options.reinfolibProxyUrl
      : import.meta.env?.VITE_REINFOLIB_PROXY_URL;
  const googleMapsApiKey =
    options.googleMapsApiKey !== undefined
      ? options.googleMapsApiKey
      : import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;

  let disposed = false;
  let showReinfolibInfo: (latlng: L.LatLng, marker?: L.Marker) => void = () => {};

  const openRadiusInputDialog = (e: ContextMenuEvent): void => {
    const dialog = doc.querySelector<HTMLDialogElement>('#input-diameter');
    dialog?.showModal();
    const inputRadius = doc.querySelector<HTMLInputElement>('#radius');
    inputRadius?.select();
    const inputLatitude = doc.querySelector<HTMLInputElement>('#latitude');
    const inputLongitude = doc.querySelector<HTMLInputElement>('#longitude');
    if (inputLatitude && inputLongitude) {
      inputLatitude.value = String(e.latlng.lat);
      inputLongitude.value = String(e.latlng.lng);
    }
    dialog?.addEventListener(
      'click',
      (clickEvent: PointerEvent) => {
        if (clickEvent.target instanceof HTMLElement && clickEvent.target.id === 'input-diameter') {
          dialog.close();
        }
      },
      { once: true },
    );
  };

  const addMarkerAtPoint = (e: ContextMenuEvent): void => {
    const selectMarkerIcon = doc.querySelector<HTMLSelectElement>('#select-marker-icon');
    if (selectMarkerIcon === null) {
      return;
    }
    const iconColor = selectMarkerIcon.value;
    if (iconColor !== 'none' && iconColor !== null) {
      const marker = createMarker(Number(e.latlng.lat), Number(e.latlng.lng), iconColor as MarkerColor, {
        map,
        measurementState,
        icons: icons.markers,
      });
      marker.bindTooltip(`緯度経度: ${Number(e.latlng.lat)}<br />${e.latlng.lng}`, {}).openTooltip();
      marker.addTo(map);
    } else {
      notify('アイコンの色を選択してください');
    }
  };

  const showReinfolibInfoAtPoint = (e: ContextMenuEvent): void => {
    const selectMarkerIcon = doc.querySelector<HTMLSelectElement>('#select-marker-icon');
    if (selectMarkerIcon === null) {
      return;
    }
    const iconColor = selectMarkerIcon.value;
    if (iconColor === 'none' || iconColor === null) {
      notify('アイコンの色を選択してください');
      return;
    }
    const marker = createMarker(Number(e.latlng.lat), Number(e.latlng.lng), iconColor as MarkerColor, {
      map,
      measurementState,
      icons: icons.markers,
    });
    marker.addTo(map);
    showReinfolibInfo(e.latlng, marker);
  };

  const measureFromThisPoint = (e: ContextMenuEvent): void => {
    const marker = createMarker(Number(e.latlng.lat), Number(e.latlng.lng), 'length', {
      map,
      measurementState,
      icons: icons.markers,
    });
    marker.addTo(map);
    measurementState.locations.start = marker.getLatLng();
    if (measurementState.locations.end !== null) {
      measureLength(map, measurementState, 'point');
    }
  };

  const measureToThisPoint = (e: ContextMenuEvent): void => {
    const marker = createMarker(Number(e.latlng.lat), Number(e.latlng.lng), 'length', {
      map,
      measurementState,
      icons: icons.markers,
    });
    marker.addTo(map);
    measurementState.locations.end = marker.getLatLng();
    if (measurementState.locations.start !== null) {
      measureLength(map, measurementState, 'point');
    }
  };

  // ベクターレイヤーは Leaflet の SVG レンダラに統一する。
  // Canvas レンダラ（preferCanvas: true）だと Chromium の印刷プレビューで
  // リサイズされた canvas の透明部分が不透明な白として印刷される（Blink 既知不具合 #40788827）。
  const map = L.map(container, {
    contextmenu: true,
    // 住所検索欄を左上に配置するため、ズームコントロールは左下に移動する
    zoomControl: false,
    contextmenuItems: [
      {
        text: '円を追加',
        callback: openRadiusInputDialog,
      },
      {
        text: 'アイコンを追加',
        callback: addMarkerAtPoint,
      },
      {
        text: 'この地点からの距離を計測',
        callback: measureFromThisPoint,
      },
      {
        text: 'この地点までの距離を計測',
        callback: measureToThisPoint,
      },
      {
        text: '不動産情報ライブラリの情報を表示',
        callback: showReinfolibInfoAtPoint,
      },
    ],
  }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  const reinfolibOverlays = getReinfolibOverlays(reinfolibProxyUrl);
  showReinfolibInfo = createReinfolibInfoHandler(map, reinfolibProxyUrl);

  let layersControl = L.control.layers(baseMapsWithoutGoogle, reinfolibOverlays).addTo(map);
  gsiStandard.addTo(map);

  // Google Maps API 読み込み完了後に Google Maps レイヤーを追加
  void (async () => {
    if (!googleMapsApiKey) {
      console.info(
        'VITE_GOOGLE_MAPS_API_KEY が未設定のため Google Maps レイヤーは追加しません（地理院地図のみ利用できます）',
      );
      return;
    }
    try {
      const fullBaseMaps = await getBaseMaps();
      if (disposed) {
        return;
      }
      layersControl.remove();
      layersControl = L.control.layers(fullBaseMaps, reinfolibOverlays).addTo(map);
    } catch (error) {
      console.warn('Google Maps レイヤーの初期化に失敗しました:', error);
    }
  })();

  return {
    map,
    measurementState,
    icons,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      map.remove();
    },
  };
}
