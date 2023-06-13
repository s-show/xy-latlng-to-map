import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    base: process.env.GITHUB_PAGES  // この行を追加
        ? "interchangeXYandBL"      // この行を追加
        : "./",                     // この行を追加
});
