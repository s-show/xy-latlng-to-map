import { MAX_MEMO_LENGTH } from './sanitizeMemo.js';

/** 改行 (\n) とタブ (\t) を残した、改行以外の C0/C1 制御文字と DEL */
// eslint-disable-next-line no-control-regex -- 意図的に制御文字を除去するためのパターン
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g;

/** ゼロ幅文字・Bidi 制御文字・BOM など、表示されないまま挙動を変え得る文字 */
const INVISIBLE_CHARS = /[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g;

function trimAll(text: string): string {
  return text.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
}

/**
 * 地図ポップアップ表示用のメモ文字列を正規化する。
 * ポップアップ描画側で textContent を使うため、CSV 数式インジェクション用の
 * 先頭アポストロフィは付与せず、制御文字・不可視文字の除去と文字数上限のみ適用する。
 */
export function normalizeDisplayMemo(raw: string): string {
  let text = raw.replace(/\r\n?/g, '\n');
  text = text.replace(CONTROL_CHARS, '');
  text = text.replace(INVISIBLE_CHARS, '');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = trimAll(text);

  const chars = Array.from(text);
  if (chars.length > MAX_MEMO_LENGTH) {
    text = chars.slice(0, MAX_MEMO_LENGTH).join('');
  }
  return text;
}

/**
 * Leaflet の bindPopup に安全に渡せるテキスト専用 DOM ノードを生成する。
 * Leaflet は文字列を HTML として解釈するため、DOM の textContent を使うことで
 * URL クエリや API 経由の入力による XSS を防ぐ。
 */
export function createSafePopupContent(text: string, doc: Document = document): HTMLDivElement {
  const container = doc.createElement('div');
  container.textContent = text;
  return container;
}
