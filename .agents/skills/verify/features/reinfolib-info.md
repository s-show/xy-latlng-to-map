# Reinfolib urban planning info

Reinfolib urban planning info lets a user right-click a point on the map to fetch all 6 MLIT Real Estate Information Library urban planning and hazard layers in one popup, populate the hidden print summary grid, and clean up the temporary marker and print grid when the popup closes.

## Sub-features

- `reinfolib-point-popup` displays formatted attributes for all 6 layers (`XKT001`, `XKT002`, `XKT014`, `XKT023`, `XKT024`, `XKT029`) at the clicked point regardless of overlay toggle state.
- `reinfolib-marker-menu` displays the same 6-layer popup from the right-click menu of coordinate-table, URL-parameter, and JS-API icon markers without deleting the marker when the popup closes.
- `reinfolib-print-grid` populates `#reinfolib-print-info` with `.reinfolib-print-grid--has-content` so printing outputs a 2nd-page 3x2 table.
- `reinfolib-popup-cleanup` removes the temporary clicked marker (for empty-map clicks) and clears `#reinfolib-print-info` when the popup is closed.

## How to get to it (user POV)

- Right-click a location on `#map` and choose `不動産情報ライブラリの情報を表示`.
- Right-click an existing icon marker (added from the coordinate table, URL parameters, JS API, or map right-click) and choose `不動産情報ライブラリの情報を表示`.
- Read the popup sections and click the popup's `×` close button (`.leaflet-popup-close-button`) to dismiss the popup.

## Driving it with verify-app.mjs

Preconditions:

- An isolated instance was started **without** `--no-reinfolib` (so `VITE_REINFOLIB_PROXY_URL` points to `https://verify-reinfolib.invalid`, intercepted locally by `verify-app.mjs`).
- `node .agents/skills/verify/scripts/verify-app.mjs doctor --run-id "$RUN_ID"` returns `healthy: true` with a non-empty `reinfolibProxyUrl`.

- **Run full scenario.** Execute `node .agents/skills/verify/scripts/verify-app.mjs drive --run-id "$RUN_ID" --scenario reinfolib-info`.
- **Query clicked location.** Right-clicks `#map` at `(720, 500)` and clicks `不動産情報ライブラリの情報を表示`. `.reinfolib-popup` renders `都市計画区域/区域区分`, `市街化区域`, `商業地域`, and integer-formatted `500%`.
- **Confirm print grid & temporary marker side effects.** Verifies `#reinfolib-print-info` has class `reinfolib-print-grid--has-content` and contains `商業地域`, and exactly 1 temporary `.leaflet-marker-icon` is present.
- **Close popup and verify cleanup.** Clicks `.leaflet-popup-close-button`. The temporary marker count returns to `0` and `#reinfolib-print-info` is emptied and loses `reinfolib-print-grid--has-content`.
- **Proof.** Confirm `/tmp/xy-latlng-to-map-verify/evidence/$RUN_ID/reinfolib-info/` contains `before.png`, `after.png`, `aria.txt`, and `result.json` with `passed: true`.

## Gotchas

- If the app was built with `VITE_REINFOLIB_PROXY_URL` unset (e.g., `start --no-reinfolib`), the context menu item still appears, adds a marker, and does nothing for Reinfolib info. This scenario requires the mocked proxy URL configured by default in `verify-app.mjs start`.
- `XKT002` percentages such as `"500.0%"` are intentionally rounded to integer form (`"500%"`) in the UI; assert the formatted value, not the raw GeoJSON string.
- If `#select-marker-icon` is `none`, selecting `不動産情報ライブラリの情報を表示` triggers `window.alert('アイコンの色を選択してください')` and does not fetch.
