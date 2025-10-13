import { isValidNumber } from './isvalidNumber';
import { zen2han } from './zen2han';
import { dms2deg } from '../js/DMSLatLngParser.js';
import 'jsuites/dist/jsuites.js';
import 'jsuites/dist/jsuites.css';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import jspreadsheet, { WorksheetInstance, ContextMenuItem, ContextMenuRole } from 'jspreadsheet-ce';
import { CellValue } from 'jspreadsheet-ce';

/*
 * 入力値または貼り付け値を事前確認して不適当なデータを無視する処理。
 * 入力値または貼り付け値に「度 or °」が含まれていなければ、
 * 十進数形式の緯度経度かXY座標と判断して数値以外は無視している。
 * ただし、桁区切りの `,` を取り除けば数値とみなせる値は受け入れる。
 * 入力値または貼り付け値に「度 or °」が含まれていれば、
 * 度分秒形式の緯度経度を十進数形式の緯度経度に変換している。
 */
const beforechangeSourceTable = (
  _instance: WorksheetInstance,
  _cell: HTMLTableCellElement,
  _x: string | number,
  _y: string | number,
  value: CellValue
) => {
  if (typeof value === 'string' && value !== null && value.match(/度|°/) == null) {
    // 桁区切りのカンマを取り除く
    value = value.replace(',', '');
    if (isValidNumber(zen2han(value))) {
      return zen2han(value);
    } else {
      return '';
    }
  } else if (typeof value === 'string') {
    return dms2deg(value);
  }
  return value;
};

/**
 * 変換元テーブルにデータを貼り付けて空行がなくなったら行を追加する
 * キーボードから入力する場合、行は自動的に追加される。
 */
const afterPaste = (instance: WorksheetInstance): void => {
  const tableData: CellValue[][] = instance.getData()
  const tableRows: number = tableData.length; // テーブルの行数を格納
  const lastRowData: CellValue[] = tableData[tableRows - 1];
  if (lastRowData[0] != '' && lastRowData[1] != '') {
    instance.insertRow(1);
  }
};

/**
 * 行削除・貼り付けのみ表示するようにしている
 * コードは https://github.com/jspreadsheet/ce/blob/master/src/index.js を参照
 */
const sourceTableContextMenuItems = (
  obj: WorksheetInstance,
  x: string | number | null,
  y: string | number | null,
  _e: PointerEvent,
  _items: ContextMenuItem[], // 本来のコンテキストメニューのメニュー群
  _section: ContextMenuRole // 右クリックした場所の情報
) => {
  console.info(obj);
  let newItems = [];
  newItems.push({
    title: '行を削除',
    onclick: () => {
      if (y !== null && y !== undefined) {
        obj.deleteRow(obj.getSelectedRows().length ? undefined : parseInt(y.toString()));
      }
    },
  });
  newItems.push({
    title: '貼り付け',
    shortcut: 'Ctrl + V',
    onclick: () => {
      if (x !== null && x !== undefined && y !== null && y !== undefined) {
        navigator.clipboard.readText().then((text) => {
          obj.paste(+x, +y, text);
        })
          .catch(error => {
            console.error('Clipboard access failed. Please use Ctrl+V instead.', error);
            alert('クリップボードへのアクセスに失敗しました。Ctrl+Vをお使いください。');
          });
      }
    }
  });
  return newItems;
};
/**
 * コピーのみ表示するようにしている
 * コードは https://github.com/jspreadsheet/ce/blob/master/src/index.js を参照
 */
const convertedTableContextMenuItems = (
  obj: WorksheetInstance,
  _x: string | number | null,
  _y: string | number | null,
  _e: PointerEvent,
  _items: ContextMenuItem[], // 本来のコンテキストメニューのメニュー群
  _section: ContextMenuRole // 右クリックした場所の情報
) => {
  let newItems = [];
  newItems.push({
    title: 'データを全てコピー',
    shortcut: 'Ctrl + C',
    onclick: () => {
      obj.selectAll();
      obj.copy();
      obj.resetSelection();
    },
  });
  return newItems;
};

// コンテキストメニューに表示するメニューの日本語訳
jspreadsheet.setDictionary({
  'deleteSelectedRows': '選択した行を削除',
  'copy': '表の値をコピー',
  'paste': '表に値を貼り付け',
});

const initTableData = [
  [110.1, 51.1],
  [120.2, 52.2],
  [130.3, 53.3],
];

const worksheetConfig = {
  data: initTableData,
  allowInsertColumn: false,
  allowManualInsertColumn: false,
  allowDeleteColumn: false,
  freezeColumns: 2,
};

const columnsConfig = [
  {
    // `as const` 演算子を使って `type` の型を `'numeric'` という文字列リテラル型に変換している。
    // こうしないと `Column` 型の定義に合致しなくなってしまう。
    type: 'numeric' as const,
    title: 'X(緯度)',
    width: 110,
    name: 'x_latitude',
  },
  {
    type: 'numeric' as const,
    title: 'Y(経度)',
    width: 110,
    name: 'y_longitude',
  },
];

// convertedTable用に readonly を追加
const readonlyColumnsConfig = columnsConfig.map(col => ({ ...col, readOnly: true }));

export const sourceTable = jspreadsheet(document.getElementById('sourceDataTable') as HTMLDivElement, {
  worksheets: [
    worksheetConfig,
    {
      columns: columnsConfig,
    },
  ],
  onbeforechange: beforechangeSourceTable,
  contextMenu: sourceTableContextMenuItems,
  onpaste: afterPaste,
});

export const convertedTable = jspreadsheet(document.getElementById('convertedDataTable') as HTMLDivElement, {
  worksheets: [
    worksheetConfig,
    {
      columns: readonlyColumnsConfig,
    },
  ],
  contextMenu: convertedTableContextMenuItems,
});

// テーブルのデータを削除する関数
export function clearTable(e: PointerEvent, tableName: string): void {
  const tableData: CellValue[][] = [['','']];
  if (tableName == 'source') {
    sourceTable[0].setData(tableData);
  } else {
    convertedTable[0].setData(tableData);
  }
  e.preventDefault();
}

export function resizeTable(viewPortWidth: number): void {
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
