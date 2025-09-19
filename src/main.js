// Vueアプリケーションのメインエントリーポイント
// Material Dashboard CSSをインポートします
import "./assets/css/material-dashboard.css";
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";

// Vue 3のcreateApp関数をインポートします
import { createApp } from "vue";
// ルートコンポーネントであるApp.vueをインポートします
import App from "./App.vue";

// Vueアプリケーションを作成し、DOMにマウントします
createApp(App).mount("#app");
