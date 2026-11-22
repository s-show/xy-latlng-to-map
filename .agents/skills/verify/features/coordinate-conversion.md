# Coordinate conversion

Coordinate conversion lets a user convert coordinates in the source table between LatLng and Japan Plane Rectangular XY coordinates across TOKYO, JGD2000, and JGD2011 geodetic systems, view results in the converted table, and download a CSV file with headers.

## Sub-features

- `convert-xy-latlng` converts source coordinates into the selected target type, geodetic system, and zone number.
- `convert-export-csv` downloads a `data.csv` file containing multi-row source/target headers alongside converted values.

## How to get to it (user POV)

- Open the menu via `メニューを開く` (`#menu-toggle-btn`), select source type/geodetic system/zone and enter coordinates in `#source-data-table`.
- Switch to the `データ変換` tab (`a[href="#data-convert-pane"]`), choose target format/geodetic system/zone, and click `変換` (`#data-convert-btn`).
- Click `CSV形式でダウンロード` (`#export-csv-btn`) to save `data.csv`.

## Driving it with verify-app.mjs

Preconditions:

- An isolated instance is running and `node .agents/skills/verify/scripts/verify-app.mjs doctor --run-id "$RUN_ID"` returns `healthy: true`.

- **Run full scenario.** Execute `node .agents/skills/verify/scripts/verify-app.mjs drive --run-id "$RUN_ID" --scenario coordinate-conversion`.
- **Configure source coordinates.** Opens `#menu-column`, selects `#source-is-latlng` and `#source-is-jgd2011`, sets row 0 to the Japanese Origin of Longitude and Latitude (`35.6580992222`, `139.7413574722`, `日本経緯度原点`), and clears rows 1 and 2.
- **Convert to Zone 9 XY.** Opens `a[href="#data-convert-pane"]`, checks `#convert-to-xy` and `#convert-to-jgd2011`, selects `9` in `#convert-zone-no`, and clicks `#data-convert-btn`. `#converted-data-table` row 0 populates with X near `-37900` and Y near `-8300`.
- **Download CSV side effect.** Clicks `#export-csv-btn`, captures the browser download as `data.csv` in the evidence directory, and verifies the saved file contains `変換元`, `9系`, and `35.6580992222`.
- **Proof.** Confirm `/tmp/xy-latlng-to-map-verify/evidence/$RUN_ID/coordinate-conversion/` contains `before.png`, `after.png`, `data.csv`, `aria.txt`, and `result.json` with `passed: true`.

## Gotchas

- Selecting `緯度経度` disables the zone selector (`#source-zone-no` / `#convert-zone-no`) and resets it to option 0. Switch to `XY座標` before selecting a zone number `1`–`19`.
- `#source-data-table` starts with 3 sample rows. Failing to clear rows 1 and 2 causes extra rows to be converted and included in `data.csv`.
- CSV export uses a temporary Blob `<a>` element download; Playwright must have `acceptDownloads: true` (handled by `verify-app.mjs`) and await the `download` event before clicking `#export-csv-btn`.
