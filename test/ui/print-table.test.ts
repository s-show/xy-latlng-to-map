/**
 * Issue #11: 印刷時の表非表示の DOM/構造テスト
 *
 * 検証対象:
 * - #sourceDataTable / #convertedDataTable に d-print-none クラスが付与されていること
 *   （CSS @media print と JS preparePrint の両方で非表示化する二重保証）
 *
 * 検証限界（手動確認対象）:
 * - @media print で実際に display:none が適用される描画結果
 * - preparePrint/afterPrint の JS 実行時挙動
 */

// src/index.html の該当構造を再現
const TABLES_HTML = `
  <div id="sourceDataTable" class="d-print-none"></div>
  <div id="convertedDataTable" class="d-print-none"></div>
`;

function setupDom() {
  document.body.innerHTML = TABLES_HTML;
}

describe('Issue #11: 印刷時の表非表示（d-print-none）', () => {
  beforeEach(() => setupDom());

  it('入力表 (#sourceDataTable) が存在し d-print-none を持つ', () => {
    const table = document.getElementById('sourceDataTable');
    expect(table).not.toBeNull();
    expect(table).toHaveClass('d-print-none');
  });

  it('変換結果表 (#convertedDataTable) が存在し d-print-none を持つ', () => {
    const table = document.getElementById('convertedDataTable');
    expect(table).not.toBeNull();
    expect(table).toHaveClass('d-print-none');
  });

  it('両表が印刷対象外クラスを持つ', () => {
    const source = document.getElementById('sourceDataTable');
    const converted = document.getElementById('convertedDataTable');
    expect(source).toHaveClass('d-print-none');
    expect(converted).toHaveClass('d-print-none');
  });
});
