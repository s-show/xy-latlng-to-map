import { isValidNumber } from './isvalidNumber.js';
import { zen2han } from './zen2han.js';
import { sanitizeMemo } from './sanitizeMemo.js';
import { dms2deg } from './DMSLatLngParser.js';
import 'jsuites/dist/jsuites.js';
import 'jsuites/dist/jsuites.css';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import jspreadsheet, {
  WorksheetInstance,
  CellValue,
  JspreadsheetInstanceElement,
} from 'jspreadsheet-ce';

function isJspreadsheetElement(el: HTMLDivElement): el is JspreadsheetInstanceElement {
  return 'spreadsheet' in el;
}

export interface AppTables {
  readonly sourceTable: WorksheetInstance[];
  readonly convertedTable: WorksheetInstance[];
  clearTable(tableName: 'source' | 'converted'): void;
  resizeTable(viewPortWidth: number): void;
  dispose(): void;
}

/*
 * 入力値または貼り付け値を事前確認して不適当なデータを無視する処理。
 * 入力値または貼り付け値に「度 or °」が含まれていなければ、
 * 十進数形式の緯度経度かXY座標と判断して数値以外は無視している。
 * ただし、桁区切りの `,` を取り除けば数値とみなせる値は受け入れる。
 * 入力値または貼り付け値に「度 or °」が含まれていれば、
 * 度分秒形式の緯度経度を十進数形式の緯度経度に変換している。
 *
 * 3列目 memo (tooltip_text) は自由記述の文字列として受け付けるため、
 * onbeforechange で sanitizeMemo() による無害化を行っている。
 */
export const beforechangeSourceTable = (
  _instance: WorksheetInstance,
  _cell: HTMLTableCellElement,
  _x: string | number,
  _y: string | number,
  value: CellValue,
) => {
  if (typeof _x === 'number' && _x < 2) {
    if (typeof value === 'string' && value !== null && value.match(/度|°/) == null) {
      value = value.replace(',', '');
      if (isValidNumber(zen2han(value))) {
        return zen2han(value);
      }
      return '';
    }
    if (typeof value === 'string') {
      return dms2deg(value);
    }
  }
  if (typeof _x === 'number' && _x === 2) {
    return sanitizeMemo(value);
  }
  return value;
};

/**
 * 変換元テーブルにデータを貼り付けて空行がなくなったら行を追加する
 */
const afterPaste = (instance: WorksheetInstance): void => {
  const tableData: CellValue[][] = instance.getData();
  const tableRows: number = tableData.length;
  const lastRowData: CellValue[] = tableData[tableRows - 1];
  if (lastRowData[0] != '' && lastRowData[1] != '') {
    instance.insertRow(1);
  }
};

const sourceTableContextMenuItems = (
  obj: WorksheetInstance,
  x: string | number | null,
  y: string | number | null,
) => {
  console.info(obj);
  const newItems = [];
  newItems.push({
    title: '行を削除',
    onclick: () => {
      if (y !== null && y !== undefined) {
        obj.deleteRow(obj.getSelectedRows().length ? undefined : parseInt(y.toString(), 10));
      }
    },
  });
  newItems.push({
    title: '貼り付け',
    shortcut: 'Ctrl + V',
    onclick: () => {
      if (x !== null && x !== undefined && y !== null && y !== undefined) {
        navigator.clipboard
          .readText()
          .then((text) => {
            obj.paste(+x, +y, text);
          })
          .catch((error) => {
            console.error('Clipboard access failed. Please use Ctrl+V instead.', error);
            alert('クリップボードへのアクセスに失敗しました。Ctrl+Vをお使いください。');
          });
      }
    },
  });
  return newItems;
};

const convertedTableContextMenuItems = (obj: WorksheetInstance) => [
  {
    title: 'データを全てコピー',
    shortcut: 'Ctrl + C',
    onclick: () => {
      obj.selectAll();
      obj.copy();
      obj.resetSelection();
    },
  },
];

const worksheetConfig = {
  allowInsertColumn: false,
  allowManualInsertColumn: false,
  allowDeleteColumn: false,
};

const columnsConfig = [
  {
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
  {
    type: 'text' as const,
    title: 'memo',
    width: 110,
    name: 'tooltip_text',
  },
];

const readonlyColumnsConfig = columnsConfig.map((col) => ({ ...col, readOnly: true }));

function createInitialTableData(): number[][] {
  return [
    [110.1, 51.1],
    [120.2, 52.2],
    [30.3, 53.3],
  ];
}

export function createAppTables(doc: Document = document): AppTables {
  jspreadsheet.setDictionary({
    deleteSelectedRows: '選択した行を削除',
    copy: '表の値をコピー',
    paste: '表に値を貼り付け',
  });

  const sourceEl = doc.getElementById('source-data-table') as HTMLDivElement | null;
  const convertedEl = doc.getElementById('converted-data-table') as HTMLDivElement | null;
  if (sourceEl === null || convertedEl === null) {
    throw new Error('Table containers #source-data-table and #converted-data-table are required.');
  }

  const sourceTable = jspreadsheet(sourceEl, {
    worksheets: [
      {
        ...worksheetConfig,
        data: createInitialTableData(),
        columns: [...columnsConfig],
      },
    ],
    onbeforechange: beforechangeSourceTable,
    contextMenu: sourceTableContextMenuItems,
    onpaste: afterPaste,
  });

  const convertedTable = jspreadsheet(convertedEl, {
    worksheets: [
      {
        ...worksheetConfig,
        data: createInitialTableData(),
        columns: [...readonlyColumnsConfig],
      },
    ],
    contextMenu: convertedTableContextMenuItems,
  });

  return {
    sourceTable,
    convertedTable,
    clearTable(tableName: 'source' | 'converted'): void {
      const tableData: CellValue[][] = [['', '']];
      if (tableName === 'source') {
        sourceTable[0].setData(tableData);
      } else {
        convertedTable[0].setData(tableData);
      }
    },
    resizeTable(viewPortWidth: number): void {
      if (viewPortWidth < 992) {
        sourceTable[0].setWidth([0, 1], [75, 75, 70]);
        sourceTable[0].hideIndex();
        convertedTable[0].setWidth([0, 1], [60, 60, 60]);
        convertedTable[0].hideIndex();
      } else if (viewPortWidth <= 1400) {
        sourceTable[0].setWidth([0, 1], [105, 105, 105]);
        sourceTable[0].hideIndex();
        convertedTable[0].setWidth([0, 1], [90, 90, 80]);
        convertedTable[0].hideIndex();
      } else if (viewPortWidth <= 1800) {
        sourceTable[0].setWidth([0, 1], [125, 125, 135]);
        sourceTable[0].showIndex();
        convertedTable[0].setWidth([0, 1], [125, 125, 135]);
        convertedTable[0].showIndex();
      } else {
        sourceTable[0].setWidth([0, 1], [140, 140, 160]);
        sourceTable[0].showIndex();
        convertedTable[0].setWidth([0, 1], [140, 140, 160]);
        convertedTable[0].showIndex();
      }
    },
    dispose(): void {
      if (isJspreadsheetElement(sourceEl)) {
        jspreadsheet.destroy(sourceEl);
      }
      if (isJspreadsheetElement(convertedEl)) {
        jspreadsheet.destroy(convertedEl);
      }
    },
  };
}
