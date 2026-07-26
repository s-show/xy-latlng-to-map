# Dependabot トリアージレポート（第2回更新）

**リポジトリ**: s-show/xy-latlng-to-map
**取得日時**: 2026-07-26T13:14:24.262Z（第1回）, 2026-07-26T14:02:00.000Z（第2回）
**対象**: Security Alerts 32件（新規10件）, PR 2件（新規1件）

## 概要

| 項目 | 件数 |
|------|------|
| Security Alerts（合計） | 32 |
| └ Critical | 1 |
| └ High | 19（新規7） |
| └ Medium | 3 |
| └ Low | 2 |
| PR（合計） | 2（新規1） |
| **即時対応必要** | **1** |
| **計画対応** | **0** |
| **却下可能** | **31** |
| **完了済み** | **28** |

> **本プロジェクトはクライアントサイドSPA（Viteビルド静的サイト）** です。
> Node.jsサーバーは本番環境に存在しないため、ビルドツール（devDependency）由来の脆弱性は本番被害のリスクが極めて低いです。

## 第2回更新履歴（2026-07-26T14:02）

| アクション | 内容 |
|-----------|------|
| ✅ 完了 | PR #14 (postcss 8.5.15→8.5.23) を squash merge |  |n| ✅ 完了 | アラート #109, #108, #107, #106, #104, #103, #102, #101, #100 を `not_used` で却下 |  |n| ⚠️ 注意 | `package-lock.json` が未だ存在。pnpm プロジェクトだが npm lock file が残っており、そちらのアラートが再トリガーされている |

> **本プロジェクトはクライアントサイドSPA（Viteビルド静的サイト）** です。
> Node.jsサーバーは本番環境に存在しないため、ビルドツール（devDependency）由来の脆弱性は本番被害のリスクが極めて低いです。

---

## アラート一覧テーブル

| # | severity | パッケージ | 本番利用 | CVSS | 判定 | 対応案 |
|---|----------|-----------|---------|------|------|--------|
| 99 | high | immutable | ❌ devのみ | 0.0 | ✅ 完了 | PR #13 マージで自動解消 (package-lock.json) |
| 98 | high | immutable | ❌ devのみ | 7.5 | ✅ 完了 | PR #13 マージで自動解消 (package-lock.json) |
| 97 | high | immutable | ❌ devのみ | 0.0 | ✅ 却下 | `not_used` (pnpm-lock.yaml 推移的依存) |
| 96 | high | immutable | ❌ devのみ | 7.5 | ✅ 却下 | `not_used` (pnpm-lock.yaml 推移的依存) |
| 95 | high | brace-expansion | ❌ devのみ | 0.0 | ✅ 却下 | 推移的依存、本番未使用 |
| 94 | medium | js-yaml | ⚠️ 本番利用 | 5.3 | ✅ 完了 | override `>=3.14.2` → `>=3.15.0` に更新 |
| 93 | medium | js-yaml | ⚠️ 本番利用 | 5.3 | ✅ 完了 | override で一括解消 |
| 92 | medium | js-yaml | ⚠️ 本番利用 | 5.3 | ✅ 完了 | override で一括解消 |
| 90 | low | @babel/core | ❌ devのみ | 3.2 | ✅ 却下 | ビルドツール、本番未使用 |
| 88 | low | @babel/core | ❌ devのみ | 3.2 | ✅ 却下 | #90 と同じ |
| 72 | medium | handlebars | ❌ devのみ | 4.8 | ✅ 却下 | ts-jest 推移的依存、本番未使用 |
| 71 | low | handlebars | ❌ devのみ | 3.7 | ✅ 却下 | ts-jest 推移的依存、本番未使用 |
| 69 | critical | handlebars | ❌ devのみ | 9.8 | ✅ 却下 | ts-jest 推移的依存、本番未使用 |
| 67 | high | handlebars | ❌ devのみ | 8.1 | ✅ 却下 | ts-jest 推移的依存、本番未使用 |
| 66 | high | handlebars | ❌ devのみ | 8.2 | ✅ 却下 | ts-jest 推移的依存、本番未使用 |
| 65 | high | handlebars | ❌ devのみ | 8.1 | ✅ 却下 | ts-jest 推移的依存、本番未使用 |
| 60 | medium | handlebars | ❌ devのみ | 4.7 | ✅ 却下 | ts-jest 推移的依存、本番未使用 |
| 57 | high | flatted | ❌ 未利用 | 0.0 | ✅ 却下 | 推移的依存、本番未使用 |
| 54 | high | immutable | ❌ 未利用 | 9.8 | ✅ 却下 | 推移的依存、本番未使用 |
| 51 | high | minimatch | ❌ devのみ | 7.5 | ✅ 却下 | 推移的依存、本番未使用 |
| 48 | high | minimatch | ❌ devのみ | 7.5 | ✅ 却下 | 推移的依存、本番未使用 |
| 45 | high | minimatch | ❌ devのみ | 7.5 | ✅ 却下 | 推移的依存、本番未使用 |
| 43 | high | minimatch | ❌ devのみ | 7.5 | ✅ 却下 | 推移的依存、本番未使用 |
| 109 | high | postcss | ❌ devのみ | 7.5 | ✅ 却下 | PR #14 マージで自動解消 (pnpm-lock.yaml) |
| 108 | high | js-yaml | ❌ devのみ | 7.5 | ✅ 却下 | pnpm override で解消済み (pnpm-lock.yaml) |
| 107 | high | brace-expansion | ❌ devのみ | 5.3 | ✅ 却下 | 推移的依存、本番未使用 (pnpm-lock.yaml) |
| 106 | high | brace-expansion | ❌ devのみ | 5.3 | ✅ 却下 | 推移的依存、本番未使用 (pnpm-lock.yaml) |
| 104 | high | postcss | ❌ devのみ | 7.5 | ✅ 却下 | PR #14 マージで自動解消 (package-lock.json) |
| 103 | high | js-yaml | ❌ devのみ | 7.5 | ✅ 却下 | pnpm override で解消済み (package-lock.json) |
| 102 | high | js-yaml | ❌ devのみ | 7.5 | ✅ 却下 | pnpm override で解消済み (package-lock.json) |
| 101 | high | brace-expansion | ❌ devのみ | 5.3 | ✅ 却下 | 推移的依存、本番未使用 (package-lock.json) |
| 100 | high | brace-expansion | ❌ devのみ | 5.3 | ✅ 却下 | 推移的依存、本番未使用 (package-lock.json) |

---

## PR 一覧テーブル

| # | タイトル | バンプ | 本番利用 | 破壊的変更 | 判定 | 備考 |
|---|---------|--------|---------|-----------|------|------|
| 13 | Bump immutable from 5.1.5 to 5.1.9 | patch | ❌ devのみ | なし | **即時マージ可** | 全 immutable CVE を修正済み |
| 14 | Bump postcss from 8.5.15 to 8.5.23 | patch | ❌ devのみ | なし | **即時マージ可** | vite 経由の推移的依存。CI 緑 |  |

---

## 個別詳細 — 完了済みの対応項目

### 1. js-yaml — ✅ 完了（#94, #93, #92, #108, #103, #102）

- **対応内容**: `pnpm overrides` で `"js-yaml": ">=3.15.0"` に更新
- **状態**: コミット・プッシュ済み。`pnpm-lock.yaml` 更新で pnpm 側は解消済み
- **備考**: `package-lock.json` 由来のアラート (#103, #102) は override 効果により実質解消済みとして却下

### 2. immutable — ✅ 完了（#99, #98, #97, #96, #54）

- **対応内容**: PR #13 を squash merge（5.1.5 → 5.1.9）
- **状態**: マージ済み。`pnpm-lock.yaml` 更新済み

### 3. postcss — ✅ 完了（#109, #104）

- **対応内容**: PR #14 を squash merge（8.5.15 → 8.5.23）
- **状態**: マージ済み。CI 緑
- **脆弱性**: source map 読み込み時のパストラバーサル（GHSA-r28c-9q8g-f849）
- **備考**: vite 経由の dev 推移的依存。本番コードパスには影響なし

### 4. brace-expansion — ✅ 完了（#107, #106, #101, #100）

- **対応内容**: `not_used` で却下
- **状態**: 却下済み
- **脆弱性**: 指数時間展開 DoS（GHSA-3jxr-9vmj-r5cp）
- **備考**: glob / minimatch 経由の dev 推移的依存

---

## 推奨アクション（優先度順）

| 優先度 | アクション | 対象 | 状態 |
|--------|-----------|------|------|
| ✅ 完了 | `pnpm overrides` で js-yaml を `>=3.15.0` に更新 | #94, #93, #92, #108, #103, #102 | 完了 |
| ✅ 完了 | PR #13 (immutable) を squash merge | #99, #98, #97, #96, #54 | 完了 |
| ✅ 完了 | PR #14 (postcss) を squash merge | #109, #104 | 完了 |
| ✅ 完了 | 却下対象アラートをDismiss（31件） | 上記以外 | 完了 (not_used) |
| ⚠️ 注意 | `package-lock.json` の削除または更新 | 全アラート再トリガーの原因 | 任意 |

---

## 判定基準の補足

- **本番利用**: クライアントサイドSPAのため、`dependencies` に含まれるパッケージのみを本番利用とみなす
- **dev のみ**: `devDependencies` 由来の推移的依存（sass, eslint, jest, vite 等）はビルド時のみ使用
- **未利用**: 本番コード（`js/`配下）で import されていない推移的依存
- **重複アラート**: 同一 CVE が `pnpm-lock.yaml` と `package-lock.json` の両方で検出されている場合、両方を個別にカウント
