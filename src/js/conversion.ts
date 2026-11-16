import proj4 from 'proj4';
import { geodeticSystems } from './proj4.js';
import type { GeodeticSystemName } from './proj4.js';
import { isValidNumber } from './isvalidNumber.js';

export type CoordinateType = 'XY' | 'latlng';

/**
 * 座標値がどの座標系のものかを表す。
 * zoneNo は平面直角座標の系番号（1〜19）で、緯度経度は 0 を使う。
 */
export type CoordinateSystem = {
  type: CoordinateType;
  geodeticSystem: GeodeticSystemName;
  zoneNo: number;
};

export type Conversion = {
  source: CoordinateSystem;
  target: CoordinateSystem;
};

/**
 * 表の1行分。0列目が緯度またはX、1列目が経度またはY、2列目が memo。
 * jspreadsheet は行を配列で返す場合と {"0": 値, "1": 値} 形式で返す場合がある。
 */
export type SourceRow = { readonly [column: number]: unknown };

/** [緯度またはX, 経度またはY, memo] */
export type ConvertedPoint = [number, number, string];

// 地図（Leaflet）に渡す座標は世界測地系の緯度経度
export const MAP_COORDINATE_SYSTEM: CoordinateSystem = {
  type: 'latlng',
  geodeticSystem: 'JGD2011',
  zoneNo: 0,
};

const AXIS_LABELS: Record<CoordinateType, [string, string]> = {
  XY: ['X', 'Y'],
  latlng: ['緯度', '経度'],
};

const GEODETIC_LABELS: Record<GeodeticSystemName, string> = {
  TOKYO: '日本測地系',
  JGD2000: '世界測地系（JGD2000）',
  JGD2011: '世界測地系（JGD2011）',
};

function isCoordinateType(value: unknown): value is CoordinateType {
  return value === 'XY' || value === 'latlng';
}

function isGeodeticSystemName(value: unknown): value is GeodeticSystemName {
  return typeof value === 'string' && Object.keys(geodeticSystems).includes(value);
}

/**
 * フォームや外部入力の値を CoordinateSystem に変換する。
 * @return 種別・測地系・系番号のいずれかが扱えない値なら null
 */
export function parseCoordinateSystem(raw: {
  type: unknown;
  geodeticSystem: unknown;
  zoneNo: unknown;
}): CoordinateSystem | null {
  if (!isCoordinateType(raw.type) || !isGeodeticSystemName(raw.geodeticSystem)) {
    return null;
  }
  const zoneNo = Number(raw.zoneNo);
  if (!Number.isInteger(zoneNo) || zoneNo < 0 || zoneNo >= geodeticSystems[raw.geodeticSystem].length) {
    return null;
  }
  return { type: raw.type, geodeticSystem: raw.geodeticSystem, zoneNo };
}

/**
 * 0列目と1列目の両方がアプリで使える数値になっている行だけを残す。
 */
export function removeInvalidRows<Row extends SourceRow>(rows: readonly Row[]): Row[] {
  return rows.filter((row) => isValidNumber(row[0]) && isValidNumber(row[1]));
}

function epsgCode(system: CoordinateSystem): string {
  return geodeticSystems[system.geodeticSystem][system.zoneNo];
}

/**
 * 行の座標を conversion.source から conversion.target へ変換する。
 * @return 入力と同じ並び（緯度・経度 または X・Y）の座標と memo
 */
export function convertRows(conversion: Conversion, rows: readonly SourceRow[]): ConvertedPoint[] {
  const from = epsgCode(conversion.source);
  const to = epsgCode(conversion.target);
  return rows.map((row) => {
    // proj4 は「経度・緯度」の順で受け取り、同じ順で返す
    const [second, first] = proj4(from, to, [Number(row[1]), Number(row[0])]);
    return [Number(first), Number(second), String(row[2])];
  });
}

function zoneLabel(zoneNo: number): string {
  return zoneNo !== 0 ? `${zoneNo}系` : '';
}

/**
 * CSV の先頭に付けるヘッダー行。左2列が変換元、右2列が変換後。
 */
export function buildCsvHeader({ source, target }: Conversion): string[][] {
  const sourceGeodetic = GEODETIC_LABELS[source.geodeticSystem];
  const targetGeodetic = GEODETIC_LABELS[target.geodeticSystem];
  const sourceZone = zoneLabel(source.zoneNo);
  const targetZone = zoneLabel(target.zoneNo);
  return [
    ['変換元', '変換元', '変換後', '変換後'],
    [...AXIS_LABELS[source.type], ...AXIS_LABELS[target.type]],
    [sourceGeodetic, sourceGeodetic, targetGeodetic, targetGeodetic],
    [sourceZone, sourceZone, targetZone, targetZone],
  ];
}
