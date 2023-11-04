import { proj4Defs, geodeticSystems } from './proj4.js';
import { gsiStandard, baseMaps, pinMarkers, addCircle } from './leaflet.js';
import { sourceTable, convertedTable } from './jspreadsheet.js';
import { transpose } from './tranpose.js';
import { isValidNumber } from './isvalidNumber.js';
// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';

// Jspreadsheet のセットアップ
const sourceDataTable = sourceTable;
const convertedDataTable = convertedTable;

// leaflet のセットアップ
// 初期位置は日本緯度経度原点
// 日本緯度経度原点
// 経度 東経 １３９°４４′２８.８８６９”
// 緯度 北緯 ３５°３９′２９.１５７２”
let map = L.map('map',
  {
    renderer: L.canvas(),
    preferCanvas: true
  }).setView([35.6580992222, 139.7413574722], 15);
L.control.layers(baseMaps).addTo(map);
gsiStandard.addTo(map);
let circles = [];

// proj4js のセットアップ
proj4.defs(proj4Defs);

// 印刷時に選択していない項目を非表示にするラジオボタン
const noPrintRadioBtn = [
  'sourceDataType',
  'sourceGeodeticSystem',
  'convertToDataType',
  'convertToGeodeticSystem'
];

// 変換元データのXY座標・緯度経度の選択に応じて系番号を変更する
document.getElementsByName('sourceDataType').forEach((selectedBtn) => {
  selectedBtn.addEventListener('input', (e) => {
    const sourceZoneNo = document.getElementById('sourceZoneNo');
    if (e.target.value === 'BL') {
      sourceZoneNo.options[0].selected = true;
      sourceZoneNo.disabled = true;
    } else {
      sourceZoneNo.disabled = false;
      sourceZoneNo.options[1].selected = true;
      sourceZoneNo.options[0].disabled = true;
    }
  })
})

// 変換先データのXY座標・緯度経度の選択に応じて系番号を変更する
document.getElementsByName('convertToDataType').forEach((selectedBtn) => {
  selectedBtn.addEventListener('input', (e) => {
    const sourceZoneNo = document.getElementById('convertZoneNo');
    if (e.target.value === 'BL') {
      sourceZoneNo.options[0].selected = true;
      sourceZoneNo.disabled = true;
    } else {
      sourceZoneNo.disabled = false;
      sourceZoneNo.options[1].selected = true;
      sourceZoneNo.options[0].disabled = true;
    }
    console.debug(e.target.value);
  })
})

// 座標系の説明ダイアログ表示処理
document.getElementById('openGeodeticSystemDialog').addEventListener('click', () => {
  const dialog = document.getElementById('geodeticSystem')
  dialog.showModal();
  dialog.addEventListener('click', (e) => {
    if (e.target.id === 'geodeticSystem') {
      dialog.close();
    }
  })
})
document.getElementById('closeGeodeticSystemDialog').addEventListener('click', () => {
  document.getElementById('geodeticSystem').close();
})

// 系番号の説明ダイアログ表示処理
document.getElementById('openZoneNoDialog').addEventListener('click', () => {
  const dialog = document.getElementById('zoneNoDialog')
  dialog.showModal();
  dialog.addEventListener('click', (e) => {
    if (e.target.id === 'zoneNoDialog') {
      dialog.close();
    }
  })
})
document.getElementById('closeZoneNoDialog').addEventListener('click', () => {
  document.getElementById('zoneNoDialog').close();
})

// データテーブルの注意事項ダイアログの表示処理
document.getElementById('openConsiderationsDialog').addEventListener('click', () => {
  const dialog = document.getElementById('considerationsDialog')
  dialog.showModal();
  dialog.addEventListener('click', (e) => {
    if (e.target.id === 'considerationsDialog') {
      dialog.close();
    }
  })
})
document.getElementById('closeConsiderationsDialog').addEventListener('click', () => {
  document.getElementById('considerationsDialog').close();
})

// データ変換
document.getElementById('dataConvertBtn').addEventListener('click', (e) => {
  const formData = collectFormData();
  const convertParameter = createConvertParameter(formData.sourceGeodeticSystem,
    formData.convertToGeodeticSystem,
    formData.sourceZoneNo,
    formData.convertZoneNo);
  const sourceData = sourceDataCleansing(sourceDataTable.getJson(false));
  const convertedData = convertData(convertParameter, sourceData);
  convertedTable.setData(JSON.stringify(convertedData));
  e.preventDefault();
})

// 変換元データの表のデータクリア
document.getElementById('clearSourceDataTableBtn').addEventListener('click', (e) => {
  const tableData = [
    [,],
  ];
  sourceDataTable.setData(tableData);
  e.preventDefault();
})

// 変換後データの表のデータクリア
document.getElementById('clearConvertedDataTableBtn').addEventListener('click', (e) => {
  const tableData = [
    [,],
  ];
  convertedDataTable.setData(tableData);
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

// マーカー追加ボタンクリック時の動作
document.getElementById('addMarkerBtn').addEventListener('click', (e) => {
  // 緯度経度テーブルのデータが全て削除されていると blTableValue.length は 1 になる
  if (sourceDataTable.getData(false).length > 1) {
    const selectMarkerIcon = document.getElementById('selectMarkerIcon');
    const lineColor = document.getElementById('selectLineColor');
    const formData = collectFormData();
    // マーカーに必要な緯度経度に変換するため、変換先パラメータは緯度経度で決め打ちしている
    const convertParameter = createConvertParameter(formData.sourceGeodeticSystem,
      'JGD2011',
      formData.sourceZoneNo,
      '0');
    const sourceData = sourceDataCleansing(sourceDataTable.getJson(false));
    const convertedData = convertData(convertParameter, sourceData);
    let iconColor = ''

    switch (selectMarkerIcon.value) {
      case 'redPinMarker':
        iconColor = pinMarkers.red;
        break;
      case 'bluePinMarker':
        iconColor = pinMarkers.blue;
        break;
      case 'yellowPinMarker':
        iconColor = pinMarkers.yellow;
        break;
      default:
        iconColor = pinMarkers.green;
        break;
    }

    convertedData.forEach((data) => {
      try {
        L.marker([Number(data[0]), Number(data[1])], { icon: iconColor }).addTo(map).on('click', (e) => {
          e.target.remove()
        });
      } catch (error) {
        displayErrorMessage(error);
      }
      try {
        if (lineColor.value != 'no') {
          L.polyline(convertedData, { color: lineColor.value}).addTo(map).on('click', (e) => {
            e.target.remove()
          });
        }
      } catch (error) {
        displayErrorMessage(error);
      }
    })
    let temp1 = [];
    convertedData.forEach((data) => {
      let tempArray = [data[0], data[1]];
      temp1.push(tempArray);
    })
    let temp2 = transpose(temp1);
    const southWestPoint = L.latLng([Math.min(...temp2[0]), Math.min(...temp2[1])]);
    const northEastPoint = L.latLng([Math.max(...temp2[0]), Math.max(...temp2[1])]);
    const bounds = L.latLngBounds(southWestPoint, northEastPoint);
    map.fitBounds(bounds);
  }
  e.preventDefault();
})

// マーカー全削除
document.getElementById('removeMarkerBtn').addEventListener('click', (e) => {
  map.eachLayer((layer) => {
    // `layer._icon` が定義されていれば Marker レイヤーと判定している。
    if (layer._icon != undefined) {
      map.removeLayer(layer);
    }
    // `layer._bounds` が定義されていれば Marker レイヤーと判定している。
    if (layer._bounds != undefined) {
      map.removeLayer(layer);
    }
    // `layer._mRadius` が定義されていれば Circle レイヤーと判定している。
    if (layer._mRadius != undefined) {
      map.removeLayer(layer);
    }
  })
  map.eachLayer((layer) => console.log(layer));
  e.preventDefault();
})

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

// ユーザーが設定したデータの詳細情報を取得
function collectFormData() {
  const sourceDataTypeNodeList = document.getElementsByName('sourceDataType');
  const convertToDataTypeNodeList = document.getElementsByName('convertToDataType');
  const sourceGeodeticSystemNodeList = document.getElementsByName('sourceGeodeticSystem');
  const convertToGeodeticSystemNodeList = document.getElementsByName('convertToGeodeticSystem');
  let formData = {};

  sourceDataTypeNodeList.forEach((currentNode) => {
    if (currentNode.checked) {
      formData['sourceDataType'] = currentNode.value;
    }
  });
  convertToDataTypeNodeList.forEach((currentNode) => {
    if (currentNode.checked) {
      formData['convertToDataType'] = currentNode.value;
    }
  });
  sourceGeodeticSystemNodeList.forEach((currentNode) => {
    if (currentNode.checked) {
      formData['sourceGeodeticSystem'] = currentNode.value;
    }
  });
  convertToGeodeticSystemNodeList.forEach((currentNode) => {
    if (currentNode.checked) {
      formData['convertToGeodeticSystem'] = currentNode.value;
    }
  });
  formData['sourceZoneNo'] = document.getElementById('sourceZoneNo').value;
  formData['convertZoneNo'] = document.getElementById('convertZoneNo').value;
  return formData;
}

// フォームの入力データを使って `proj4.js` で定義した測地系データを取り出す
function createConvertParameter(sourceGeodeticSystem, convertToGeodeticSystem, sourceZoneNo, convertZoneNo) {
  let convertParameter = {}
  convertParameter.fromProjection = geodeticSystems[sourceGeodeticSystem][sourceZoneNo];
  convertParameter.toProjection = geodeticSystems[convertToGeodeticSystem][convertZoneNo];
  return convertParameter;
}

// 変換元テーブルに入力された値のチェック
function sourceDataCleansing(sourceData) {
  let result = [];
  sourceData.forEach((data) => {
    if (isValidNumber(data.x_latitude) && isValidNumber(data.y_longitude)) {
      result.push(data);
    }
  })
  return result;
}

// 変換元テーブルのデータの変換
function convertData(convertParameter, sourceData) {
  let convertedData = [];
  sourceData.forEach((data) => {
    try {
      let temp = proj4(convertParameter.fromProjection,
        convertParameter.toProjection,
        [
          Number(data.y_longitude),
          Number(data.x_latitude)
        ]);
      convertedData.push([temp[1], temp[0]]);
    } catch (error) {
      displayErrorMessage(error);
    }
  });
  return convertedData;
};

// 印刷しないパーツの非表示処理
function preparePrint() {
  sourceDataTable.setWidth(0, 110);
  sourceDataTable.setWidth(1, 110);
  sourceDataTable.hideIndex();
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

// 印刷前に非表示にしたパーツを表示する処理
function afterPrint() {
  sourceDataTable.setWidth(0, 180);
  sourceDataTable.setWidth(1, 180);
  sourceDataTable.showIndex();
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

// 地図をクリックして円を追加する処理
// 半径を入力するダイアログを表示する処理
map.addEventListener('click', (e) => {
  const dialog = document.getElementById('inputDiameter');
  dialog.showModal();
  document.getElementById('radius').select(); 
  document.getElementById('latitude').value = e.latlng.lat;
  document.getElementById('longitude').value = e.latlng.lng;
  dialog.addEventListener('click', (e) => {
    if (e.target.id === 'inputDiameter') {
      dialog.close();
    }
  })
})
// 円の半径を入力するダイアログの「追加」ボタンをクリックしたときの処理
document.getElementById('addCircleToMap').addEventListener('click', (e) => {
  let latitude = document.getElementById('latitude').value;
  let longitude = document.getElementById('longitude').value;
  let selectLineColor = document.getElementById('selectLineColor');
  let lineColor = 'red';
  if (selectLineColor.value != 'no') {
    lineColor = selectLineColor.value;
  }
  let circleRadius = document.getElementById('radius'); 
  let radius = 0;
  if (Number(circleRadius.value) >= 0) {
    radius = Number(circleRadius.value);
  }
  let circleOption = {
    radius: radius,
    color: lineColor,
    opacity: 1.0,
    fill: true,
    fillOpacity: 0.05,
    // circle はイベントバブリングがデフォルトで有効。
    // バブリングが有効だと、円を削除するためにクリックした時に、
    // 円が削除されると同時に新しい円が描画されてしまう。
    // オプションの説明は https://leafletjs.com/reference.html#circle-bubblingmouseevents 参照
    bubblingMouseEvents: false
  }
  let circle = L.circle([Number(latitude), Number(longitude)], circleOption).addTo(map).on('click', (e) => {
    e.target.remove();
  })
  circles.push(circle);
  circleRadius.value = '0';
  document.getElementById('inputDiameter').close();
  e.preventDefault();
});
// 円の半径を入力するダイアログの「キャンセル」ボタンをクリックしたときの処理
document.getElementById('cancelAddCircle').addEventListener('click', (e) => {
  document.getElementById('inputDiameter').close();
  e.preventDefault();
});

window.onerror = function myErrorHandler(errorMsg) {
  document.getElementById('errorMessage').innerText = errorMsg;
  return false;
}

function displayErrorMessage(error) {
  document.getElementById('errorMessage').textContent = error.message;
  document.getElementById('errorMessageWrap').classList.toggle('visually-hidden');
  console.error(error);
}