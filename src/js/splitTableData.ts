import { CellValue } from 'jspreadsheet-ce';

/**
 * 行内のすべてのセルが空（空文字・空白のみ・null・undefined）か判定する
 * getData() の processed 指定時は行が配列ではなく {"0": 値, "1": 値} 形式の
 * オブジェクトで返るため、Object.values() で両形式に対応している。
 * @param row テーブルの1行分のデータ
 * @return すべてのセルが空なら true
 */
function isBlankRow(row: CellValue[]): boolean {
  return Object.values(row).every(
    (cell) => cell === null || cell === undefined || String(cell).trim() === ''
  );
}

/**
 * テーブルデータを空白行を区切りとしてグループに分割する。
 * 空白行そのものはグループに含めない。連続した空白行や
 * 先頭・末尾の空白行によって生じる空のグループは除外する。
 * @param data テーブルの全行データ
 * @return 空白行で区切られた行グループの配列
 */
export function splitDataByBlankRows(data: CellValue[][]): CellValue[][][] {
  const groups: CellValue[][][] = [];
  let currentGroup: CellValue[][] = [];
  data.forEach((row) => {
    if (isBlankRow(row)) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
    } else {
      currentGroup.push(row);
    }
  });
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  return groups;
}
