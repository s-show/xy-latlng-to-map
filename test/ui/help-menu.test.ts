import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const helpTemplate = readFileSync(
  resolve(process.cwd(), 'src/partials/help.ejs'),
  'utf8',
);
const indexTemplate = readFileSync(
  resolve(process.cwd(), 'src/index.html'),
  'utf8',
);

function setupDom() {
  document.body.innerHTML = helpTemplate;
}

describe('使い方ガイドメニュー', () => {
  beforeEach(() => setupDom());

  it('外側のクリックでは閉じないmanual popoverである', () => {
    const helpMenu = document.querySelector('#help-column');

    expect(helpMenu).toBeInTheDocument();
    expect(helpMenu).toHaveAttribute('popover', 'manual');
    expect(helpMenu).toHaveAttribute('aria-labelledby', 'help-column-label');
  });

  it('明示的な閉じるボタンを持つ', () => {
    const closeButton = document.querySelector('#close-help-btn');

    expect(closeButton).toHaveAttribute('commandfor', 'help-column');
    expect(closeButton).toHaveAttribute('command', 'hide-popover');
    expect(closeButton).toHaveAttribute('aria-label', '閉じる');
    expect(closeButton).toHaveClass('overlay-menu__close');
  });

  it('詳しい操作マニュアルを新しいタブで開く', () => {
    const manualLink = document.querySelector<HTMLAnchorElement>('.user-guide__manual-link');

    expect(manualLink).toHaveAttribute('href', './manual.html');
    expect(manualLink).toHaveAttribute('target', '_blank');
    expect(manualLink).toHaveAttribute('rel', 'noopener');
  });

  it('メインメニューにも共通の閉じるボタンを表示する', () => {
    document.body.innerHTML = indexTemplate;
    const closeButton = document.querySelector('#menu-column button[aria-label="閉じる"]');

    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveClass('overlay-menu__close');
  });
});
