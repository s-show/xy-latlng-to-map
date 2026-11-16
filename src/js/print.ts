import { sourceTable } from './jspreadsheet.js';
import { map } from './map.js';

// 印刷モード時に非表示にするラジオボタンのリスト
const noPrintRadioBtn: string[] = [
  'source-data-type',
  'source-geodetic-system',
  'convert-to-data-type',
  'convert-to-geodetic-system'
];

// 印刷用サイズ定数（A4 横・余白 10mm の印刷可能領域）
// _layout.scss の @page (size: A4 landscape; margin: 10mm) と一致させること。
const PRINT_PAPER_MM = { w: 297, h: 210 }; // A4 landscape
const PRINT_MARGIN_MM = 10;
const PRINT_AREA_W = (PRINT_PAPER_MM.w - 2 * PRINT_MARGIN_MM) + 'mm'; // 277mm
const PRINT_AREA_H = (PRINT_PAPER_MM.h - 2 * PRINT_MARGIN_MM) + 'mm'; // 190mm
const mapContainer = document.querySelector<HTMLElement>('.map-container');
let printSizeApplied = false;

// 印刷時に地図コンテナを用紙サイズへ固定し、Leaflet に「同期的に」サイズ再計算させる。
// 【背景】@media print でコンテナを縮小しても、beforeprint の時点では印刷レイアウトが
// 未適用のため map.invalidateSize() が画面サイズを読んでしまい再配置されない。setTimeout
// で遅延させると今度は印刷スナップショットに間に合わず、タイルが画面サイズ時の配置の
// まま残って「左上だけが印刷される」現象になる。
// 【対策】beforeprint 内でインラインstyleにより確定サイズ(mm)を与えてから invalidateSize
// を同期呼び出しする。mm 単位は @page の余白と一致するため用紙とぴったり合う。
function applyPrintSize() {
  if (printSizeApplied || !mapContainer) return;
  mapContainer.style.flex = 'none';
  mapContainer.style.width = PRINT_AREA_W;
  mapContainer.style.height = PRINT_AREA_H;
  // 新しい寸法を確定させるため強制リフロー
  void mapContainer.offsetHeight;
  map.invalidateSize({ animate: false });
  printSizeApplied = true;
}

function removePrintSize() {
  if (!printSizeApplied || !mapContainer) return;
  mapContainer.style.flex = '';
  mapContainer.style.width = '';
  mapContainer.style.height = '';
  void mapContainer.offsetHeight;
  map.invalidateSize({ animate: false });
  printSizeApplied = false;
}

/**
 * 印刷しないパーツを非表示にする処理
 */
function preparePrint() {
  sourceTable[0].setWidth(0, 110);
  sourceTable[0].setWidth(1, 110);
  sourceTable[0].hideIndex();
  const notPrintDoms = document.querySelectorAll('.d-print-none');
  notPrintDoms.forEach((notPrintDom) => {
    notPrintDom.classList.add('d-none');
  })
  noPrintRadioBtn.forEach((radioBtn) => {
    document.querySelectorAll<HTMLInputElement>('input[name=' + radioBtn + ']').forEach((radioBtn) => {
      if (!radioBtn.checked && radioBtn.parentElement !== null) {
        radioBtn.parentElement.classList.add('d-none')
      }
    })
  })
  // 地図コンテナを印刷用サイズへ固定し、同期的に Leaflet に再計算させる。
  // インラインで確定サイズを与えることで印刷スナップショット前にタイルが再配置され、
  // 現在の地図中心が用紙中央に来る（左上切り出し問題の修正）。
  applyPrintSize();
  // プレビューのリフロー追従のため次フレームでも再計算
  requestAnimationFrame(() => map.invalidateSize({ animate: false }));
}

/**
 * 非表示にした印刷しないパーツを表示する処理
 */
function afterPrint() {
  sourceTable[0].setWidth(0, 180);
  sourceTable[0].setWidth(1, 180);
  sourceTable[0].showIndex();
  const notPrintDoms = document.querySelectorAll('.d-print-none');
  notPrintDoms.forEach((notPrintDom) => {
    notPrintDom.classList.remove('d-none');
  })
  noPrintRadioBtn.forEach((radioBtn) => {
    document.querySelectorAll<HTMLInputElement>('input[name=' + radioBtn + ']').forEach((radioBtn) => {
      if (!radioBtn.checked && radioBtn.parentElement !== null) {
        radioBtn.parentElement.classList.remove('d-none')
      }
    })
  })
  // 印刷用サイズを解除し、画面サイズへ復元する
  removePrintSize();
  // 念のため遅延再計算（フレックスレイアウトの復元追従）
  setTimeout(() => map.invalidateSize(), 100);
}

// 印刷用のスタイル変更処理
// 処理1: 印刷時にデータテーブルの幅を狭くし、印刷終了後に幅を戻す処理
// 処理2: 選択していないラジオボタンを印刷時に非表示にし、印刷終了後に戻す処理。
export function setupPrint() {
  window.addEventListener("beforeprint", () => {
    preparePrint();
  });
  window.addEventListener("afterprint", () => {
    afterPrint();
  });

  // 印刷プレビューのリフロー追従のため matchMedia('print') でもサイズ再計算する。
  // beforeprint は1回しか発火しないため、念のためこちらでも同期で再適用する (Issue #11)。
  if (window.matchMedia) {
    const printMQ = window.matchMedia('print');
    printMQ.addEventListener('change', (e) => {
      if (e.matches) {
        applyPrintSize();
        requestAnimationFrame(() => map.invalidateSize({ animate: false }));
      } else {
        removePrintSize();
      }
    });
  }
}
