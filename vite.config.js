import { resolve } from 'path'
import { defineConfig } from "vite";
import fs from 'node:fs/promises';
import path from 'node:path';
import { ViteEjsPlugin, ejs } from "vite-plugin-ejs";

// https://vitejs.dev/config/
export default defineConfig({
  root: 'src/',
  // base: './',
  server: {
    hmr: true,
  },
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, './src/index.html'),
        about: resolve(__dirname, './src/about.html'),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['mixed-decls', 'color-functions', 'global-builtin', 'import']
      },
    }
  },
  plugins: [
    ViteEjsPlugin(
      async (config) => {
        // 共通データを読み込んでテンプレに渡す
        let siteData = {};
        try {
          const json = await fs.readFile(path.resolve('src/data/site.json'), 'utf8');
          siteData = JSON.parse(json);
        } catch { }
        
        return { site: siteData };
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
});
