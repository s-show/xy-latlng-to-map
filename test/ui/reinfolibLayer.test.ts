/**
 * 不動産情報ライブラリ関連ロジックのテスト。
 *
 * 検証対象:
 * - オーバーレイレイヤー生成（プロキシURL未設定時は空、設定時は6レイヤー、ズーム制限）
 * - 緯度経度→XYZタイル座標変換
 * - 点と多角形（穴・MultiPolygon含む）の包含判定
 * - `_index` からのデータ基準時点の抽出
 * - クリック地点情報からのポップアップHTML組み立て（日本語ラベル・指定無し・XSS対策）
 *
 * 検証限界（手動確認対象）:
 * - 実際の地図クリックからポップアップ表示までの一連の動作
 * - プロキシ（Cloudflare Workers）との実通信
 * このテストはネットワークアクセスを一切行わない。
 */
import L from 'leaflet';
import {
  getReinfolibOverlays,
  REINFOLIB_LAYER_DEFINITIONS,
  latLngToTileCoords,
  isPointInGeometry,
  extractAsOfFromIndex,
  buildCombinedPopupHtml,
  LayerPointInfo,
} from '../../src/js/reinfolibLayer.js';

describe('getReinfolibOverlays', () => {
  it('プロキシURLが未設定の場合は空のオブジェクトを返す', () => {
    expect(getReinfolibOverlays(undefined)).toEqual({});
    expect(getReinfolibOverlays('')).toEqual({});
  });

  it('プロキシURLが設定されている場合、定義された数だけレイヤーを生成する', () => {
    const overlays = getReinfolibOverlays('https://example.com/proxy');
    const keys = Object.keys(overlays);
    expect(keys).toHaveLength(REINFOLIB_LAYER_DEFINITIONS.length);
  });

  it('生成されたレイヤーはすべて L.GridLayer のインスタンスで、ズームレベル11〜15に制限されている', () => {
    const overlays = getReinfolibOverlays('https://example.com/proxy');
    for (const layer of Object.values(overlays)) {
      expect(layer).toBeInstanceOf(L.GridLayer);
      expect(layer.options.minZoom).toBe(11);
      expect(layer.options.maxZoom).toBe(15);
    }
  });

  it('末尾スラッシュ付きのプロキシURLでもレイヤーを生成できる', () => {
    const overlays = getReinfolibOverlays('https://example.com/proxy/');
    expect(Object.keys(overlays)).toHaveLength(REINFOLIB_LAYER_DEFINITIONS.length);
  });
});

describe('latLngToTileCoords', () => {
  it('東京駅付近の座標を既知のタイル座標に変換する', () => {
    // 標準的なXYZタイル変換式（国土地理院地図等でも用いられる）による既知の変換結果
    const { x, y } = latLngToTileCoords(35.681236, 139.767125, 15);
    expect(x).toBe(29105);
    expect(y).toBe(12903);
  });

  it('タイル座標は 0 以上 2^z 未満の範囲に収まる', () => {
    const { x, y } = latLngToTileCoords(85, 179.9, 11);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(2 ** 11);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThan(2 ** 11);
  });
});

describe('isPointInGeometry', () => {
  const square: [number, number][] = [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
    [0, 0],
  ];

  it('Polygonの内側の点を判定する', () => {
    expect(isPointInGeometry([5, 5], { type: 'Polygon', coordinates: [square] })).toBe(true);
  });

  it('Polygonの外側の点を判定する', () => {
    expect(isPointInGeometry([50, 50], { type: 'Polygon', coordinates: [square] })).toBe(false);
  });

  it('穴（ドーナツ状）の内側は除外する', () => {
    const hole: [number, number][] = [
      [4, 4],
      [4, 6],
      [6, 6],
      [6, 4],
      [4, 4],
    ];
    const withHole = { type: 'Polygon', coordinates: [square, hole] };
    expect(isPointInGeometry([5, 5], withHole)).toBe(false); // 穴の中
    expect(isPointInGeometry([1, 1], withHole)).toBe(true); // 穴の外・図形の内側
  });

  it('MultiPolygonのいずれかの多角形に含まれれば true', () => {
    const other: [number, number][] = [
      [20, 20],
      [20, 30],
      [30, 30],
      [30, 20],
      [20, 20],
    ];
    const multi = { type: 'MultiPolygon', coordinates: [[square], [other]] };
    expect(isPointInGeometry([25, 25], multi)).toBe(true);
    expect(isPointInGeometry([5, 5], multi)).toBe(true);
    expect(isPointInGeometry([100, 100], multi)).toBe(false);
  });

  it('Point・LineString等は判定対象外として false を返す', () => {
    expect(isPointInGeometry([5, 5], { type: 'Point', coordinates: [5, 5] })).toBe(false);
    expect(
      isPointInGeometry([5, 5], { type: 'LineString', coordinates: [[0, 0], [10, 10]] }),
    ).toBe(false);
  });

  it('geometryが無い場合は false を返す', () => {
    expect(isPointInGeometry([5, 5], null)).toBe(false);
    expect(isPointInGeometry([5, 5], undefined)).toBe(false);
  });
});

describe('extractAsOfFromIndex', () => {
  it('末尾12桁をデータ基準時点として解釈する', () => {
    expect(extractAsOfFromIndex('bs001_use_area_202607231142')).toBe('2026年7月23日 11:42');
  });

  it('形式に一致しない場合は null を返す', () => {
    expect(extractAsOfFromIndex('invalid')).toBeNull();
    expect(extractAsOfFromIndex(undefined)).toBeNull();
    expect(extractAsOfFromIndex(123)).toBeNull();
  });
});

describe('buildCombinedPopupHtml', () => {
  const [xkt001, xkt002] = REINFOLIB_LAYER_DEFINITIONS;

  it('情報が無いレイヤーは「指定無し」と表示する', () => {
    const results: LayerPointInfo[] = [{ definition: xkt001, properties: null, asOf: null }];
    const html = buildCombinedPopupHtml(results);
    expect(html).toContain(xkt001.name);
    expect(html).toContain('指定無し');
  });

  it('属性項目名を日本語ラベルで表示する', () => {
    const results: LayerPointInfo[] = [
      {
        definition: xkt002,
        properties: { use_area_ja: '準工業地域', u_floor_area_ratio_ja: '300%', _index: 'x', _id: 'y' },
        asOf: null,
      },
    ];
    const html = buildCombinedPopupHtml(results);
    expect(html).toContain('用途地域');
    expect(html).toContain('準工業地域');
    expect(html).toContain('容積率');
    expect(html).toContain('300%');
    // 内部管理項目は表示しない
    expect(html).not.toContain('_index');
    expect(html).not.toContain('_id');
  });

  it('データ基準時点があれば表示する', () => {
    const results: LayerPointInfo[] = [
      { definition: xkt002, properties: { use_area_ja: '工業地域' }, asOf: '2026年7月23日 11:42' },
    ];
    const html = buildCombinedPopupHtml(results);
    expect(html).toContain('2026年7月23日 11:42');
    expect(html).toContain('時点のデータ');
  });

  it('空文字列の属性値は表示しない', () => {
    const results: LayerPointInfo[] = [
      { definition: xkt001, properties: { decision_date: '', area_classification_ja: '都市計画区域' }, asOf: null },
    ];
    const html = buildCombinedPopupHtml(results);
    expect(html).not.toContain('決定日');
    expect(html).toContain('都市計画区域');
  });

  it('属性のキー・値をHTMLエスケープする（XSS対策）', () => {
    const results: LayerPointInfo[] = [
      {
        definition: xkt002,
        properties: { '<script>alert(1)</script>': '"><img src=x onerror=alert(2)>' },
        asOf: null,
      },
    ];
    const html = buildCombinedPopupHtml(results);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(2)&gt;');
  });
});
