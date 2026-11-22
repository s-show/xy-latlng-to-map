# Markers and lines

Markers and lines lets a user enter or paste coordinates and memos into the source table, plot colored markers and connecting polylines on the map, inspect memo popups, and clear all plotted shapes.

## Sub-features

- `markers-bulk-add` plots all valid coordinate rows from `#source-data-table` with the selected icon and line colors.
- `markers-memo-popup` opens the row's memo text when a user clicks a plotted marker.
- `markers-clear-all` removes every user-added marker and polyline while keeping the base map tiles intact.

## How to get to it (user POV)

- Open the menu popover via the `メニューを開く` button (`#menu-toggle-btn`), enter coordinates in the source table, pick icon/line colors under the `地図加工` tab, and click `アイコンの一括追加` (`#add-marker-btn`).
- Click any plotted marker on the map to open its memo popup.
- Click `全図形を削除` (`#remove-marker-btn`) in the `地図加工` tab to clear plotted markers and lines.

## Driving it with verify-app.mjs

Preconditions:

- An isolated instance is running and `node .agents/skills/verify/scripts/verify-app.mjs doctor --run-id "$RUN_ID"` returns `healthy: true`.
- The map is loaded at the default view with mocked GSI tiles.

- **Run full scenario.** Execute `node .agents/skills/verify/scripts/verify-app.mjs drive --run-id "$RUN_ID" --scenario markers-and-lines`.
- **Enter source data.** The harness opens `#menu-column` via `メニューを開く`, checks `#source-is-latlng` and `#source-is-jgd2011`, and writes 3 Tokyo-area coordinates with memos into `#source-data-table`.
- **Plot markers and lines.** Selects `red` on `#select-marker-icon` and `yellow` on `#select-line-color`, clicks `アイコンの一括追加`, and closes the menu. Exactly 3 `.leaflet-marker-icon` elements and 2 `.leaflet-overlay-pane path` polyline segments appear.
- **Inspect memo popup.** Clicks the first plotted marker. `.leaflet-popup-content` displays `東京タワー付近`.
- **Clear all shapes.** Reopens the menu and clicks `全図形を削除`. Both `.leaflet-marker-icon` and `.leaflet-overlay-pane path` counts drop to `0`.
- **Proof.** Confirm `/tmp/xy-latlng-to-map-verify/evidence/$RUN_ID/markers-and-lines/` contains `before.png`, `after.png`, `after-clear.png`, `aria.txt`, and `result.json` with `passed: true`.

## Gotchas

- `#source-data-table` is pre-populated with 3 dummy numeric rows (`110.1, 51.1` etc.) on initial load. Overwrite or clear unused rows before plotting or converting, otherwise dummy rows are included.
- Blank rows in `#source-data-table` split polylines into separate groups; lines connect only adjacent valid rows within the same group.
- Setting `#select-marker-icon` to `none` omits markers, and setting `#select-line-color` to `no` omits lines.
- Menu visibility uses the native HTML Popover API (`:popover-open`), not Bootstrap offcanvas classes.
