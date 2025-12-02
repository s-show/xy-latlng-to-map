/**
 * 2つの値の差が指定値より小さい場合に同じと判定する関数
 * @param {number | string} num1 確認すべき値1
 * @param {number | string} num2 確認すべき値2
 * @param {number | string} epsilon 同じと判定する際の閾値。デフォルト値は 2.0E-14。
 * @return {boolean} 2つの値の差が閾値未満なら true を返し、差が閾値以上 or 数値以外の値が渡された場合は false。
 */
export function isNearlyEqual(num1: number | string, num2: number | string, epsilon: number | string = 2.0e-14): boolean {
  const n1 = Number(num1);
  const n2 = Number(num2);
  const eps = Number(epsilon);

  if (isNaN(n1) || isNaN(n2) || isNaN(eps)) {
    return false;
  } else if (eps == 0) {
    return false;
  } else {
    return Math.abs(n1 - n2) < eps;
  }
}
