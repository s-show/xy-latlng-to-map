/**
 * 住所入力欄から国土地理院の住所検索APIを使って緯度経度を取得するための処理。
 * APIキー不要・CORS許可済みのため、プロキシを介さずフロントエンドから直接呼び出す。
 * 参考: https://www.gsi.go.jp/johofukyu/johofukyu41000.html
 */

const GSI_ADDRESS_SEARCH_URL = 'https://msearch.gsi.go.jp/address-search/AddressSearch';

export interface AddressSearchResult {
  title: string;
  lat: number;
  lng: number;
}

interface GsiAddressSearchFeature {
  geometry?: {
    coordinates?: unknown;
  };
  properties?: {
    title?: unknown;
  };
}

/**
 * 住所検索APIのリクエストURLを組み立てる
 * @param query - 検索したい住所文字列
 * @return 組み立てたリクエストURL
 */
export function buildGsiSearchUrl(query: string): string {
  const url = new URL(GSI_ADDRESS_SEARCH_URL);
  url.searchParams.set('q', query);
  return url.toString();
}

/**
 * 住所検索APIのレスポンス（GeoJSON Feature の配列）を、
 * 地図移動に使いやすい形式（タイトル＋緯度経度）の配列に変換する。
 * 座標がGeoJSON仕様([経度, 緯度]の順)で返ってくる点に注意。
 * 形式が不正な要素は無視する。
 * @param data - APIレスポンスをJSONパースしたもの
 * @return 検索結果の配列
 */
export function parseGsiSearchResponse(data: unknown): AddressSearchResult[] {
  if (!Array.isArray(data)) {
    return [];
  }
  const results: AddressSearchResult[] = [];
  for (const item of data as GsiAddressSearchFeature[]) {
    const coordinates = item?.geometry?.coordinates;
    const title = item?.properties?.title;
    if (
      Array.isArray(coordinates) &&
      coordinates.length >= 2 &&
      typeof title === 'string' &&
      title !== ''
    ) {
      const [lng, lat] = coordinates;
      if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
        results.push({ title, lat, lng });
      }
    }
  }
  return results;
}

/**
 * 住所文字列から候補地点（タイトル＋緯度経度）の一覧を取得する
 * @param query - 検索したい住所文字列
 * @return 検索結果の配列（該当なしの場合は空配列）
 */
export async function searchAddress(query: string): Promise<AddressSearchResult[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery === '') {
    return [];
  }
  const response = await fetch(buildGsiSearchUrl(trimmedQuery));
  if (!response.ok) {
    throw new Error(`住所検索に失敗しました (HTTP ${response.status})`);
  }
  const data: unknown = await response.json();
  return parseGsiSearchResponse(data);
}
