/**
 * 表に入力されている値がアプリ内で使える値か否かを確認する関数
 * 厳密な数値型判定は必要ないため、0 は false として扱っている。
 * @param data 確認すべき値。表のセルは文字列のほか数値で届くこともある。
 * @return {boolean} アプリ内で使える値なら true、そうでなければ false
 */
export function isValidNumber(data: unknown): boolean {
  if (data == '') {
    return false
  } else if (isNaN(Number(data))) {
    return false
  } else if (Number(data) == 0) {
    return false
  } else {
    return true
  }
}
