import L from "leaflet";
import {
  MAP_COORDINATE_SYSTEM,
  parseCoordinateSystem,
  removeInvalidRows,
  convertRows,
  buildCsvHeader,
} from './conversion.js';
import type { Conversion } from './conversion.js';
import { sourceTable, convertedTable, clearTable, resizeTable } from './jspreadsheet.js';
import { exportCSV } from "./exportCSV.js";
import { addMarkerGroups } from './marker.js';
import { DEFAULT_CIRCLE_LINE_COLOR, isIconColor, isLineColorName, LINE_COLORS } from './colors.js';
import { createMapContext } from "./map.js";
import { setupAddressSearch } from './addressSearchUi.js';
import { setupPrint } from './print.js';
import { addCircle } from "./circle.js";
import { addPhotoPoint } from "./importPhoto.js";
import { isImageFile } from "./isImageFile.js";
import { splitDataByBlankRows } from "./splitTableData.js";
import 'bootstrap';
import 'leaflet/dist/leaflet.css';

/*---------------------------------------------------------
// アプリ実装開始
---------------------------------------------------------*/
const { map, measurementState, icons } = createMapContext('map');
// ウィンドウサイズに応じてデータテーブルの大きさを変える
// Offcanvas 化により表はオーバーレイメニュー内にあるため、
// ウィンドウ幅ではなくメニューカラムの実際の表示幅を基準にする。
function getMenuColumnWidth(): number {
  const menuColumn = document.querySelector('#menu-column');
  if (menuColumn instanceof HTMLElement) {
    // offcanvas が非表示でも CSS の幅変数を基準にした値を得る
    return Math.max(menuColumn.offsetWidth, window.innerWidth || 0);
  }
  return window.innerWidth || 0;
}

window.addEventListener('resize', () => {
  resizeTable(getMenuColumnWidth());
})

// 測地系と系番号の説明画面から該当する項目を選択できるようにする処理 
window.addEventListener('load', () => {
  setupDialog();
});

function setupDialog() {
  // 測地系の説明画面の処理
  const geodeticSystemSelectBtn = document.querySelectorAll<HTMLButtonElement>('[data-geodetic-system]')
  const geodeticSystemRadioBtn = document.querySelectorAll<HTMLInputElement>('input[name="source-geodetic-system"]');
  if (geodeticSystemRadioBtn.length > 0) {
    geodeticSystemSelectBtn.forEach((btn) => {
      btn.addEventListener('click', () => {
        geodeticSystemRadioBtn.forEach((radioBtn) => {
          if (btn.getAttribute('data-geodetic-system') == radioBtn.value) {
            radioBtn.checked = true;
          }
        })
        document.querySelector<HTMLDialogElement>('#geodetic-system-dialog')!.close();
      })
    })
  }
  // 系番号の説明画面の処理
  const zoneNoSelectBtn = document.querySelectorAll<HTMLButtonElement>('[data-zone-no-btn]')
  const sourceZoneNo = document.querySelector<HTMLSelectElement>('#source-zone-no');
  if (sourceZoneNo !== null) {
    zoneNoSelectBtn.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (e.currentTarget instanceof HTMLButtonElement) {
          sourceZoneNo.value = String(e.currentTarget.getAttribute('data-zone-no-btn'));
          sourceZoneNo.options[0].disabled = true;
          document.querySelector<HTMLDialogElement>('#zone-no-dialog')!.close();
        }
      })
    })
  }
}

// 変換元・変換先データのXY座標・緯度経度の選択に応じて系番号を変更する
document.querySelectorAll<HTMLInputElement>('[name="source-data-type"]').forEach((selectedBtn) => {
  const sourceZoneNo = document.querySelector<HTMLSelectElement>('#source-zone-no')
  if (sourceZoneNo !== null) {
    changeZoneNo(selectedBtn, sourceZoneNo);
  }
})
document.querySelectorAll<HTMLInputElement>('[name="convert-to-data-type"]').forEach((selectedBtn) => {
  const convertZoneNo = document.querySelector<HTMLSelectElement>('#convert-zone-no')
  if (convertZoneNo !== null) {
    changeZoneNo(selectedBtn, convertZoneNo);
  }
})

function changeZoneNo(selectedBtn: HTMLInputElement, selectMenu: HTMLSelectElement) {
  selectedBtn.addEventListener('input', () => {
    if (selectedBtn.value === 'latlng') {
      selectMenu.options[0].selected = true;
      selectMenu.disabled = true;
    } else {
      selectMenu.disabled = false;
      selectMenu.options[1].selected = true;
      selectMenu.options[0].disabled = true;
    }
  })
}

// 系番号の説明ダイアログ表示処理
const zoneNoDialog = document.querySelector<HTMLDialogElement>('#zone-no-dialog')
if (zoneNoDialog !== null) {
  zoneNoDialog.addEventListener('command', (event) => {
    if (event instanceof CommandEvent && event.command === 'show-modal') {
      const zoneNoSelectBtns = document.querySelectorAll<HTMLButtonElement>('[data-zone-no-btn]')
      const dataType = checkedRadioValue('source-data-type');
      zoneNoSelectBtns.forEach((btn) => {
        if (btn.parentElement !== null) {
          if (dataType == 'XY') {
            btn.parentElement.classList.remove('d-none');
            btn.classList.remove('d-none');
          } else {
            btn.parentElement.classList.add('d-none');
            btn.classList.add('d-none');
          }
        }
      })
    }
  })
}

// データ変換
const dataConvertBtn = document.querySelector<HTMLButtonElement>('#data-convert-btn')
if (dataConvertBtn !== null) {
  dataConvertBtn.addEventListener('click', (e) => {
    const conversion = readConversionForm();
    if (conversion !== null) {
      convertedTable[0].setData(convertRows(conversion, removeInvalidRows(readSourceRows())));
      e.preventDefault();
    }
  })
}

// 変換元データの表のデータクリア
const clearSourceTableBtn = document.querySelector<HTMLButtonElement>('#clear-source-table-btn')
if (clearSourceTableBtn !== null) {
  clearSourceTableBtn.addEventListener('click', (e) => {
    clearTable(e, 'source');
  })
}
// 変換後データの表のデータクリア
const clearConvertedTableBtn = document.querySelector<HTMLButtonElement>('#clear-converted-table-btn')
if (clearConvertedTableBtn !== null) {
  clearConvertedTableBtn.addEventListener('click', (e) => {
    clearTable(e, 'converted');
  })
}

// アイコン一括追加ボタンクリック時の動作
const addMarkerBtn = document.querySelector<HTMLButtonElement>('#add-marker-btn')
if (addMarkerBtn !== null) {
  addMarkerBtn.addEventListener('click', (e) => {
    // 空白行を区切りとしてテーブルをグループに分割し、グループごとに
    // 不正データを除去する。線（ポリライン）はグループ内の点だけを結ぶ。
    const dataGroups = splitDataByBlankRows(readSourceRows())
      .map((group) => removeInvalidRows(group))
      .filter((group) => group.length > 0);
    // 緯度経度テーブルに有効なデータが無い場合 dataGroups.length は 0 になる
    if (dataGroups.length > 0) {
      const conversion = readConversionForm();
      if (conversion !== null) {
        // アイコン追加には緯度経度が必要なため、変換先は地図の座標系に固定している
        const toMap = { source: conversion.source, target: MAP_COORDINATE_SYSTEM };
        const iconColor = document.querySelector<HTMLSelectElement>('#select-marker-icon')!.value;
        addMarkerGroups(
          map,
          dataGroups.map((group) => convertRows(toMap, group)),
          { iconColor: isIconColor(iconColor) ? iconColor : null, lineColor: selectedLineColor() },
          { measurementState, icons: icons.markers },
        );
      }
      e.preventDefault();
    }
  })
}
// アイコン全削除
const removeMarkerBtn = document.querySelector<HTMLButtonElement>('#remove-marker-btn')
if (removeMarkerBtn !== null) {
  removeMarkerBtn.addEventListener('click', (e) => {
    map.eachLayer((layer) => {
      // `layer._url` が定義されているのは地図タイルのみ。
      // `layer._url` が未定義なら任意に追加したアイコンや円と判断できる
      if (!('_url' in layer)) {
        layer.remove();
      }
    })
    e.preventDefault();
  })
}

setupPrint(map);

// 地図引き伸ばし
const zoomRangeInput = document.querySelector<HTMLInputElement>('#zoom-range')
const mapDiv = document.querySelector<HTMLDivElement>('#map')
const zoomRangeValue = document.querySelector<HTMLOutputElement>('#zoom-range-value')
if (zoomRangeInput !== null && mapDiv !== null && zoomRangeValue !== null) {
  zoomRangeInput.addEventListener('input', (e) => {
    if (e.currentTarget instanceof HTMLInputElement) {
      mapDiv.style.transform = "scale(" + e.currentTarget.value + ")";
      zoomRangeValue.value = e.currentTarget.value + 'x';
    }
  })
}

// オーバーレイメニュー(Offcanvas)の開閉に合わせて地図サイズを再計算する (Issue #11)
// Offcanvas は地図の表示サイズを変えないが、開閉後に念のため invalidateSize で
// Leaflet の内部サイズを更新し、表の幅もメニュー幅基準で再調整する。
const menuColumn = document.querySelector('#menu-column');
if (menuColumn !== null) {
  menuColumn.addEventListener('command', (event) => {
    if (event instanceof CommandEvent && (event.command === 'show-popover' || event.command === 'hide-popover')) {
      map.invalidateSize();
      resizeTable(getMenuColumnWidth());
    }
  });
}

// 写真のGPSデータを読み込んで地図に表示する処理
if (mapDiv !== null) {
  mapDiv.addEventListener('dragover', (event) => {
    event.preventDefault();
  })
  mapDiv.addEventListener('drop', (event) => {
    event.preventDefault();
    if (event.dataTransfer !== null) {
      const files = Array.from(event.dataTransfer.files);
      const imageFiles = files.filter(isImageFile);
      const rejectedCount = files.length - imageFiles.length;
      if (rejectedCount > 0) {
        alert(`画像ファイル以外は読み込めません。${rejectedCount}件のファイルを除外しました。`);
      }
      if (imageFiles.length > 0) {
        void addPhotoPoint(map, imageFiles, { measurementState, icons: icons.markers });
      }
    }
  })
}

function checkedRadioValue(name: string): string | null {
  return document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? null;
}

/**
 * 変換元・変換先のフォームを読み取る。
 * @return 未選択の項目や扱えない値がある場合は null
 */
function readConversionForm(): Conversion | null {
  const source = parseCoordinateSystem({
    type: checkedRadioValue('source-data-type'),
    geodeticSystem: checkedRadioValue('source-geodetic-system'),
    zoneNo: document.querySelector<HTMLSelectElement>('#source-zone-no')?.value,
  });
  const target = parseCoordinateSystem({
    type: checkedRadioValue('convert-to-data-type'),
    geodeticSystem: checkedRadioValue('convert-to-geodetic-system'),
    zoneNo: document.querySelector<HTMLSelectElement>('#convert-zone-no')?.value,
  });
  return source !== null && target !== null ? { source, target } : null;
}

// 第4引数の true は、セルの入力値ではなく表示用に加工された値を取得する指定
function readSourceRows() {
  return sourceTable[0].getData(undefined, undefined, undefined, true);
}

/*
 * 円の追加に関連する処理
 */
const addCircleToMap = document.querySelector<HTMLButtonElement>('#add-circle-to-map')
const inputDiameter = document.querySelector<HTMLDialogElement>('#input-diameter')
const latitude = document.querySelector<HTMLInputElement>('#latitude')
const longitude = document.querySelector<HTMLInputElement>('#longitude')
const selectLineColorSelector = document.querySelector<HTMLSelectElement>('#select-line-color')
const circleRadius = document.querySelector<HTMLInputElement>('#radius')
const cancelAddCircle = document.querySelector<HTMLButtonElement>('#cancel-add-circle')
if (
  addCircleToMap !== null &&
  inputDiameter !== null &&
  latitude !== null &&
  longitude !== null &&
  selectLineColorSelector !== null &&
  circleRadius !== null &&
  cancelAddCircle !== null
) {
  // 円の半径を入力するダイアログの「追加」ボタンをクリックしたときの処理
  addCircleToMap.addEventListener('click', (e) => {
    const latlng = L.latLng(Number(latitude.value), Number(longitude.value))
    const lineColor = selectedLineColor() ?? DEFAULT_CIRCLE_LINE_COLOR;
    let markerColor = selectLineColorSelector.value;
    if (markerColor == 'no') {
      markerColor = 'red';
    }
    let radius = 0;
    if (Number(circleRadius.value) >= 0) {
      radius = Number(circleRadius.value);
    }
    const circle = addCircle(latlng, radius, lineColor, markerColor, {
      map,
      measurementState,
      icons: icons.centerMarkers,
    });
    circle.circle.addTo(map);
    circle.marker.addTo(map);
    circle.tooltip.addTo(map);
    circleRadius.value = '0';
    inputDiameter.close();
    e.preventDefault();
  });
  // 円の半径を入力するダイアログの「キャンセル」ボタンをクリックしたときの処理
  cancelAddCircle.addEventListener('click', (e) => {
    inputDiameter.close();
    e.preventDefault();
  });
  // 円の半径を入力するダイアログを閉じる時の処理
  inputDiameter.addEventListener('close', (e) => {
    circleRadius.value = '0';
    e.preventDefault();
  })
}

setupAddressSearch(map);

// 変換前後のデータをCSVでexportする
const exportCSVBtn = document.querySelector<HTMLButtonElement>('#export-csv-btn');
const dataConvertDiv = document.querySelector<HTMLDivElement>('#data-convert-pane')
if (exportCSVBtn !== null) {
  exportCSVBtn.addEventListener('click', () => {
    const conversion = readConversionForm();
    const headerText = conversion !== null ? buildCsvHeader(conversion) : [['', '', '', '']];
    const sourceData = sourceTable[0].getData();
    const convertData = convertedTable[0].getData();
    sourceData.forEach((data, index) => {
      if (data[0] != '') {
        data.push(...convertData[index]);
      }
    })
    sourceData.unshift(...headerText)
    const csvData = exportCSV(sourceData);
    if (csvData instanceof Blob && dataConvertDiv !== null) {
      const objUrl = URL.createObjectURL(csvData);
      const link = document.createElement('a');
      link.setAttribute('href', objUrl);
      link.setAttribute('download', 'data.csv');
      link.textContent = 'Click to Download';

      dataConvertDiv.appendChild(link);
      link.click();
      dataConvertDiv.removeChild(link);
      URL.revokeObjectURL(objUrl);
    }
  })
}

/**
 * @return 「線無し」を選択している場合は null
 */
function selectedLineColor(): string | null {
  const value = document.querySelector<HTMLSelectElement>('#select-line-color')?.value;
  return isLineColorName(value) ? (LINE_COLORS.get(value) ?? null) : null;
}

window.onerror = function myErrorHandler(errorMsg) {
  const errorMessageDiv = document.querySelector<HTMLDivElement>('#error-message')
  if (errorMessageDiv !== null) {
    errorMessageDiv.innerText = String(errorMsg);
  }
  return false;
}
