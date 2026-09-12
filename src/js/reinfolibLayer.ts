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

// レイヤーごとの表示名・塗り色。
// 属性値に応じた細かい色分け（用途地域の種別ごとの色分けなど）は、
// 実際のAPIレスポンスで属性値の取りうる範囲を確認してから追加する。
export const REINFOLIB_LAYER_DEFINITIONS: ReinfolibLayerDefinition[] = [
  { apiId: 'XKT001', name: '都市計画区域/区域区分', color: '#1f77b4' },
  { apiId: 'XKT002', name: '用途地域', color: '#ff7f0e' },
  { apiId: 'XKT014', name: '防火・準防火地域', color: '#d62728' },
  { apiId: 'XKT023', name: '地区計画', color: '#2ca02c' },
  { apiId: 'XKT024', name: '高度利用地区', color: '#9467bd' },
  { apiId: 'XKT029', name: '土砂災害警戒区域', color: '#8c564b' },
];

interface GeoJsonFeatureLike {
  properties?: Record<string, unknown> | null;
}

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

export function buildPopupHtml(properties: Record<string, unknown> | null | undefined): string {
  const entries = Object.entries(properties ?? {});
  if (entries.length === 0) {
    return '属性情報はありません';
  }
  const rows = entries
    .map(([key, value]) => `<tr><th style="text-align:left;padding-right:0.5em;">${escapeHtml(key)}</th><td>${escapeHtml(String(value))}</td></tr>`)
    .join('');
  return `<table>${rows}</table>`;
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
            onEachFeature: (feature: GeoJsonFeatureLike, layer: L.Layer) => {
              layer.bindPopup(buildPopupHtml(feature.properties));
            },
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
