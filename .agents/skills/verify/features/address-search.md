# Address search

Address search lets a user type a Japanese place name or address into the map overlay search box, pick from matching candidates with mouse or keyboard, recenter the map, and see a clear status message when no address matches.

## Sub-features

- `address-candidates` queries the GSI Address Search endpoint and displays matching options in `#address-search-results`.
- `address-keyboard-select` navigates the listbox with `ArrowDown`/`ArrowUp` and confirms with `Enter` to recenter the map and close the list.
- `address-empty-state` displays `該当する住所が見つかりませんでした` in `#address-search-message` when no results return.

## How to get to it (user POV)

- Focus the `住所検索` search box (`#address-search-input`) at the top-left of the map.
- Type an address and press `Enter` or click `検索`.
- Click a candidate in the dropdown or press `ArrowDown` + `Enter` to move the map to that location.

## Driving it with verify-app.mjs

Preconditions:

- An isolated instance is running and `node .agents/skills/verify/scripts/verify-app.mjs doctor --run-id "$RUN_ID"` returns `healthy: true`.
- `verify-app.mjs` mocks `https://msearch.gsi.go.jp/address-search/AddressSearch` (2 candidates for queries containing `芝公園`, `[]` otherwise).

- **Run full scenario.** Execute `node .agents/skills/verify/scripts/verify-app.mjs drive --run-id "$RUN_ID" --scenario address-search`.
- **Search and inspect candidates.** Fills `#address-search-input` with `芝公園` and presses `Enter`. `#address-search-results` becomes visible with 2 `li[role="option"]` items (`東京都港区芝公園一丁目`, `東京都港区芝公園二丁目`) and saves `step-candidates.png`.
- **Keyboard selection.** Presses `ArrowDown` then `Enter`. The candidate list clears, and `#address-search-input` value updates to `東京都港区芝公園一丁目`.
- **Empty state.** Fills `#address-search-input` with `存在しない住所テスト` and presses `Enter`. `#address-search-message` becomes visible with `該当する住所が見つかりませんでした`.
- **Proof.** Confirm `/tmp/xy-latlng-to-map-verify/evidence/$RUN_ID/address-search/` contains `before.png`, `step-candidates.png`, `after.png`, `aria.txt`, and `result.json` with `passed: true`.

## Gotchas

- When the API returns exactly 1 result, the app moves the map immediately without opening `#address-search-results`. Use a multi-candidate fixture (such as `芝公園`) to test dropdown rendering and keyboard selection.
- Clicking outside `#address-search` dismisses the candidate listbox immediately.
- Never allow verification to hit live `msearch.gsi.go.jp`; `verify-app.mjs` intercepts it locally and fails if any unmocked external host is contacted.
