import { zen2han } from "./zen2han";
// 浮動小数点を扱うため、念のため `big.js` を使用している
import Big from 'big.js';

function extractNumber(latlngStr) {
  const tempStr1 = latlngStr.replace(/北緯|東経/, '');
  const tempStr2 = tempStr1.replace(/南緯|西経/, '-'); 
  const tempStr3 = zen2han(tempStr2);
  const reg = /[-－]?([0-9０-９]*[.．])?[0-9０-９]+/gu;
  const array = tempStr3.match(reg);
  // 「北緯35度39分29秒1572」の形式だと [35, 39, 29, 1572] となるので、
  // 3番目の値を「29.1572」に変換する。
  // if (array.length == 4) {
  //   const temp = array[2] + '.' + array[3];
  //   array[2] = temp;
  //   array.pop();
  // }
  const result = array.map(x => Number(x));
  return result;
}

function dms2deg(latlngStr) {
  // 丸め処理については、地理院地図が小数点以下6桁で表示されているため、
  // この変換処理でも同じ桁数とする。
  const latlng = extractNumber(latlngStr);
  let result = new Big(0);
  let deg = new Big(latlng[0]);
  let min = new Big(latlng[1]);
  let sec = new Big(latlng[2]);
  if (deg.gt(0)) {
    result = deg.plus(min.div(60)).plus(sec.div(3600));
  } else {
    result = deg.minus(min.div(60)).minus(sec.div(3600));
  }
  return Number(result.toFixed(6));
}

export { extractNumber, dms2deg }
