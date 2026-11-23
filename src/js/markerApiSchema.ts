import {
  convertRows,
  isZoneNo,
  MAP_COORDINATE_SYSTEM,
  parseCoordinateSystem,
} from './conversion.js';
import type { CoordinateSystem, CoordinateType } from './conversion.js';
import { isIconColor, isLineColorName } from './colors.js';
import type { IconColor, LineColorName } from './colors.js';
import { dms2deg, extractNumber } from './DMSLatLngParser.js';
import { normalizeDisplayMemo } from './markerPopup.js';
import { geodeticSystems } from './proj4.js';
import type { GeodeticSystemName } from './proj4.js';

export const MAX_API_POINTS = 500;
export const DEFAULT_SINGLE_POINT_ZOOM = 15;
export const MIN_API_ZOOM = 2;
export const MAX_API_ZOOM = 18;

export const MARKER_QUERY_KEYS = [
  'lat',
  'lng',
  'x',
  'y',
  'p',
  'type',
  'geodetic',
  'zone',
  'color',
  'line',
  'memo',
  'zoom',
] as const;

export interface MarkerPointInput {
  /** 緯度（type が 'latlng' のとき）または平面直角座標の X・南北方向（type が 'XY' のとき） */
  readonly first: number;
  /** 経度（type が 'latlng' のとき）または平面直角座標の Y・東西方向（type が 'XY' のとき） */
  readonly second: number;
  readonly memo?: string;
}

export interface AddMarkersInput {
  readonly type?: CoordinateType;
  readonly geodeticSystem?: GeodeticSystemName;
  readonly zoneNo?: number;
  readonly points?: readonly MarkerPointInput[];
  readonly groups?: readonly (readonly MarkerPointInput[])[];
  readonly iconColor?: IconColor;
  readonly lineColor?: LineColorName | null;
  readonly zoom?: number | null;
}

export interface NormalizedMarkerPoint {
  readonly first: number;
  readonly second: number;
  readonly memo: string;
}

export interface AddMarkersCommand {
  readonly system: CoordinateSystem;
  readonly groups: readonly (readonly NormalizedMarkerPoint[])[];
  readonly iconColor: IconColor;
  readonly lineColor: LineColorName | null;
  readonly zoom: number | null;
}

export interface ResolvedMarkerPoint {
  readonly lat: number;
  readonly lng: number;
  readonly memo: string;
}

export interface ResolvedMarkersPlan {
  readonly groups: readonly (readonly ResolvedMarkerPoint[])[];
  readonly iconColor: IconColor;
  readonly lineColor: LineColorName | null;
  readonly zoom: number | null;
}

export interface MarkerRecord {
  readonly id: string;
  readonly lat: number;
  readonly lng: number;
  readonly color: IconColor;
  readonly memo: string;
  readonly source: 'api' | 'url';
}

export type ApiErrorCode =
  | 'INVALID_COORDINATE_TYPE'
  | 'INVALID_GEODETIC_SYSTEM'
  | 'MISSING_ZONE_NO'
  | 'INVALID_ZONE_NO'
  | 'INVALID_COORDINATE'
  | 'OUT_OF_RANGE_COORDINATE'
  | 'EMPTY_POINTS'
  | 'TOO_MANY_POINTS'
  | 'CONFLICTING_INPUT'
  | 'INVALID_ICON_COLOR'
  | 'INVALID_LINE_COLOR'
  | 'INVALID_ZOOM'
  | 'INVALID_QUERY_SYNTAX';

export interface ApiError {
  readonly code: ApiErrorCode;
  readonly field: string;
  readonly message: string;
}

export type ApiResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly errors: readonly ApiError[] };

const STRICT_DECIMAL_PATTERN = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
const DMS_MARKER_PATTERN = /度|°/;

function isGeodeticSystem(value: unknown): value is GeodeticSystemName {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(geodeticSystems, value);
}

function parseStrictFiniteString(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '' || !STRICT_DECIMAL_PATTERN.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/**
 * URL パラメータの緯度経度文字列を十進数へ変換する。
 * 十進数文字列を優先し、「度」または「°」を含む場合は dms2deg() で度分秒形式を解釈する。
 */
function parseLatLngCoordinateString(raw: string): number | null {
  const decimal = parseStrictFiniteString(raw);
  if (decimal !== null) {
    return decimal;
  }
  const trimmed = raw.trim();
  if (trimmed === '' || !DMS_MARKER_PATTERN.test(trimmed)) {
    return null;
  }
  const parts = extractNumber(trimmed);
  if (parts === false || parts.length !== 3) {
    return null;
  }
  const [deg, min, sec] = parts;
  if (
    !Number.isFinite(deg) ||
    !Number.isFinite(min) ||
    !Number.isFinite(sec) ||
    min < 0 ||
    min >= 60 ||
    sec < 0 ||
    sec >= 60
  ) {
    return null;
  }
  try {
    const converted = dms2deg(trimmed);
    return typeof converted === 'number' && Number.isFinite(converted) ? converted : null;
  } catch {
    return null;
  }
}

function parseStrictFiniteNumber(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return null;
  }
  return raw;
}

function parseZoomValue(raw: unknown, field: string, errors: ApiError[]): number | null {
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  let parsed: number | null = null;
  if (typeof raw === 'number') {
    parsed = Number.isInteger(raw) ? raw : null;
  } else if (typeof raw === 'string') {
    const num = parseStrictFiniteString(raw);
    parsed = num !== null && Number.isInteger(num) ? num : null;
  }
  if (parsed === null || parsed < MIN_API_ZOOM || parsed > MAX_API_ZOOM) {
    errors.push({
      code: 'INVALID_ZOOM',
      field,
      message: `ズームレベルは ${MIN_API_ZOOM}〜${MAX_API_ZOOM} の整数で指定してください`,
    });
    return null;
  }
  return parsed;
}

function parseCoordinateSystemFields(
  raw: {
    type: unknown;
    geodetic: unknown;
    zone: unknown;
  },
  fieldNames: { type: string; geodetic: string; zone: string },
  errors: ApiError[],
): CoordinateSystem | null {
  let type: CoordinateType = 'latlng';
  if (raw.type !== undefined && raw.type !== null && raw.type !== '') {
    if (raw.type === 'latlng' || raw.type === 'XY') {
      type = raw.type;
    } else {
      errors.push({
        code: 'INVALID_COORDINATE_TYPE',
        field: fieldNames.type,
        message: '座標種別は "latlng" または "XY" を指定してください',
      });
    }
  }

  let geodeticSystem: GeodeticSystemName = 'JGD2011';
  if (raw.geodetic !== undefined && raw.geodetic !== null && raw.geodetic !== '') {
    if (isGeodeticSystem(raw.geodetic)) {
      geodeticSystem = raw.geodetic;
    } else {
      errors.push({
        code: 'INVALID_GEODETIC_SYSTEM',
        field: fieldNames.geodetic,
        message: '測地系は "JGD2011"、"JGD2000"、"TOKYO" のいずれかを指定してください',
      });
    }
  }

  let parsedZone: number | null = null;
  const hasZone = raw.zone !== undefined && raw.zone !== null && raw.zone !== '';
  if (hasZone) {
    if (typeof raw.zone === 'number') {
      parsedZone = Number.isInteger(raw.zone) ? raw.zone : Number.NaN;
    } else if (typeof raw.zone === 'string') {
      const num = parseStrictFiniteString(raw.zone);
      parsedZone = num !== null && Number.isInteger(num) ? num : Number.NaN;
    } else {
      parsedZone = Number.NaN;
    }
  }

  if (type === 'XY') {
    if (!hasZone) {
      errors.push({
        code: 'MISSING_ZONE_NO',
        field: fieldNames.zone,
        message: 'XY 座標では平面直角座標系の系番号（1〜19）の指定が必要です',
      });
      return null;
    }
    if (parsedZone === null || !isZoneNo(parsedZone)) {
      errors.push({
        code: 'INVALID_ZONE_NO',
        field: fieldNames.zone,
        message: '平面直角座標系の系番号は 1〜19 の整数で指定してください',
      });
      return null;
    }
    return parseCoordinateSystem({ type, geodeticSystem, zoneNo: parsedZone });
  }

  if (hasZone && parsedZone !== 0) {
    errors.push({
      code: 'INVALID_ZONE_NO',
      field: fieldNames.zone,
      message: '緯度経度（latlng）では系番号を指定できません（省略するか 0 を指定してください）',
    });
    return null;
  }

  return parseCoordinateSystem({ type: 'latlng', geodeticSystem, zoneNo: 0 });
}

function splitPointParam(raw: string): { firstRaw: string; secondRaw: string; memoRaw: string } | null {
  const firstComma = raw.indexOf(',');
  if (firstComma === -1) {
    return null;
  }
  const secondComma = raw.indexOf(',', firstComma + 1);
  if (secondComma === -1) {
    return {
      firstRaw: raw.slice(0, firstComma),
      secondRaw: raw.slice(firstComma + 1),
      memoRaw: '',
    };
  }
  return {
    firstRaw: raw.slice(0, firstComma),
    secondRaw: raw.slice(firstComma + 1, secondComma),
    memoRaw: raw.slice(secondComma + 1),
  };
}

export function hasMarkerQueryParams(search: string | URLSearchParams): boolean {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  return MARKER_QUERY_KEYS.some((key) => params.has(key));
}

export function parseMarkerQueryParams(search: string | URLSearchParams): ApiResult<AddMarkersCommand> {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const errors: ApiError[] = [];

  const hasLatLng = params.has('lat') || params.has('lng');
  const hasXY = params.has('x') || params.has('y');
  const pValues = params.getAll('p');
  const hasP = pValues.length > 0;

  const inputModeCount = Number(hasLatLng) + Number(hasXY) + Number(hasP);
  if (inputModeCount > 1) {
    errors.push({
      code: 'CONFLICTING_INPUT',
      field: 'p',
      message: 'lat/lng、x/y、p の各座標指定形式は同時に併用できません',
    });
  }

  const rawType = params.get('type');
  let inferredType: string | undefined = rawType ?? undefined;
  if (hasLatLng) {
    if (rawType !== null && rawType !== '' && rawType !== 'latlng') {
      errors.push({
        code: 'CONFLICTING_INPUT',
        field: 'type',
        message: 'lat/lng 指定時に type=latlng 以外は指定できません',
      });
    }
    inferredType = 'latlng';
  } else if (hasXY) {
    if (rawType !== null && rawType !== '' && rawType !== 'XY') {
      errors.push({
        code: 'CONFLICTING_INPUT',
        field: 'type',
        message: 'x/y 指定時に type=XY 以外は指定できません',
      });
    }
    inferredType = 'XY';
  }

  const system = parseCoordinateSystemFields(
    {
      type: inferredType,
      geodetic: params.get('geodetic') ?? undefined,
      zone: params.get('zone') ?? undefined,
    },
    { type: 'type', geodetic: 'geodetic', zone: 'zone' },
    errors,
  );

  let iconColor: IconColor = 'red';
  const rawColor = params.get('color');
  if (rawColor !== null && rawColor !== '') {
    if (isIconColor(rawColor)) {
      iconColor = rawColor;
    } else {
      errors.push({
        code: 'INVALID_ICON_COLOR',
        field: 'color',
        message: 'アイコンの色は red、blue、yellow、green のいずれかを指定してください',
      });
    }
  }

  let lineColor: LineColorName | null = null;
  const rawLine = params.get('line');
  if (rawLine !== null && rawLine !== '' && rawLine !== 'none' && rawLine !== 'no') {
    if (isLineColorName(rawLine)) {
      lineColor = rawLine;
    } else {
      errors.push({
        code: 'INVALID_LINE_COLOR',
        field: 'line',
        message: '線の色は red、blue、yellow、green、または none を指定してください',
      });
    }
  }

  const zoom = parseZoomValue(params.get('zoom') ?? undefined, 'zoom', errors);
  const points: NormalizedMarkerPoint[] = [];

  if (hasLatLng && !hasXY && !hasP) {
    const latRaw = params.get('lat');
    const lngRaw = params.get('lng');
    const lat = latRaw !== null ? parseLatLngCoordinateString(latRaw) : null;
    const lng = lngRaw !== null ? parseLatLngCoordinateString(lngRaw) : null;
    if (lat === null) {
      errors.push({
        code: 'INVALID_COORDINATE',
        field: 'lat',
        message: 'lat には有効な数値または度分秒形式の緯度を指定してください',
      });
    }
    if (lng === null) {
      errors.push({
        code: 'INVALID_COORDINATE',
        field: 'lng',
        message: 'lng には有効な数値または度分秒形式の経度を指定してください',
      });
    }
    if (lat !== null && lng !== null) {
      points.push({ first: lat, second: lng, memo: normalizeDisplayMemo(params.get('memo') ?? '') });
    }
  } else if (hasXY && !hasLatLng && !hasP) {
    const xRaw = params.get('x');
    const yRaw = params.get('y');
    const x = xRaw !== null ? parseStrictFiniteString(xRaw) : null;
    const y = yRaw !== null ? parseStrictFiniteString(yRaw) : null;
    if (x === null) {
      errors.push({
        code: 'INVALID_COORDINATE',
        field: 'x',
        message: 'x（南北座標）には有効な数値を指定してください',
      });
    }
    if (y === null) {
      errors.push({
        code: 'INVALID_COORDINATE',
        field: 'y',
        message: 'y（東西座標）には有効な数値を指定してください',
      });
    }
    if (x !== null && y !== null) {
      points.push({ first: x, second: y, memo: normalizeDisplayMemo(params.get('memo') ?? '') });
    }
  } else if (hasP && !hasLatLng && !hasXY) {
    if (pValues.length > MAX_API_POINTS) {
      errors.push({
        code: 'TOO_MANY_POINTS',
        field: 'p',
        message: `一度に追加できる地点数は最大 ${MAX_API_POINTS} 点です`,
      });
    } else {
      const parseCoord =
        inferredType === 'XY' ? parseStrictFiniteString : parseLatLngCoordinateString;
      pValues.forEach((rawPoint, index) => {
        const parts = splitPointParam(rawPoint);
        if (parts === null) {
          errors.push({
            code: 'INVALID_QUERY_SYNTAX',
            field: `p[${index}]`,
            message: 'p パラメータは "第1座標,第2座標[,メモ]" 形式で指定してください',
          });
          return;
        }
        const first = parseCoord(parts.firstRaw);
        const second = parseCoord(parts.secondRaw);
        if (first === null || second === null) {
          errors.push({
            code: 'INVALID_COORDINATE',
            field: `p[${index}]`,
            message:
              inferredType === 'XY'
                ? '座標には有効な数値を指定してください'
                : '座標には有効な数値または度分秒形式の緯度経度を指定してください',
          });
          return;
        }
        points.push({
          first,
          second,
          memo: normalizeDisplayMemo(parts.memoRaw),
        });
      });
    }
  } else if (inputModeCount === 0) {
    errors.push({
      code: 'EMPTY_POINTS',
      field: 'p',
      message: '追加する座標（lat/lng、x/y、または p）を指定してください',
    });
  }

  if (errors.length > 0 || system === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      system,
      groups: [points],
      iconColor,
      lineColor,
      zoom,
    },
  };
}

function parsePointArray(
  rawPoints: unknown,
  fieldPrefix: string,
  errors: ApiError[],
): NormalizedMarkerPoint[] {
  if (!Array.isArray(rawPoints)) {
    errors.push({
      code: 'INVALID_QUERY_SYNTAX',
      field: fieldPrefix,
      message: `${fieldPrefix} は配列で指定してください`,
    });
    return [];
  }
  const result: NormalizedMarkerPoint[] = [];
  rawPoints.forEach((item, index) => {
    const itemField = `${fieldPrefix}[${index}]`;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push({
        code: 'INVALID_COORDINATE',
        field: itemField,
        message: '各地点は { first, second, memo? } のオブジェクトで指定してください',
      });
      return;
    }
    const candidate = item as Record<string, unknown>;
    const first = parseStrictFiniteNumber(candidate.first);
    const second = parseStrictFiniteNumber(candidate.second);
    if (first === null) {
      errors.push({
        code: 'INVALID_COORDINATE',
        field: `${itemField}.first`,
        message: 'first には有限の数値を指定してください',
      });
    }
    if (second === null) {
      errors.push({
        code: 'INVALID_COORDINATE',
        field: `${itemField}.second`,
        message: 'second には有限の数値を指定してください',
      });
    }
    let memo = '';
    if (candidate.memo !== undefined && candidate.memo !== null) {
      if (typeof candidate.memo !== 'string') {
        errors.push({
          code: 'INVALID_QUERY_SYNTAX',
          field: `${itemField}.memo`,
          message: 'memo は文字列で指定してください',
        });
      } else {
        memo = normalizeDisplayMemo(candidate.memo);
      }
    }
    if (first !== null && second !== null) {
      result.push({ first, second, memo });
    }
  });
  return result;
}

export function parseAddMarkersInput(raw: unknown): ApiResult<AddMarkersCommand> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      ok: false,
      errors: [
        {
          code: 'INVALID_QUERY_SYNTAX',
          field: 'input',
          message: '入力はオブジェクトで指定してください',
        },
      ],
    };
  }

  const input = raw as Record<string, unknown>;
  const errors: ApiError[] = [];

  const system = parseCoordinateSystemFields(
    {
      type: input.type,
      geodetic: input.geodeticSystem,
      zone: input.zoneNo,
    },
    { type: 'type', geodetic: 'geodeticSystem', zone: 'zoneNo' },
    errors,
  );

  let iconColor: IconColor = 'red';
  if (input.iconColor !== undefined) {
    if (isIconColor(input.iconColor)) {
      iconColor = input.iconColor;
    } else {
      errors.push({
        code: 'INVALID_ICON_COLOR',
        field: 'iconColor',
        message: 'iconColor は "red"、"blue"、"yellow"、"green" のいずれかを指定してください',
      });
    }
  }

  let lineColor: LineColorName | null = null;
  if (input.lineColor !== undefined && input.lineColor !== null) {
    if (isLineColorName(input.lineColor)) {
      lineColor = input.lineColor;
    } else {
      errors.push({
        code: 'INVALID_LINE_COLOR',
        field: 'lineColor',
        message: 'lineColor は "red"、"blue"、"yellow"、"green"、または null を指定してください',
      });
    }
  }

  const zoom = parseZoomValue(input.zoom, 'zoom', errors);

  const hasPoints = input.points !== undefined;
  const hasGroups = input.groups !== undefined;
  const groups: NormalizedMarkerPoint[][] = [];

  if (hasPoints && hasGroups) {
    errors.push({
      code: 'CONFLICTING_INPUT',
      field: 'groups',
      message: 'points と groups は同時に指定できません',
    });
  } else if (hasPoints) {
    const parsed = parsePointArray(input.points, 'points', errors);
    if (parsed.length > 0) {
      groups.push(parsed);
    }
  } else if (hasGroups) {
    if (!Array.isArray(input.groups)) {
      errors.push({
        code: 'INVALID_QUERY_SYNTAX',
        field: 'groups',
        message: 'groups は地点配列の配列で指定してください',
      });
    } else {
      input.groups.forEach((group, groupIndex) => {
        const parsed = parsePointArray(group, `groups[${groupIndex}]`, errors);
        if (parsed.length > 0) {
          groups.push(parsed);
        }
      });
    }
  }

  const totalPoints = groups.reduce((sum, group) => sum + group.length, 0);
  if (errors.length === 0 && totalPoints === 0) {
    errors.push({
      code: 'EMPTY_POINTS',
      field: hasGroups ? 'groups' : 'points',
      message: '1 点以上の座標を指定してください',
    });
  } else if (totalPoints > MAX_API_POINTS) {
    errors.push({
      code: 'TOO_MANY_POINTS',
      field: hasGroups ? 'groups' : 'points',
      message: `一度に追加できる地点数は最大 ${MAX_API_POINTS} 点です`,
    });
  }

  if (errors.length > 0 || system === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      system,
      groups,
      iconColor,
      lineColor,
      zoom,
    },
  };
}

export function resolveMarkerCommand(command: AddMarkersCommand): ApiResult<ResolvedMarkersPlan> {
  const errors: ApiError[] = [];
  const toMap = { source: command.system, target: MAP_COORDINATE_SYSTEM };
  const resolvedGroups: ResolvedMarkerPoint[][] = [];

  command.groups.forEach((group, groupIndex) => {
    const rows = group.map((point): [number, number, string] => [point.first, point.second, point.memo]);
    const converted = convertRows(toMap, rows);
    const resolvedGroup: ResolvedMarkerPoint[] = [];

    converted.forEach(([lat, lng, memo], pointIndex) => {
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        errors.push({
          code: 'OUT_OF_RANGE_COORDINATE',
          field: `groups[${groupIndex}][${pointIndex}]`,
          message: '変換後の緯度経度が有効範囲（緯度 -90〜90、経度 -180〜180）を超えています',
        });
        return;
      }
      resolvedGroup.push({ lat, lng, memo });
    });

    resolvedGroups.push(resolvedGroup);
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      groups: resolvedGroups,
      iconColor: command.iconColor,
      lineColor: command.lineColor,
      zoom: command.zoom,
    },
  };
}
