import { isValidNumber } from "./isvalidNumber";
import { zen2han } from "./zen2han";
import "jsuites/dist/jsuites.js";
import "jsuites/dist/jsuites.css";
import "jspreadsheet-ce/dist/jspreadsheet.css";
import jspreadsheet from "jspreadsheet-ce";

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

// 行削除とコピー以外のメニューは不要なので表示させていない
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
      items.push({
        title: obj.options.text.copy,
        // icon: 'content_copy',
        shortcut: 'Ctrl + C',
        onclick: function() {
            obj.copy();
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
  copy: '表の値をコピー',
}

const initTableData = [
  [110.1000, 51.1000],
  [120.2000, 52.2000],
  [130.3000, 53.3000]
];

const columnsConfig = [
  { type: 'numeric', title: 'X(緯度)', width: 180, name: 'x_latitude' },
  { type: 'numeric', title: 'Y(経度)', width: 180, name: 'y_longitude' }
]

const sourceTable = jspreadsheet(document.getElementById('sourceDataTable'), {
  data: initTableData,
  columns: columnsConfig,
  onbeforechange: beforechange,
  contextMenu: contextMenuItems,
  onbeforedeletecolumn: beforeDeleteColumn,
  onbeforeinsertcolumn: beforeInsertColumn,
  text: text,
  freezeColumns: 2,
});

const convertedTable = jspreadsheet(document.getElementById('convertedDataTable'), {
  data: initTableData,
  columns: columnsConfig,
  onbeforechange: beforechange,
  contextMenu: contextMenuItems,
  onbeforedeletecolumn: beforeDeleteColumn,
  onbeforeinsertcolumn: beforeInsertColumn,
  text: text,
  freezeColumns: 2,
});

export { sourceTable, convertedTable }