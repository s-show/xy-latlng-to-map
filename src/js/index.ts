import L, { latLng, layerGroup } from "leaflet";
import { geodeticSystems } from './proj4.js';
import { sourceTable, convertedTable, clearTable, resizeTable } from './jspreadsheet.js';
import { isValidNumber } from './isvalidNumber.js';
import { exportCSV } from "./exportCSV.js";
import { createMarker } from './marker.js';
import { map } from "./map.js";
import { addCircle } from "./circle.js";
import * as bootstrap from 'bootstrap'
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';

// 印刷モード時に非表示にするラジオボタンのリスト
const noPrintRadioBtn = [
  'sourceDataType',
  'sourceGeodeticSystem',
  'convertToDataType',
  'convertToGeodeticSystem'
];

/*---------------------------------------------------------
// アプリ実装開始
---------------------------------------------------------*/
// ウィンドウサイズに応じてデータテーブルの大きさを変える
window.addEventListener('resize', () => {
  resizeTable(
    Math.max(document.querySelector('.container-fluid').clientWidth, window.innerWidth || 0)
  );
})

// 測地系と系番号の説明画面から該当する項目を選択できるようにする処理 
window.addEventListener('load', () => {
  setupDialog();
});

function setupDialog() {
  // 測地系の説明画面の処理
  const geodeticSystemSelectBtn = document.querySelectorAll('[data-geodeticSystem]')
  const geodeticSystemRadioBtn = document.getElementsByName('sourceGeodeticSystem');
  geodeticSystemSelectBtn.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      geodeticSystemRadioBtn.forEach((radioBtn) => {
        if (e.target.getAttribute('data-geodeticSystem') == radioBtn.value) {
          radioBtn.checked = true;
        }
      })
      document.getElementById('geodeticSystemDialog').close();
    })
  })
  // 系番号の説明画面の処理
  const zoneNoSelectBtn = document.querySelectorAll('[data-zone-no-btn]')
  const sourceZoneNo = document.getElementById('sourceZoneNo');
  zoneNoSelectBtn.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      sourceZoneNo.value = e.target.getAttribute('data-zone-no-btn');
      sourceZoneNo.options[0].disabled = true;
      document.getElementById('zoneNoDialog').close();
    })
  })
}

// 変換元・変換先データのXY座標・緯度経度の選択に応じて系番号を変更する
document.getElementsByName('sourceDataType').forEach((selectedBtn) => {
  changeZoneNo(selectedBtn, document.getElementById('sourceZoneNo'));
})
document.getElementsByName('convertToDataType').forEach((selectedBtn) => {
  changeZoneNo(selectedBtn, document.getElementById('convertZoneNo'));
})
function changeZoneNo(selectedBtn, selectMenu) {
  selectedBtn.addEventListener('input', (e) => {
    const sourceZoneNo = document.getElementById('sourceZoneNo');
    if (e.target.value === 'latlng') {
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
document.getElementById('openGeodeticSystemDialog').addEventListener('click', () => {
  showDialog(document.getElementById('geodeticSystemDialog'), 'geodeticSystemDialog');
})
document.getElementById('closeGeodeticSystemDialog').addEventListener('click', () => {
  document.getElementById('geodeticSystemDialog').close();
})
// 系番号の説明ダイアログ表示処理
document.getElementById('openZoneNoDialog').addEventListener('click', () => {
  const zoneNoSelectBtns = document.querySelectorAll('[data-zone-no-btn]')
  let dataType = getParams().source.type;
  zoneNoSelectBtns.forEach((btn) => {
    if (dataType == 'XY') {
      btn.parentElement.classList.remove('d-none');
      btn.classList.remove('d-none');
    } else {
      btn.parentElement.classList.add('d-none');
      btn.classList.add('d-none');
    }
  })
  showDialog(document.getElementById('zoneNoDialog'), 'zoneNoDialog');
})
document.getElementById('closeZoneNoDialog').addEventListener('click', () => {
  document.getElementById('zoneNoDialog').close();
})
// データテーブルの注意事項ダイアログの表示処理
document.getElementById('openAcceptableDataDialog').addEventListener('click', () => {
  showDialog(document.getElementById('acceptableDataDialog'), 'acceptableDataDialog');
})
document.getElementById('closeAcceptableDataDialog').addEventListener('click', () => {
  document.getElementById('acceptableDataDialog').close();
})
function showDialog(dialog, dialogId) {
  dialog.showModal();
  dialog.addEventListener('click', (e) => {
    if (e.target.id === dialogId) {
      dialog.close();
    }
  })
}

// データ変換
document.getElementById('dataConvertBtn').addEventListener('click', (e) => {
  const params = getParams()
  const convertParameter = getEspgCodes(
    params.source.geodeticSystem,
    params.convert.geodeticSystem,
    params.source.zoneNo,
    params.convert.zoneNo
  );
  const sourceData = dataCleansing(sourceTable[0].getData(false, false, false, true));
  convertedTable[0].setData(convertData(convertParameter, sourceData));
  e.preventDefault();
})

// 変換元データの表のデータクリア
document.getElementById('clearSourceTableBtn').addEventListener('click', (e) => {
  clearTable(e, 'source');
})
// 変換後データの表のデータクリア
document.getElementById('clearConvertedTableBtn').addEventListener('click', (e) => {
  clearTable(e, 'converted');
})

// アイコン一括追加ボタンクリック時の動作
document.getElementById('addMarkerBtn').addEventListener('click', (e) => {
  const sourceData = dataCleansing(sourceTable[0].getData(false, false, false, true));
  const params = getParams();
  // 緯度経度テーブルに有効なデータが無い場合 sourceData.length は 0 になる
  if (sourceData.length > 0) {
    // アイコン追加には緯度経度が必要なため、変換先パラメータは緯度経度に固定している
    const convertParameter = getEspgCodes(
      params.source.geodeticSystem,
      'JGD2011',
      params.source.zoneNo,
      '0'
    );
    const convertedData = convertData(convertParameter, sourceData);
    const iconColor = document.getElementById('selectMarkerIcon').value;
    const lineColor = selectLineColor(false);

    convertedData.forEach((data, index) => {
      if (iconColor != 'none') {
        createMarker(data[0], data[1], iconColor).addTo(map);
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
})

// アイコン全削除
document.getElementById('removeMarkerBtn').addEventListener('click', (e) => {
  map.eachLayer((layer) => {
    // `layer._url` が定義されているのは地図タイルのみ。
    // `layer._url` が未定義なら任意に追加したアイコンや円と判断できる
    if (layer._url == undefined) {
      layer.remove();
    }
  })
  e.preventDefault();
})

// 印刷用のスタイル変更処理
// 処理1: 印刷時にデータテーブルの幅を狭くし、印刷終了後に幅を戻す処理
// 処理2: 選択していないラジオボタンを印刷時に非表示にし、印刷終了後に戻す処理。
window.addEventListener("beforeprint", (event) => {
  preparePrint();
});
window.addEventListener("afterprint", (event) => {
  afterPrint();
});
// 印刷プレビュー画面の作成
document.getElementById('printPreviewBtn').addEventListener('input', (e) => {
  if (e.target.checked) {
    preparePrint();
  } else {
    afterPrint();
  }
})

// 地図引き伸ばし
document.getElementById('zoomRange').addEventListener('input', (e) => {
  document.getElementById('map').style.transform = "scale(" + e.target.value + ")";
  document.getElementById('zoomRangeValue').value = e.target.value + 'x';
})

/**
 * ユーザーが設定したデータの詳細情報を取得
 * @return {object} 変換元・変換先のデータの定義
 */
function getParams() {
  let params = {
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

  document.getElementsByName('sourceDataType').forEach((currentNode) => {
    if (currentNode.checked) {
      params['source']['type'] = currentNode.value;
    }
  });
  document.getElementsByName('convertDataType').forEach((currentNode) => {
    if (currentNode.checked) {
      params['convert']['type'] = currentNode.value;
    }
  });
  document.getElementsByName('sourceGeodeticSystem').forEach((currentNode) => {
    if (currentNode.checked) {
      params['source']['geodeticSystem'] = currentNode.value;
    }
  });
  document.getElementsByName('convertToGeodeticSystem').forEach((currentNode) => {
    if (currentNode.checked) {
      params['convert']['geodeticSystem'] = currentNode.value;
    }
  });
  params['source']['zoneNo'] = document.getElementById('sourceZoneNo').value;
  params['convert']['zoneNo'] = document.getElementById('convertZoneNo').value;
  return params;
}

/**
 * 測地系と系番号から `proj4.js` で定義した測地系データを取り出す
 * @param {string} sourceGeodeticSystem 変換元データの測地系の種類
 * @param {string} convertGeodeticSystem 変換先データの測地系の種類
 * @param {string} sourceZonNe 変換元データの測地系の系番号
 * @param {string} convertZonNe 変換先データの測地系の系番号
 * @return {object} ESPG コード。データ変換のパラメータとして使う。
 */
function getEspgCodes(sourceGeodeticSystem, convertGeodeticSystem, sourceZoneNo, convertZoneNo) {
  let convertParameter = {}
  convertParameter.fromProjection = geodeticSystems[sourceGeodeticSystem][sourceZoneNo];
  convertParameter.toProjection = geodeticSystems[convertGeodeticSystem][convertZoneNo];
  return convertParameter;
}

/**
 * 変換元テーブルに入力された値のチェック
 * @param {array} sourceData 変換元データ（緯度経度の配列）
 * @return {array} 不正なデータを削除したデータ。配列の形式は変換元と同じ。
 */
function dataCleansing(sourceData) {
  return sourceData.filter((data) => {
    if (isValidNumber(data[0]) && isValidNumber(data[1])) {
      return data;
    }
  })
}

/**
 * 変換元テーブルのデータをパラメータに従って変換する関数
 * @param {object} convertParameter 変換元・変換先データの EPSG コード
 * @param {array} sourceData 変換元データ（緯度経度の配列）
 * @return {array} 変換後データ。配列の各要素は数値型。
 */
function convertData(convertParameter, sourceData) {
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
    document.getElementsByName(radioBtn).forEach((radioBtn) => {
      if (!radioBtn.checked) {
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
    document.getElementsByName(radioBtn).forEach((radioBtn) => {
      if (!radioBtn.checked) {
        radioBtn.parentElement.classList.remove('d-none')
      }
    })
  })
}

// 円の半径を入力するダイアログの「追加」ボタンをクリックしたときの処理
document.getElementById('addCircleToMap').addEventListener('click', (e) => {
  const latlng = [
    Number(document.getElementById('latitude').value),
    Number(document.getElementById('longitude').value)
  ];
  const lineColor = selectLineColor()
  let markerColor = document.getElementById('selectLineColor').value;
  if (markerColor == 'no') {
    markerColor = 'red';
  }
  const circleRadius = document.getElementById('radius');
  let radius = 0;
  if (Number(circleRadius.value) >= 0) {
    radius = Number(circleRadius.value);
  }
  const circle = addCircle(latlng, radius, lineColor, markerColor);
  circle.circle.addTo(map);
  circle.marker.addTo(map);
  circle.tooltip.addTo(map);
  circleRadius.value = '0';
  document.getElementById('inputDiameter').close();
  e.preventDefault();
});
// 円の半径を入力するダイアログの「キャンセル」ボタンをクリックしたときの処理
document.getElementById('cancelAddCircle').addEventListener('click', (e) => {
  document.getElementById('inputDiameter').close();
  e.preventDefault();
});
// 円の半径を入力するダイアログを閉じる時の処理
document.getElementById('inputDiameter').addEventListener('close', (e) => {
  document.getElementById('radius').value = '0';
  e.preventDefault();
})

/**
 * 座標タイプに応じた軸ラベルを取得
 * @param {string} type - 'XY' または 'latlng'
 * @return {Array<string>} 軸ラベルの配列
 */
function getAxisLabels(type) {
  const axisLabels = {
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
function getGeodeticLabel(geodeticSystem) {
  const geodeticLabels = {
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
function getZoneLabel(zoneNo) {
  return zoneNo !== '0' ? `${zoneNo}系` : '';
}

/**
 * CSVヘッダーテキストを構築
 * @param {object} params - getParams()の戻り値
 * @return {Array<Array<string>>} CSVヘッダー配列
 */
function buildHeaderText(params) {
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

// 変換前後のデータをCSVでexportする
document.getElementById('exportCSVBtn').addEventListener('click', (e) => {
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
  const objUrl = URL.createObjectURL(csvData);
  const link = document.createElement('a');
  link.setAttribute('href', objUrl);
  link.setAttribute('download', 'data.csv');
  link.textContent = 'Click to Download';

  document.getElementById('dataConvert').appendChild(link);
  link.click();
  document.getElementById('dataConvert').removeChild(link);
  URL.revokeObjectURL(objUrl);
})

// 線の色を選択する処理
function selectLineColor(shouldReturnDefaultColor = true) {
  let selectLineColor = document.getElementById('selectLineColor');
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
  document.getElementById('errorMessage').innerText = errorMsg;
  return false;
}

function displayErrorMessage(error) {
  document.getElementById('errorMessage').textContent = error.message;
  document.getElementById('errorMessageWrap').classList.toggle('visually-hidden');
  console.error(error);
}
