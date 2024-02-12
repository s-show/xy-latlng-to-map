import { isValidNumber } from './isvalidNumber';
import { zen2han } from './zen2han';
import { dms2deg } from '../js/DMSLatLngParser.js';
import 'jsuites/dist/jsuites.js';
import 'jsuites/dist/jsuites.css';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import jspreadsheet from 'jspreadsheet-ce';

/*
 * 入力値または貼り付け値を事前確認して不適当なデータを無視する処理。
 * 入力値または貼り付け値に「度 or °」が含まれていなければ、
 * 十進数形式の緯度経度かXY座標と判断して数値以外は無視している。
 * ただし、桁区切りの `,` を取り除けば数値とみなせる値は受け入れる。
 * 入力値または貼り付け値に「度 or °」が含まれていれば、
 * 度分秒形式の緯度経度を十進数形式の緯度経度に変換している。
 */
const beforechangeSourceTable = (instance, cell, x, y, value) => {
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
};

/**
 * 結果を表示する表への貼り付けは禁止する。
 * コードは https://bossanova.uk/jspreadsheet/v4/docs/most-common-questions-and-answers を参照
 */
const beforePasteConvertedTable = () => {
  return false;
};

/**
 * 変換元テーブルにデータを貼り付けて空行がなくなったら行を追加する
 * キーボードから入力する場合、行は自動的に追加される。
 */
const afterPaste = (instance) => {
  const tableRows = sourceTable.options.data.length; // テーブルの行数を格納
  const lastRowData = sourceTable.options.data[tableRows - 1];
  if (lastRowData[0] != '' && lastRowData[1] != '') {
    instance.jspreadsheet.insertRow(1);
  }
};

/**
 * 行削除・貼り付けのみ表示するようにしている
 * コードは https://github.com/jspreadsheet/ce/blob/master/src/index.js を参照
 */
const sourceTableContextMenuItems = (obj, x, y, e) => {
  let items = [];
  if (obj.options.allowDeleteRow == true) {
    items.push({
      title: obj.options.text.deleteSelectedRows,
      onclick: () => {
        obj.deleteRow(obj.getSelectedRows().length ? undefined : parseInt(y));
      },
    });
    items.push({
      title: obj.options.text.paste,
      shortcut: 'Ctrl + V',
      onclick: () => {
        if (obj.selectedCell) {
          navigator.clipboard.readText().then((text) => {
            if (text) {
              jspreadsheet.current.paste(obj.selectedCell[0], obj.selectedCell[1], text);
            }
          });
        }
      },
    });
  }
  return items;
};
/**
 * コピーのみ表示するようにしている
 * コードは https://github.com/jspreadsheet/ce/blob/master/src/index.js を参照
 */
const convertedTableContextMenuItems = (obj, x, y, e) => {
  let items = [];
  if (obj.options.allowDeleteRow == true) {
    items.push({
      title: obj.options.text.copy,
      shortcut: 'Ctrl + C',
      onclick: () => {
        obj.copy();
      },
    });
  }
  return items;
};

// instance.jspreadsheet.colgroup.length は列追加前の列数。
// 列数が2なら列追加・列削除の必要は無いので false を返してキャンセルする
const beforeDeleteColumn = (instance, cell, x, y, value) => {
  if (instance.jspreadsheet.colgroup.length == 2) {
    return false;
  }
};
const beforeInsertColumn = (instance, cell, x, y, value) => {
  if (instance.jspreadsheet.colgroup.length == 2) {
    return false;
  }
};

// コンテキストメニューに表示するメニューの日本語訳
const text = {
  deleteSelectedRows: '選択した行を削除',
  copy: '表の値をコピー',
  paste: '表に値を貼り付け',
};

const initTableData = [
  [110.1, 51.1],
  [120.2, 52.2],
  [130.3, 53.3],
];

const columnsConfig = [
  { type: 'numeric', title: 'X(緯度)', width: 180, name: 'x_latitude' },
  { type: 'numeric', title: 'Y(経度)', width: 180, name: 'y_longitude' },
];

export const sourceTable = jspreadsheet(document.getElementById('sourceDataTable'), {
  data: initTableData,
  columns: columnsConfig,
  onbeforechange: beforechangeSourceTable,
  contextMenu: sourceTableContextMenuItems,
  onbeforedeletecolumn: beforeDeleteColumn,
  onbeforeinsertcolumn: beforeInsertColumn,
  onpaste: afterPaste,
  text: text,
  freezeColumns: 2,
});

export const convertedTable = jspreadsheet(document.getElementById('convertedDataTable'), {
  data: initTableData,
  columns: columnsConfig,
  onbeforepaste: beforePasteConvertedTable,
  contextMenu: convertedTableContextMenuItems,
  onbeforedeletecolumn: beforeDeleteColumn,
  onbeforeinsertcolumn: beforeInsertColumn,
  text: text,
  freezeColumns: 2,
});

// テーブルのデータを削除する関数
export function clearTable(e, tableName) {
  const tableData = [[,]];
  if (tableName == 'source') {
    sourceTable.setData(tableData);
  } else {
    convertedTable.setData(tableData);
  }
  e.preventDefault();
}

export function resizeTable(viewPortWidth) {
  // viewPortWidth <= 992 で col-lg-* が適用される
  // viewPortWidth < 992 でデータテーブルと地図が縦並びになるのでテーブルの幅を戻している。
  if (viewPortWidth < 992) {
    sourceTable.setWidth(0, 180);
    sourceTable.setWidth(1, 180);
    sourceTable.showIndex();
    convertedTable.setWidth(0, 180);
    convertedTable.setWidth(1, 180);
    convertedTable.showIndex();
  } else if (viewPortWidth <= 1400) {
    sourceTable.setWidth(0, 110);
    sourceTable.setWidth(1, 110);
    sourceTable.hideIndex();
    convertedTable.setWidth(0, 110);
    convertedTable.setWidth(1, 110);
    convertedTable.hideIndex();
  } else if (viewPortWidth <= 1800) {
    sourceTable.setWidth(0, 110);
    sourceTable.setWidth(1, 110);
    sourceTable.showIndex();
    convertedTable.setWidth(0, 110);
    convertedTable.setWidth(1, 110);
    convertedTable.showIndex();
  } else {
    sourceTable.setWidth(0, 180);
    sourceTable.setWidth(1, 180);
    sourceTable.showIndex();
    convertedTable.setWidth(0, 180);
    convertedTable.setWidth(1, 180);
    convertedTable.showIndex();
  }
}
