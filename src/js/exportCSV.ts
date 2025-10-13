function arrayToCSV(array: string[][]) {
  let csvData = array.flatMap((row) => {
    return row.join(',');
  }).join('\n');
  return csvData;
}

function exportCSV(tableData: string[][]): false | Blob {
  if (getArrayDepth(tableData) >= 2) {
    const blob = new Blob(
      [
        new Uint8Array([0xEF, 0xBB, 0xBF]), // UTF-8のBOM無しだとExcelで文字化けする
        arrayToCSV(tableData)
      ],
      { type: 'text/csv;charset=utf-8,' }
    )
    return blob;
  } else {
    return false;
  }
}

// https://stackoverflow.com/a/55420461/20038726
type NestedArray<T> = T | NestedArray<T>[];

function getArrayDepth<T>(value: NestedArray<T>): number {
  if (!Array.isArray(value)) {
    return 0;
  }

  return 1 + Math.max(0, ...value.map((item) => getArrayDepth(item)));
}

export { arrayToCSV, exportCSV, getArrayDepth }
