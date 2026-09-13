/**
 * 不動産情報ライブラリ関連ロジックのテスト。
 *
 * 検証対象:
 * - オーバーレイレイヤー生成（プロキシURL未設定時は空、設定時は6レイヤー、ズーム制限）
 * - 緯度経度→XYZタイル座標変換
 * - 点と多角形（穴・MultiPolygon含む）の包含判定
 * - `_index` からのデータ基準時点の抽出
 * - クリック地点情報からのポップアップHTML組み立て（日本語ラベル・指定無し・XSS対策）
 * - 印刷用グリッドHTML組み立て（3列グリッド用のセル構造）
 *
 * 検証限界（手動確認対象）:
 * - 実際の地図クリックからポップアップ表示までの一連の動作
 * - 実際の印刷プレビューでの2ページ目のレイアウト・ページ区切り
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
  buildPrintGridHtml,
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

  it('行政区域を表す共通項目（都道府県・市区町村・各種コード）は表示しない', () => {
    const results: LayerPointInfo[] = [
      {
        definition: xkt001,
        properties: {
          prefecture: '東京都',
          city_name: '江東区',
          city_code: '13108',
          group_code: '13108',
          kubun_id: 21,
          area_classification_ja: '都市計画区域',
        },
        asOf: null,
      },
      {
        definition: xkt002,
        properties: { youto_id: 12, use_area_ja: '工業地域' },
        asOf: null,
      },
    ];
    const html = buildCombinedPopupHtml(results);
    expect(html).not.toContain('東京都');
    expect(html).not.toContain('江東区');
    expect(html).not.toContain('13108');
    expect(html).not.toContain('>21<');
    expect(html).not.toContain('>12<');
    expect(html).toContain('都市計画区域');
    expect(html).toContain('工業地域');
  });

  it('土砂災害警戒区域のコード値は指定されたコード表に基づき日本語表記に変換する', () => {
    const xkt029 = REINFOLIB_LAYER_DEFINITIONS.find((d) => d.apiId === 'XKT029')!;
    const results: LayerPointInfo[] = [
      {
        definition: xkt029,
        properties: { A33_001: 2, A33_002: 1, A33_008: 0, A33_006: '熱海市梅園町' },
        asOf: null,
      },
    ];
    const html = buildCombinedPopupHtml(results);
    expect(html).toContain('土石流'); // A33_001 = 2
    expect(html).toContain('土砂災害警戒区域(指定済)'); // A33_002 = 1
    expect(html).toContain('特別警戒区域指定済み'); // A33_008 = 0
    expect(html).toContain('熱海市梅園町');
    // 生のコード値がそのまま出ていないこと
    expect(html).not.toContain('>2<');
    expect(html).not.toContain('>1<');
    expect(html).not.toContain('>0<');
  });

  it('A33_003（都道府県コード）は表示しない', () => {
    const xkt029 = REINFOLIB_LAYER_DEFINITIONS.find((d) => d.apiId === 'XKT029')!;
    const results: LayerPointInfo[] = [
      { definition: xkt029, properties: { A33_003: '22', A33_006: '熱海市梅園町' }, asOf: null },
    ];
    const html = buildCombinedPopupHtml(results);
    expect(html).not.toContain('>22<');
    expect(html).toContain('熱海市梅園町');
  });

  it('容積率・建蔽率は整数値のみ表示する', () => {
    const results: LayerPointInfo[] = [
      {
        definition: xkt002,
        properties: { u_floor_area_ratio_ja: '300.0%', u_building_coverage_ratio_ja: '60.0%' },
        asOf: null,
      },
    ];
    const html = buildCombinedPopupHtml(results);
    expect(html).toContain('300%');
    expect(html).toContain('60%');
    expect(html).not.toContain('300.0%');
    expect(html).not.toContain('60.0%');
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

describe('buildPrintGridHtml', () => {
  const [xkt001, xkt002] = REINFOLIB_LAYER_DEFINITIONS;

  it('レイヤーごとに reinfolib-print-grid__cell で囲んだセルを生成する', () => {
    const results: LayerPointInfo[] = REINFOLIB_LAYER_DEFINITIONS.map((definition) => ({
      definition,
      properties: null,
      asOf: null,
    }));
    const html = buildPrintGridHtml(results);
    // ラッパー要素（#reinfolib-print-info）と同じクラス名を使うと、印刷用CSSの
    // 「内容が入った時だけ表示する」判定が壊れるため、テーブル自体は
    // reinfolib-print-grid__table という別名にしている。
    expect(html).toContain('class="reinfolib-print-grid__table"');
    // 回帰防止: #reinfolib-print-info（ラッパー要素）と同じクラス名を
    // そのまま使ってしまうと、印刷用CSSの表示切り替えが効かなくなる。
    expect(html).not.toContain('class="reinfolib-print-grid"');
    const cellCount = html.split('reinfolib-print-grid__cell').length - 1;
    expect(cellCount).toBe(REINFOLIB_LAYER_DEFINITIONS.length);
  });

  it('table/tr/td による3列×2行の構成になっている（CSS Grid等は印刷での分割に弱いため使わない）', () => {
    const results: LayerPointInfo[] = REINFOLIB_LAYER_DEFINITIONS.map((definition) => ({
      definition,
      properties: null,
      asOf: null,
    }));
    const html = buildPrintGridHtml(results);
    expect(html).toMatch(/^<table class="reinfolib-print-grid__table">.*<\/table>$/);
    const rowCount = html.split('<tr>').length - 1;
    expect(rowCount).toBe(2);
    const firstRow = html.match(/<tr>(.*?)<\/tr>/)?.[1] ?? '';
    const firstRowCellCount = firstRow.split('reinfolib-print-grid__cell').length - 1;
    expect(firstRowCellCount).toBe(3);
  });

  it('ポップアップと同じく日本語ラベル・指定無し・XSS対策が適用される', () => {
    const results: LayerPointInfo[] = [
      { definition: xkt001, properties: null, asOf: null },
      {
        definition: xkt002,
        properties: { use_area_ja: '工業地域', '<script>alert(1)</script>': 'x' },
        asOf: '2026年7月23日 11:42',
      },
    ];
    const html = buildPrintGridHtml(results);
    expect(html).toContain('指定無し');
    expect(html).toContain('用途地域');
    expect(html).toContain('工業地域');
    expect(html).toContain('2026年7月23日 11:42');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
