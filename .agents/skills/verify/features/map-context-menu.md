# Map context menu

Map context menu lets a user right-click directly on the map canvas to drop a single marker with coordinate tooltip, draw a circle of a chosen radius in meters, or measure the geodetic distance between two arbitrary points.

## Sub-features

- `context-add-marker` places a marker at the right-clicked location with an open LatLng tooltip.
- `context-add-circle` opens `#input-diameter`, accepts a radius in meters, and draws a circle, center marker, and `半径: <n>m` tooltip.
- `context-measure-distance` connects start and end right-clicked locations with an arrowed polyline and `距離: <n>m` tooltip.

## How to get to it (user POV)

- Right-click anywhere on `#map` to open the Leaflet context menu.
- Choose `アイコンを追加` to place a single marker in the color selected in `#select-marker-icon`.
- Choose `円を追加`, type a radius in `#radius`, and submit `追加` (`#add-circle-to-map`).
- Choose `この地点からの距離を計測` at point A, then right-click point B and choose `この地点までの距離を計測`.

## Driving it with verify-app.mjs

Preconditions:

- An isolated instance is running and `node .agents/skills/verify/scripts/verify-app.mjs doctor --run-id "$RUN_ID"` returns `healthy: true`.
- `#select-marker-icon` has its default non-`none` color (`red`).

- **Run full scenario.** Execute `node .agents/skills/verify/scripts/verify-app.mjs drive --run-id "$RUN_ID" --scenario map-context-menu`.
- **Add single marker.** Right-clicks `#map` at `(640, 420)` and selects `アイコンを追加`. A `.leaflet-tooltip` opens containing `緯度経度:`.
- **Add 500m circle.** Right-clicks `#map` at `(760, 420)`, selects `円を追加`, fills `#radius` with `500`, and clicks `#add-circle-to-map`. A tooltip reading `半径: 500m` appears with the circle overlay.
- **Measure distance.** Right-clicks `(520, 520)` -> `この地点からの距離を計測`, then right-clicks `(840, 520)` -> `この地点までの距離を計測`. A tooltip matching `距離: <n>m` appears between the two points.
- **Proof.** Confirm `/tmp/xy-latlng-to-map-verify/evidence/$RUN_ID/map-context-menu/` contains `before.png`, `after.png`, `aria.txt`, and `result.json` with `passed: true`.

## Gotchas

- If `#select-marker-icon` is set to `none`, choosing `アイコンを追加` triggers `window.alert('アイコンの色を選択してください')` and adds no marker.
- Right-clicking near the top-left overlay (`#address-search`) or bottom-left zoom controls intercepts the click before Leaflet receives it; target the center area of `#map` (viewport `1440x1000`).
- Measuring distance resets the stored start/end pair once the line is drawn; each new measurement needs both start and end clicks again.
