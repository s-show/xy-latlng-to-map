# Graph Report - .  (2026-07-30)

## Corpus Check
- 84 files · ~165,446 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 401 nodes · 516 edges · 49 communities (28 shown, 21 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.72)
- Token cost: 514,300 input · 0 output

## Community Hubs (Navigation)
- Dev Tooling & Testing Config
- Circle & Photo-Drop Features
- Main Entry & Conversion UI
- Project Dependencies
- TypeScript Config
- Leaflet Basemap & Markers
- Coordinate Parsing & Data Table
- Print Layout Bug Fixes
- Package Scripts & Build Config
- Index Page UI Partials
- About Page & Manual Features
- About Page Feature Descriptions
- Map Source Attribution
- Serena MCP Mode Commands
- CSV Export & Tests
- Proj4 Geodetic System Config
- CSV Header Label Builders
- Table Row Splitting Utility
- PNPM Workspace Config
- Measure & Circle Screenshots
- DOM Helper Utilities
- Image File Validation
- Vite Env Types
- About Icon Attribution
- Batch Marker Screenshots
- Print Cleanup Functions
- Print Setup Functions
- Blue Center Marker Icon
- Blue Circle Tool Icon
- Green Circle Tool Icon
- Red Circle Tool Icon
- Yellow Circle Tool Icon
- Map Error Tile Image
- GitHub Link Icon
- Green Center Marker Icon
- Help Icon
- Measure Tool Pin Icon
- Photo Drop Icon
- Red Center Marker Icon
- Photo-on-Map Screenshot
- Yellow Center Marker Icon

## God Nodes (most connected - your core abstractions)
1. `index.html（メインページ）` - 22 edges
2. `xy-latlng-to-map（プロジェクト）` - 18 edges
3. `compilerOptions` - 16 edges
4. `about.html（このサイトについてページ）` - 13 edges
5. `createMarker()` - 11 edges
6. `measureLength()` - 10 edges
7. `mapSource.html（地図の出典についてページ）` - 10 edges
8. `hasLatLng()` - 9 edges
9. `scripts` - 6 edges
10. `isValidNumber()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `緯度経度変換ツールマニュアル.pdf（ユーザーマニュアル）` --references--> `xy-latlng-to-map（プロジェクト）`  [INFERRED]
  緯度経度変換ツールマニュアル.pdf → README.md
- `座標リストからの一括マーカー表示機能` --semantically_similar_to--> `アイコンの一括追加ボタン`  [INFERRED] [semantically similar]
  README.md → src/index.html
- `Google Maps帰属表示の印刷崩れ問題` --semantically_similar_to--> `印刷時の地図左上切り出し問題`  [INFERRED] [semantically similar]
  temp.md → temp2.md
- `変換ボタン（データ変換タブ）` --semantically_similar_to--> `XY座標と緯度経度の相互変換機能`  [INFERRED] [semantically similar]
  src/index.html → README.md
- `変換ボタン（データ変換タブ）` --semantically_similar_to--> `日本測地系と世界測地系の相互変換機能`  [INFERRED] [semantically similar]
  src/index.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Serena モード切替スラッシュコマンド群** — claude_commands_mode_and_tool_command, claude_commands_mode_to_editing_command, claude_commands_mode_to_interactive_command, claude_commands_mode_to_onboarding_command, claude_commands_mode_to_planning_command, claude_commands_serena [EXTRACTED 0.90]
- **Google Maps帰属表示 印刷崩れ修正フロー** — temp_google_maps_print_attribution_bug, temp_googlemutant_setupattribution, temp_fix_a2_nowrap, temp_commit_875c9b3, src_css__layout [EXTRACTED 0.90]
- **印刷時の地図中央配置修正フロー** — temp2_applyprintsize_function, temp2_removeprintsize_function, temp2_prepareprint_function, temp2_afterprint_function, temp2_onprintchange_listener, temp2_layout_scss_page_rule [EXTRACTED 0.90]

## Communities (49 total, 21 thin omitted)

### Community 0 - "Dev Tooling & Testing Config"
Cohesion: 0.05
Nodes (43): eslint, @eslint/js, globals, jest, jest-environment-jsdom, devDependencies, eslint, @eslint/js (+35 more)

### Community 1 - "Circle & Photo-Drop Features"
Cohesion: 0.12
Nodes (28): addCircle(), circleMenuItems, isInnerCircle(), measureFromThisCircle(), measureToThisCircle(), removeCircle(), formatNoGpsMessage(), addPhotoPoint() (+20 more)

### Community 2 - "Main Entry & Conversion UI"
Cohesion: 0.06
Nodes (27): addCircleToMap, addMarkerBtn, cancelAddCircle, circleRadius, clearConvertedTableBtn, clearSourceTableBtn, ConvertParameter, dataConvertBtn (+19 more)

### Community 3 - "Project Dependencies"
Cohesion: 0.07
Nodes (29): big.js, bootstrap, exifr, geo4326, jspreadsheet-ce, jsuites, leaflet, leaflet-arc (+21 more)

### Community 4 - "TypeScript Config"
Cohesion: 0.08
Nodes (25): dist, dom, es2020, node_modules, src/**/*, test/**/*, compileOnSave, compilerOptions (+17 more)

### Community 5 - "Leaflet Basemap & Markers"
Cohesion: 0.09
Nodes (23): blueCenterMarker, blueMarker, centerMarkerAnchor, centerMarkers, centerMarkerSize, createGoogleMutantLayers(), getBaseMaps(), greenCenterMarker (+15 more)

### Community 6 - "Coordinate Parsing & Data Table"
Cohesion: 0.13
Nodes (14): dms2deg(), extractNumber(), dataCleansing(), isValidNumber(), beforechangeSourceTable(), clearTable(), columnsConfig, convertedTable (+6 more)

### Community 7 - "Print Layout Bug Fixes"
Cohesion: 0.13
Nodes (22): src/css/_layout.scss, Google Maps JavaScript API（APIキー設定時のみ条件付き読み込み）, js/index.ts, afterPrint()関数, applyPrintSize()関数, コミットce39c8b（印刷時の地図中央配置修正）, invalidateSize()呼び出しタイミング問題, @media printのflexセンタリング（用紙中央配置） (+14 more)

### Community 8 - "Package Scripts & Build Config"
Cohesion: 0.12
Nodes (15): license, name, glob@^10.0.0, js-yaml, rollup, pnpm, overrides, scripts (+7 more)

### Community 9 - "Index Page UI Partials"
Cohesion: 0.16
Nodes (16): 変換結果テーブル（converted-data-table）, アイコンの一括追加ボタン, CSV形式でダウンロードボタン, 全図形を削除ボタン, 地図拡大表示スライダー（zoom-range）, #map（Leaflet地図要素）, index.html（メインページ）, データテーブル（jSpreadsheet, source-data-table） (+8 more)

### Community 10 - "About Page & Manual Features"
Cohesion: 0.20
Nodes (14): 緯度経度変換ツールマニュアル.pdf（ユーザーマニュアル）, Bootstrap, 日本測地系と世界測地系の相互変換機能, XY座標と緯度経度の相互変換機能, geo4326, Jspreadsheet CE, Leaflet, Leaflet.Arc (+6 more)

### Community 11 - "About Page Feature Descriptions"
Cohesion: 0.15
Nodes (14): 座標リストからの一括マーカー表示機能, 円やマーカーの表示機能, 距離計測機能, 作者 s-show（閑古鳥ブログ）, 任意の場所へのアイコン追加, XY座標・緯度経度リストからの一括アイコン追加, 指定した半径の円の追加, アイコン・円の削除 (+6 more)

### Community 12 - "Map Source Attribution"
Cohesion: 0.16
Nodes (14): GRUS衛星画像（Axelspace）, GEBCO Digital Atlas（海底地形データ）, Google Map（出典）, 地理院地図（航空写真）, 地理院地図（航空写真・1961-1969年）, 地理院地図（航空写真・1974-1978年）, 地理院地図（淡色地図）, 地理院地図（標準地図） (+6 more)

### Community 13 - "Serena MCP Mode Commands"
Cohesion: 0.17
Nodes (13): get_current_config ツール, 「モードとツールを確認」コマンド, editing interactive モード, editing no-onboarding モード, planning one-shot モード, 「モードを editing に切り替え」コマンド, 「モードを interactive に切り替え」コマンド, 「モードを onboarding に切り替え」コマンド (+5 more)

### Community 14 - "CSV Export & Tests"
Cohesion: 0.23
Nodes (10): arrayToCSV(), exportCSV(), getArrayDepth(), NestedArray, test1, test2, test3, test4 (+2 more)

### Community 15 - "Proj4 Geodetic System Config"
Cohesion: 0.40
Nodes (4): getParams(), GeodeticSystemName, GeodeticSystems, proj4Defs

### Community 16 - "CSV Header Label Builders"
Cohesion: 0.50
Nodes (4): buildHeaderText(), getAxisLabels(), getGeodeticLabel(), getZoneLabel()

### Community 18 - "PNPM Workspace Config"
Cohesion: 0.67
Nodes (3): pnpm-workspace.yaml 設定, esbuild（ignoredBuiltDependencies）, unrs-resolver（ignoredBuiltDependencies）

### Community 19 - "Measure & Circle Screenshots"
Cohesion: 0.67
Nodes (3): Circle Radius Feature Screenshot, Measure Any Points Screenshot, Measure Icon And Circle Screenshot

### Community 20 - "DOM Helper Utilities"
Cohesion: 0.67
Nodes (3): isElement(), isNodeList(), setupDialog()

## Knowledge Gaps
- **183 isolated node(s):** `name`, `version`, `license`, `type`, `dev` (+178 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dev Tooling & Testing Config` to `Package Scripts & Build Config`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `index.html（メインページ）` connect `Index Page UI Partials` to `About Page & Manual Features`, `About Page Feature Descriptions`, `Map Source Attribution`, `Print Layout Bug Fixes`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Project Dependencies` to `Package Scripts & Build Config`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `xy-latlng-to-map（プロジェクト）` (e.g. with `緯度経度変換ツールマニュアル.pdf（ユーザーマニュアル）` and `about.html（このサイトについてページ）`) actually correct?**
  _`xy-latlng-to-map（プロジェクト）` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `license` to the rest of the system?**
  _183 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dev Tooling & Testing Config` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `Circle & Photo-Drop Features` be split into smaller, more focused modules?**
  _Cohesion score 0.12179487179487179 - nodes in this community are weakly interconnected._