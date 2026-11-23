import {
  hasMarkerQueryParams,
  MAX_API_POINTS,
  parseAddMarkersInput,
  parseMarkerQueryParams,
  resolveMarkerCommand,
} from '../src/js/markerApiSchema';

describe('hasMarkerQueryParams', () => {
  test('マーカー関連パラメータが無い URL（UTM 等のみ）は false を返す', () => {
    expect(hasMarkerQueryParams('')).toBe(false);
    expect(hasMarkerQueryParams('?utm_source=test&ref=home')).toBe(false);
  });

  test('マーカー関連パラメータが 1 つでもあれば true を返す', () => {
    expect(hasMarkerQueryParams('?lat=35.6&lng=139.7')).toBe(true);
    expect(hasMarkerQueryParams('?color=red')).toBe(true);
  });
});

describe('parseMarkerQueryParams', () => {
  test('単一点の緯度経度（デフォルト補完込み）をパースする', () => {
    const result = parseMarkerQueryParams('?lat=35.658099&lng=139.741357&memo=-1F%20入口');
    expect(result).toEqual({
      ok: true,
      data: {
        system: { type: 'latlng', geodeticSystem: 'JGD2011', zoneNo: 0 },
        groups: [[{ first: 35.658099, second: 139.741357, memo: '-1F 入口' }]],
        iconColor: 'red',
        lineColor: null,
        zoom: null,
      },
    });
  });

  test('単一点の XY 座標（X=0, Y=0 を含む）をパースする', () => {
    const result = parseMarkerQueryParams('?x=0&y=0&zone=9&geodetic=JGD2011&color=blue&zoom=16');
    expect(result).toEqual({
      ok: true,
      data: {
        system: { type: 'XY', geodeticSystem: 'JGD2011', zoneNo: 9 },
        groups: [[{ first: 0, second: 0, memo: '' }]],
        iconColor: 'blue',
        lineColor: null,
        zoom: 16,
      },
    });
  });

  test('複数点の p パラメータをパースし、メモ内のカンマを保持する', () => {
    const result = parseMarkerQueryParams(
      '?type=latlng&p=35.65858,139.745433,東京タワー,展望台&p=35.65749,139.74824,増上寺&color=green&line=yellow',
    );
    expect(result).toEqual({
      ok: true,
      data: {
        system: { type: 'latlng', geodeticSystem: 'JGD2011', zoneNo: 0 },
        groups: [
          [
            { first: 35.65858, second: 139.745433, memo: '東京タワー,展望台' },
            { first: 35.65749, second: 139.74824, memo: '増上寺' },
          ],
        ],
        iconColor: 'green',
        lineColor: 'yellow',
        zoom: null,
      },
    });
  });

  test('単一点の lat/lng で度分秒形式（日本語・記号・全角・南緯西経）をパースする', () => {
    const jpDms = parseMarkerQueryParams(
      '?lat=北緯35度39分29秒1572&lng=東経139度44分28秒8869&memo=日本経緯度原点',
    );
    expect(jpDms).toEqual({
      ok: true,
      data: {
        system: { type: 'latlng', geodeticSystem: 'JGD2011', zoneNo: 0 },
        groups: [[{ first: 35.658099, second: 139.741357, memo: '日本経緯度原点' }]],
        iconColor: 'red',
        lineColor: null,
        zoom: null,
      },
    });

    const symbolAndSouthWest = parseMarkerQueryParams(
      '?lat=南緯３５度４０分３９．２秒&lng=西経139°46′13.6″',
    );
    expect(symbolAndSouthWest).toEqual({
      ok: true,
      data: {
        system: { type: 'latlng', geodeticSystem: 'JGD2011', zoneNo: 0 },
        groups: [[{ first: -35.677556, second: -139.770444, memo: '' }]],
        iconColor: 'red',
        lineColor: null,
        zoom: null,
      },
    });
  });

  test('複数点の p パラメータで度分秒形式と十進数形式の混在をパースする', () => {
    const result = parseMarkerQueryParams(
      '?type=latlng&p=北緯35度39分53.82秒,東経139度46分13.6秒,地点1&p=40°46′49″,140°49′55″,地点2',
    );
    expect(result).toEqual({
      ok: true,
      data: {
        system: { type: 'latlng', geodeticSystem: 'JGD2011', zoneNo: 0 },
        groups: [
          [
            { first: 35.66495, second: 139.770444, memo: '地点1' },
            { first: 40.780278, second: 140.831944, memo: '地点2' },
          ],
        ],
        iconColor: 'red',
        lineColor: null,
        zoom: null,
      },
    });
  });

  test.each([
    ['座標なしの color のみ', '?color=red', 'EMPTY_POINTS', 'p'],
    ['XY で系番号欠落', '?x=-37900&y=-8300', 'MISSING_ZONE_NO', 'zone'],
    ['XY で系番号 0', '?x=-37900&y=-8300&zone=0', 'INVALID_ZONE_NO', 'zone'],
    ['XY で系番号 20', '?x=-37900&y=-8300&zone=20', 'INVALID_ZONE_NO', 'zone'],
    ['latlng で系番号 9', '?lat=35.6&lng=139.7&zone=9', 'INVALID_ZONE_NO', 'zone'],
    ['lat/lng と x/y の混在', '?lat=35.6&lng=139.7&x=10&y=20&zone=9', 'CONFLICTING_INPUT', 'p'],
    ['lat/lng と p の混在', '?lat=35.6&lng=139.7&p=35.6,139.7', 'CONFLICTING_INPUT', 'p'],
    ['未知の座標種別', '?type=utm&p=35.6,139.7', 'INVALID_COORDINATE_TYPE', 'type'],
    ['未知の測地系', '?lat=35.6&lng=139.7&geodetic=WGS84', 'INVALID_GEODETIC_SYSTEM', 'geodetic'],
    ['数値でない緯度', '?lat=abc&lng=139.7', 'INVALID_COORDINATE', 'lat'],
    ['秒が欠落した度分秒', '?lat=35度40分&lng=139度46分13.6秒', 'INVALID_COORDINATE', 'lat'],
    ['分が 60 以上の度分秒', '?lat=35度60分0秒&lng=139度46分13.6秒', 'INVALID_COORDINATE', 'lat'],
    ['秒が 60 以上の度分秒', '?lat=35度40分60秒&lng=139度46分13.6秒', 'INVALID_COORDINATE', 'lat'],
    ['XY 指定で度分秒を渡す', '?type=XY&zone=9&p=35度40分39.2秒,139度46分13.6秒', 'INVALID_COORDINATE', 'p[0]'],
    ['カンマ無しの p', '?p=35.6', 'INVALID_QUERY_SYNTAX', 'p[0]'],
    ['未対応の色（none も拒否）', '?lat=35.6&lng=139.7&color=none', 'INVALID_ICON_COLOR', 'color'],
    ['未対応の線色', '?lat=35.6&lng=139.7&line=purple', 'INVALID_LINE_COLOR', 'line'],
    ['範囲外のズーム', '?lat=35.6&lng=139.7&zoom=25', 'INVALID_ZOOM', 'zoom'],
  ])('不正クエリ（%s）は %s を返す', (_name, query, expectedCode, expectedField) => {
    const result = parseMarkerQueryParams(query);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.code === expectedCode && e.field === expectedField)).toBe(true);
    }
  });
});

describe('parseAddMarkersInput', () => {
  test('複数グループと XY 座標を正しくパースする', () => {
    const result = parseAddMarkersInput({
      type: 'XY',
      geodeticSystem: 'TOKYO',
      zoneNo: 9,
      groups: [
        [
          { first: -35367.5, second: -6042.1, memo: '点A' },
          { first: -35400, second: -6100 },
        ],
        [{ first: 0, second: 0, memo: '原点' }],
      ],
      iconColor: 'yellow',
      lineColor: 'blue',
      zoom: 14,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        system: { type: 'XY', geodeticSystem: 'TOKYO', zoneNo: 9 },
        groups: [
          [
            { first: -35367.5, second: -6042.1, memo: '点A' },
            { first: -35400, second: -6100, memo: '' },
          ],
          [{ first: 0, second: 0, memo: '原点' }],
        ],
        iconColor: 'yellow',
        lineColor: 'blue',
        zoom: 14,
      },
    });
  });

  test('points と groups の同時指定や上限超過を拒否する', () => {
    const conflict = parseAddMarkersInput({
      points: [{ first: 35.6, second: 139.7 }],
      groups: [[{ first: 35.6, second: 139.7 }]],
    });
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.errors[0].code).toBe('CONFLICTING_INPUT');
    }

    const tooMany = parseAddMarkersInput({
      points: Array.from({ length: MAX_API_POINTS + 1 }, () => ({ first: 35.6, second: 139.7 })),
    });
    expect(tooMany.ok).toBe(false);
    if (!tooMany.ok) {
      expect(tooMany.errors[0].code).toBe('TOO_MANY_POINTS');
    }
  });

  test('NaN / Infinity / 非オブジェクトを拒否する', () => {
    expect(parseAddMarkersInput(null).ok).toBe(false);
    const badNum = parseAddMarkersInput({
      points: [{ first: Number.NaN, second: Number.POSITIVE_INFINITY }],
    });
    expect(badNum.ok).toBe(false);
    if (!badNum.ok) {
      expect(badNum.errors.map((e) => e.code)).toEqual(['INVALID_COORDINATE', 'INVALID_COORDINATE']);
    }
  });
});

describe('resolveMarkerCommand', () => {
  test('JGD2011 9系の XY 座標を世界測地系の緯度経度へ正確に変換する', () => {
    const parsed = parseMarkerQueryParams('?x=-37875.1959&y=-7958.6436&zone=9&geodetic=JGD2011&memo=東京タワー');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const resolved = resolveMarkerCommand(parsed.data);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    expect(resolved.data.groups[0][0].lat).toBeCloseTo(35.65858, 4);
    expect(resolved.data.groups[0][0].lng).toBeCloseTo(139.745433, 4);
    expect(resolved.data.groups[0][0].memo).toBe('東京タワー');
  });

  test('緯度経度が地理的有効範囲を超える場合は OUT_OF_RANGE_COORDINATE を返す', () => {
    const parsed = parseAddMarkersInput({
      points: [{ first: 95, second: 139.7 }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const resolved = resolveMarkerCommand(parsed.data);
    expect(resolved.ok).toBe(false);
    if (!resolved.ok) {
      expect(resolved.errors[0].code).toBe('OUT_OF_RANGE_COORDINATE');
    }
  });
});
