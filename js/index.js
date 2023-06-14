import { proj4Defs, geodeticSystems } from './proj4.js';
import { gsiStandard, baseMaps, redArrowIcon, blueArrowIcon, greenArrowIcon } from './leaflet.js';
import { xytable, bltable } from './jspreadsheet.js';
import { transpose } from './tranpose.js';
import { isValidNumber } from './isvalidNumber.js';

// Jspreadsheet のセットアップ
const xyTable = xytable;
const blTable = bltable;

// 初期位置を皇居にして leaflet をセットアップ
let map = L.map('map').setView([35.684627, 139.752032], 15);
L.control.layers(baseMaps).addTo(map);
gsiStandard.addTo(map);

// proj4js のセットアップ
proj4.defs(proj4Defs);

document.getElementById('xy2blConvertBtn').addEventListener('click', (e) => {
  convertXYAndBl('xy2bl', e);
})

document.getElementById('bl2xyConvertBtn').addEventListener('click', (e) => {
  convertXYAndBl('bl2xy', e);
})

document.getElementById('clearDataXYTable').addEventListener('click', (e) => {
  const tableData = [
    [, ],
  ];
  if (window.confirm('表のデータを削除して良いですか？')) {
    xyTable.setData(tableData);
    e.preventDefault();  
  } else {
    e.preventDefault();  
  }
})

document.getElementById('clearDataBLTable').addEventListener('click', (e) => {
  const tableData = [
    [, ],
  ];
  if (window.confirm('表のデータを削除して良いですか？')) {
    blTable.setData(tableData);
    e.preventDefault();  
  } else {
    e.preventDefault();  
  }
})

document.getElementById('addMarkerBtn').addEventListener('click', () => {
  let blTableValue = blTable.getData(false);
  // 緯度経度テーブルのデータが全て削除されていると blTableValue.length は 1 になる
  if (blTableValue.length > 1) {
    const selectMarkerIcon = document.getElementById('selectMarkerIcon');
    let sourceData = [];
    blTableValue.forEach((bl) => {
      if (isValidNumber(bl[0]) && isValidNumber(bl[1])) {
        sourceData.push(bl);
        return;
      }
    })
    sourceData.forEach((bl) => {
      try {
        if (selectMarkerIcon.value == 'redArrowIcon') {
          L.marker([Number(bl[0]), Number(bl[1])], {icon: redArrowIcon}).addTo(map).on('click', (e) => {
            e.target.remove()
          });
        } else if (selectMarkerIcon.value == 'blueArrowIcon') {
          L.marker([Number(bl[0]), Number(bl[1])], {icon: blueArrowIcon}).addTo(map).on('click', (e) => {
            e.target.remove()
          });
        } else {
          L.marker([Number(bl[0]), Number(bl[1])], {icon: greenArrowIcon}).addTo(map).on('click', (e) => {
            e.target.remove()
          });
        }
      } catch (error) {
        displayErrorMessage(error);
        return      
      }
    })
    let temp1 = [];
    sourceData.forEach((bl) => {
      let tempArray = [bl[0], bl[1]];
      temp1.push(tempArray);
    })
    let temp2 = transpose(temp1);
    const southWestPoint = L.latLng([Math.min(...temp2[0]), Math.min(...temp2[1])]);
    const northEastPoint = L.latLng([Math.max(...temp2[0]), Math.max(...temp2[1])]);
    const bounds = L.latLngBounds(southWestPoint, northEastPoint);
    map.fitBounds(bounds);
  }
})

document.getElementById('openBigmap').addEventListener('click', () => {
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
})

document.getElementById('zoomRange').addEventListener('input', (e) => {
  document.getElementById('map').style.transform = "scale(" + e.target.value + ")";
  document.getElementById('zoomRangeValue').value = e.target.value + 'x';
})

function convertXYAndBl(direction, element) {
  const geodeticSystemBeforeConversion = document.getElementById('geodeticSystemBeforeConversion').value;
  const zoneNo = document.getElementById('zoneNo').value;
  const geodeticSystemAfterConversion = document.getElementById('geodeticSystemAfterConversion').value;
  let convertedData = [];
  let sourceData = [];
  if (direction == 'xy2bl') {
    const xyTableData = xyTable.getJson(false);
    xyTableData.forEach((xy) => {
      if (isValidNumber(xy.x) && isValidNumber(xy.y)) {
        sourceData.push(xy);
        return;
      }
    })
    sourceData.forEach((data) => {
      try {
        let temp = proj4(geodeticSystems[geodeticSystemBeforeConversion][zoneNo],
                         geodeticSystems[geodeticSystemAfterConversion][0],
                         [Number(data.y), Number(data.x)]);
        convertedData.push([temp[1], temp[0]]);
      } catch (error) {
        displayErrorMessage(error);
        return;
      }
    });
    blTable.setData(JSON.stringify(convertedData));
  } else {
    const blTableData = blTable.getJson(false);
    blTableData.forEach((bl) => {
      if (isValidNumber(bl.longitude) && isValidNumber(bl.latitude)) {
        sourceData.push(bl);
        return;
      }
    })
    sourceData.forEach((data) => {
      try {
        let temp = proj4(geodeticSystems[geodeticSystemBeforeConversion][0],
                         geodeticSystems[geodeticSystemAfterConversion][zoneNo],
                         [Number(data.longitude), Number(data.latitude)]);
        convertedData.push([temp[1], temp[0]]);
      } catch (error) {
        displayErrorMessage(error);
        return
      }
    })
    xyTable.setData(JSON.stringify(convertedData));
  }
  element.preventDefault();
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