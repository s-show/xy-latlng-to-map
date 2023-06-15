import { isValidNumber } from "./isvalidNumber";
import { zen2han } from "./zen2han";

// 変換できるのは数値だけなので、数値以外は無視するようにしている。
// ただし、桁区切りで使われる `,` を取り除けば数値とみなせる値は受け入れている。
const beforechange = (instance, cell, x, y, value) => {
  value = value.replace(',', '');
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

// instance.jspreadsheet.colgroup.length は列追加前の列数。
// 列数が2なら列追加・列削除の必要は無いので false を返してキャンセルする
const beforeDeleteColumn = (instance, cell, x, y, value) => {
  if (instance.jspreadsheet.colgroup.length == 2) {
    return false;
  }
}
const beforeInsertColumn = (instance, cell, x, y, value) => {
  if (instance.jspreadsheet.colgroup.length == 2) {
    return false;
  }
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
    { type: 'numeric', title: 'X', width: 180, name: 'x' },
    { type: 'numeric', title: 'y', width: 180, name: 'y' }
  ],
  onbeforechange: beforechange,
  contextMenu: contextMenuItems,
  onbeforedeletecolumn: beforeDeleteColumn,
  onbeforeinsertcolumn: beforeInsertColumn,
  text: text,
  freezeColumns: 2,
});

const bltable = jspreadsheet(document.getElementById('blTable'), {
  data: initTableData,
  columns: [
    { type: 'numeric', title: '緯度', width: 180, name: 'latitude' },
    { type: 'numeric', title: '経度', width: 180, name: 'longitude' }
  ],
  onbeforechange: beforechange,
  contextMenu: contextMenuItems,
  onbeforedeletecolumn: beforeDeleteColumn,
  onbeforeinsertcolumn: beforeInsertColumn,
  text: text,
  freezeColumns: 2,
});

export { xytable, bltable }