/**
 * 2つの値の差が指定値より小さい場合に同じと判定する関数
 * @param {number} num1 確認すべき値1
 * @param {number} num2 確認すべき値2
 * @param {number} epsilon 同じと判定する際の閾値。デフォルト値は 2.0E-14。
 * @return {boolean} 2つの値の差が閾値未満なら true を返し、差が閾値以上 or 数値以外の値が渡された場合は false。
 */
export function isNearlyEqual(num1, num2, epsilon = 2.0e-14) {
  if (num1 == '' || num2 == '' || epsilon == '') {
    return false;
  } else if (isNaN(Number(num1)) || isNaN(Number(num2)) || isNaN(Number(epsilon))) {
    return false;
  } else if (epsilon == 0) {
    return false;
  } else {
    return Math.abs(num1 - num2) < epsilon;
  }
}
