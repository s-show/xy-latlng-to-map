import { resolve } from 'path'
import { defineConfig, loadEnv } from "vite";
import fs from 'node:fs';
import path from 'node:path';
import { ViteEjsPlugin } from "vite-plugin-ejs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 環境変数を読み込む
  // envDir を指定しない場合 root ('src/') が基準になるため、
  // リポジトリ直下の .env を読むよう明示している
  const env = loadEnv(mode, __dirname);
  return {
    root: 'src/',
    envDir: __dirname,
    // base: './',
    server: {
      hmr: true,
    },
    resolve: {
      alias: {
        // Vite8 は、パッケージの package.json に "module" と "browser" が定義されていると、`resolve.mainFields` の
        // デフォルト値に基づいて、"browser" フィールドの "dist/Leaflet.GoogleMutant.js" をインポートする。
        // しかし、"Leaflet.GoogleMutant.js" には `export default` がないので `export default class GoogleMutant extends GridLayer` エラーになる。
        // そのため、`resolve.alias` オプションを使って "module" フィールドの "src/Leaflet.GoogleMutant.mjs" を
        // 読み込むようにしている。
        'leaflet.gridlayer.googlemutant': 'leaflet.gridlayer.googlemutant/src/Leaflet.GoogleMutant.mjs',
      },
    },
    build: {
      outDir: '../dist',
      rollupOptions: {
        input: {
          main: resolve(__dirname, './src/index.html'),
          about: resolve(__dirname, './src/about.html'),
          mapSource: resolve(__dirname, './src/mapSource.html'),
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['color-functions', 'global-builtin', 'import']
        },
      }
    },
    plugins: [
      ViteEjsPlugin(
        // vite-plugin-ejs はデータ関数の戻り値を await しないため、
        // async にすると Promise がそのまま EJS に渡って全データが undefined になる。
        // 必ず同期関数にすること。
        () => {
          // 共通データを読み込んでテンプレに渡す
          let siteData = {};
          try {
            const json = fs.readFileSync(path.resolve('src/data/site.json'), 'utf8');
            siteData = JSON.parse(json);
          } catch {
            // エラーを無視して続行
          }

          return {
            site: siteData,
            // キー未設定時に index.html で Google Maps の script タグを出力しないための値
            googleMapsApiKey: env.VITE_GOOGLE_MAPS_API_KEY ?? '',
          };
        },
        {
          ejs: {
            // EJSのオプション
            views: ['src'],  // includeのルートディレクトリ
            async: false,
            rmWhitespace: false
          }
        }
      )
    ]
  };
});
