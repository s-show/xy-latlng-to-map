import { isValidNumber } from "./isvalidNumber";
import { zen2han } from "./zen2han";

// 直接入力では数値以外は入力できないように設定しているので、アプリで使えない値が貼付けされた場合の処理を記述している。
const beforechange = (instance, cell, x, y, value) => {
  if (isValidNumber(zen2han(value))) {
    return zen2han(value);
  } else {
    return '';
  }
}

// 行削除以外のメニューは不要なので表示させていない
const contextMenuItems = (obj, x, y, e) => {
  let items = [];
  if (y != null) {
    if (obj.options.allowDeleteRow == true) {
      items.push({
        title: obj.options.text.deleteSelectedRows,
        onclick: function() {
            obj.deleteRow(obj.getSelectedRows().length ? undefined : parseInt(y));
        }
      });
    }
  }
  // Line
  items.push({ type:'line' });
  return items;
}

const beforeDeleteColumn = (instance, cell, x, y, value) => {
  return false;
}

// コンテキストメニューに表示するメニューの日本語訳
const text = {
  deleteSelectedRows: '選択した行を削除',
}

const initTableData = [
  [110.1000, 51.1000],
  [120.2000, 52.2000],
  [130.3000, 53.3000]
];

const xytable = jspreadsheet(document.getElementById('xyTable'), {
  data: initTableData,
  columns: [
    // mask: キーを設定しないと入力制限がかからないので設定している
    { type: 'numeric', title: 'X', mask: '0.0000', width: 140, name: 'x' },
    { type: 'numeric', title: 'y', mask: '0.0000', width: 140, name: 'y' }
  ],
  onbeforechange: beforechange,
  contextMenu: contextMenuItems,
  onbeforedeletecolumn: beforeDeleteColumn,
  text: text,
  freezeColumns: 2,
});

const bltable = jspreadsheet(document.getElementById('blTable'), {
  data: initTableData,
  columns: [
    { type: 'numeric', title: '緯度', mask: '0.0000', width: 140, name: 'latitude' },
    { type: 'numeric', title: '経度', mask: '0.0000', width: 140, name: 'longitude' }
  ],
  onbeforechange: beforechange,
  contextMenu: contextMenuItems,
  text: text,
  freezeColumns: 2,
});

export { xytable, bltable }