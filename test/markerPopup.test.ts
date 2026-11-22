import { normalizeDisplayMemo } from '../src/js/markerPopup';
import { isIconColor, isLineColorName, LINE_COLORS } from '../src/js/colors';

describe('normalizeDisplayMemo', () => {
  test('先頭が -, +, =, @ の表示用メモに CSV 用アポストロフィを付けない', () => {
    expect(normalizeDisplayMemo('-1F 入口')).toBe('-1F 入口');
    expect(normalizeDisplayMemo('+81-3-0000-0000')).toBe('+81-3-0000-0000');
    expect(normalizeDisplayMemo('=A1')).toBe('=A1');
    expect(normalizeDisplayMemo('@tokyo')).toBe('@tokyo');
  });

  test('制御文字・不可視文字を除去し、改行正規化と前後空白除去を行う', () => {
    expect(normalizeDisplayMemo('　\u200b東京\u0000タワー\r\n\r\n\r\n展望台　')).toBe('東京タワー\n\n展望台');
  });

  test('200 文字を超えるメモはサロゲートペアを壊さずに切り捨てる', () => {
    const emoji = '🗼'.repeat(210);
    expect(Array.from(normalizeDisplayMemo(emoji))).toHaveLength(200);
  });
});

describe('colors', () => {
  test('アイコン色と線色の判定が一貫している', () => {
    expect(isIconColor('red')).toBe(true);
    expect(isIconColor('none')).toBe(false);
    expect(isLineColorName('yellow')).toBe(true);
    expect(isLineColorName('no')).toBe(false);
    expect(LINE_COLORS.get('blue')).toBe('#1e90ff');
  });
});
