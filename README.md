# xy-latlng-to-map

国土地理院の地理院地図をベースにして、以下の機能を盛り込んだ Webアプリです。

- XY座標と緯度経度を相互に変換
- 日本測地系と世界測地系のデータを相互に変換
- XY座標や緯度経度が示す場所にまとめてマーカーを表示
- 地図の好きな場所に円やマーカーを表示
- 任意の2点間やマーカー・円の間の距離を計測
- URL クエリパラメータおよびブラウザ JS API（`window.xyLatLngToMap`）によるアイコン追加

[xy-latlng-to-map](https://xy-latlng-to-map.com/)

## アイコン追加 API

静的サイト構成のまま、URL クエリパラメータ（ページ読込時の初期表示）と `window.xyLatLngToMap`（読込後の動的操作）の 2 つの方法で地図へアイコンを追加できます。どちらも地図レイヤーのみを更新し、メニュー内のデータテーブルは変更しません。

> **平面直角座標（XY）の軸の向きに注意**: 本アプリは日本の平面直角座標系の定義に従い、第 1 座標（`x` / `first`）を南北方向（北が正）、第 2 座標（`y` / `second`）を東西方向（東が正）として扱います。

### URL クエリパラメータ

#### 単一点（緯度経度・十進数または度分秒）

```text
https://xy-latlng-to-map.com/?lat=35.658099&lng=139.741357&color=red&memo=日本経緯度原点&zoom=16
https://xy-latlng-to-map.com/?lat=北緯35度39分29秒1572&lng=東経139度44分28秒8869&memo=日本経緯度原点
```

#### 単一点（平面直角座標 XY）

```text
https://xy-latlng-to-map.com/?x=-37875.1959&y=-7958.6436&zone=9&geodetic=JGD2011&color=blue&memo=東京タワー付近
```

#### 複数点（`p` パラメータの繰り返し＋任意の線）

`p=<第1座標>,<第2座標>[,<メモ>]` を繰り返して指定します。3 個目以降のカンマはメモ文字列としてそのまま保持されます。

```text
https://xy-latlng-to-map.com/?type=latlng&geodetic=JGD2011&p=35.65858,139.745433,東京タワー&p=35.65749,139.74824,増上寺&color=green&line=yellow
```

#### パラメータ一覧

| パラメータ | 説明 | 既定値 |
|---|---|---|
| `lat`, `lng` | 単一点の緯度・経度（十進数または度分秒形式、`x`/`y` や `p` との併用不可） | なし |
| `x`, `y` | 単一点の平面直角座標 X（南北）・Y（東西）。`zone` 必須 | なし |
| `p` | 複数点指定 `first,second[,memo]`（最大 500 点、`type=latlng` 時は度分秒形式も可） | なし |
| `type` | `latlng` または `XY`（`lat`/`lng` や `x`/`y` 指定時は自動推定） | `latlng` |
| `geodetic` | 測地系: `JGD2011` / `JGD2000` / `TOKYO` | `JGD2011` |
| `zone` | 平面直角座標系の系番号 `1`〜`19`（`XY` 時は必須、`latlng` 時は省略または `0`） | `0`（`latlng` 時） |
| `color` | アイコンの色: `red` / `blue` / `yellow` / `green` | `red` |
| `line` | 隣り合う点を結ぶ線の色: `red` / `blue` / `yellow` / `green` / `none` | なし |
| `memo` | 単一点のポップアップ表示テキスト（プレーンテキスト描画、最大 200 文字） | 空文字 |
| `zoom` | ズームレベル `2`〜`18` の整数（省略時: 1 点は 15、複数点は全体が収まる範囲） | 自動 |

マーカー関連パラメータが 1 つでも含まれ、値に不備がある場合（例: `XY` で `zone` 未指定、範囲外の座標、形式の混在など）はアイコンを描画せず、画面下部のエラー欄に理由を表示します。

### ブラウザ JS API（`window.xyLatLngToMap`）

```ts
const result = window.xyLatLngToMap?.addMarkers({
  type: 'XY',
  geodeticSystem: 'JGD2011',
  zoneNo: 9,
  points: [
    { first: -37875.1959, second: -7958.6436, memo: '東京タワー付近' },
    { first: -37995.0, second: -7704.0, memo: '増上寺付近' },
  ],
  iconColor: 'red',
  lineColor: 'yellow',
  zoom: null,
});

// 追加済みマーカー一覧を取得
const markers = window.xyLatLngToMap?.getMarkers();

// API / URL で追加したマーカーと線を全削除
const cleared = window.xyLatLngToMap?.clearMarkers();
```

- `addMarkers(input)`: `points`（単一グループ）または `groups`（複数グループの配列）を受け取り、`{ ok: true, data: { markers } }` または `{ ok: false, errors }` を返します。上限は 1 リクエスト 500 点です。
- `getMarkers()`: 追加済みの `MarkerRecord[]`（`id`, `lat`, `lng`, `color`, `memo`, `source`）のスナップショットを返します。
- `clearMarkers()`: API および URL クエリ経由で追加したマーカーと線のみを削除し、`{ clearedMarkers, clearedLines }` を返します。
- 主なエラーコード（`ApiErrorCode`）: `INVALID_COORDINATE_TYPE`, `INVALID_GEODETIC_SYSTEM`, `MISSING_ZONE_NO`, `INVALID_ZONE_NO`, `INVALID_COORDINATE`, `OUT_OF_RANGE_COORDINATE`, `EMPTY_POINTS`, `TOO_MANY_POINTS`, `CONFLICTING_INPUT`, `INVALID_ICON_COLOR`, `INVALID_LINE_COLOR`, `INVALID_ZOOM`, `INVALID_QUERY_SYNTAX`。

## テスト・自動検証

- 単体・UI テスト・Lint・型チェック・ビルド: `./scripts/check.sh`
- オフライン Playwright E2E テスト（外部タイル・API モック済み）: `pnpm test:e2e`

## 利用ライブラリ・素材

本アプリは、次のライブラリやフリー素材を利用しています。

- ライブラリ
  - [Leaflet - a JavaScript library for interactive maps](https://leafletjs.com/)
  - [slutske22/leaflet-arrowheads: A small plugin for leaflet to quickly draw arrowheads on polylines for vector visualization](https://github.com/slutske22/leaflet-arrowheads)
  - [makinacorpus/Leaflet.GeometryUtil: Leaflet utility function on geometries](https://github.com/makinacorpus/Leaflet.GeometryUtil)
  - [aratcliffe/Leaflet.contextmenu: A context menu for Leaflet.](https://github.com/aratcliffe/Leaflet.contextmenu)
  - [mad-gooze/Leaflet.Arc: Leaflet.js plugin for drawing Great Circle arcs using arc.js](https://github.com/MAD-GooZe/Leaflet.Arc)
  - [PROJ4JS | Proj4js](http://proj4js.org/)
  - [Getting Started with Jspreadsheet CE v5](https://bossanova.uk/jspreadsheet/docs/getting-started)
  - [Bootstrap · The most popular HTML, CSS, and JS library in the world.](https://getbootstrap.com/)
  - [yonda-yonda/geo4326](https://github.com/yonda-yonda/geo4326)

- アイコンなど
  - [Map Outlined Target Vector SVG Icon - SVG Repo](https://www.svgrepo.com/svg/418577/map-outlined-target)
  - [Cross Vector SVG Icon (109) - SVG Repo](https://www.svgrepo.com/svg/475147/cross)
  - [Push Pin 4 Vector SVG Icon - SVG Repo](https://www.svgrepo.com/svg/479442/push-pin-4)
  - [Help 2 Vector SVG Icon - SVG Repo](https://www.svgrepo.com/svg/502697/help-2)
  - [Github 142 Vector SVG Icon - SVG Repo](https://www.svgrepo.com/svg/512317/github-142)
  - [About Vector SVG Icon (6) - SVG Repo](https://www.svgrepo.com/svg/486929/about)
  - [Camera Vector SVG Icon (338) - SVG Repo](https://www.svgrepo.com/svg/522016/camera)
