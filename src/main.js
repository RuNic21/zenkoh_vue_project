// Vueアプリケーションのメインエントリーポイント
// グローバルCSSスタイルをインポートします
import "./assets/main.css";

// Vue 3のcreateApp関数をインポートします
import { createApp } from "vue";
// ルートコンポーネントであるApp.vueをインポートします
import App from "./App.vue";

// Vueアプリケーションを作成し、DOMにマウントします
createApp(App).mount("#app");
