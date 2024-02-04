import L, { latLng, layerGroup } from "leaflet";
import { proj4Defs, geodeticSystems } from './proj4.js';
import { gsiStandard, baseMaps, markers, centerMarkers, lengthIcons } from './leaflet.js';
import { sourceTable, convertedTable } from './jspreadsheet.js';
import { isValidNumber } from './isvalidNumber.js';
import { exportCSV } from "./exportCSV.js";
import { createMarker } from './marker.js';
import * as bootstrap from 'bootstrap'
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';
import 'leaflet-geometryutil';
import 'leaflet-contextmenu';
import 'leaflet-arrowheads';

/*---------------------------------------------------------
// Jspreadsheet のセットアップ
---------------------------------------------------------*/
const sourceDataTable = sourceTable;
const convertedDataTable = convertedTable;

/*---------------------------------------------------------
// leaflet のセットアップ
// 初期位置は日本緯度経度原点
// 北緯35度39分29.1572秒, 東経139度44分28.8869秒
---------------------------------------------------------*/
let map = L.map('map',
  {
    preferCanvas: true,
    contextmenu: true,
    contextmenuItems: [
      {
        text: '円を追加',
        callback: openRadiusInputDialog,
      },
      {
        text: 'アイコンを追加',
        callback: addMarker
      },
      {
        text: 'この地点からの距離を計測',
        callback: measureFromThisPoint
      },
      {
        text: 'この地点までの距離を計測',
        callback: measureToThisPoint
      },
    ]
  }).setView([35.6580992222, 139.7413574722], 15);
L.control.layers(baseMaps).addTo(map);
gsiStandard.addTo(map);

// アイコン同士の距離を測るための変数
let measureStartPoint = null;
let measureEndPoint = null;
// 任意の2点間の距離を測るための変数
let measureStartLocation = null;
let measureEndLocation = null;

const markerMenuItems = [
  // items 以外のオプションは `marker.js` で定義済み
  {
    text: 'アイコンを削除',
    callback: removeSelectedMarker
  },
  {
    text: 'このアイコンからの距離を計測',
    callback: measureFromThisMarker
  },
  {
    text: 'このアイコンまでの距離を計測',
    callback: measureToThisMarker
  }
];
const circleMenuItems =  [
  {
    text: '円を削除',
    callback: removeCircle,
  },
  {
    text: '円の中心からの距離を計測',
    callback: measureFromThisCircle
  },
  {
    text: '円の中心までの距離を計測',
    callback: measureToThisCircle
  },
];

/*---------------------------------------------------------
// proj4js のセットアップ
---------------------------------------------------------*/
proj4.defs(proj4Defs);

/*---------------------------------------------------------
// アプリ実装開始---------------------------------------------------------*/
// ウィンドウサイズに応じてデータテーブルの大きさを変える
window.addEventListener('resize', () => {
  const viewPortWidth = Math.max(document.querySelector('.container-fluid').clientWidth, window.innerWidth || 0);
  // viewPortWidth <= 992 で col-lg-* が適用される
  // viewPortWidth < 992 でデータテーブルと地図が縦並びになるのでテーブルの幅を戻している。
  if (viewPortWidth < 992) {
    sourceDataTable.setWidth(0, 180);
    sourceDataTable.setWidth(1, 180);
    sourceDataTable.showIndex();
    convertedTable.setWidth(0, 180);
    convertedTable.setWidth(1, 180);
    convertedTable.showIndex();
  } else if (viewPortWidth <= 1400) {
    sourceDataTable.setWidth(0, 110);
    sourceDataTable.setWidth(1, 110);
    sourceDataTable.hideIndex();
    convertedTable.setWidth(0, 110);
    convertedTable.setWidth(1, 110);
    convertedTable.hideIndex();
  } else if (viewPortWidth <= 1800) {
    sourceDataTable.setWidth(0, 110);
    sourceDataTable.setWidth(1, 110);
    sourceDataTable.showIndex();
    convertedTable.setWidth(0, 110);
    convertedTable.setWidth(1, 110);
    convertedTable.showIndex();
  } else {
    sourceDataTable.setWidth(0, 180);
    sourceDataTable.setWidth(1, 180);
    sourceDataTable.showIndex();
    convertedTable.setWidth(0, 180);
    convertedTable.setWidth(1, 180);
    convertedTable.showIndex();
  }
})

// 測地系と系番号の説明画面から該当する項目を選択できるようにする処理 
window.addEventListener('load', () => {
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
});

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
    if (e.target.value === 'latlng') {
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
    if (e.target.value === 'latlng') {
      sourceZoneNo.options[0].selected = true;
      sourceZoneNo.disabled = true;
    } else {
      sourceZoneNo.disabled = false;
      sourceZoneNo.options[1].selected = true;
      sourceZoneNo.options[0].disabled = true;
    }
  })
})

// 座標系の説明ダイアログ表示処理
document.getElementById('openGeodeticSystemDialog').addEventListener('click', () => {
  const dialog = document.getElementById('geodeticSystemDialog')
  dialog.showModal();
  dialog.addEventListener('click', (e) => {
    if (e.target.id === 'geodeticSystemDialog') {
      dialog.close();
    }
  })
})
document.getElementById('closeGeodeticSystemDialog').addEventListener('click', () => {
  document.getElementById('geodeticSystemDialog').close();
})

// 系番号の説明ダイアログ表示処理
document.getElementById('openZoneNoDialog').addEventListener('click', () => {
  const dataTypeRadioBtn = document.getElementsByName('sourceDataType');
  const zoneNoSelectBtns = document.querySelectorAll('[data-zone-no-btn]')
  let dataType = null;
  dataTypeRadioBtn.forEach((radioBtn) => {
    if (radioBtn.checked && radioBtn.value == 'XY') {
      dataType = 'XY'
    } else if (radioBtn.checked && radioBtn.value == 'latlng'){
      dataType = 'latlng'
    }
  })
  zoneNoSelectBtns.forEach((btn) => {
    if (dataType == 'XY') {
      btn.parentElement.classList.remove('d-none');
      btn.classList.remove('d-none');
    } else {
      btn.parentElement.classList.add('d-none');
      btn.classList.add('d-none');
    }
  })

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
  const params = getParams()
  const convertParameter = createConvertParameter(
    params.source.geodeticSystem,
    params.convert.geodeticSystem,
    params.source.zoneNo,
    params.convert.zoneNo
  );
  const sourceData = dataCleansing(sourceDataTable.getJson(false));
  const convertedData = convertData(convertParameter, sourceData);
  convertedTable.setData(JSON.stringify(convertedData));
    e.preventDefault();
})

// 変換元データの表のデータクリア
document.getElementById('clearSourceTableBtn').addEventListener('click', (e) => {
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

// アイコン一括追加ボタンクリック時の動作
document.getElementById('addMarkerBtn').addEventListener('click', (e) => {
  const sourceData = dataCleansing(sourceDataTable.getJson(false));
  const params = getParams();
  // 緯度経度テーブルのデータが空の状態だと blTableValue.length は 0 になる
  if (sourceDataTable.getData(false).length > 0) {
    // アイコンに必要な緯度経度に変換するため、変換先パラメータを緯度経度に固定している
    const convertParameter = createConvertParameter(params.source.geodeticSystem,
      'JGD2011',
      params.source.zoneNo,
      '0');
    const convertedData = convertData(convertParameter, sourceData);
    const iconColor = document.getElementById('selectMarkerIcon').value;
    let lineColor = selectLineColor(false);

    convertedData.forEach((data) => {
      try {
        const marker = createMarker(Number(data[0]), Number(data[1]), iconColor, markerMenuItems);
        marker.addTo(map);
      } catch (error) {
        displayErrorMessage(error);
      }
      try {
        if (lineColor != 'no') {
          L.polyline(convertedData,
            {
              color: lineColor
            }
            ).addTo(map);
        }
      } catch (error) {
        displayErrorMessage(error);
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
    const bounds = L.latLngBounds(southWestPoint, northEastPoint);
    map.fitBounds(bounds);
  }
  e.preventDefault();
})

// アイコン全削除
document.getElementById('removeMarkerBtn').addEventListener('click', (e) => {
  map.eachLayer((layer) => {
    // `layer._icon` が定義済み = Marker レイヤー
    if (layer._icon != undefined) {
      map.removeLayer(layer);
    }
    // `layer._bounds` が定義済み = Marker レイヤー & Polyline レイヤー
    if (layer._bounds != undefined) {
      map.removeLayer(layer);
    }
    // `layer._mRadius` が定義済み = Circle レイヤー
    if (layer._mRadius != undefined) {
      map.removeLayer(layer);
    }
    // `layer._content` が定義済み = tooltip レイヤー
    // （円の半径を示すために表示している tooltip）
    if (layer._content != undefined) {
      map.removeLayer(layer);
    }
  })
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

// フォームの入力データを使って `proj4.js` で定義した測地系データを取り出す
function createConvertParameter(sourceGeodeticSystem, convertGeodeticSystem, sourceZoneNo, convertZoneNo) {
  let convertParameter = {}
  convertParameter.fromProjection = geodeticSystems[sourceGeodeticSystem][sourceZoneNo];
  convertParameter.toProjection = geodeticSystems[convertGeodeticSystem][convertZoneNo];
  return convertParameter;
}

// 変換元テーブルに入力された値のチェック
function dataCleansing(sourceData) {
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

// 円の半径を入力するダイアログの「追加」ボタンをクリックしたときの処理
document.getElementById('addCircleToMap').addEventListener('click', (e) => {
  let latitude = document.getElementById('latitude').value;
  let longitude = document.getElementById('longitude').value;
  // let selectLineColor = ;
  let lineColor = selectLineColor()
  let markerColor = document.getElementById('selectLineColor').value;
  if (markerColor == 'no') {
    markerColor = 'red';
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
    contextmenu: true,
    contextmenuInheritItems: false,
    contextmenuItems: circleMenuItems
  };
  let centerMarkerOption = {
    icon: centerMarkers[markerColor],
    contextmenu: true,
    contextmenuInheritItems: false,
    contextmenuItems: circleMenuItems
  };
  L.circle([Number(latitude), Number(longitude)], circleOption).addTo(map);
  L.marker([Number(latitude), Number(longitude)], centerMarkerOption).addTo(map);
  const tooltipOption = {
    offset: L.point(0, 1),
    direction: 'bottom',
    permanent: true,
    content: '半径: ' + radius + 'm',
    className: 'tooltipVisual',
    opacity: 1.0
  }
  L.tooltip([Number(latitude), Number(longitude)], tooltipOption).addTo(map);
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

// 変換前後のデータをCSVでexportする
document.getElementById('exportCSVBtn').addEventListener('click', (e) => {
  let headerText = [
    ['変換元','変換元','変換後','変換後']
  ];
  const params = getParams();
  if (params.source.type == 'XY') {
    headerText.push([ 'X', 'Y' ])
  } else {
    headerText.push([ '緯度', '経度' ])
  }
  if (params.convert.type == 'XY') {
    headerText[1].push('X', 'Y')
  } else {
    headerText[1].push('緯度', '経度')
  }
  if (params.source.geodeticSystem == 'TOKYO') {
    headerText.push(['日本測地系', '日本測地系'])
  } else if (params.source.geodeticSystem == 'JGD2000') {
    headerText.push(['世界測地系（JGD2000）', '世界測地系（JGD2000）'])
  } else {
    headerText.push(['世界測地系（JGD2011）', '世界測地系（JGD2011）'])
  }
  if (params.convert.geodeticSystem == 'TOKYO') {
    headerText[2].push('日本測地系', '日本測地系')
  } else if (params.convert.geodeticSystem == 'JGD2000') {
    headerText[2].push('世界測地系（JGD2000）', '世界測地系（JGD2000）')
  } else {
    headerText[2].push('世界測地系（JGD2011）', '世界測地系（JGD2011）')
  }
  if (params.source.zoneNo != '0') {
    headerText.push([String(params.source.zoneNo) + '系', String(params.source.zoneNo) + '系'])
  } else {
    headerText.push(['', ''])
  };
  if (params.convert.zoneNo != '0') {
    headerText[3].push(String(params.convert.zoneNo) + '系', String(params.convert.zoneNo) + '系')
  } else {
    headerText[3].push('', '')
  }
  let sourceData = sourceDataTable.getData();
  const convertData = convertedTable.getData();
  sourceData.forEach((data, index) => {
    data.push(convertData[index]);
  })
  const csvData = exportCSV(sourceData, headerText);
  const objUrl = URL.createObjectURL(csvData);
  const link = document.createElement('a');
  link.setAttribute('href', objUrl);
  link.setAttribute('download', 'data.csv');
  link.textContent = 'Click to Download';

  document.getElementById('exportBtnArea').appendChild(link);
  link.click();
  document.getElementById('exportBtnArea').removeChild(link);
  URL.revokeObjectURL(objUrl);
})

// 引数の `e` に含まれる情報は「クリックした場所の情報（緯度経度とピクセル情報）と親要素の緯度経度」のみである。
// そのため、引数だけでは「どの円をクリックしたか」判別できない。
function removeCircle(e) {
  // 中心点のアイコンの削除で使う円の緯度経度情報
  // （中心点のアイコンの緯度経度は円の中心の緯度経度と同じ）
  let circleCenter = null;
  map.eachLayer((layer) => {
    if (layer._mRadius != undefined) {
      // クリックした場所から円の中心点の距離を算定
      const distanceLatLngs = map.distance(e.latlng, layer._latlng);
      // 上の距離が円の半径以下なら、削除したい円の内側がクリックされたと判断する
      if (distanceLatLngs <= layer._mRadius) {
        circleCenter = layer._latlng;
        layer.remove();
        if (layer._latlng == measureStartPoint) {
          measureStartPoint = null;
        } else if (layer._latlng == measureEndPoint) {
          measureEndPoint = null;
        }
      }
    }
    // 円の中心点 marker と半径を示す tooltip の削除
    if (layer._latlng != undefined && circleCenter != null) {
      if (layer._latlng.lat == circleCenter.lat && layer._latlng.lng == circleCenter.lng) {
        layer.remove();
      }
    }
    // 距離計測で描画した polyline の削除
    if (layer._latlngs != undefined) {
      layer._latlngs.forEach((latlng) => {
        console.table(latlng);
        if (Number(latlng.lat) == circleCenter.lat && Number(latlng.lng) == circleCenter.lng) {
          layer.remove();
        }
      })
    }
  })
}

// 円の中心点からの距離を計測する処理
function measureFromThisCircle(e) {
  map.eachLayer((layer) => {
    if (layer._mRadius != undefined) {
      const distanceLatLngs = map.distance(e.latlng, layer._latlng);
      if (distanceLatLngs <= layer._mRadius) {
        measureStartPoint = layer._latlng;
      }
    }
  })
  if (measureEndPoint != null) {
    measureLength('circle');
  }
}
function measureToThisCircle(e) {
  map.eachLayer((layer) => {
    if (layer._mRadius != undefined) {
      const distanceLatLngs = map.distance(e.latlng, layer._latlng);
      if (distanceLatLngs <= layer._mRadius) {
        measureEndPoint = layer._latlng;
      }
    }
  })
  if (measureStartPoint != null) {
    measureLength('circle');
  }
}

// 半径を入力するダイアログを表示する処理
function openRadiusInputDialog(e) {
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
}

// 個別にアイコンを追加する処理
function addMarker(e) {
  const iconColor = document.getElementById('selectMarkerIcon').value;
  const marker = createMarker(Number(e.latlng.lat), Number(e.latlng.lng), iconColor, markerMenuItems);
  marker.bindTooltip('緯度経度: ' + Number(e.latlng.lat) + ', ' + e.latlng.lng, {}).openTooltip();
  marker.addTo(map);
}

// 任意の2点間の距離を計測する処理
function measureFromThisPoint(e) {
  const marker = createMarker(Number(e.latlng.lat), Number(e.latlng.lng), 'length', markerMenuItems);
  marker.addTo(map);
  measureStartLocation = marker._latlng;
  if (measureEndLocation != null) {
    measureLength('point');
  }
}
function measureToThisPoint(e) {
  const marker = createMarker(Number(e.latlng.lat), Number(e.latlng.lng), 'length', markerMenuItems);
  marker.addTo(map);
  measureEndLocation = marker._latlng;
  if (measureStartLocation != null) {
    measureLength('point');
  }
}

// 選択したアイコンを削除する処理
function removeSelectedMarker(e) {
  const selectedMarkerId = e.relatedTarget._leaflet_id;
  let markerLatLng = null;
  map.eachLayer((layer) => {
    if (layer._leaflet_id == selectedMarkerId) {
      // これから削除するアイコンにかかる距離計測で描画した
      // Polyline の緯度経度は削除するアイコンと同じため、
      // Polyline を削除するために緯度経度情報を控えておく。
      markerLatLng = layer._latlng;
      layer.remove();
      if (layer._latlng == measureStartPoint) {
        measureStartPoint = null;
      } else if (layer._latlng == measureEndPoint) {
        measureEndPoint = null;
      }
    }
    if (layer._latlngs != undefined) {
      layer._latlngs.forEach((latlng) => {
        if (Number(latlng.lat) == markerLatLng.lat && Number(latlng.lng) == markerLatLng.lng ) {
          layer.remove();
        }
      })
    }
  })
}

// アイコン同士の距離計測の準備
function measureFromThisMarker(e) {
  // 選択したアイコンを判別するために `leaflet_id` を取得
  const startMarkerId = e.relatedTarget._leaflet_id;
  map.eachLayer((layer) => {
    if (layer._leaflet_id == startMarkerId) {
      measureStartPoint = layer._latlng;
    }
  })
  if (measureEndPoint != null) {
    measureLength('marker');
  }
}
function measureToThisMarker(e) {
  const endMarkerId = e.relatedTarget._leaflet_id;
  map.eachLayer((layer) => {
    if (layer._leaflet_id == endMarkerId) {
      measureEndPoint = layer._latlng;
    }
  })
  if (measureStartPoint != null) {
    measureLength('marker');
  }
}

// 2点間の距離計測処理
function measureLength(referrer) {
  let measureStart = null;
  let measureEnd = null;
  if (referrer == 'marker' || referrer == 'circle') {
    measureStart = measureStartPoint;
    measureEnd = measureEndPoint;
  } else {
    measureStart = measureStartLocation;
    measureEnd = measureEndLocation;
  }
  const startLatLng = L.latLng(Number(measureStart.lat), Number(measureStart.lng));
  const endLatLng = L.latLng(Number(measureEnd.lat), Number(measureEnd.lng));
  const polyline = L.polyline([startLatLng, endLatLng], {
    renderer: L.svg(),
    weight: 4,
    color: '#696969',
  });
  polyline.arrowheads(
  {
    yawn: 45,
    size: '25px',
  });
  polyline.addTo(map);
  const polylineTooltip = L.tooltip(polyline.getCenter(), {
    content: '距離: ' + Math.round(map.distance(startLatLng, endLatLng)) + 'm',
    direction: 'center',
    permanent: true
  })
  polyline.bindTooltip(polylineTooltip);
}

// 線の色を選択する処理
function selectLineColor(shouldReturnDefaultColor=true) {
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