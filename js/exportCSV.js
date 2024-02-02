function arrayToCSV(array) {
  if (getArrayDepth(array) < 2) {
    return false;
  }
  let csvData = array.flatMap((row) => {
    return row.join(',');
  }).join('\n');
  return csvData;
}

function exportCSV(tableData, header=null) {
  if (getArrayDepth(header) == 1) {
    tableData.unshift(header)
  }
  if (getArrayDepth(tableData) >= 2) {
    const blob = new Blob([arrayToCSV(tableData)], { type: 'text/csv;charset=utf-8,' })
    return blob;
  } else {
    return false;
  }
}

function getArrayDepth(value) {
  return Array.isArray(value) ?
    1 + Math.max(0, ...value.map(getArrayDepth)) :
    0;
}

export { arrayToCSV, exportCSV, getArrayDepth }