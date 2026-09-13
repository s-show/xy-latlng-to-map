import L from 'leaflet';

// 不動産情報ライブラリ（国土交通省）が提供する都市計画情報・防災情報タイルAPIのうち、
// このアプリで表示対象とするもの。
// APIキーを扱うため、ブラウザから直接APIを呼ばずプロキシ（Cloudflare Workers）経由で取得する。
export type ReinfolibApiId =
  | 'XKT001'
  | 'XKT002'
  | 'XKT014'
  | 'XKT023'
  | 'XKT024'
  | 'XKT029';

// 不動産情報ライブラリのタイルAPIが対応しているズームレベルの範囲
const MIN_ZOOM = 11;
const MAX_ZOOM = 15;

const ATTRIBUTION =
  '<a target="_blank" href="mapSource.html">不動産情報ライブラリ（国土交通省）の出典情報</a>';

interface ReinfolibLayerDefinition {
  apiId: ReinfolibApiId;
  name: string;
  color: string;
}

// レイヤーごとの表示名・塗り色（色分けは地図上での視覚的な補助であり、
// 詳細な属性情報はクリック時のポップアップで確認する運用とする）。
export const REINFOLIB_LAYER_DEFINITIONS: ReinfolibLayerDefinition[] = [
  { apiId: 'XKT001', name: '都市計画区域/区域区分', color: '#1f77b4' },
  { apiId: 'XKT002', name: '用途地域', color: '#ff7f0e' },
  { apiId: 'XKT014', name: '防火・準防火地域', color: '#d62728' },
  { apiId: 'XKT023', name: '地区計画', color: '#2ca02c' },
  { apiId: 'XKT024', name: '高度利用地区', color: '#9467bd' },
  { apiId: 'XKT029', name: '土砂災害警戒区域', color: '#8c564b' },
];

// APIレスポンスの属性値は外部（MLIT）由来であり信頼できないため、
// ポップアップHTMLへ埋め込む前に必ずエスケープする。
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ------------------------------------------------------------------------
 * 座標のタイル変換・点と多角形の包含判定
 * ---------------------------------------------------------------------- */

export interface TileCoords {
  x: number;
  y: number;
}

// 標準的なXYZタイル方式（Web Mercator）での緯度経度→タイル座標変換。
// 不動産情報ライブラリのタイルAPIも同方式を採用している。
export function latLngToTileCoords(lat: number, lng: number, z: number): TileCoords {
  const tileCount = 2 ** z;
  const latRad = (lat * Math.PI) / 180;
  const x = Math.floor(((lng + 180) / 360) * tileCount);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * tileCount,
  );
  const clamp = (n: number) => Math.min(Math.max(n, 0), tileCount - 1);
  return { x: clamp(x), y: clamp(y) };
}

type Position = number[];

function isPointInRing(point: Position, ring: Position[]): boolean {
  // 標準的なray castingアルゴリズム。point = [lng, lat]
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

// polygonCoords[0] は外側の輪、polygonCoords[1]以降は穴（ドーナツ状の除外区域）。
function isPointInPolygonCoords(point: Position, polygonCoords: Position[][]): boolean {
  if (polygonCoords.length === 0 || !isPointInRing(point, polygonCoords[0])) {
    return false;
  }
  for (let i = 1; i < polygonCoords.length; i++) {
    if (isPointInRing(point, polygonCoords[i])) {
      return false; // 穴の内側にある場合はポリゴンの外側とみなす
    }
  }
  return true;
}

interface GeoJsonGeometryLike {
  type: string;
  coordinates: unknown;
}

// PolygonとMultiPolygon以外の形状（Point・LineString等）は判定対象外とする。
export function isPointInGeometry(point: Position, geometry: GeoJsonGeometryLike | null | undefined): boolean {
  if (!geometry) {
    return false;
  }
  if (geometry.type === 'Polygon') {
    return isPointInPolygonCoords(point, geometry.coordinates as Position[][]);
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates as Position[][][]).some((polygonCoords) =>
      isPointInPolygonCoords(point, polygonCoords),
    );
  }
  return false;
}

/* ------------------------------------------------------------------------
 * 属性項目名の日本語ラベル
 * ---------------------------------------------------------------------- */

// 不動産情報ライブラリの都市計画決定GISデータ系（XKT001/002/014/023/024）で
// 共通して現れる属性項目。
const COMMON_FIELD_LABELS: Record<string, string> = {
  notice_number: '告示番号',
  notice_number_s: '告示番号（枝番）',
  decision_date: '決定日',
  first_decision_date: '当初決定日',
  decision_classification: '決定区分',
  decision_maker: '決定権者',
  decision_type_ja: '決定種別',
  plan_name: '計画名称',
  plan_type_ja: '計画種別',
};

// レイヤー固有の属性項目。実際のAPIレスポンスで確認できたものだけを記載する
// （XKT024は該当データが未確認のため、共通項目とフォールバック表示に委ねる）。
const LAYER_FIELD_LABELS: Partial<Record<ReinfolibApiId, Record<string, string>>> = {
  XKT001: {
    area_classification_ja: '区域区分',
  },
  XKT002: {
    use_area_ja: '用途地域',
    u_floor_area_ratio_ja: '容積率',
    u_building_coverage_ratio_ja: '建蔽率',
  },
  XKT014: {
    fire_prevention_ja: '防火指定',
  },
  XKT029: {
    A33_001: '現象の種類',
    A33_002: '区域区分',
    A33_004: '区域番号',
    A33_005: '区域名',
    A33_006: '所在地',
    A33_007: '公示日',
    A33_008: '特別警戒区域の指定状況',
  },
};

// 出典・所在地の重複表示を避けるため非表示にする項目（地図上の位置で自明なため）と、
// APIの内部管理用項目。
const EXCLUDED_KEYS = new Set([
  '_id',
  '_index',
  'prefecture',
  'city_name',
  'city_code',
  'group_code',
  'kubun_id',
  'youto_id',
  'A33_003',
]);

// XKT029（土砂災害警戒区域）のコード値は、国土数値情報のコード表に基づき
// 人間が読める文言に変換する（MLITのAPIマニュアル自体にはコードの意味の
// 詳細が記載されていないため、利用者から提供されたコード表を用いる）。
const LAYER_VALUE_LABELS: Partial<Record<ReinfolibApiId, Record<string, Record<string, string>>>> = {
  XKT029: {
    A33_001: {
      '1': '急傾斜地の崩壊',
      '2': '土石流',
      '3': '地滑り',
    },
    A33_002: {
      '1': '土砂災害警戒区域(指定済)',
      '2': '土砂災害特別警戒区域(指定済)',
      '3': '土砂災害警戒区域(指定前)',
      '4': '土砂災害特別警戒区域(指定前)',
    },
    A33_008: {
      '0': '特別警戒区域指定済み',
      '1': '特別警戒区域未指定',
    },
  },
};

function labelForKey(apiId: ReinfolibApiId, key: string, layerName: string): string {
  const layerLabel = LAYER_FIELD_LABELS[apiId]?.[key];
  if (layerLabel) {
    return layerLabel;
  }
  const commonLabel = COMMON_FIELD_LABELS[key];
  if (commonLabel) {
    return commonLabel;
  }
  // 未確認のレイヤー固有項目（主に "_ja" サフィックスの分類名）は、
  // レイヤー名そのものをラベルとして表示する（項目名を英語のまま出さないため）。
  if (key.endsWith('_ja')) {
    return layerName;
  }
  return key;
}

// APIの容積率・建蔽率は "300.0%" のように小数点付きで返ってくることがあるため、
// 整数値のみを表示する。
function formatIntegerPercent(value: unknown): string {
  const match = String(value).match(/^(-?\d+(?:\.\d+)?)\s*%$/);
  if (!match) {
    return String(value);
  }
  return `${Math.round(Number(match[1]))}%`;
}

const LAYER_VALUE_FORMATTERS: Partial<Record<ReinfolibApiId, Record<string, (value: unknown) => string>>> = {
  XKT002: {
    u_floor_area_ratio_ja: formatIntegerPercent,
    u_building_coverage_ratio_ja: formatIntegerPercent,
  },
};

function displayValueForKey(apiId: ReinfolibApiId, key: string, value: unknown): string {
  const decoded = LAYER_VALUE_LABELS[apiId]?.[key]?.[String(value)];
  if (decoded) {
    return decoded;
  }
  const formatter = LAYER_VALUE_FORMATTERS[apiId]?.[key];
  if (formatter) {
    return formatter(value);
  }
  return String(value);
}

// `_index` は "bs001_use_area_202607231142" のような形式で、末尾12桁が
// このデータセットの更新日時（YYYYMMDDHHmm）を表す。データの基準時点の表示に使う。
export function extractAsOfFromIndex(index: unknown): string | null {
  if (typeof index !== 'string') {
    return null;
  }
  const match = index.match(/(\d{12})$/);
  if (!match) {
    return null;
  }
  const digits = match[1];
  const year = digits.slice(0, 4);
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const hour = digits.slice(8, 10);
  const minute = digits.slice(10, 12);
  return `${year}年${month}月${day}日 ${hour}:${minute}`;
}

/* ------------------------------------------------------------------------
 * クリック地点の情報取得・ポップアップ組み立て
 * ---------------------------------------------------------------------- */

export interface LayerPointInfo {
  definition: ReinfolibLayerDefinition;
  properties: Record<string, unknown> | null;
  asOf: string | null;
}

interface GeoJsonFeatureLike {
  geometry?: GeoJsonGeometryLike | null;
  properties?: Record<string, unknown> | null;
}

interface GeoJsonFeatureCollectionLike {
  features?: GeoJsonFeatureLike[];
}

async function fetchLayerPointInfo(
  baseUrl: string,
  definition: ReinfolibLayerDefinition,
  point: Position,
  tile: TileCoords,
  zoom: number,
): Promise<LayerPointInfo> {
  const url = `${baseUrl}/tiles/${definition.apiId}/${zoom}/${tile.x}/${tile.y}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`不動産情報ライブラリAPIプロキシへのリクエストに失敗しました (status: ${response.status})`);
    }
    const data = (await response.json()) as GeoJsonFeatureCollectionLike;
    const features = Array.isArray(data.features) ? data.features : [];
    const matched = features.find((feature) => isPointInGeometry(point, feature.geometry));
    const asOfSource = matched ?? features[0];
    return {
      definition,
      properties: matched?.properties ?? null,
      asOf: extractAsOfFromIndex(asOfSource?.properties?._index),
    };
  } catch (error) {
    console.warn(`${definition.apiId} の取得に失敗しました:`, error);
    return { definition, properties: null, asOf: null };
  }
}

export function buildCombinedPopupHtml(results: LayerPointInfo[]): string {
  const sections = results.map(({ definition, properties, asOf }) => {
    const heading = `<h4>${escapeHtml(definition.name)}</h4>`;
    const asOfHtml = asOf ? `<p class="reinfolib-popup__as-of">${escapeHtml(asOf)}時点のデータ</p>` : '';
    if (!properties) {
      return `<section class="reinfolib-popup__section">${heading}<p class="reinfolib-popup__empty">指定無し</p></section>`;
    }
    const rows = Object.entries(properties)
      .filter(([key, value]) => !EXCLUDED_KEYS.has(key) && value !== '' && value !== null && value !== undefined)
      .map(([key, value]) => {
        const label = labelForKey(definition.apiId, key, definition.name);
        const displayValue = displayValueForKey(definition.apiId, key, value);
        return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(displayValue)}</td></tr>`;
      })
      .join('');
    return `<section class="reinfolib-popup__section">${heading}${asOfHtml}<table class="reinfolib-popup__table">${rows}</table></section>`;
  });
  return `<div class="reinfolib-popup">${sections.join('')}</div>`;
}

/**
 * 地図クリック時に、その地点における不動産情報ライブラリ6レイヤー分の情報を
 * まとめてポップアップ表示する。表示中（チェックボックスON）かどうかに関わらず、
 * 常に全レイヤーの情報を取得する。
 * `VITE_REINFOLIB_PROXY_URL` が未設定の場合は何もしない。
 */
export function attachReinfolibInfoPopup(
  map: L.Map,
  baseUrl: string | undefined = import.meta.env?.VITE_REINFOLIB_PROXY_URL,
): void {
  if (!baseUrl) {
    return;
  }
  const trimmedBaseUrl = baseUrl.replace(/\/$/, '');

  map.on('click', (e: L.LeafletMouseEvent) => {
    const zoom = Math.min(Math.max(Math.round(map.getZoom()), MIN_ZOOM), MAX_ZOOM);
    const point: Position = [e.latlng.lng, e.latlng.lat];
    const tile = latLngToTileCoords(e.latlng.lat, e.latlng.lng, zoom);

    const popup = L.popup({ maxWidth: 320, minWidth: 240 })
      .setLatLng(e.latlng)
      .setContent('<div class="reinfolib-popup"><p>読み込み中...</p></div>')
      .openOn(map);

    Promise.all(
      REINFOLIB_LAYER_DEFINITIONS.map((definition) =>
        fetchLayerPointInfo(trimmedBaseUrl, definition, point, tile, zoom),
      ),
    ).then((results) => {
      const currentLatLng = popup.getLatLng();
      // 取得中に別の場所がクリックされ、このポップアップが既に閉じられている/
      // 移動している場合は反映しない。
      if (map.hasLayer(popup) && currentLatLng && currentLatLng.equals(e.latlng)) {
        popup.setContent(buildCombinedPopupHtml(results));
      }
    });
  });
}

class ReinfolibTileLayer extends L.GridLayer {
  private readonly featureGroup = L.featureGroup();
  private readonly loadedTiles = new Set<string>();

  constructor(
    private readonly baseUrl: string,
    private readonly definition: ReinfolibLayerDefinition,
  ) {
    super({
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      minNativeZoom: MIN_ZOOM,
      maxNativeZoom: MAX_ZOOM,
      attribution: ATTRIBUTION,
    });
  }

  onAdd(map: L.Map): this {
    super.onAdd(map);
    this.featureGroup.addTo(map);
    return this;
  }

  onRemove(map: L.Map): this {
    super.onRemove(map);
    this.featureGroup.remove();
    this.featureGroup.clearLayers();
    this.loadedTiles.clear();
    return this;
  }

  protected createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    // 実際の描画は緯度経度ベースの featureGroup に対して行うため、
    // GridLayer が管理するタイル要素自体は何も表示しないプレースホルダーでよい。
    // 色分け表示はあくまで視覚的な補助であり、詳細情報はクリック時のポップアップ
    // （attachReinfolibInfoPopup）で表示するため、個々の図形にはポップアップを
    // 紐付けない。
    const tile = document.createElement('div');
    const key = `${coords.z}/${coords.x}/${coords.y}`;
    const url = `${this.baseUrl}/tiles/${this.definition.apiId}/${coords.z}/${coords.x}/${coords.y}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`不動産情報ライブラリAPIプロキシへのリクエストに失敗しました (status: ${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        if (!this.loadedTiles.has(key)) {
          this.loadedTiles.add(key);
          L.geoJSON(data, {
            style: () => ({
              color: this.definition.color,
              weight: 1,
              fillColor: this.definition.color,
              fillOpacity: 0.3,
            }),
          }).addTo(this.featureGroup);
        }
        done(undefined, tile);
      })
      .catch((error: Error) => {
        console.warn(error.message);
        done(error, tile);
      });

    return tile;
  }
}

/**
 * 不動産情報ライブラリのオーバーレイレイヤー一覧を生成する。
 * `VITE_REINFOLIB_PROXY_URL` が未設定の場合は空を返し、レイヤーコントロールに追加しない
 * （APIキーはプロキシ側だけが保持するため、プロキシURLが無ければこの機能自体を使えない）。
 */
export function getReinfolibOverlays(
  baseUrl: string | undefined = import.meta.env?.VITE_REINFOLIB_PROXY_URL,
): Record<string, L.Layer> {
  if (!baseUrl) {
    console.info('VITE_REINFOLIB_PROXY_URL が未設定のため、不動産情報ライブラリのレイヤーは追加しません');
    return {};
  }
  const trimmedBaseUrl = baseUrl.replace(/\/$/, '');
  const overlays: Record<string, L.Layer> = {};
  for (const definition of REINFOLIB_LAYER_DEFINITIONS) {
    overlays[`不動産情報ライブラリ (${definition.name})`] = new ReinfolibTileLayer(trimmedBaseUrl, definition);
  }
  return overlays;
}
