/**
 * GPS情報がなかったファイル名のリストから通知メッセージを生成する
 * @param fileNames - GPS情報が取得できなかったファイル名のリスト
 * @returns 通知メッセージ（対象がない場合は null）
 */
export function formatNoGpsMessage(fileNames: string[]): string | null {
  if (fileNames.length === 0) return null;
  if (fileNames.length === 1) return `この画像にはGPS情報がありません: ${fileNames[0]}`;
  return `${fileNames.length}件の画像にGPS情報がありません:\n${fileNames.join(', ')}`;
}
