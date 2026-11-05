import { CellValue } from "jspreadsheet-ce";
import { MAX_MEMO_LENGTH, sanitizeMemo } from "../src/js/sanitizeMemo.js";

test('通常のメモはそのまま保持される', () => {
  expect(sanitizeMemo('現場周辺の通行止めあり')).toBe('現場周辺の通行止めあり');
  expect(sanitizeMemo('地点B (2F) "詰所"')).toBe('地点B (2F) "詰所"');
  expect(sanitizeMemo('35°00\'N 139°45\'E 付近')).toBe('35°00\'N 139°45\'E 付近');
});

test('空文字・null・undefined は空文字になる', () => {
  expect(sanitizeMemo('')).toBe('');
  expect(sanitizeMemo(null)).toBe('');
  expect(sanitizeMemo(undefined)).toBe('');
});

test('数値と真偽値は文字列化される', () => {
  expect(sanitizeMemo(123)).toBe('123');
  expect(sanitizeMemo(true)).toBe('true');
});

test('配列やオブジェクトなどの構造化データは空文字として破棄される', () => {
  expect(sanitizeMemo(['a', 'b'] as unknown as CellValue)).toBe('');
  expect(sanitizeMemo({ toString: () => 'x' } as unknown as CellValue)).toBe('');
  expect(sanitizeMemo(() => 'x' as unknown as CellValue)).toBe('');
});

test('script要素はタグだけが除去され残ったテキストは実行できない', () => {
  expect(sanitizeMemo('<script>alert(1)</script>')).toBe('alert(1)');
  expect(sanitizeMemo('<SCRIPT SRC=//evil.example/x.js></SCRIPT>')).toBe('');
  expect(sanitizeMemo('<img src=x onerror=alert(1)>')).toBe('');
  expect(sanitizeMemo('<svg/onload=alert(1)>')).toBe('');
  expect(sanitizeMemo('<a href="javascript:alert(1)">x</a>')).toBe('x');
  expect(sanitizeMemo('<!-- <script>alert(1)</script> -->')).toBe('');
  expect(sanitizeMemo('<![CDATA[<b>alert(1)</b>]]>')).toBe('');
  expect(sanitizeMemo('<?xml version="1.0"?><b>x</b>')).toBe('x');
  expect(sanitizeMemo('<!DOCTYPE html><img src=x onerror=alert(1)>')).toBe('');
});

test('除去後に再構成される入れ子タグも「<」を残さない', () => {
  // 残った文字列は HTML として解釈されない素のテキストになる
  expect(sanitizeMemo('<scr<script>ipt>alert(1)</scr<script>ipt>')).toBe('ipt>alert(1)ipt>');
  expect(sanitizeMemo('<i<sc<script>ript>alert(1)</i<sc<script>ript>')).toBe('ript>alert(1)ript>');
});

test('結果として半角の「<」が残らず全角に置き換わる', () => {
  expect(sanitizeMemo('a < b')).toBe('a ＜ b');
  expect(sanitizeMemo('100 < 200')).toBe('100 ＜ 200');
  expect(sanitizeMemo('<b>強調')).toBe('強調');
  expect(sanitizeMemo('<b')).toBe('');
  expect(sanitizeMemo('<img')).toBe('');
  expect(sanitizeMemo('<img src=x onerror=alert(1)')).toBe('');
  const samples = ['<', '<<<', '<img', 'a<b>c', '<a href=x>y', '<b>強調', 'a </b', '<script>alert(1)</script>'];
  samples.forEach((sample) => {
    expect(sanitizeMemo(sample)).not.toContain('<');
  });
});

test('危険な URL スキームはコロンを置換して無効化する', () => {
  expect(sanitizeMemo('javascript:alert(1)')).toBe('javascript∶alert(1)');
  expect(sanitizeMemo('  JaVaScRiPt : alert(1)')).toBe('JaVaScRiPt∶ alert(1)');
  expect(sanitizeMemo('data:text/html;base64,PHNjcmlwdD4=')).toBe('data∶text/html;base64,PHNjcmlwdD4=');
  expect(sanitizeMemo('vbscript:msgbox(1)')).toBe('vbscript∶msgbox(1)');
  // 通常のテキストは変更しない
  expect(sanitizeMemo('http://example.com/a')).toBe('http://example.com/a');
  expect(sanitizeMemo('12:30 到着')).toBe('12:30 到着');
});

test('ゼロ幅文字・Bidi 制御文字・BOM は除去される', () => {
  expect(sanitizeMemo('a\u200Bb\u2066c\uFEFF')).toBe('abc');
  expect(sanitizeMemo('a\u202E\u2067b\u202c')).toBe('ab');
  expect(sanitizeMemo('soft\u00ADhyphen')).toBe('softhyphen');
  // ゼロ幅文字で隠されたスキームも無効化される
  expect(sanitizeMemo('ja\u200Bvascript:alert(1)')).toBe('javascript∶alert(1)');
});

test('改行以外の制御文字は除去され改行とタブは残る', () => {
  expect(sanitizeMemo('a\u0000b\u001Bc\u007Fd')).toBe('abcd');
  expect(sanitizeMemo('a\r\nb\rc\nd')).toBe('a\nb\nc\nd');
  expect(sanitizeMemo('a\tb')).toBe('a\tb');
  expect(sanitizeMemo('a\u0085b')).toBe('ab');
});

test('前後の空白を除去し連続した空行は1つに詰める', () => {
  expect(sanitizeMemo('  memo  ')).toBe('memo');
  expect(sanitizeMemo('\u3000\tメモ\n')).toBe('メモ');
  expect(sanitizeMemo('a\n\n\n\n\nb')).toBe('a\n\nb');
});

test('CSV 数式インジェクションの始まりにはプレフィックスを付ける', () => {
  expect(sanitizeMemo('=1+1')).toBe("'=1+1");
  expect(sanitizeMemo('=HYPERLINK("http://evil/x","click")')).toBe("'=HYPERLINK(\"http://evil/x\",\"click\")");
  expect(sanitizeMemo('+39999;DDECMD')).toBe("'+39999;DDECMD");
  expect(sanitizeMemo('-5m 地点')).toBe("'-5m 地点");
  expect(sanitizeMemo('@SUM(A1:A9)')).toBe("'@SUM(A1:A9)");
  expect(sanitizeMemo('\t=1+1')).toBe("'=1+1");
  // 通常のテキストには付けない
  expect(sanitizeMemo('100m 地点')).toBe('100m 地点');
  expect(sanitizeMemo('A-1 区画')).toBe('A-1 区画');
});

test('長さは上限で切り捨てられサロゲートペアは分割しない', () => {
  expect(sanitizeMemo('あ'.repeat(MAX_MEMO_LENGTH + 100))).toBe('あ'.repeat(MAX_MEMO_LENGTH));
  const result = sanitizeMemo('🐍'.repeat(MAX_MEMO_LENGTH + 50));
  expect(Array.from(result).length).toBe(MAX_MEMO_LENGTH);
  expect(result).toBe('🐍'.repeat(MAX_MEMO_LENGTH));
  expect(result).not.toContain('\uFFFD');
});

test('HTML エンティティはデコードせずそのまま残す', () => {
  expect(sanitizeMemo('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('サニタイズを2回適用しても結果が変わらない', () => {
  const samples = [
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '=1+1',
    'a\u200B<b>c',
    'a\r\nb\tc',
  ];
  samples.forEach((sample) => {
    const once = sanitizeMemo(sample);
    expect(sanitizeMemo(once)).toBe(once);
  });
});

test('タブを含むテキストはタブを保持し、先頭がタブでも数式ガードが付く', () => {
  expect(sanitizeMemo('a\tb')).toBe('a\tb');
  expect(sanitizeMemo('\t=1+1')).toBe("'=1+1");
});
