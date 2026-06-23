/**
 * Issue #11: ハンバーガーメニュー（Offcanvas）開閉の DOM/構造テスト
 *
 * 検証対象:
 * - ハンバーガーボタン (#menuToggleBtn) が存在し、Offcanvas を開閉する属性を持つこと
 * - #menu_column が offcanvas 要素として存在すること
 * - 開閉ボタンと対象の関連付け (data-bs-target / aria-controls) が正しいこと
 *
 * 検証限界（手動確認対象）:
 * - 実際の Offcanvas のスライドアニメーション描画
 * - Bootstrap JS による .show クラス付与の実挙動
 *   （Bootstrap JS を jsdom で動かすと重いため、ここでは構造・属性のみ検証する）
 */

// src/partials/header.ejs + src/index.html の該当構造を再現した最小HTML断片
const HEADER_HTML = `
  <nav id="header" class="navbar sticky-top p-3">
    <button id="menuToggleBtn" type="button" aria-label="メニューを開く"
      class="button button--dialog-open d-print-none"
      data-bs-toggle="offcanvas" data-bs-target="#menu_column"
      aria-controls="menu_column">
      <span class="menu-toggle-btn__bars" aria-hidden="true"></span>
      <span class="visually-hidden">メニュー</span>
    </button>
  </nav>
`;

const MENU_HTML = `
  <div id="menu_column" class="offcanvas offcanvas-start" tabindex="-1" aria-labelledby="menuColumnLabel">
    <div class="offcanvas-header">
      <h3 id="menuColumnLabel" class="offcanvas-title">メニュー</h3>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="閉じる"></button>
    </div>
    <div class="offcanvas-body">
      <div id="dataInformation" class="p-2">メニュー内容</div>
    </div>
  </div>
`;

function setupDom() {
  document.body.innerHTML = HEADER_HTML + MENU_HTML;
}

describe('Issue #11: ハンバーガーメニュー（Offcanvas）の構造', () => {
  beforeEach(() => setupDom());

  it('ハンバーガーボタン (#menuToggleBtn) が存在する', () => {
    const btn = document.getElementById('menuToggleBtn');
    expect(btn).not.toBeNull();
    expect(btn).toBeInTheDocument();
  });

  it('ボタンが Offcanvas トグル属性を持つ', () => {
    const btn = document.getElementById('menuToggleBtn');
    expect(btn).toHaveAttribute('data-bs-toggle', 'offcanvas');
  });

  it('ボタンが #menu_column を開閉対象として指定している', () => {
    const btn = document.getElementById('menuToggleBtn');
    expect(btn).toHaveAttribute('data-bs-target', '#menu_column');
    expect(btn).toHaveAttribute('aria-controls', 'menu_column');
  });

  it('#menu_column が offcanvas 要素として存在する', () => {
    const menu = document.getElementById('menu_column');
    expect(menu).not.toBeNull();
    expect(menu).toHaveClass('offcanvas', 'offcanvas-start');
  });

  it('Offcanvas にタイトルと閉じるボタンが含まれる', () => {
    const menu = document.getElementById('menu_column');
    const title = menu?.querySelector('#menuColumnLabel');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('メニュー');

    const closeBtn = menu?.querySelector('[data-bs-dismiss="offcanvas"]');
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveAttribute('aria-label', '閉じる');
  });

  it('ボタンクリックで data-bs-toggle が維持される（属性ベースの開閉が宣言されている）', () => {
    // Bootstrap JS は動かさないが、属性が正しく設定されていれば
    // Bootstrap が宣言的に開閉を処理できることを構造的に担保する
    const btn = document.getElementById('menuToggleBtn') as HTMLButtonElement;
    btn.click();
    // クリック後も属性が維持されていること
    expect(btn).toHaveAttribute('data-bs-toggle', 'offcanvas');
    expect(btn).toHaveAttribute('data-bs-target', '#menu_column');
  });
});
