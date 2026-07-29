import { formatNoGpsMessage } from '../src/js/formatNoGpsMessage.js';

describe('formatNoGpsMessage: GPS情報なしの通知メッセージ生成', () => {
  it('対象がない場合は null を返す', () => {
    expect(formatNoGpsMessage([])).toBeNull();
  });
  it('1件の場合は指定メッセージ＋ファイル名を返す', () => {
    expect(formatNoGpsMessage(['photo.jpg'])).toBe('この画像にはGPS情報がありません: photo.jpg');
  });
  it('複数件の場合は件数とファイル名リストを返す', () => {
    const result = formatNoGpsMessage(['a.jpg', 'b.jpg', 'c.jpg']);
    expect(result).toBe('3件の画像にGPS情報がありません:\na.jpg, b.jpg, c.jpg');
  });
});
