import { zen2han } from "./zen2han";
// 浮動小数点を扱うため、念のため `big.js` を使用している
import Big from 'big.js';

function extractNumber(latlngStr: string) {
  // 東経|北緯に向かう緯度経度は十進法では正の値になるので単純に文字を削除する
  // 南緯|西経に向かう緯度経度は十進法では負の値になるので'-'に置き換える
  const tempStr1 = latlngStr.replace(/北緯|東経/, '');
  const tempStr2 = tempStr1.replace(/南緯|西経/, '-');

  // 北緯/南緯・東経/西経以外で緯度経度に付される全角文字を削除・変換する
  const tempStr3 = zen2han(tempStr2);

  // 度分秒形式の緯度経度を数値の配列に分割する
  // 北緯35度39分29秒1572 → [35, 39, 29.1572]
  // 南緯35度40分39.2秒 → [-35, 40, 39.2]
  const array = tempStr3.match(/[-－]?([0-9０-９]*[.．])?[0-9０-９]+/gu);

  if (array !== null) {
    return array.map(x => Number(x));
  } else {
    return false
  }
}

// 
/**
 * 度分秒形式の緯度経度を十進法形式の緯度経度に変換する 
 */
function dms2deg(latlngStr: string) {
  // 丸め処理については、地理院地図が小数点以下6桁で表示されているため、
  // この変換処理でも同じ桁数とする。
  const latlng = extractNumber(latlngStr);
  let result = new Big(0);
  if (latlng !== false) {
    let deg = new Big(latlng[0]);
    let min = new Big(latlng[1]);
    let sec = new Big(latlng[2]);
    if (deg.gt(0)) {
      result = deg.plus(min.div(60)).plus(sec.div(3600));
    } else {
      result = deg.minus(min.div(60)).minus(sec.div(3600));
    }
    return Number(result.toFixed(6));
  } else {
    return false
  }
}

export { extractNumber, dms2deg }
