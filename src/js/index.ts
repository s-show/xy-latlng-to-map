import L, { LatLng, latLng, layerGroup } from "leaflet";
import { geodeticSystems } from './proj4.js';
import type { GeodeticSystemName } from './proj4.js';
import { sourceTable, convertedTable, clearTable, resizeTable } from './jspreadsheet.js';
import { isValidNumber } from './isvalidNumber.js';
import { exportCSV } from "./exportCSV.js";
import { createMarker } from './marker.js';
import { map } from "./map.js";
import { addCircle } from "./circle.js";
import 'bootstrap';
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';
import { CellValue } from "jspreadsheet-ce";

// 印刷モード時に非表示にするラジオボタンのリスト
const noPrintRadioBtn: string[] = [
  'sourceDataType',
  'sourceGeodeticSystem',
  'convertToDataType',
  'convertToGeodeticSystem'
];

/**
 * DOM要素がnullまたはundefinedでないことを確認する型ガード関数
 * @param element - チェックする要素
 * @return 要素が存在する場合true
 */
function isElement<T extends Element>(element: T | null | undefined): element is T {
  return element !== null && element !== undefined;
}

/**
 * NodeListがnullまたはundefinedでなく、要素を含むことを確認する型ガード関数
 * @param nodeList - チェックするNodeList
 * @return NodeListが存在し要素を含む場合true
 */
function isNodeList<T extends Element>(nodeList: NodeListOf<T> | null | undefined): nodeList is NodeListOf<T> {
  return nodeList !== null && nodeList !== undefined && nodeList.length > 0;
}

/*---------------------------------------------------------
// アプリ実装開始
---------------------------------------------------------*/
// ウィンドウサイズに応じてデータテーブルの大きさを変える
window.addEventListener('resize', () => {
  resizeTable(
    Math.max(document.querySelector('.container-fluid')!.clientWidth, window.innerWidth || 0)
  );
})

// 測地系と系番号の説明画面から該当する項目を選択できるようにする処理 
window.addEventListener('load', () => {
  setupDialog();
});

function setupDialog() {
  // 測地系の説明画面の処理
  const geodeticSystemSelectBtn = document.querySelectorAll<HTMLButtonElement>('[data-geodeticSystem]')
  const geodeticSystemRadioBtn = document.querySelectorAll<HTMLInputElement>('input[name="sourceGeodeticSystem"]');
  if (isNodeList(geodeticSystemSelectBtn) && isNodeList(geodeticSystemRadioBtn)) {
    geodeticSystemSelectBtn.forEach((btn) => {
      btn.addEventListener('click', () => {
        geodeticSystemRadioBtn.forEach((radioBtn) => {
          if (btn.getAttribute('data-geodeticSystem') == radioBtn.value) {
            radioBtn.checked = true;
          }
        })
        document.querySelector<HTMLDialogElement>('#geodeticSystemDialog')!.close();
      })
    })
  }
  // 系番号の説明画面の処理
  const zoneNoSelectBtn = document.querySelectorAll<HTMLButtonElement>('[data-zone-no-btn]')
  const sourceZoneNo = document.querySelector<HTMLSelectElement>('#sourceZoneNo');
  if (isNodeList(zoneNoSelectBtn) && isElement(sourceZoneNo)) {
    zoneNoSelectBtn.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (e.currentTarget instanceof HTMLButtonElement) {
          sourceZoneNo.value = String(e.currentTarget.getAttribute('data-zone-no-btn'));
          sourceZoneNo.options[0].disabled = true;
          document.querySelector<HTMLDialogElement>('#zoneNoDialog')!.close();
        }
      })
    })
  }
}

// 変換元・変換先データのXY座標・緯度経度の選択に応じて系番号を変更する
document.querySelectorAll<HTMLInputElement>('[name="sourceDataType"]').forEach((selectedBtn) => {
  const sourceZoneNo = document.querySelector<HTMLSelectElement>('#sourceZoneNo')
  if (isElement(sourceZoneNo)) {
    changeZoneNo(selectedBtn, sourceZoneNo);
  }
})
document.querySelectorAll<HTMLInputElement>('[name="convertDataType"]').forEach((selectedBtn) => {
  const convertZoneNo = document.querySelector<HTMLSelectElement>('#convertZoneNo')
  if (isElement(convertZoneNo)) {
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

// 測地系の説明ダイアログ表示処理
const openGeodeticSystemDialogBtn = document.querySelector<HTMLButtonElement>('#openGeodeticSystemDialog')
const geodeticSystemDialog = document.querySelector<HTMLDialogElement>('#geodeticSystemDialog')
if (openGeodeticSystemDialogBtn !== null) {
  openGeodeticSystemDialogBtn.addEventListener('click', () => {
    if (geodeticSystemDialog !== null) {
      showDialog(geodeticSystemDialog, 'geodeticSystemDialog');
    }
  })
}
// 測地系の説明ダイアログを閉じる処理
const closeGeodeticSystemDialogBtn = document.querySelector<HTMLButtonElement>('#closeGeodeticSystemDialog')
if (closeGeodeticSystemDialogBtn !== null) {
  closeGeodeticSystemDialogBtn.addEventListener('click', () => {
    if (geodeticSystemDialog !== null) {
      geodeticSystemDialog.close();
    }
  })
}
// 系番号の説明ダイアログ表示処理
const openZoneNoDialog = document.querySelector<HTMLButtonElement>('#openZonNoDialog')
const zoneNoDialog = document.querySelector<HTMLDialogElement>('#zoneNoDialog')
if (openZoneNoDialog !== null) {
  openZoneNoDialog.addEventListener('click', () => {
    const zoneNoSelectBtns = document.querySelectorAll<HTMLButtonElement>('[data-zone-no-btn]')
    let dataType = getParams().source.type;
    if (isNodeList(zoneNoSelectBtns)) {
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
      if (zoneNoDialog !== null) {
        showDialog(zoneNoDialog, 'zoneNoDialog');
      }
    }
  })
}
const closeZoneNoDialogBtn = document.querySelector<HTMLButtonElement>('#closeZoneNoDialog')
if (closeZoneNoDialogBtn !== null) {
  closeZoneNoDialogBtn.addEventListener('click', () => {
    if (zoneNoDialog !== null) {
      zoneNoDialog.close();
    }
  })
}
// データテーブルの注意事項ダイアログの表示処理
const openAcceptableDataDialogBtn = document.querySelector<HTMLButtonElement>('#openAcceptableDataDialog')
const acceptableDataDialog = document.querySelector<HTMLDialogElement>('#acceptableDataDialog')
if (openAcceptableDataDialogBtn !== null) {
  openAcceptableDataDialogBtn.addEventListener('click', () => {
    if (acceptableDataDialog !== null) {
      showDialog(acceptableDataDialog, 'acceptableDataDialog');
    }
  })
}
const closeAcceptableDataDialogBtn = document.querySelector<HTMLButtonElement>('#closeAcceptableDataDialog')
if (closeAcceptableDataDialogBtn !== null) {
  closeAcceptableDataDialogBtn.addEventListener('click', () => {
    if (acceptableDataDialog !== null) {
      acceptableDataDialog.close();
    }
  })
}
function showDialog(dialog: HTMLDialogElement, dialogId: string) {
  dialog.showModal();
  dialog.addEventListener('click', () => {
    if (dialog.id === dialogId) {
      dialog.close();
    }
  })
}

// データ変換
const dataConvertBtn = document.querySelector<HTMLButtonElement>('#dataConvertBtn')
if (dataConvertBtn !== null) {
  dataConvertBtn.addEventListener('click', (e) => {
    const params = getParams()
    if (
      params.source.geodeticSystem !== null &&
      params.convert.geodeticSystem !== null &&
      params.source.zoneNo !== null &&
      params.convert.zoneNo !== null
    ) {
      const convertParameter = getEspgCodes(
        params.source.geodeticSystem,
        params.convert.geodeticSystem,
        params.source.zoneNo,
        params.convert.zoneNo
      );
      const sourceData = dataCleansing(
        sourceTable[0].getData(
          undefined,
          undefined,
          undefined,
          true
        )
      );
      convertedTable[0].setData(convertData(convertParameter, sourceData));
      e.preventDefault();
    }
  })
}

// 変換元データの表のデータクリア
const clearSourceTableBtn = document.querySelector<HTMLButtonElement>('#clearSourceTableBtn')
if (clearSourceTableBtn !== null) {
  clearSourceTableBtn.addEventListener('click', (e) => {
    clearTable(e, 'source');
  })
}
// 変換後データの表のデータクリア
const clearConvertedTableBtn = document.querySelector<HTMLButtonElement>('#clearConvertedTableBtn')
if (clearConvertedTableBtn !== null) {
  clearConvertedTableBtn.addEventListener('click', (e) => {
    clearTable(e, 'converted');
  })
}

// アイコン一括追加ボタンクリック時の動作
const addMarkerBtn = document.querySelector<HTMLButtonElement>('#addMarkerBtn')
if (addMarkerBtn !== null) {
  addMarkerBtn.addEventListener('click', (e) => {
    const sourceData = dataCleansing(sourceTable[0].getData(
      undefined,
      undefined,
      undefined,
      true
    ));
    const params = getParams();
    // 緯度経度テーブルに有効なデータが無い場合 sourceData.length は 0 になる
    if (sourceData.length > 0) {
      // アイコン追加には緯度経度が必要なため、変換先パラメータは緯度経度に固定している
      if (
        params.source.geodeticSystem !== null &&
        params.convert.geodeticSystem !== null &&
        params.source.zoneNo !== null &&
        params.convert.zoneNo !== null
      ) {
        const convertParameter = getEspgCodes(
          params.source.geodeticSystem,
          'JGD2011',
          params.source.zoneNo,
          '0'
        );
        const convertedData = convertData(convertParameter, sourceData);
        const iconColor = document.querySelector<HTMLSelectElement>('#selectMarkerIcon')!.value
        const lineColor = selectLineColor(false);

        convertedData.forEach((data, index) => {
          if (iconColor != 'none') {
            createMarker(data[0], data[1], iconColor as 'red' | 'blue' | 'yellow' | 'green').addTo(map);
          }
          if (lineColor != 'no' && convertedData[index + 1] != undefined) {
            L.polyline([convertedData[index], convertedData[index + 1]],
              {
                attribution: 'markerPolyline',
                color: lineColor
              }
            ).addTo(map);
          }
        })
        const southWestPoint = L.latLng([
          convertedData.reduce((x, y) => (x[0] < y[0]) ? x : y)[0],
          convertedData.reduce((x, y) => (x[1] < y[1]) ? x : y)[1],
        ]);
        const northEastPoint = L.latLng([
          convertedData.reduce((x, y) => (x[0] > y[0]) ? x : y)[0],
          convertedData.reduce((x, y) => (x[1] > y[1]) ? x : y)[1],
        ]);
        map.fitBounds(L.latLngBounds(southWestPoint, northEastPoint));
      }
      e.preventDefault();
    }
  })

}
// アイコン全削除
const removeMarkerBtn = document.querySelector<HTMLButtonElement>('#removeMarkerBtn')
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

// 印刷用のスタイル変更処理
// 処理1: 印刷時にデータテーブルの幅を狭くし、印刷終了後に幅を戻す処理
// 処理2: 選択していないラジオボタンを印刷時に非表示にし、印刷終了後に戻す処理。
window.addEventListener("beforeprint", () => {
  preparePrint();
});
window.addEventListener("afterprint", () => {
  afterPrint();
});
// 印刷プレビュー画面の作成
const printPreviewBtn = document.querySelector<HTMLButtonElement>('#printPreviewBtn')
if (printPreviewBtn !== null) {
  printPreviewBtn.addEventListener('input', (e) => {
    if (e.currentTarget instanceof HTMLInputElement) {
      if (e.currentTarget.checked) {
        preparePrint();
      } else {
        afterPrint();
      }
    }
  })
}

// 地図引き伸ばし
const zoomRangeInput = document.querySelector<HTMLInputElement>('#zoomRange')
const mapDiv = document.querySelector<HTMLDivElement>('#map')
const zoomRangeValue = document.querySelector<HTMLOutputElement>('#zoomRange')
if (zoomRangeInput !== null && mapDiv !== null && zoomRangeValue !== null) {
  zoomRangeInput.addEventListener('input', (e) => {
    if (e.currentTarget instanceof HTMLInputElement) {
      mapDiv.style.transform = "scale(" + e.currentTarget.value + ")";
      zoomRangeValue.value = e.currentTarget.value + 'x';
    }
  })
}

/**
 * データタイプの種類
 */
type DataType = 'XY' | 'latlng';

/**
 * データの種類（変換元・変換先）
 */
type DataTypeName = 'source' | 'convert';

/**
 * パラメータの型定義
 */
type ParamsType = Record<DataTypeName, {
  type: DataType | null;
  geodeticSystem: GeodeticSystemName | null;
  zoneNo: string | null;
}>;

/**
 * 変換パラメータの型定義
 */
type ConvertParameter = {
  fromProjection: string;
  toProjection: string;
};

function getParams(): ParamsType {
  let params: ParamsType = {
    'source': {
      'type': null,
      'geodeticSystem': null,
      'zoneNo': null
    },
    'convert': {
      'type': null,
      'geodeticSystem': null,
      'zoneNo': null
    }
  };

  const sourceDataType = document.querySelectorAll<HTMLInputElement>('[name="sourceDataType"]')
  const convertDataType = document.querySelectorAll<HTMLInputElement>('[name="convertToDataType"]')
  const sourceGeodeticSystem = document.querySelectorAll<HTMLInputElement>('[name="sourceGeodeticSystem"]')
  const convertToGeodeticSystem = document.querySelectorAll<HTMLInputElement>('[name="convertToGeodeticSystem"]')
  const sourceZoneNo = document.querySelector<HTMLSelectElement>('#sourceZoneNo')
  const convertZoneNo = document.querySelector<HTMLSelectElement>('#convertZoneNo')
  sourceDataType.forEach((currentNode) => {
    if (currentNode.checked) {
      params['source']['type'] = currentNode.value as DataType;
    }
  });
  convertDataType.forEach((currentNode) => {
    if (currentNode.checked) {
      params['convert']['type'] = currentNode.value as DataType;
    }
  });
  sourceGeodeticSystem.forEach((currentNode) => {
    if (currentNode.checked) {
      params['source']['geodeticSystem'] = currentNode.value as GeodeticSystemName;
    }
  });
  convertToGeodeticSystem.forEach((currentNode) => {
    if (currentNode.checked) {
      params['convert']['geodeticSystem'] = currentNode.value as GeodeticSystemName;
    }
  });
  if (sourceZoneNo !== null && convertZoneNo !== null) {
    params['source']['zoneNo'] = String(sourceZoneNo.value);
    params['convert']['zoneNo'] = String(convertZoneNo.value);
  }
  return params;
}

/**
 * 測地系と系番号から `proj4.js` で定義した測地系データを取り出す
 * @param {GeodeticSystemName} sourceGeodeticSystem 変換元データの測地系の種類
 * @param {GeodeticSystemName} convertGeodeticSystem 変換先データの測地系の種類
 * @param {string} sourceZoneNo 変換元データの測地系の系番号
 * @param {string} convertZoneNo 変換先データの測地系の系番号
 * @return {ConvertParameter} ESPG コード。データ変換のパラメータとして使う。
 */
function getEspgCodes(
  sourceGeodeticSystem: GeodeticSystemName,
  convertGeodeticSystem: GeodeticSystemName,
  sourceZoneNo: string,
  convertZoneNo: string
): ConvertParameter {
  const convertParameter: ConvertParameter = {
    fromProjection: geodeticSystems[sourceGeodeticSystem][Number(sourceZoneNo)],
    toProjection: geodeticSystems[convertGeodeticSystem][Number(convertZoneNo)]
  };
  return convertParameter;
}

/**
 * 変換元テーブルに入力された値のチェック
 * @param {array} sourceData 変換元データ（緯度経度の配列）
 * @return {array} 不正なデータを削除したデータ。配列の形式は変換元と同じ。
 */
function dataCleansing(sourceData: CellValue[][]) {
  return sourceData.filter((data) => {
    if (isValidNumber(data[0] as string) && isValidNumber(data[1] as string)) {
      return data;
    }
  })
}

/**
 * 変換元テーブルのデータをパラメータに従って変換する関数
 * @param {ConvertParameter} convertParameter 変換元・変換先データの EPSG コード
 * @param {CellValue[][]} sourceData 変換元データ（緯度経度の配列）
 * @return {[number, number][]} 変換後データ。配列の各要素は[緯度, 経度]のタプル。
 */
function convertData(
  convertParameter: ConvertParameter,
  sourceData: CellValue[][]
): [number, number][] {
  return sourceData.map((data) => {
    let temp = proj4(
      convertParameter.fromProjection,
      convertParameter.toProjection,
      [
        Number(data[1]),
        Number(data[0])
      ]
    );
    // proj4 で変換された値は「経度・緯度」の順番になっているので、「緯度・経度」に並べ替える
    return [Number(temp[1]), Number(temp[0])];
  });
};

/**
 * 印刷しないパーツを非表示にする処理
 */
function preparePrint() {
  sourceTable[0].setWidth(0, 110);
  sourceTable[0].setWidth(1, 110);
  sourceTable[0].hideIndex();
  const notPrintDoms = document.querySelectorAll('.d-print-none');
  notPrintDoms.forEach((notPrintDom) => {
    notPrintDom.classList.add('d-none');
  })
  noPrintRadioBtn.forEach((radioBtn) => {
    document.querySelectorAll<HTMLInputElement>('input[name=' + radioBtn + ']').forEach((radioBtn) => {
      if (!radioBtn.checked && radioBtn.parentElement !== null) {
        radioBtn.parentElement.classList.add('d-none')
      }
    })
  })
}

/**
 * 非表示にした印刷しないパーツを表示する処理
 */
function afterPrint() {
  sourceTable[0].setWidth(0, 180);
  sourceTable[0].setWidth(1, 180);
  sourceTable[0].showIndex();
  const notPrintDoms = document.querySelectorAll('.d-print-none');
  notPrintDoms.forEach((notPrintDom) => {
    notPrintDom.classList.remove('d-none');
  })
  noPrintRadioBtn.forEach((radioBtn) => {
    document.querySelectorAll<HTMLInputElement>('input[name=' + radioBtn + ']').forEach((radioBtn) => {
      if (!radioBtn.checked && radioBtn.parentElement !== null) {
        radioBtn.parentElement.classList.remove('d-none')
      }
    })
  })
}

/*
 * 円の追加に関連する処理
 */
const addCircleToMap = document.querySelector<HTMLButtonElement>('#addCircleToMap')
const inputDiameter = document.querySelector<HTMLDialogElement>('inputDiameter')
const latitude = document.querySelector<HTMLInputElement>('#latitude')
const longitude = document.querySelector<HTMLInputElement>('#longitude')
const selectLineColorSelector = document.querySelector<HTMLSelectElement>('#selectLineColor')
const circleRadius = document.querySelector<HTMLInputElement>('#radius')
const cancelAddCircle = document.querySelector<HTMLButtonElement>('#cancelAddCircle')
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
    const lineColor = selectLineColor()
    let markerColor = selectLineColorSelector.value;
    if (markerColor == 'no') {
      markerColor = 'red';
    }
    let radius = 0;
    if (Number(circleRadius.value) >= 0) {
      radius = Number(circleRadius.value);
    }
    const circle = addCircle(latlng, radius, lineColor, markerColor);
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

/**
 * 座標タイプに応じた軸ラベルを取得
 * @param {string} type - 'XY' または 'latlng'
 * @return {Array<string>} 軸ラベルの配列
 */
function getAxisLabels(type: string) {
  type axisLabels = Record<string, string[]>
  const axisLabels: axisLabels = {
    'XY': ['X', 'Y'],
    'latlng': ['緯度', '経度']
  };
  return axisLabels[type] || ['緯度', '経度'];
}

/**
 * 測地系に応じたラベルを取得
 * @param {string} geodeticSystem - 'TOKYO', 'JGD2000', または 'JGD2011'
 * @return {string} 測地系ラベル
 */
function getGeodeticLabel(geodeticSystem: string) {
  type geodeticLabels = Record<string, string>;
  const geodeticLabels: geodeticLabels = {
    'TOKYO': '日本測地系',
    'JGD2000': '世界測地系（JGD2000）',
    'JGD2011': '世界測地系（JGD2011）'
  };
  return geodeticLabels[geodeticSystem] || '世界測地系（JGD2011）';
}

/**
 * 系番号に応じたラベルを取得
 * @param {string} zoneNo - 系番号
 * @return {string} 系番号ラベル
 */
function getZoneLabel(zoneNo: string) {
  return zoneNo !== '0' ? `${zoneNo}系` : '';
}

/**
 * CSVヘッダーテキストを構築
 * @param {object} params - getParams()の戻り値
 * @return {Array<Array<string>>} CSVヘッダー配列
 */
function buildHeaderText(params: ParamsType): string[][] {
  if (
    params.source.type !== null &&
    params.convert.type !== null &&
    params.source.geodeticSystem !== null &&
    params.convert.geodeticSystem !== null &&
    params.source.zoneNo !== null &&
    params.convert.zoneNo !== null
  ) {
    const sourceAxisLabels = getAxisLabels(params.source.type);
    const convertAxisLabels = getAxisLabels(params.convert.type);
    const sourceGeodeticLabel = getGeodeticLabel(params.source.geodeticSystem);
    const convertGeodeticLabel = getGeodeticLabel(params.convert.geodeticSystem);
    const sourceZoneLabel = getZoneLabel(params.source.zoneNo);
    const convertZoneLabel = getZoneLabel(params.convert.zoneNo);

    return [
      ['変換元', '変換元', '変換後', '変換後'],
      [...sourceAxisLabels, ...convertAxisLabels],
      [sourceGeodeticLabel, sourceGeodeticLabel, convertGeodeticLabel, convertGeodeticLabel],
      [sourceZoneLabel, sourceZoneLabel, convertZoneLabel, convertZoneLabel]
    ];
  }

  // デフォルト値を返す
  return [['', '', '', '']];
}

// 変換前後のデータをCSVでexportする
const exportCSVBtn = document.querySelector<HTMLButtonElement>('#exportCSVBtn');
const dataConvert = document.querySelector<HTMLDivElement>('#dataConvert')
if (exportCSVBtn !== null) {
  exportCSVBtn.addEventListener('click', () => {
    const params = getParams();
    const headerText = buildHeaderText(params);
    let sourceData = sourceTable[0].getData();
    const convertData = convertedTable[0].getData();
    sourceData.forEach((data, index) => {
      if (data[0] != '') {
        data.push(...convertData[index]);
      }
    })
    sourceData.unshift(...headerText)
    const csvData = exportCSV(sourceData);
    if (csvData instanceof Blob && dataConvert !== null) {
      const objUrl = URL.createObjectURL(csvData);
      const link = document.createElement('a');
      link.setAttribute('href', objUrl);
      link.setAttribute('download', 'data.csv');
      link.textContent = 'Click to Download';

      dataConvert.appendChild(link);
      link.click();
      dataConvert.removeChild(link);
      URL.revokeObjectURL(objUrl);
    }
  })
}

// 線の色を選択する処理
function selectLineColor(shouldReturnDefaultColor = true) {
  let selectLineColor = document.querySelector<HTMLSelectElement>('#selectLineColor');
  if (!selectLineColor) return shouldReturnDefaultColor ? '#8b4513' : 'no';
  let lineColor = ''
  switch (selectLineColor.value) {
    case 'red':
      lineColor = '#8b4513';
      break;
    case 'blue':
      lineColor = '#4682b4';
      break;
    case 'yellow':
      lineColor = '#ffd700';
      break;
    case 'green':
      lineColor = '#2e8b57';
      break;
    default:
      lineColor = shouldReturnDefaultColor ? '#8b4513' : 'no'
      break;
  }
  return lineColor;
};

window.onerror = function myErrorHandler(errorMsg) {
  const errorMessageDiv = document.querySelector<HTMLDivElement>('#errorMessage')
  if (errorMessageDiv !== null) {
    errorMessageDiv.innerText = String(errorMsg);
  }
  return false;
}
