/**
 * 不動産情報ライブラリのオーバーレイレイヤー生成ロジックのテスト。
 *
 * 検証対象:
 * - プロキシURL未設定時はレイヤーを一切生成しないこと（APIキーが無い状態と同義のため）
 * - プロキシURL設定時は6レイヤー分のLeafletレイヤーが生成されること
 * - 生成されたレイヤーがズームレベル11〜15のみで有効になっていること
 *
 * 検証限界（手動確認対象）:
 * - 実際にタイルを取得して地図上に描画される見た目
 * - プロキシ（Cloudflare Workers）との実通信
 * このテストはネットワークアクセスを一切行わない（レイヤーの construct のみ検証する）。
 */
import L from 'leaflet';
import { getReinfolibOverlays, REINFOLIB_LAYER_DEFINITIONS } from '../../src/js/reinfolibLayer.js';

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
