# テストファイルのTypeScript移行手順

## 概要

現在のJestテストファイル（.js）をTypeScript（.ts）で実行できるように移行します。

## 現在の状況

- テストファイル: `test/*.test.js` (5ファイル)
- テストランナー: Jest 30.2.0
- 実行方法: `node --experimental-vm-modules node_modules/jest/bin/jest.js`
- 形式: ES modules

## 必要な作業

### ステップ1: 依存パッケージのインストール

以下のパッケージをdevDependenciesに追加：

```bash
pnpm add -D @types/jest ts-jest
```

**追加されるパッケージ:**
- `@types/jest`: Jestの型定義
- `ts-jest`: JestでTypeScriptを実行するためのトランスパイラ

### ステップ2: Jest設定ファイルの作成

プロジェクトルートに `jest.config.js` を作成：

```javascript
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: [
    '**/test/**/*.test.ts',
  ],
};
```

**設定の説明:**
- `preset: 'ts-jest/presets/default-esm'`: TypeScript + ES modulesのプリセット
- `extensionsToTreatAsEsm`: `.ts`をES modulesとして扱う
- `moduleNameMapper`: インポートパスの`.js`拡張子を解決
- `transform`: `.ts`ファイルをts-jestで変換
- `testMatch`: `.test.ts`ファイルをテスト対象にする

### ステップ3: package.json の修正

`package.json`の`test`スクリプトを更新：

**変更前:**
```json
"test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
```

**変更後:**
```json
"test": "NODE_OPTIONS='--experimental-vm-modules' jest"
```

### ステップ4: テストファイルの拡張子変更とインポート修正

各テストファイルを`.js`から`.ts`に変更し、必要に応じてインポートを修正：

#### 4-1. DMSLatLngParser.test.js → DMSLatLngParser.test.ts

```bash
mv test/DMSLatLngParser.test.js test/DMSLatLngParser.test.ts
```

**修正内容:**
```typescript
// 変更前
import { extractNumber, dms2deg } from "../js/DMSLatLngParser.js";

// 変更後（.jsを.tsに変更）
import { extractNumber, dms2deg } from "../src/js/DMSLatLngParser.js";
```

#### 4-2. exportCSV.test.js → exportCSV.test.ts

```bash
mv test/exportCSV.test.js test/exportCSV.test.ts
```

#### 4-3. isvalidXY.test.js → isvalidXY.test.ts

```bash
mv test/isvalidXY.test.js test/isvalidXY.test.ts
```

**修正内容:**
```typescript
// 変更前
import { isValidNumber } from "../js/isvalidNumber";

// 変更後
import { isValidNumber } from "../src/js/isvalidNumber.js";
```

#### 4-4. nearlyEqual.test.js → nearlyEqual.test.ts

```bash
mv test/nearlyEqual.test.js test/nearlyEqual.test.ts
```

#### 4-5. zen2han.test.js → zen2han.test.ts

```bash
mv test/zen2han.test.js test/zen2han.test.ts
```

### ステップ5: TypeScript設定の確認

既存の`tsconfig.json`に以下が含まれていることを確認：

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "types": ["jest"]
  },
  "include": [
    "src/**/*",
    "test/**/*"
  ]
}
```

もし`test/**/*`が含まれていない場合は追加します。

### ステップ6: テストの実行確認

```bash
pnpm test
```

すべてのテストが通過することを確認します。

## 移行後の利点

1. **型安全性**: テストコードでもTypeScriptの型チェックが有効
2. **補完機能**: エディタでの自動補完が改善
3. **リファクタリング**: 型情報により安全なリファクタリングが可能
4. **一貫性**: プロジェクト全体がTypeScriptで統一

## トラブルシューティング

### エラー: "Cannot find module"

インポートパスに`.js`拡張子が付いているか確認してください。TypeScriptでもES modulesの`.js`拡張子は必要です。

### エラー: "SyntaxError: Cannot use import statement outside a module"

`jest.config.js`が正しく設定されているか、`package.json`に`"type": "module"`が含まれているか確認してください。

### テストが見つからない

`jest.config.js`の`testMatch`パターンが正しいか確認してください。

## 参考リンク

- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Jest with TypeScript](https://jestjs.io/docs/getting-started#using-typescript)
- [ES Modules Support](https://jestjs.io/docs/ecmascript-modules)
