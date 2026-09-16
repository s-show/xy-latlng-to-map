/**
 * 住所検索（国土地理院 住所検索API連携）関連ロジックのテスト。
 *
 * 検証対象:
 * - リクエストURLの組み立て
 * - レスポンス（GeoJSON Feature配列）のパース（正常系・不正形式の除外）
 * - searchAddress のネットワーク呼び出し（fetchをモック）
 *
 * 検証限界（手動確認対象）:
 * - 実際のAPIとの通信、実際のレスポンス形式との整合性
 */
import { jest } from '@jest/globals';
import { buildGsiSearchUrl, parseGsiSearchResponse, searchAddress } from '../src/js/addressSearch.js';

describe('buildGsiSearchUrl', () => {
  it('クエリパラメータ q に住所文字列を設定したURLを組み立てる', () => {
    const url = buildGsiSearchUrl('広島県広島市');
    expect(url).toBe('https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%BA%83%E5%B3%B6%E7%9C%8C%E5%BA%83%E5%B3%B6%E5%B8%82');
  });
});

describe('parseGsiSearchResponse', () => {
  it('正常なレスポンスをタイトル・緯度・経度の配列に変換する（座標は[経度,緯度]の順）', () => {
    const data = [
      {
        geometry: { coordinates: [139.7413574722, 35.6580992222], type: 'Point' },
        type: 'Feature',
        properties: { title: '広島県広島市中区基町', addressCode: '34101' },
      },
    ];
    expect(parseGsiSearchResponse(data)).toEqual([
      { title: '広島県広島市中区基町', lat: 35.6580992222, lng: 139.7413574722 },
    ]);
  });

  it('複数件の候補をそのまま配列で返す', () => {
    const data = [
      { geometry: { coordinates: [132.45, 34.39] }, properties: { title: '広島県広島市中区' } },
      { geometry: { coordinates: [131.47, 34.18] }, properties: { title: '山口県山口市' } },
    ];
    expect(parseGsiSearchResponse(data)).toHaveLength(2);
  });

  it('配列でないレスポンスは空配列を返す', () => {
    expect(parseGsiSearchResponse(undefined)).toEqual([]);
    expect(parseGsiSearchResponse(null)).toEqual([]);
    expect(parseGsiSearchResponse({})).toEqual([]);
  });

  it('該当なしの場合（空配列）はそのまま空配列を返す', () => {
    expect(parseGsiSearchResponse([])).toEqual([]);
  });

  it('座標やタイトルが欠けている要素は除外する', () => {
    const data = [
      { geometry: { coordinates: [139.7, 35.6] }, properties: { title: '正常なデータ' } },
      { geometry: { coordinates: [139.7] }, properties: { title: '座標が不足' } },
      { geometry: { coordinates: [139.7, 35.6] }, properties: {} },
      { geometry: {}, properties: { title: 'タイトルのみ' } },
      { geometry: { coordinates: ['a', 'b'] }, properties: { title: '座標が数値でない' } },
      {},
    ];
    expect(parseGsiSearchResponse(data)).toEqual([
      { title: '正常なデータ', lat: 35.6, lng: 139.7 },
    ]);
  });
});

describe('searchAddress', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('空文字・空白のみの入力ではAPIを呼ばずに空配列を返す', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(await searchAddress('')).toEqual([]);
    expect(await searchAddress('   ')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('正常なレスポンスをパースして返す', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { geometry: { coordinates: [139.7, 35.6] }, properties: { title: '東京都' } },
      ],
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const results = await searchAddress('東京都');
    expect(results).toEqual([{ title: '東京都', lat: 35.6, lng: 139.7 }]);
    expect(fetchMock).toHaveBeenCalledWith(buildGsiSearchUrl('東京都'));
  });

  it('HTTPエラー時は例外を投げる', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(searchAddress('広島県')).rejects.toThrow('住所検索に失敗しました (HTTP 500)');
  });
});
