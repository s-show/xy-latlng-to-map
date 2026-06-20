import { resolve } from 'path'
import { defineConfig } from "vite";
import fs from 'node:fs/promises';
import path from 'node:path';
import { ViteEjsPlugin } from "vite-plugin-ejs";

// https://vitejs.dev/config/
export default defineConfig(() => {
  // 環境変数を読み込む
  return {
    root: 'src/',
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
        async () => {
          // 共通データを読み込んでテンプレに渡す
          let siteData = {};
          try {
            const json = await fs.readFile(path.resolve('src/data/site.json'), 'utf8');
            siteData = JSON.parse(json);
          } catch {
            // エラーを無視して続行
          }

          return {
            site: siteData,
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
