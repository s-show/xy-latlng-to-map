import {
  parseCoordinateSystem,
  removeInvalidRows,
  convertRows,
  buildCsvHeader,
  MAP_COORDINATE_SYSTEM,
} from '../src/js/conversion';
import type { CoordinateSystem, ConvertedPoint, ZoneNo } from '../src/js/conversion';

const latlng = (geodeticSystem: CoordinateSystem['geodeticSystem']): CoordinateSystem => ({
  type: 'latlng',
  geodeticSystem,
  zoneNo: 0,
});
const xy = (geodeticSystem: CoordinateSystem['geodeticSystem'], zoneNo: ZoneNo): CoordinateSystem => ({
  type: 'XY',
  geodeticSystem,
  zoneNo,
});

function expectPoints(actual: ConvertedPoint[], expected: ConvertedPoint[], digits: number) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((point, index) => {
    expect(point[0]).toBeCloseTo(expected[index][0], digits);
    expect(point[1]).toBeCloseTo(expected[index][1], digits);
    expect(point[2]).toBe(expected[index][2]);
  });
}

describe('parseCoordinateSystem', () => {
  test('フォームが返す文字列の値を受け付ける', () => {
    expect(parseCoordinateSystem({ type: 'XY', geodeticSystem: 'TOKYO', zoneNo: '9' })).toEqual(xy('TOKYO', 9));
    expect(parseCoordinateSystem({ type: 'latlng', geodeticSystem: 'JGD2011', zoneNo: '0' })).toEqual(
      latlng('JGD2011'),
    );
  });

  test.each([
    ['未知の種別', { type: 'xy', geodeticSystem: 'TOKYO', zoneNo: '1' }],
    ['未選択の種別', { type: null, geodeticSystem: 'TOKYO', zoneNo: '1' }],
    ['未知の測地系', { type: 'XY', geodeticSystem: 'WGS84', zoneNo: '1' }],
    ['Object のプロパティ名と同じ測地系', { type: 'XY', geodeticSystem: 'toString', zoneNo: '1' }],
    ['範囲外の系番号', { type: 'XY', geodeticSystem: 'TOKYO', zoneNo: '20' }],
    ['XY 座標で系番号 0', { type: 'XY', geodeticSystem: 'JGD2011', zoneNo: '0' }],
    ['緯度経度で 0 以外の系番号', { type: 'latlng', geodeticSystem: 'JGD2011', zoneNo: '9' }],
    ['負の系番号', { type: 'XY', geodeticSystem: 'TOKYO', zoneNo: '-1' }],
    ['整数でない系番号', { type: 'XY', geodeticSystem: 'TOKYO', zoneNo: '1.5' }],
    ['数値でない系番号', { type: 'XY', geodeticSystem: 'TOKYO', zoneNo: 'abc' }],
  ])('%s は null を返す', (_name, raw) => {
    expect(parseCoordinateSystem(raw)).toBeNull();
  });
});

describe('removeInvalidRows', () => {
  test('0列目と1列目が有効な数値の行だけを残す', () => {
    const objectRow = { 0: '35.3', 1: '139.3', 2: 'object row' };
    const rows = [
      ['35.1', '139.1', 'ok'],
      ['', '', ''],
      ['0', '139.1', 'zero'],
      ['abc', '139.1', 'not a number'],
      ['35.1', '', 'missing'],
      [35.2, 139.2, 'numbers'],
      objectRow,
      ['１', '139.1', 'full width'],
    ];
    expect(removeInvalidRows(rows)).toEqual([['35.1', '139.1', 'ok'], [35.2, 139.2, 'numbers'], objectRow]);
  });
});

// 期待値は、変換処理を index.ts から切り出す前の実装の出力を記録したもの。
describe('convertRows', () => {
  test('同じ座標系どうしの変換は値を変えない', () => {
    const conversion = { source: latlng('JGD2011'), target: MAP_COORDINATE_SYSTEM };
    expectPoints(convertRows(conversion, [['35.658580', '139.745433', 'tower']]), [[35.65858, 139.745433, 'tower']], 9);
  });

  test('日本測地系の緯度経度を世界測地系の緯度経度に変換する', () => {
    const conversion = { source: latlng('TOKYO'), target: latlng('JGD2011') };
    expectPoints(
      convertRows(conversion, [
        ['35.658580', '139.745433', 'tower'],
        [43.06417, 141.34694, 'sapporo'],
      ]),
      [
        [35.661820843561166, 139.74220177686317, 'tower'],
        [43.06659173587628, 141.3431986093254, 'sapporo'],
      ],
      9,
    );
  });

  test('緯度経度を平面直角座標に変換する', () => {
    const conversion = { source: latlng('JGD2011'), target: xy('JGD2011', 9) };
    expectPoints(
      convertRows(conversion, [['35.658580', '139.745433', '']]),
      [[-37875.19589082743, -7958.643607519652, '']],
      4,
    );
  });

  test('平面直角座標を緯度経度に変換する', () => {
    const conversion = { source: xy('TOKYO', 9), target: MAP_COORDINATE_SYSTEM };
    expectPoints(
      convertRows(conversion, [['-35367.5', '-6042.1', 'a']]),
      [[35.68440230074973, 139.76333983045566, 'a']],
      9,
    );
  });

  test('同じ系番号で測地系だけを変換する', () => {
    const conversion = { source: xy('JGD2000', 15), target: xy('TOKYO', 15) };
    expectPoints(
      convertRows(conversion, [[12345.678, -98765.432, 'b']]),
      [[11897.283077726794, -98572.9777116316, 'b']],
      4,
    );
  });

  test('{"0": 値} 形式の行も変換する', () => {
    const conversion = { source: latlng('JGD2011'), target: MAP_COORDINATE_SYSTEM };
    expectPoints(convertRows(conversion, [{ 0: '35.5', 1: '139.5', 2: 'memo' }]), [[35.5, 139.5, 'memo']], 9);
  });

  test('memo 列が省略された行は "undefined" ではなく空文字になる', () => {
    const conversion = { source: latlng('JGD2011'), target: MAP_COORDINATE_SYSTEM };
    expectPoints(convertRows(conversion, [['35.5', '139.5']]), [[35.5, 139.5, '']], 9);
  });
});

describe('buildCsvHeader', () => {
  test('XY から緯度経度への変換', () => {
    expect(buildCsvHeader({ source: xy('TOKYO', 1), target: latlng('JGD2011') })).toEqual([
      ['変換元', '変換元', '変換後', '変換後'],
      ['X', 'Y', '緯度', '経度'],
      ['日本測地系', '日本測地系', '世界測地系（JGD2011）', '世界測地系（JGD2011）'],
      ['1系', '1系', '', ''],
    ]);
  });

  test('緯度経度から XY への変換', () => {
    expect(buildCsvHeader({ source: latlng('JGD2000'), target: xy('JGD2011', 9) })).toEqual([
      ['変換元', '変換元', '変換後', '変換後'],
      ['緯度', '経度', 'X', 'Y'],
      ['世界測地系（JGD2000）', '世界測地系（JGD2000）', '世界測地系（JGD2011）', '世界測地系（JGD2011）'],
      ['', '', '9系', '9系'],
    ]);
  });
});
