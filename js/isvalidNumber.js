// 厳密な数値型判定ではなく、アプリ内で使える数値か否かの確認に留めている。
// そのため、0をfalseと判定している。
function isValidNumber(data) {
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

export { isValidNumber }