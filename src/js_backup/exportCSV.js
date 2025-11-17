function arrayToCSV(array) {
  if (getArrayDepth(array) < 2) {
    return false;
  }
  let csvData = array.flatMap((row) => {
    return row.join(',');
  }).join('\n');
  return csvData;
}

function exportCSV(tableData) {
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
function getArrayDepth(value) {
  return Array.isArray(value) ?
    1 + Math.max(0, ...value.map(getArrayDepth)) :
    0;
}

export { arrayToCSV, exportCSV, getArrayDepth }
