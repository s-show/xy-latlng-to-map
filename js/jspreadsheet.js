import { isValidNumber } from "./isvalidNumber";
import { zen2han } from "./zen2han";
import { dms2deg } from "../js/DMSLatLngParser.js";
import "jsuites/dist/jsuites.js";
import "jsuites/dist/jsuites.css";
import "jspreadsheet-ce/dist/jspreadsheet.css";
import jspreadsheet from "jspreadsheet-ce";

/* 
 * 入力値または貼り付け値を事前確認して不適当なデータを無視する処理。
 * 入力値または貼り付け値に「度 or °」が含まれていなければ、
 * 十進数形式の緯度経度かXY座標と判断して数値以外は無視している。
 * ただし、桁区切りの `,` を取り除けば数値とみなせる値は受け入れる。
 * 入力値または貼り付け値に「度 or °」が含まれていれば、
 * 度分秒形式の緯度経度を十進数形式の緯度経度に変換している。
*/
const beforechange = (instance, cell, x, y, value) => {
  if (value.match(/度|°/) == null) {
    value = value.replace(',', '');
    if (isValidNumber(zen2han(value))) {
      return zen2han(value);
    } else {
      return '';
    }
  } else {
    return dms2deg(value);
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