# Icon-Add API

Icon-Add API lets callers plot markers and optional connecting polylines via URL query parameters on startup or via `window.xyLatLngToMap` (`addMarkers`, `clearMarkers`, `getMarkers`) at runtime, supporting LatLng and Plane Rectangular XY coordinates (`JGD2011`, `JGD2000`, `TOKYO`, zones 1 to 19) with strict validation and XSS-safe popups.

## Sub-features

- `icon-api-url-single` hydrates a single LatLng or XY coordinate from URL query parameters on page load.
- `icon-api-url-multi` hydrates multiple `p=first,second[,memo]` coordinates with optional connecting line and XSS-safe plain-text popups.
- `icon-api-js-runtime` adds, inspects, and clears API-owned markers via `window.xyLatLngToMap` without mutating `#source-data-table`.
- `icon-api-invalid-url` displays plain-text validation errors in `#error-message-wrap` and plots zero markers on invalid parameters.

## How to get to it (user POV)

- Open the app URL with marker query parameters (e.g. `/?lat=35.658&lng=139.741&color=red&memo=東京タワー` or `/?x=-37875.1959&y=-7958.6436&zone=9&geodetic=JGD2011`).
- Call `window.xyLatLngToMap.addMarkers(...)`, `getMarkers()`, and `clearMarkers()` from browser scripts, DevTools, or Playwright.

## Driving it with verify-app.mjs

Preconditions:

- An isolated instance is running and `node .agents/skills/verify/scripts/verify-app.mjs doctor --run-id "$RUN_ID"` returns `healthy: true`.

- **Run full scenario.** Execute `node .agents/skills/verify/scripts/verify-app.mjs drive --run-id "$RUN_ID" --scenario icon-api`.
- **Verify URL XY hydration.** Loads `/?x=-37875.1959&y=-7958.6436&zone=9&geodetic=JGD2011&color=blue&memo=-1F%20%E5%85%A5%E5%8F%A3`. Exactly 1 `.leaflet-marker-icon` appears and clicking it displays `-1F 入口` without CSV apostrophe prefixing.
- **Verify runtime JS API.** Calls `window.xyLatLngToMap.addMarkers(...)`, `getMarkers()`, and `clearMarkers()`. Marker count transitions `1 -> 3 -> 0`.
- **Verify invalid URL error banner.** Loads `/?x=-37900&y=-8300` (missing `zone`). `#error-message-wrap` becomes visible containing `zone`, and `.leaflet-marker-icon` count is `0`.
- **Proof.** Confirm `/tmp/xy-latlng-to-map-verify/evidence/$RUN_ID/icon-api/` contains `before.png`, `after.png`, `after-invalid-url.png`, `aria.txt`, and `result.json` with `passed: true`.

## Gotchas

- In Japan Plane Rectangular Coordinates (`type=XY` or `x`/`y`), `x` (`first`) is North-South (northing) and `y` (`second`) is East-West (easting).
- `0` is a valid coordinate (origin/equator), while `NaN`, `Infinity`, and out-of-range projected coordinates are rejected.
- `clearMarkers()` removes only API/URL-added markers and lines and resets matching `measurementState.markers` endpoints; UI `#remove-marker-btn` also clears the API registry.
