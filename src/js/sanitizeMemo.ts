import { CellValue } from 'jspreadsheet-ce';

/**
 * 3列目 memo (tooltip_text) 用のサニタイズ。
 *
 * memo は以下の受け口でそのまま使われるため、入力時点で素のテキストに無害化する。
 * - Leaflet の bindPopup() は文字列を innerHTML に代入するため、HTML インジェクションの受け口になる
 * - CSV エクスポートされ、Excel 等で開かれた場合に数式として評価される可能性がある
 * - jspreadsheet のセル描画は textContent を使うため、この列は HTML として解釈されない
 *
 * 無害化の内容
 * 1. 文字列以外は文字列化 (配列・オブジェクト等は空文字として破棄)
 * 2. 改行を \n に正規化し、改行以外の制御文字 (NUL・ESC・DEL・C1 制御文字) を除去
 * 3. ゼロ幅文字・Bidi 制御文字・BOM など不可視文字を除去 (Trojan Source 対策)
 * 4. HTML タグ・コメント・CDATA・宣言を再帰的に除去
 * 5. 残った半角 `<` は全角 `＜` に置換し、HTML として解釈不能被せる
 * 6. 前後の空白を除去し、連続した空行を詰める
 * 7. javascript: などの危険な URL スキームはコロンを `∶` に置換して無効化する
 * 8. CSV 数式インジェクション対策として `= + - @` 始まりの値に `'` を接頭辞する
 * 9. MAX_MEMO_LENGTH 超を切り捨てる
 */

/** memo 列に保存する文字数の上限。超えた部分は切り捨てる。 */
export const MAX_MEMO_LENGTH = 200;

/** 数式として解釈され得る開始文字に付ける接頭辞。無効化したくない場合は false にする。 */
export const GUARD_CSV_FORMULA = true;

/** 改行 (\n) とタブ (\t) を残した、改行以外の C0/C1 制御文字と DEL */
// eslint-disable-next-line no-control-regex -- 意図的に制御文字を除去するためのパターン
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g;

/** ゼロ幅文字・Bidi 制御文字・BOM など、表示されないまま挙動を変え得る文字 */
const INVISIBLE_CHARS = /[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g;

/** HTML コメント・CDATA・処理命令・宣言。終端記号が無い場合は末尾まで除去する。 */
const HTML_DECLARATIONS = /<!--[\s\S]*?(?:-->|$)|<!\[CDATA\[[\s\S]*?(?:\]\]>|$)|<\?[\s\S]*?(?:\?>|$)|<!doctype[^>]*>/gi;

/** HTML タグ。開始文字が英字・`!`・`/`・`?` のものを対象にする。 */
const HTML_TAGS = /<\/?[a-z!?/][^>]*>/gi;

/** 終端の `>` が欠落したタグの残りかす (例: `<img src=x onerror=alert(1)`) */
const TAG_FRAGMENT = /<\/?[a-z][a-z0-9-]*(?:\s[^>]*)?$/i;

/** 危険な URL スキーム */
const DANGEROUS_SCHEME = /^(javascript|livescript|jscript|vbscript|data|blob|file|about)\s*:/i;

/** 全角スペースを含む前後の空白を除去する */
function trimAll(text: string): string {
  return text.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
}

/**
 * memo 列の入力値を、HTML として安全な素のテキストに変換する。
 * @param  value 表に入力・貼り付けされた値
 * @return 無害化済みの文字列。採用しない値は空文字。
 */
export function sanitizeMemo(value: CellValue | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  let text: string;
  if (typeof value === 'string') {
    text = value;
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    text = String(value);
  } else {
    // 配列・オブジェクト・関数などの構造化データは採用しない
    return '';
  }

  // 改行を \n に正規化し、改行以外の制御文字と不可視文字を除去する
  text = text.replace(/\r\n?/g, '\n');
  text = text.replace(CONTROL_CHARS, '');
  text = text.replace(INVISIBLE_CHARS, '');

  // `<scr<script>ipt>` のように除去後に再構成される入れ子タグを、タグが消えるまで繰り返して除去する
  let before: string;
  do {
    before = text;
    text = text.replace(HTML_DECLARATIONS, '');
    text = text.replace(HTML_TAGS, '');
  } while (text !== before);

  // 入力の末尾で `>` が閉じられていないタグの残りかすも除去する
  text = text.replace(TAG_FRAGMENT, '');

  // タグの残骸となった半角 `<` を全角に置換し、HTML タグとして解釈され得なくする
  text = text.replace(/</g, '＜');

  // 前後の空白を除去し、連続した空行を 1 行に詰める
  text = text.replace(/\n{3,}/g, '\n\n');
  text = trimAll(text);

  // 危険なスキームはコロンを置換して、リンク化・評価されても動作しないようにする
  text = text.replace(DANGEROUS_SCHEME, (_matched: string, scheme: string) => `${scheme}∶`);

  // CSV を表計算ソフトで開いた際のセル数式インジェクション対策
  if (GUARD_CSV_FORMULA && /^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  // サロゲートペアを分割しないように文字数で切り捨てる
  const chars = Array.from(text);
  if (chars.length > MAX_MEMO_LENGTH) {
    text = chars.slice(0, MAX_MEMO_LENGTH).join('');
  }

  return text;
}
