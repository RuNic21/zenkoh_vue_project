import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  css: {
    // PostCSS設定によるブラウザ互換性の改善
    postcss: './postcss.config.js',
    // CSSソースマップ生成（開発時のデバッグ用）
    devSourcemap: true
  },
  build: {
    // ビルド時のCSS最適化
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // CSSファイル分割によるキャッシュ最適化
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
})
