# Graph Report - xy-latlng-to-map  (2026-09-19)

## Corpus Check
- Large corpus: 121 files · ~1,185,580 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 574 nodes · 759 edges · 71 communities (32 shown, 35 thin omitted)
- Extraction: 90% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Circle Drawing & Map Libraries
- Repo Instructions & Manual Maintenance
- Main App Entry & Address Search UI
- Reinfolib Layer & Popup Rendering
- Coordinate & Map Feature Concepts (GEMINI.md)
- Mapping Engine & Build Tooling (GEMINI.md)
- Manual UI Feature Descriptions
- Root package.json Metadata
- DMS/Coordinate Parsing Utilities
- Manual Screenshot Capture Script
- Dev Dependencies (Lint/Test)
- Root tsconfig.json Options
- Proxy Worker package.json
- CSV Export Utilities
- Root package.json Dependencies
- Serena Mode/Tool Commands
- Secondary tsconfig.json Options
- npm Scripts
- Proxy Worker CORS/API Handler
- GSI Address Search Module
- pnpm Dependency Overrides
- Proj4 Geodetic System Definitions
- Icon/Line Style & Context Menu UI
- Dependabot Triage Report (2026-07-26)
- ESLint Flat Config
- Coordinate Label Formatting Helpers
- Help Menu Tests
- Data Conversion & Input Format Docs
- Marker/Polyline Display Feature
- package.json Engines Field
- pnpm Workspace Build Dependencies
- Vite Build Configuration
- Circle/Distance Measurement Screenshots
- DOM Helper Utilities
- Image File Type Check
- Vite Env Type Declarations
- Address Search Autocomplete Screenshot
- Reinfolib Zoning Popup Screenshot
- Dependabot JS-YAML/Lockfile Issue
- Layer Toggle Button Screenshot
- Jest DOM Test Setup
- check.sh Script Node
- About Icon & SVG Attribution
- Bulk Icon Add Screenshots
- Print Cleanup Functions
- Print Setup Functions
- Data Input Menu Screenshot
- Circle Radius Dialog Screenshot
- Circle Radius Overlay Screenshot
- Help Panel Screenshot
- Photo Locations Screenshot
- CSV-in-Excel Screenshot
- Dependabot Configuration
- Blue Center Marker Icon
- Blue Circle Tool Icon
- Green Circle Icon
- Red Circle Icon
- Yellow Circle Icon
- Map Error Tile Image
- GitHub Mark Icon
- Green Center Marker Icon
- Help Question Mark Icon
- Distance Measurement Pin Icon
- Camera Photo Icon
- Red Center Marker Icon
- Photo On Map Screenshot
- Yellow Center Marker Icon

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `xy-latlng-to-map（プロジェクト）` - 15 edges
3. `docs/manual.html (Operation Manual)` - 14 edges
4. `about.html（このサイトについてページ）` - 13 edges
5. `createMarker()` - 12 edges
6. `compilerOptions` - 11 edges
7. `captureScreenshots()` - 11 edges
8. `leaflet` - 10 edges
9. `measureLength()` - 10 edges
10. `src/index.html (Main Page)` - 10 edges

## Surprising Connections (you probably didn't know these)
- `CI Head SHA Match Verification Rule` --semantically_similar_to--> `Repository Instructions (AGENTS.md)`  [INFERRED] [semantically similar]
  .pi/prompts/dependabot-review.md → AGENTS.md
- `Marker/Line Settings Screenshot` --references--> `src/index.html (Main Page)`  [INFERRED]
  docs/assets/screenshots/03-marker-line-settings.png → src/index.html
- `座標リストからの一括マーカー表示機能` --semantically_similar_to--> `XY座標・緯度経度リストからの一括アイコン追加`  [INFERRED] [semantically similar]
  README.md → src/about.html
- `円やマーカーの表示機能` --semantically_similar_to--> `指定した半径の円の追加`  [INFERRED] [semantically similar]
  README.md → src/about.html
- `距離計測機能` --semantically_similar_to--> `アイコン・円の中心点からの距離計測`  [INFERRED] [semantically similar]
  README.md → src/about.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Serena モード切替スラッシュコマンド群** — claude_commands_mode_and_tool_command, claude_commands_mode_to_editing_command, claude_commands_mode_to_interactive_command, claude_commands_mode_to_onboarding_command, claude_commands_mode_to_planning_command, claude_commands_serena [EXTRACTED 0.90]
- **Dependabot to Review CI Governance Flow** — github_dependabot, github_workflows_review, pi_prompts_dependabot_review, agents_untrusted_pr_input_rationale [INFERRED 0.85]
- **Cross-Agent Repository Instruction Set** — agents, gemini, agents_skills_html_manual_maintainer_skill_html_manual_maintainer, pi_prompts_dependabot_review [INFERRED 0.75]
- **UI-to-Manual Documentation Pipeline** — agents_skills_html_manual_maintainer_skill_html_manual_maintainer, src_index, docs_manual [INFERRED 0.85]

## Communities (71 total, 35 thin omitted)

### Community 0 - "Circle Drawing & Map Libraries"
Cohesion: 0.09
Nodes (38): exifr, geo4326, leaflet, leaflet-arrowheads, leaflet-contextmenu, addCircle(), circleMenuItems, isInnerCircle() (+30 more)

### Community 1 - "Repo Instructions & Manual Maintenance"
Cohesion: 0.06
Nodes (46): Repository Instructions (AGENTS.md), check.sh Verification Requirement, Empty Google Maps API Key Disables Layer, HTML Manual Maintainer OpenAI Agent Interface, Manual Screenshot Capture Workflow, HTML Manual Maintainer Skill, Treat PR Content as Untrusted Input, Marker/Line Settings Screenshot (+38 more)

### Community 2 - "Main App Entry & Address Search UI"
Cohesion: 0.05
Nodes (32): addCircleToMap, addMarkerBtn, addressSearchContainer, addressSearchForm, addressSearchInput, addressSearchMessage, addressSearchResultsList, cancelAddCircle (+24 more)

### Community 3 - "Reinfolib Layer & Popup Rendering"
Cohesion: 0.09
Nodes (30): buildCombinedPopupHtml(), buildLayerInfoInnerHtml(), buildPrintGridHtml(), COMMON_FIELD_LABELS, createReinfolibInfoHandler(), displayValueForKey(), escapeHtml(), EXCLUDED_KEYS (+22 more)

### Community 4 - "Coordinate & Map Feature Concepts (GEMINI.md)"
Cohesion: 0.09
Nodes (28): Bootstrap, 座標リストからの一括マーカー表示機能, 円やマーカーの表示機能, 距離計測機能, 日本測地系と世界測地系の相互変換機能, XY座標と緯度経度の相互変換機能, geo4326, Jspreadsheet CE (+20 more)

### Community 5 - "Mapping Engine & Build Tooling (GEMINI.md)"
Cohesion: 0.08
Nodes (26): Project Context (GEMINI.md), Leaflet Mapping Engine, Proj4 Coordinate Transformation, Vite Build Tool, leaflet.gridlayer.googlemutant, blueCenterMarker, blueMarker, centerMarkerAnchor (+18 more)

### Community 6 - "Manual UI Feature Descriptions"
Cohesion: 0.10
Nodes (26): Add Circle to Map, Add Icon Marker to Map, Address Search Box (住所検索), Address Search Input and Button (住所検索), Application Header Bar with Title and Menu, Distance Measurement From/To Point, Footer with MIT License and Source Code Links, Usage Guide Toggle Button ("使い方を表示") (+18 more)

### Community 7 - "Root package.json Metadata"
Cohesion: 0.08
Nodes (25): typescript, license, name, packageManager, type, version, eslint, jest (+17 more)

### Community 8 - "DMS/Coordinate Parsing Utilities"
Cohesion: 0.13
Nodes (15): big.js, dms2deg(), extractNumber(), dataCleansing(), isValidNumber(), beforechangeSourceTable(), clearTable(), columnsConfig (+7 more)

### Community 9 - "Manual Screenshot Capture Script"
Cohesion: 0.16
Nodes (22): capture(), captureAddressSearch(), captureElementWithPadding(), captureScreenshots(), closeMenu(), dropGpsPhotos(), enterSampleLatLngs(), gpsPhotoPaths (+14 more)

### Community 10 - "Dev Dependencies (Lint/Test)"
Cohesion: 0.09
Nodes (23): devDependencies, eslint, @eslint/js, globals, jest, jest-environment-jsdom, @playwright/test, sass (+15 more)

### Community 11 - "Root tsconfig.json Options"
Cohesion: 0.10
Nodes (19): compileOnSave, compilerOptions, baseUrl, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, jsx (+11 more)

### Community 12 - "Proxy Worker package.json"
Cohesion: 0.12
Nodes (16): devDependencies, @cloudflare/workers-types, typescript, wrangler, typescript, name, private, scripts (+8 more)

### Community 13 - "CSV Export Utilities"
Cohesion: 0.18
Nodes (13): jspreadsheet-ce, arrayToCSV(), exportCSV(), getArrayDepth(), NestedArray, isBlankRow(), splitDataByBlankRows(), test1 (+5 more)

### Community 14 - "Root package.json Dependencies"
Cohesion: 0.13
Nodes (15): dependencies, big.js, bootstrap, exifr, geo4326, jspreadsheet-ce, jsuites, leaflet (+7 more)

### Community 15 - "Serena Mode/Tool Commands"
Cohesion: 0.17
Nodes (13): get_current_config ツール, 「モードとツールを確認」コマンド, editing interactive モード, editing no-onboarding モード, planning one-shot モード, 「モードを editing に切り替え」コマンド, 「モードを interactive に切り替え」コマンド, 「モードを onboarding に切り替え」コマンド (+5 more)

### Community 16 - "Secondary tsconfig.json Options"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noEmit, skipLibCheck (+4 more)

### Community 17 - "npm Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, check, dev, lint, manual:screenshots, preview, test

### Community 18 - "Proxy Worker CORS/API Handler"
Cohesion: 0.48
Nodes (6): ALLOWED_API_IDS, buildCorsHeaders(), Env, fetch(), jsonError(), parseAllowedOrigins()

### Community 19 - "GSI Address Search Module"
Cohesion: 0.52
Nodes (5): AddressSearchResult, buildGsiSearchUrl(), GsiAddressSearchFeature, parseGsiSearchResponse(), searchAddress()

### Community 20 - "pnpm Dependency Overrides"
Cohesion: 0.40
Nodes (5): glob@^10.0.0, js-yaml, rollup, pnpm, overrides

### Community 21 - "Proj4 Geodetic System Definitions"
Cohesion: 0.40
Nodes (4): proj4, GeodeticSystemName, GeodeticSystems, proj4Defs

### Community 22 - "Icon/Line Style & Context Menu UI"
Cohesion: 0.67
Nodes (4): Icon Color / Line Style Controls, Leaflet Map Rendering, Map Right-Click Context Actions, Screenshot: Icon-Only Settings Panel

### Community 23 - "Dependabot Triage Report (2026-07-26)"
Cohesion: 0.50
Nodes (4): Dependabot Triage Report (2026-07-26), Client-Side SPA Risk Rationale, PR #13: Bump immutable 5.1.5 to 5.1.9, PR #14: Bump postcss 8.5.15 to 8.5.23

### Community 24 - "ESLint Flat Config"
Cohesion: 0.50
Nodes (3): @eslint/js, globals, typescript-eslint

### Community 25 - "Coordinate Label Formatting Helpers"
Cohesion: 0.50
Nodes (4): buildHeaderText(), getAxisLabels(), getGeodeticLabel(), getZoneLabel()

### Community 27 - "Data Conversion & Input Format Docs"
Cohesion: 1.00
Nodes (3): Data Conversion Tab (データ変換), Accepted Input Data Formats (XY / DMS / Decimal Lat-Lng), Input Formats Help Dialog Screenshot

### Community 28 - "Marker/Polyline Display Feature"
Cohesion: 0.67
Nodes (3): Leaflet (mapping library), Marker and Polyline Map Display Feature, Markers and Lines Screenshot

### Community 29 - "package.json Engines Field"
Cohesion: 0.67
Nodes (3): engines, node, pnpm

### Community 30 - "pnpm Workspace Build Dependencies"
Cohesion: 0.67
Nodes (3): pnpm-workspace.yaml 設定, esbuild（ignoredBuiltDependencies）, unrs-resolver（ignoredBuiltDependencies）

### Community 32 - "Circle/Distance Measurement Screenshots"
Cohesion: 0.67
Nodes (3): Circle Radius Feature Screenshot, Measure Any Points Screenshot, Measure Icon And Circle Screenshot

### Community 33 - "DOM Helper Utilities"
Cohesion: 0.67
Nodes (3): isElement(), isNodeList(), setupDialog()

## Ambiguous Edges - Review These
- `check.sh Verification Requirement` → `Separate pnpm Workspace to Avoid Parent Misdetection`  [AMBIGUOUS]
  proxy/pnpm-workspace.yaml · relation: conceptually_related_to
- `Layer Menu Screenshot (01-layer-menu.png)` → `Address Search Input and Button (住所検索)`  [AMBIGUOUS]
  docs/assets/screenshots/01-layer-menu.png · relation: conceptually_related_to

## Knowledge Gaps
- **287 isolated node(s):** `name`, `version`, `license`, `type`, `packageManager` (+282 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 314 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `check.sh Verification Requirement` and `Separate pnpm Workspace to Avoid Parent Misdetection`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Layer Menu Screenshot (01-layer-menu.png)` and `Address Search Input and Button (住所検索)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `leaflet` connect `Circle Drawing & Map Libraries` to `Main App Entry & Address Search UI`, `Reinfolib Layer & Popup Rendering`, `Mapping Engine & Build Tooling (GEMINI.md)`, `Root package.json Metadata`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `bootstrap` connect `Coordinate & Map Feature Concepts (GEMINI.md)` to `Main App Entry & Address Search UI`, `Root package.json Metadata`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **What connects `name`, `version`, `license` to the rest of the system?**
  _287 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Circle Drawing & Map Libraries` be split into smaller, more focused modules?**
  _Cohesion score 0.09306122448979592 - nodes in this community are weakly interconnected._
- **Should `Repo Instructions & Manual Maintenance` be split into smaller, more focused modules?**
  _Cohesion score 0.05507246376811594 - nodes in this community are weakly interconnected._