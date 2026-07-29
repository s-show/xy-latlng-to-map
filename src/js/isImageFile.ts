/**
 * ファイルが画像かどうかを判定する
 * @param file - 判定対象のファイル
 * @returns 画像の場合 true
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}
