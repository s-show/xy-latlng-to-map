import { proj4Defs, geodeticSystems } from './proj4.js';
import { gsiStandard, baseMaps, redPinMarker, bluePinMarker, yellowPinMarker, greenPinMarker } from './leaflet.js';
import { sourceTable, convertedTable } from './jspreadsheet.js';
import { transpose } from './tranpose.js';
import { isValidNumber } from './isvalidNumber.js';

// Jspreadsheet のセットアップ
const sourceDataTable = sourceTable;
const convertedDataTable = convertedTable;

// 初期位置を日本緯度経度原点にして leaflet をセットアップ
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

// proj4js のセットアップ
proj4.defs(proj4Defs);

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

    convertedData.forEach((data) => {
      try {
        if (selectMarkerIcon.value === 'redPinMarker') {
          L.marker([Number(data[0]), Number(data[1])], { icon: redPinMarker }).addTo(map).on('click', (e) => {
            e.target.remove()
          });
        } else if (selectMarkerIcon.value === 'bluePinMarker') {
          L.marker([Number(data[0]), Number(data[1])], { icon: bluePinMarker }).addTo(map).on('click', (e) => {
            e.target.remove()
          });
        } else if (selectMarkerIcon.value === 'yellowPinMarker') {
          L.marker([Number(data[0]), Number(data[1])], { icon: yellowPinMarker }).addTo(map).on('click', (e) => {
            e.target.remove()
          });
        } else {
          L.marker([Number(data[0]), Number(data[1])], { icon: greenPinMarker }).addTo(map).on('click', (e) => {
            e.target.remove()
          });
        }
      } catch (error) {
        displayErrorMessage(error);
      }
      try {
        if (lineColor.value === 'redLine') {
          L.polyline(convertedData, { color: 'red' }).addTo(map).on('click', (e) => {
            e.target.remove()
          });
        } else if (lineColor.value === 'blueLine') {
          L.polyline(convertedData, { color: 'blue' }).addTo(map).on('click', (e) => {
            e.target.remove()
          });
        } else if (lineColor.value === 'yellowLine') {
          L.polyline(convertedData, { color: 'yellow' }).addTo(map).on('click', (e) => {
            e.target.remove()
          });
        } else if (lineColor.value === 'greenLine') {
          L.polyline(convertedData, { color: 'green' }).addTo(map).on('click', (e) => {
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
    // `layer._icon` が未定義でなければ Marker レイヤーと判定している。
    // （Polyline レイヤーやベースマップレイヤーでは未定義である）
    if (layer._icon != undefined) {
      map.removeLayer(layer);
    }
    // `layer.options.color` が未定義でなければ Marker レイヤーと判定している。
    // （Marker レイヤーやベースマップレイヤーでは未定義である）
    if (layer.options.color != undefined) {
      map.removeLayer(layer);
    }
  })
  map.eachLayer((layer) => console.log(layer));
  e.preventDefault();
})

// 印刷用に地図より上の部分を非表示にする
document.getElementById('openBigmap').addEventListener('click', (e) => {
  const openBigmapBtn = document.getElementById('openBigmap');
  const inputForm = document.getElementById('inputForm');
  const information = document.getElementById('information');
  const iconInformation = document.getElementById('iconInformation');
  inputForm.classList.toggle('visually-hidden');
  information.classList.toggle('visually-hidden');
  iconInformation.classList.toggle('visually-hidden');
  if (inputForm.classList.contains('visually-hidden')) {
    openBigmapBtn.innerText = '地図以外を表示';
  } else {
    openBigmapBtn.innerText = '地図以外を隠す';
  }
  e.preventDefault();
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

window.onerror = function myErrorHandler(errorMsg) {
  document.getElementById('errorMessage').innerText = errorMsg;
  return false;
}

function displayErrorMessage(error) {
  document.getElementById('errorMessage').textContent = error.message;
  document.getElementById('errorMessageWrap').classList.toggle('visually-hidden');
  console.error(error);
}