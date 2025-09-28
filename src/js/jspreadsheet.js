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
 * 結果を表示する表への入力を無効化する。
 * 入力前の値を返すことで、入力前の値が入力後の値となる。
 */
const beforeChangeConvertedTable = (instance, cell, x, y, value) => {
  return instance.jspreadsheet.getValueFromCoords(x, y);
};

/**
 * 変換元テーブルにデータを貼り付けて空行がなくなったら行を追加する
 * キーボードから入力する場合、行は自動的に追加される。
 */
const afterPaste = (instance) => {
  const tableRows = sourceTable[0].options.data.length; // テーブルの行数を格納
  const lastRowData = sourceTable[0].options.data[tableRows - 1];
  if (lastRowData[0] != '' && lastRowData[1] != '') {
    instance.insertRow(1);
  }
};

/**
 * 行削除・貼り付けのみ表示するようにしている
 * コードは https://github.com/jspreadsheet/ce/blob/master/src/index.js を参照
 */
const sourceTableContextMenuItems = (obj, x, y, e, items, section) => {
  console.info(obj);
  let newItems = [];
  newItems.push({
    title: '行を削除',
    onclick: () => {
      obj.deleteRow(obj.getSelectedRows().length ? undefined : parseInt(y));
    },
  });
  newItems.push({
    title: '貼り付け',
    shortcut: 'Ctrl + V',
    onclick: () => {
      navigator.clipboard.readText().then((text) => {
        sourceTable[0].paste(obj.selectedCell[0], obj.selectedCell[1], text);
      })
      .catch(error => {
        console.error('Clipboard access failed. Please use Ctrl+V instead.', error);
        alert('クリップボードへのアクセスに失敗しました。Ctrl+Vをお使いください。');
      });
    },
  });
  return newItems;
};
/**
 * コピーのみ表示するようにしている
 * コードは https://github.com/jspreadsheet/ce/blob/master/src/index.js を参照
 */
const convertedTableContextMenuItems = (obj, x, y, e, items, section) => {
  let newItems = [];
  newItems.push({
    title: 'データを全てコピー',
    shortcut: 'Ctrl + C',
    onclick: () => {
      convertedTable[0].selectAll();
      convertedTable[0].copy();
      convertedTable[0].resetSelection();
    },
  });
  return newItems;
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
  { type: 'numeric', title: 'X(緯度)', width: 110, name: 'x_latitude' },
  { type: 'numeric', title: 'Y(経度)', width: 110, name: 'y_longitude' },
];

export const sourceTable = jspreadsheet(document.getElementById('sourceDataTable'), {
  worksheets: [
    {
      data: initTableData,
      options: columnsConfig,
    }
  ],
  onbeforechange: beforechangeSourceTable,
  contextMenu: sourceTableContextMenuItems,
  onbeforedeletecolumn: beforeDeleteColumn,
  onbeforeinsertcolumn: beforeInsertColumn,
  onpaste: afterPaste,
  text: text,
  freezeColumns: 2,
});

export const convertedTable = jspreadsheet(document.getElementById('convertedDataTable'), {
  worksheets: [
    {
      data: initTableData,
      columns: columnsConfig,
    }
  ],
  onbeforechange: beforeChangeConvertedTable,
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
    sourceTable[0].setData(tableData);
  } else {
    convertedTable[0].setData(tableData);
  }
  e.preventDefault();
}

export function resizeTable(viewPortWidth) {
  // viewPortWidth <= 992 で col-lg-* が適用される
  // viewPortWidth < 992 でデータテーブルと地図が縦並びになるのでテーブルの幅を戻している。
  if (viewPortWidth < 992) {
    sourceTable[0].setWidth([0, 1], [180, 180]);
    sourceTable[0].hideIndex();
    convertedTable[0].setWidth([0, 1], [180, 180]);
    convertedTable[0].hideIndex();
  } else if (viewPortWidth <= 1400) {
    sourceTable[0].setWidth([0, 1], [110, 110]);
    sourceTable[0].hideIndex();
    convertedTable[0].setWidth([0, 1], [110, 110]);
    convertedTable[0].hideIndex();
  } else if (viewPortWidth <= 1800) {
    sourceTable[0].setWidth([0, 1], [110, 110]);
    sourceTable[0].showIndex();
    convertedTable[0].setWidth([0, 1], [110, 110]);
    convertedTable[0].showIndex();
  } else {
    sourceTable[0].setWidth([0, 1], [180, 180]);
    sourceTable[0].showIndex();
    convertedTable[0].setWidth([0, 1], [180, 180]);
    convertedTable[0].showIndex();
  }
}
