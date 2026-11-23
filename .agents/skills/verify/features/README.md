# xy-latlng-to-map verification map

This directory is the maintained source for verifying the user-facing behavior of `xy-latlng-to-map`. Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Start an isolated verification instance with `node .agents/skills/verify/scripts/verify-app.mjs start --run-id "$RUN_ID"`.
- Confirm health with `node .agents/skills/verify/scripts/verify-app.mjs doctor --run-id "$RUN_ID"` and require `healthy: true` and `revisionMatch: true`.
- Never drive an existing developer server on port `4173` or `5173`; drive only the isolated instance recorded for `$RUN_ID`.
- Keep all external traffic mocked inside `verify-app.mjs` (`VITE_GOOGLE_MAPS_API_KEY=''`, mocked GSI tiles, mocked GSI address search, mocked Reinfolib proxy). Never contact live tile servers or Google Maps during verification.
- Never run `pnpm manual:screenshots` as a verification step; it overwrites tracked documentation screenshots under `docs/assets/screenshots/`.

## Driving conventions

- Start every recipe from a fresh page load of the isolated instance URL (`http://127.0.0.1:<port>/`).
- Prefer accessible roles, labels, and stable IDs (`#menu-toggle-btn`, `#address-search-input`, `#add-marker-btn`) over pixel positions. Where Leaflet canvas/map right-clicks require coordinates, record the viewport size (`1440x1000`) and target `#map`.
- Wait for Leaflet tile completion (`waitForMapReady`) and concrete DOM state changes instead of fixed sleeps.
- Always run `node .agents/skills/verify/scripts/verify-app.mjs stop --run-id "$RUN_ID"` after verification; it deletes scratch state while keeping `/tmp/xy-latlng-to-map-verify/evidence/$RUN_ID/`.

## Proof and skip reporting

- Capture both baseline (`before.png`) and resulting state (`after.png`), plus `aria.txt` and `result.json`.
- Require `consoleErrors: []`, `pageErrors: []`, and `blockedExternalRequests: []` in `result.json`.
- Verify side effects alongside visuals (CSV download contents, `#reinfolib-print-info` DOM updates, layer counts before and after clearing).
- Record the feature ID and entry point used with every artifact.
- Report any unreachable path with the attempted command and the unmet precondition (for example, GPS photo drag-and-drop when `gps_test*.jpg` fixtures are absent at the repo root). Do not report a skipped entry point as verified through another path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order:

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with verify-app.mjs` starts with `Preconditions:` and uses labeled bullets pairing each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Markers and lines](./markers-and-lines.md) covers bulk coordinate table plotting, marker popups, polyline segments, and clearing all shapes.
- [Coordinate conversion](./coordinate-conversion.md) covers LatLng/XY and geodetic conversion in the conversion tab and CSV download.
- [Map context menu](./map-context-menu.md) covers right-click single marker creation, radius circle dialog, and point-to-point distance measurement.
- [Address search](./address-search.md) covers combobox search, keyboard candidate selection, map recentering, and empty-result status.
- [Reinfolib urban planning info](./reinfolib-info.md) covers querying 6 urban planning/hazard layers at a clicked point, print-grid population, and cleanup on popup close.
- [Icon-Add API](./icon-api.md) covers URL query hydration, `window.xyLatLngToMap` runtime operations, XSS-safe popups, and invalid-query error banners.
