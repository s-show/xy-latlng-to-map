import L from 'leaflet';

export interface PrintTableLike {
  setWidth(column: number, width: number): void;
  hideIndex(): void;
  showIndex(): void;
}

export interface PrintSetupDeps {
  readonly map: L.Map;
  readonly sourceTable: PrintTableLike;
  readonly doc?: Document;
  readonly win?: Window;
}

// 印刷モード時に非表示にするラジオボタンのリスト
const NO_PRINT_RADIO_NAMES: readonly string[] = [
  'source-data-type',
  'source-geodetic-system',
  'convert-to-data-type',
  'convert-to-geodetic-system',
];

// 印刷用サイズ定数（A4 横・余白 10mm の印刷可能領域）
// _layout.scss の @page (size: A4 landscape; margin: 10mm) と一致させること。
const PRINT_PAPER_MM = { w: 297, h: 210 };
const PRINT_MARGIN_MM = 10;
const PRINT_AREA_W = `${PRINT_PAPER_MM.w - 2 * PRINT_MARGIN_MM}mm`;
const PRINT_AREA_H = `${PRINT_PAPER_MM.h - 2 * PRINT_MARGIN_MM}mm`;

/**
 * 印刷前後のスタイル・テーブル幅・Leaflet サイズ再計算リスナーを登録する。
 * 返り値の関数を呼ぶと登録したイベントリスナーをすべて解除できる。
 */
export function setupPrint(deps: PrintSetupDeps): () => void {
  const { map, sourceTable } = deps;
  const doc = deps.doc ?? document;
  const win = deps.win ?? window;
  const mapContainer = doc.querySelector<HTMLElement>('.map-container');
  const controller = new AbortController();
  const { signal } = controller;
  let printSizeApplied = false;

  const applyPrintSize = () => {
    if (printSizeApplied || !mapContainer) return;
    mapContainer.style.flex = 'none';
    mapContainer.style.width = PRINT_AREA_W;
    mapContainer.style.height = PRINT_AREA_H;
    void mapContainer.offsetHeight;
    map.invalidateSize({ animate: false });
    printSizeApplied = true;
  };

  const removePrintSize = () => {
    if (!printSizeApplied || !mapContainer) return;
    mapContainer.style.flex = '';
    mapContainer.style.width = '';
    mapContainer.style.height = '';
    void mapContainer.offsetHeight;
    map.invalidateSize({ animate: false });
    printSizeApplied = false;
  };

  const preparePrint = () => {
    sourceTable.setWidth(0, 110);
    sourceTable.setWidth(1, 110);
    sourceTable.hideIndex();
    doc.querySelectorAll('.d-print-none').forEach((el) => {
      el.classList.add('d-none');
    });
    NO_PRINT_RADIO_NAMES.forEach((radioName) => {
      doc.querySelectorAll<HTMLInputElement>(`input[name=${radioName}]`).forEach((radioBtn) => {
        if (!radioBtn.checked && radioBtn.parentElement !== null) {
          radioBtn.parentElement.classList.add('d-none');
        }
      });
    });
    applyPrintSize();
    if (typeof win.requestAnimationFrame === 'function') {
      win.requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    }
  };

  const afterPrint = () => {
    sourceTable.setWidth(0, 180);
    sourceTable.setWidth(1, 180);
    sourceTable.showIndex();
    doc.querySelectorAll('.d-print-none').forEach((el) => {
      el.classList.remove('d-none');
    });
    NO_PRINT_RADIO_NAMES.forEach((radioName) => {
      doc.querySelectorAll<HTMLInputElement>(`input[name=${radioName}]`).forEach((radioBtn) => {
        if (!radioBtn.checked && radioBtn.parentElement !== null) {
          radioBtn.parentElement.classList.remove('d-none');
        }
      });
    });
    removePrintSize();
    win.setTimeout(() => map.invalidateSize(), 100);
  };

  win.addEventListener('beforeprint', preparePrint, { signal });
  win.addEventListener('afterprint', afterPrint, { signal });

  if (typeof win.matchMedia === 'function') {
    const printMQ = win.matchMedia('print');
    const onMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        applyPrintSize();
        if (typeof win.requestAnimationFrame === 'function') {
          win.requestAnimationFrame(() => map.invalidateSize({ animate: false }));
        }
      } else {
        removePrintSize();
      }
    };
    printMQ.addEventListener('change', onMediaChange, { signal });
  }

  return () => {
    controller.abort();
  };
}
