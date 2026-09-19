# Graph Report - xy-latlng-to-map  (2026-07-31)

## Corpus Check
- 61 files · ~917,019 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 426 nodes · 554 edges · 48 communities (26 shown, 22 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5a315d45`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- map.ts
- index.ts
- dependencies
- compilerOptions
- leaflet.ts
- jspreadsheet.ts
- コミットce39c8b（印刷時の地図中央配置修正）
- package.json
- index.html（メインページ）
- capture-manual-screenshots.mjs
- help-menu.test.ts
- Serena（MCPツール群）
- exportCSV.test.ts
- proj4.ts
- buildHeaderText
- splitTableData.ts
- pnpm-workspace.yaml 設定
- Measure Icon And Circle Screenshot
- setupDialog
- isImageFile.ts
- vite-env.d.ts
- About Icon (Info Circle SVG)
- Add Icons Screenshot
- afterPrint
- applyPrintSize
- Blue Center Marker Icon
- Blue Circle Draw Tool Icon
- Green Circle Icon
- Red Circle Icon
- Yellow Circle Icon (GIS ring/donut icon)
- Error Tile Image (Zoom Level Unavailable)
- GitHub Mark Icon (SVG)
- Green Center Marker Icon
- Help Icon (Question Mark)
- Length Pin Icon
- Photo Icon (Camera SVG)
- Red Center Marker Icon
- Photo On Map Screenshot
- Yellow Center Marker Icon

## God Nodes (most connected - your core abstractions)
1. `index.html（メインページ）` - 22 edges
2. `xy-latlng-to-map（プロジェクト）` - 17 edges
3. `compilerOptions` - 16 edges
4. `about.html（このサイトについてページ）` - 13 edges
5. `createMarker()` - 11 edges
6. `captureScreenshots()` - 10 edges
7. `measureLength()` - 10 edges
8. `mapSource.html（地図の出典についてページ）` - 10 edges
9. `hasLatLng()` - 9 edges
10. `scripts` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Google Maps帰属表示の印刷崩れ問題` --semantically_similar_to--> `印刷時の地図左上切り出し問題`  [INFERRED] [semantically similar]
  temp.md → temp2.md
- `変換ボタン（データ変換タブ）` --semantically_similar_to--> `XY座標と緯度経度の相互変換機能`  [INFERRED] [semantically similar]
  src/index.html → README.md
- `変換ボタン（データ変換タブ）` --semantically_similar_to--> `日本測地系と世界測地系の相互変換機能`  [INFERRED] [semantically similar]
  src/index.html → README.md
- `座標リストからの一括マーカー表示機能` --semantically_similar_to--> `XY座標・緯度経度リストからの一括アイコン追加`  [INFERRED] [semantically similar]
  README.md → src/about.html
- `座標リストからの一括マーカー表示機能` --semantically_similar_to--> `アイコンの一括追加ボタン`  [INFERRED] [semantically similar]
  README.md → src/index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Serena モード切替スラッシュコマンド群** — claude_commands_mode_and_tool_command, claude_commands_mode_to_editing_command, claude_commands_mode_to_interactive_command, claude_commands_mode_to_onboarding_command, claude_commands_mode_to_planning_command, claude_commands_serena [EXTRACTED 0.90]
- **Google Maps帰属表示 印刷崩れ修正フロー** — temp_google_maps_print_attribution_bug, temp_googlemutant_setupattribution, temp_fix_a2_nowrap, temp_commit_875c9b3, src_css__layout [EXTRACTED 0.90]
- **印刷時の地図中央配置修正フロー** — temp2_applyprintsize_function, temp2_removeprintsize_function, temp2_prepareprint_function, temp2_afterprint_function, temp2_onprintchange_listener, temp2_layout_scss_page_rule [EXTRACTED 0.90]

## Communities (48 total, 22 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.04
Nodes (45): eslint, @eslint/js, globals, jest, jest-environment-jsdom, devDependencies, eslint, @eslint/js (+37 more)

### Community 1 - "map.ts"
Cohesion: 0.14
Nodes (25): circleMenuItems, isInnerCircle(), measureFromThisCircle(), measureToThisCircle(), removeCircle(), formatNoGpsMessage(), addPhotoPoint(), ContextMenuEvent (+17 more)

### Community 2 - "index.ts"
Cohesion: 0.06
Nodes (28): addCircle(), addCircleToMap, addMarkerBtn, cancelAddCircle, circleRadius, clearConvertedTableBtn, clearSourceTableBtn, ConvertParameter (+20 more)

### Community 3 - "dependencies"
Cohesion: 0.07
Nodes (29): big.js, bootstrap, exifr, geo4326, jspreadsheet-ce, jsuites, leaflet, leaflet-arc (+21 more)

### Community 4 - "compilerOptions"
Cohesion: 0.08
Nodes (25): dist, dom, es2020, node_modules, src/**/*, test/**/*, compileOnSave, compilerOptions (+17 more)

### Community 5 - "leaflet.ts"
Cohesion: 0.08
Nodes (25): baseMapsWithoutGoogle, blueCenterMarker, blueMarker, centerMarkerAnchor, centerMarkers, centerMarkerSize, createGoogleMutantLayers(), getBaseMaps() (+17 more)

### Community 6 - "jspreadsheet.ts"
Cohesion: 0.13
Nodes (14): dms2deg(), extractNumber(), dataCleansing(), isValidNumber(), beforechangeSourceTable(), clearTable(), columnsConfig, convertedTable (+6 more)

### Community 7 - "コミットce39c8b（印刷時の地図中央配置修正）"
Cohesion: 0.13
Nodes (22): src/css/_layout.scss, Google Maps JavaScript API（APIキー設定時のみ条件付き読み込み）, js/index.ts, afterPrint()関数, applyPrintSize()関数, コミットce39c8b（印刷時の地図中央配置修正）, invalidateSize()呼び出しタイミング問題, @media printのflexセンタリング（用紙中央配置） (+14 more)

### Community 8 - "package.json"
Cohesion: 0.12
Nodes (16): license, name, glob@^10.0.0, js-yaml, rollup, pnpm, overrides, scripts (+8 more)

### Community 9 - "index.html（メインページ）"
Cohesion: 0.05
Nodes (57): Bootstrap, 座標リストからの一括マーカー表示機能, 円やマーカーの表示機能, 距離計測機能, 日本測地系と世界測地系の相互変換機能, XY座標と緯度経度の相互変換機能, geo4326, Jspreadsheet CE (+49 more)

### Community 10 - "capture-manual-screenshots.mjs"
Cohesion: 0.19
Nodes (17): capture(), captureElementWithPadding(), captureScreenshots(), closeMenu(), dropGpsPhotos(), enterSampleLatLngs(), gpsPhotoPaths, openMenu() (+9 more)

### Community 13 - "Serena（MCPツール群）"
Cohesion: 0.17
Nodes (13): get_current_config ツール, 「モードとツールを確認」コマンド, editing interactive モード, editing no-onboarding モード, planning one-shot モード, 「モードを editing に切り替え」コマンド, 「モードを interactive に切り替え」コマンド, 「モードを onboarding に切り替え」コマンド (+5 more)

### Community 14 - "exportCSV.test.ts"
Cohesion: 0.23
Nodes (10): arrayToCSV(), exportCSV(), getArrayDepth(), NestedArray, test1, test2, test3, test4 (+2 more)

### Community 15 - "proj4.ts"
Cohesion: 0.40
Nodes (4): getParams(), GeodeticSystemName, GeodeticSystems, proj4Defs

### Community 16 - "buildHeaderText"
Cohesion: 0.50
Nodes (4): buildHeaderText(), getAxisLabels(), getGeodeticLabel(), getZoneLabel()

### Community 18 - "pnpm-workspace.yaml 設定"
Cohesion: 0.67
Nodes (3): pnpm-workspace.yaml 設定, esbuild（ignoredBuiltDependencies）, unrs-resolver（ignoredBuiltDependencies）

### Community 19 - "Measure Icon And Circle Screenshot"
Cohesion: 0.67
Nodes (3): Circle Radius Feature Screenshot, Measure Any Points Screenshot, Measure Icon And Circle Screenshot

### Community 20 - "setupDialog"
Cohesion: 0.67
Nodes (3): isElement(), isNodeList(), setupDialog()

## Knowledge Gaps
- **190 isolated node(s):** `name`, `version`, `license`, `type`, `dev` (+185 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `index.html（メインページ）` connect `index.html（メインページ）` to `コミットce39c8b（印刷時の地図中央配置修正）`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `xy-latlng-to-map（プロジェクト）` (e.g. with `about.html（このサイトについてページ）` and `index.html（メインページ）`) actually correct?**
  _`xy-latlng-to-map（プロジェクト）` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `license` to the rest of the system?**
  _190 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `map.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13813813813813813 - nodes in this community are weakly interconnected._