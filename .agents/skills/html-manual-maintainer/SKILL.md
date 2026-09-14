---
name: html-manual-maintainer
description: Maintain this repository's screenshot-based HTML operation manual. Use when creating, updating, reviewing, or regenerating docs/manual.html and its Playwright-captured screenshots after UI or workflow changes.
---

# HTML Manual Maintainer

Maintain the Japanese HTML operation manual from the current application UI. Treat real output from the latest local production build as the visual source of truth; do not synthesize or retouch application screenshots.

## Project files

- Manual: `docs/manual.html`
- Tracked screenshots: `docs/assets/screenshots/`
- Capture automation: `scripts/capture-manual-screenshots.mjs`
- Capture command: `pnpm manual:screenshots`
- Application source: `src/`
- Production verification: `./scripts/check.sh`

Reuse the capture script instead of duplicating its Playwright workflow in the skill. Extend that script when a requested manual change needs a new state, crop, input fixture, or repeatable interaction.

## Workflow

1. Read the repository `AGENTS.md` and check `git status --short --branch`. Preserve unrelated changes and untracked files.
2. Inspect the relevant application source, the current manual section, and the screenshot references before editing. Confirm the current UI wording and controls rather than inferring them from an older screenshot.
3. Decide whether the request changes only prose or also requires current screenshots. Run `pnpm manual:screenshots` only when the requested change requires regenerating tracked images; the command overwrites them.
4. When adding a capture, implement a deterministic Playwright interaction in `scripts/capture-manual-screenshots.mjs`. Prefer accessible roles, labels, and stable IDs. Wait for the target UI and map tiles to finish rendering before capture.
5. Update `docs/manual.html` with concise Japanese instructions that match the captured state. Keep image links relative, provide accurate `alt` text and captions, and set `width` and `height` to the actual image dimensions.
6. Visually inspect every new or changed screenshot and the affected manual section in a browser. Reject captures with blank tiles, stale dialogs, obscuring overlays, clipped controls, unintended hover panels, or unreadable markers and lines.
7. Run `./scripts/check.sh` after changes. Do not report type checking or Prettier as passing unless separately run. Check `git status --short --branch` again and ensure `dist/` is not staged or committed.

## Current visual conventions

Preserve these established examples unless the user requests different presentation:

- Use `地理院地図 (淡色地図)` for general-purpose captures where map contrast could hide controls, icons, or annotations.
- For the icon-and-line demo, use `地理院地図 (航空写真)`, red icons, and a yellow line.
- For the icon-only demo, use `地理院地図 (航空写真)`, yellow icons, and no line.
- For the GPS-photo demo, show all available photo locations on the pale map and verify that no loading or interaction overlay remains on the marker's surrounding tiles.
- Capture the layer control from `.leaflet-control-layers-toggle` with enough surrounding context to identify its location and appearance.
- Do not add explanatory text suggesting that Google Maps layers appear only when an API key is configured. Never place an API key or secret in the manual, screenshots, source changes, command output, or test fixtures.

User instructions for a specific capture take precedence over these conventions. Keep other unaffected examples unchanged.

## Fixtures and external resources

- GPS capture expects `gps_test1.jpg`, `gps_test2.jpg`, and `gps_test3.jpg` at the repository root. If they are absent, preserve the existing tracked screenshot, report that it was not refreshed, and do not fabricate replacements.
- `docs/assets/screenshots/12-csv-in-excel.png` is a supplied desktop screenshot rather than a browser capture. Preserve it unless the user supplies a replacement or explicitly requests a new one.
- Map screenshots may require network access to map tile services. This manual-only capture is separate from the automated test suite; never make lint or automated tests depend on Google Maps, map tiles, or another external service.
- Build and tests must work without `VITE_GOOGLE_MAPS_API_KEY`. An empty key disables the Google Maps layer.

## Handoff

Report which manual sections and screenshots changed, whether any requested fixture was unavailable, and the result of `./scripts/check.sh`. Do not commit, push, deploy, or regenerate unrelated screenshots unless the user explicitly requests it.
