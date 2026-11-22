---
name: verify
description: Drive the real xy-latlng-to-map web application locally with Playwright against an isolated production build and mocked external services to prove UI behavior and capture surviving evidence. Reach for this skill before claiming any UI, map, coordinate, or browser-API change works.
---

# Verify xy-latlng-to-map

Drive the real Vite-built `xy-latlng-to-map` web application in headless Chromium through `.agents/skills/verify/scripts/verify-app.mjs`. Read [`features/README.md`](features/README.md) before driving a feature, then follow the matching feature recipe.

## Surface and isolation

- **Primary surface:** Static browser web UI (`src/index.html`, plus `about.html`, `mapSource.html`, and `manual.html`) bundled by Vite (`pnpm build`) and served by `vite preview`. No backend server, database, or user authentication lives in this repository.
- **Concurrent run isolation:** Every run uses a unique `--run-id <id>`, an isolated build/runtime directory `/tmp/xy-latlng-to-map-verify/<run-id>/` (with its own Vite `--outDir` so the repository's `dist/` is never modified), and an isolated localhost port (`127.0.0.1:<port>`). Multiple agents can verify side by side without colliding.
- **External network isolation:** Per `AGENTS.md`, verification must never contact Google Maps, map tile servers, or external APIs. `verify-app.mjs` builds with `VITE_GOOGLE_MAPS_API_KEY=''` and `VITE_REINFOLIB_PROXY_URL='https://verify-reinfolib.invalid'` by default, fulfills GSI tiles (`cyberjapandata.gsi.go.jp`), GSI address search (`msearch.gsi.go.jp`), and Reinfolib tiles (`verify-reinfolib.invalid`) from deterministic in-process fixtures, and **aborts + fails** on any other external request.
- **Never run `pnpm manual:screenshots` for verification** — it overwrites tracked images under `docs/assets/screenshots/`.

## Launch

Start an isolated production build and preview server:

```bash
RUN_ID="verify-$(date +%s)-$$"
node .agents/skills/verify/scripts/verify-app.mjs start --run-id "$RUN_ID"
```

Options:
- `--port <number>`: bind a specific `127.0.0.1` port (default: automatically picks an available ephemeral port).
- `--no-reinfolib`: build with `VITE_REINFOLIB_PROXY_URL=''` to verify the no-proxy configuration.

**Ready predicate:** `start` exits `0` only after:
1. `vite build --outDir /tmp/xy-latlng-to-map-verify/<run-id>/dist` succeeds.
2. `vite preview --outDir ... --host 127.0.0.1 --port <port> --strictPort` responds HTTP `200` on `/` with HTML containing `<title>...座標の地図表示と座標・緯度経度の変換...</title>` and `id="map"`.
3. Runtime state (PID, port, URL, git revision, evidence path) is written to `/tmp/xy-latlng-to-map-verify/<run-id>/state.json`.

## Doctor

Run the read-only health check before driving or whenever anything looks off:

```bash
node .agents/skills/verify/scripts/verify-app.mjs doctor --run-id "$RUN_ID"
```

Doctor verifies without mutating state:
- `/tmp/xy-latlng-to-map-verify/<run-id>/state.json` exists and its recorded preview PID is alive.
- `http://127.0.0.1:<port>/` returns HTTP `200` and serves the `xy-latlng-to-map` document.
- Current `git rev-parse --short HEAD` matches the revision built when `start` ran (reports `revisionMatch: false` and exits non-zero if the build is stale).
- A Playwright-compatible Chromium executable is discoverable (`PLAYWRIGHT_CHROMIUM_EXECUTABLE`, Playwright bundled Chromium, `/usr/bin/chromium*`, or `/nix/store/*-chromium-*`).

## Drive

Run a mapped feature scenario (see [`features/README.md`](features/README.md) for all scenarios and entry points):

```bash
node .agents/skills/verify/scripts/verify-app.mjs drive --run-id "$RUN_ID" --scenario markers-and-lines
```

Built-in scenarios:
- `markers-and-lines`
- `coordinate-conversion`
- `map-context-menu`
- `address-search`
- `reinfolib-info`

For a new or custom journey not yet in the built-in list, pass a custom ES module via `--custom`:

```bash
node .agents/skills/verify/scripts/verify-app.mjs drive --run-id "$RUN_ID" --custom /tmp/my-check.mjs --scenario my-feature
```

The custom module must export `async function run({ page, url, evidenceDir, helpers })` and return `{ entryPoint, assertions, observations }`. `verify-app.mjs` automatically enforces network isolation, console/page error capture, and artifact persistence around it.

**Selector conventions (real handles in `src/index.html`):**
- Menu popover toggle/close: `#menu-toggle-btn` (`aria-label="メニューを開く"`), `#menu-column` with button `閉じる`.
- Coordinate source form: `#source-is-xy`, `#source-is-latlng`, `#source-is-tokyo`, `#source-is-jgd2000`, `#source-is-jgd2011`, `#source-zone-no`, `#source-data-table td[data-x="<col>"][data-y="<row>"]`.
- Map styling & bulk actions: `#select-marker-icon`, `#select-line-color`, `#add-marker-btn`, `#remove-marker-btn`.
- Conversion tab: `a[href="#data-convert-pane"]`, `#convert-to-xy`, `#convert-to-latlng`, `#convert-to-tokyo`, `#convert-to-jgd2000`, `#convert-to-jgd2011`, `#convert-zone-no`, `#data-convert-btn`, `#converted-data-table`, `#export-csv-btn`.
- Address search combobox: `#address-search-input` (`role="combobox"`), `#address-search-results` (`role="listbox"`), `#address-search-message` (`role="status"`).
- Map & dialogs: `#map`, `#input-diameter`, `#radius`, `#add-circle-to-map`, `#reinfolib-print-info`, `#error-message-wrap` (`role="alert"`).

## Evidence

Proof artifacts are written to:

```text
/tmp/xy-latlng-to-map-verify/evidence/<run-id>/<scenario>/
```

Each drive saves:
- `before.png` — baseline state before the user action.
- `after.png` (plus step screenshots such as `step-*.png`) — visible result after the user action.
- `aria.txt` — accessibility/landmark snapshot of the resulting page state.
- `result.json` — machine-readable proof containing `scenario`, `entryPoint`, `url`, `gitRev`, `assertions`, `observations`, `consoleErrors`, `pageErrors`, `mockedRequests`, and `blockedExternalRequests`.

**Proof standards:**
- Drive real user paths (clicks, typing, keyboard navigation, right-click menus, file downloads), never test-only setters.
- Capture both the action and the resulting state, plus side effects (e.g., downloaded CSV bytes, `#reinfolib-print-info` DOM contents, marker/SVG counts).
- Verify that `consoleErrors`, `pageErrors`, and `blockedExternalRequests` are all empty arrays.
- Mocks are restricted to production external-service boundaries (GSI map tiles, GSI address search, Reinfolib proxy). Never mock app logic or Leaflet rendering.

## Cleanup

Tear down only the server and scratch directory created by your run:

```bash
node .agents/skills/verify/scripts/verify-app.mjs stop --run-id "$RUN_ID"
```

- Sends `SIGTERM` (with `SIGKILL` fallback) strictly to the PID recorded in `/tmp/xy-latlng-to-map-verify/<run-id>/state.json`. Never kills by process name.
- Deletes `/tmp/xy-latlng-to-map-verify/<run-id>/` (scratch `dist/`, logs, `state.json`).
- **Preserves** `/tmp/xy-latlng-to-map-verify/evidence/<run-id>/`. Confirm the evidence files still exist after `stop` completes.
- Always run `stop` even if `drive` fails so preview processes and ports are never stranded.

## Helpers

- Executable harness: `.agents/skills/verify/scripts/verify-app.mjs`
  - `node .agents/skills/verify/scripts/verify-app.mjs start --run-id <id> [--port <port>] [--no-reinfolib]`
  - `node .agents/skills/verify/scripts/verify-app.mjs doctor --run-id <id>`
  - `node .agents/skills/verify/scripts/verify-app.mjs drive --run-id <id> --scenario <name> [--custom <path>]`
  - `node .agents/skills/verify/scripts/verify-app.mjs stop --run-id <id>`
